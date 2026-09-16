# Advanced Task Management System

A full-stack task management application built with **Node.js, Express.js, MongoDB, Mongoose, and a vanilla JavaScript frontend**.

The project started as a basic task CRUD application and was progressively expanded into a structured application covering:

- Task CRUD and ownership
- Task assignment
- MongoDB-backed filtering, search, sorting, and pagination
- JWT authentication with HttpOnly cookies
- Role-based authorization
- Event-driven activities and notifications
- Dashboard statistics
- Task reminders and overdue tracking
- MongoDB-backed background jobs
- Retry and failure handling
- JSON/CSV task exports
- Background task reports
- Centralized backend error handling
- Class-based service and worker components
- Frontend routing, state management, Kanban interaction, and debounced search

> **Current status:** Milestones 1–12 are implemented. The recent cleanup and UI/reliability pass has also addressed frontend state/session issues, Kanban rendering/drop behavior, and background report downloading during local development. The project is now at the final manual/integration testing and UI-polish stage.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Implementation Progress](#implementation-progress)
- [Current Architecture](#current-architecture)
- [Core Features](#core-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Authentication and Security](#authentication-and-security)
- [Task Access Rules](#task-access-rules)
- [Task Querying](#task-querying)
- [Event-Driven Features](#event-driven-features)
- [Notifications](#notifications)
- [Reminders and Overdue Tasks](#reminders-and-overdue-tasks)
- [Background Job Queue](#background-job-queue)
- [Retry and Failure Handling](#retry-and-failure-handling)
- [File Exports and Reports](#file-exports-and-reports)
- [Dashboard](#dashboard)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Data Models](#data-models)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [Local HTTPS Setup](#local-https-setup)
- [Live Server Development Configuration](#live-server-development-configuration)
- [Testing with Postman](#testing-with-postman)
- [Frontend Usage](#frontend-usage)
- [Request and Background Flows](#request-and-background-flows)
- [Important Design Decisions](#important-design-decisions)
- [Development Commands](#development-commands)
- [Git Workflow](#git-workflow)
- [Planned Extensions](#planned-extensions)
- [Learning Objectives](#learning-objectives)
- [Known Limitations](#known-limitations)
- [Security Notes](#security-notes)
- [Project Philosophy](#project-philosophy)
- [License](#license)

---

# Project Overview

The Advanced Task Management System provides authenticated users with a task-management workspace.

The application has two main parts:

```text
Frontend
HTML + CSS + Vanilla JavaScript
        ↓
Frontend API Layer
        ↓
HTTPS REST API
        ↓
Express Backend
        ↓
Services / Events / Queue / Workers
        ↓
MongoDB
```

The frontend does not communicate directly with MongoDB.

The backend is responsible for authentication, authorization, business rules, querying, persistence, background work, reports, and error handling.

---

# Implementation Progress

The project was developed incrementally so that each architectural feature was introduced after the preceding functionality was working.

```text
Milestone 1
Task CRUD foundation
        ↓
Milestone 2
MongoDB filtering / search / sorting / pagination
        ↓
Milestone 3
Authentication / authorization / roles / assignment
        ↓
Milestone 4
Event-driven activity logging
        ↓
Milestone 5
In-app notifications
        ↓
Milestone 6
Backend dashboard and frontend dashboard
        ↓
Milestone 7
Task reminders and overdue tracking
        ↓
Milestone 8
Background job queue foundation
        ↓
Milestone 9
Retry and failure handling
        ↓
Milestone 10
JSON/CSV exports and background reports
        ↓
Milestone 11
Background worker / lease / heartbeat reliability
        ↓
Milestone 12
Centralized error handling and backend cleanup
        ↓
Post-milestone cleanup
Frontend state/session fixes
Kanban fixes
Report download development fix
UI cleanup
```

The later cleanup pass focused on reliability and maintainability rather than adding unrelated features.

Recent fixes and architectural improvements include:

- MongoDB job persistence replacing the earlier in-memory queue.
- Atomic job claiming with leases to reduce duplicate processing.
- Worker lease refresh/heartbeat behavior.
- Stale processing jobs becoming reclaimable.
- Environment validation at application startup.
- Frontend report polling timeout.
- Correct reminder-state reset when a task due date changes.
- Explicit task unassignment events.
- Replacement of deprecated Mongoose update options.
- Date-filter validation and normalization.
- Escaping task-search input before building MongoDB regular expressions.
- Parallel task-count and paginated-task queries where appropriate.
- MongoDB polling error handling in the worker.
- Streaming JSON and CSV exports.
- Bounded retrieval of recent activity and notifications.
- Debounced frontend task search.
- Frontend session/load guards to prevent stale requests from overwriting newer user state.
- Defensive task de-duplication before rendering.
- Kanban rendering using explicit drop-zone selectors.
- Kanban status changes reloading authoritative task data after a successful backend update.
- Live Server configuration that ignores backend-generated report files so report generation does not trigger an unwanted browser reload during development.

---

# Core Features

## Task Management

Each task supports:

```text
title
description
status
priority
dueDate
tags
owner
assignedTo
reminderSentAt
isOverdue
createdAt
updatedAt
```

### Statuses

```text
pending
in-progress
completed
```

### Priorities

```text
low
medium
high
```

---

## Task Ownership

When a task is created, the backend assigns ownership from the authenticated user:

```text
Authenticated Request
        ↓
req.user.userId
        ↓
Task.owner
```

The frontend cannot choose another user as the owner simply by sending an owner ID.

---

## Task Assignment

Tasks can be assigned to users through:

```http
PATCH /api/tasks/:id/assign
```

Assignments can also be removed by sending:

```json
{
  "assignedTo": null
}
```

The backend validates the target user and authorization before changing the assignment.

---

## Task Search

Search applies to:

```text
title
description
```

The search is performed by MongoDB rather than by downloading the complete task collection and filtering it in the browser.

The frontend debounces search input before requesting filtered tasks to reduce unnecessary API requests while typing.

---

## Task Filtering

Supported filters include:

```text
status
priority
tag
fromDate
toDate
```

Example:

```text
/api/tasks?status=pending&priority=high
```

Date filters are validated and normalized by the backend.

---

## Sorting

Supported task sort fields include:

```text
createdAt
updatedAt
dueDate
priority
```

Directions:

```text
asc
desc
```

The backend validates the requested sort field against an allowed list.

---

## Pagination

Task retrieval supports:

```text
page
limit
```

Example:

```text
/api/tasks?page=2&limit=10
```

---

## Kanban Board

The frontend provides a Kanban-style task view based on task status:

```text
Pending
   ↓
In Progress
   ↓
Completed
```

Users with permission to edit a task can drag it between valid Kanban columns.

The status change flow is backend-authoritative:

```text
Drag Task
    ↓
PUT /api/tasks/:id
    ↓
Backend updates task
    ↓
Frontend reloads tasks
    ↓
State is replaced with API data
    ↓
Kanban re-renders
```

This avoids keeping a manually moved DOM card as a separate source of truth from application state.

---

## Activity Logging

Task operations can create activity records through the event system.

The current activity endpoint returns the latest 50 accessible activity records. This is intentionally bounded rather than full history pagination.

Flow:

```text
Task Event
    ↓
Activity Listener
    ↓
Activity Job
    ↓
MongoDB-backed Queue
    ↓
QueueWorker
    ↓
Activity Service
    ↓
MongoDB
```

---

## Notifications

Notifications are currently **in-app only**.

Current notification types include:

```text
taskAssigned
taskCompleted
taskPriorityChanged
taskReminder
```

Users can:

- View notifications.
- View unread notifications.
- Mark one notification as read.
- Mark all notifications as read.

The notification endpoint currently returns the latest 50 notifications for the authenticated user.

Notification creation is handled through background jobs.

Email/SMTP delivery is not currently implemented.

---

## Dashboard

Dashboard information is calculated by the backend.

Current values include:

```text
total
completed
pending
overdue
byPriority
recentActivity
```

Normal users receive statistics based on tasks they are authorized to access.

Administrators have broader task visibility.

Independent calculations can run concurrently with `Promise.all()` where appropriate.

---

# Authentication and Security

The application uses:

- Passport-Local-Mongoose for password authentication.
- JWT for authenticated sessions.
- HttpOnly cookies for JWT storage.
- Secure cookies during local HTTPS development.
- CORS credentials.
- `/api/auth/me` for session restoration.

The JWT is **not** stored in browser `localStorage`.

## Registration

```text
Register
    ↓
Passport-Local-Mongoose
    ↓
Password Hashing
    ↓
MongoDB
```

The user's email is used as the username field.

Normal registration creates:

```text
role = user
```

## Login

```text
Email + Password
       ↓
User.authenticate()
       ↓
Password Verification
       ↓
JWT Creation
       ↓
HttpOnly Cookie
       ↓
Browser
```

The JWT is not returned as a frontend JSON credential.

## Protected Request

```text
Browser
   ↓
HttpOnly Cookie
   ↓
Authentication Middleware
   ↓
JWT Verification
   ↓
req.user
   ↓
Controller
```

## Session Restoration

When the frontend starts:

```text
Frontend starts
      ↓
GET /api/auth/me
      ↓
Browser sends HttpOnly cookie
      ↓
Backend verifies JWT
      ↓
Current user returned
      ↓
Frontend stores user state in memory
```

This allows the application to restore the authenticated session after a page refresh without exposing the JWT to frontend JavaScript.

## Cookie Configuration

The authentication cookie uses secure browser settings such as:

```text
httpOnly: true
secure: true
sameSite: lax
```

The Secure option is controlled through:

```env
COOKIE_SECURE=true
```

---

# Task Access Rules

Authorization is enforced by the backend. Frontend controls such as hidden buttons are only UI behavior and are not the security boundary.

## Normal User

A normal user can access tasks where:

```text
owner == current user
OR
assignedTo == current user
```

## Administrator

Administrators have broader task access and can operate across the task collection.

## Ownership

Task ownership is taken from:

```js
req.user.userId
```

rather than trusting an owner ID supplied by the frontend.

---

# Task Querying

The task list API supports:

```text
status
priority
search
tag
fromDate
toDate
sortBy
sortOrder
page
limit
```

Example:

```text
GET /api/tasks?status=pending&priority=high&search=api&page=1&limit=10
```

Filtering and sorting are performed by MongoDB/Mongoose on the backend.

---

# Event-Driven Features

The project uses Node.js `EventEmitter` to separate primary task operations from secondary actions.

```text
Create / Update / Assign Task
            ↓
        Emit Event
            ↓
       Event Listeners
        ┌─────┴─────┐
        ↓           ↓
    Activity    Notification
        ↓           ↓
      Queue Job   Queue Job
        └─────┬─────┘
              ↓
           Worker
```

The task service does not directly persist every activity and notification record. Instead, task events allow those secondary actions to be processed independently.

---

# Reminders and Overdue Tasks

The reminder scheduler runs periodically while the Node.js process is alive.

Responsibilities are separated:

```text
Reminder Scheduler
        ↓
      WHEN
        ↓
Reminder Service
        ↓
      WHAT
        ↓
Background Queue
        ↓
    QueueWorker
        ↓
      HOW
```

## Upcoming Tasks

The current reminder window is:

```text
1 hour before due date
```

The reminder system:

- Detects approaching due dates.
- Ignores completed tasks.
- Queues reminder notifications.
- Prevents duplicate reminders.
- Records `reminderSentAt`.

## Overdue Tasks

Past-due incomplete tasks can be marked:

```text
isOverdue = true
```

Overdue state is separate from workflow status.

For example:

```text
status = pending
isOverdue = true
```

A task does not need an `overdue` workflow status.

If a task's due date changes, reminder state can be reset so the new due date can be processed independently.

---

# Background Job Queue

The application uses a **MongoDB-backed background job queue**.

Jobs are persisted as MongoDB documents rather than stored only in a JavaScript array. This allows pending work to survive a Node.js process restart.

## Why a Queue?

Without background processing:

```text
Task Request
    ↓
Task Service
    ↓
Create Activity / Notification
    ↓
HTTP Response
```

With the queue:

```text
Task Request
    ↓
Task Service
    ↓
Emit Event
    ↓
Add Job
    ↓
HTTP Response
```

The worker performs the secondary operation afterward.

## Job Types

```text
activity
notification
report
```

## Job Lifecycle

```text
pending
   ↓
processing
   ↓
completed
```

Failed work can enter:

```text
failed
```

with the associated error stored on the job.

## Leases and Stale Jobs

The worker uses a lease ID and stale-job timeout.

Conceptually:

```text
pending
   ↓
worker claims job
   ↓
processing + lease
   ↓
worker refreshes lease while active
   ↓
completed
```

If a worker stops unexpectedly and a job remains in `processing` beyond the stale threshold, the job can become eligible for reclamation.

The current worker intentionally processes one job at a time.

---

# Retry and Failure Handling

Background jobs support retry handling.

Each job tracks values such as:

```text
attempts
maxAttempts
error
```

The current maximum is:

```text
3 total attempts
```

Retry delays increase between attempts.

Example:

```text
Attempt 1 → failure
      ↓
   1 second
      ↓
Attempt 2 → failure
      ↓
   2 seconds
      ↓
Attempt 3 → failure
      ↓
permanently failed
```

A permanently failed job does not stop the worker. The worker continues processing later jobs.

The reusable retry logic is located at:

```text
server/src/utils/retry.js
```

Responsibility is separated as follows:

```text
retry.js
    ↓
how failures are retried

QueueWorker
    ↓
when jobs are processed

job_handlers.js
    ↓
what each job does
```

---

# File Exports and Reports

The application supports:

- JSON task exports.
- CSV task exports.
- Streaming export generation.
- Background task report generation.
- Report job status tracking.
- Downloading completed reports.
- Streaming completed report downloads.

Generated report files are stored under:

```text
server/reports/exports/
```

That directory is ignored by Git.

## Direct Task Exports

```http
GET /api/reports/tasks/json
GET /api/reports/tasks/csv
```

Direct exports use the authenticated user's task access rules.

JSON and CSV exports use MongoDB cursors and writable streams so the complete task collection does not have to be loaded into one large array.

Conceptually:

```text
MongoDB Cursor
      ↓
one task at a time
      ↓
Writable File Stream
      ↓
Generated Export
```

## Background Reports

A background report is started with:

```http
POST /api/reports/tasks/report
```

The request returns a job ID rather than waiting for report generation to finish.

The generated report contains summary information and task details, so the report-generation path currently builds the complete report object in memory before writing the file.

Completed reports can be downloaded through:

```http
GET /api/reports/jobs/:jobId/download
```

The download is streamed to the client.

---

# Dashboard

The dashboard endpoint returns backend-calculated information:

```text
total
completed
pending
overdue
byPriority
recentActivity
```

Normal users receive statistics based on their authorized tasks.

Administrators have broader task visibility.

Independent dashboard calculations can use:

```js
Promise.all()
```

where the calculations do not depend on one another.

---

# Frontend Architecture

The frontend is a vanilla JavaScript application with separate API, authentication, state, rendering, routing, and application-coordination responsibilities.

## `app.js`

Coordinates application behavior:

```text
User Action
    ↓
Event Handler
    ↓
API Call
    ↓
State Update / Reload
    ↓
UI Rendering
```

It also coordinates startup, session restoration, task operations, Kanban interactions, report generation, and other UI actions.

## `api.js`

Central frontend API layer.

It communicates with the Express backend and sends:

```js
credentials: "include"
```

so the browser can send the authentication cookie.

## `auth.js`

Maintains the current authenticated user in frontend memory.

It does not store the JWT in `localStorage`.

## `state.js`

Stores frontend application state such as:

```text
current user
tasks
users
notifications
dashboard
activities
filters
pagination
```

## `render.js`

Converts application data into UI elements.

It renders areas such as:

- Task list.
- Kanban board.
- Dashboard.
- Activities.
- Notifications.
- Assignment controls.
- Overdue indicators.
- Pagination.

## `router.js`

Controls frontend view routing between application sections.

---

# Backend Architecture

The backend follows a layered architecture:

```text
HTTP Request
     ↓
Express Route
     ↓
Middleware
     ↓
Controller
     ↓
Service
     ↓
Mongoose Model
     ↓
MongoDB
     ↓
Service
     ↓
Controller
     ↓
HTTP Response
```

## Routes

Routes define:

- HTTP methods.
- URL paths.
- Middleware order.
- Controller entry points.

Routes do not contain the application's main business logic.

Example:

```text
POST /api/tasks
       ↓
authenticateUser
       ↓
createTaskController
```

## Middleware

Middleware performs reusable request-level processing.

Authentication middleware:

1. Reads the JWT from the authentication cookie.
2. Verifies the JWT.
3. Extracts authenticated user information.
4. Places the identity on `req.user`.

## Controllers

Controllers handle HTTP concerns:

- Reading request data.
- Calling services.
- Sending responses.
- Passing errors to the centralized error handler.

## Services

Services contain application and business logic.

Current services include:

```text
activity_services.js
auth_services.js
dashboard_services.js
notification_services.js
reminder_scheduler.js
reminder_services.js
task_services.js
user_services.js
```

Some services are class-based where instance state or behavior is useful.

Current class-based components are:

```text
TaskService
NotificationService
QueueWorker
```

Not every service was converted into a class.

## Models

Mongoose models define MongoDB document structures.

Current models include:

```text
user_model.js
task_model.js
activity_model.js
notification_model.js
job_model.js
```

## Events

Task events allow activity and notification work to be separated from the primary task operation.

## Queue and Workers

The queue stores jobs in MongoDB.

The worker claims and processes jobs in the background.

```text
MongoDB Job
    ↓
QueueWorker
    ↓
Job Handler
    ↓
Service / File Operation
    ↓
completed or failed
```

---

# Data Models

## User

Application-specific fields include:

```text
name
email
role
createdAt
updatedAt
```

Passport-Local-Mongoose provides the fields and methods required for password authentication.

Roles:

```text
user
admin
```

## Task

```text
title
description
status
priority
dueDate
tags
owner
assignedTo
reminderSentAt
isOverdue
createdAt
updatedAt
```

## Activity

```text
type
task
user
message
createdAt
updatedAt
```

Current activity types include task-related operations such as:

```text
taskCreated
taskUpdated
taskAssigned
taskCompleted
```

## Notification

```text
user
type
task
message
read
createdAt
updatedAt
```

Current notification types:

```text
taskAssigned
taskCompleted
taskPriorityChanged
taskReminder
```

## Job

The background job document stores job lifecycle information such as:

```text
type
data
status
attempts
maxAttempts
leaseId
startedAt
completedAt
failedAt
error
createdAt
updatedAt
```

The exact fields are maintained by the queue implementation and support persistence, retries, leases, and failure tracking.

---

# API Reference

Base URL:

```text
https://127.0.0.1:3000/api
```

Unless otherwise stated, protected endpoints require authentication through the HttpOnly cookie.

## Health

```http
GET /api/health
```

Authentication:

```text
Not required
```

---

## Authentication

### Register

```http
POST /api/auth/register
```

Example:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

Normal registration creates:

```text
role = user
```

### Login

```http
POST /api/auth/login
```

Example:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

On success:

- JWT is generated.
- JWT is stored in the HttpOnly authentication cookie.
- User information is returned.
- JWT is not returned as a JSON field.

### Current User

```http
GET /api/auth/me
```

Authentication:

```text
Required
```

Used by the frontend to restore authentication after a page refresh.

### Logout

```http
POST /api/auth/logout
```

The server clears the authentication cookie.

---

# Tasks API

## Create Task

```http
POST /api/tasks
```

Authentication:

```text
Required
```

Example:

```json
{
  "title": "Finish API documentation",
  "description": "Document task endpoints",
  "status": "pending",
  "priority": "high",
  "dueDate": "2026-09-20",
  "tags": ["backend", "documentation"]
}
```

The owner is determined from the authenticated user.

## Get All Tasks

```http
GET /api/tasks
```

Authentication:

```text
Required
```

Example:

```http
GET /api/tasks?status=pending&priority=high&search=api&page=1&limit=10
```

## Get One Task

```http
GET /api/tasks/:id
```

Authentication:

```text
Required
```

## Update Task

```http
PUT /api/tasks/:id
```

Authentication:

```text
Required
```

## Delete Task

```http
DELETE /api/tasks/:id
```

Authentication:

```text
Required
```

## Assign Task

```http
PATCH /api/tasks/:id/assign
```

Authentication:

```text
Required
```

Example:

```json
{
  "assignedTo": "USER_ID"
}
```

Remove assignment:

```json
{
  "assignedTo": null
}
```

---

# Users API

## Get Users

```http
GET /api/users
```

Authentication:

```text
Required
```

Used by the frontend for task-assignment controls.

---

# Activities API

## Get Activities

```http
GET /api/activities
```

Authentication:

```text
Required
```

Returns the latest accessible activity records.

---

# Notifications API

## Get Notifications

```http
GET /api/notifications
```

Authentication:

```text
Required
```

## Mark One as Read

```http
PATCH /api/notifications/:id/read
```

Authentication:

```text
Required
```

## Mark All as Read

```http
PATCH /api/notifications/read-all
```

Authentication:

```text
Required
```

---

# Dashboard API

## Get Dashboard

```http
GET /api/dashboard
```

Authentication:

```text
Required
```

---

# Reports and Exports API

## Export Tasks as JSON

```http
GET /api/reports/tasks/json
```

Authentication:

```text
Required
```

Returns authorized tasks as a downloadable JSON file.

## Export Tasks as CSV

```http
GET /api/reports/tasks/csv
```

Authentication:

```text
Required
```

Returns authorized tasks as a downloadable CSV file.

## Start Background Task Report

```http
POST /api/reports/tasks/report
```

Authentication:

```text
Required
```

Returns `202 Accepted` with a job ID.

Example:

```json
{
  "success": true,
  "message": "Task report generation started",
  "jobId": "JOB_ID"
}
```

## Get Report Job Status

```http
GET /api/reports/jobs/:jobId
```

Authentication:

```text
Required
```

Possible states:

```text
pending
processing
completed
failed
```

## Download Completed Report

```http
GET /api/reports/jobs/:jobId/download
```

Authentication:

```text
Required
```

The report must be completed before it can be downloaded.

---

# Environment Variables

Create a local `.env` file in the project root.

Use `.env.example` as the template:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/task_management
CORS_ORIGIN=https://127.0.0.1:5500
JWT_SECRET=your-secret
COOKIE_SECURE=true
```

| Variable | Purpose |
|---|---|
| `PORT` | HTTPS backend port |
| `MONGODB_URI` | MongoDB connection string |
| `CORS_ORIGIN` | Allowed frontend origin |
| `JWT_SECRET` | Secret used to sign and verify JWTs |
| `COOKIE_SECURE` | Controls the cookie Secure option |

`PORT`, `MONGODB_URI`, `CORS_ORIGIN`, and `JWT_SECRET` are required by startup environment validation.

`COOKIE_SECURE` is optional; when supplied, it must be `true` or `false`.

Never commit:

```text
.env
```

---

# Prerequisites

Install the following before running the project:

- Node.js
- npm
- MongoDB
- VS Code
- VS Code Live Server extension
- mkcert

Verify Node.js and npm:

```bash
node -v
npm -v
```

MongoDB must be running before the backend starts.

The default local MongoDB database used by the example configuration is:

```text
mongodb://localhost:27017/task_management
```

---

# Installation

## 1. Clone or extract the project

Open the project root in VS Code.

The project root is the directory containing:

```text
package.json
client/
server/
certs/
.env.example
```

## 2. Install dependencies

From the project root:

```bash
npm install
```

## 3. Create `.env`

Create:

```text
.env
```

Copy the required variables from `.env.example` and fill in the local values.

Example:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/task_management
CORS_ORIGIN=https://127.0.0.1:5500
JWT_SECRET=replace-with-a-local-secret
COOKIE_SECURE=true
```

## 4. Set up local HTTPS

Follow the [Local HTTPS Setup](#local-https-setup) section before starting the application.

## 5. Make sure MongoDB is running

The backend connects to MongoDB during startup.

## 6. Start the backend

Run:

```bash
npm run dev
```

## 7. Start the frontend

Open the `client` directory with VS Code and start Live Server.

The expected frontend address is:

```text
https://127.0.0.1:5500
```

---

# Running the Project

This section contains the normal day-to-day startup procedure.

## Step 1 — Start MongoDB

Make sure the local MongoDB service/server is running.

The default application connection is:

```text
mongodb://localhost:27017/task_management
```

## Step 2 — Start the backend

From the project root:

```bash
npm run dev
```

The backend uses:

```text
https://127.0.0.1:3000
```

Startup responsibilities include:

```text
MongoDB connection
       ↓
Reminder scheduler
       ↓
Background queue worker
       ↓
HTTPS server
```

A successful startup is expected to include messages similar to:

```text
Database connected successfully
Task reminder scheduler started
Background job worker started
HTTPS server is running on https://127.0.0.1:3000
```

## Step 3 — Start the frontend

In VS Code:

1. Open the `client` folder.
2. Open `client/index.html`.
3. Start **Live Server**.
4. Open:

```text
https://127.0.0.1:5500
```

## Step 4 — Use the application

From the frontend you can:

1. Register a user.
2. Log in.
3. Create and manage tasks.
4. Assign tasks.
5. Use filtering/search/sorting/pagination.
6. Move editable tasks through the Kanban board.
7. View activities, notifications, and dashboard data.
8. Export tasks.
9. Generate and download background reports.

## Hostname Rule

Use the same browser-facing hostname consistently.

The current setup uses:

```text
127.0.0.1
```

for both frontend and backend.

Avoid mixing:

```text
127.0.0.1
```

and:

```text
localhost
```

for the browser-facing frontend/API combination because cookie and origin behavior can differ.

MongoDB can still use:

```text
localhost
```

because it is a separate database connection.

## Stop the Project

Stop the backend with:

```text
Ctrl + C
```

Stop Live Server through the VS Code Live Server controls.

---

# Local HTTPS Setup

HTTPS certificates are intended for local development only.

They are not production certificates.

## 1. Install mkcert

Install `mkcert` for your operating system.

Then run:

```bash
mkcert -install
```

## 2. Create the Certificate Directory

From the project root:

```bash
mkdir certs
```

## 3. Generate the Certificates

Run:

```bash
mkcert localhost 127.0.0.1
```

The generated files should match the paths expected by the backend:

```text
certs/localhost+2.pem
certs/localhost+2-key.pem
```

The backend reads these files from:

```text
./certs/localhost+2.pem
./certs/localhost+2-key.pem
```

## 4. Backend HTTPS

The backend uses Node's `https` module:

```text
Certificate
     +
Private Key
     ↓
https.createServer()
     ↓
Express Application
```

## 5. Frontend HTTPS

VS Code Live Server is configured to use the local certificate and key.

Machine-specific configuration belongs in:

```text
.vscode/settings.json
```

The repository ignores `.vscode/`, so these local paths are not intended to be committed.

## 6. Keep Certificates Out of Git

The following are ignored:

```text
certs/
.vscode/
```

Never commit private development keys.

---

# Live Server Development Configuration

The project generates report files under:

```text
server/reports/exports/
```

VS Code Live Server can otherwise detect generated backend files and reload the frontend during development.

That can interrupt the frontend's report-status polling before the completed report reaches the download request.

The workspace Live Server configuration should therefore ignore the backend directory.

In:

```text
.vscode/settings.json
```

use:

```json
{
    "liveServer.settings.host": "127.0.0.1",

    "liveServer.settings.https": {
        "enable": true,
        "cert": "C:/path/to/project/certs/localhost+2.pem",
        "key": "C:/path/to/project/certs/localhost+2-key.pem",
        "passphrase": ""
    },

    "liveServer.settings.ignoreFiles": [
        "**/server/**"
    ]
}
```

Replace the certificate paths with the paths on the local machine.

This configuration is development-specific and should remain local because `.vscode/` is ignored by Git.

The important setting for report generation is:

```json
"liveServer.settings.ignoreFiles": [
    "**/server/**"
]
```

Nodemon's `--ignore` settings and Live Server's `ignoreFiles` setting solve different problems:

```text
Nodemon ignore
    ↓
Prevents backend restart

Live Server ignore
    ↓
Prevents frontend browser reload
```

---

# Testing with Postman

Postman can be used to test the authenticated API independently of the frontend.

Because authentication uses an HttpOnly cookie, Postman must retain the cookie returned by the login response.

## Register

```http
POST https://127.0.0.1:3000/api/auth/register
```

Example:

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

## Login

```http
POST https://127.0.0.1:3000/api/auth/login
```

Example:

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

After login, retain the authentication cookie.

## Check Current User

```http
GET https://127.0.0.1:3000/api/auth/me
```

## Test Protected Tasks

```http
GET https://127.0.0.1:3000/api/tasks
```

## Test Report Generation

```http
POST https://127.0.0.1:3000/api/reports/tasks/report
```

Then poll:

```http
GET https://127.0.0.1:3000/api/reports/jobs/JOB_ID
```

When the job reaches:

```text
completed
```

request:

```http
GET https://127.0.0.1:3000/api/reports/jobs/JOB_ID/download
```

---

# Frontend Usage

## Authentication

The frontend restores the session through:

```text
GET /api/auth/me
```

The browser automatically sends the HttpOnly authentication cookie.

The frontend keeps application-level user information in memory.

## Task Management

The frontend supports:

- Creating tasks.
- Viewing accessible tasks.
- Editing tasks.
- Deleting permitted tasks.
- Assigning tasks.
- Removing assignments.
- Filtering tasks.
- Searching tasks.
- Sorting tasks.
- Paginating results.
- Switching between task views.
- Moving editable tasks through the Kanban board.

## Notifications and Activities

Users can view:

- Recent activities.
- In-app notifications.
- Unread notification state.
- Read notifications.

## Dashboard

The frontend displays backend-calculated dashboard information instead of independently calculating the authoritative statistics from the task list.

## Reports

The report workflow is:

```text
Generate Report
      ↓
Background Job
      ↓
Frontend Polling
      ↓
Job Completed
      ↓
Download Request
      ↓
Browser Download
```

---

# Request and Background Flows

## Creating a Task

```text
1. User submits task form
            ↓
2. app.js handles UI event
            ↓
3. api.js sends POST /api/tasks
            ↓
4. Browser sends authentication cookie
            ↓
5. authenticateUser verifies JWT
            ↓
6. Task controller receives authenticated request
            ↓
7. TaskService applies task business logic
            ↓
8. MongoDB task document is created
            ↓
9. Task-created event is emitted
            ↓
10. Activity/notification listeners react where applicable
            ↓
11. Background jobs are added
            ↓
12. HTTP response returns to frontend
            ↓
13. QueueWorker processes background jobs
            ↓
14. Secondary records are persisted
```

## Protected Task Request

```text
GET /api/tasks
      ↓
Authentication Cookie
      ↓
JWT Verification
      ↓
req.user
      ↓
Task Controller
      ↓
TaskService
      ↓
Authorization Query
      ↓
MongoDB
```

## Kanban Status Change

```text
Drag Task
    ↓
Kanban Drop Zone
    ↓
PUT /api/tasks/:id
    ↓
TaskService
    ↓
MongoDB
    ↓
Successful Response
    ↓
Reload Tasks
    ↓
Update Frontend State
    ↓
Render Kanban
```

The backend remains the source of truth.

## Background Reminder Flow

```text
Server Starts
      ↓
Reminder Scheduler Starts
      ↓
Initial Reminder Check
      ↓
setInterval()
      ↓
Periodic Reminder Check
      ↓
Find Relevant Tasks
      ↓
┌─────────────────────┐
│                     │
Upcoming           Past Due
│                     │
↓                     ↓
Notification Job   isOverdue = true
│
↓
Background Queue
│
↓
QueueWorker
│
↓
NotificationService
│
↓
MongoDB
```

## Activity Job

```text
Task Operation
      ↓
Task Event
      ↓
Activity Listener
      ↓
addJob({
    type: "activity"
})
      ↓
MongoDB Queue
      ↓
QueueWorker
      ↓
Job Handler
      ↓
Activity Service
      ↓
MongoDB
```

## Notification Job

```text
Task Operation
      ↓
Task Event
      ↓
Notification Listener
      ↓
addJob({
    type: "notification"
})
      ↓
MongoDB Queue
      ↓
QueueWorker
      ↓
Job Handler
      ↓
NotificationService
      ↓
MongoDB
```

## Background Report Flow

```text
Generate Report
      ↓
POST /api/reports/tasks/report
      ↓
Report Controller
      ↓
Create report job
      ↓
202 Accepted + jobId
      ↓
MongoDB Queue
      ↓
QueueWorker
      ↓
Job Handler
      ↓
generateTaskReport()
      ↓
Authorization-aware task query
      ↓
Build Report
      ↓
writeFile()
      ↓
Store file result on completed job
      ↓
Frontend polls job status
      ↓
GET /api/reports/jobs/:jobId/download
      ↓
createReadStream()
      ↓
Browser Download
```

---

# Important Design Decisions

## Controllers vs Services

Business logic is kept out of routes and minimized in controllers.

This separates HTTP concerns from application logic.

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Model / infrastructure
```

## Class Usage

Classes are used where instance behavior or state provides a meaningful benefit.

Current class-based components:

```text
TaskService
NotificationService
QueueWorker
```

Not every service was converted into a class simply for consistency.

## Backend Authorization

Authorization is enforced on the server.

Hiding a frontend button does not provide security.

The backend must reject unauthorized requests even if a user manually sends them.

## Backend Filtering

Task filtering is performed through MongoDB queries.

This avoids retrieving every task and filtering the entire collection in the browser.

## Authentication State vs Credential

The frontend stores:

```text
currentUser
```

in memory.

The JWT remains inside:

```text
HttpOnly Cookie
```

This separates UI state from the authentication credential.

## Event-Driven Secondary Actions

Activity and notification behavior is triggered through task events rather than tightly coupling every secondary operation to the primary task service.

## MongoDB-Backed Queue

The queue is persisted in MongoDB rather than held only in process memory.

This allows queued work to survive a Node.js process restart and provides a persistent location for job state.

## Reminder Scheduler vs Reminder Service

The scheduler determines:

```text
WHEN
```

The reminder service determines:

```text
WHAT
```

The queue worker determines:

```text
HOW background work is executed
```

## Overdue as Separate State

`isOverdue` is separate from task `status`.

This allows:

```text
status = pending
isOverdue = true
```

without adding `overdue` to the workflow statuses.

## Backend as Source of Truth

For state-changing UI operations such as Kanban status changes, the frontend reloads authoritative API data after the backend update instead of relying on a manually mutated DOM element.

## Local HTTPS

HTTPS is enabled during local development to support Secure-cookie behavior and provide a development environment closer to secure deployment conditions.

---

# Development Commands

Install dependencies:

```bash
npm install
```

Start the backend in development mode:

```bash
npm run dev
```

Start the backend without Nodemon:

```bash
npm start
```

Run the current test script:

```bash
npm test
```

Check Node.js/npm versions:

```bash
node -v
npm -v
```

> `npm test` currently uses the placeholder test script from `package.json`; a dedicated automated test suite has not yet been added.

---

# Git Workflow

Typical workflow:

```bash
git status
git add .
git commit -m "type: describe change"
git log -1 --oneline
```

Examples:

```text
feat: add notification foundation
feat: move JWT authentication to HttpOnly cookies
feat: enable HTTPS for local development
feat: add task reminders and overdue tracking
feat: add background job queue
feat: add retry and failure handling
feat: add task exports and background reports
fix: prevent kanban task duplication
fix: stabilize frontend session state
fix: prevent live server reload during report generation
```

Generated files, environment secrets, certificates, and machine-specific VS Code configuration are excluded through `.gitignore`.

---

# Planned Extensions

The following are intentionally outside the current implementation.

## Automated Testing

A dedicated automated test suite can be added for:

- Unit tests.
- API integration tests.
- Authentication tests.
- Authorization tests.
- Task service tests.
- Reminder edge cases.
- Scheduler behavior.
- Queue worker behavior.
- Retry/failure behavior.
- Report generation.
- Report access control.

## Controlled Queue Concurrency

The current worker processes one job at a time.

A future implementation could introduce controlled concurrency, for example:

```text
Maximum concurrency = 2

Job 1 ──────────────→ completed
Job 2 ──────────────→ completed
Job 3 waits
              ↓
           Job 3 starts
```

This would require additional worker-state and concurrency management.

## External Queue Infrastructure

The current queue is intentionally MongoDB-backed.

A future production-oriented implementation could evaluate:

```text
Redis
BullMQ
```

The MongoDB queue is currently the project's learning-focused implementation.

## Email Notifications

The current notification system is in-app only.

A future extension could add SMTP/Nodemailer-based email delivery.

## Activity and Notification Pagination

Activity and notification endpoints currently return the latest 50 records.

Full pagination can be added if the UI later requires browsing older records.

---

# Learning Objectives

The project is also a JavaScript and Node.js learning application.

## JavaScript

Concepts covered include:

```text
ES modules
imports / exports
objects
arrays
destructuring
map()
filter()
find()
includes()
reduce()
sort()
callbacks
closures
functions as first-class values
this
classes
constructors
method references
bind()
Promises
async/await
Promise.all()
error propagation
event-driven programming
timers
setInterval()
queues
workers
job state management
retry logic
backoff
Promise rejection
finally
encapsulation
```

## Node.js

Concepts include:

```text
Node runtime
HTTP / HTTPS servers
filesystem APIs
EventEmitter
asynchronous operations
timers
event loop
background processing
job queues
workers
retry handling
streams
createWriteStream()
createReadStream()
stream backpressure
CSV generation
JSON serialization
file downloads
```

## Express

Concepts include:

```text
routing
middleware
controllers
request / response handling
status codes
JSON APIs
authentication middleware
authorization
CORS
centralized error handling
```

## MongoDB / Mongoose

Concepts include:

```text
schemas
models
CRUD
queries
query operators
ObjectIds
references
population
filtering
sorting
pagination
aggregation-style calculations
timestamps
cursor-based processing
```

## Authentication

Concepts include:

```text
password hashing
Passport-Local-Mongoose
password verification
JWT
cookies
HttpOnly
Secure cookies
HTTPS
CORS credentials
authentication middleware
authorization
roles
session restoration
```

## Asynchronous Programming

The project progressively introduces:

```text
Promises
async/await
Promise.all()
event-driven callbacks
timers
setInterval()
event loop behavior
background processing
queues
workers
job states
retry behavior
backoff
streams
```

A key learning goal is understanding not only how asynchronous code works, but why a particular asynchronous design is appropriate for a particular problem.

---

# Known Limitations

The current application is a development-focused learning project rather than a production deployment.

Current limitations include:

- A dedicated automated test suite is not yet implemented.
- Manual/integration testing still needs to cover the complete application systematically.
- Notifications are currently in-app only.
- Email/SMTP delivery is not implemented.
- The current worker processes jobs sequentially.
- Controlled queue concurrency is not implemented.
- Local HTTPS uses development certificates.
- Certificate and VS Code paths are machine-specific.
- The application currently uses a local MongoDB configuration.
- The reminder scheduler runs inside the Node.js application process.
- Activity and notification endpoints return a bounded latest-50 result rather than full pagination.
- Background report generation builds the complete report object in memory.
- Multi-instance/distributed scheduler coordination is not implemented.
- The current project is not configured as a production deployment.

These are extension points for later development rather than blockers to the current learning implementation.

---

# Error Handling

The backend uses centralized application error handling.

Custom application errors cover common categories such as:

```text
ValidationError
NotFoundError
AuthorizationError
ConflictError
```

Route handlers are wrapped with `asyncHandler`, allowing rejected promises to reach the central Express error middleware.

The API uses a consistent error response shape:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

The frontend API layer reads the same error structure and converts failed responses into JavaScript `Error` objects with the relevant HTTP status and application error code attached.

This keeps normal controllers focused on successful request handling while unexpected errors are handled centrally.

---

# Security Notes

For local development:

- Keep `.env` out of Git.
- Keep private certificate keys out of Git.
- Use HTTPS when testing Secure-cookie behavior.
- Keep frontend and backend browser-facing origins consistent.
- Do not move the JWT back into `localStorage`.
- Treat backend authorization as the actual security boundary.
- Do not trust ownership or role values supplied by the frontend.
- Do not expose private certificate keys or secrets in source control.

The current browser authentication model is:

```text
JWT
 ↓
HttpOnly + Secure Cookie
 ↓
HTTPS Request
 ↓
Authentication Middleware
 ↓
req.user
 ↓
Protected Controller
```

---

# Project Structure

```text
task-management-system/
│
├── client/
│   ├── css/
│   │   └── style.css
│   │
│   ├── js/
│   │   ├── api.js
│   │   ├── app.js
│   │   ├── auth.js
│   │   ├── render.js
│   │   ├── router.js
│   │   └── state.js
│   │
│   └── index.html
│
├── server/
│   └── src/
│       ├── app.js
│       │
│       ├── config/
│       │   ├── database.js
│       │   └── env.js
│       │
│       ├── controllers/
│       │   ├── activity_controller.js
│       │   ├── auth_controller.js
│       │   ├── dashboard_controller.js
│       │   ├── notification_controller.js
│       │   ├── report_controller.js
│       │   ├── task_controller.js
│       │   └── user_controller.js
│       │
│       ├── errors/
│       │   └── app_error.js
│       │
│       ├── events/
│       │   ├── task_activity_listener.js
│       │   ├── task_events.js
│       │   └── task_notification_listener.js
│       │
│       ├── middleware/
│       │   ├── auth_middleware.js
│       │   └── error_middleware.js
│       │
│       ├── models/
│       │   ├── activity_model.js
│       │   ├── job_model.js
│       │   ├── notification_model.js
│       │   ├── task_model.js
│       │   └── user_model.js
│       │
│       ├── queue/
│       │   ├── job_queue.js
│       │   └── job_types.js
│       │
│       ├── reports/
│       │   └── report_service.js
│       │
│       ├── routes/
│       │   ├── activity_routes.js
│       │   ├── auth_routes.js
│       │   ├── dashboard_routes.js
│       │   ├── notification_routes.js
│       │   ├── report_routes.js
│       │   ├── task_routes.js
│       │   └── user_routes.js
│       │
│       ├── services/
│       │   ├── activity_services.js
│       │   ├── auth_services.js
│       │   ├── dashboard_services.js
│       │   ├── notification_services.js
│       │   ├── reminder_scheduler.js
│       │   ├── reminder_services.js
│       │   ├── task_services.js
│       │   └── user_services.js
│       │
│       ├── utils/
│       │   ├── async_handler.js
│       │   └── retry.js
│       │
│       ├── workers/
│       │   ├── job_handlers.js
│       │   └── queue_worker.js
│       │
│       └── server.js
│
├── certs/                  # Local HTTPS certificates, ignored by Git
├── .env
├── .env.example
├── .gitignore
├── package.json
└── package-lock.json
```

Generated report files are created at runtime under:

```text
server/reports/exports/
```

That directory is ignored by Git and does not need to exist in the repository checkout.

---

# Project Philosophy

The project is intentionally structured so that architecture is introduced when it becomes useful rather than creating every possible infrastructure layer from the beginning.

The application evolved around actual requirements:

```text
Task CRUD
    ↓
Query System
    ↓
Authentication
    ↓
Authorization
    ↓
Task Assignment
    ↓
Events
    ↓
Notifications
    ↓
Dashboard
    ↓
Timers / Reminders
    ↓
Overdue Tracking
    ↓
Background Job Queue
    ↓
Retry / Failure Handling
    ↓
Background Worker
    ↓
File Exports / Reports
    ↓
Service Classes
    ↓
Frontend / Reliability Cleanup
```

The current project stage is:

```text
Feature Implementation
        ↓
Architecture Cleanup
        ↓
UI / State Reliability Fixes
        ↓
Manual / Integration Testing
        ↓
Final UI Polish
```

The goal is to learn the reasoning behind each layer while keeping the implementation understandable and project-focused.

---

# License

This project is currently a personal learning project.

No production license has been defined yet.
