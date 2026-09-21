# TaskFlow — Advanced Task Management System

TaskFlow is a full-stack task management application built as a learning and portfolio project.

The project started with a Vanilla JavaScript frontend and progressively evolved into a larger full-stack system with authentication, authorization, task assignment, filtering, pagination, dashboards, activities, notifications, reminders, reporting, background processing, and an Angular + TypeScript frontend.

The current application architecture uses:

* **Angular + TypeScript** for the frontend
* **Node.js + Express** for the backend API
* **MongoDB + Mongoose** for persistent application data
* **Redis + BullMQ** for background job processing
* **JWT + HttpOnly cookies** for authentication

The original Vanilla JavaScript frontend is still present in the repository as historical/reference code, but **Angular is the current frontend architecture**.

---

## Current Architecture

```text
                    TaskFlow
                       │
          ┌────────────┴────────────┐
          │                         │
    Angular + TypeScript       Express API
          │                         │
     Components                Controllers
     Services                     │
     Routing                      ▼
     Guards                    Services
     Interceptors                 │
          │                       ▼
          └────────────────── MongoDB
                                   │
                            Application Data


                    Background Processing
                              │
                            Redis
                              │
                           BullMQ
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
       Reports            Activities        Notifications
          │                   │                   │
       Worker              Worker              Worker
          │                   │                   │
          └───────────────────┴───────────────────┘
                              │
                           MongoDB
```

### Responsibilities

| Technology              | Responsibility                                          |
| ----------------------- | ------------------------------------------------------- |
| Angular                 | Frontend UI, routing, client-side state and interaction |
| TypeScript              | Frontend type safety and application structure          |
| Express                 | REST API and HTTP request handling                      |
| MongoDB                 | Persistent application data                             |
| Mongoose                | MongoDB models and data access                          |
| Redis                   | Background job infrastructure/state                     |
| BullMQ                  | Queues, workers, retries and job lifecycle              |
| JWT                     | Authentication token                                    |
| HttpOnly Cookie         | Secure browser-side token storage                       |
| Passport-Local-Mongoose | User authentication support                             |
| Nodemon                 | Backend development workflow                            |
| Docker                  | Local Redis infrastructure                              |

---

# Features

## Authentication

TaskFlow supports user authentication with:

* Registration
* Login
* Logout
* Current-user/session retrieval
* JWT authentication
* HttpOnly cookies
* Secure cookie configuration
* Protected API endpoints
* Angular authentication state
* Route protection

Authentication is handled by the backend while the Angular application maintains the current authenticated-user state through its services.

---

## Authorization and Roles

The application supports two roles:

```text
user
admin
```

Administrators have broader access to application data.

Normal users primarily work with tasks where they are involved as:

* Owner
* Assignee

Authorization is enforced by the backend rather than relying only on frontend visibility.

---

# Tasks

Tasks support the following core information:

* Title
* Description
* Status
* Priority
* Tags
* Due date
* Owner
* Assignee
* Reminder state
* Overdue state
* Created/updated timestamps

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

A task's status and overdue state are separate concepts.

For example:

```text
status = "in-progress"
isOverdue = true
```

means the task is still in progress but its due date has passed.

---

# Task Assignment

Tasks can be assigned to users.

The application distinguishes between:

* Task owner
* Assigned user
* Unassigned task

Assignment changes can generate corresponding activity and notification events.

The frontend displays assignment information so users can understand their relationship to a task rather than simply seeing a generic assignment state.

---

# Task Filtering, Searching, Sorting and Pagination

Task retrieval supports backend filtering and querying.

Supported query concepts include:

* Status
* Priority
* Search
* Tag
* From date
* To date
* Sort field
* Sort direction
* Page
* Limit

Search can operate across task title and description.

Sorting can be performed using fields such as:

* `createdAt`
* `updatedAt`
* `dueDate`
* `priority`

Pagination is performed by the backend rather than loading the entire task collection into the browser.

---

# Dashboard

The dashboard provides task statistics and recent activity information.

Current dashboard concepts include:

* Total tasks
* Completed tasks
* Pending tasks
* Overdue tasks
* Tasks grouped by priority
* Recent activity

The dashboard data is calculated by the backend and consumed by the Angular frontend.

---

# Activities

Task-related changes generate activity records.

Examples include:

* Task created
* Task updated
* Task completed
* Task assigned
* Assignment changed
* Priority changed
* Status changed

Activities are processed asynchronously using BullMQ.

The flow is:

```text
Task operation
      ↓
Task event
      ↓
Activity listener
      ↓
BullMQ activity queue
      ↓
Redis
      ↓
Activity worker
      ↓
Activity service
      ↓
MongoDB
```

