# LavernaEvents

# API Documentation

Version : 1.0

API Style

REST API

Authentication

JWT Authentication

Content Type

application/json

Base URL (Development)

http://127.0.0.1:8000/api/

Production URL

https://api.lavernaevents.com/api/

---

# API Response Format

Success Response

```json
{
    "success": true,
    "message": "Request completed successfully.",
    "data": {}
}
```

Error Response

```json
{
    "success": false,
    "message": "Validation failed.",
    "errors": {}
}
```

---

# Authentication Module

Base URL

/api/auth/

Endpoints

POST

/auth/register/

Description

Create Organizer Account

----------------------------------------

POST

/auth/login/

Description

User Login

----------------------------------------

POST

/auth/logout/

Description

Logout User

----------------------------------------

POST

/auth/token/refresh/

Description

Refresh JWT Token

----------------------------------------

POST

/auth/forgot-password/

Description

Forgot Password

----------------------------------------

POST

/auth/reset-password/

Description

Reset Password

----------------------------------------

GET

/auth/profile/

Description

Get User Profile

----------------------------------------

PATCH

/auth/profile/

Description

Update User Profile

---

# Membership Module

Base URL

/api/memberships/

GET

/

List Membership Plans

----------------------------------------

GET

/{id}/

Membership Details

----------------------------------------

POST

/subscribe/

Subscribe Plan

----------------------------------------

GET

/my-plan/

Current Plan

---

# Events Module

Base URL

/api/events/

GET

/

List Events

----------------------------------------

POST

/

Create Event

----------------------------------------

GET

/{id}/

Event Details

----------------------------------------

PATCH

/{id}/

Update Event

----------------------------------------

DELETE

/{id}/

Delete Event

---

# Event Object

Example

```json
{
    "event_name": "",
    "event_type": "",
    "host_name": "",
    "description": "",
    "venue": "",
    "address": "",
    "google_map_url": "",
    "event_date": "",
    "event_time": ""
}
```

---

# Guest Module

Base URL

/api/guests/

GET

/

List Guests

----------------------------------------

POST

/

Create Guest

----------------------------------------

PATCH

/{id}/

Update Guest

----------------------------------------

DELETE

/{id}/

Delete Guest

----------------------------------------

POST

/import-contacts/

Import Contacts

----------------------------------------

POST

/import-csv/

Import CSV

----------------------------------------

GET

/export/

Export Guest List

---

# Guest Object

```json
{
    "guest_name": "",
    "mobile_number": "",
    "family_members": 3
}
```

---

# Invitation Module

Base URL

/api/invitations/

GET

/templates/

List Invitation Templates

----------------------------------------

POST

/select-template/

Select Template

----------------------------------------

POST

/generate/

Generate Invitation

----------------------------------------

POST

/send/

Send Invitation

----------------------------------------

GET

/{id}/

Invitation Details

---

# WhatsApp Flow

User

↓

Generate Invitation

↓

Backend Creates Invitation

↓

Backend Generates Response Token

↓

Backend Sends WhatsApp Message

↓

Guest Receives Link

Example

```
https://lavernaevents.com/respond/{token}
```

---

# Guest Response Module

Base URL

/api/responses/

GET

/{token}/

Open Invitation

----------------------------------------

POST

/{token}/

Submit Response

Allowed Values

Accepted

Rejected

Maybe

Each token is valid for one guest only.

---

# Gallery Module

Base URL

/api/gallery/

GET

/albums/

List Albums

----------------------------------------

POST

/albums/

Create Album

----------------------------------------

POST

/upload-photo/

Upload Photo

----------------------------------------

POST

/upload-video/

Upload Video

----------------------------------------

DELETE

/photo/{id}/

Delete Photo

----------------------------------------

DELETE

/video/{id}/

Delete Video

---

# Photographer Module

Base URL

/api/photographers/

POST

/login/

----------------------------------------

POST

/upload/

----------------------------------------

GET

/albums/

----------------------------------------

POST

/create-album/

Photographer can

Upload

Create Albums

Cannot

Delete Events

Manage Guests

Access Dashboard

---

# QR Module

Base URL

/api/qr/

GET

/{event_id}/

Generate QR

----------------------------------------

GET

/download/{event_id}/

Download PNG

----------------------------------------

GET

/pdf/{event_id}/

Download PDF

---

# Face Recognition Module

Base URL

/api/face/

POST

/search/

Request

Guest Selfie

Response

Matching Images

----------------------------------------

GET

/results/{request_id}/

Retrieve Results

---

# Dashboard Module

Base URL

/api/dashboard/

GET

/

Returns

Total Guests

Accepted

Rejected

Maybe

Pending

Expected Attendance

Photos

Videos

Analytics

---

# Admin Module

Base URL

/api/admin/

Users

GET

/users/

----------------------------------------

PATCH

/users/{id}/

----------------------------------------

DELETE

/users/{id}/

Memberships

GET

/plans/

POST

/plans/

PATCH

/plans/{id}/

DELETE

/plans/{id}/

Templates

GET

/templates/

POST

/templates/

PATCH

/templates/{id}/

DELETE

/templates/{id}/

Reports

GET

/reports/

Analytics

GET

/analytics/

---

# HTTP Status Codes

200

OK

201

Created

204

Deleted

400

Bad Request

401

Unauthorized

403

Forbidden

404

Not Found

500

Internal Server Error

---

# Authentication Header

Authorization

```
Bearer <JWT_TOKEN>
```

All authenticated APIs require this header except

Register

Login

Forgot Password

Reset Password

Guest Response

---

# Pagination

Request

```
?page=1&page_size=10
```

Response

```json
{
    "count": 120,
    "next": "...",
    "previous": "...",
    "results": []
}
```

---

# Search

Example

```
GET

/api/guests/?search=john
```

---

# Filtering

Example

```
GET

/api/events/?event_type=Wedding
```

---

# Ordering

Example

```
GET

/api/events/?ordering=-created_at
```

---

# File Upload

Content Type

multipart/form-data

Allowed

Images

Videos

Documents

---

# Validation Rules

Guest Mobile Number

Required

Unique within the same event

Family Members

Minimum

1

Event Name

Required

Maximum

255 Characters

Host Name

Required

Email

Valid Email

Password

Minimum

8 Characters

---

# Error Handling

Every endpoint returns

success

message

errors

Frontend should never rely on raw Django error pages.

---

# API Versioning

Current Version

v1

Future

/api/v2/

---

# Development Rules

Backend Developer

Every new API

↓

Update this document.

Frontend Developer

Before consuming an API

↓

Read this document.

Never call undocumented endpoints.

---

# Goal

Maintain a single, accurate API reference so frontend and backend developers can work independently while staying synchronized.

Every endpoint added, modified, or removed during development must be reflected in this document before the related Pull Request is merged.
