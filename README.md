# Municipality Management System

A full-stack web application designed to streamline municipal operations, manage citizen services, and centralize administrative workflows.

## Overview

The Municipality Management System provides a centralized platform for municipal employees and administrators to manage daily operations through a modern, user-friendly interface.

The project demonstrates full-stack development, RESTful API design, relational database management, authentication, authorization, and administrative reporting.

## Tech Stack

**Frontend**
- React.js
- JavaScript
- Vite
- CSS

**Backend**
- Node.js
- Express.js
- RESTful APIs
- JWT Authentication

**Database**
- MySQL
- Prisma ORM

**Development Tools**
- Git and GitHub
- Postman
- Visual Studio Code

## Main Features

### Dashboard
- Overview of municipal activities
- Key statistics and data visualizations
- Recent requests and financial summaries

### Citizen Management
- Register and manage citizen records
- Search, filter, and view citizen information
- Pagination and record management

### Requests and Permits
- Create and track citizen service requests
- Manage request statuses
- Issue and manage permits
- Monitor permit expiration and renewal history

### Financial Management
- Create and manage invoices
- Record payments
- View financial reports and summaries

### Human Resources
- Manage municipal HR information and administrative workflows

### Projects
- Track and manage municipal projects

### Events and Announcements
- Manage municipal events and announcements

### Document Management
- Manage documents associated with municipal operations

### Users and Security
- JWT-based authentication
- Role-based access control
- User and role management

### Audit Logs
- Track important system activities
- Review administrative changes and actions

## Project Structure

```text
MunicipalityManagementSystem/
├── backend/
│   ├── middleware/
│   ├── prisma/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── server.js
├── frontend/
│   ├── public/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── pages/
│       └── utils/
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- MySQL Server
- Git

### Installation

Clone the repository:

```bash
git clone https://github.com/husseinmansour-dot/MunicipalityManagementSystem.git
cd MunicipalityManagementSystem
```

Install backend dependencies:

```bash
cd backend
npm install
```

Configure the backend environment variables, including `DATABASE_URL` and `JWT_SECRET`, using your own development credentials.

Set up the MySQL database using the Prisma schema and the database setup procedure configured for your environment.

Start the backend:

```bash
node server.js
```

In another terminal, install and start the frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs locally using Vite. The backend and MySQL server must also be running for the application to function.

## Screenshots

Screenshots of the dashboard and major modules will be added here.

## Project Status

Core application development completed. Further security hardening, deployment preparation, and documentation improvements are ongoing.

## Author

Developed as a full-stack software development project to demonstrate practical experience with React, Node.js, Express, Prisma, and MySQL.
