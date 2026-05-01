FROM python:3.12-slim

WORKDIR /app

ENV DAGSTER_HOME=/opt/dagster/home

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY dagster.yaml /app/dagster_config.yaml
COPY workspace.yaml definitions.py ./
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
