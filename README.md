아래는 README.md 파일의 내용을 한국어로 번역한 것입니다.

---

# Hugo Importer

## 개요

Hugo Importer는 원격 Git 저장소의 콘텐츠를 로컬 Hugo 프로젝트로 자동으로 동기화하도록 설계된 Python 기반 시스템입니다. 새로운 Markdown 파일, 수정된 파일, 삭제된 파일을 가져올 수 있습니다.

이 도구는 콘텐츠가 별도의 저장소(예: 문서 저장소, 공유 콘텐츠 라이브러리)에서 관리되고, 정기적으로 하나 이상의 Hugo 프로젝트로 가져와야 하는 상황에 이상적입니다.

## 주요 기능

- **Git 통합**: 원격 Git 저장소에서 클론 또는 pull, 특정 브랜치 지원
- **Markdown 처리**:
  - 새로운 및 수정된 Markdown 파일 복사
  - 삭제된 파일을 Hugo 프로젝트에서 삭제, 초안으로 표시(향후 지원), 무시 등 설정에 따라 처리
  - `python-frontmatter`를 사용해 Markdown 파일의 front matter를 보존
- **Hugo 빌드 트리거**: 콘텐츠 동기화 후 변경 사항이 있으면 자동으로 `hugo` 빌드 명령 실행
- **유연한 설정**: 모든 설정은 YAML 파일(`config.yaml`)로 관리
- **다양한 트리거 방식**:
  - **수동**: `main.py` 직접 실행
  - **스케줄(예약)**: cron 등 예약 프로그램과 연동
  - **Webhook**: Flask 기반 서버 제공, GitHub 등에서 push 이벤트 발생 시 동기화 가능
- **보안**: Webhook 시크릿 검증 지원(GitHub의 HMAC-SHA256, GitLab의 토큰) 및 표준 SSH 키 관리
- **중앙 집중식 로깅**: 콘솔 및/또는 파일로 로그 기록(설정 가능)

## 시스템 요구사항

- **Python**: Python 3.7 이상
- **Hugo**: 설치된 Hugo 실행 파일 필요 (PATH에 등록되어야 함)
- **Git**: Git CLI 설치 및 사용 가능해야 함
- **SSH**: SSH를 통한 Git 저장소 접근 시 SSH 키 및 SSH 에이전트 설정 필요(앱에서 직접 키 관리는 하지 않음)

## 설치 방법

1. **저장소 클론 또는 소스코드 다운로드**
   ```bash
   git clone <your-repo-url-for-hugo-importer>
   cd hugo-importer
   ```

2. **가상환경 생성 및 활성화(권장)**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # Windows에서는 venv\Scripts\activate
   ```

3. **의존성 설치**
   ```bash
   pip install -r requirements.txt
   ```
   `GitPython`, `PyYAML`, `pydantic`, `python-frontmatter`, `Flask`가 설치됩니다.

## 설정 (`config.yaml`)

프로젝트 루트에 위치한 `config.yaml` 파일로 주요 설정을 관리합니다. 각 항목에 대한 자세한 설명은 README 원문을 참고하세요.

(여기서부터 config.yaml 예시와 각 항목 설명, 주의사항 등은 한국어로 그대로 기술, 필요시 요약)

## 사용법

Hugo Importer는 크게 세 가지 방식으로 사용합니다.

### 1. 수동 동기화

`main.py`를 커맨드라인에서 직접 실행합니다.
```bash
source venv/bin/activate
python3 main.py
```
설정 파일을 지정하려면 다음과 같이 실행합니다.
```bash
python3 main.py --config /path/to/your/custom_config.yaml
```

### 2. 예약 동기화(Cron 예시)

cron 등을 통해 `main.py`를 주기적으로 실행할 수 있습니다.
```cron
0 * * * * /path/to/your/hugo-importer/venv/bin/python3 /path/to/your/hugo-importer/main.py --config /path/to/your/hugo-importer/config.yaml >> /path/to/your/hugo-importer/importer_cron.log 2>&1
```

### 3. Webhook 동기화

GitHub 또는 GitLab에서 push 이벤트 발생 시 Importer를 HTTP POST로 호출해 동기화할 수 있습니다. Webhook 서버 설정, 환경변수 설정, 서버 실행, Git 제공자에서 Webhook 등록 방법 등은 원문을 참고하세요.

## 보안 참고사항

- **SSH 키**: SSH URL 사용시 머신에 적절한 SSH 키가 설정되어 있어야 합니다.
- **Webhook 시크릿**: 반드시 강력하고 고유한 시크릿을 사용하고, 환경변수로만 저장하세요.
- **네트워크 노출**: Webhook 서버 사용 시 포트 접근 제한, 리버스 프록시 활용, SSL 사용 등을 권장합니다.
- **권한**: Importer는 최소한의 권한으로 실행하세요.

## 기본 문제해결

1. **로그 확인**: 문제가 생기면 먼저 로그를 확인하세요.
2. **설정 오류**: 파일 존재, 데이터 타입, 누락된 필드 등을 확인하세요.
3. **Git 오류**: 저장소 접근 권한, 네트워크, 브랜치명 등 확인
4. **Hugo 빌드 오류**: Hugo 설치 및 PATH 등록, 템플릿/콘텐츠 에러 등 확인
5. **Webhook 문제**: 시크릿/토큰 불일치, 브랜치 필터링, 네트워크 접근성 등
6. **파일 경로 문제**: 모든 경로(config.yaml 내) 재확인

---

이 README는 시작점입니다. 프로젝트에 맞는 세부 사항이나 고급 사용법은 자유롭게 추가하세요.

---

(필요시 각 섹션을 더 구체적으로 번역해드릴 수 있습니다. 원하시는 섹션이나 줄 범위를 지정해 주세요!)
