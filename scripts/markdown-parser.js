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
                    try {
                        value = JSON.parse(value);
                    } catch (e) {
                        // Fallback parsing
                        value = value.slice(1, -1).split(',').map(item => item.trim().replace(/['"]/g, ''));
                    }
                }
                
                frontmatter[key] = value;
            }
        });

        return { frontmatter, content: markdownContent };
    }

    // Load all posts from the posts directory
    async loadPosts() {
        try {
            this.posts = [];
            this.categories.clear();
            this.tags.clear();
            
            // Try to load actual post files
            const years = ['2024', '2025'];
            let loadedPosts = 0;
            
            for (const year of years) {
                const postFiles = await this.getPostFiles(year);
                for (const filename of postFiles) {
                    try {
                        const success = await this.loadSinglePost(year, filename);
                        if (success) loadedPosts++;
                    } catch (error) {
                        console.warn(`Failed to load ${filename}:`, error);
                    }
                }
            }
            
            // If no posts loaded from files, use sample posts as fallback
            if (loadedPosts === 0) {
                console.log('No posts found in files, loading sample posts...');
                await this.loadSamplePosts();
            }

            // Sort posts by date (newest first)
            this.posts.sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date));

            console.log(`Loaded ${this.posts.length} posts`);
            return this.posts;
        } catch (error) {
            console.error('Failed to load posts:', error);
            // Load sample posts as fallback
            await this.loadSamplePosts();
            return this.posts;
        }
    }

    // Get list of post files for a given year
    async getPostFiles(year) {
        try {
            // Try different methods to get file list
            const methods = [
                () => this.getFileListFromIndex(year),
                () => this.getFileListFromManifest(year),
                () => this.getCommonPostFiles(year)
            ];

            for (const method of methods) {
                try {
                    const files = await method();
                    if (files && files.length > 0) {
                        return files;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            return [];
        } catch (error) {
            console.warn(`Could not get file list for ${year}:`, error);
            return [];
        }
    }

    // Method 1: Try to get files from directory index
    async getFileListFromIndex(year) {
        const response = await fetch(`/posts/${year}/`);
        if (!response.ok) throw new Error('Index not available');
        
        const html = await response.text();
        const fileRegex = /href="([^"]+\.md)"/g;
        const files = [];
        let match;
        
        while ((match = fileRegex.exec(html)) !== null) {
            const filename = match[1];
            if (filename !== '../' && !filename.includes('/')) {
                files.push(filename);
            }
        }
        
        return files;
    }

    // Method 2: Try to load from a manifest file
    async getFileListFromManifest(year) {
        const response = await fetch(`/posts/${year}/manifest.json`);
        if (!response.ok) throw new Error('Manifest not available');
        
        const manifest = await response.json();
        return manifest.files || [];
    }

    // Method 3: Try common post filenames
    async getCommonPostFiles(year) {
        const commonFiles = [
            'opensource-schedule-management-analysis.md',
            'multimodal-recommendation-system-research.md',
            'react-nextjs-modern-web-development.md',
            'python-ai-chatbot-development.md',
            'docker-kubernetes-guide.md'
        ];

        const existingFiles = [];
        
        for (const filename of commonFiles) {
            try {
                const response = await fetch(`/posts/${year}/${filename}`, { method: 'HEAD' });
                if (response.ok) {
                    existingFiles.push(filename);
                }
            } catch (e) {
                continue;
            }
        }
        
        return existingFiles;
    }

    // Load a single post file
    async loadSinglePost(year, filename) {
        try {
            const response = await fetch(`/posts/${year}/${filename}`);
            if (!response.ok) return false;
            
            const content = await response.text();
            const { frontmatter, content: markdownContent } = this.parseFrontmatter(content);
            
            if (frontmatter.title) {
                const slug = filename.replace('.md', '');
                
                // Add to categories and tags
                if (frontmatter.category) {
                    this.categories.add(frontmatter.category);
                }
                if (frontmatter.tags && Array.isArray(frontmatter.tags)) {
                    frontmatter.tags.forEach(tag => this.tags.add(tag));
                }
                
                this.posts.push({
                    slug,
                    frontmatter,
                    content: markdownContent,
                    id: slug,
                    url: `/post/${slug}`
                });
                
                return true;
            }
            return false;
        } catch (error) {
            console.warn(`Could not load post ${filename}:`, error);
            return false;
        }
    }

    // Fallback sample posts
    async loadSamplePosts() {
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

## 결론

Python과 OpenAI API를 활용하면 강력한 AI 챗봇을 쉽게 구현할 수 있습니다.`
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

## 결론

Docker와 Kubernetes는 현대적인 애플리케이션 배포의 핵심 기술입니다.`
            }
        ];

        // Process sample posts
        samplePosts.forEach(post => {
            // Add to categories and tags
            if (post.frontmatter.category) {
                this.categories.add(post.frontmatter.category);
            }
            if (post.frontmatter.tags) {
                post.frontmatter.tags.forEach(tag => this.tags.add(tag));
            }
            
            this.posts.push({
                ...post,
                id: post.slug,
                url: `/post/${post.slug}`
            });
        });
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
            (post.frontmatter.excerpt && post.frontmatter.excerpt.toLowerCase().includes(lowercaseQuery)) ||
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
                    return `<pre data-lang="${language}"><code class="language-${language}">${code}</code></pre>`;
                },
                breaks: true,
                gfm: true
            });
            return marked.parse(markdown);
        }
        // Fallback markdown rendering
        return this.simpleMarkdownRender(markdown);
    }
    
    // Simple markdown rendering fallback
    simpleMarkdownRender(markdown) {
        return markdown
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }
}

// Global instance
window.markdownParser = new MarkdownParser();