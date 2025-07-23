---
title: "🐳 docker-files"
date: 2024-03-05
featured: false
draft: false
weight: 30
tags: ["Docker", "Supabase", "PostgreSQL", "Vector DB"]
categories: ["DevOps", "Database"]
---

## Docker 및 Supabase 설정 모음

### 핵심 내용
- Supabase를 벡터 DB로 활용하는 방법
- pgvector 확장을 통한 임베딩 저장
- n8n 워크플로우와의 연동 가이드

### 특징
- Self-hosted PostgreSQL 구성
- 벡터 검색 기능 구현
- 컨테이너 기반 배포
- 자동화된 설정 스크립트

### 주요 구성요소
- **데이터베이스**: PostgreSQL + pgvector
- **플랫폼**: Supabase
- **오케스트레이션**: Docker Compose
- **워크플로우**: n8n 연동

### 용도
AI 애플리케이션을 위한 벡터 데이터베이스 구축과 워크플로우 자동화를 위한 인프라 설정을 제공합니다.