FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir mlflow psycopg2-binary

EXPOSE 5000

CMD ["mlflow", "server", "--backend-store-uri", "postgresql://postgres:postgres@postgres:5432/fullbazar", "--default-artifact-root", "/mlflow/artifacts", "--host", "0.0.0.0", "--port", "5000"]
