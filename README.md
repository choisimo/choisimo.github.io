# nodove의 개발 블로그

개발과 기술에 대한 생각과 경험을 공유하는 개인 블로그입니다.

## 🚀 기술 스택

- **Frontend**: Vanilla JavaScript (SPA)
- **Styling**: CSS3 with CSS Grid & Flexbox
- **Build**: Python (Markdown → JSON 변환)
- **Deployment**: GitHub Pages + GitHub Actions
- **Content**: Markdown posts with YAML frontmatter

## 📁 프로젝트 구조

```
├── index.html              # 메인 HTML 파일
├── scripts/
│   ├── main.js             # 메인 애플리케이션 로직
│   ├── router.js           # SPA 라우팅
│   ├── markdown-parser.js  # 마크다운 파서 (JSON 기반)
│   └── theme-toggle.js     # 테마 토글
├── styles/
│   └── main.css           # 메인 스타일시트
├── posts/
│   ├── 2024/              # 2024년 포스트
│   └── 2025/              # 2025년 포스트
├── data/                  # 빌드된 JSON 데이터 (auto-generated)
│   ├── posts.json         # 모든 포스트 데이터
│   ├── posts_2024.json    # 2024년 포스트
│   ├── posts_2025.json    # 2025년 포스트
│   └── metadata.json      # 블로그 메타데이터
├── build.py               # 빌드 스크립트
├── Makefile              # 개발/빌드 자동화
└── .github/workflows/
    └── publish.yaml      # GitHub Actions 배포
```

## 🛠️ 개발 환경 설정

### 요구사항
- Python 3.11+
- PyYAML

### 로컬 개발

```bash
# 의존성 설치
pip install PyYAML

# 정적 데이터 빌드
make build-data

# 개발 서버 시작 (http://localhost:8000)
make serve

# 빌드 테스트
make test

# 파일 변경 감지 + 자동 재빌드 (Linux/macOS)
make dev
```

## 📝 새 포스트 작성

1. `posts/YYYY/` 디렉토리에 마크다운 파일 생성
2. YAML frontmatter 작성:

```yaml
---
title: "포스트 제목"
date: "2025-01-01"
author: "nodove"
tags: ["tag1", "tag2"]
categories: ["category"]
excerpt: "포스트 요약"
---

# 포스트 내용

마크다운으로 작성...
```

3. 빌드 및 테스트:

```bash
make build-data
make serve
```

## 🚀 배포

GitHub에 push하면 자동으로 GitHub Actions가 실행되어 배포됩니다.

```bash
git add .
git commit -m "새 포스트 추가"
git push origin main
```

## ✨ 주요 기능

- **📱 반응형 디자인**: 모바일, 태블릿, 데스크톱 지원
- **🌓 다크/라이트 테마**: 시스템 설정 자동 감지
- **🔍 실시간 검색**: 제목, 내용, 태그 검색
- **🏷️ 태그/카테고리 필터링**: 포스트 분류별 탐색
- **📊 통계**: 포스트 수, 태그 수, 카테고리 수
- **⚡ 빠른 로딩**: 정적 JSON 기반 SPA
- **🎨 코드 하이라이팅**: 프로그래밍 언어별 구문 강조

## 🔧 기술적 특징

### GitHub Pages 최적화
- 마크다운 파일을 정적 JSON으로 사전 변환
- 클라이언트 사이드에서 빠른 로딩
- CORS 문제 없음

### 성능 최적화
- Vanilla JavaScript (프레임워크 없음)
- 지연 로딩 및 캐싱
- 최소한의 HTTP 요청

### SEO 친화적
- 메타 태그 동적 업데이트
- Open Graph 지원
- 구조화된 데이터

## 📈 블로그 통계

현재 **58개**의 포스트가 게시되어 있습니다.

- **2025년**: 28개 포스트
- **2024년**: 30개 포스트

주요 주제: 알고리즘, AI/ML, 웹 개발, DevOps, Linux

## 📧 연락처

- **GitHub**: [@choisimo](https://github.com/choisimo)
- **Blog**: [choisimo.github.io](https://choisimo.github.io)

---

**nodove** - 기술과 개발에 대한 지속적인 학습과 공유