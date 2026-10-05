# 🎉 LavernaEvents

> A Modern Event Management Platform built with **React + Django REST Framework**.

---

# 📖 About

**LavernaEvents** is a modern web-based Event Management Platform that allows organizers to create, manage, and monitor different types of events from one centralized platform.

Supported event types include:

- Wedding
- Reception
- Engagement
- Birthday
- Anniversary
- Housewarming
- Corporate Events
- Conferences
- Religious Events
- Family Functions
- Private Events
- Custom Events

The platform provides digital invitations, guest management, WhatsApp invitation sharing, QR code gallery, photographer portal, AI-powered face recognition, and analytics.

---

# 🚀 Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- React Hook Form
- Zod
- Axios
- TanStack Query
- Framer Motion
- Recharts

---

## Backend

- Python
- Django
- Django REST Framework
- PostgreSQL
- JWT Authentication
- Pillow
- ReportLab
- qrcode
- django-filter
- django-cors-headers
- python-decouple

---

# 📁 Project Structure

```text
lavernaevents/

├── backend/
│
├── frontend/
│
├── docs/
│
├── README.md
│
└── .gitignore
```

---

# 👥 Development Team

## Backend Developer

Operating System

Ubuntu Linux

Responsibilities

- Django
- REST APIs
- PostgreSQL
- Authentication
- Business Logic
- QR Generation
- AI Integration
- WhatsApp Integration

Works inside

```
backend/
```

---

## Frontend Developer

Operating System

Windows

Terminal

PowerShell

Responsibilities

- React
- TypeScript
- Tailwind CSS
- UI Development
- API Integration
- Dashboard
- Responsive Design

Works inside

```
frontend/
```

---

# 🌿 Git Branch Strategy

```
main
```

Stable Production Branch

```
backend-dev
```

Backend Development

```
frontend-dev
```

Frontend Development

Never develop directly on **main**.

---

# ⚙️ First Time Setup

Clone repository

```bash
git clone https://github.com/mohamedswafvanp/lavernaevents.git
```

Go into project

```bash
cd lavernaevents
```

---

# 🐍 Backend Setup (Linux)

Go to backend

```bash
cd backend
```

Create virtual environment

```bash
python3 -m venv venv
```

Activate

```bash
source venv/bin/activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

Run migrations

```bash
python manage.py migrate
```

Create superuser (first time only)

```bash
python manage.py createsuperuser
```

Run backend

```bash
python manage.py runserver
```

Backend URL

```
http://127.0.0.1:8000
```

Admin

```
http://127.0.0.1:8000/admin/
```

---

# ⚛️ Frontend Setup (Windows / Linux)

Go to frontend

```bash
cd frontend
```

Install packages

```bash
npm install
```

Run frontend

```bash
npm run dev
```

Frontend URL

```
http://localhost:5173
```

---

# 🗄️ Database

Database

```
PostgreSQL
```

Database Name

```
lavernaevents_db
```

Database User

```
lavernaevents_user
```

Database Host

```
localhost
```

Database Port

```
5432
```

> The password and other secrets should be stored in your local `backend/.env` file. Do **not** commit `.env` to Git.

---

# 🔑 Environment Variables

Create

```
backend/.env
```

Example

```env
SECRET_KEY=your_secret_key

DEBUG=True

ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=lavernaevents_db

DB_USER=lavernaevents_user

DB_PASSWORD=your_database_password

DB_HOST=localhost

DB_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

---

# 📂 Documentation

Complete project documentation is available in

```
docs/
```

Files

```
00_PROJECT_SETUP_AND_TEAM_GUIDE.md

01_BACKEND_SETUP_GUIDE.md

02_FRONTEND_SETUP_GUIDE.md

03_GITHUB_WORKFLOW.md

04_PROJECT_CONFIGURATION.md

05_DEVELOPMENT_RULES.md

06_PROJECT_FEATURES_AND_MODULES.md

07_DATABASE_DESIGN.md

08_API_DOCUMENTATION.md

09_UI_SCREEN_FLOW.md

10_FIRST_TIME_SETUP.md
```

---

# 📌 Development Workflow

Backend Developer

```bash
git checkout backend-dev

git pull origin backend-dev
```

Frontend Developer

```powershell
git checkout frontend-dev

git pull origin frontend-dev
```

After development

```bash
git add .

git commit -m "Meaningful Commit Message"

git push
```

Create a Pull Request before merging into `main`.

---

# 📦 Common Commands

## Backend

Run server

```bash
python manage.py runserver
```

Create migrations

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

Install package

```bash
pip install package_name

pip freeze > requirements.txt
```

---

## Frontend

Install packages

```bash
npm install
```

Run development server

```bash
npm run dev
```

Build

```bash
npm run build
```

Preview build

```bash
npm run preview
```

---

## Git

Status

```bash
git status
```

Branches

```bash
git branch
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

Commit

```bash
git commit -m "Message"
```

---

# 📜 Development Rules

- Never work directly in `main`
- Always pull before starting work
- Use meaningful commit messages
- Keep documentation updated
- Do not commit `.env`, `venv`, or `node_modules`
- Backend developer modifies only `backend/`
- Frontend developer modifies only `frontend/`
- Both developers may update `docs/`

---

# 🎯 Project Goal

Build a scalable, secure, and production-ready Event Management Platform that provides:

- Membership Plans
- Event Management
- Guest Management
- Digital Invitations
- WhatsApp Invitation Sharing
- Guest Response Tracking
- QR Code Gallery
- Photographer Portal
- AI Face Recognition
- Analytics Dashboard
- Admin Management

The architecture should support future expansion, including mobile applications, additional integrations, and enterprise-scale deployment.

---

# 📄 License

This project is developed by the **LavernaEvents Development Team**.

All rights reserved.

---

# ❤️ Happy Coding

Keep the code clean, modular, secure, and well documented.