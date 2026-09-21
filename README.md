# TaskFlow — Advanced Task Management System

TaskFlow is a full-stack task management system built as a learning and portfolio project.

The project started as a **Vanilla JavaScript + Express + MongoDB** application and has progressively evolved into a more structured full-stack system with:

* Authentication and authorization
* Task ownership and assignment
* Projects and project-specific task keys
* Task filtering, searching, sorting and pagination
* Kanban and list task views
* Dashboard statistics
* Activities
* Notifications
* Due-date reminders
* Overdue task tracking
* Background report generation
* Redis + BullMQ job processing
* Angular + TypeScript frontend
* HTTPS local development

The project is intentionally being developed as a learning project. The goal is not only to finish the application, but to understand the architecture, request flow, state management and responsibilities of each layer well enough to explain and extend the system independently.

---

# Current Architecture

The current application is a full-stack system with four major areas:

```text
                         TaskFlow
                            │
             ┌──────────────┴──────────────┐
             │                             │
      Angular Frontend                Express API
       + TypeScript                       │
             │                            │
       Components                         │
       Services                           │
       Routing                            │
       Guards                             │
       Interceptors                       │
             │                            │
             └──────────────┬─────────────┘
                            │
                            ▼
                        MongoDB
                            │
                  Application Data
                            │
              ┌─────────────┴─────────────┐
              │                           │
          Redis                       MongoDB
              │                           │
           BullMQ                 Persistent Data
              │
      ┌───────┼────────┐
      │       │        │
   Reports Activities Notifications
      │       │        │
   Workers  Workers   Workers
```

### Technology Responsibilities

| Technology              | Responsibility                                   |
| ----------------------- | ------------------------------------------------ |
| Angular                 | Frontend UI, routing, components and interaction |
| TypeScript              | Frontend types, models and application structure |
| Express                 | REST API and HTTP request handling               |
| MongoDB                 | Persistent application data                      |
| Mongoose                | MongoDB models and database access               |
| Redis                   | Background job infrastructure                    |
| BullMQ                  | Queues, jobs, workers, retries and job state     |
| JWT                     | Authentication                                   |
| HttpOnly Cookie         | Secure browser-side authentication token storage |
| Passport-Local-Mongoose | Local user authentication support                |
| Docker                  | Local Redis infrastructure                       |
| Nodemon                 | Backend development workflow                     |

---

# Frontend Architecture

The active frontend is:

```text
Angular + TypeScript
```

The original Vanilla JavaScript frontend is still present in:

```text
client/
```

but it is retained as historical/reference code.

The active application is:

```text
taskflow-angular/
```

The Angular application follows Angular's component/service architecture rather than continuing the original DOM-driven Vanilla JavaScript structure.

---

# Angular Application Structure

The Angular application is organized around responsibilities rather than a single large component.

A simplified structure is:

```text
taskflow-angular/
└── src/
    └── app/
        ├── auth/
        ├── dashboard/
        ├── projects/
        ├── tasks/
        ├── task-card/
        ├── task-form/
        ├── services/
        ├── guards/
        ├── interceptors/
        ├── models/
        ├── app.routes.ts
        ├── app.config.ts
        └── app.ts
```

The exact folder structure may grow as additional Angular features are migrated.

### Main Angular responsibilities

**Components**

Responsible for:

* Rendering UI
* Handling user interaction
* Coordinating component-level state
* Calling application services

**Services**

Responsible for:

* HTTP communication
* Authentication state
* Task state
* Project state
* Notifications
* Shared application logic

**Routing**

Responsible for:

* Application navigation
* Route configuration
* Protected pages
* Query-parameter based navigation

**Interceptors**

Responsible for cross-cutting HTTP behavior such as sending credentials with API requests.

**Guards**

Responsible for preventing unauthorized access to protected application routes.

---

# Current Migration Status

The frontend migration from Vanilla JavaScript to Angular + TypeScript is underway and the Angular application is now the primary frontend architecture.

The migration is being performed while preserving the existing TaskFlow functionality and UI/UX.

The original Vanilla frontend remains in the repository so that:

* Existing behavior can be referenced
* UI behavior can be compared
* Migration decisions can be understood
* Historical implementation details remain available

It is not the target architecture going forward.

---

# Core Domain Model

The current application is organized around several primary domain entities:

