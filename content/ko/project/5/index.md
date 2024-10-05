---
title: "유저 경력 관리 웹 프로젝트"
type: project
date: 2024-10-06
description: "Java, Spring Boot, React, MongoDB 등을 사용하여 개발 중인 유저 경력 관리 웹 프로젝트입니다."
tags: ["Java", "Spring Boot", "React", "MongoDB", "Redis", "MariaDB"]
---

<div>
    <h1>기술 스택</h1>
    <h2>프론트엔드</h2>
    <h3>언어</h3>
    JavaScript <img src="https://image.wanted.co.kr/optimize?src=https://static.codenary.co.kr/framework_logo/javascript.png&w=720&q=90" width = '32px' height='32px'><br>
    TypeScript <img src="https://image.wanted.co.kr/optimize?src=https://static.codenary.co.kr/framework_logo/typescript.png&w=720&q=90" width="32px" height = "32px"><br><br>
    <h3>라이브러리</h3>
    React <img src="https://image.wanted.co.kr/optimize?src=https://static.codenary.co.kr/framework_logo/reactjs.png&w=720&q=90" width = '32px' height='32px'><br>
    Recoil <img src="https://image.wanted.co.kr/optimize?src=https://static.codenary.co.kr/framework_logo/recoil.png&w=720&q=90" width = '32px' height='32px'><br><br>
    <h3>데이터통신</h3>
    Axios <img src="https://blog.kakaocdn.net/dn/yx608/btqF3Gtw2U6/942Qv3pHCRUhfj2RF66Hxk/img.png" width = '32px' height='32px'><br><br>
</div>

<center>
    <h2>백엔드</h2>
    <h3>언어</h3>
    java 17 <img src="https://logowik.com/content/uploads/images/731_java.jpg" width='32px' height='32px'> <br><br>
    <h3>라이브러리</h3>
    Spring boot 3.2.4 <img src="https://image.wanted.co.kr/optimize?src=https://static.codenary.co.kr/framework_logo/spring.png&w=720&q=90" width = '32' height = '32'><br>
    Spring Data JPA <img src="https://blog.retrotv.dev/content/images/2022/08/spring-data-logo.png" width='32' height='32'/><br><br>
    JWT <img src="https://cdn.worldvectorlogo.com/logos/jwt-3.svg" width = '32' height = '32'/><br>
    <h3>데이터베이스</h3>
    MariaDB<img src="https://image.wanted.co.kr/optimize?src=https://static.codenary.co.kr/framework_logo/awsmariadb.png&w=150&q=90" width = '32' height = '32'/><br>
    Redis<img src="https://image.wanted.co.kr/optimize?src=https://static.codenary.co.kr/framework_logo/redis.png&w=150&q=90" width = '32' height = '32'/><br><br>
    <h3>서버 기반</h3>
    GCP<img src="https://cyclr.com/wp-content/uploads/2022/05/ext-2.png" width = '32' height = '32'/><br><br>
</center>

<center>
    <h2>기타</h2>
    <h3>버전관리</h3>
    Github <img src="https://upload.wikimedia.org/wikipedia/commons/c/c2/GitHub_Invertocat_Logo.svg" width = '32' height = '32'/><br><br>
    <h3>운영체제</h3>
    Linux(Ubuntu) <img src="https://i.namu.wiki/i/dtAcheXR2vN0JVNQ7mXFsIx_ciRBGYu-DJBnBwtJOV8r_-Y_sDTtyt67TGEFlh_pYjMm3da0qxXpUq4ehtgUcA.svg" width = '32' height = '32'/>
    <h3>서버관리</h3>
    Docker <img src="https://blog.kakaocdn.net/dn/bfqk0W/btsrDfiXt8f/Z4I2xyUAo80onGkNtxqfk0/img.webp" width = '32' height = '32'/>
    <h3>테스트</h3>
    Postman <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgPT5cgE3Wofm3b-FoCwySaAZ6iL3uYkeuOrB-WKJSTg&s" width = '32' height = '32'/><br>
    JUnit 5 <img src="https://blog.kakaocdn.net/dn/N9nlJ/btrmSxa0CyX/xRAX5RqQAABDEQzavCujN0/img.png" width = '32' height = '32'/>
</center>

