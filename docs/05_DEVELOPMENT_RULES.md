# LavernaEvents

# Development Rules & Coding Standards

Version : 1.0

Last Updated

08-Aug-2026

---

# Purpose

This document defines the coding standards, development workflow, architecture rules, naming conventions, and best practices that every developer working on LavernaEvents must follow.

The goal is to maintain a clean, scalable, professional, and production-ready codebase.

---

# Development Principles

Always write code that is

- Clean
- Readable
- Reusable
- Modular
- Scalable
- Secure
- Well Documented

Every developer should be able to understand another developer's code without additional explanation.

---

# Team Responsibilities

Backend Developer

Responsible for

- Database
- Models
- APIs
- Authentication
- Authorization
- Business Logic
- QR Code
- AI Integration
- WhatsApp Integration
- Media Upload
- Admin Backend

Frontend Developer

Responsible for

- User Interface
- User Experience
- Responsive Design
- API Integration
- Forms
- Validation
- Dashboard
- Animations
- Charts
- Admin UI

Shared Responsibilities

- Documentation
- Testing
- Bug Fixing
- Code Review
- Deployment Support

---

# Folder Rules

Backend Developer

Can modify

backend/

docs/

Read only

frontend/

Never modify frontend source files.

---

Frontend Developer

Can modify

frontend/

docs/

Read only

backend/

Never modify backend source files.

---

# Coding Standards

## General Rules

Use English for

- Variables
- Functions
- Classes
- Tables
- APIs
- Comments

Never use short names like

x

abc

temp1

Use meaningful names.

Correct

guestResponse

eventLocation

selectedInvitation

Wrong

a

b

test

demo

---

# File Naming

React Components

PascalCase

Example

GuestTable.tsx

InvitationCard.tsx

DashboardCard.tsx

Navbar.tsx

Sidebar.tsx

---

React Hooks

camelCase

Example

useAuth.ts

useGuest.ts

useInvitation.ts

---

Utility Files

camelCase

Example

dateFormatter.ts

apiClient.ts

validation.ts

---

Backend Files

snake_case

Example

guest_service.py

notification_service.py

qr_generator.py

---

Database Models

PascalCase

Example

Guest

Invitation

Membership

Photographer

Gallery

---

Variables

camelCase

Example

guestList

selectedTemplate

eventDetails

familyMemberCount

---

Constants

UPPER_CASE

Example

MAX_GUEST_LIMIT

DEFAULT_PAGE_SIZE

JWT_EXPIRATION_TIME

---

# Backend Standards

Use Django Apps correctly.

Never place all logic inside

views.py

Structure

views.py

↓

serializers.py

↓

services.py

↓

models.py

↓

utils.py

Business logic belongs in services, not views.

Views should remain thin.

---

# API Design

Use REST standards.

Example

GET

/api/events/

POST

/api/events/

GET

/api/events/{id}/

PATCH

/api/events/{id}/

DELETE

/api/events/{id}/

Avoid action-based endpoints like

/createEvent

/deleteGuest

Prefer resource-based URLs.

---

# HTTP Status Codes

200

Success

201

Created

204

Deleted

400

Validation Error

401

Unauthorized

403

Forbidden

404

Not Found

500

Server Error

---

# Database Standards

Use singular model names.

Example

Guest

Event

Invitation

Membership

Avoid

Guests

Events

Memberships

Table names will be generated automatically by Django.

---

# Database Relationships

Use

ForeignKey

OneToOneField

ManyToManyField

appropriately.

Always define

related_name

for relationships.

---

# Serializer Rules

Validation belongs inside serializers.

Never duplicate validation in views.

---

# Authentication

Use JWT Authentication.

Never create custom token systems unless necessary.

Protect all private APIs.

---

# Frontend Standards

Always use TypeScript.

Never use JavaScript files.

Use

.ts

.tsx

only.

---

# Component Rules

One component

