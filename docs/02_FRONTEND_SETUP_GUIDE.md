# LavernaEvents

# Frontend Setup Guide

Version : 1.0

Repository

https://github.com/mohamedswafvanp/lavernaevents

---

# Frontend Developer Information

Operating System

Windows 10 / Windows 11

Terminal

PowerShell

Editor

Visual Studio Code

Technology Stack

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

# System Requirements

Install

✔ Git

✔ Node.js LTS

✔ Visual Studio Code

✔ PowerShell

Check Node Version

```powershell
node -v
```

Check NPM Version

```powershell
npm -v
```

Check Git

```powershell
git --version
```

---

# Clone Repository

Open PowerShell

Go to Documents

```powershell
cd Documents
```

Create Project Folder

```powershell
mkdir LavernaEvents_Project
```

Go Inside

```powershell
cd LavernaEvents_Project
```

Clone Repository

```powershell
git clone https://github.com/mohamedswafvanp/lavernaevents.git
```

Go Inside

```powershell
cd lavernaevents
```

Open VS Code

```powershell
code .
```

---

# Switch to Frontend Branch

Check Branches

```powershell
git branch -a
```

Switch

```powershell
git checkout frontend-dev
```

Pull Latest Code

```powershell
git pull origin frontend-dev
```

---

# Frontend Folder

Move into frontend folder

```powershell
cd frontend
```

---

# Install Packages

If package.json already exists

```powershell
npm install
```

This installs all project dependencies.

---

# Create React Project

Only run if frontend project does NOT exist.

```powershell
npm create vite@latest . -- --template react-ts
```

Install Packages

```powershell
npm install
```

---

# Required Packages

Install React Router

```powershell
npm install react-router-dom
```

Install Axios

```powershell
npm install axios
```

Install React Query

```powershell
npm install @tanstack/react-query
```

Install Forms

```powershell
npm install react-hook-form
```

Install Zod

```powershell
npm install zod @hookform/resolvers
```

Install Animations

```powershell
npm install framer-motion
```

Install Charts

```powershell
npm install recharts
```

Install Icons

```powershell
npm install lucide-react
```

Install Utilities

```powershell
npm install clsx tailwind-merge class-variance-authority
```

---

# Tailwind CSS

Install Tailwind

```powershell
npm install tailwindcss @tailwindcss/vite
```

Follow the official Tailwind installation guide for the version used in the project.

---

# shadcn/ui

Initialize

```powershell
npx shadcn@latest init
```

Configuration

Use

TypeScript

React

Tailwind CSS

Default Component Folder

```
src/components
```

---

# Run Frontend

```powershell
npm run dev
```

Application URL

```
http://localhost:5173
```

---

# Project Folder

frontend/

```
frontend/

│

├── public/

├── src/

│   ├── assets/

│   ├── components/

│   ├── hooks/

│   ├── layouts/

│   ├── lib/

│   ├── pages/

│   ├── routes/

│   ├── services/

│   ├── store/

│   ├── types/

│   ├── utils/

│   └── App.tsx

│

├── package.json

├── vite.config.ts

└── tsconfig.json
```

---

# Frontend Responsibilities

Frontend developer is responsible for

Landing Website

Authentication

Dashboard

Forms

Invitation Templates

Guest Management UI

Gallery UI

Photographer Portal UI

Admin Panel UI

Analytics Charts

API Integration

Responsive Design

Animations

Validation

State Management

---

# Before Starting Development

Open PowerShell

Go to project

```powershell
cd Documents\LavernaEvents_Project\lavernaevents
```

Switch Branch

```powershell
git checkout frontend-dev
```

Download Latest Code

```powershell
git pull origin frontend-dev
```

Go to frontend

```powershell
cd frontend
```

Install packages (only when package.json changes)

```powershell
npm install
```

Run frontend

```powershell
npm run dev
```

Now start development.

---

# After Completing Work

Go to project root

```powershell
cd ..
```

Check Status

```powershell
git status
```

Stage Files

```powershell
git add .
```

Commit

Example

```powershell
git commit -m "Create invitation template page"
```

Push

```powershell
git push origin frontend-dev
```

---

# After Pull Request Merge

Switch Main

```powershell
git checkout main
```

Download Latest

```powershell
git pull origin main
```

Return

