# LavernaEvents

# Database Design Document

Version : 1.0

Database

PostgreSQL

Backend

Django ORM

---

# Overview

This document defines the complete database architecture for the LavernaEvents platform.

Every table, relationship, and primary business entity is documented here.

The backend developer must implement these models.

The frontend developer should use this document to understand API data structures.

---

# Database Overview

Core Modules

Users

Membership Plans

Subscriptions

Events

Guests

Invitation Templates

Invitations

Guest Responses

Photo Albums

Photos

Videos

Photographers

QR Codes

Notifications

Activity Logs

---

# Relationship Diagram

User

│

├── Subscription

├── Events

│

├── Guests

├── Invitations

├── Albums

├── QR Codes

├── Photographers

└── Notifications

---

# 1. Users

Table

users

Purpose

Stores organizer accounts.

Columns

id

uuid

full_name

email

mobile_number

password

profile_image

is_verified

is_active

created_at

updated_at

Relationships

One User

↓

Many Events

---

# 2. Membership Plans

Table

membership_plans

Columns

id

name

price

guest_limit

template_limit

storage_limit

gallery_enabled

photographer_enabled

qr_enabled

is_active

created_at

---

# 3. User Subscription

Table

subscriptions

Columns

id

user

membership

start_date

end_date

status

payment_status

Relationships

One User

↓

One Active Subscription

---

# 4. Events

Table

events

Columns

id

user

event_name

event_type

host_name

description

venue

address

google_map_url

event_date

event_time

cover_image

status

created_at

updated_at

Relationship

One User

↓

Many Events

---

# 5. Guests

Table

guests

Columns

id

event

guest_name

mobile_number

family_members

invitation_sent

created_at

updated_at

Relationship

One Event

↓

Many Guests

---

# 6. Invitation Templates

Table

invitation_templates

Columns

id

template_name

preview_image

template_file

membership_plan

is_active

created_at

---

# 7. Invitations

Table

invitations

Columns

id

event

guest

template

invitation_image

response_token

sent_at

status

Relationship

One Guest

↓

One Invitation

---

# 8. Guest Responses

Table

guest_responses

Columns

id

guest

response

responded_at

ip_address

device

Allowed Responses

Accepted

Rejected

Maybe

---

# 9. Photo Albums

Table

albums

Columns

id

event

album_name

description

created_at

---

# 10. Photos

Table

photos

Columns

id

album

uploaded_by

image

thumbnail

face_processed

created_at

---

# 11. Videos

Table

videos

Columns

id

album

video

thumbnail

duration

created_at

---

# 12. Photographer Accounts

Table

photographers

Columns

id

event

full_name

email

mobile

password

status

created_at

Permissions

Upload Photos

Upload Videos

Create Albums

Cannot

Delete Event

View Guests

Modify Dashboard

---

# 13. QR Codes

Table

qr_codes

Columns

id

event

qr_image

pdf_file

created_at

---

# 14. Notifications

Table

notifications

Columns

id

user

title

message

type

status

created_at

---

# 15. Activity Logs

Table

activity_logs

Columns

id

user

activity

ip_address

device

created_at

---

# Database Relationships

User

↓

Subscription

↓

Membership Plan

------------------------------------

User

↓

Events

↓

Guests

↓

Invitation

↓

Guest Response

------------------------------------

Event

↓

Albums

↓

Photos

↓

Videos

------------------------------------

Event

↓

Photographers

------------------------------------

Event

↓

QR Code

---

# Event Flow

User

↓

Create Event

↓

Add Guests

↓

Generate Invitation

↓

Send WhatsApp

↓

Guest Response

↓

Dashboard Updated

↓

Photographer Uploads

↓

QR Generated

↓

Guest Downloads Photos

---

# Index Recommendations

Index

email

mobile_number

event_date

response_token

guest_name

event_name

created_at

---

# Future Tables

Payments

Coupons

Vendors

Tickets

Sponsors

Expenses

Budgets

Calendar

Attendance

Feedback

AI Face Embeddings

Audit Logs

---

# Database Rules

Always use UUID for public IDs where appropriate.

Never store plain text passwords.

Use Foreign Keys correctly.

Enable cascading deletes only where appropriate.

Use indexes on searchable fields.

Store timestamps in UTC.

Use soft delete for critical business records if required.

Normalize the schema to avoid duplicate data.

---

# Model Naming Convention

Models

PascalCase

Example

User

Guest

Event

Invitation

Album

Fields

snake_case

Example

guest_name

event_date

mobile_number

created_at

updated_at

---

# Migration Rules

Every model change requires

python manage.py makemigrations

python manage.py migrate

Commit migration files.

Never delete migrations without discussion.

---

# Goal

The database should be scalable, normalized, secure, and capable of supporting future mobile applications and enterprise-level growth without major schema changes.
