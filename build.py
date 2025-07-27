#!/usr/bin/env python3
"""
GitHub Pages용 정적 사이트 빌드 스크립트
마크다운 파일들을 JSON으로 변환하여 클라이언트에서 로드할 수 있도록 합니다.
"""

import os
import json
import re
import yaml
from datetime import datetime
from pathlib import Path

def extract_frontmatter(content):
    """YAML frontmatter 추출"""
    if content.startswith('---'):
        try:
            end = content.find('\n---\n', 4)
            if end != -1:
                frontmatter_str = content[4:end]
                frontmatter = yaml.safe_load(frontmatter_str)
                body = content[end + 5:]
                return frontmatter, body
        except yaml.YAMLError:
            pass
    return {}, content

def generate_excerpt(content, max_length=200):
    """컨텐츠에서 excerpt 생성"""
    # 마크다운 마크업 제거
    text = re.sub(r'[#*`\[\]()]+', '', content)
    text = re.sub(r'\n+', ' ', text)
    text = text.strip()
    
    if len(text) <= max_length:
        return text
    
    # 단어 경계에서 자르기
    truncated = text[:max_length]
    last_space = truncated.rfind(' ')
    if last_space > max_length * 0.8:
        truncated = truncated[:last_space]
    
    return truncated + '...'

def estimate_read_time(content):
    """읽기 시간 추정 (분)"""
    word_count = len(content.split())
    return max(1, round(word_count / 200))  # 분당 200단어

def process_markdown_file(file_path):
    """마크다운 파일 처리"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        frontmatter, body = extract_frontmatter(content)
        
        # 파일명에서 정보 추출
        filename = os.path.basename(file_path)
        slug = os.path.splitext(filename)[0]
        
        # 기본값 설정
        post_data = {
            'id': slug,
            'title': frontmatter.get('title', slug.replace('-', ' ').title()),
            'slug': slug,
            'date': frontmatter.get('date', '2024-01-01'),
            'author': frontmatter.get('author', 'nodove'),
            'categories': frontmatter.get('categories', []),
            'tags': frontmatter.get('tags', []),
            'draft': frontmatter.get('draft', False),
            'content': body,
            'excerpt': frontmatter.get('description') or generate_excerpt(body),
            'readTime': estimate_read_time(body)
        }
        
        # 날짜 형식 표준화
        if isinstance(post_data['date'], str):
            try:
                # 다양한 날짜 형식 처리
                date_str = post_data['date'].split('T')[0]  # 시간 부분 제거
                datetime.strptime(date_str, '%Y-%m-%d')
                post_data['date'] = date_str
            except ValueError:
                post_data['date'] = '2024-01-01'
        
        return post_data
    
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return None

def build_posts_data():
    """모든 포스트 데이터 빌드"""
    posts_dir = Path('posts')
    all_posts = []
    
    for year_dir in posts_dir.iterdir():
        if year_dir.is_dir() and year_dir.name.isdigit():
            year_posts = []
            
            for md_file in year_dir.glob('*.md'):
                post_data = process_markdown_file(md_file)
                if post_data and not post_data['draft']:
                    all_posts.append(post_data)
                    year_posts.append(post_data)
            
            # 연도별 JSON 파일 생성
            year_posts.sort(key=lambda x: x['date'], reverse=True)
            with open(f'data/posts_{year_dir.name}.json', 'w', encoding='utf-8') as f:
                json.dump(year_posts, f, ensure_ascii=False, indent=2)
            
            print(f"Generated data/posts_{year_dir.name}.json with {len(year_posts)} posts")
    
    # 전체 포스트 JSON 파일 생성
    all_posts.sort(key=lambda x: x['date'], reverse=True)
    
    # data 디렉토리 생성
    os.makedirs('data', exist_ok=True)
    
    with open('data/posts.json', 'w', encoding='utf-8') as f:
        json.dump(all_posts, f, ensure_ascii=False, indent=2)
    
    # 메타데이터 생성
    metadata = {
        'totalPosts': len(all_posts),
        'lastUpdated': datetime.now().isoformat(),
        'categories': list(set(cat for post in all_posts for cat in post['categories'])),
        'tags': list(set(tag for post in all_posts for tag in post['tags'])),
        'years': list(set(post['date'][:4] for post in all_posts))
    }
    
    with open('data/metadata.json', 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    
    print(f"Generated data/posts.json with {len(all_posts)} posts")
    print(f"Generated data/metadata.json")
    
    return all_posts

if __name__ == '__main__':
    print("Building static data for GitHub Pages...")
    posts = build_posts_data()
    print(f"Build complete! Processed {len(posts)} posts.")