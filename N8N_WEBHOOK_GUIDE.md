# n8n 웹훅 블로그 포스트 자동화

n8n에서 전송되는 form 데이터를 받아 Hugo 블로그 포스트를 자동 생성하고 Git에 커밋/푸시하는 시스템입니다.

## 사용법

### 1. 환경 변수 설정

```bash
# 웹훅 보안 토큰
export HUGO_IMPORTER_WEBHOOK_SECRET="your_n8n_webhook_secret"

# Git 작성자 정보 (선택사항)
export GIT_AUTHOR_NAME="Hugo Blog Bot"
export GIT_AUTHOR_EMAIL="bot@yourdomain.com"

# 설정 파일 경로 (선택사항)
export HUGO_IMPORTER_CONFIG="config.yaml"
```

### 2. 웹훅 서버 실행

```bash
python webhook_server.py
```

### 3. n8n 웹훅 설정

n8n에서 HTTP Request 노드를 사용하여 다음과 같이 설정:

**URL**: `http://your-server:port/webhook`
**Method**: POST
**Headers**:
- `X-N8N-Token`: `your_n8n_webhook_secret`
- `Content-Type`: `application/json`

**Body**:
```json
{
  "form_data": {
    "title": "포스트 제목",
    "content": "포스트 내용 (마크다운)",
    "description": "포스트 설명",
    "tags": ["tag1", "tag2"],
    "categories": ["category1"],
    "draft": false,
    "commentable": true,
    "date": "2024-01-01",
    "image_placement": 1,
    "image_focal_point": "Center",
    "image_preview_only": true,
    "show_related": true
  }
}
```

## 데이터 구조

### form_data 필드

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| title | string | ✓ | "제목 없음" | 포스트 제목 |
| content | string | ✓ | "" | 포스트 내용 (마크다운) |
| description | string | | "" | 포스트 설명 |
| tags | array | | [] | 태그 목록 |
| categories | array | | ["general"] | 카테고리 목록 |
| draft | boolean | | false | 초안 여부 |
| commentable | boolean | | true | 댓글 허용 여부 |
| date | string | | 현재 날짜 | 게시 날짜 (YYYY-MM-DD) |
| image_placement | number | | 1 | 이미지 배치 |
| image_focal_point | string | | "Center" | 이미지 초점 |
| image_preview_only | boolean | | true | 썸네일만 표시 |
| show_related | boolean | | true | 관련 포스트 표시 |

## 작동 과정

1. **웹훅 수신**: n8n에서 전송된 POST 요청을 받습니다.
2. **인증 확인**: `X-N8N-Token` 헤더를 확인하여 요청을 검증합니다.
3. **포스트 생성**: 받은 데이터로 Hugo 마크다운 파일을 생성합니다.
4. **자동 번호 부여**: `/content/ko/post/` 디렉토리에서 다음 번호를 자동 할당합니다.
5. **Git 커밋**: 생성된 파일을 Git에 추가하고 커밋합니다.
6. **원격 푸시**: 원격 저장소에 변경사항을 푸시합니다.

## 파일 구조

```
content/ko/post/
├── 1/
│   └── index.md
├── 2/
│   └── index.md
└── {auto_number}/
    └── index.md  # 새로 생성된 포스트
```

## 응답 코드

- `200`: 성공적으로 포스트 생성 및 푸시 완료
- `207`: 포스트는 생성되었으나 Git 푸시 실패
- `400`: 잘못된 요청 데이터
- `403`: 인증 실패
- `500`: 서버 내부 오류

## 예제 n8n 워크플로우

1. **Form Trigger**: 웹 폼에서 데이터 수집
2. **Function Node**: 데이터 포맷팅
3. **HTTP Request**: 웹훅으로 데이터 전송

## 로그 확인

웹훅 처리 과정은 모두 로그로 기록됩니다:

```bash
tail -f logs/webhook.log
```

## 주의사항

- 포스트 번호는 자동으로 할당되므로 중복되지 않습니다.
- Git 권한이 설정되어 있어야 푸시가 가능합니다.
- 웹훅 토큰은 반드시 안전하게 관리하세요.
- 대용량 파일 업로드는 별도로 처리해야 합니다.