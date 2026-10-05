# LavernaEvents

# Backend Setup Guide

Version : 1.0

Repository

https://github.com/mohamedswafvanp/lavernaevents

---

# Backend Developer Information

Operating System

Ubuntu Linux

Editor

Visual Studio Code

Terminal

Ubuntu Terminal

Technology Stack

- Python
- Django
- Django REST Framework
- PostgreSQL
- JWT Authentication
- Pillow
- qrcode
- ReportLab
- Python Decouple
- django-filter
- django-cors-headers

---

# Project Path

Project Root

/home/shamil/Documents/LavernaEvents_Project/lavernaevents

Backend Folder

/home/shamil/Documents/LavernaEvents_Project/lavernaevents/backend

---

# Clone Repository

Go to Documents

```bash
cd ~/Documents/LavernaEvents_Project
```

Clone Repository

```bash
git clone https://github.com/mohamedswafvanp/lavernaevents.git
```

Go to project

```bash
cd lavernaevents
```

Open VS Code

```bash
code .
```

---

# Switch to Backend Branch

Check branches

```bash
git branch -a
```

Switch branch

```bash
git checkout backend-dev
```

Pull latest code

```bash
git pull origin backend-dev
```

---

# Backend Folder

Go to backend

```bash
cd backend
```

---

# Python Virtual Environment

Create Virtual Environment

```bash
python3 -m venv .venv
```

Activate

```bash
source .venv/bin/activate
```

Deactivate

```bash
deactivate
```

Whenever you start working

Always activate

```bash
source .venv/bin/activate
```

---

# Install Requirements

If requirements.txt exists

```bash
pip install -r requirements.txt
```

If not

Install manually

```bash
pip install django
pip install djangorestframework
pip install psycopg2-binary
pip install djangorestframework-simplejwt
pip install python-decouple
pip install django-cors-headers
pip install pillow
pip install qrcode
pip install reportlab
pip install django-filter
```

Save packages

```bash
pip freeze > requirements.txt
```

---

# PostgreSQL Setup

Start PostgreSQL

```bash
sudo systemctl start postgresql
```

Enable PostgreSQL

```bash
sudo systemctl enable postgresql
```

Open PostgreSQL

```bash
sudo -u postgres psql
```

Database

```sql
CREATE DATABASE lavernaevents_db;
```

Database User

```sql
CREATE USER lavernaevents_user WITH PASSWORD 'lavernaevents123';
```

Grant Permission

```sql
GRANT ALL PRIVILEGES ON DATABASE lavernaevents_db TO lavernaevents_user;
```

Exit

```sql
\q
```

---

# Database Information

Database Name

```
lavernaevents_db
```

Database User

```
lavernaevents_user
```

Database Password

```
lavernaevents123
```

Database Host

```
localhost
```

Database Port

```
5432
```

---

# Environment File

Create file

backend/.env

```bash
touch .env
```

Contents

```env
SECRET_KEY=Replace_With_Your_Django_Secret_Key

DEBUG=True

ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=lavernaevents_db

DB_USER=lavernaevents_user

DB_PASSWORD=lavernaevents123

DB_HOST=localhost

DB_PORT=5432
```

Never commit

```
.env
```

---

# Django Project

Run server

```bash
python manage.py runserver
```

Run migrations

```bash
python manage.py makemigrations
```

Apply migrations

```bash
python manage.py migrate
```

Create superuser

```bash
python manage.py createsuperuser
```

---

# Super Admin

Username

```
lavernaevents
```

Email

```
lavernaevents@gmail.com
```

Password

```
lavernaevents123
```

Admin URL

```
http://127.0.0.1:8000/admin/
```

---

# Django Apps

Current Apps

```
users

memberships

events

guests

invitations

gallery

photographers

dashboard

qr_codes
```

New app

```bash
python manage.py startapp app_name
```

---

# Project Structure

backend/

```
backend/

│

├── .venv/

├── config/

│

├── users/

├── memberships/

├── events/

├── guests/

├── invitations/

├── gallery/

├── qr_codes/

├── photographers/

├── dashboard/

│

├── media/

├── static/

├── requirements.txt

├── manage.py

└── .env
```