One responsibility.

Large pages should be split into

Components

Layouts

Sections

Dialogs

Tables

Forms

Charts

---

# State Management

Use

TanStack Query

for server state.

Use React state only for local UI state.

Avoid unnecessary prop drilling.

---

# Forms

Always use

React Hook Form

+

Zod

Never use uncontrolled forms.

Every form must have validation.

---

# API Integration

Create one Axios instance.

Example

services/api.ts

Never hardcode API URLs.

Wrong

axios.get("http://localhost:8000/api/events")

Correct

api.get("/events")

---

# UI Design Standards

Use

shadcn/ui

components whenever possible.

Use

Tailwind CSS

for styling.

Avoid custom CSS unless necessary.

Maintain

- Consistent spacing
- Proper typography
- Responsive layouts
- Accessible forms

---

# Responsive Design

Support

Desktop

Laptop

Tablet

Mobile

Minimum supported width

320px

---

# Charts

Use

Recharts

for analytics.

Do not mix chart libraries.

---

# Error Handling

Frontend

Display user-friendly error messages.

Backend

Return consistent JSON responses.

Example

{
    "success": false,
    "message": "Guest not found."
}

---

# Logging

Backend

Log

Authentication

Errors

Exceptions

File Uploads

Payment Events

AI Requests

Do not log passwords or sensitive data.

---

# Security Rules

Never commit

.env

API Keys

Passwords

Private Certificates

Database Dumps

Always use

Environment Variables

JWT Authentication

Role-Based Permissions

Secure Password Hashing

HTTPS in production.

---

# Performance Rules

Backend

Use select_related()

prefetch_related()

for optimized database queries.

Avoid N+1 query problems.

Frontend

Lazy load large pages.

Optimize images.

Avoid unnecessary re-renders.

---

# Git Commit Rules

Correct

git commit -m "Implement guest response API"

git commit -m "Create invitation template page"

git commit -m "Add gallery upload feature"

Wrong

git commit -m "update"

git commit -m "fix"

git commit -m "done"

---

# Pull Request Rules

Every Pull Request should include

Title

Description

Completed Features

Testing Notes

Screenshots (Frontend)

API Examples (Backend)

---

# Documentation Rules

Whenever you add

New API

New Model

New Component

New Route

New Environment Variable

Update

docs/

documentation immediately.

---

# Testing Checklist

Backend

✔ Authentication

✔ Validation

✔ Permissions

✔ Database

✔ API Response

✔ Error Handling

Frontend

✔ Responsive

✔ Forms

✔ Validation

✔ API Integration

✔ Loading State

✔ Error State

✔ Empty State

---

# Code Review Checklist

Before pushing code

Ask yourself

Is the code readable?

Is it reusable?

Is it tested?

Is it documented?

Is it secure?

Does it follow project conventions?

If the answer is NO

Do not push yet.

---

# Definition of Done

A task is complete only if

✔ Code is implemented

✔ Tested

✔ No console errors

✔ No lint errors

✔ Responsive (Frontend)

✔ API documented (Backend)

✔ Documentation updated

✔ Committed

✔ Pushed

✔ Pull Request created

---

# Communication Rules

Backend Developer must inform Frontend Developer when

- New API is created
- API response changes
- Authentication changes
- Database changes

Frontend Developer must inform Backend Developer when

- New API is required
- Existing API is insufficient
- UI requires additional data

---

# Golden Rules

Never work directly in main.

Always pull before starting work.

Always push completed work.

Keep documentation updated.

Write meaningful commit messages.

Respect folder ownership.

Write clean and reusable code.

Keep business logic out of the UI.

Keep APIs RESTful.

Always think about scalability.

Develop as if this project will be maintained for the next five years.

---

# Final Goal

LavernaEvents should be developed using professional software engineering practices.

Every developer should be able to join the project, understand the architecture, and contribute confidently without introducing inconsistencies into the codebase.