The activity system is separated from the main task request so activity persistence does not have to be performed synchronously as part of every task operation.

---

# Notifications

TaskFlow supports in-app notifications.

Notification events include concepts such as:

* Task assignment
* Task completion
* Priority changes
* Task reminders

Notifications are also processed asynchronously.

```text
Task event
      ↓
Notification listener
      ↓
BullMQ notification queue
      ↓
Redis
      ↓
Notification worker
      ↓
Notification service
      ↓
MongoDB
```

The Angular application provides the notification UI and manages notification-related frontend state.

---

# Reminders and Overdue Tasks

Task reminders are handled by a scheduler rather than a dedicated queue.

The reminder scheduler runs periodically and checks tasks based on their due dates.

The current scheduler performs two related responsibilities:

### 1. Due-soon reminders

Tasks approaching their due date within the configured one-hour reminder window can generate a reminder notification.

```text
Current time < due date <= current time + 1 hour
```

A task uses `reminderSentAt` to prevent the same reminder from being repeatedly generated every scheduler cycle.

The flow is:

```text
Reminder Scheduler
       ↓
Reminder Service
       ↓
Task is due soon
       ↓
Notification Queue
       ↓
Redis
       ↓
Notification Worker
       ↓
Notification
```

### 2. Overdue state

When a task passes its due date without being completed, the reminder service maintains:

```text
isOverdue = true
```

This does **not** change the task's status.

For example:

```text
status = "in-progress"
isOverdue = true
```

A completed task is not treated as overdue.

The reminder scheduler therefore acts as both:

* A due-soon reminder mechanism
* A maintainer of the task's derived overdue state

There is intentionally no separate Redis/BullMQ reminder queue.

---

# Reports and Exports

Task reports can be generated as background jobs.

The Angular frontend starts a report job and then polls its status.

```text
Angular
   ↓
POST report request
   ↓
Express controller
   ↓
BullMQ report queue
   ↓
Redis
   ↓
Report worker
   ↓
Report service
   ↓
Report/export file
   ↓
Angular polls status
   ↓
Download
```

Report jobs use BullMQ's job lifecycle instead of a custom MongoDB job model.

The frontend receives a stable application-level status such as:

```text
pending
processing
completed
failed
```

while the backend maps those states from the underlying BullMQ state.

---

# Background Job Architecture

TaskFlow previously used a custom MongoDB-backed job queue.

That architecture has been replaced with **Redis + BullMQ**.

MongoDB remains the source of truth for application data.

Redis is used for background job infrastructure and BullMQ state.

## Current Queues

```text
taskflow-reports
taskflow-activities
taskflow-notifications
```

Each queue has its corresponding worker.

```text
Queue                     Worker
────────────────────────────────────────
taskflow-reports       →  Report Worker
taskflow-activities    →  Activity Worker
taskflow-notifications →  Notification Worker
```

## General Background Job Flow

```text
Application event
      ↓
BullMQ Queue
      ↓
Redis
      ↓
BullMQ Worker
      ↓
Application Service
      ↓
MongoDB
```

BullMQ is responsible for queue infrastructure such as:

* Job storage/state
* Worker coordination
* Attempts
* Retry handling
* Backoff
* Completed/failed job state

The previous custom infrastructure for:

* MongoDB job documents
* Manual job claiming
* Leases
* Heartbeats
* Stale-job recovery
* Custom retry helpers

is no longer part of the active architecture.

---

# Angular Frontend

The current frontend is an Angular + TypeScript application located in:

```text
taskflow-angular/
```

The Angular application uses standalone components and Angular services.

The original Vanilla JavaScript frontend remains in the repository for reference, but it is no longer the active frontend.

## Angular Responsibilities

### Components

Components are responsible primarily for:

* Rendering UI
* User interaction
* Component-level presentation state
* Calling application services

### Services

Services encapsulate reusable application behavior and API communication.

Current service responsibilities include areas such as:

* Authentication
* Tasks
* Task state
* Dashboard data
* Activities
* Notifications
* Reports

### Routing

Angular routing controls application navigation and separates public authentication pages from the authenticated application shell.

Conceptually:

```text
/
├── login
└── application shell
    ├── dashboard
    ├── tasks
    ├── activity
    ├── notifications
    └── reports
```

### Guards

Route guards protect authenticated application areas and handle navigation based on authentication state.

### HTTP Interceptor

The Angular application uses an HTTP interceptor to configure authenticated API requests with credentials required for the HttpOnly-cookie authentication flow.

---

# Angular Application Structure

The active frontend follows Angular's application structure rather than the previous Vanilla JavaScript module structure.

Conceptually:

```text
taskflow-angular/
└── src/
    └── app/
        ├── components/
        ├── guards/
        ├── interceptors/
        ├── services/
        ├── app.config.ts
        ├── app.routes.ts
        └── app.ts
```

