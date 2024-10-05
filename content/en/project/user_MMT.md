---
title: "User Career Management Web Project"
type: project
date: 2024-10-06
description: "A user career management web project developed using Java, Spring Boot, React, MongoDB, and more."
tags: ["Java", "Spring Boot", "React", "MongoDB", "Redis", "MariaDB"]
weight: 50
draft: false
---

## Overview
The User Career Management Web Project is being developed to provide users with a platform to manage and track their career progress. The system uses Spring Boot for the backend, React for the frontend, and integrates various databases such as MongoDB, MariaDB, and Redis for efficient data handling.

## Tech Stack

| **Category**          | **Technology Stack**                                          |
|-----------------------|---------------------------------------------------------------|
| **Frontend**           | JavaScript, TypeScript                                        |
| **Libraries**          | React, Recoil                                                 |
| **Data Communication** | Axios                                                         |
| **Backend Languages**  | Java 17                                                       |
| **Backend Libraries**  | Spring Boot 3.2.4, Spring Data JPA, JWT                       |
| **Databases**          | MariaDB, Redis                                                |
| **Server Infrastructure** | GCP                                                         |
| **Version Control**    | GitHub                                                        |
| **Operating System**   | Linux (Ubuntu)                                                |
| **Server Management**  | Docker                                                        |
| **Testing Tools**      | Postman, JUnit 5                                              |

## Key Work Items

### JWT Authentication and Authorization Mechanism Implementation
- Implemented seamless sharing of login tokens between web and app.
- Differentiated storage methods for access tokens and refresh tokens (localStorage and HTTP-only Cookie).
- Set JWT expiration to 30 minutes and stored refresh tokens in Redis memory for frequent access.

### Ongoing Development of Writing Page
- Currently developing the writing page based on Google Form’s existing questions.
- Completed design for post listing and detailed view pages.

### User Access Control via Spring Security and JWT
- Applied user access control using Spring Security and JWT.
- Completed testing to ensure application security.

### SMTP Server Setup
- Implemented an email authentication system using Google SMTP protocol for registration and password recovery.
- Sent verification codes for identity confirmation during signup and for password recovery.

### Database Design for Real-Time Chat
- Completed the design of the database, excluding the message table, for real-time chat implementation.
- Ensuring the relational database design adheres to at least the third normal form (3NF).

### GCP Server Setup Completed
- Set up reverse proxy, database servers, and others using Docker containers on GCP.
- Designed with future integration possibilities for local servers in mind.

### Real-Time Notification System using SSE
- Completed the code for the real-time notification system using the SSE protocol.
- Currently improving system efficiency by integrating Redis PUB/SUB functionality.
