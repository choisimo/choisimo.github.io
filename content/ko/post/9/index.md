---
title: "Nginx 설정 파일 구조 및 작성 방법"
date: 2024-10-06
description: "Nginx 설정 파일(conf)의 구조와 작성 방법에 대한 가이드."
tags: ["Nginx", "Configuration", "Web Server"]
---


Nginx는 고성능 웹 서버로, 서버 설정 파일(`nginx.conf`)을 통해 서버의 동작을 세밀하게 제어할 수 있습니다. 이 문서에서는 Nginx 설정 파일의 기본 구조와 작성 방법을 다룹니다.

## Nginx 설정 파일의 위치
기본적으로 Nginx 설정 파일은 `/etc/nginx/nginx.conf`에 위치해 있으며, 각 서버의 환경에 따라 다를 수 있습니다. 기본 구조는 다음과 같습니다.

```bash
/etc/nginx/
├── nginx.conf          # 메인 설정 파일
├── sites-available/    # 사용 가능한 가상 호스트 설정 파일
└── sites-enabled/      # 활성화된 가상 호스트 설정 파일 (심볼릭 링크로 연결됨)
```


## main context
{{< spoiler text="클릭해서 코드 보기" >}}

```code
# Main context
user www-data;
worker_processes auto;
pid /run/nginx.pid;
events {
    worker_connections 1024;
}

# HTTP context
http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    sendfile on;
    keepalive_timeout 65;

    # Gzip 설정
    gzip on;

    # Server block
    server {
        listen 80;  # HTTP 포트
        server_name example.com www.example.com;

        # 로그 파일 경로
        access_log /var/log/nginx/example.access.log;
        error_log /var/log/nginx/example.error.log;

        # Location block
        location / {
            root /var/www/html;
            index index.html index.htm;
        }

        # 특정 경로에 대한 설정
        location /images/ {
            alias /var/www/images/;
        }

        # 리버스 프록시 설정
        location /api/ {
            proxy_pass http://localhost:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}

```
{{< /spoiler >}}



### SSL 설정

{{< spoiler text="클릭해서 SSL 설정 코드 보기" >}}

```code
server {
    listen 443 ssl;
    server_name example.com;

    ssl_certificate /etc/nginx/ssl/example.com.crt;
    ssl_certificate_key /etc/nginx/ssl/example.com.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        root /var/www/html;
        index index.html;
    }
}
```
{{< /spoiler >}}



### Redirect 설정

{{< spoiler text="클릭해서 Redirect 설정 보기" >}}
```code
server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://$host$request_uri;
}
```
{{< /spoiler >}}


### Nginx 설정 파일 적용

{{< spoiler text="클릭해서 Nginx 설정 파일 적용 방법 보기" >}}

```code
# 설정 파일 문법 확인
sudo nginx -t

# 설정을 다시 불러오기 (다운타임 없이)
sudo systemctl reload nginx

# Nginx 재시작
sudo systemctl restart nginx

```

{{< /spoiler >}}
