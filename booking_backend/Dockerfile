FROM ghcr.io/astral-sh/uv:python3.13-trixie

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app
COPY . /app
COPY requirements.txt /app
RUN pip install --no-cache-dir -r /app/requirements.txt

EXPOSE 8000
CMD ["gunicorn", "booking_system.wsgi:application", "--bind", "0.0.0.0:8000"]
