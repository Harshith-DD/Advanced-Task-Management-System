# Advanced Task Management System

A full-stack task management application built with **JavaScript, Node.js, Express.js, MongoDB, Mongoose, and a vanilla JavaScript frontend**.

The project is designed as a practical JavaScript and Node.js learning application. It demonstrates how a simple task CRUD system can evolve into an application with backend querying, authentication, authorization, task assignment, event-driven architecture, notifications, dashboards, time-based background processing, and an in-memory background job queue.

> **Current status:** The application includes task management, backend filtering/search/sorting/pagination, authentication and authorization, task assignment, activity logging, in-app notifications, dashboard statistics, reminders, overdue tracking, a periodic reminder scheduler, and an in-memory background job queue with a continuously running worker, retry handling, exponential backoff, and permanent failure handling.

---

## Table of Contents

* [Project Overview](#project-overview)
* [Core Specifications](#core-specifications)
* [Current Features](#current-features)
* [Technology Stack](#technology-stack)
* [Architecture](#architecture)
* [Project Structure](#project-structure)
* [Data Models](#data-models)
* [Authentication and Security](#authentication-and-security)
* [Task Access Rules](#task-access-rules)
* [Task Querying](#task-querying)
* [Event-Driven Features](#event-driven-features)
* [Notifications](#notifications)
* [Reminders and Overdue Tasks](#reminders-and-overdue-tasks)
* [Background Job Queue](#background-job-queue)
* [Retry and Failure Handling](#retry-and-failure-handling)
* [Dashboard](#dashboard)
* [API Reference](#api-reference)
* [Environment Variables](#environment-variables)
* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [Running the Project](#running-the-project)
* [Local HTTPS Setup](#local-https-setup)
* [Testing with Postman](#testing-with-postman)
* [Frontend Usage](#frontend-usage)
* [Request Flow](#request-flow)
* [Background Reminder Flow](#background-reminder-flow)
* [Background Job Flow](#background-job-flow)
* [Important Design Decisions](#important-design-decisions)
* [Development Commands](#development-commands)
* [Git Workflow](#git-workflow)
* [Planned Extensions](#planned-extensions)
* [Learning Objectives](#learning-objectives)
* [Known Limitations](#known-limitations)
* [Security Notes](#security-notes)
* [Project Philosophy](#project-philosophy)
* [License](#license)

---

# Project Overview

The Advanced Task Management System provides authenticated users with a task-management workspace.

Users can:

* Register and log in.
* Create tasks.
* View tasks they are allowed to access.
* Update and delete permitted tasks.
* Assign tasks to users.
* Search and filter tasks.
* Sort and paginate task results.
* View task activities.
* Receive in-app notifications.
* Mark notifications as read.
* View dashboard statistics.
* Receive reminders for upcoming tasks.
* See tasks marked as overdue.

Administrators have broader access to tasks and can manage tasks across users.

The backend follows a layered structure instead of placing database logic directly inside route handlers.

The main request flow is:

```text
HTTP Request
     ↓
Express Route
     ↓
Authentication Middleware
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

Secondary actions such as activity logging and notifications are separated from the primary task operation through events and background jobs.

Time-based functionality is handled separately through a background scheduler and job queue:

```text
Server Startup
     ↓
Reminder Scheduler
     ↓
Reminder Service
     ↓
Background Job Queue
     ↓
Queue Worker
     ↓
Notification Service
     ↓
MongoDB
```

---

# Core Specifications

## Task Management

Each task supports:

* `title`
* `description`
* `status`
* `priority`
* `dueDate`
* `tags`
* `owner`
* `assignedTo`
* `reminderSentAt`
* `isOverdue`
* `createdAt`
* `updatedAt`

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

## Task Retrieval

The task API supports combinations of:

* Status filtering
* Priority filtering
* Text search
* Tag filtering
* Due-date range filtering
* Sorting
* Pagination

---

## Users

The system supports:

* User registration
* User login
* User roles
* Task ownership
* Task assignment

Current roles:

```text
user
admin
```

---

## Authentication

Browser authentication uses:

* Passport-Local-Mongoose
* JWT
* HttpOnly cookies
* Secure cookies
* HTTPS during local development
* `/api/auth/me` for session restoration

The JWT is not stored in browser `localStorage`.

---

## Events

Task operations emit events that can be consumed by independent listeners.

Current event-related behavior includes:

* Activity job creation
* Notification job creation

---

## Dashboard

The dashboard provides:

* Total tasks
* Completed tasks
* Pending tasks
* Overdue tasks
* Tasks grouped by priority
* Recent activity

Dashboard calculations are performed by the backend.

---

## Reminders

The application includes time-based task processing.

The reminder system:

* Detects tasks approaching their due date.
* Queues an in-app reminder notification as a background job.
* Prevents duplicate reminders.
* Marks incomplete tasks as overdue once their due date passes.
* Runs automatically through a periodic background scheduler.

The current reminder window is **one hour before the task's due date**.

---

## Background Jobs

The application includes an in-memory background job queue.

Background jobs are used to move secondary work away from the primary task operation.

Current background job types include:

```text
activity
notification
report
```

The `report` job type is reserved for the future report-generation functionality planned for M10.

Currently implemented background jobs are:

```text
activity
notification
```

A continuously running worker consumes pending jobs and tracks their lifecycle:

```text
pending
   ↓
processing
   ↓
completed
```

Failed jobs are represented by:

```text
failed
```

with the associated error stored on the job.

---

# Current Features

## 1. Task CRUD

Create, read, update, and delete tasks.

---

## 2. Ownership

New tasks are associated with the authenticated user on the backend.

The frontend does not decide who owns a newly created task.

Conceptually:

```text
Authenticated Request
        ↓
req.user.userId
        ↓
Task.owner
```

---

## 3. Task Assignment

Tasks can be assigned to another user.

Endpoint:

```http
PATCH /api/tasks/:id/assign
```

Assignments can also be removed.

The backend validates the target user and applies authorization rules before changing the assignment.

---

## 4. Search

Search applies to:

* Task title
* Task description

Search is performed by MongoDB rather than retrieving the entire collection and filtering it in the browser.

---

## 5. Filtering

Supported filters include:

* Status
* Priority
* Tags
* Due-date range

Example:

```text
/api/tasks?status=pending&priority=high
```

---

## 6. Sorting

Supported task sort fields include:

```text
createdAt
updatedAt
dueDate
priority
```

Supported directions:

```text
asc
desc
```

The backend validates the requested sort field against an allowed list.

---

## 7. Pagination

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

## 8. Activity Log

Task operations create activity records through the event system.

The task service emits events and the activity listener reacts to them.

The activity listener places an activity job into the background queue.

Conceptually:

```text
Task Event
    ↓
Activity Listener
    ↓
addJob()
    ↓
Background Queue
    ↓
Queue Worker
    ↓
createActivity()
    ↓
MongoDB
```

This keeps activity creation separate from the primary task operation.

---

## 9. Notifications

The notification system is currently **in-app only**.

Current notification types include:

```text
taskAssigned
taskCompleted
taskPriorityChanged
taskReminder
```

Users can:

* View notifications.
* See unread notifications.
* Mark one notification as read.
* Mark all notifications as read.

Notification creation is performed through the background job queue.

Email/SMTP delivery is not currently implemented.

---

## 10. Dashboard

Dashboard information is calculated on the backend.

The dashboard includes:

```text
total
completed
pending
overdue
byPriority
recentActivity
```

Normal users receive statistics based on tasks they can access.

Administrators have broader task visibility.

---

## 11. Role-Based Access

The system supports:

```text
user
admin
```

Normal users are restricted to tasks they own or are assigned to.

Administrators have broader access.

Authorization is enforced by the backend and is not dependent on frontend UI visibility.

---

## 12. Task Reminders

Tasks with a due date approaching within the reminder window can generate a reminder notification.

The current reminder window is:

```text
1 hour
```

The system uses:

```text
reminderSentAt
```

to prevent the same task from generating repeated reminder notifications.

Reminder notifications are queued as background jobs instead of being created directly by the reminder service.

---

## 13. Overdue Tracking

Overdue state is stored separately from the task's workflow status.

The task status remains:

```text
pending
in-progress
completed
```

while overdue state is represented by:

```text
isOverdue
```

This allows a task to remain `pending` or `in-progress` while also being overdue.

Completed tasks are not treated as overdue reminders.

---

# Technology Stack

| Layer                          | Technology                    |
| ------------------------------ | ----------------------------- |
| Runtime                        | Node.js                       |
| Backend framework              | Express.js                    |
| Database                       | MongoDB                       |
| ODM                            | Mongoose                      |
| Authentication                 | JWT                           |
| Password authentication        | Passport-Local-Mongoose       |
| Browser authentication storage | HttpOnly cookie               |
| Local transport security       | HTTPS                         |
| HTTP cookies                   | cookie-parser                 |
| CORS                           | cors                          |
| Environment configuration      | dotenv                        |
| Development server             | nodemon                       |
| Frontend                       | HTML, CSS, vanilla JavaScript |
| Event system                   | Node.js EventEmitter          |
| Background queue               | In-memory JavaScript queue    |
| Background worker              | Async Node.js worker          |
| Timers                         | `setInterval()`               |
| Package format                 | ES Modules                    |

### Main Dependencies

```text
express
mongoose
jsonwebtoken
passport-local-mongoose
cookie-parser
cors
dotenv
```

### Development Dependency

```text
nodemon
```

---

# Architecture

The backend uses a layered architecture.

## Routes

Routes define:

* HTTP methods
* URL paths
* Middleware order
* Controller entry points

Routes should not contain database queries or large business rules.

Example:

```text
POST /api/tasks
        ↓
authenticateUser
        ↓
createTaskController
```

---

## Middleware

Middleware performs reusable request-level processing.

The authentication middleware:

1. Reads the JWT from the authentication cookie.
2. Verifies the token.
3. Extracts the authenticated user information.
4. Places that information on:

```js
req.user
```

Protected controllers can then use the authenticated identity.

---

## Controllers

Controllers handle the HTTP layer.

They are responsible for:

* Reading request data
* Calling services
* Sending responses
* Handling controller-level errors

Controllers should not contain the application's complete business logic.

---

## Services

Services contain application and business logic.

Current services include:

```text
auth_services.js
task_services.js
user_services.js
activity_services.js
notification_services.js
dashboard_services.js
reminder_services.js
reminder_scheduler.js
```

The reminder service determines **what reminder processing should do**.

The scheduler determines **when reminder processing should run**.

This separation is intentional.

---

## Models

Mongoose models define MongoDB document structures and provide database operations.

Current models include:

```text
user_model.js
task_model.js
activity_model.js
notification_model.js
```

---

## Events

The event system separates secondary actions from the primary task operation.

Example:

```text
Task Updated
     ↓
Task Event
     ├── Activity Listener
     │       ↓
     │   Activity Job
     │
     └── Notification Listener
             ↓
        Notification Job
```

---

## Queue

The background queue stores jobs in memory.

Each job contains information such as:

```text
id
type
data
status
attempts
maxAttempts
createdAt
startedAt
completedAt
failedAt
error
```

The queue currently supports:

```text
addJob()
getNextJob()
updateJobStatus()
getJobs()
```

Jobs remain in the application process memory and are lost if the server process stops.

---

## Worker

The queue worker continuously checks for pending jobs.

The current worker processes jobs asynchronously and updates their lifecycle state.

Conceptually:

```text
Pending Job
    ↓
Worker
    ↓
processing
    ↓
Job Handler
    ↓
completed
```

If the handler throws an error:

```text
processing
    ↓
failed
```

The worker is intentionally separate from the reminder scheduler.

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
│   │   └── state.js
│   │
│   └── index.html
│
├── server/
│   └── src/
│       ├── config/
│       │   └── database.js
│       │
│       ├── controllers/
│       │   ├── activity_controller.js
│       │   ├── auth_controller.js
│       │   ├── dashboard_controller.js
│       │   ├── notification_controller.js
│       │   ├── task_controller.js
│       │   └── user_controller.js
│       │
│       ├── events/
│       │   ├── task_activity_listener.js
│       │   ├── task_events.js
│       │   └── task_notification_listener.js
│       │
│       ├── middleware/
│       │   └── auth_middleware.js
│       │
│       ├── models/
│       │   ├── activity_model.js
│       │   ├── notification_model.js
│       │   ├── task_model.js
│       │   └── user_model.js
│       │
│       ├── queue/
│       │   ├── job_queue.js
│       │   └── job_types.js
│       │
│       ├── routes/
│       │   ├── activity_routes.js
│       │   ├── auth_routes.js
│       │   ├── dashboard_routes.js
│       │   ├── notification_routes.js
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
│       ├── workers/
│       │   ├── job_handlers.js
│       │   └── queue_worker.js
│       │
│       └── server.js
│
├── certs/
│   └── # Local HTTPS certificates, ignored by Git
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── package-lock.json
```

### Frontend Responsibilities

#### `app.js`

Coordinates application behavior:

```text
User Action
    ↓
Event Handler
    ↓
API Call
    ↓
State Update
    ↓
UI Rendering
```

#### `api.js`

Central frontend API layer.

It handles communication with the Express backend and sends:

```text
credentials: "include"
```

so the browser can send the authentication cookie.

#### `auth.js`

Maintains the current authenticated user in frontend memory.

It does not store the JWT in `localStorage`.

#### `state.js`

Stores frontend application state such as:

* Tasks
* Users
* Notifications
* Dashboard
* Filters
* Pagination

#### `render.js`

Converts application state/data into UI elements.

It renders:

* Tasks
* Dashboard
* Activities
* Notifications
* Assignment controls
* Overdue task indicators

#### Backend Responsibilities

```text
routes       → HTTP endpoint definitions
controllers  → HTTP request/response handling
services     → business logic
models       → MongoDB data structures
middleware   → reusable request processing
events       → task event definitions/listeners
queue        → background job storage and lifecycle
workers      → background job execution
config       → infrastructure configuration
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

Passport-Local-Mongoose adds the fields required for password authentication.

Roles:

```text
user
admin
```

---

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

### Status

```text
pending
in-progress
completed
```

### Priority

```text
low
medium
high
```

### Reminder Fields

```text
reminderSentAt
isOverdue
```

`reminderSentAt` records whether the task has already generated its reminder.

`isOverdue` represents whether an incomplete task has passed its due date.

---

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

---

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

---

# Authentication and Security

The authentication flow is:

```text
Register
    ↓
Passport-Local-Mongoose
    ↓
Password hash stored in MongoDB
```

Login:

```text
Email + Password
       ↓
User.authenticate()
       ↓
Password verification
       ↓
JWT creation
       ↓
HttpOnly Cookie
       ↓
Browser
```

Protected request:

```text
Browser
   ↓
Cookie automatically sent
   ↓
Authentication Middleware
   ↓
JWT Verification
   ↓
req.user
   ↓
Controller
```

---

## Passport-Local-Mongoose

Passport-Local-Mongoose handles username/password authentication and password hashing.

The application uses the user's email as the username field.

This removes the need for custom password hashing and verification logic.

---

## JWT

The JWT contains authenticated identity information such as:

```text
userId
role
```

The backend verifies the JWT before allowing access to protected routes.

---

## HttpOnly Cookies

The JWT is not stored in:

```text
localStorage
```

Instead, it is stored in an HttpOnly cookie.

This means JavaScript running in the page cannot directly read the JWT.

The frontend therefore stores only the current user's application state in memory.

---

## HTTPS

HTTPS protects data while it travels between the browser and backend.

The local project uses HTTPS for development so the Secure authentication cookie can be used.

---

## Cookie Configuration

The authentication cookie uses settings such as:

```text
httpOnly: true
secure: true
sameSite: lax
```

The Secure behavior is controlled through:

```env
COOKIE_SECURE=true
```

---

# Task Access Rules

Authorization is enforced by the backend.

The frontend is not treated as the security boundary.

## Normal User

A normal user can access tasks associated with them through ownership or assignment.

Conceptually:

```text
owner == current user
OR
assignedTo == current user
```

## Administrator

Administrators have broader access to tasks.

Their task queries can operate across the task collection.

## Ownership

When a task is created, the owner is taken from:

```js
req.user.userId
```

rather than trusting an owner ID supplied by the frontend.

---

# Task Querying

The task list API supports multiple query parameters.

Example:

```text
/api/tasks?status=pending&priority=high&search=api&page=1&limit=10
```

## Supported Query Parameters

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

## Search

Search checks:

```text
title
description
```

## Date Filtering

The API supports:

```text
fromDate
toDate
```

for due-date range filtering.

## Sorting

Supported fields:

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

## Pagination

Pagination uses:

```text
page
limit
```

MongoDB/Mongoose performs the filtering and sorting on the backend.

---

# Event-Driven Features

The project uses Node.js `EventEmitter`.

The purpose is to decouple primary task operations from secondary actions.

Conceptually:

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
   Queue Job     Queue Job
        └─────┬─────┘
              ↓
           Worker
```

The task service does not directly perform activity or notification persistence.

---

# Notifications

Notifications are persisted in MongoDB and displayed in the application.

Current triggers include:

| Trigger          | Result                              |
| ---------------- | ----------------------------------- |
| Task assigned    | Assigned user receives notification |
| Task completed   | Relevant user receives notification |
| Priority changed | Relevant user receives notification |
| Task reminder    | Relevant user receives reminder     |

The notification system is intentionally **in-app only**.

Email/SMTP delivery is not currently implemented.

---

# Reminders and Overdue Tasks

The reminder system introduces time-based asynchronous behavior.

## Reminder Window

The current reminder window is:

```text
1 hour before due date
```

This is a project-level design choice because the original feature requirement does not specify an exact reminder threshold.

---

## Reminder Processing

The reminder service is responsible for:

1. Finding tasks that require time-based processing.
2. Ignoring completed tasks.
3. Detecting upcoming tasks.
4. Queuing reminder notification jobs.
5. Recording `reminderSentAt`.
6. Detecting tasks whose due date has passed.
7. Setting `isOverdue`.

Conceptually:

```text
Task
 ↓
Due date check
 ├── Upcoming
 │      ↓
 │  Add notification job
 │      ↓
 │  Background worker
 │      ↓
 │  Notification
 │
 └── Past due
        ↓
     isOverdue = true
```

---

## Duplicate Prevention

A reminder should not be created repeatedly for the same due date.

The task stores:

```text
reminderSentAt
```

After a reminder job is queued:

```text
reminderSentAt = current timestamp
```

Future scheduler cycles can therefore skip the already-processed task.

---

## Due-Date Changes

If an existing task's due date changes, its reminder state is reset:

```text
reminderSentAt = null
isOverdue = false
```

This allows the new due date to be processed independently.

For example:

```text
Original due date
       ↓
Reminder job queued
       ↓
Due date changed
       ↓
Reminder state reset
       ↓
New due date
       ↓
New reminder can be generated
```

---

# Background Job Queue

The project contains a simple **in-memory background job queue**.

The queue demonstrates how slower secondary work can be separated from the user-facing operation.

## Why a Queue?

Without a background queue, a task event listener could directly perform database operations:

```text
Task Request
     ↓
Task Service
     ↓
Emit Event
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

The worker then processes the job separately:

```text
Background Queue
      ↓
Queue Worker
      ↓
Job Handler
      ↓
Database Operation
```

The primary API operation therefore does not need to wait for the secondary background work to complete.

---

## Job Types

The project defines:

```text
activity
notification
report
```

Currently implemented:

```text
activity
notification
```

Reserved for future development:

```text
report
```

Report generation belongs to the later file export/report milestone.

---

## Job Lifecycle

Every queued job has a lifecycle:

```text
pending
   ↓
processing
   ↓
completed
```

If processing fails, the worker retries the job before permanently marking it as failed:

```text
pending
   ↓
processing
   ↓
attempt fails
   ↓
retry with increasing delay
   ↓
processing
   ↓
completed / permanently failed
```

Each job currently allows up to **3 total attempts**. Retry delays use exponential backoff.

A job records timestamps such as:

```text
createdAt
startedAt
completedAt
failedAt
```

and stores an error message when processing fails.

---

## Queue Worker

The worker continuously polls the queue for pending jobs.

The current architecture uses one active job at a time.

Conceptually:

```text
Worker
  ↓
Get pending job
  ↓
Mark processing
  ↓
Attempt job
  ↓
Success? ── Yes ──→ completed
  │
  No
  ↓
Retry with increasing delay
  ↓
Attempts remaining?
  ├── Yes → Attempt again
  └── No  → permanently failed
  ↓
Get next job
```

Controlled concurrency can later allow more than one job to be processed simultaneously.

---

## Job Handlers

Job-specific behavior is separated into the job handler layer.

Conceptually:

```text
Worker
   ↓
handleJob()
   ├── activity
   │      ↓
   │  createActivity()
   │
   └── notification
          ↓
      createNotification()
```

This keeps the worker responsible for job execution while the handler determines what each job type actually does.

---

# Dashboard

The dashboard endpoint returns backend-calculated information.

Current values include:

```text
total
completed
pending
overdue
byPriority
recentActivity
```

Normal users receive dashboard statistics based on tasks they are authorized to access.

Administrators can receive statistics across all tasks.

The dashboard uses `Promise.all()` for independent database operations so those operations can execute concurrently.

Conceptually:

```text
                    ┌── total
                    ├── completed
Request ─────────────┼── pending
                    ├── overdue
                    ├── priority statistics
                    └── recent activity
                             ↓
                        Promise.all()
                             ↓
                         Dashboard
```

---

# API Reference

Base URL for local development:

```text
https://127.0.0.1:3000/api
```

---

# Health

## Check API

```http
GET /api/health
```

Authentication:

```text
Not required
```

---

# Authentication

## Register

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

A normal registration creates a user with:

```text
role = user
```

---

## Login

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

* A JWT is generated.
* The JWT is placed in the HttpOnly authentication cookie.
* User information is returned.
* The JWT itself is not returned as a JSON field.

---

## Get Current User

```http
GET /api/auth/me
```

Authentication:

```text
Required
```

Used by the frontend to restore the authenticated user after a page refresh.

---

## Logout

```http
POST /api/auth/logout
```

The server clears the authentication cookie.

---

# Tasks

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

---

## Get All Tasks

```http
GET /api/tasks
```

Authentication:

```text
Required
```

Example:

```text
GET /api/tasks?status=pending&priority=high&search=api&page=1&limit=10
```

---

## Get One Task

```http
GET /api/tasks/:id
```

Authentication:

```text
Required
```

---

## Update Task

```http
PUT /api/tasks/:id
```

Authentication:

```text
Required
```

---

## Delete Task

```http
DELETE /api/tasks/:id
```

Authentication:

```text
Required
```

---

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

To remove an assignment:

```json
{
  "assignedTo": null
}
```

---

# Users

## Get Users

```http
GET /api/users
```

Authentication:

```text
Required
```

Used by the frontend when displaying available users for task assignment.

---

# Activities

## Get Activities

```http
GET /api/activities
```

Authentication:

```text
Required
```

---

# Notifications

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

# Dashboard

## Get Dashboard

```http
GET /api/dashboard
```

Authentication:

```text
Required
```

---

# Environment Variables

Create a local `.env` file in the project root.

Example:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/task_management
CORS_ORIGIN=https://127.0.0.1:5500
JWT_SECRET=your-secret
COOKIE_SECURE=true
```

The repository contains:

```text
.env.example
```

as the environment configuration template.

| Variable        | Purpose                             |
| --------------- | ----------------------------------- |
| `PORT`          | Backend HTTPS port                  |
| `MONGODB_URI`   | MongoDB connection string           |
| `CORS_ORIGIN`   | Allowed frontend origin             |
| `JWT_SECRET`    | Secret used to sign and verify JWTs |
| `COOKIE_SECURE` | Controls the cookie Secure option   |

Never commit:

```text
.env
```

---

# Prerequisites

Install the following before running the project.

## Node.js

Use a current LTS version of Node.js.

Verify:

```bash
node -v
npm -v
```

## MongoDB

A running MongoDB instance is required.

The local configuration uses:

```text
mongodb://localhost:27017/task_management
```

## VS Code Live Server

The frontend can be served using the VS Code Live Server extension.

The local frontend is configured to use HTTPS.

## mkcert

`mkcert` is used to create locally trusted development certificates for HTTPS.

---

# Installation

Clone the project and enter the project directory.

Install dependencies:

```bash
npm install
```

Create:

```text
.env
```

using `.env.example` as the template.

Make sure MongoDB is running.

---

# Running the Project

## Start the Backend

Development mode:

```bash
npm run dev
```

Backend:

```text
https://127.0.0.1:3000
```

The backend starts:

```text
MongoDB connection
Reminder scheduler
Background job worker
HTTPS server
```

---

## Start the Frontend

Open the `client` directory in VS Code and use Live Server.

Frontend:

```text
https://127.0.0.1:5500
```

---

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

---

# Local HTTPS Setup

HTTPS certificates are intended for local development only.

They are not production certificates.

## 1. Install mkcert

Install `mkcert` on the development machine.

Then:

```bash
mkcert -install
```

## 2. Create Certificate Directory

From the project root:

```bash
mkdir certs
```

## 3. Generate Certificates

```bash
mkcert localhost 127.0.0.1
```

The generated filenames should match the filenames expected by the backend configuration.

The current backend expects:

```text
certs/localhost+2.pem
certs/localhost+2-key.pem
```

## 4. Backend HTTPS

The backend creates an HTTPS server using Node's `https` module.

Conceptually:

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

## 6. Keep Certificates Out of Git

The following are ignored:

```text
certs/
.vscode/
```

Never commit private development keys.

---

# Testing with Postman

The browser uses the HttpOnly cookie automatically.

Postman can also be used to test the API.

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

The browser-oriented login flow does not return the JWT as JSON.

The server sets the authentication cookie.

If Postman retains the cookie from the login response, protected requests can use that cookie.

For example:

```http
GET https://127.0.0.1:3000/api/auth/me
```

Because the browser authentication middleware currently reads the JWT from the cookie, Bearer-token authentication is not automatically required or exposed by the browser flow.

---

# Frontend Usage

## Authentication

On application startup:

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
Frontend stores user in memory
```

This allows the application to restore the current session without exposing the JWT to frontend JavaScript.

---

## Task Operations

The frontend communicates with the backend through `api.js`.

It does not communicate directly with MongoDB.

```text
Browser
   ↓
api.js
   ↓
Express API
   ↓
Service
   ↓
MongoDB
```

---

# Request Flow

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
7. Controller calls task service
          ↓
8. Task service creates MongoDB document
          ↓
9. Task-created event is emitted
          ↓
10. Activity listener reacts
          ↓
11. Activity job is added to the queue
          ↓
12. Response returns to frontend
          ↓
13. Background worker processes activity job
          ↓
14. Activity is persisted in MongoDB
```

---

## Login

```text
Login Form
    ↓
POST /api/auth/login
    ↓
Auth Controller
    ↓
Auth Service
    ↓
User.authenticate()
    ↓
Password Verification
    ↓
JWT Creation
    ↓
Set-Cookie
    ↓
User Response
```

---

## Protected Request

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
Task Service
      ↓
Authorization Query
      ↓
MongoDB
```

---

# Background Reminder Flow

Unlike normal API operations, reminders do not require a user request to trigger processing.

```text
Server Starts
      ↓
Reminder Scheduler Starts
      ↓
Initial Reminder Check
      ↓
setInterval()
      ↓
Wait ~60 seconds
      ↓
Reminder Check
      ↓
Find Relevant Tasks
      ↓
┌──────────────────────┐
│                      │
Upcoming              Past Due
│                      │
↓                      ↓
Add Notification       isOverdue
Job                     = true
│
↓
Background Queue
│
↓
Queue Worker
│
↓
Notification
│
↓
reminderSentAt
```

The scheduler continues running while the Node.js process is alive.

---

## Reminder Scheduler vs Queue Worker

These are two different responsibilities.

### Reminder Scheduler

Responsible for:

```text
WHEN should reminder processing happen?
```

It uses:

```text
setInterval()
```

### Queue Worker

Responsible for:

```text
WHEN a job exists, how should that background job be processed?
```

The scheduler does not run the worker logic itself.

The architecture is:

```text
Scheduler
    ↓
Reminder Service
    ↓
Queue
    ↓
Worker
```

---

# Background Job Flow

Background jobs allow secondary work to be separated from the primary API operation.

## Activity

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
Queue
      ↓
Worker
      ↓
Job Handler
      ↓
createActivity()
      ↓
MongoDB
```

---

## Notification

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
Queue
      ↓
Worker
      ↓
Job Handler
      ↓
createNotification()
      ↓
MongoDB
```

---

## Reminder Notification

```text
Reminder Scheduler
      ↓
Reminder Service
      ↓
Task approaching due date
      ↓
addJob({
    type: "notification"
})
      ↓
Queue
      ↓
Worker
      ↓
createNotification()
      ↓
MongoDB
```

The reminder scheduler therefore determines **when to check**, while the background worker handles the actual notification persistence.

---

# Retry and Failure Handling

Background jobs are designed to tolerate temporary failures without bringing down the worker.

## Retry Behavior

Each queued job tracks:

```text
attempts
maxAttempts
error
```

The current maximum is:

```text
maxAttempts = 3
```

This means one initial execution plus up to two retry executions, for a maximum of three total attempts.

## Exponential Backoff

When a job fails, the generic retry utility waits before trying again. The delay increases after each failed attempt.

For the current worker configuration:

```text
Attempt 1 → failure
     ↓ 1 second
Attempt 2 → failure
     ↓ 2 seconds
Attempt 3 → failure
     ↓
Permanently failed
```

The retry logic is implemented in:

```text
server/src/utils/retry.js
```

The utility is intentionally generic so it does not depend on queue-specific state. The worker supplies the asynchronous operation that should be retried.

## Permanent Failure

If all attempts fail, the retry utility rejects and the worker records the job as:

```text
status = failed
```

The error message is stored on the job.

## Worker Resilience

A permanently failed job does not stop the worker. The worker uses `finally` to release its busy state so subsequent jobs can continue processing.

Conceptually:

```text
Job A
  ↓
3 failed attempts
  ↓
failed
  ↓
worker continues
  ↓
Job B
  ↓
processed normally
```

This separates **retry behavior** from **job-specific work**:

```text
retry.js       → how failures are retried
queue_worker   → when jobs are processed and finalized
job_handlers   → what each job actually does
```

---

# Important Design Decisions

## Controllers vs Services

Business logic is kept out of routes and minimized in controllers.

This separates HTTP concerns from application logic.

---

## Backend Authorization

Authorization is enforced on the server.

Hiding a frontend button does not provide security.

The backend must reject unauthorized operations even if a user manually sends the request.

---

## Backend Filtering

Task filtering is handled through MongoDB queries.

This avoids unnecessarily retrieving every task and filtering the entire collection in the browser.

---

## Authentication State vs Authentication Credential

The frontend stores:

```text
currentUser
```

in memory.

The JWT remains inside the:

```text
HttpOnly cookie
```

This separates UI state from the authentication credential.

---

## Event-Driven Secondary Actions

Activity and notification behavior is triggered through task events instead of tightly coupling every secondary action to the task service.

---

## Background Queue for Secondary Work

Activity and notification persistence are treated as background work.

The primary task operation only needs to enqueue the job.

The worker performs the slower secondary operation separately.

This introduces the concepts of:

```text
queues
FIFO processing
workers
job lifecycle
async processing
error propagation
```

---

## Retry and Failure Handling

Background jobs use a reusable retry utility rather than embedding retry logic separately in every handler.

The worker allows up to three total attempts and uses increasing delays between attempts. Once the retry limit is exhausted, the job is marked as failed and the worker continues processing later jobs.

The retry utility uses recursion and `setTimeout()` to implement the retry sequence and exponential backoff.

---

## In-Memory Queue

The current queue is intentionally stored in application memory.

This is appropriate for learning the queue architecture without introducing Redis or another external infrastructure dependency.

The trade-off is that queued jobs are lost if the Node.js process stops.

---

## Dashboard Calculations

Dashboard statistics are calculated by the backend so the API remains the authoritative source.

---

## Reminder Scheduler vs Reminder Service

The reminder scheduler determines:

```text
WHEN
```

processing happens.

The reminder service determines:

```text
WHAT
```

processing does.

The queue worker then handles:

```text
HOW background work is executed
```

This keeps scheduling, business logic, and background execution separate.

---

## Overdue as Separate State

`isOverdue` is separate from task `status`.

A task can therefore be:

```text
status = pending
isOverdue = true
```

without introducing an `overdue` workflow status.

---

## Local HTTPS

HTTPS is enabled during local development to support secure-cookie behavior and provide a development environment closer to secure deployment conditions.

---

# Development Commands

Install dependencies:

```bash
npm install
```

Run backend:

```bash
npm run dev
```

Run the current test command:

```bash
npm test
```

Check Node/npm versions:

```bash
node -v
npm -v
```

---

# Git Workflow

The project is developed incrementally.

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
feat: move reminder notifications to background queue
```

Generated certificates, environment secrets, and machine-specific VS Code configuration are excluded through `.gitignore`.

---

# Planned Extensions

The following areas are intentionally **not part of the current implementation** and can be introduced later.

## Controlled Queue Concurrency

The current worker processes one job at a time.

The next queue improvement is controlled concurrency, allowing a limited number of jobs to run simultaneously.

For example:

```text
Maximum concurrency = 2

Job 1 ──────────────→ completed
Job 2 ──────────────→ completed
       Job 3 waits
                       ↓
                  Job 3 starts
```

This will demonstrate:

* Controlled concurrency
* Active worker tracking
* Concurrent Promises
* Event loop behavior

---

---

## File Exports and Reports

Report generation is planned for the later report/file milestone.

Potential functionality:

* Export tasks as JSON
* Export tasks as CSV
* Generate reports
* Save reports
* Download reports through the API

The existing:

```text
report
```

job type is reserved for this future functionality.

Possible Node.js concepts:

```text
fs/promises
readFile
writeFile
streams
Buffer
createReadStream
createWriteStream
```

Report generation can then be moved into the existing background queue instead of blocking an API request.

---

## Service Classes

Services could later be refactored into classes when there is a genuine architectural reason to do so.

Possible examples:

```text
TaskService
NotificationService
QueueWorker
```

---

## Centralized Error Handling

Future improvements can include:

* Custom error classes
* Central Express error middleware
* Validation errors
* Database error handling
* Consistent API error responses

---

## Automated Testing

Future testing can include:

* Unit tests
* API integration tests
* Authentication tests
* Authorization tests
* Async success/failure tests
* Reminder edge-case tests
* Scheduler behavior tests
* Queue worker tests

---

## External Queue Infrastructure

The current queue is intentionally in memory.

A future production-oriented extension can replace it with:

```text
Redis
BullMQ
```

while keeping the public application behavior largely independent of the queue implementation.

---

# Learning Objectives

The project is also a JavaScript and Node.js learning exercise.

## JavaScript

The project covers:

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
Promises
async/await
Promise.all()
error propagation
event-driven programming
timers
setInterval()
queues
workers
FIFO processing
concurrency
job state management
retry logic
recursion
exponential backoff
Promise rejection
finally
defensive programming
```

---

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
exponential backoff
```

---

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
CORS
```

---

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
```

---

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

---

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
controlled concurrency
```

A key learning goal is understanding not only how asynchronous code works, but **why a particular asynchronous design is appropriate for a particular problem**.

---

# Known Limitations

The current application is a development-focused learning project rather than a production deployment.

Current limitations include:

* Automated tests are not yet implemented.
* Centralized error middleware is not yet implemented.
* Notifications are currently in-app only.
* Email/SMTP delivery is not implemented.
* The background queue is in-memory and is not persistent.
* Queued jobs are lost if the Node.js process stops.
* The current worker processes jobs sequentially.
* Controlled queue concurrency is planned as the next queue improvement.
* File export/report generation has not yet been introduced.
* Local HTTPS uses development certificates.
* Certificate and VS Code paths are machine-specific.
* The application currently uses a local MongoDB configuration.
* The reminder scheduler currently runs inside the Node.js application process.
* Multi-instance/distributed scheduler coordination is not implemented.

These are extension points for later development rather than missing requirements of the current implementation.

---

# Security Notes

For local development:

* Keep `.env` out of Git.
* Keep private certificate keys out of Git.
* Use HTTPS when testing the Secure cookie configuration.
* Keep frontend and backend origins consistent.
* Do not move the JWT back into `localStorage`.
* Treat backend authorization as the actual security boundary.
* Do not trust ownership or role values supplied by the frontend.

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

# Project Philosophy

The project is intentionally structured so that architecture is introduced when it becomes useful rather than creating every possible infrastructure layer from the beginning.

The current architecture has evolved around actual application requirements:

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
```

Future infrastructure can then be introduced when the application actually benefits from it:

```text
Controlled Concurrency
    ↓
Reports / Files
    ↓
Service Classes
    ↓
Centralized Errors
    ↓
Automated Testing
    ↓
External Queue Infrastructure
```

The goal is not only to make the application work, but to understand:

* why each layer exists
* where each responsibility belongs
* how requests move through the application
* how authentication reaches `req.user`
* why backend authorization is required
* why MongoDB performs filtering
* why events are useful
* why independent operations can use `Promise.all()`
* how timers interact with the Node.js event loop
* why periodic background work belongs in a scheduler
* why secondary work can be moved into a background queue
* how workers consume queued jobs
* how job state moves from pending to processing to completed or failed
* how controlled concurrency can improve background processing
* how time-based state such as reminders and overdue tasks can be managed safely

---

# License

This project is currently a personal learning project.

No production license has been defined yet.