```text
User
 │
 ├── owns Projects
 │
 └── owns / is assigned Tasks

Project
 │
 └── contains Tasks

Task
 │
 ├── belongs to Project
 ├── has Owner
 ├── may have Assignee
 ├── generates Activities
 └── may generate Notifications
```

---

# Projects

Projects provide a grouping and namespace for tasks.

A project contains information such as:

* Name
* Key
* Description
* Owner
* Task sequence
* Task count
* Created timestamp
* Updated timestamp

Example:

```text
Project:
    name = General
    key = GEN-AF77EAB7
```

---

# Project Task Keys

Tasks now use project-specific keys.

Instead of only having an ObjectId, a task can have a human-readable key such as:

```text
GEN-AF77EAB7-1
GEN-AF77EAB7-2
GEN-AF77EAB7-3
```

The task key is generated from:

```text
Project Key + Task Sequence
```

For example:

```text
Project key:
GEN-AF77EAB7

Current sequence:
7

Next task:
GEN-AF77EAB7-8
```

The project maintains `taskSequence` as the key-generation sequence.

It is intentionally different from the current number of tasks.

For example:

```text
taskSequence = 7
taskCount = 5
```

can be valid if tasks have previously been deleted.

The next task should still receive:

```text
GEN-AF77EAB7-8
```

rather than reusing an older key.

---

# Project → Task Navigation

The Angular frontend supports navigating from a project to its tasks.

Conceptually:

```text
Projects
   │
   └── View Tasks
          │
          ▼
       Tasks
          │
          └── projectId query parameter
```

The Tasks page reads the project identifier from the route query parameters and applies it to the task filters.

This allows the same Tasks page to support:

* All tasks
* Tasks belonging to a specific project

without creating a separate task page for every project.

---

# Tasks

Tasks support:

* Title
* Description
* Status
* Priority
* Tags
* Due date
* Owner
* Assignee
* Project
* Task key
* Reminder state
* Overdue state
* Created timestamp
* Updated timestamp

---

# Task Status

Tasks have three workflow states:

```text
pending
in-progress
completed
```

Status represents the workflow state of a task.

---

# Task Priority

Tasks have three priority levels:

```text
low
medium
high
```

Priority is independent of task status.

For example:

```text
status   = in-progress
priority = high
```

---

# Overdue Tasks

Overdue state is intentionally separate from task status.

A task can therefore be:

```text
status = in-progress
isOverdue = true
```

This means:

> The task is still in progress and its due date has passed.

Completing a task does not require treating `status` and `isOverdue` as the same piece of state.

---

# Task Assignment

Tasks support:

* Owner
* Assigned user
* Unassigned state

Assignment is controlled by backend authorization rules.

Assignment changes can generate:

* Activity records
* Notifications

The Angular task UI displays the current ownership and assignment information.

---

# Task Permissions

The application supports:

```text
user
admin
```

Administrators have broader access.

Normal users can interact with tasks according to their relationship to the task and its project:

* Viewing a task they own
* Viewing a task assigned to them
* Viewing tasks inside a project they own
* Editing tasks they own
* Editing tasks assigned to them
* Editing tasks inside a project they own
* Assigning or unassigning tasks they own
* Assigning or unassigning tasks inside a project they own
* Deleting tasks they own
* Deleting tasks inside a project they own

Administrators have access to all projects and tasks and can perform all task operations.

The backend remains the authoritative source for authorization.

Frontend permission checks are primarily for UI behavior and user experience.

---

# Task Filtering

The Tasks page supports backend-driven filtering.

Available filters include:

* Status
* Priority
* Tag
* From date
* To date
* Project
* Search

Search supports task title and description.

Search input is debounced so that every keystroke does not immediately create an API request.

---

# Task Sorting

Tasks can be sorted by:

```text
createdAt
updatedAt
dueDate
priority
```

The sort direction supports:

```text
asc
desc
```

Sorting is performed by the backend rather than attempting to reorder only the currently displayed browser state.

---

# Pagination

Tasks are paginated by the backend.

The Angular frontend supports:

* Previous page
* Next page
* Direct page selection
* Tasks-per-page selection

Supported limits include:

```text
5
10
20
50
```

The API returns pagination metadata alongside the task data.

---

# Task Views

The Angular Tasks page supports two views:

```text
List
Kanban
```

The user's selected view is persisted locally.

The Kanban board contains:

```text
Pending
In Progress
Completed
```

