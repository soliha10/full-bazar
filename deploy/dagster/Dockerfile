# Dagster (webserver + daemon) va MLflow serveri uchun bitta image.
# Kod image ga ko'chirilmaydi — repo /repo ga mount qilinadi (docker-compose.yml),
# shuning uchun deploy da faqat konteynerlarni qayta ishga tushirish yetadi.
FROM python:3.11-slim

# scikit-learn/numpy — API (python/fastapi_app/requirements.txt) bilan AYNAN
# bir xil versiya: bu yerda o'qitilgan pickle model API da ochilishi kerak.
# SQLAlchemy 2.1 da postgresql:// standart drayveri psycopg (v3) ga o'tgan va
# MLflow 2.17 ishlatadigan FallbackAsyncAdaptedQueuePool olib tashlangan.
RUN pip install --no-cache-dir \
      dagster==1.13.5 dagster-webserver==1.13.5 dagster-postgres==0.29.5 \
      psycopg2-binary==2.9.9 \
      requests==2.32.3 beautifulsoup4==4.12.3 lxml==5.2.2 "curl_cffi>=0.7,<0.8" \
      mlflow==2.17.2 scikit-learn==1.5.2 numpy==1.26.4 pandas==2.2.3 \
      "sqlalchemy>=2.0,<2.1"

ENV DAGSTER_HOME=/opt/dagster/home
COPY dagster.yaml /opt/dagster/home/dagster.yaml
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
