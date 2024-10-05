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

### Frontend

#### Languages
- **JavaScript**  
  ![JavaScript](https://image.wanted.co.kr/optimize?src=https://static.codenary.co.kr/framework_logo/javascript.png&w=720&q=90){ width=150 height=150 }
  
- **TypeScript**  
  ![TypeScript](https://image.wanted.co.kr/optimize?src=https://static.codenary.co.kr/framework_logo/typescript.png&w=720&q=90){ width=150 height=150 }

#### Libraries
- **React**  
  ![React](https://image.wanted.co.kr/optimize?src=https://static.codenary.co.kr/framework_logo/reactjs.png&w=720&q=90){ width=150 height=150 }

- **Recoil**  
  ![Recoil](https://image.wanted.co.kr/optimize?src=https://static.codenary.co.kr/framework_logo/recoil.png&w=720&q=90){ width=150 height=150 }

#### Data Communication
- **Axios**  
  ![Axios](https://blog.kakaocdn.net/dn/yx608/btqF3Gtw2U6/942Qv3pHCRUhfj2RF66Hxk/img.png){ width=150 height=150 }

### Backend

#### Languages
- **Java 17**  
  ![Java](https://logowik.com/content/uploads/images/731_java.jpg){ width=150 height=150 }

#### Libraries
- **Spring Boot 3.2.4**  
  ![Spring Boot](https://image.wanted.co.kr/optimize?src=https://static.codenary.co.kr/framework_logo/spring.png&w=720&q=90){ width=150 height=150 }

- **Spring Data JPA**  
  ![Spring Data JPA](https://blog.retrotv.dev/content/images/2022/08/spring-data-logo.png){ width=150 height=150 }

- **JWT**  
  ![JWT](https://cdn.worldvectorlogo.com/logos/jwt-3.svg){ width=150 height=150 }

#### Databases
- **MariaDB**  
  ![MariaDB](https://image.wanted.co.kr/optimize?src=https://static.codenary.co.kr/framework_logo/awsmariadb.png&w=150&q=90){ width=150 height=150 }

- **Redis**  
  ![Redis](https://image.wanted.co.kr/optimize?src=https://static.codenary.co.kr/framework_logo/redis.png&w=150&q=90){ width=150 height=150 }

#### Server Infrastructure
- **GCP**  
  ![GCP](https://cyclr.com/wp-content/uploads/2022/05/ext-2.png){ width=150 height=150 }

### Others

#### Version Control
- **GitHub**  
  ![GitHub](https://upload.wikimedia.org/wikipedia/commons/c/c2/GitHub_Invertocat_Logo.svg){ width=150 height=150 }

#### Operating System
- **Linux (Ubuntu)**  
  ![Linux](https://i.namu.wiki/i/dtAcheXR2vN0JVNQ7mXFsIx_ciRBGYu-DJBnBwtJOV8r_-Y_sDTtyt67TGEFlh_pYjMm3da0qxXpUq4ehtgUcA.svg){ width=150 height=150 }

#### Server Management
- **Docker**  
  ![Docker](https://blog.kakaocdn.net/dn/bfqk0W/btsrDfiXt8f/Z4I2xyUAo80onGkNtxqfk0/img.webp){ width=150 height=150 }

#### Testing
- **Postman**  
  ![Postman](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgPT5cgE3Wofm3b-FoCwySaAZ6iL3uYkeuOrB-WKJSTg&s){ width=150 height=150 }

- **JUnit 5**  
  ![JUnit](https://blog.kakaocdn.net/dn/N9nlJ/btrmSxa0CyX/xRAX5RqQAABDEQzavCujN0/img.png){ width=150 height=150 }

## Key Work Items

### JWT Authentication and Authorization Mechanism Implementation
- Implemented seamless sharing of login tokens between web and app (for future app expansion).
- Differentiated storage methods for access tokens and refresh tokens (localStorage, HTTP-only Cookie).
- Set JWT expiration to 30 minutes and refresh token stored in Redis memory for frequent access.

### Ongoing Development of Writing Page
- Currently developing the writing page based on Google Form's existing questions.
- The design for the post list and detailed view pages has been completed.

### User Access Control via Spring Security and JWT
- Applied user access control using Spring Security and JWT.
- Testing completed for improved application security.

### SMTP Server Setup
- Developed an email authentication system using Google SMTP protocol for registration and password recovery.
- Sent verification codes for identity confirmation during signup and password recovery.

### Database Design for Real-Time Chat
- Completed the design of the database, excluding the message table, for real-time chat implementation.
- Ensuring relational database design adheres to at least the third normal form (3NF).

### GCP Server Setup Completed
- Set up reverse proxy, database servers, and others on Docker containers using GCP.
- Designed with the future possibility of integrating with local servers.

### Real-Time Notification System using SSE
- Completed the code for real-time notification system using SSE protocol.
- Currently improving system efficiency by integrating Redis PUB/SUB functionality.

