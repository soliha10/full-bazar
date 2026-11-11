"""Bazarcom narx quvuri — Dagster.

Kuniga 2 marta (05:00 va 17:00 Toshkent):

    repodagi CSV lar ─┬─ yigish_texnomart ─┐
                      ├─ yigish_glotr     ─┼─ bazaga_yozish ── matcher_oqitish
                      └─ ...               ┘

Har bir op CLI dagi skriptni (python/run_scrapers.py, sync_csv.py,
ml_tasks/*) alohida jarayonda ishga tushiradi — qo'lda ishga tushirilgandagi
bilan aynan bir xil kod, Dagster faqat jadval, qayta urinish va panelni
beradi. Matcher natijalari MLflow ga yoziladi, eng yaxshi model esa
/data/models/best_matcher.pkl ga — API uni o'zgarganini ko'rib qayta yuklaydi.

asaxiy, olcha, ozon bu yerda yo'q: ular server IP siga 403 beradi va
kompyuterda yig'iladi (deploy/mac-scrape.sh), CSV lari repo orqali keladi.
"""
# `from __future__ import annotations` YO'Q: Dagster `context` tipini
# runtime da tekshiradi, satr ko'rinishidagi annotatsiyani rad etadi
import os
import re
import shutil
import subprocess
import sys
import time

from dagster import (
    DefaultScheduleStatus,
    Definitions,
    Failure,
    In,
    Nothing,
    OpExecutionContext,
    Out,
    Output,
    ScheduleDefinition,
    job,
    multiprocess_executor,
    op,
)

REPO = "/repo"
DATA = os.environ.get("DATA_DIR", "/data")
PY = sys.executable

sys.path.insert(0, os.path.join(REPO, "python"))
from scrapers import ALL_SCRAPERS  # noqa: E402

# LOCAL_SCRAPERS dan server IP sidan ochiladigani (2026-11-09 da tekshirilgan)
SERVER_LOCAL = ("chakana",)


def _run(context: OpExecutionContext, args: list[str], cwd: str = REPO,
         timeout: int = 1800) -> str:
    context.log.info("$ " + " ".join(args))
    proc = subprocess.run(args, cwd=cwd, capture_output=True, text=True, timeout=timeout)
    out = proc.stdout + proc.stderr
    # Panelda o'qilsin deb oxirgi qismi; to'liq chiqish stdout/stderr loglarida
    print(out, flush=True)
    context.log.info(out[-4000:] or "(chiqish yo'q)")
    if proc.returncode != 0:
        raise Failure(f"{args[1]} {proc.returncode} kodi bilan tugadi")
    return out


def _newer(src: str, dst: str) -> bool:
    return not os.path.exists(dst) or os.path.getmtime(src) > os.path.getmtime(dst)


@op(out=Out(Nothing))
def repodagi_csvlar(context: OpExecutionContext) -> None:
    """Kompyuterda yig'ilib commit qilingan CSV larni /data ga oladi
    (deploy/scrape.sh dagi bilan bir xil qoida: .meta dagi sana yangiroq bo'lsa)."""
    src_dir = os.path.join(REPO, "data")
    os.makedirs(DATA, exist_ok=True)
    for name in sorted(os.listdir(src_dir)):
        if not name.endswith(".meta"):
            continue
        store = name[:-5]
        csv = os.path.join(src_dir, f"{store}.csv")
        dst_meta = os.path.join(DATA, name)
        if not os.path.exists(csv):
            continue
        with open(os.path.join(src_dir, name)) as f:
            repo_date = f.read().strip()
        server_date = ""
        if os.path.exists(dst_meta):
            with open(dst_meta) as f:
                server_date = f.read().strip()
        if repo_date > server_date:
            shutil.copy2(csv, DATA)
            shutil.copy2(os.path.join(src_dir, name), DATA)
            context.log.info(f"{store} repodan olindi ({repo_date})")
    for name in ("gsmarena_specs.csv", "synthetic_matching_data.csv"):
        src = os.path.join(src_dir, name)
        if os.path.exists(src) and _newer(src, os.path.join(DATA, name)):
            shutil.copy2(src, DATA)


def _scrape_op(store: str, local: bool):
    @op(name=f"yigish_{store}", ins={"start": In(Nothing)}, out=Out(int))
    def _op(context: OpExecutionContext):
        args = [PY, "python/run_scrapers.py", "--only", store,
                "--output", DATA, "--delay", "1.5" if local else "0.5"]
        if local:
            args.insert(2, "--local")
        count = 0
        for attempt in (1, 2):
            # 0 mahsulot bo'lsa run_scrapers 1 qaytaradi — bu yerda xato emas:
            # eski CSV qoladi, qolgan do'konlar baribir bazaga yozilishi kerak
            try:
                out = _run(context, args)
            except Failure:
                out = ""
            m = re.search(rf"^{re.escape(store)}: (\d+) \(", out, re.M)
            count = int(m.group(1)) if m else 0
            if count:
                break
            if attempt == 1:
                # texnomart kabi do'konlar ba'zan bir lahza ulanishni rad etadi
                context.log.warning(f"{store}: 0 ta mahsulot — 60 s dan keyin qayta urinish")
                time.sleep(60)
        if not count:
            context.log.error(f"{store}: 0 ta mahsulot — eski narxlar saqlab qolindi")
        yield Output(count, metadata={"mahsulotlar": count})
    return _op


SCRAPE_OPS = [_scrape_op(c.store_name, local=False) for c in ALL_SCRAPERS] + [
    _scrape_op(s, local=True) for s in SERVER_LOCAL
]


@op(ins={"after": In(Nothing)}, out=Out(Nothing))
def bazaga_yozish(context: OpExecutionContext) -> None:
    _run(context, [PY, "python/sync_csv.py"])


@op(ins={"after": In(Nothing)}, out=Out(Nothing))
def matcher_oqitish(context: OpExecutionContext) -> None:
    """Juft nomlar to'plamini yangi CSV lardan quradi va 3 modelni o'qitadi;
    har biri MLflow ga, eng yaxshisi /data/models/best_matcher.pkl ga."""
    code = (
        "import data_engineering as d, train_matcher as t; "
        f"d.build_data_pipeline(data_dir={DATA!r}); t.train(data_dir={DATA!r})"
    )
    _run(context, [PY, "-c", code], cwd=os.path.join(REPO, "python", "ml_tasks"),
         timeout=3600)


@op(out=Out(Nothing))
def xususiyatlarni_yozish(context: OpExecutionContext) -> None:
    _run(context, [PY, "python/sync_specs.py"])


@job(executor_def=multiprocess_executor.configured({"max_concurrent": 4}))
def narxlar():
    start = repodagi_csvlar()
    counts = [scrape(start=start) for scrape in SCRAPE_OPS]
    matcher_oqitish(after=bazaga_yozish(after=counts))


@job
def faqat_matcher():
    matcher_oqitish()


@job
def xususiyatlar():
    xususiyatlarni_yozish()


defs = Definitions(
    jobs=[narxlar, faqat_matcher, xususiyatlar],
    schedules=[
        ScheduleDefinition(job=narxlar, cron_schedule="0 5,17 * * *",
                           execution_timezone="Asia/Tashkent",
                           default_status=DefaultScheduleStatus.RUNNING),
        ScheduleDefinition(job=xususiyatlar, cron_schedule="0 8 * * 0",
                           execution_timezone="Asia/Tashkent",
                           default_status=DefaultScheduleStatus.RUNNING),
    ],
)
