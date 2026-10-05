# LavernaEvents

# GitHub Workflow & Team Collaboration Guide

Version : 1.0

Repository

https://github.com/mohamedswafvanp/lavernaevents

---

# Repository Owner

GitHub

mohamedswafvanp

Repository

lavernaevents

Collaborators

Backend Developer

Frontend Developer

---

# Repository Branches

Main Branch

```
main
```

Backend Branch

```
backend-dev
```

Frontend Branch

```
frontend-dev
```

Never develop directly inside

```
main
```

---

# Branch Responsibilities

main

Purpose

Stable Production Ready Code

Only merged Pull Requests are allowed.

Never commit directly.

---

backend-dev

Purpose

Backend Development

Backend developer only.

---

frontend-dev

Purpose

Frontend Development

Frontend developer only.

---

# Initial Setup

Clone Repository

```bash
git clone https://github.com/mohamedswafvanp/lavernaevents.git
```

Go inside

```bash
cd lavernaevents
```

Open VS Code

```bash
code .
```

---

# Backend Developer Initial Setup

Switch Branch

```bash
git checkout backend-dev
```

Download Latest

```bash
git pull origin backend-dev
```

---

# Frontend Developer Initial Setup

Switch Branch

```bash
git checkout frontend-dev
```

Download Latest

```bash
git pull origin frontend-dev
```

---

# Daily Workflow

Every morning

Open project

Go to project folder

Backend (Linux)

```bash
cd ~/Documents/LavernaEvents_Project/lavernaevents
```

Frontend (Windows)

```powershell
cd Documents\LavernaEvents_Project\lavernaevents
```

---

# Check Current Branch

```bash
git branch
```

Backend should display

```
* backend-dev
```

Frontend should display

```
* frontend-dev
```

---

# Download Latest Changes

Always run

```bash
git fetch origin
```

Then

Backend

```bash
git pull origin backend-dev
```

Frontend

```bash
git pull origin frontend-dev
```

---

# Start Development

Backend

Run Django

```bash
python manage.py runserver
```

Frontend

Run React

```bash
npm run dev
```

---

# Check Changes

After coding

```bash
git status
```

---

# Stage Changes

```bash
git add .
```

---

# Commit Changes

Backend Examples

```bash
git commit -m "Create guest API"
```

```bash
git commit -m "Implement JWT authentication"
```

```bash
git commit -m "Create invitation service"
```

Frontend Examples

```bash
git commit -m "Build login page"
```

```bash
git commit -m "Create dashboard layout"
```

```bash
git commit -m "Develop guest table component"
```

Never use

```
update

changes

fixed

done

test
```

Always write meaningful commit messages.

---

# Push Changes

Backend

```bash
git push origin backend-dev
```

Frontend

```bash
git push origin frontend-dev
```

---

# Pull Request Workflow

Open GitHub

↓

Repository

↓

Pull Requests

↓

New Pull Request

Backend

```
backend-dev

↓

main
```

Frontend

```
frontend-dev

↓

main
```

Write

Title

Description

Testing Details

Create Pull Request

---

# Pull Request Example

Title

```
Guest Management Module
```

Description

```
Completed

Guest CRUD

Guest Validation

Search

Pagination

API Integration
```

---

# Merge Process

After review

Click

Merge Pull Request

↓

Confirm Merge

↓

Delete Branch

Do NOT delete

backend-dev

frontend-dev

Only temporary feature branches should be deleted.

---

# Update Branch After Merge

Backend

```bash
git checkout main
```

```bash
git pull origin main
```

```bash
git checkout backend-dev
```

```bash
git merge main
```

```bash
git push origin backend-dev
```

Frontend

```bash
git checkout main
```

```bash
git pull origin main
```

```bash
git checkout frontend-dev
```

```bash
git merge main
```

```bash
git push origin frontend-dev
```

---

# If Another Developer Updated Main

Always update your branch.

```bash
git checkout main
```

```bash
git pull origin main
```

Return

```bash
git checkout backend-dev
```

or

```bash
git checkout frontend-dev
```

Merge

```bash
git merge main
```

Push

```bash
git push
```

---

# Feature Branches (Optional)

Large Features

Create feature branch

Backend Example

```bash
git checkout backend-dev
```

```bash
git checkout -b feature/authentication
```

Push

```bash
git push -u origin feature/authentication
```

Merge

feature/authentication

↓

backend-dev

↓

main

Frontend

Example

```bash
git checkout frontend-dev
```

```bash
git checkout -b feature/dashboard
```

Push

```bash
git push -u origin feature/dashboard
```

Merge

feature/dashboard

↓

frontend-dev

↓

main

---

# Merge Conflict

If merge conflict occurs

Check

```bash
git status
```

Open conflicted file

Resolve conflict manually

Stage

```bash
git add .
```

Commit

```bash
git commit
```

Push

```bash
git push
```

---

# View History

```bash
git log --oneline
```

---

# Undo Last Commit

Keep Changes

```bash
git reset --soft HEAD~1
```

Remove Commit

```bash
git reset --hard HEAD~1
```

Warning

Never use

```
--hard
```

without understanding its effect because it permanently discards uncommitted work.

---

# Check Remote

```bash
git remote -v
```

Expected

```
origin

https://github.com/mohamedswafvanp/lavernaevents.git
```

---

# Useful Git Commands

Current Branch

```bash
git branch
```

Status

```bash
git status
```

Fetch

```bash
git fetch
```

Pull

```bash
git pull
```

Push

```bash
git push
```

Stage

```bash
git add .
```

Commit

```bash
git commit -m "Message"
```

History

```bash
git log --oneline
```

---

# Team Rules

Backend Developer

Only modify

```
backend/
```

Read Only

```
frontend/
```

Frontend Developer

Only modify

```
frontend/
```

Read Only

```
backend/
```

Shared Folder

```
docs/
```

Both developers may update documentation.

---

# Never Commit

```
.env

.venv/

node_modules/

__pycache__/

dist/

media/

staticfiles/

.vscode/

*.pyc
```

---

# Before Ending Work Every Day

Backend Developer

✔ Save Files

✔ Test APIs

✔ Run Server

✔ Check git status

✔ Commit

✔ Push

Frontend Developer

✔ Save Files

✔ Test UI

✔ Responsive Check

✔ Check git status

✔ Commit

✔ Push

---

# Weekly Team Checklist

Every Week

Backend Developer

✔ Update requirements.txt

✔ Review APIs

✔ Check Database

✔ Verify Authentication

Frontend Developer

✔ Optimize Components

✔ Remove Unused Code

✔ Check Responsiveness

✔ Verify API Integration

Both Developers

✔ Review Pull Requests

✔ Update Documentation

✔ Merge Stable Code

---

# Golden Rules

Never code directly in main.

Always pull before starting work.

Always push completed work.

Write meaningful commit messages.

Review code before creating Pull Requests.

Keep documentation updated.

Communicate API changes immediately.

Test before pushing.

Respect folder responsibilities.

Keep the repository clean.

Maintain production-quality code.