The exact component/service organization may evolve as the Angular application grows.

---

# Backend Architecture

The backend is an Express application.

The main responsibilities are separated into:

```text
Routes
   ↓
Controllers
   ↓
Services
   ↓
Models / Database
```

For asynchronous operations:

```text
Event
   ↓
Listener
   ↓
BullMQ Queue
   ↓
Worker
   ↓
Service
```

This keeps HTTP request handling, business logic, persistence and asynchronous processing separated.

---

# Authentication Flow

The authentication flow is conceptually:

```text
Angular Login Form
        ↓
AuthService
        ↓
POST /api/auth/login
        ↓
Express
        ↓
Authentication
        ↓
JWT
        ↓
HttpOnly Cookie
        ↓
Browser
```

Subsequent authenticated API requests include the cookie automatically through the browser credential mechanism.

The JWT is therefore not stored in browser local storage.

---

# Task Request Flow

A normal task request follows:

```text
Angular Component
       ↓
Angular Service
       ↓
HTTP Request
       ↓
Express Route
       ↓
Controller
       ↓
Task Service
       ↓
MongoDB
```

If the operation generates an asynchronous event:

```text
Task Service
       ↓
Task Event
       ↓
Activity / Notification Listener
       ↓
BullMQ
       ↓
Redis
       ↓
Worker
       ↓
MongoDB
```

This allows the synchronous task operation and asynchronous side effects to remain separate.

---

# Project Structure

The repository currently contains both the active Angular frontend and the original Vanilla JavaScript frontend for reference.

A simplified structure is:

```text
Advanced-Task-Management-System/
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── events/
│   │   ├── errors/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── queue/
│   │   ├── reports/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── workers/
│   │
│   └── reports/
│       └── exports/
│
├── taskflow-angular/
│   └── src/
│       └── app/
│
├── client/
│   ├── css/
│   └── js/
│
├── certs/
│
├── .env
├── .env.example
├── package.json
└── README.md
```

### `client/`

The `client/` directory contains the original Vanilla JavaScript frontend.

It is retained for historical/reference purposes and is **not the current frontend architecture**.

### `taskflow-angular/`

This is the active frontend application.

### `server/`

This contains the Express backend, API, services, models, workers and report generation system.

---

# Environment Variables

The backend requires environment configuration for the application and infrastructure.

Example:

```env
PORT=
MONGODB_URI=
CORS_ORIGIN=
JWT_SECRET=
COOKIE_SECURE=

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
```

Do not commit real secrets or credentials to source control.

`.env.example` provides the expected configuration structure.

---

# Local Development

## Requirements

Install the following:

* Node.js
* npm
* MongoDB
* Docker
* Angular CLI if desired globally

Redis is run locally through Docker.

---

# Redis Setup

Create the Redis container once:

```bash
docker run --name taskflow-redis -p 6379:6379 -d redis:7-alpine
```

Start it later with:

```bash
docker start taskflow-redis
```

Verify Redis:

```bash
docker exec -it taskflow-redis redis-cli ping
```

Expected:

```text
PONG
```

To inspect TaskFlow BullMQ keys:

```bash
docker exec -it taskflow-redis redis-cli
```

Then:

```redis
KEYS bull:taskflow-*
```

Expected queue namespaces include:

```text
bull:taskflow-reports:*
bull:taskflow-activities:*
bull:taskflow-notifications:*
```

---

# Backend Setup

From the project root:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The backend runs over HTTPS during local development.

Example:

```text
https://127.0.0.1:3000
```

When the backend starts successfully, the application should connect to MongoDB, start the reminder scheduler, start the BullMQ workers and start the HTTPS server.

---

# Angular Setup

Move into the Angular application:

```bash
cd taskflow-angular
```

Install dependencies:

```bash
npm install
```

Start the Angular development server using the project's configured HTTPS development setup.

Example:

```bash
ng serve --host 127.0.0.1 --port 4200 --ssl --ssl-cert "../certs/localhost+2.pem" --ssl-key "../certs/localhost+2-key.pem"
```

The Angular application is then available at:

```text
https://localhost:4200
```

The frontend communicates with the Express API running on the backend HTTPS server.

---

# HTTPS Development

The project uses local HTTPS certificates during development.

The certificates are expected under:

```text
certs/
```

The backend and Angular development server can therefore communicate using HTTPS during local development.

The exact certificate filenames may depend on the local development setup.

---

# Development Flow

For normal local development:

```text
1. Start MongoDB
       ↓
2. Start Redis
       ↓
3. Start Express backend
       ↓
4. Start Angular frontend
       ↓
5. Open Angular application
```

Example:

