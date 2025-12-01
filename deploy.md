# Deployment notes

This project can be deployed to Heroku, AWS (Elastic Beanstalk), or GCP (App Engine / Cloud Run).

General steps:
- Prepare `requirements.txt` and create `Procfile` for Heroku
- Use environment variables for database connection (DATABASE_URL) and secret key
- Ensure the database available (MySQL)

Local development with Docker Compose:

```
docker compose up --build
```

This launches a MySQL instance and a Django container bound to port 8000.

Heroku (with ClearDB MySQL):
- Provision ClearDB MySQL addon, set DATABASE_URL
- Set environment variables
- Collectstatic and run migrations

AWS Elastic Beanstalk:
- Use `eb` CLI to create application
- Configure RDS MySQL for database
- Set environment variables

GCP Cloud Run:
- Use Cloud SQL for MySQL, set connection and variables
- Build a container using Dockerfile and push to container registry, then deploy to Cloud Run

Note: For email, configure SMTP provider or use SendGrid/Postmark etc.