Tasks can be moved between Kanban columns when the current user has permission to perform the operation.

Kanban status changes use optimistic UI behavior and roll back when the API operation fails.

---

# Task Mutations

The Angular task architecture handles task mutations through services.

Supported operations include:

* Create
* Update
* Delete
* Assign
* Unassign
* Change status
* Change priority
* Move through Kanban

The UI tracks pending mutations so the same task cannot be accidentally mutated concurrently.

---

# Task State Management

Task state is separated from the Tasks page component through:

```text
TaskStateService
```

The state service manages concepts such as:

* Current task collection
* Loading state
* Error state
* Filters
* Pagination

This keeps task state from becoming entirely local to one component.

---

# Authentication

Authentication uses:

```text
JWT
+
HttpOnly Secure Cookie
```

The JWT is not stored in:

```text
localStorage
```

or:

```text
sessionStorage
```

The browser stores the authentication cookie and sends it with authenticated requests.

---

# Authentication Flow

```text
Angular Login
      │
      ▼
AuthService
      │
      ▼
POST /api/auth/login
      │
      ▼
Express
      │
      ▼
Authentication
      │
      ▼
JWT generated
      │
      ▼
HttpOnly Cookie
      │
      ▼
Browser
```

Later API requests use the browser's cookie mechanism.

Angular's HTTP configuration enables credentialed requests.

---

# Authorization Flow

A protected request follows:

```text
Angular
   ↓
HTTP Request
   ↓
Authentication Cookie
   ↓
Express Middleware
   ↓
JWT Verification
   ↓
Current User
   ↓
Authorization
   ↓
Controller
   ↓
Service
   ↓
MongoDB
```

Authorization is enforced on the backend.

---

# Dashboard

The dashboard provides aggregated task information.

Current dashboard concepts include:

* Total tasks
* Completed tasks
* Pending tasks
* Overdue tasks
* Tasks grouped by priority
* Recent activity

The backend calculates the dashboard data.

Angular consumes the API response and renders the dashboard.

---

# Activities

Activities provide an audit-style history of important task operations.

Activity concepts include:

* Task created
* Task updated
* Task assigned
* Task unassigned
* Task completed
* Task priority changed

Updates can contain more specific change information.

For example:

```text
Task "Implement authentication" was updated:
status changed from pending to completed
```

or:

```text
Task "Implement authentication" was updated:
priority changed from medium to high
```

This makes the activity history more useful than recording only a generic "task updated" message.

---

# Activity Architecture

Activities are processed asynchronously.

```text
Task Operation
      │
      ▼
Task Service
      │
      ▼
Task Event
      │
      ▼
Activity Listener
      │
      ▼
BullMQ Activity Queue
      │
      ▼
Redis
      │
      ▼
Activity Worker
      │
      ▼
Activity Service
      │
      ▼
MongoDB
```

This separates the main task operation from activity persistence.

---

# Notifications

TaskFlow supports in-app notifications.

Notification events include:

* Task assignment
* Task unassignment
* Task completion
* Task priority changes
* Task reminders

The Angular frontend retrieves and displays notifications through the notification service.

---

# Notification Architecture

```text
Task Event
     │
     ▼
Notification Listener
     │
     ▼
BullMQ Notification Queue
     │
     ▼
Redis
     │
     ▼
Notification Worker
     │
     ▼
Notification Service
     │
     ▼
MongoDB
```

---

# Reminders

TaskFlow includes due-date reminders.

The reminder scheduler periodically checks tasks approaching their due date.

The configured reminder window is approximately one hour.

Conceptually:

```text
current time < due date
                 <=
current time + reminder window
```

When a task enters the reminder window:

```text
Reminder Scheduler
       ↓
Reminder Service
       ↓
Notification Queue
       ↓
BullMQ
       ↓
Notification Worker
       ↓
Notification
```

The task uses:

```text
reminderSentAt
```

to avoid repeatedly generating the same reminder.

---

# Overdue Processing

The reminder system also maintains:

```text
isOverdue
```

based on the task due date.

The overdue state is separate from status.

For example:

```text
status = pending
isOverdue = true
```

is possible.

A completed task should not remain logically overdue.

---

# Background Job Architecture

The project originally implemented a custom MongoDB-backed job queue.

That system has been replaced with:

```text
Redis + BullMQ
```

MongoDB remains the application database.

Redis is responsible for background-job infrastructure.

BullMQ manages:

