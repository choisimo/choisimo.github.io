// Markdown Parser and Post Manager
class MarkdownParser {
    constructor() {
        this.posts = [];
        this.categories = new Set();
        this.tags = new Set();
    }

    // Parse frontmatter from markdown content
    parseFrontmatter(content) {
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
        const match = content.match(frontmatterRegex);
        
        if (!match) {
            return { frontmatter: {}, content: content };
        }

        const frontmatterText = match[1];
        const markdownContent = match[2];
        const frontmatter = {};

        frontmatterText.split('\n').forEach(line => {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();
                
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || 
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                
                // Handle arrays (tags)
                if (value.startsWith('[') && value.endsWith(']')) {
                    value = value.slice(1, -1).split(',').map(item => item.trim().replace(/"/g, ''));
                }
                
                frontmatter[key] = value;
            }
        });

        return { frontmatter, content: markdownContent };
    }

    // Load all posts from the posts directory
    async loadPosts() {
        try {
            // Sample posts data - In a real scenario, you'd fetch from your posts directory
            const samplePosts = [
                {
                    slug: 'react-nextjs-modern-web-development',
                    frontmatter: {
                        title: 'React와 Next.js로 모던 웹 개발하기',
                        date: '2025-01-20',
                        category: 'Web Development',
                        tags: ['React', 'Next.js', 'JavaScript', 'Frontend'],
                        excerpt: '최신 React 기능과 Next.js의 장점을 활용한 웹 개발 방법론을 소개합니다.',
                        readTime: '5분'
                    },
                    content: `# React와 Next.js로 모던 웹 개발하기

## 소개

React와 Next.js는 현대 웹 개발에서 가장 인기 있는 기술 스택 중 하나입니다. 이 글에서는 두 기술의 장점과 실제 프로젝트에서의 활용 방법을 알아보겠습니다.

## React의 핵심 기능

### 1. Hooks
React Hooks는 함수형 컴포넌트에서 상태 관리와 생명주기를 다룰 수 있게 해줍니다.

\`\`\`javascript
import { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    document.title = \`Count: \${count}\`;
  }, [count]);
  
  return (
    <div>
      <p>현재 카운트: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        증가
      </button>
    </div>
  );
}
\`\`\`

### 2. 컴포넌트 재사용성
React의 컴포넌트 기반 아키텍처는 코드의 재사용성을 크게 향상시킵니다.

## Next.js의 장점

### 1. 서버 사이드 렌더링 (SSR)
Next.js는 기본적으로 SSR을 지원하여 SEO와 초기 로딩 성능을 개선합니다.

### 2. 파일 기반 라우팅
폴더 구조를 통해 자동으로 라우팅이 설정되어 개발 편의성이 높습니다.

## 실제 프로젝트 적용

실제 프로젝트에서 React와 Next.js를 함께 사용하면:
- 빠른 개발 속도
- 우수한 성능
- SEO 최적화
- 확장 가능한 구조

를 얻을 수 있습니다.

## 결론

React와 Next.js는 모던 웹 개발의 표준이 되었습니다. 두 기술을 잘 활용하면 사용자 경험과 개발자 경험 모두를 향상시킬 수 있습니다.`
                },
                {
                    slug: 'python-ai-chatbot-development',
                    frontmatter: {
                        title: 'Python으로 AI 챗봇 만들기',
                        date: '2025-01-15',
                        category: 'AI/ML',
                        tags: ['Python', 'AI', 'Chatbot', 'OpenAI'],
                        excerpt: 'OpenAI API를 활용하여 실용적인 AI 챗봇을 구현하는 과정을 단계별로 설명합니다.',
                        readTime: '8분'
                    },
                    content: `# Python으로 AI 챗봇 만들기

## 개요

이 튜토리얼에서는 Python과 OpenAI API를 사용하여 간단하지만 효과적인 AI 챗봇을 만드는 방법을 알아보겠습니다.

## 필요한 라이브러리 설치

\`\`\`bash
pip install openai
pip install python-dotenv
pip install flask
\`\`\`

## 기본 챗봇 구현

### 1. 환경 설정

\`\`\`python
import openai
import os
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv('OPENAI_API_KEY')
\`\`\`

### 2. 챗봇 클래스 생성

\`\`\`python
class AIChatbot:
    def __init__(self):
        self.conversation_history = []
    
    def add_message(self, role, content):
        self.conversation_history.append({
            "role": role,
            "content": content
        })
    
    def get_response(self, user_input):
        self.add_message("user", user_input)
        
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=self.conversation_history,
                max_tokens=150,
                temperature=0.7
            )
            
            bot_response = response.choices[0].message.content
            self.add_message("assistant", bot_response)
            
            return bot_response
        except Exception as e:
            return f"오류가 발생했습니다: {str(e)}"
\`\`\`

## 웹 인터페이스 추가

Flask를 사용하여 웹 인터페이스를 만들어보겠습니다.

\`\`\`python
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)
chatbot = AIChatbot()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json['message']
    bot_response = chatbot.get_response(user_message)
    return jsonify({'response': bot_response})

if __name__ == '__main__':
    app.run(debug=True)
\`\`\`

## 고급 기능 추가

### 1. 컨텍스트 관리
대화의 맥락을 유지하기 위해 히스토리를 관리합니다.

### 2. 감정 분석
사용자의 감정을 분석하여 적절한 응답을 생성합니다.

### 3. 개인화
사용자별 선호도를 학습하여 맞춤형 응답을 제공합니다.

## 결론

Python과 OpenAI API를 활용하면 강력한 AI 챗봇을 쉽게 구현할 수 있습니다. 기본 기능에서 시작하여 점진적으로 고급 기능을 추가해 나가는 것이 좋습니다.`
                },
                {
                    slug: 'docker-kubernetes-guide',
                    frontmatter: {
                        title: 'Docker와 Kubernetes 실전 가이드',
                        date: '2025-01-10',
                        category: 'DevOps',
                        tags: ['Docker', 'Kubernetes', 'DevOps', 'Container'],
                        excerpt: '컨테이너 기술의 핵심인 Docker와 오케스트레이션 도구 Kubernetes 활용법을 다룹니다.',
                        readTime: '12분'
                    },
                    content: `# Docker와 Kubernetes 실전 가이드

## Docker 기초

Docker는 애플리케이션을 컨테이너로 패키징하여 어떤 환경에서도 일관되게 실행할 수 있게 해주는 플랫폼입니다.

### Dockerfile 작성

\`\`\`dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
\`\`\`

### Docker 명령어

\`\`\`bash
# 이미지 빌드
docker build -t myapp:latest .

# 컨테이너 실행
docker run -p 3000:3000 myapp:latest

# 컨테이너 목록 조회
docker ps
\`\`\`

## Kubernetes 기초

Kubernetes는 컨테이너화된 애플리케이션의 배포, 확장, 관리를 자동화하는 오케스트레이션 플랫폼입니다.

### Pod 정의

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp-pod
spec:
  containers:
  - name: myapp
    image: myapp:latest
    ports:
    - containerPort: 3000
\`\`\`

### Deployment 생성

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myapp:latest
        ports:
        - containerPort: 3000
\`\`\`

## 실전 활용 팁

### 1. 멀티 스테이지 빌드
Docker 이미지 크기를 줄이기 위해 멀티 스테이지 빌드를 활용하세요.

### 2. 헬스 체크
애플리케이션의 상태를 모니터링하기 위해 헬스 체크를 구현하세요.

### 3. 로그 관리
중앙화된 로그 시스템을 구축하여 문제 해결을 용이하게 하세요.

## 결론

Docker와 Kubernetes는 현대적인 애플리케이션 배포의 핵심 기술입니다. 점진적으로 학습하고 실무에 적용해 나가는 것이 중요합니다.`
                }
            ];

            // Process posts
            this.posts = samplePosts.map(post => {
                // Add to categories and tags
                if (post.frontmatter.category) {
                    this.categories.add(post.frontmatter.category);
                }
                if (post.frontmatter.tags) {
                    post.frontmatter.tags.forEach(tag => this.tags.add(tag));
                }
                
                return {
                    ...post,
                    id: post.slug,
                    url: `/post/${post.slug}`
                };
            });

            // Sort posts by date (newest first)
            this.posts.sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date));

            return this.posts;
        } catch (error) {
            console.error('Failed to load posts:', error);
            return [];
        }
    }

    // Get a single post by slug
    getPostBySlug(slug) {
        return this.posts.find(post => post.slug === slug);
    }

    // Get posts by category
    getPostsByCategory(category) {
        if (!category) return this.posts;
        return this.posts.filter(post => post.frontmatter.category === category);
    }

    // Get posts by tag
    getPostsByTag(tag) {
        if (!tag) return this.posts;
        return this.posts.filter(post => 
            post.frontmatter.tags && post.frontmatter.tags.includes(tag)
        );
    }

    // Search posts
    searchPosts(query) {
        if (!query) return this.posts;
        
        const lowercaseQuery = query.toLowerCase();
        return this.posts.filter(post => 
            post.frontmatter.title.toLowerCase().includes(lowercaseQuery) ||
            post.frontmatter.excerpt.toLowerCase().includes(lowercaseQuery) ||
            post.content.toLowerCase().includes(lowercaseQuery) ||
            (post.frontmatter.tags && post.frontmatter.tags.some(tag => 
                tag.toLowerCase().includes(lowercaseQuery)
            ))
        );
    }

    // Get all categories
    getCategories() {
        return Array.from(this.categories).sort();
    }

    // Get all tags
    getTags() {
        return Array.from(this.tags).sort();
    }

    // Render markdown to HTML
    renderMarkdown(markdown) {
        if (typeof marked !== 'undefined') {
            // Configure marked options
            marked.setOptions({
                highlight: function(code, language) {
                    // Basic syntax highlighting (you can enhance this)
                    return `<pre><code class="language-${language}">${code}</code></pre>`;
                },
                breaks: true,
                gfm: true
            });
            return marked.parse(markdown);
        }
        return markdown.replace(/\n/g, '<br>');
    }
}

// Global instance
window.markdownParser = new MarkdownParser();