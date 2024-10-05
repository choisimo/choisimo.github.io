---
title: "유저 경력 관리 웹 프로젝트"
type: project
date: 2024-10-06
description: "Java, Spring Boot, React, MongoDB 등을 사용하여 개발 중인 유저 경력 관리 웹 프로젝트입니다."
tags: ["Java", "Spring Boot", "React", "MongoDB", "Redis", "MariaDB"]
weight: 50
draft: false
---

## 개요
유저 경력 관리 웹 프로젝트는 사용자가 자신의 경력 진행 상황을 관리하고 추적할 수 있는 플랫폼을 제공하기 위해 개발 중입니다. 백엔드에는 Spring Boot, 프론트엔드에는 React를 사용하며, MongoDB, MariaDB, Redis와 같은 다양한 데이터베이스를 통합하여 효율적인 데이터 처리를 구현하고 있습니다.

## 기술 스택

### 프론트엔드

#### 언어
- **JavaScript**  
  ![JavaScript](https://image.wanted.co.kr/optimize?src=https://static.codenary.co.kr/framework_logo/javascript.png&w=720&q=90)
  
- **TypeScript**  
  ![TypeScript](https://image.wanted.co.kr/optimize?src=https://static.codenary.co.kr/framework_logo/typescript.png&w=720&q=90)

#### 라이브러리
- **React**  
  ![React](https://image.wanted.co.kr/optimize?src=https://static.codenary.co.kr/framework_logo/reactjs.png&w=720&q=90)

- **Recoil**  
  ![Recoil](https://image.wanted.co.kr/optimize?src=https://static.codenary.co.kr/framework_logo/recoil.png&w=720&q=90)

#### 데이터 통신
- **Axios**  
  ![Axios](https://blog.kakaocdn.net/dn/yx608/btqF3Gtw2U6/942Qv3pHCRUhfj2RF66Hxk/img.png)

### 백엔드

#### 언어
- **Java 17**  
  ![Java](https://logowik.com/content/uploads/images/731_java.jpg)

#### 라이브러리
- **Spring Boot 3.2.4**  
  ![Spring Boot](https://image.wanted.co.kr/optimize?src=https://static.codenary.co.kr/framework_logo/spring.png&w=720&q=90)

- **Spring Data JPA**  
  ![Spring Data JPA](https://blog.retrotv.dev/content/images/2022/08/spring-data-logo.png)

- **JWT**  
  ![JWT](https://cdn.worldvectorlogo.com/logos/jwt-3.svg)

#### 데이터베이스
- **MariaDB**  
  ![MariaDB](https://image.wanted.co.kr/optimize?src=https://static.codenary.co.kr/framework_logo/awsmariadb.png&w=150&q=90)

- **Redis**  
  ![Redis](https://image.wanted.co.kr/optimize?src=https://static.codenary.co.kr/framework_logo/redis.png&w=150&q=90)

#### 서버 기반
- **GCP**  
  ![GCP](https://cyclr.com/wp-content/uploads/2022/05/ext-2.png)

### 기타

#### 버전 관리
- **GitHub**  
  ![GitHub](https://upload.wikimedia.org/wikipedia/commons/c/c2/GitHub_Invertocat_Logo.svg)

#### 운영체제
- **Linux(Ubuntu)**  
  ![Linux](https://i.namu.wiki/i/dtAcheXR2vN0JVNQ7mXFsIx_ciRBGYu-DJBnBwtJOV8r_-Y_sDTtyt67TGEFlh_pYjMm3da0qxXpUq4ehtgUcA.svg)

#### 서버 관리
- **Docker**  
  ![Docker](https://blog.kakaocdn.net/dn/bfqk0W/btsrDfiXt8f/Z4I2xyUAo80onGkNtxqfk0/img.webp)

#### 테스트
- **Postman**  
  ![Postman](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgPT5cgE3Wofm3b-FoCwySaAZ6iL3uYkeuOrB-WKJSTg&s)

- **JUnit 5**  
  ![JUnit](https://blog.kakaocdn.net/dn/N9nlJ/btrmSxa0CyX/xRAX5RqQAABDEQzavCujN0/img.png)

## 주요 작업 내용

### JWT 인증 및 권한 부여 메커니즘 구현
- 웹과 앱의 원활한 사용자 로그인 토큰 공유 방식 도입.
- 보안을 위한 access token과 refresh token 저장 방식 구분 (localStorage와 HTTP-only Cookie).
- JWT의 만료 시간 30분 설정, refresh token은 Redis memory에 저장하여 잦은 접근을 처리.

### 글쓰기 페이지 제작 중
- 현재 글쓰기 페이지를 제작 중이며, 구글폼에 있는 질문을 참고하여 개발 중.
- 글 목록 및 자세히 보기 페이지 디자인 완료.

### 스프링 시큐리티 및 JWT를 활용한 사용자 접근 제어
- 스프링 시큐리티와 JWT를 통해 사용자 접근 제어 구현 및 테스트 완료.

### SMTP 서버 구축
- 구글 SMTP 프로토콜을 사용하여 이메일 인증 시스템 구현.
- 초기 회원가입 시 이메일 인증 및 비밀번호 복구 기능 구현.

### 실시간 채팅을 위한 데이터베이스 설계
- 실시간 채팅 기능을 위해 message table을 제외한 데이터베이스 설계 완료.
- 수십 개의 테이블을 생성하며 정규화를 보완 중.

### GCP 서버 구축
- GCP에서 reverse proxy, database 서버 등을 Docker로 구성하여 구축 완료.
- 미래 로컬 서버와의 연동을 고려한 설계.

### SSE 프로토콜을 활용한 실시간 알림 시스템 개발 중
- SSE 프로토콜을 사용하여 실시간 알림 시스템 구현 중.
- Redis PUB/SUB과 연동하여 시스템 효율성 향상 작업 중.

