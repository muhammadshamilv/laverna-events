# LavernaEvents

# UI Screen Flow & Navigation

Version : 1.0

Project

LavernaEvents

Application Type

Web Application

Frontend

React + TypeScript

Backend

Django REST Framework

---

# Overview

This document defines every screen of the application, navigation flow, protected routes, public routes, and the responsibilities of each screen.

This document should be used by both frontend and backend developers before implementing any feature.

---

# User Roles

The platform contains four user roles.

1. Visitor

2. Event Organizer (User)

3. Photographer

4. Administrator

---

# Application Flow

Visitor

↓

Landing Website

↓

Login / Register

↓

Membership Selection

↓

Create Event

↓

Dashboard

↓

Manage Event

↓

Guest Management

↓

Invitation Management

↓

Gallery

↓

QR Code

↓

Settings

---

# Route Structure

Public Routes

/

Home

/about

About

/features

Features

/pricing

Pricing

/gallery

Gallery

/faq

FAQ

/contact

Contact

/login

Login

/register

Register

/forgot-password

Forgot Password

/reset-password

Reset Password

/respond/:token

Guest Response Page

/guest/gallery/:eventId

Guest QR Gallery

---

# Protected Routes

/dashboard

Organizer Dashboard

/events

Event List

/events/create

Create Event

/events/:id

Event Details

/events/:id/edit

Edit Event

/guests

Guest Management

/invitations

Invitation Management

/templates

Invitation Templates

/gallery

Gallery

/albums

Albums

/photographers

Photographer Access

/qr

QR Management

/profile

Profile

/settings

Settings

/subscription

Membership

---

# Photographer Routes

/photographer/login

Photographer Login

/photographer/dashboard

Dashboard

/photographer/upload

Upload Photos

/photographer/albums

Albums

/profile

Profile

---

# Admin Routes

/admin/login

Admin Login

/admin/dashboard

Dashboard

/admin/users

Users

/admin/events

Events

/admin/memberships

Membership Plans

/admin/templates

Invitation Templates

/admin/media

Media

/admin/reports

Reports

/admin/settings

Settings

/admin/analytics

Analytics

---

# Landing Website

Pages

Home

↓

About

↓

Features

↓

Pricing

↓

Gallery

↓

FAQ

↓

Contact

↓

Login

↓

Register

---

# Registration Flow

Register

↓

Choose Membership

↓

Enter Personal Details

↓

Create Account

↓

Email Verification (Future)

↓

Dashboard

---

# Login Flow

Login

↓

Validate Credentials

↓

JWT Authentication

↓

Dashboard

---

# Organizer Dashboard

Dashboard Widgets

Total Events

Total Guests

Invitations Sent

Accepted

Rejected

Maybe

Pending

Expected Attendance

Uploaded Photos

Uploaded Videos

Membership Plan

Storage Usage

Quick Actions

Create Event

Import Guests

Send Invitations

Upload Media

Generate QR

---

# Event Management Flow

Dashboard

↓

Create Event

↓

Fill Event Details

↓

Save Event

↓

Event Created

↓

Event Dashboard

---

# Guest Management Flow

Dashboard

↓

Guest Management

↓

Choose Event

↓

Import Contacts

OR

Manual Entry

↓

Guest Table

↓

Edit

↓

Delete

↓

Update Family Members

↓

Save

---

# Contact Import Flow

Guest Management

↓

Click

Import Contacts

↓

Browser Permission

↓

Contact List

↓

Select Contacts

↓

Add Selected Contacts

↓

Guest Table Updated

If contact access is unavailable

↓

Show

Manual Entry

CSV Import

---

# Invitation Flow

Invitation Management

↓

Select Event

↓

Choose Template

↓

Preview

↓

Customize

↓

Generate Invitation

↓

Select Guests

↓

Send WhatsApp Invitations

↓

Invitation Sent

---

# Guest Response Flow

Guest receives WhatsApp

↓

Clicks Response Link

↓

Invitation Opens

↓

Event Details

↓

Accept

Reject

Maybe

↓

Submit

↓

Thank You Screen

↓

Dashboard Updated

---

# Gallery Flow

Dashboard

↓

Gallery

↓

Albums

↓

