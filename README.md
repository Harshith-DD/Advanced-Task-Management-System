# Advanced Task Management System

A full-stack task management application built with **JavaScript, Node.js, Express.js, MongoDB, Mongoose, and a vanilla JavaScript frontend**.

The project started as a simple task CRUD application and gradually evolved into a more complete backend architecture covering database querying, authentication, authorization, task assignment, event-driven features, notifications, dashboards, reminders, background jobs, retry handling, file exports, reports, and class-based service design.

> **Current status:** The application supports task management, backend filtering/search/sorting/pagination, authentication and authorization, task assignment, activity logging, in-app notifications, dashboard statistics, reminders, overdue tracking, background job processing, retry handling, JSON/CSV exports, background report generation, and class-based `TaskService`, `NotificationService`, and `QueueWorker` components.

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
* [File Exports and Reports](#file-exports-and-reports)
* [Dashboard](#dashboard)
* [Service Classes and `this`](#service-classes-and-this)
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
* [Background Report Flow](#background-report-flow)
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
* View tasks they are authorized to access.
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
* Export tasks as JSON or CSV.
* Generate background task reports.

Administrators have broader access to tasks and can manage tasks across users.

The backend follows a layered architecture:

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

Secondary actions such as activities and notifications are separated from the primary task operation through events and background jobs.

---

# Core Specifications

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

# Current Features

## 1. Task CRUD

Create, read, update, and delete tasks.

---

## 2. Task Ownership

New tasks are associated with the authenticated user on the backend.

The frontend does not decide who owns a newly created task.

```text
Authenticated Request
        ↓
req.user.userId
        ↓
Task.owner
```

---

## 3. Task Assignment

Tasks can be assigned to users.

```http
PATCH /api/tasks/:id/assign
```

Assignments can also be removed.

The backend validates the target user and applies authorization rules before changing the assignment.

---

## 4. Search

Search applies to:

```text
title
description
```

Search is performed by MongoDB rather than retrieving the entire task collection and filtering it in the browser.

---

## 5. Filtering

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

---

## 6. Sorting

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

## 8. Activity Logging

Task operations create activity records through the event system.

```text
Task Event
    ↓
Activity Listener
    ↓
Activity Job
    ↓
Background Queue
    ↓
Queue Worker
    ↓
Activity Service
    ↓
MongoDB
```

This keeps activity persistence separate from the primary task operation.

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

Independent dashboard operations use `Promise.all()` where appropriate.

---

## 11. Task Reminders

Tasks with approaching due dates can generate reminder notifications.

The current reminder window is:

```text
1 hour before due date
```

The reminder system:

* Detects upcoming tasks.
* Ignores completed tasks.
* Queues reminder notifications.
* Prevents duplicate reminders.
* Records `reminderSentAt`.
* Detects past-due incomplete tasks.
* Sets `isOverdue`.

---

## 12. Overdue Tracking

Overdue state is separate from workflow status.

Task status remains:

```text
pending
in-progress
completed
```

while overdue state is represented by:

```text
isOverdue
```

Therefore a task can be:

```text
status = pending
isOverdue = true
```

without introducing `overdue` as a workflow status.

---

## 13. Background Job Queue

The application uses a MongoDB-backed background job queue.

Jobs are persisted in MongoDB, allowing queued jobs to survive a Node.js process restart.

The worker claims jobs atomically and tracks their lifecycle through MongoDB.

Current job types:

```text
activity
notification
report
```

The continuously running worker processes jobs and tracks their lifecycle:

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

## 14. Retry and Failure Handling

Background jobs support retry handling.

Each job tracks:

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

A permanently failed job does not stop the worker. The worker releases its busy state and continues processing later jobs.

---

## 15. File Exports and Reports

The application supports:

* JSON task exports
* CSV task exports
* Saved generated files
* Streaming downloads
* Background task report generation
* Report job status tracking
* Downloading completed reports

Generated files are stored under:

```text
server/reports/exports/
```

Direct exports use the authenticated user's task access rules.

Background reports use the same authorization-aware task query.

Report generation is handled as a background job instead of blocking the API request.

---

## 16. Class-Based Service Design

The project now uses classes for components where instance behavior and state are useful.

Implemented classes:

```text
TaskService
NotificationService
QueueWorker
```

### TaskService

`TaskService` encapsulates task-related business logic such as:

```text
createTask()
getAllTasks()
getTaskById()
updateTask()
deleteTask()
assignTask()
```

A service instance is exported and used by the task controller.

A pure access-query helper remains a standalone function because it does not require instance state.

---

### NotificationService

`NotificationService` encapsulates notification persistence and retrieval:

```text
createNotification()
getNotifications()
markNotificationAsRead()
markAllNotificationsAsRead()
```

The notification controller and background job handler use the service instance.

---

### QueueWorker

`QueueWorker` encapsulates worker state and behavior:

```text
pollInterval
retryDelay
isBusy
processJob()
runWorker()
start()
```

The worker is created once and started during server initialization.

---

# Technology Stack

| Layer                          | Technology                    |
| ------------------------------ | ----------------------------- |
| Runtime                        | Node.js                       |
| Backend                        | Express.js                    |
| Database                       | MongoDB                       |
| ODM                            | Mongoose                      |
| Authentication                 | JWT                           |
| Password authentication        | Passport-Local-Mongoose       |
| Browser authentication storage | HttpOnly cookie               |
| Local transport security       | HTTPS                         |
| Cookies                        | cookie-parser                 |
| CORS                           | cors                          |
| Environment configuration      | dotenv                        |
| Development server             | nodemon                       |
| Frontend                       | HTML, CSS, vanilla JavaScript |
| Event system                   | Node.js EventEmitter          |
| Background queue               | In-memory JavaScript queue    |
| Background worker              | Async Node.js class           |
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

Authentication middleware:

1. Reads the JWT from the authentication cookie.
2. Verifies the token.
3. Extracts authenticated user information.
4. Places the information on:

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

Current service components include:

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

Some services are class-based while others remain functions because not every component benefits from instance-based state.

The class-based services are:

```text
TaskService
NotificationService
```

The background worker is also class-based:

```text
QueueWorker
```

This is an intentional gradual architectural approach rather than converting every function into a class.

---

## Models

Mongoose models define MongoDB document structures.

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

The queue stores jobs in application memory.

A job contains information such as:

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

Jobs are lost if the Node.js process stops.

---

## Worker

The `QueueWorker` continuously checks for pending jobs.

```text
Pending Job
    ↓
QueueWorker
    ↓
processing
    ↓
Job Handler
    ↓
completed
```

If processing fails:

```text
processing
    ↓
retry
    ↓
completed
or
failed
```

The worker currently processes one job at a time.

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
│   ├── reports/
│   │   └── exports/        # Generated files, ignored by Git
│   │
│   └── src/
│       ├── config/
│       │   └── database.js
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

It communicates with the Express backend and sends:

```text
credentials: "include"
```

so the browser can send the authentication cookie.

#### `auth.js`

Maintains the current authenticated user in frontend memory.

It does not store the JWT in `localStorage`.

#### `state.js`

Stores frontend application state such as:

```text
Tasks
Users
Notifications
Dashboard
Filters
Pagination
```

#### `render.js`

Converts application state/data into UI elements.

It renders:

* Tasks
* Dashboard
* Activities
* Notifications
* Assignment controls
* Overdue task indicators

### Backend Responsibilities

```text
routes       → HTTP endpoint definitions
controllers  → HTTP request/response handling
services     → business logic
models       → MongoDB data structures
middleware   → reusable request processing
events       → task event definitions/listeners
queue        → background job storage/lifecycle
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

## Registration

```text
Register
    ↓
Passport-Local-Mongoose
    ↓
Password Hash
    ↓
MongoDB
```

The application uses the user's email as the username field.

---

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

The JWT itself is not returned as a frontend JSON credential.

---

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

---

## HttpOnly Cookies

The JWT is not stored in:

```text
localStorage
```

Instead, it is stored in an HttpOnly cookie.

JavaScript running in the page therefore cannot directly read the JWT.

The frontend stores only the current user's application state in memory.

---

## HTTPS

HTTPS protects data while it travels between the browser and backend.

The local project uses HTTPS so the Secure authentication cookie can be used during development.

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

The frontend is not the security boundary.

## Normal User

A normal user can access tasks where:

```text
owner == current user
OR
assignedTo == current user
```

---

## Administrator

Administrators have broader access to tasks and can operate across the task collection.

---

## Ownership

When a task is created, the owner is taken from:

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
/api/tasks?status=pending&priority=high&search=api&page=1&limit=10
```

MongoDB/Mongoose performs filtering and sorting on the backend.

---

# Event-Driven Features

The project uses Node.js `EventEmitter`.

The purpose is to decouple primary task operations from secondary actions.

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

The task service does not directly persist activity or notification records.

---

# Notifications

Notification triggers include:

| Trigger          | Result                              |
| ---------------- | ----------------------------------- |
| Task assigned    | Assigned user receives notification |
| Task completed   | Relevant user receives notification |
| Priority changed | Relevant user receives notification |
| Task reminder    | Relevant user receives reminder     |

Notifications are currently in-app only.

Email/SMTP delivery is not implemented.

---

# Reminders and Overdue Tasks

The reminder scheduler runs periodically while the Node.js process is alive.

The scheduler determines **when** reminder processing should happen.

The reminder service determines **what** should happen.

The queue worker determines **how** background jobs are executed.

```text
Scheduler
    ↓
Reminder Service
    ↓
Queue
    ↓
QueueWorker
```

Upcoming tasks:

```text
Task
 ↓
Due Date Check
 ↓
Upcoming
 ↓
Notification Job
 ↓
QueueWorker
 ↓
Notification
```

Past-due incomplete tasks:

```text
Task
 ↓
Due Date Check
 ↓
Past Due
 ↓
isOverdue = true
```

`reminderSentAt` prevents duplicate reminder generation.

If the due date changes, reminder state can be reset so the new due date can be processed independently.

---

# Background Job Queue

The queue is backed by MongoDB.

## Why a Queue?

Without a background queue:

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

The worker then performs the secondary operation:

```text
Background Queue
       ↓
QueueWorker
       ↓
Job Handler
       ↓
Database Operation
```

This keeps slower secondary work separate from the primary API operation.

---

## Job Types

```text
activity
notification
report
```

---

## Job Lifecycle

```text
pending
   ↓
processing
   ↓
completed
```

With failure handling:

```text
pending
   ↓
processing
   ↓
attempt fails
   ↓
retry
   ↓
processing
   ↓
completed
or
failed
```

---

# Retry and Failure Handling

The reusable retry utility is located at:

```text
server/src/utils/retry.js
```

The worker supplies the operation that should be retried.

The retry utility handles:

* Promise rejection
* Delays
* Retry attempts
* Increasing backoff
* Final failure

The worker handles:

* Job state
* Job execution
* Final completion
* Permanent failure
* Continuing to process later jobs

This separates responsibilities:

```text
retry.js
    ↓
how failures are retried

QueueWorker
    ↓
when jobs are processed

job_handlers
    ↓
what each job does
```

---

# File Exports and Reports

Direct exports:

```text
GET /api/reports/tasks/json
GET /api/reports/tasks/csv
```

Background report generation:

```text
POST /api/reports/tasks/report
```

The API returns a job ID and the worker generates the report asynchronously.

Generated reports are saved under:

```text
server/reports/exports/
```

Completed reports can then be downloaded through the report job endpoint.

Streaming is used for downloads so the application does not need to load the entire generated file into memory before sending it.

---

# Service Classes and `this`

The class-based architecture was introduced where instance behavior is useful rather than converting every function into a class.

Current classes:

```text
TaskService
NotificationService
QueueWorker
```

## `this`

Inside a class method, `this` refers to the object instance when the method is called through that instance.

For example:

```js
queueWorker.runWorker();
```

Here, `this` inside `runWorker()` refers to `queueWorker`.

---

## Method References

A method can also be passed as a callback:

```js
obj.method
```

However, passing the method reference does not automatically preserve the original object as `this`.

A wrapper can preserve it:

```js
() => obj.method()
```

Or the method can be explicitly bound:

```js
obj.method.bind(obj)
```

---

## QueueWorker Callback

The worker uses a bound class method when passing `runWorker` to `setInterval()`:

```js
setInterval(
    this.runWorker.bind(this),
    this.pollInterval
);
```

This ensures that when the timer invokes the method, `this` still refers to the `QueueWorker` instance.

Conceptually:

```text
QueueWorker
    ↓
start()
    ↓
bind(this)
    ↓
setInterval()
    ↓
runWorker()
    ↓
this.isBusy
this.processJob()
this.pollInterval
```

This is an actual application use of `bind()` rather than a separate artificial example.

---

## Why This Matters

Without preserving `this`, a detached class method can lose its original object context.

That can cause code such as:

```js
this.isBusy
```

or:

```js
this.processJob()
```

to fail because `this` is no longer the expected `QueueWorker` instance.

This is especially important when class methods are passed to:

* Timers
* Event listeners
* Promise callbacks
* Other APIs expecting a function

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

Normal users receive statistics based on authorized tasks.

Administrators can receive statistics across all tasks.

Independent calculations can run concurrently using:

```js
Promise.all()
```

---

# API Reference

Base URL:

```text
https://127.0.0.1:3000/api
```

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

* JWT is generated.
* JWT is stored in the HttpOnly authentication cookie.
* User information is returned.
* JWT is not returned as a JSON field.

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

Remove an assignment:

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

Used by the frontend when displaying users available for task assignment.

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

# Reports and Exports

## Export Tasks as JSON

```http
GET /api/reports/tasks/json
```

Authentication:

```text
Required
```

Returns the authenticated user's authorized tasks as a downloadable JSON file.

## Export Tasks as CSV

```http
GET /api/reports/tasks/csv
```

Authentication:

```text
Required
```

Returns the authenticated user's authorized tasks as a downloadable CSV file.

## Start Task Report Generation

```http
POST /api/reports/tasks/report
```

Authentication:

```text
Required
```

The endpoint queues a background report job and returns `202 Accepted` with a job ID.

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

The generated file is streamed to the client.

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

Install:

* Node.js
* npm
* MongoDB
* VS Code
* VS Code Live Server
* mkcert

Verify Node/npm:

```bash
node -v
npm -v
```

MongoDB must be running.

Default local configuration:

```text
mongodb://localhost:27017/task_management
```

---

# Installation

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

## Start Backend

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

Expected startup output is similar to:

```text
Database connected successfully
Task reminder scheduler started
Background job worker started
HTTPS server is running on https://127.0.0.1:3000
```

---

## Start Frontend

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

The generated filenames should match the names expected by the backend configuration.

Current backend expectation:

```text
certs/localhost+2.pem
certs/localhost+2-key.pem
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

The browser-oriented login flow stores the JWT in the authentication cookie rather than returning it as JSON.

If Postman retains the cookie from the login response, protected requests can use that cookie.

Example:

```http
GET https://127.0.0.1:3000/api/auth/me
```

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

This restores the session without exposing the JWT to frontend JavaScript.

---

## Task Operations

The frontend communicates with the backend through `api.js`.

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

The frontend never communicates directly with MongoDB.

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
7. Controller calls TaskService
          ↓
8. TaskService creates MongoDB document
          ↓
9. Task-created event is emitted
          ↓
10. Activity listener reacts
          ↓
11. Activity job is added to queue
          ↓
12. Response returns to frontend
          ↓
13. QueueWorker processes activity job
          ↓
14. Activity is persisted in MongoDB
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
TaskService
      ↓
Authorization Query
      ↓
MongoDB
```

---

# Background Reminder Flow

Reminders do not require a user request.

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

The scheduler determines **when** to check.

The reminder service determines **what** to do.

The queue worker determines **how** background jobs are processed.

---

# Background Job Flow

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
QueueWorker
      ↓
Job Handler
      ↓
createActivity()
      ↓
MongoDB
```

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
QueueWorker
      ↓
Job Handler
      ↓
NotificationService
      ↓
MongoDB
```

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
QueueWorker
      ↓
NotificationService
      ↓
MongoDB
```

---

# Background Report Flow

```text
Generate Report
      ↓
POST /api/reports/tasks/report
      ↓
Report Controller
      ↓
addJob({
    type: "report"
})
      ↓
202 Accepted + jobId
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
Frontend checks job status
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

---

## Class Usage

Classes are used where instance behavior or state provides a meaningful benefit.

Current class-based components:

```text
TaskService
NotificationService
QueueWorker
```

Not every service was converted into a class.

This keeps the architecture gradual rather than introducing classes simply for the sake of using classes.

---

## Backend Authorization

Authorization is enforced on the server.

Hiding a frontend button does not provide security.

The backend must reject unauthorized operations even if a user manually sends the request.

---

## Backend Filtering

Task filtering is handled through MongoDB queries.

This avoids retrieving every task and filtering the entire collection in the browser.

---

## Authentication State vs Credential

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

Activity and notification behavior is triggered through task events rather than tightly coupling every secondary operation to the task service.

---

## Background Queue

Activity, notification, and report processing are treated as background work.

The primary operation can enqueue the work without waiting for the secondary operation to complete.

---



---

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

This keeps scheduling, business logic, and background execution separate.

---

## Overdue as Separate State

`isOverdue` is separate from task `status`.

This allows a task to be:

```text
status = pending
isOverdue = true
```

without adding `overdue` to the workflow statuses.

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

Run tests:

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
```

Generated certificates, environment secrets, generated report files, and machine-specific VS Code configuration are excluded through `.gitignore`.

---

# Planned Extensions

The following are intentionally outside the current implementation.

## Controlled Queue Concurrency

The current worker processes one job at a time.

A future improvement could allow a limited number of jobs to execute simultaneously.

Example:

```text
Maximum concurrency = 2

Job 1 ──────────────→ completed
Job 2 ──────────────→ completed
       Job 3 waits
                      ↓
                  Job 3 starts
```

This would introduce:

* Active worker tracking
* Concurrent Promises
* Controlled concurrency
* Further event-loop practice

## Automated Testing

Future testing can include:

* Unit tests
* API integration tests
* Authentication tests
* Authorization tests
* Async success/failure tests
* Reminder edge-case tests
* Scheduler tests
* Queue worker tests
* Service tests

---

## External Queue Infrastructure

The current queue is intentionally in memory.

A future production-oriented implementation could use:

```text
Redis
BullMQ
```

while keeping application-level job behavior largely independent of the queue infrastructure.

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
call()
apply()
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
job state management
retry logic
recursion
exponential backoff
Promise rejection
finally
encapsulation
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
streams
writeFile()
createReadStream()
CSV generation
JSON serialization
file downloads
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
authorization
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
retry behavior
```

A key learning goal is understanding not only how asynchronous code works, but **why a particular asynchronous design is appropriate for a particular problem**.

---

# Known Limitations

The current application is a development-focused learning project rather than a production deployment.

Current limitations include:

* Automated tests are not yet implemented.
* Notifications are currently in-app only.
* Email/SMTP delivery is not implemented.
* The current worker processes jobs sequentially.
* Controlled queue concurrency is not implemented.
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

The architecture has evolved around actual application requirements:

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
```

The next architectural direction is:

```text
Automated Testing
```

The goal is not only to make the application work, but to understand:

* Why each layer exists.
* Where each responsibility belongs.
* How requests move through the application.
* How authentication reaches `req.user`.
* Why backend authorization is required.
* Why MongoDB performs filtering.
* Why events are useful.
* Why independent operations can use `Promise.all()`.
* How timers interact with the Node.js event loop.
* Why periodic background work belongs in a scheduler.
* Why secondary work can be moved into a background queue.
* How workers consume queued jobs.
* How retry behavior protects background processing.
* How class instances encapsulate related behavior.
* How `this` behaves when methods are passed as callbacks.
* Why `bind()` is necessary when a class method must retain its instance context.

---

# License

This project is currently a personal learning project.

No production license has been defined yet.