---

# Backend Responsibilities

Backend Developer is responsible for

Authentication

Database

Models

Business Logic

REST APIs

Permissions

JWT Authentication

QR Generation

Invitation Generation

WhatsApp Integration

AI Integration

Gallery Upload

Analytics

Notifications

Deployment

---

# Before Starting Development

Activate venv

```bash
source .venv/bin/activate
```

Switch branch

```bash
git checkout backend-dev
```

Pull latest changes

```bash
git pull origin backend-dev
```

Run server

```bash
python manage.py runserver
```

Now start development.

---

# After Completing Work

Check changes

```bash
git status
```

Stage files

```bash
git add .
```

Commit

Example

```bash
git commit -m "Create guest management API"
```

Push

```bash
git push origin backend-dev
```

---

# After Pull Request Merge

Switch main

```bash
git checkout main
```

Pull latest

```bash
git pull origin main
```

Return

```bash
git checkout backend-dev
```

Merge latest

```bash
git merge main
```

Push

```bash
git push origin backend-dev
```

---

# Frequently Used Commands

Run server

```bash
python manage.py runserver
```

Create app

```bash
python manage.py startapp app_name
```

Migration

```bash
python manage.py makemigrations
```

Apply migration

```bash
python manage.py migrate
```

Create superuser

```bash
python manage.py createsuperuser
```

Collect static

```bash
python manage.py collectstatic
```

Shell

```bash
python manage.py shell
```

---

# Git Commands

Current Branch

```bash
git branch
```

Status

```bash
git status
```

Pull

```bash
git pull
```

Push

```bash
git push
```

Fetch

```bash
git fetch
```

Stage

```bash
git add .
```

Commit

```bash
git commit -m "Commit Message"
```

---

# Backend Development Rules

Always activate the virtual environment before working.

Never commit

- .env
- .venv
- media
- __pycache__
- *.pyc

Never modify

frontend/

Always update

requirements.txt

after installing new Python packages.

Always document

- New APIs
- Model changes
- Authentication changes

inside

docs/

---

# Backend Development Goal

Develop a clean, scalable, secure REST API using Django REST Framework.

Follow modular architecture.

Write reusable code.

Document every API.

Keep business logic inside services or application modules.

Maintain production-ready coding standards throughout the project.


# Running the Complete Project (Backend Developer)

The backend developer must run both the Django backend and the React frontend during development.

---

## Terminal 1 - Backend Server

Go to project

```bash
cd ~/Documents/LavernaEvents_Project/lavernaevents/backend
```

Activate Virtual Environment

```bash
source venv/bin/activate
```

Run Django

```bash
python manage.py runserver
```

Backend URL

```
http://127.0.0.1:8000
```

Admin Panel

```
http://127.0.0.1:8000/admin/
```

---

## Terminal 2 - Frontend Server

Open another terminal.

Go to frontend

```bash
cd ~/Documents/LavernaEvents_Project/lavernaevents/frontend
```

Install packages (only if package.json changes)

```bash
npm install
```

Run React

```bash
npm run dev
```

Frontend URL

```
http://localhost:5173
```

---

## Daily Startup Commands

Backend Terminal

```bash
cd ~/Documents/LavernaEvents_Project/lavernaevents/backend

source venv/bin/activate

python manage.py runserver
```

Frontend Terminal

```bash
cd ~/Documents/LavernaEvents_Project/lavernaevents/frontend

npm run dev
```

---

## Before Ending Work

```bash
git status

git add .

git commit -m "Meaningful Commit Message"

git push origin backend-dev
```


# Creating Python Virtual Environment (Linux)

This step is required only once after cloning the repository.

Go to backend

```bash
cd ~/Documents/LavernaEvents_Project/lavernaevents/backend
```

Create virtual environment

```bash
python3 -m venv venv
```

Activate

```bash
source venv/bin/activate
```

Upgrade pip

```bash
pip install --upgrade pip
```

Install dependencies

```bash
pip install -r requirements.txt
```

Run migrations

```bash
python manage.py migrate
```

Run server

```bash
python manage.py runserver
```

Deactivate

```bash
deactivate
```