Upload Photos

↓

Upload Videos

↓

Preview

↓

Delete

↓

Download

---

# Photographer Flow

Photographer Login

↓

Dashboard

↓

Choose Event

↓

Choose Album

↓

Upload Photos

↓

Upload Videos

↓

Upload Completed

---

# QR Flow

Dashboard

↓

QR Code

↓

Generate QR

↓

Download PNG

↓

Download PDF

↓

Print QR

↓

Place at Event Venue

---

# Guest QR Flow

Guest Scans QR

↓

Landing Page

↓

Allow Camera

↓

Take Selfie

↓

Upload Selfie

↓

Processing

↓

AI Face Recognition

↓

Matching Photos

↓

Download Images

---

# Profile Flow

Profile

↓

Edit Personal Information

↓

Change Password

↓

Save

---

# Subscription Flow

Dashboard

↓

Subscription

↓

Current Plan

↓

Available Plans

↓

Upgrade

↓

Payment (Future)

↓

Plan Updated

---

# Admin Dashboard Flow

Admin Login

↓

Dashboard

↓

Users

↓

Membership Plans

↓

Events

↓

Invitation Templates

↓

Media

↓

Reports

↓

Analytics

↓

Settings

---

# User Management Flow

Users

↓

Search

↓

View

↓

Edit

↓

Suspend

↓

Activate

↓

Delete

---

# Membership Flow

Plans

↓

Create

↓

Edit

↓

Delete

↓

Activate

↓

Deactivate

---

# Reports Flow

Reports

↓

Revenue

↓

Registrations

↓

Events

↓

Storage

↓

Downloads

↓

Guest Statistics

↓

Export

---

# Screen Hierarchy

Landing Website

├── Home

├── About

├── Features

├── Pricing

├── Gallery

├── FAQ

└── Contact

------------------------------------

Authentication

├── Login

├── Register

├── Forgot Password

└── Reset Password

------------------------------------

Organizer

├── Dashboard

├── Events

├── Guests

├── Invitations

├── Templates

├── Gallery

├── Albums

├── QR

├── Photographer

├── Profile

├── Subscription

└── Settings

------------------------------------

Photographer

├── Login

├── Dashboard

├── Upload

├── Albums

└── Profile

------------------------------------

Admin

├── Dashboard

├── Users

├── Membership Plans

├── Events

├── Templates

├── Media

├── Reports

├── Analytics

└── Settings

---

# Suggested Frontend Folder Structure

src/

components/

layouts/

pages/

hooks/

services/

routes/

contexts/

store/

types/

utils/

assets/

lib/

constants/

styles/

---

# Page Responsibility

Pages

Only compose UI.

Components

Reusable UI.

Hooks

Reusable logic.

Services

API calls only.

Contexts

Authentication

Theme

User

Store

Global state.

Utils

Helper functions.

Types

TypeScript types.

---

# Protected Route Rules

Only authenticated users can access

Dashboard

Events

Guests

Invitations

Gallery

Profile

Subscription

Settings

Admin

Photographer

Guest Response Page

No login required.

---

# Loading States

Every page must include

Loading Spinner

Skeleton Loader

Error State

Empty State

Success State

---

# Responsive Design

Desktop

1920px

Laptop

1440px

Tablet

768px

Mobile

320px

---

# UI Standards

Use

Tailwind CSS

shadcn/ui

Framer Motion

Recharts

Lucide Icons

Maintain

Consistent spacing

Accessible forms

Keyboard navigation

Responsive layouts

Reusable components

---

# Navigation Rules

Never allow direct access to protected routes without authentication.

Redirect unauthenticated users to Login.

After login, redirect users to their dashboard based on role.

Organizer → /dashboard

Photographer → /photographer/dashboard

Admin → /admin/dashboard

---

# Future Screens

Notifications

Payments

Vendor Portal

Support Center

Calendar

Task Manager

Budget Manager

Guest Check-in

Attendance

Live Streaming

Mobile App

---

# Development Goal

Every screen should have a clear responsibility, a predictable navigation path, and a consistent user experience.

Frontend and backend developers should use this document together with the API documentation and database design to implement features without ambiguity.

This document acts as the UI blueprint for the LavernaEvents platform.