```text
## JWT authentication, authorization 구현 로그인 구축 완료
- 웹과 앱의 원활한 사용자 로그인 토큰 공유 방식을 채택 (session의 statless 문제 극복)
- 보안을 위한 access token, refresh token 저장 방식의 구별화 (localStorage, HTTP-only Cookie)
- jwt의 만료 시간 30분 설정, refresh token 의 잦은 접근 갱신을 위한 redis memory 저장 방식 구축
- 유저 관리 페이지, 로그인, 회원가입 페이지 프론트, 백 모두 제작 및 연동 완료
```
JWT 인증 및 권한 부여 메커니즘을 구현하여 웹과 앱 사용자 간의(미래에 만들 앱에 대한 확장성 고려)
 로그인 토큰 공유를 가능하게 하였습니다. 보안 측면에서는 액세스 토큰과 리프레시 토큰의 저장 방식을 
 구별하여, 액세스 토큰의 만료 시간을 30분으로 설정하고, 리프레시 토큰은 더 안전한 레디스 
 메모리 저장 방식을 채택했습니다. 이는 세션의 상태 비저장 문제를 극복하고 
 토큰 기반 인증의 보안을 강화하는 데 기여합니다.
```
## 글쓰기 페이지 제작 중
```
글쓰기 페이지 제장 중이며 (현재 구글폼에 있는 질문들)
글 리스트 및 자세히 보기 페이지 디자인 제작 완료
```
## 스프링 시큐리티 및 jwt 를 활용한 사용자 접근 제어 방식 적용 완료 및 테스트 완료 
```
스프링 시큐리티와 JWT를 활용하여 사용자 접근 제어 방식을 적용하고 테스트를 완료했습니다.
이는 애플리케이션의 보안성을 더욱 강화하고, 사용자 인증 및 권한 부여 과정을 효율적으로 
관리하기 위한 방법입니다.
```
## SMTP(email) 서버 구축
-> 초기 회원가입 회원 실명 인증을 위한 이메일 실명 사용 이메일 확인을 위한 확인 코드 전송
-> 비밀번호 잊어버릴 경우를 위한 아이디 전송을 통한 연결 이메일 코드 전송
```
SMS 와 같은 서비스들은 기타 비용이 부과되기 때문에 구글 SMTP 프로토콜 서버를 이용한 
이메일 전송 시스템을 구축했습니다. 
```
## 실시간 채팅을 위한 message table 을 제외한 나머지 관계 디비 생성 완료 후 정규형 보완 중
```
실시간 채팅 구현 방식에 대해서는 nosql과 relational DB 간의 장단점을 고려하여 의논 중입니다.
또한 수십개의 테이블을 생성하였으나, 혹시 모를 데이터 Atomicity, Consistency, Isolation, 
Durability 위배 사항이 없는지 검토하며 연동 중이며, 이를 위한 최소 3 정규형 이상을 목표로
하는 relational Database 설계를 하는 중입니다.
```
## GCP 구글 서버 구축 완료  및 database 서버, 스토리지, reverse proxy server 구축 완료
```
GCP 서버를 사용하며 혹시 모를 미래의 로컬 서버 연동할 가능성에 염두하여 nginx reverse proxy
server, database 서버 등을 docker container 에 구축하여 너무 의존적이지 않게 했습니다.
```
## SSE 프로토콜을 활용한 실시간 알림 시스템 제작 중
```
 SSE 프로토콜을 사용한 실시간 알림 시스템의 코드 작성을 마쳤으며, 현재는 redis의 PUB/SUB 기능과의 연동을 통해 시스템의 효율성을 더욱 높이는 작업에 집중하고 있습니다.
```
##
```
그 외 다수 동시 진행 중인 자잘자잘한 프로젝트들 존재
```

## 개요
유저 경력 관리 웹 프로젝트는 사용자가 자신의 경력 진행 상황을 관리하고 추적할 수 있는 플랫폼을 제공하기 위해 개발 중입니다. 백엔드에는 Spring Boot, 프론트엔드에는 React를 사용하며, MongoDB, MariaDB, Redis와 같은 다양한 데이터베이스를 통합하여 효율적인 데이터 처리를 구현하고 있습니다.

## 기술 스택
- Java
- Spring Boot
- React
- MongoDB
- MariaDB
- Redis

## 주요 기능
- 유저 경력 진행 상황 추적
- 경력 통계에 대한 데이터 시각화
- 여러 데이터베이스와의 통합을 통한 효율적인 데이터 저장
- 프론트엔드와 백엔드 간의 RESTful API 지원
