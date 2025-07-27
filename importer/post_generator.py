"""
Hugo 블로그 포스트 생성기
n8n 웹훅 데이터를 받아 Hugo 마크다운 파일을 생성합니다.
"""

import os
import re
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class HugoPostGenerator:
    """Hugo 블로그 포스트 생성 클래스"""
    
    def __init__(self, content_dir: str = "content/ko/post"):
        self.content_dir = Path(content_dir)
        self.content_dir.mkdir(parents=True, exist_ok=True)
    
    def sanitize_filename(self, text: str) -> str:
        """파일명에 안전한 문자열로 변환"""
        # 한글, 영문, 숫자, 하이픈, 언더스코어만 허용
        sanitized = re.sub(r'[^\w\s-]', '', text, flags=re.UNICODE)
        sanitized = re.sub(r'[-\s]+', '-', sanitized)
        return sanitized.strip('-').lower()
    
    def get_next_post_number(self) -> int:
        """다음 포스트 번호 계산"""
        existing_dirs = [d for d in self.content_dir.iterdir() 
                        if d.is_dir() and d.name.isdigit()]
        if not existing_dirs:
            return 1
        
        return max(int(d.name) for d in existing_dirs) + 1
    
    def generate_frontmatter(self, data: Dict[str, Any]) -> str:
        """Hugo frontmatter 생성"""
        frontmatter = {
            "widget": "post",
            "title": data.get("title", "제목 없음"),
            "date": data.get("date", datetime.now().strftime("%Y-%m-%d")),
            "draft": data.get("draft", False),
            "description": data.get("description", ""),
            "tags": data.get("tags", []),
            "categories": data.get("categories", ["general"]),
            "type": "post",
            "commentable": data.get("commentable", True),
            "image": {
                "placement": data.get("image_placement", 1),
                "focal_point": data.get("image_focal_point", "Center"),
                "preview_only": data.get("image_preview_only", True),
                "show_related": data.get("show_related", True)
            }
        }
        
        # YAML frontmatter 생성
        yaml_content = "---\n"
        for key, value in frontmatter.items():
            if isinstance(value, dict):
                yaml_content += f"{key}:\n"
                for sub_key, sub_value in value.items():
                    yaml_content += f"  {sub_key}: {json.dumps(sub_value) if isinstance(sub_value, (bool, str)) else sub_value}\n"
            elif isinstance(value, list):
                yaml_content += f"{key}:\n"
                for item in value:
                    yaml_content += f"  - \"{item}\"\n"
            else:
                yaml_content += f"{key}: {json.dumps(value) if isinstance(value, (bool, str)) else value}\n"
        yaml_content += "---\n\n"
        
        return yaml_content
    
    def process_content(self, content: str) -> str:
        """콘텐츠 처리 (필요시 이미지 경로 등 수정)"""
        # 기본적인 마크다운 정리
        processed = content.strip()
        
        # 요약 구분자가 없으면 첫 번째 문단 뒤에 추가
        if "<!--more-->" not in processed:
            lines = processed.split('\n')
            if len(lines) > 2:
                # 첫 번째 비어있지 않은 문단 뒤에 more 태그 추가
                insert_index = 1
                for i, line in enumerate(lines[1:], 1):
                    if line.strip():
                        insert_index = i + 1
                        break
                lines.insert(insert_index, "<!--more-->")
                processed = '\n'.join(lines)
        
        return processed
    
    def create_post(self, webhook_data: Dict[str, Any]) -> tuple[str, str]:
        """
        웹훅 데이터로부터 포스트 생성
        
        Args:
            webhook_data: n8n에서 받은 form 데이터
            
        Returns:
            tuple: (생성된 파일 경로, 포스트 제목)
        """
        try:
            # 포스트 번호 생성
            post_number = self.get_next_post_number()
            post_dir = self.content_dir / str(post_number)
            post_dir.mkdir(exist_ok=True)
            
            # 포스트 파일 경로
            post_file = post_dir / "index.md"
            
            # frontmatter 생성
            frontmatter = self.generate_frontmatter(webhook_data)
            
            # 콘텐츠 처리
            content = self.process_content(webhook_data.get("content", ""))
            
            # 파일 작성
            full_content = frontmatter + content
            
            with open(post_file, 'w', encoding='utf-8') as f:
                f.write(full_content)
            
            logger.info(f"포스트 생성 완료: {post_file}")
            return str(post_file), webhook_data.get("title", "제목 없음")
            
        except Exception as e:
            logger.error(f"포스트 생성 실패: {e}", exc_info=True)
            raise
    
    def handle_file_upload(self, webhook_data: Dict[str, Any], post_dir: Path) -> Optional[str]:
        """파일 업로드 처리 (이미지 등)"""
        try:
            file_data = webhook_data.get("file")
            if not file_data:
                return None
            
            # 파일 정보 추출
            filename = file_data.get("filename", "uploaded_file")
            file_content = file_data.get("content")  # base64 인코딩된 내용
            
            if not file_content:
                return None
            
            # base64 디코딩 및 파일 저장
            import base64
            file_bytes = base64.b64decode(file_content)
            
            file_path = post_dir / filename
            with open(file_path, 'wb') as f:
                f.write(file_bytes)
            
            logger.info(f"파일 업로드 완료: {file_path}")
            return filename
            
        except Exception as e:
            logger.error(f"파일 업로드 처리 실패: {e}", exc_info=True)
            return None