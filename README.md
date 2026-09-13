# Advanced Task Management System

A full-stack task management application built with **JavaScript, Node.js, Express.js, MongoDB, Mongoose, and a vanilla JavaScript frontend**.

The project is designed as a practical backend-learning application: it starts with task CRUD and progressively introduces filtering, authentication, authorization, event-driven architecture, notifications, dashboard aggregation, timers, background jobs, retries, file exports, service design, and testing.

> **Project status:** Milestones 1–6 are implemented. The README is intentionally project-centric rather than a progress log, so future milestones can extend the implementation sections without restructuring this document.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Core Specifications](#core-specifications)
- [Current Features](#current-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Data Models](#data-models)
- [Authentication and Security](#authentication-and-security)
- [Task Access Rules](#task-access-rules)
- [Task Querying](#task-querying)
- [Event-Driven Features](#event-driven-features)
- [Dashboard](#dashboard)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [Local HTTPS Setup](#local-https-setup)
- [Testing with Postman](#testing-with-postman)
- [Frontend Usage](#frontend-usage)
- [Request Flow](#request-flow)
- [Important Design Decisions](#important-design-decisions)
- [Development Commands](#development-commands)
- [Git Workflow](#git-workflow)
- [Planned Extensions](#planned-extensions)
- [Learning Objectives](#learning-objectives)
- [Known Limitations](#known-limitations)

---

## Project Overview

The Advanced Task Management System provides authenticated users with a task-management workspace.

Users can:

- Register and log in.
- Create tasks.
- View tasks they are allowed to access.
- Update and delete permitted tasks.
- Assign tasks to users.
- Search and filter tasks.
- Sort and paginate task results.
- View task activities.
- Receive in-app notifications.
- Mark notifications as read.
- View dashboard statistics.

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

Secondary actions such as activity logging and notifications are connected through a Node.js event system.

---

## Core Specifications

The project is based around these functional areas:

### Task management

Each task supports:

- `title`
- `description`
- `status`
- `priority`
- `dueDate`
- `tags`
- `owner`
- `assignedTo`
- `createdAt`
- `updatedAt`

### Task retrieval

The task API supports combinations of:

- Status filtering
- Priority filtering
- Text search
- Tag filtering
- Due-date range filtering
- Sorting
- Pagination

### Users

The system supports:

- User registration
- User login
- User roles
- Task ownership
- Task assignment

### Authentication

Authentication currently uses:

- Passport-Local-Mongoose for username/password storage and password hashing
- JWT for authenticated session information
- HttpOnly cookies for browser-side JWT storage
- HTTPS for local development
- `/auth/me` for restoring the logged-in user after a page refresh

### Events

Task operations emit events that can be consumed by independent listeners.

Current event-related behavior includes:

- Activity creation
- Notification creation

### Dashboard

The dashboard provides:

- Total tasks
- Completed tasks
- Pending tasks
- Overdue tasks
- Tasks grouped by priority
- Recent activity

---

## Current Features

### 1. Task CRUD

Create, read, update, and delete tasks.

### 2. Ownership

New tasks are associated with the authenticated user on the backend.

The frontend does not decide who owns a newly created task.

### 3. Assignment

Tasks can be assigned to another user.

Assignment is handled through:

```text
PATCH /api/tasks/:id/assign
```

An assignment can also be removed.

### 4. Search

Search applies to task title and description.

### 5. Filtering

Supported filters include:

- Status
- Priority
- Tags
- Due-date range

### 6. Sorting

Supported task sort fields include:

- `createdAt`
- `updatedAt`
- `dueDate`
- `priority`

The API also accepts ascending or descending order.

### 7. Pagination

Task retrieval supports:

```text
page
limit
```

### 8. Activity log

Task operations create activity records through the event system.

### 9. Notifications

The current notification system is in-app.

Notifications are created for:

- Task assignment
- Task completion
- Task priority changes

Users can:

- View notifications
- Mark one notification as read
- Mark all notifications as read

### 10. Dashboard

Dashboard information is calculated on the backend and returned through:

```text
GET /api/dashboard
```

### 11. Role-based access

The system supports:

```text
user
admin
```

Administrators have broader task access than normal users.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Backend framework | Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JWT |
| Password authentication | Passport-Local-Mongoose |
| Browser authentication storage | HttpOnly cookie |
| Local transport security | HTTPS |
| HTTP cookies | cookie-parser |
| CORS | cors |
| Environment configuration | dotenv |
| Development server | nodemon |
| Frontend | HTML, CSS, vanilla JavaScript |
| Event system | Node.js EventEmitter |
| Package format | ES Modules |

### Main dependencies

```text
express
mongoose
jsonwebtoken
passport-local-mongoose
cookie-parser
cors
dotenv
```

Development dependency:

```text
nodemon
```

---

## Architecture

The project uses a layered backend architecture.

### Routes

Routes define:

- HTTP methods
- URL paths
- Middleware order
- Controller entry points

Routes should not contain database queries or large business rules.

Example:

```text
POST /api/tasks
        ↓
authenticateUser
        ↓
createTaskController
```

### Middleware

Middleware performs request-level processing before the controller.

The authentication middleware:

1. Reads the JWT from the authentication cookie.
2. Verifies the token.
3. Extracts the user ID and role.
4. Places that information on:

```js
req.user
```

Protected controllers can then use the authenticated identity.

### Controllers

Controllers handle the HTTP layer.

They are responsible for:

- Reading request data
- Calling services
- Sending responses
- Handling controller-level errors

Controllers should not contain the application's complete business logic.

### Services

Services contain reusable application logic.

Examples:

- Authentication operations
- Task operations
- Dashboard calculations
- Notification operations
- Activity operations
- User operations

### Models

Mongoose models define the MongoDB document structure and provide database operations.

### Events

The event system separates secondary actions from the main task operation.

For example:

```text
Task updated
     ↓
Task event emitted
     ↓
 ┌───────────────┐
 ↓               ↓
Activity       Notification
listener       listener
```

This prevents the task controller/service from becoming responsible for every secondary action.

---

## Project Structure

Current structure:

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
│       │   ├── task_services.js
│       │   └── user_services.js
│       │
│       └── server.js
│
├── certs/                 # Local HTTPS certificates, ignored by Git
├── .env                  # Local configuration, ignored by Git
├── .env.example
├── .gitignore
├── package.json
└── package-lock.json
```

### Frontend responsibilities

#### `app.js`

Application orchestration and event handling.

It connects:

- UI events
- API calls
- application state
- rendering

#### `api.js`

Central frontend API layer.

It handles HTTP communication with the Express backend.

The current API layer sends:

```text
credentials: "include"
```

so the browser can send the authentication cookie.

#### `auth.js`

Stores the current authenticated user in frontend memory.

It does **not** store the JWT in localStorage.

#### `state.js`

Stores frontend application state such as:

- Tasks
- Users
- Notifications
- Dashboard
- Filters
- Pagination

#### `render.js`

Contains UI rendering functions.

#### `index.html`

Contains the application's main HTML structure.

#### `style.css`

Contains frontend styling.

### Backend responsibilities

The backend is organized by responsibility:

```text
routes       → HTTP endpoint definitions
controllers  → HTTP request/response handling
services     → business logic
models       → MongoDB data structures
middleware   → reusable request processing
events       → task event definitions/listeners
config       → infrastructure configuration
```

---

## Data Models

### User

A user contains application-specific fields such as:

```text
name
email
role
createdAt
updatedAt
```

Passport-Local-Mongoose adds the fields required for password authentication, including the username/password hash information.

The application uses email as the Passport username field.

Roles:

```text
user
admin
```

### Task

```text
title
description
status
priority
dueDate
tags
owner
assignedTo
createdAt
updatedAt
```

Allowed statuses:

```text
pending
in-progress
completed
```

Allowed priorities:

```text
low
medium
high
```

### Activity

```text
type
task
user
message
createdAt
updatedAt
```

Current activity types include:

```text
taskCreated
taskUpdated
taskAssigned
taskCompleted
```

### Notification

```text
user
type
task
message
read
createdAt
updatedAt
```

Current notification types include:

```text
taskAssigned
taskCompleted
taskPriorityChanged
```

---

## Authentication and Security

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
JWT generated
       ↓
HttpOnly cookie
       ↓
Browser
```

Protected request:

```text
Browser
   ↓
Cookie automatically sent
   ↓
Authentication middleware
   ↓
JWT verification
   ↓
req.user
   ↓
Controller
```

### Why Passport-Local-Mongoose?

The application delegates password hashing and username/password authentication behavior to a well-defined authentication plugin rather than maintaining custom password-hashing code.

The plugin uses the configured email field as its username field.

### Why JWT?

The JWT contains the authenticated identity information required by the API, such as:

```text
userId
role
```

The backend verifies the token on protected requests.

### Why HttpOnly cookies?

The JWT is not stored in browser `localStorage`.

Instead, it is placed in an HttpOnly cookie.

This means JavaScript running in the page cannot directly read the JWT.

The frontend therefore does not need a:

```text
getToken()
```

function.

### Why HTTPS?

HTTPS protects data while it travels between browser and server.

The local project uses HTTPS for both:

```text
Frontend: https://127.0.0.1:5500
Backend:  https://127.0.0.1:3000
```

### Cookie configuration

The authentication cookie currently uses:

```text
httpOnly: true
secure: true in HTTPS development
sameSite: lax
```

The `secure` setting is controlled by:

```text
COOKIE_SECURE
```

---

## Task Access Rules

The backend determines task access.

The frontend must not be treated as the security boundary.

### Normal user

A normal user can access tasks associated with them through ownership or assignment.

Conceptually:

```text
owner == current user
OR
assignedTo == current user
```

### Administrator

Administrators have broader access to tasks.

The access query for an administrator can operate across the task collection.

### Ownership

When a task is created, the owner is taken from:

```js
req.user.userId
```

rather than trusting an owner ID supplied by the frontend.

This prevents a client from simply claiming another user's ID as the owner.

---

## Task Querying

The task list API supports multiple query parameters together.

Example:

```text
/api/tasks?status=pending&priority=high&page=1&limit=10
```

### Supported query parameters

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

### Search

Search checks:

```text
title
description
```

### Date filtering

The API supports a due-date range:

```text
fromDate
toDate
```

### Sorting

Supported fields include:

```text
createdAt
updatedAt
dueDate
priority
```

The direction can be:

```text
asc
desc
```

### Pagination

Pagination uses:

```text
page
limit
```

For example:

```text
/api/tasks?page=2&limit=10
```

### MongoDB

Filtering and sorting are performed on the backend using MongoDB/Mongoose queries rather than relying on the browser to retrieve the entire task collection and filter it locally.

---

## Event-Driven Features

The project uses Node.js `EventEmitter`.

The purpose is to decouple the primary task operation from secondary actions.

For example:

```text
create/update/assign task
        ↓
emit task event
        ↓
listeners react
```

There are currently separate listeners for:

- Activity creation
- Notification creation

This allows more listeners to be added later without continually expanding task service/controller logic.

### Example concept

Without events:

```text
Task Service
 ├── update task
 ├── create activity
 ├── create notification
 ├── send email
 └── generate report
```

With events:

```text
Task Service
 └── update task
      └── emit event

Task event
 ├── Activity listener
 ├── Notification listener
 └── Future listeners
```

---

## Notifications

Notifications are currently **in-app only**.

They are persisted in MongoDB.

Current triggers:

| Event | Notification |
|---|---|
| Task assigned | Assigned user receives notification |
| Task completed | Relevant user receives notification |
| Priority changed | Relevant user receives notification |

Current API operations allow notifications to be:

- Listed
- Marked individually as read
- Marked all as read

Email delivery is not currently part of the implementation.

---

## Dashboard

The dashboard endpoint returns backend-calculated information.

Current dashboard information:

```text
total
completed
pending
overdue
byPriority
recentActivity
```

For a normal user, dashboard task calculations are based on tasks the user is allowed to access.

For an administrator, dashboard calculations can operate across all tasks.

The frontend displays the returned values rather than independently calculating the authoritative dashboard statistics.

---

# API Reference

Base URL for local development:

```text
https://127.0.0.1:3000/api
```

---

## Health

### Check API

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

Example body:

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

Example body:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

On success:

- A JWT is generated.
- The JWT is placed in the HttpOnly authentication cookie.
- User information is returned.
- The JWT itself is not returned as a JSON field.

---

## Get Current User

```http
GET /api/auth/me
```

Authentication:

```text
Required
```

Used by the frontend when the application starts to restore the authenticated user from the cookie.

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

The owner is determined by the authenticated user.

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

To remove the assignment:

```json
{
  "assignedTo": null
}
```

The backend applies the appropriate authorization rules before changing the assignment.

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

This endpoint is used by the frontend when displaying available users for task assignment.

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

## Environment Variables

Create a local `.env` file in the project root.

Example:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/task_management
CORS_ORIGIN=https://127.0.0.1:5500
JWT_SECRET=your-secret
COOKIE_SECURE=true
```

The repository contains `.env.example` as the template.

### Variables

| Variable | Purpose |
|---|---|
| `PORT` | Backend HTTPS port |
| `MONGODB_URI` | MongoDB connection string |
| `CORS_ORIGIN` | Allowed frontend origin |
| `JWT_SECRET` | Secret used to sign and verify JWTs |
| `COOKIE_SECURE` | Controls the cookie `secure` option |

### Important

Do not commit:

```text
.env
```

Secrets belong only in local environment configuration.

---

## Prerequisites

Install the following before running the project:

### Node.js

Install a current LTS version of Node.js.

Verify:

```bash
node -v
npm -v
```

### MongoDB

A running MongoDB instance is required.

The local configuration uses:

```text
mongodb://localhost:27017/task_management
```

### VS Code Live Server

The frontend can be served using the VS Code Live Server extension.

Because the backend and frontend use HTTPS locally, Live Server is configured to serve the frontend over HTTPS as well.

### mkcert

`mkcert` is used to create a locally trusted development certificate for the HTTPS setup.

---

## Installation

Clone the project and enter the project directory.

Then install dependencies:

```bash
npm install
```

Create the environment file:

```text
.env
```

using `.env.example` as the template.

Make sure MongoDB is running.

---

## Running the Project

### Start the backend

Development mode:

```bash
npm run dev
```

The backend runs at:

```text
https://127.0.0.1:3000
```

### Start the frontend

Open the `client` folder in VS Code and use Live Server.

The frontend should run at:

```text
https://127.0.0.1:5500
```

### Important hostname rule

Use the same hostname consistently.

The current setup uses:

```text
127.0.0.1
```

for both frontend and backend.

Do not mix:

```text
127.0.0.1
```

with:

```text
localhost
```

for the browser-facing frontend/API combination, because cookie and origin behavior can differ between them.

MongoDB can still use:

```text
localhost
```

because that is a separate database connection.

---

# Local HTTPS Setup

HTTPS certificates are for local development only.

They are not production certificates.

## 1. Install mkcert

Install `mkcert` on the development machine.

Then install the local certificate authority:

```bash
mkcert -install
```

## 2. Create a certificate directory

From the project root:

```bash
mkdir certs
```

## 3. Generate certificates

Generate a certificate for the local hosts:

```bash
mkcert localhost 127.0.0.1
```

Depending on the generated filenames, the backend configuration should reference the generated certificate and key.

The current backend expects:

```text
certs/localhost+2.pem
certs/localhost+2-key.pem
```

The actual filenames must match the files generated on the machine.

## 4. Backend HTTPS

The backend creates an HTTPS server using Node's `https` module.

Conceptually:

```text
certificate
     +
private key
     ↓
https.createServer()
     ↓
Express application
```

## 5. Frontend HTTPS

VS Code Live Server is configured to use the local certificate and key.

The workspace-specific Live Server configuration belongs in:

```text
.vscode/settings.json
```

The `.vscode` directory is ignored by Git because certificate paths are machine-specific.

## 6. Keep certificates out of Git

The following are ignored:

```text
certs/
.vscode/
```

Never commit private development keys.

---

## Testing with Postman

The browser uses the HttpOnly cookie automatically, but Postman can also test the API.

### Register

```http
POST https://127.0.0.1:3000/api/auth/register
```

Body:

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

### Login

```http
POST https://127.0.0.1:3000/api/auth/login
```

Body:

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

The response does not expose the JWT as JSON.

The authentication cookie is set by the server.

### Authenticated requests

If Postman retains the cookie from the login response, subsequent protected requests can use that cookie.

For example:

```http
GET https://127.0.0.1:3000/api/auth/me
```

### Bearer token testing

The browser authentication flow intentionally does not store the JWT in localStorage or return it from the login JSON response.

Therefore the normal browser flow is:

```text
HttpOnly cookie
```

rather than:

```text
Authorization: Bearer <token>
```

If bearer-token testing is needed for a separate API-testing workflow, the authentication design would need to expose a token to the client/test environment. That is deliberately different from the current browser security design.

### Local HTTPS certificates in Postman

Because the certificate is locally generated, Postman may require local certificate/SSL verification configuration depending on the installed certificate trust.

For local development only, configure Postman's certificate/SSL behavior appropriately rather than changing the application's production security model.

---

## Frontend Usage

### Authentication

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

This allows the application to remain logged in after a page refresh without exposing the JWT to frontend JavaScript.

### Logout

```text
User clicks logout
       ↓
POST /api/auth/logout
       ↓
Server clears cookie
       ↓
Frontend clears in-memory user state
       ↓
UI returns to logged-out state
```

### Task operations

The frontend communicates with the backend through `api.js`.

The frontend does not directly communicate with MongoDB.

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

## Example: Creating a task

```text
1. User submits task form
          ↓
2. app.js handles the UI event
          ↓
3. api.js sends POST /api/tasks
          ↓
4. Browser automatically sends HttpOnly cookie
          ↓
5. authenticateUser verifies JWT
          ↓
6. createTaskController receives authenticated request
          ↓
7. Controller calls task service
          ↓
8. Task service creates MongoDB document
          ↓
9. Task-created event is emitted
          ↓
10. Activity listener reacts
          ↓
11. Response is returned to frontend
          ↓
12. Frontend updates state/rendering
```

## Example: Login

```text
Login form
   ↓
POST /api/auth/login
   ↓
Auth controller
   ↓
Auth service
   ↓
User.authenticate()
   ↓
Password verification
   ↓
JWT creation
   ↓
Set-Cookie
   ↓
User response
```

## Example: Protected request

```text
GET /api/tasks
      ↓
Cookie
      ↓
JWT verification
      ↓
req.user = {
    userId,
    role
}
      ↓
Task controller
      ↓
Task service
      ↓
Access query
      ↓
MongoDB
```

---

# Important Design Decisions

## Controllers vs services

Business logic is kept out of routes and minimized in controllers.

This makes services reusable and keeps HTTP concerns separate from application logic.

## Backend authorization

Authorization is enforced on the server.

Frontend UI decisions are not considered security.

For example, hiding a delete button does not provide authorization by itself. The backend must still reject an unauthorized delete request.

## Backend filtering

Task filtering is handled through MongoDB queries.

This avoids unnecessarily retrieving every task and filtering the complete dataset in the browser.

## Authentication state vs authentication token

The frontend keeps the current user information in memory:

```text
currentUser
```

The JWT itself remains in the HttpOnly cookie.

This separates:

```text
UI state
```

from:

```text
authentication credential
```

## Event-driven secondary actions

Activity and notification behavior is triggered through events instead of being tightly coupled to every task operation.

## Dashboard calculations

Dashboard statistics are calculated by the backend so that the API remains the authoritative source for those values.

## Local HTTPS

HTTPS is enabled during local development to make the application's cookie and transport-security behavior closer to a secure deployment environment.

---

# Development Commands

Install dependencies:

```bash
npm install
```

Run backend in development mode:

```bash
npm run dev
```

Run the placeholder test script:

```bash
npm test
```

The current `npm test` command is still the default placeholder from the initial project setup. A full automated test suite is planned for the testing stage.

Check installed Node/npm versions:

```bash
node -v
npm -v
```

---

# Git Workflow

The project is developed incrementally.

A typical workflow is:

```bash
git status
git add .
git commit -m "type: describe change"
git log -1 --oneline
```

Examples of milestone-style commits:

```text
feat: add notification foundation
feat: move JWT authentication to HttpOnly cookies
feat: enable HTTPS for local development
docs: add project README
```

Generated certificates, environment secrets, and machine-specific VS Code configuration are excluded through `.gitignore`.

---

# Planned Extensions

The architecture is intended to grow beyond the currently implemented task-management features.

Future areas include:

## Reminders and timers

Potential functionality:

- Detect upcoming due tasks
- Create reminder notifications
- Mark overdue tasks
- Run periodic background checks

Concepts:

```text
setTimeout()
setInterval()
event loop
timer callbacks
date/time handling
```

## Background job queue

Potential job types:

```text
notification
activity log
report generation
```

The API can eventually enqueue slower work instead of waiting for it to finish.

Concepts include:

```text
FIFO queues
workers
concurrency
job states
async processing
```

## Retry and failure handling

Background jobs can eventually support:

- Retry attempts
- Increasing retry delays
- Permanent failure states
- Error details
- Worker resilience

## File exports and reports

Potential functionality:

- Export tasks as JSON
- Export tasks as CSV
- Generate reports
- Save reports
- Download reports through the API

Node.js concepts:

```text
fs/promises
readFile
writeFile
streams
Buffer
createReadStream
createWriteStream
```

## Service classes

Services can later be refactored into classes such as:

```text
TaskService
NotificationService
QueueWorker
```

This provides practice with:

```text
classes
constructors
this
bind()
call()
apply()
method references
encapsulation
```

## Centralized error handling and testing

The final architecture can introduce:

- Custom error classes
- Central Express error middleware
- Validation errors
- Database errors
- Queue-processing errors
- Unit tests
- API integration tests
- Async success/failure tests

---

# Learning Objectives

The project is also a JavaScript and Node.js learning exercise.

The major concepts covered across the project include:

### JavaScript

```text
ES modules
destructuring
arrays
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
Promises
async/await
error propagation
```

### Node.js

```text
Node runtime
EventEmitter
HTTP/HTTPS servers
filesystem APIs
streams
timers
event loop
background workers
```

### Express

```text
routing
middleware
controllers
request/response handling
authentication middleware
CORS
```

### MongoDB / Mongoose

```text
schemas
models
CRUD
queries
query operators
references
filtering
sorting
pagination
aggregation-style calculations
```

### Authentication

```text
password hashing
Passport-Local-Mongoose
JWT
cookies
HttpOnly
Secure cookies
CORS credentials
HTTPS
authentication middleware
authorization
```

### Asynchronous programming

The project progressively introduces:

```text
Promises
async/await
Promise.all()
Promise.allSettled()
Promise.race()
Promise.any()
timers
event-driven callbacks
background jobs
retry behavior
```

---

# Known Limitations

The current implementation is a development-focused application rather than a production deployment.

Current limitations include:

- Automated tests are not yet implemented.
- Centralized error middleware is not yet implemented.
- Notifications are currently in-app only.
- Email/SMTP delivery is not implemented.
- The background job queue has not yet been introduced.
- Reminder/timer functionality has not yet been introduced.
- File export/report generation has not yet been introduced.
- Local HTTPS uses development certificates.
- Certificate and VS Code paths are machine-specific.
- The current JWT expiry is configured for one day.
- The project currently uses a single local MongoDB database configuration.

These are architectural extension points rather than requirements for the current implementation.

---

# Security Notes

For local development:

- Keep `.env` out of Git.
- Keep private certificate keys out of Git.
- Use HTTPS when testing the secure-cookie configuration.
- Keep the frontend and backend origins consistent.
- Do not move the JWT back into `localStorage` simply to make frontend authentication easier.
- Treat backend authorization as the actual security boundary.
- Do not trust ownership or role values supplied by the frontend.

The current browser authentication model is:

```text
JWT
 ↓
HttpOnly + Secure cookie
 ↓
HTTPS request
 ↓
Authentication middleware
 ↓
req.user
```

---

# Project Philosophy

The project is intentionally structured so that features are introduced when they are useful rather than creating every possible architecture layer from the beginning.

The intended progression is:

```text
Task CRUD
   ↓
Query system
   ↓
Authentication
   ↓
Authorization
   ↓
Events
   ↓
Notifications
   ↓
Dashboard
   ↓
Timers
   ↓
Background jobs
   ↓
Retries
   ↓
Reports/files
   ↓
Service classes
   ↓
Centralized errors + testing
```

The goal is not only to make the application work, but to understand **why each layer exists, how asynchronous operations flow through the system, and where each responsibility belongs**.

---

## License

This project is currently a personal learning project. No production license has been defined yet.