```powershell
git checkout frontend-dev
```

Merge Main

```powershell
git merge main
```

Push

```powershell
git push origin frontend-dev
```

---

# Frequently Used Commands

Install Packages

```powershell
npm install
```

Run Project

```powershell
npm run dev
```

Production Build

```powershell
npm run build
```

Preview Build

```powershell
npm run preview
```

---

# Git Commands

Current Branch

```powershell
git branch
```

Status

```powershell
git status
```

Pull

```powershell
git pull
```

Push

```powershell
git push
```

Fetch

```powershell
git fetch
```

Stage

```powershell
git add .
```

Commit

```powershell
git commit -m "Commit Message"
```

---

# Frontend Development Rules

Only modify

frontend/

Never modify

backend/

Always create reusable components.

Always use TypeScript.

Always use Tailwind CSS.

Always use shadcn/ui components when suitable.

Never hardcode API URLs.

Store API URLs in configuration files.

Always use React Hook Form with Zod validation.

Keep pages responsive.

Follow the existing folder structure.

---

# Component Naming

Examples

```
Navbar.tsx

Sidebar.tsx

GuestTable.tsx

InvitationCard.tsx

DashboardCard.tsx

LoginForm.tsx
```

---

# Folder Naming

Use lowercase

Examples

```
components

pages

layouts

services

hooks

types

utils
```

---

# API Integration Rules

Never write API URLs directly.

Example

Wrong

```
axios.get("http://localhost:8000/api/users")
```

Correct

```
axiosInstance.get("/users")
```

Use a centralized Axios instance.

---

# UI Guidelines

Design should be

Modern

Professional

Responsive

Minimal

Accessible

Use

Cards

Dialogs

Tables

Charts

Skeleton Loaders

Toast Notifications

Dark Mode Ready

Consistent Spacing

---

# Documentation

Whenever

New Page

New Component

New Route

New API Integration

Update

docs/

documentation.

---

# Frontend Development Goal

Build a production-ready, responsive, reusable React application using TypeScript and modern frontend best practices.

Maintain clean code, modular components, and a scalable architecture suitable for long-term development.


# Running the Complete Project (Frontend Developer)

The frontend developer must also run the Django backend locally to test API integration.

The backend code is read-only unless instructed otherwise.

---

## PowerShell 1 - Backend

Go to backend

```powershell
cd Documents\LavernaEvents_Project\lavernaevents\backend
```

Activate Virtual Environment

```powershell
.\venv\Scripts\Activate
```

If PowerShell blocks activation

```powershell
Set-ExecutionPolicy -Scope Process RemoteSigned
```

Then activate again

```powershell
.\venv\Scripts\Activate
```

Run Django

```powershell
python manage.py runserver
```

Backend

```
http://127.0.0.1:8000
```

Admin

```
http://127.0.0.1:8000/admin/
```

---

## PowerShell 2 - Frontend

Go to frontend

```powershell
cd Documents\LavernaEvents_Project\lavernaevents\frontend
```

Install packages (only when required)

```powershell
npm install
```

Run React

```powershell
npm run dev
```

Frontend

```
http://localhost:5173
```

---

## Daily Startup Commands

Backend

```powershell
cd Documents\LavernaEvents_Project\lavernaevents\backend

.\venv\Scripts\Activate

python manage.py runserver
```

Frontend

```powershell
cd Documents\LavernaEvents_Project\lavernaevents\frontend

npm run dev
```

---

## Before Ending Work

```powershell
git status

git add .

git commit -m "Meaningful Commit Message"

git push origin frontend-dev
```


# Creating Python Virtual Environment (Windows)

The backend code is required locally for API testing.

Go to backend

```powershell
cd Documents\LavernaEvents_Project\lavernaevents\backend
```

Create virtual environment

```powershell
python -m venv venv
```

Allow activation (first time only)

```powershell
Set-ExecutionPolicy -Scope Process RemoteSigned
```

Activate virtual environment

```powershell
.\venv\Scripts\Activate
```

Upgrade pip

```powershell
python -m pip install --upgrade pip
```

Install dependencies

```powershell
pip install -r requirements.txt
```

Run migrations

```powershell
python manage.py migrate
```

Run backend

```powershell
python manage.py runserver
```

Deactivate

```powershell
deactivate
```