```bash
docker start taskflow-redis
npm run dev
```

Then, from the Angular directory:

```bash
ng serve --host 127.0.0.1 --port 4200 --ssl ...
```

---

# Important Design Decisions

## MongoDB remains the application database

Redis was introduced for background processing; it does not replace MongoDB.

```text
MongoDB
    ↓
Users
Tasks
Activities
Notifications
Application data
```

```text
Redis
    ↓
BullMQ queue/job infrastructure
```

This separation keeps durable application data independent from background-job infrastructure.

---

## BullMQ replaces custom queue infrastructure

The project previously implemented queue behavior using MongoDB documents and custom worker infrastructure.

The current architecture delegates queue concerns to BullMQ.

This reduces custom infrastructure and separates:

```text
Business logic
```

from:

```text
Queue infrastructure
```

---

## Reminders do not have a dedicated queue

The scheduler is responsible for checking due dates.

Only reminder notifications need asynchronous processing, so they use the existing notification queue.

```text
Reminder Scheduler
       ↓
Reminder Service
       ↓
Notification Queue
```

There is no unnecessary fourth queue dedicated to reminders.

---

## Overdue is separate from status

A task being overdue does not automatically mean it is completed, pending or in-progress.

For example:

```text
status = in-progress
isOverdue = true
```

This allows the application to represent both task workflow state and time-based state independently.

---

# Project Evolution

TaskFlow has evolved through several architectural stages.

## Initial application

The frontend began as a Vanilla JavaScript application backed by Express and MongoDB.

The project progressively gained:

* Authentication
* Authorization
* Task assignment
* Filtering
* Searching
* Sorting
* Pagination
* Dashboard statistics
* Activities
* Notifications
* Reminders
* Reports
* Background processing

## Angular migration

The original frontend was migrated to:

```text
Angular + TypeScript
```

while preserving the existing TaskFlow UI/UX and functionality.

Responsibilities that were previously distributed across Vanilla JavaScript modules were moved into Angular components, services, routing, guards and interceptors.

## Background processing migration

The project originally used a custom MongoDB-backed job queue.

That system was subsequently replaced with:

```text
Redis + BullMQ
```

for:

* Reports
* Activities
* Notifications

MongoDB remains responsible for persistent application data.

---

# Learning Goals

TaskFlow is also a learning project.

The architecture is intentionally broad so that it provides practical experience with:

* TypeScript
* Angular
* Angular standalone components
* Angular routing
* Angular services
* HTTP interceptors
* Route guards
* REST APIs
* Express
* MongoDB
* Mongoose
* Authentication
* Authorization
* JWT
* Cookies
* Event-driven application behavior
* Background jobs
* Redis
* BullMQ
* Workers
* Retry handling
* Report generation
* File streaming
* Docker
* HTTPS development

The goal is not only to build the application, but to understand how the different layers communicate and why responsibilities are separated between them.

---

# High-Level Data Flow

## Synchronous task operation

```text
User
 ↓
Angular
 ↓
HTTP API
 ↓
Express
 ↓
Task Service
 ↓
MongoDB
```

## Asynchronous activity

```text
Task operation
 ↓
Event
 ↓
Activity Listener
 ↓
BullMQ
 ↓
Redis
 ↓
Activity Worker
 ↓
Activity Service
 ↓
MongoDB
```

## Asynchronous notification

```text
Task operation
 ↓
Event
 ↓
Notification Listener
 ↓
BullMQ
 ↓
Redis
 ↓
Notification Worker
 ↓
Notification Service
 ↓
MongoDB
```

## Report generation

```text
Angular
 ↓
Express
 ↓
BullMQ
 ↓
Redis
 ↓
Report Worker
 ↓
Report Service
 ↓
Export file
 ↓
Angular download
```

## Reminder

```text
Scheduler
 ↓
Reminder Service
 ├── Due soon → Notification Queue
 │                 ↓
 │              BullMQ
 │                 ↓
 │          Notification Worker
 │
 └── Overdue → isOverdue = true
```

---

# Current Architecture Summary

At the current checkpoint, TaskFlow can be understood as four major layers:

```text
┌─────────────────────────────────────┐
│          Angular Frontend           │
│       Components + Services         │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│            Express API              │
│ Controllers + Services + Events     │
└───────────────┬─────────────┬───────┘
                │             │
                ▼             ▼
        ┌──────────────┐   ┌──────────┐
        │   MongoDB    │   │  Redis   │
        │ Application  │   │  BullMQ  │
        │     Data     │   │  Queues  │
        └──────────────┘   └────┬─────┘
                                │
                                ▼
                           BullMQ Workers
                                │
                                ▼
                           Application
                             Services
```

This is the current source-of-truth architecture for the project.
