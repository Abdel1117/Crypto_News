FROM python:3.11-alpine

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade -r requirements.txt

COPY . .

EXPOSE 4000

CMD ["uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "4000"]