* Queues
* Jobs
* Workers
* Job state
* Attempts
* Retries
* Backoff
* Completed jobs
* Failed jobs

This removes the need for custom MongoDB queue infrastructure such as manual job claiming, leases and stale-job recovery.

---

# Current BullMQ Queues

The application currently uses background processing for:

```text
Reports
Activities
Notifications
```

Conceptually:

```text
Queue                         Worker
────────────────────────────────────────
Report Queue              →   Report Worker
Activity Queue            →   Activity Worker
Notification Queue        →   Notification Worker
```

The exact queue names are defined by the backend queue configuration.

---

# Why Redis and BullMQ?

The project originally used MongoDB as both:

```text
Application Database
+
Job Queue
```

This created additional infrastructure responsibilities such as:

* Claiming jobs
* Preventing duplicate processing
* Lease management
* Heartbeats
* Retry logic
* Stale job detection

The current architecture delegates those queue-specific concerns to BullMQ.

The responsibilities are now clearer:

```text
MongoDB
    ↓
Application data

Redis + BullMQ
    ↓
Background job infrastructure
```

---

# Reports

Reports are generated asynchronously.

The Angular application does not wait for the report generation process inside a single long-running HTTP request.

Instead:

```text
Angular
   ↓
Create Report Job
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
Export File
```

The Angular frontend can then poll the report job status.

---

# Report Lifecycle

A report can move through states conceptually represented as:

```text
pending
   ↓
processing
   ↓
completed
```

or:

```text
processing
   ↓
failed
```

Once completed, the generated report can be downloaded through the report download endpoint.

---

# Report Export Formats

The backend supports streamed report generation/export.

Export functionality is kept separate from normal task CRUD operations so that larger report operations do not unnecessarily block normal API requests.

---

# Event-Driven Architecture

Task-related side effects use application events.

The conceptual pattern is:

```text
Task Service
     │
     ▼
Task Event
     │
     ├──────────────► Activity Listener
     │                       │
     │                       ▼
     │                  Activity Queue
     │
     └──────────────► Notification Listener
                             │
                             ▼
                       Notification Queue
```

This keeps task business logic from being tightly coupled to every asynchronous side effect.

---

# Request Flow

A normal synchronous API request follows:

```text
Angular Component
       ↓
Angular Service
       ↓
HttpClient
       ↓
Express Route
       ↓
Controller
       ↓
Service
       ↓
Mongoose
       ↓
MongoDB
```

---

# Mutation With Asynchronous Side Effects

For a task mutation that produces an event:

```text
Angular
   ↓
HTTP Request
   ↓
Controller
   ↓
Task Service
   ↓
MongoDB
   │
   └── Task Event
          │
          ├── Activity Listener
          │       ↓
          │    BullMQ
          │       ↓
          │     Redis
          │       ↓
          │    Worker
          │
          └── Notification Listener
                  ↓
               BullMQ
                  ↓
                Redis
                  ↓
               Worker
```

The task mutation and asynchronous side effects therefore have separate responsibilities.

---

# Backend Architecture

The backend follows a layered structure:

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Models
  ↓
MongoDB
```

Cross-cutting infrastructure includes:

```text
Middleware
Events
Queues
Workers
Schedulers
Error Handling
Configuration
```

---

# Backend Structure

```text
server/
├── scripts/
│
└── src/
    ├── config/
    │   ├── database
    │   ├── env
    │   └── redis
    │
    ├── controllers/
    │
    ├── errors/
    │
    ├── events/
    │
    ├── middleware/
    │
    ├── models/
    │
    ├── queue/
    │
    ├── reports/
    │
    ├── routes/
    │
    ├── services/
    │
    ├── utils/
    │
    └── workers/
```

The backend separates:

* HTTP concerns
* Business logic
* Database models
* Event handling
* Background processing
* Report generation
* Error handling
* Configuration

---

# Important Services

The backend contains dedicated services for major application responsibilities.

Examples include:

```text
AuthService
TaskService
ProjectService
ActivityService
NotificationService
DashboardService
ReminderService
ReportService
```

The goal is to keep controllers relatively thin and move business logic into services.

---

# Error Handling

The backend uses centralized error handling.

The general pattern is:

```text
Route
 ↓
Controller
 ↓
Service
 ↓
App Error
 ↓
Central Error Middleware
 ↓
