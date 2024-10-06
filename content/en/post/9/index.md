---
title: "Nginx Configuration File Structure and How to Write It"
date: 2024-10-06
description: "A guide to the structure and writing methods of the Nginx configuration file (conf)."
tags: ["Nginx", "Configuration", "Web Server"]
---

# Nginx Configuration File Structure and How to Write It

Nginx is a high-performance web server, and the server's behavior can be finely controlled through its configuration file (`nginx.conf`). This document covers the basic structure and writing methods for the Nginx configuration file.

## Location of the Nginx Configuration File
By default, the Nginx configuration file is located at `/etc/nginx/nginx.conf`, though the location may vary depending on the server environment. The default structure is as follows:

```bash
/etc/nginx/
├── nginx.conf          # Main configuration file
├── sites-available/    # Available virtual host configurations
└── sites-enabled/      # Enabled virtual host configurations (linked via symlinks)
```

### configuration of File Structure

{{< spoiler text="click to see code" >}}

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



### SSL configuration
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





### Redirect configuration
```code
server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://$host$request_uri;
}
```



### how to set
```shell
# Test the configuration file for syntax errors
sudo nginx -t

# Reload the configuration without downtime
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

```