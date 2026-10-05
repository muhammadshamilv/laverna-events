# LavernaEvents
# Project Setup & Team Guide

Version: 1.0

Repository:
https://github.com/mohamedswafvanp/lavernaevents

---

# Project Overview

LavernaEvents is a modern web-based Event Management Platform that allows users to create and manage various types of events such as:

- Wedding
- Reception
- Engagement
- Birthday
- Anniversary
- Housewarming
- Corporate Events
- Conferences
- Religious Events
- Family Events
- Custom Events

The platform provides complete event management including:

- Membership Plans
- Event Creation
- Digital Invitation Templates
- WhatsApp Invitation Sharing
- Guest Management
- Guest Response Tracking
- QR Code Generation
- Photographer Portal
- Gallery Management
- AI Face Recognition for Guest Photos
- Analytics Dashboard
- Admin Management

---

# Development Team

This project is developed by two developers.

## Backend Developer

Operating System

Ubuntu Linux

Responsibilities

- Django
- Django REST Framework
- PostgreSQL
- JWT Authentication
- Database
- REST APIs
- Business Logic
- Authentication
- QR Generation
- AI Integration
- WhatsApp Integration
- Deployment

Backend developer MUST work only inside

backend/

Backend developer MAY view

frontend/

for API integration reference only.

Backend developer MUST NOT modify frontend files.

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
- shadcn/ui
- React Router
- React Hook Form
- Zod
- Framer Motion
- Recharts

Frontend developer MUST work only inside

frontend/

Frontend developer MAY view

backend/

to understand API endpoints.

Frontend developer MUST NOT modify backend files.

---

# Repository Information

Repository Owner

mohamedswafvanp

Repository Name

lavernaevents

Repository URL

https://github.com/mohamedswafvanp/lavernaevents

Default Branch

main

Development Branches

backend-dev

frontend-dev

---

# Project Directory

Project Path

/home/shamil/Documents/LavernaEvents_Project/lavernaevents

Folder Structure

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

---

# Folder Responsibilities

backend/

Contains

- Django Project
- REST APIs
- Database
- Authentication
- Business Logic

Only Backend Developer modifies this folder.

---

frontend/

Contains

- React Project
- UI Components
- Pages
- Forms
- State Management
- API Calls

Only Frontend Developer modifies this folder.

---

docs/

Contains

- Project Documentation
- Setup Guides
- API Documentation
- Database Information
- Development Rules
- Meeting Notes

Both developers may update this folder.

---

# Development Workflow

Backend Developer

↓

Create Backend APIs

↓

Push to backend-dev

↓

Create Pull Request

↓

Merge into main

---

Frontend Developer

↓

Develop UI

↓

Consume Backend APIs

↓

Push to frontend-dev

↓

Create Pull Request

↓

Merge into main

---

# Git Branch Strategy

Main Branch

main

Purpose

Stable production-ready code.

Never develop directly inside main.

---

Backend Branch

backend-dev

Purpose

Backend development only.

---

Frontend Branch

frontend-dev

Purpose

Frontend development only.

---

# Daily Development Workflow

Every morning

Step 1

Open terminal

Navigate to project

Linux

cd ~/Documents/LavernaEvents_Project/lavernaevents

Windows

cd Documents\LavernaEvents_Project\lavernaevents

---

Step 2

Switch to your branch.

Backend Developer

git checkout backend-dev

Frontend Developer

git checkout frontend-dev

---

Step 3

Download latest changes.

git fetch origin

git pull

---

Step 4

Start development.

Backend

Run Django server.

Frontend

Run React development server.

---

Step 5

Complete your task.

---

Step 6

Check project status.

git status

---

Step 7

Stage changes.

git add .

---

Step 8

Commit changes.

Example

git commit -m "Create guest management API"

or

git commit -m "Build guest management UI"

Always write meaningful commit messages.

---

Step 9

Push changes.

Backend

git push origin backend-dev

Frontend

git push origin frontend-dev

---

Step 10

Open GitHub.

Create Pull Request.

Merge after review.

---

# Development Rules

Backend Developer

Allowed

✔ backend/

✔ docs/

Read Only

frontend/

Not Allowed

❌ Modify frontend code.

---

Frontend Developer

Allowed

✔ frontend/

✔ docs/

Read Only

backend/

Not Allowed

❌ Modify backend code.

---

# Communication Rules

Before starting a feature

Discuss

- API Requirements
- Database Changes
- UI Requirements

If database models change

Backend developer must notify frontend developer.

If API response changes

Backend developer must update API documentation.

If UI requires new data

Frontend developer must inform backend developer before implementation.

---

# Coding Standards

Write clean code.

Use proper naming conventions.

Write reusable components.

Avoid duplicate code.

Keep functions small.

Comment only when necessary.

Follow project folder structure.

Never commit unnecessary files.

---

# Pull Request Rules

Every completed feature should be submitted through Pull Request.

Never push unfinished work into main.

Review your own code before creating Pull Request.

Ensure project builds successfully before pushing.

---

# Git Ignore

Never commit

node_modules/

.venv/

.env

__pycache__/

dist/

media/

staticfiles/

*.pyc

---

# Documentation Rules

Whenever

- New API
- New Database Table
- New Feature
- Authentication Change

Update the corresponding file inside

docs/

This keeps the project documentation synchronized with development.

---

# Goal

Maintain a clean, professional, and scalable development workflow.

Every developer should be able to clone the repository, follow the documentation, and start working immediately without additional guidance.