HTTP Response
```

This avoids repeating complete error-response logic throughout individual controllers.

---

# Environment Validation

The backend validates required environment configuration during startup.

This prevents the application from silently starting with missing infrastructure configuration.

Important configuration includes:

* MongoDB connection
* JWT configuration
* Cookie configuration
* CORS configuration
* Redis configuration
* Server configuration

---

# Database

MongoDB remains the primary persistent data store.

Current major collections include:

```text
users
projects
tasks
activities
notifications
```

BullMQ/Redis is not used as a replacement for MongoDB application data.

---

# MongoDB Relationships

The major relationships are conceptually:

```text
User
 │
 ├── Project.owner
 │
 ├── Task.owner
 │
 └── Task.assignedTo

Project
 │
 └── Task.project

Task
 │
 ├── Activity
 │
 └── Notification
```

MongoDB ObjectIds are used for these relationships.

---

# Data Migration

Because Projects were introduced after the original task architecture, existing tasks required migration.

The repository contains:

```text
server/scripts/migrate_tasks_to_projects.js
```

This migration associates existing tasks with a default project and creates task keys while preserving the existing task data.

The migration allows the new project architecture to be introduced without discarding the original tasks.

---

# Existing Data Model Example

A migrated task can conceptually look like:

```text
Task
├── title
├── description
├── status
├── priority
├── dueDate
├── tags
├── owner
├── assignedTo
├── project
├── taskKey
├── reminderSentAt
├── isOverdue
├── createdAt
└── updatedAt
```

Example task key:

```text
GEN-AF77EAB7-1
```

---

# Frontend State Flow

The Angular frontend generally follows:

```text
Component
   ↓
Service
   ↓
HTTP API
   ↓
Backend
   ↓
Response
   ↓
Service / State
   ↓
Angular Signal
   ↓
Template
```

For example, task loading:

```text
Tasks Component
      ↓
TaskService.getTasks()
      ↓
GET /api/tasks
      ↓
Task Controller
      ↓
Task Service
      ↓
MongoDB
      ↓
API Response
      ↓
TaskStateService
      ↓
Angular Signals
      ↓
Task Template
```

---

# Task State and Race Protection

The Angular task page protects against stale HTTP responses when multiple task requests are triggered close together.

Requests are associated with an internal request identifier.

Conceptually:

```text
Request 1 ────────────────┐
                          │
Request 2 ───────────┐   │
                     │   │
                     ▼   ▼
                Latest Request
                     │
                     ▼
              Update UI State
```

Older responses do not overwrite newer task state.

This is particularly useful when users rapidly change:

* Filters
* Sorting
* Pagination
* Search

---

# Optimistic Kanban Updates

Kanban status changes use optimistic state updates.

The flow is:

```text
User drags task
      ↓
Angular immediately moves task
      ↓
PUT/PATCH task status
      ↓
Backend response
```

If the backend operation fails:

```text
API failure
    ↓
Restore previous status
    ↓
Show error
```

This keeps the Kanban interface responsive while still preserving server consistency.

---

# UI/UX Preservation

The Angular migration is intended to preserve the original TaskFlow interface and behavior.

Important existing UI concepts include:

* Task list
* Kanban board
* Task creation modal
* Task editing
* Search
* Filters
* Pagination
* Assignment controls
* Priority controls
* Status controls
* Notification interface
* Project navigation
* Responsive behavior
* Kanban maximize/minimize behavior

Angular changes the implementation architecture without intentionally removing existing functionality.

---

# Original Vanilla Frontend

The original frontend remains under:

```text
client/
```

It contains the previous implementation based on:

```text
HTML
CSS
Vanilla JavaScript
```

The major historical areas include:

```text
client/
├── css/
└── js/
    ├── api.js
    ├── auth.js
    ├── app.js
    ├── render.js
    ├── router.js
    └── state.js
```

This code is retained as a reference while the Angular implementation becomes the active frontend.

---

# Local Development Requirements

Install:

* Node.js
* npm
* MongoDB
* Docker
* Angular dependencies

The application currently uses:

```text
Node.js
Express
MongoDB
Redis
Angular
```

Redis is intended to run locally through Docker.

---

# Environment Variables

Create the backend environment file from:

```text
.env.example
```

The environment configuration includes values for:

```env
PORT=
MONGODB_URI=
CORS_ORIGIN=
JWT_SECRET=
COOKIE_SECURE=

