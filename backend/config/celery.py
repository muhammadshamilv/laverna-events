import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("lavernaevents")

app.config_from_object("django.conf:settings", namespace="CELERY")

app.autodiscover_tasks()

app.conf.beat_schedule = {
    "send-due-reminders-every-10-minutes": {
        "task": "invitations.send_due_reminders",
        "schedule": crontab(minute="*/10"),
    },
}