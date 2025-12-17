FROM python:3.14-slim-trixie

RUN apt-get update && apt-get install -y pkg-config default-libmysqlclient-dev gcc

WORKDIR /app
COPY requirements.txt /app
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY . /app

EXPOSE 8000
CMD ["gunicorn", "booking_system.wsgi:application", "--bind", "0.0.0.0:8000"]