REDIS_HOST=
REDIS_PORT=
REDIS_USERNAME=
REDIS_PASSWORD=
```

The exact required values depend on the local development environment.

Never commit real secrets to source control.

---

# Redis Setup

Start a local Redis container:

```bash
docker run --name taskflow-redis -p 6379:6379 -d redis:7-alpine
```

If the container already exists:

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

---

# Backend Setup

From the repository root:

```bash
npm install
```

Start the backend:

```bash
npm run dev
```

The backend runs over HTTPS during local development.

Typical local backend address:

```text
https://127.0.0.1:3000
```

The backend starts the application infrastructure required for development, including:

* MongoDB connection
* Redis/BullMQ infrastructure
* Background workers
* Reminder scheduler
* HTTPS server

---

# Angular Setup

Move into:

```bash
cd taskflow-angular
```

Install dependencies:

```bash
npm install
```

Start the Angular development server:

```bash
ng serve --host 127.0.0.1 --port 4200 --ssl --ssl-cert "../certs/localhost+2.pem" --ssl-key "../certs/localhost+2-key.pem"
```

The Angular application is then available through the local HTTPS development address.

---

# HTTPS Development

TaskFlow uses HTTPS locally so that the development environment more closely matches the secure cookie requirements of the application.

The development certificates are expected under:

```text
certs/
```

The Angular and backend development servers can therefore communicate through HTTPS.

The exact certificate filenames depend on the local certificate setup.

---

# Recommended Development Order

Start the infrastructure in this order:

```text
MongoDB
   ↓
Redis
   ↓
Express Backend
   ↓
Angular Frontend
```

Example:

```bash
docker start taskflow-redis
```

Then:

```bash
npm run dev
```

Then from the Angular directory:

```bash
ng serve --host 127.0.0.1 --port 4200 --ssl ...
```

---

# Repository Structure

The overall repository currently resembles:

```text
Advanced-Task-Management-System/
│
├── server/
│   ├── scripts/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── errors/
│       ├── events/
│       ├── middleware/
│       ├── models/
│       ├── queue/
│       ├── reports/
│       ├── routes/
│       ├── services/
│       ├── utils/
│       └── workers/
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
├── .env.example
├── package.json
└── README.md
```

---

# Architectural Principles

The project follows several important architectural principles.

## 1. MongoDB is the application database

MongoDB stores durable application information such as:

* Users
* Projects
* Tasks
* Activities
* Notifications

Redis does not replace MongoDB.

---

## 2. Redis is infrastructure for background jobs

Redis is used by BullMQ for:

* Queues
* Jobs
* Worker coordination
* Job state

Application data continues to live in MongoDB.

---

## 3. Business logic belongs in services

Controllers should primarily handle:

```text
HTTP input
     ↓
Service
     ↓
HTTP response
```

Business rules belong in services rather than being duplicated across controllers.

---

## 4. Background work should not unnecessarily block HTTP requests

Operations such as:

* Activity creation
* Notification creation
* Report generation

can be processed asynchronously.

This keeps the main request path focused on the operation the user explicitly requested.

---

## 5. Backend authorization is authoritative

The frontend can hide or disable controls for usability, but security decisions are enforced by the backend.

---

## 6. Task status and derived state are separate

Workflow state:

```text
status
```

and time-derived state:

```text
isOverdue
```

represent different concepts.

---

## 7. Project task sequence and task count are separate

The project maintains:

```text
taskSequence
```

for generating unique sequential task keys.

The application separately calculates:

```text
taskCount
```

for the current number of tasks.

This means deleting a task does not cause task keys to be reused.

---

# Current Development Checkpoint

The current architecture includes the completed foundational migration work for:

```text
Angular frontend
+
Redis/BullMQ background processing
+
Projects
+
Project-specific task keys
+
Project-filtered task views
+
Activities
+
Notifications
```

The Angular frontend is now the primary frontend architecture.

The original Vanilla JavaScript implementation remains available for reference.

The project is continuing from this architecture rather than maintaining the old MongoDB-backed queue architecture.

---

# Learning Objectives

TaskFlow is being developed as a practical way to learn full-stack development.

The project provides hands-on experience with:

### TypeScript

* Types
* Interfaces
* Generics
* Union types
* Type narrowing
* Classes
* Access modifiers
* Type-safe API models

### Angular

* Standalone components
* Templates
* Signals
* Reactive forms
* Services
* Dependency injection
* Routing
* Query parameters
* Route guards
* HTTP interceptors
* RxJS
* Component communication
* Angular CDK
* State management patterns

### Backend

* Node.js
* Express
* REST API design
* Controllers
* Services
* Middleware
* Error handling
* Authentication
* Authorization

### Database

* MongoDB
* Mongoose
* Relationships
* Indexes
* Data migration
* Aggregation
* Query filtering

### Authentication

* JWT
* Cookies
* HttpOnly cookies
* Secure cookies
* Authentication middleware
* Role-based authorization

### Event-driven systems

* Domain events
* Event listeners
* Asynchronous processing
* Decoupling application features

### Background processing

* Redis
* BullMQ
* Queues
* Workers
* Retries
* Backoff
* Job lifecycle

### Infrastructure

* Docker
* HTTPS development
* Environment configuration
* Local development infrastructure

---

# Learning Philosophy

The project is intentionally being built in stages.

The objective is not simply:

```text
Make the application work
```

but:

```text
Understand why the application works
        ↓
