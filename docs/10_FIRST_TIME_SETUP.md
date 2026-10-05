# LavernaEvents

# First Time Setup

This guide is for any developer joining the project.

---

## Step 1

Clone Repository

```bash
git clone https://github.com/mohamedswafvanp/lavernaevents.git
```

---

## Step 2

Go into the project

```bash
cd lavernaevents
```

---

## Step 3

Create Backend Virtual Environment

Linux

```bash
cd backend

python3 -m venv venv

source venv/bin/activate
```

Windows

```powershell
cd backend

python -m venv venv

.\venv\Scripts\Activate
```

---

## Step 4

Install Python Packages

```bash
pip install -r requirements.txt
```

---

## Step 5

Go to frontend

```bash
cd ../frontend
```

Install Node Packages

```bash
npm install
```

---

## Step 6

Return to backend

```bash
cd ../backend
```

Run migrations

```bash
python manage.py migrate
```

---

## Step 7

Run Backend

```bash
python manage.py runserver
```

---

## Step 8

Open another terminal

Go to frontend

```bash
cd frontend
```

Run frontend

```bash
npm run dev
```

---

## Development URLs

Frontend

http://localhost:5173

Backend

http://127.0.0.1:8000

Admin

http://127.0.0.1:8000/admin/

---

Project is ready for development.