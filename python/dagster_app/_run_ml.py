"""
Subprocess entry-point for ML training.
Run as: python _run_ml.py <data_dir> <mlflow_uri> <ml_tasks_dir>

Runs in a separate process so heavy ML imports (sklearn, pandas, mlflow)
don't bloat the dagster-daemon memory space.
"""
import sys
import os

def main():
    if len(sys.argv) < 4:
        print("Usage: _run_ml.py <data_dir> <mlflow_uri> <ml_tasks_dir>")
        sys.exit(1)

    data_dir, mlflow_uri, ml_tasks_dir = sys.argv[1], sys.argv[2], sys.argv[3]
    sys.path.insert(0, ml_tasks_dir)

    if not os.path.isdir(ml_tasks_dir):
        print(f"[ml] ml_tasks_dir not found: {ml_tasks_dir}", flush=True)
        sys.exit(0)

    import importlib.util

    # ── Step 1: data engineering ──────────────────────────────────────────
    de_path = os.path.join(ml_tasks_dir, "data_engineering.py")
    if not os.path.exists(de_path):
        print(f"[ml] data_engineering.py not found at {de_path}", flush=True)
        sys.exit(0)

    spec = importlib.util.spec_from_file_location("data_engineering", de_path)
    de_mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(de_mod)
    de_mod.build_data_pipeline(data_dir=data_dir)
    print("[ml] data engineering done", flush=True)

    # ── Step 2: train matcher ─────────────────────────────────────────────
    tm_path = os.path.join(ml_tasks_dir, "train_matcher.py")
    if not os.path.exists(tm_path):
        print(f"[ml] train_matcher.py not found at {tm_path}", flush=True)
        sys.exit(0)

    import mlflow as _mlflow

    # Verify MLflow is reachable before committing to it; fall back to local
    # file tracking so a downed MLflow container never aborts training.
    def _mlflow_reachable(uri: str) -> bool:
        try:
            import urllib.request
            urllib.request.urlopen(f"{uri.rstrip('/')}/health", timeout=5)
            return True
        except Exception:
            return False

    if _mlflow_reachable(mlflow_uri):
        _mlflow.set_tracking_uri(mlflow_uri)
        print(f"[ml] mlflow tracking: {mlflow_uri}", flush=True)
    else:
        fallback = f"file://{data_dir}/mlruns"
        _mlflow.set_tracking_uri(fallback)
        print(f"[ml] mlflow unreachable — falling back to {fallback}", flush=True)

    spec2 = importlib.util.spec_from_file_location("train_matcher", tm_path)
    tm_mod = importlib.util.module_from_spec(spec2)
    spec2.loader.exec_module(tm_mod)
    tm_mod.train(data_dir=data_dir)
    print("[ml] training complete", flush=True)


if __name__ == "__main__":
    main()