Understand how data moves through it
        ↓
Understand why responsibilities are separated
        ↓
Be able to modify the architecture independently
```

For each major feature, the intended learning flow is:

```text
Requirement
   ↓
Architecture
   ↓
Request / data flow
   ↓
Implementation
   ↓
Testing
   ↓
Refactoring
   ↓
Commit
```

---

# High-Level System Flow

## Authentication

```text
Angular
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

---

## Task Creation

```text
Angular Task Form
       ↓
TaskService
       ↓
POST /api/tasks
       ↓
Task Controller
       ↓
Task Service
       ↓
Project sequence
       ↓
Task key generated
       ↓
MongoDB
       ↓
Task Event
       ├──────────► Activity Queue
       │
       └──────────► Notification Queue
```

---

## Task Update

```text
Angular
   ↓
TaskService
   ↓
PATCH / PUT Task
   ↓
Task Controller
   ↓
Task Service
   ↓
MongoDB
   ↓
Task Event
   ├── Activity
   └── Notification
```

---

## Project Task Navigation

```text
Projects Page
      ↓
Select Project
      ↓
Navigate to Tasks
      ↓
?projectId=<projectId>
      ↓
Tasks Component
      ↓
TaskStateService
      ↓
TaskService
      ↓
Filtered API request
      ↓
Project-specific tasks
```

---

## Activity

```text
Task Operation
      ↓
Task Event
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

---

## Notification

```text
Task Event
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

---

## Reminder

```text
Reminder Scheduler
       ↓
Reminder Service
       │
       ├── Task due soon
       │        ↓
       │   Notification Queue
       │        ↓
       │      BullMQ
       │        ↓
       │   Notification Worker
       │
       └── Task overdue
                ↓
             isOverdue
```

---

## Report

```text
Angular
   ↓
Report Request
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
Export File
   ↓
Angular
   ↓
Download
```

---

# Final Architecture Overview

At a high level, the current TaskFlow system can be viewed as:

```text
┌──────────────────────────────────────────────────────┐
│                 ANGULAR FRONTEND                    │
│                                                    │
│ Components │ Services │ Signals │ Forms │ Routing │
│ Guards     │ HTTP     │ CDK     │ State           │
└──────────────────────────┬─────────────────────────┘
                           │
                           │ HTTPS / REST
                           ▼
┌──────────────────────────────────────────────────────┐
│                    EXPRESS API                      │
│                                                    │
│ Routes → Controllers → Services → Models           │
│                     │                              │
│                     └── Events                     │
└───────────────┬───────────────────┬────────────────┘
                │                   │
                │                   │
                ▼                   ▼
       ┌────────────────┐    ┌────────────────────┐
       │    MongoDB     │    │  Redis + BullMQ    │
       │                │    │                    │
       │ Users          │    │ Reports            │
       │ Projects       │    │ Activities         │
       │ Tasks          │    │ Notifications      │
       │ Activities     │    │                    │
       │ Notifications  │    │ Workers            │
       └────────────────┘    └────────────────────┘
```

The important separation is:

```text
MongoDB
    =
Persistent application data

Redis + BullMQ
    =
Background job infrastructure

Angular
    =
Frontend application

Express
    =
Backend/API layer
```

This architecture provides the foundation for continuing the TaskFlow migration and adding further functionality without returning to the original tightly coupled frontend and custom queue architecture.
