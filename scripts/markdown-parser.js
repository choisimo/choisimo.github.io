// Markdown Parser and Post Manager
class MarkdownParser {
    constructor() {
        this.posts = [];
        this.categories = new Set();
        this.tags = new Set();
        this.isLoaded = false;
        this.loadingPromise = null;
    }

    // Enhanced frontmatter parser with better YAML support
    parseFrontmatter(content) {
        const frontmatterRegex = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/;
        const match = content.match(frontmatterRegex);
        
        if (!match) {
            return { frontmatter: {}, content: content };
        }

        const frontmatterText = match[1];
        const markdownContent = match[2];
        const frontmatter = {};

        // Parse YAML-like frontmatter
        const lines = frontmatterText.split(/\r?\n/);
        let currentKey = null;
        let currentValue = [];
        let inArray = false;

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) continue;

            if (inArray) {
                if (trimmedLine.startsWith('-')) {
                    // Array item
                    const item = trimmedLine.substring(1).trim().replace(/^["']|["']$/g, '');
                    currentValue.push(item);
                } else if (trimmedLine.includes(':')) {
                    // End of array, start new key
                    if (currentKey) {
                        frontmatter[currentKey] = currentValue;
                    }
                    inArray = false;
                    currentValue = [];
                } else {
                    continue;
                }
            }

            if (!inArray && trimmedLine.includes(':')) {
                const colonIndex = trimmedLine.indexOf(':');
                const key = trimmedLine.substring(0, colonIndex).trim();
                let value = trimmedLine.substring(colonIndex + 1).trim();

                // Save previous array if exists
                if (currentKey && currentValue.length > 0) {
                    frontmatter[currentKey] = currentValue;
                    currentValue = [];
                }

                currentKey = key;

                // Remove quotes
                if ((value.startsWith('"') && value.endsWith('"')) || 
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }

                // Check for arrays
                if (value.startsWith('[') && value.endsWith(']')) {
                    try {
                        frontmatter[key] = JSON.parse(value);
                    } catch (e) {
                        // Fallback parsing
                        const arrayContent = value.slice(1, -1);
                        if (arrayContent.trim()) {
                            frontmatter[key] = arrayContent.split(',').map(item => item.trim().replace(/['"]/g, ''));
                        } else {
                            frontmatter[key] = [];
                        }
                    }
                    currentKey = null;
                } else if (!value && lines.indexOf(line) < lines.length - 1) {
                    // Check if next lines are array items
                    const nextLine = lines[lines.indexOf(line) + 1];
                    if (nextLine && nextLine.trim().startsWith('-')) {
                        inArray = true;
                        currentValue = [];
                    } else {
                        frontmatter[key] = value;
                        currentKey = null;
                    }
                } else {
                    // Simple value
                    frontmatter[key] = value;
                    currentKey = null;
                }
            }
        }

        // Save last array if exists
        if (currentKey && currentValue.length > 0) {
            frontmatter[currentKey] = currentValue;
        }

        return { frontmatter, content: markdownContent };
    }

    // Enhanced post loading with better error handling
    async loadPosts() {
        // Prevent multiple simultaneous loads
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = this._loadPostsInternal();
        return this.loadingPromise;
    }

    async _loadPostsInternal() {
        try {
            console.log('Starting to load posts...');
            this.posts = [];
            this.categories.clear();
            this.tags.clear();
            
            const years = ['2024', '2025'];
            let totalLoaded = 0;
            
            for (const year of years) {
                console.log(`Loading posts from ${year}...`);
                const loaded = await this.loadPostsFromYear(year);
                totalLoaded += loaded;
                console.log(`Loaded ${loaded} posts from ${year}`);
            }
            
            // Sort posts by date (newest first)
            this.posts.sort((a, b) => {
                const dateA = new Date(a.frontmatter.date || '1970-01-01');
                const dateB = new Date(b.frontmatter.date || '1970-01-01');
                return dateB - dateA;
            });

            console.log(`Total posts loaded: ${this.posts.length}`);
            
            // If no posts loaded, show error and load samples
            if (this.posts.length === 0) {
                console.warn('No posts could be loaded from files, using sample data');
                await this.loadSamplePosts();
            }

            this.isLoaded = true;
            this.loadingPromise = null;
            return this.posts;
            
        } catch (error) {
            console.error('Critical error loading posts:', error);
            this.loadingPromise = null;
            await this.loadSamplePosts();
            return this.posts;
        }
    }

    // Load posts from a specific year
    async loadPostsFromYear(year) {
        try {
            const fileList = await this.getPostFileList(year);
            console.log(`Found ${fileList.length} files for ${year}:`, fileList);
            
            let loaded = 0;
            const loadPromises = fileList.map(async (filename) => {
                try {
                    const success = await this.loadSinglePost(year, filename);
                    if (success) loaded++;
                    return success;
                } catch (error) {
                    console.warn(`Failed to load ${year}/${filename}:`, error.message);
                    return false;
                }
            });
            
            await Promise.all(loadPromises);
            return loaded;
            
        } catch (error) {
            console.error(`Error loading posts from ${year}:`, error);
            return 0;
        }
    }

    // Get file list with multiple fallback methods
    async getPostFileList(year) {
        const methods = [
            () => this.getFileListFromManifest(year),
            () => this.getFileListFromIndex(year),
            () => this.getKnownFiles(year)
        ];

        for (const method of methods) {
            try {
                const files = await method();
                if (files && files.length > 0) {
                    console.log(`Got file list for ${year} using method:`, method.name);
                    return files.filter(f => f.endsWith('.md'));
                }
            } catch (error) {
                console.log(`Method failed for ${year}:`, method.name, error.message);
                continue;
            }
        }
        
        console.warn(`No file list found for ${year}`);
        return [];
    }

    // Method 1: Load from manifest.json (most reliable)
    async getFileListFromManifest(year) {
        const response = await fetch(`/posts/${year}/manifest.json`);
        if (!response.ok) {
            throw new Error(`Manifest not found for ${year}`);
        }
        
        const manifest = await response.json();
        if (!manifest.files || !Array.isArray(manifest.files)) {
            throw new Error(`Invalid manifest format for ${year}`);
        }
        
        return manifest.files;
    }

    // Method 2: Try to get files from directory index  
    async getFileListFromIndex(year) {
        const response = await fetch(`/posts/${year}/`);
        if (!response.ok) {
            throw new Error(`Directory index not available for ${year}`);
        }
        
        const html = await response.text();
        const fileRegex = /href="([^"]+\.md)"/g;
        const files = [];
        let match;
        
        while ((match = fileRegex.exec(html)) !== null) {
            const filename = match[1];
            if (!filename.includes('../') && !filename.includes('/')) {
                files.push(filename);
            }
        }
        
        if (files.length === 0) {
            throw new Error(`No markdown files found in directory index for ${year}`);
        }
        
        return files;
    }

    // Method 3: Known files fallback
    async getKnownFiles(year) {
        const knownFiles = {
            '2024': [
                'ai-personalized-learning-system.md',
                'algorithm-guide.md',
                'changedetection-io-guide.md',
                'coding-test-guide.md',
                'database-containerization-guide.md',
                'linux-networkmanager-static-ip.md',
                'multimodal-recommendation-system-research.md',
                'opensource-schedule-management-analysis.md'
            ],
            '2025': [
                'ai-models-for-coding.md',
                'arch-linux-gui-setup-experience.md',
                'docker-kubernetes-guide.md',
                'python-ai-chatbot-development.md',
                'react-nextjs-modern-web-development.md',
                'spring-boot-realtime-communication.md'
            ]
        };

        const files = knownFiles[year] || [];
        if (files.length === 0) {
            throw new Error(`No known files for ${year}`);
        }

        // Verify files exist
        const existingFiles = [];
        for (const filename of files) {
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

    // Enhanced single post loading
    async loadSinglePost(year, filename) {
        try {
            console.log(`Loading post: ${year}/${filename}`);
            
            const response = await fetch(`/posts/${year}/${filename}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const content = await response.text();
            if (!content.trim()) {
                throw new Error('Empty file content');
            }
            
            const { frontmatter, content: markdownContent } = this.parseFrontmatter(content);
            
            // Validate required fields
            if (!frontmatter.title) {
                console.warn(`Post ${filename} missing title, skipping`);
                return false;
            }
            
            // Generate slug from filename
            const slug = filename.replace('.md', '');
            
            // Ensure date is properly formatted
            if (!frontmatter.date) {
                frontmatter.date = '2024-01-01'; // Default date
            }
            
            // Ensure category exists
            if (!frontmatter.category) {
                frontmatter.category = 'General';
            }
            
            // Ensure tags is an array
            if (!frontmatter.tags) {
                frontmatter.tags = [];
            } else if (typeof frontmatter.tags === 'string') {
                frontmatter.tags = [frontmatter.tags];
            }
            
            // Generate excerpt if not provided
            if (!frontmatter.excerpt) {
                frontmatter.excerpt = this.generateExcerpt(markdownContent);
            }
            
            // Generate read time if not provided
            if (!frontmatter.readTime) {
                frontmatter.readTime = this.calculateReadTime(markdownContent);
            }
            
            // Add to collections
            this.categories.add(frontmatter.category);
            frontmatter.tags.forEach(tag => this.tags.add(tag));
            
            // Create post object
            const post = {
                slug,
                frontmatter,
                content: markdownContent,
                id: slug,
                url: `/post/${slug}`,
                year: parseInt(year)
            };
            
            this.posts.push(post);
            console.log(`Successfully loaded: ${frontmatter.title}`);
            return true;
            
        } catch (error) {
            console.error(`Failed to load ${year}/${filename}:`, error.message);
            return false;
        }
    }

    // Generate excerpt from content
    generateExcerpt(content, maxLength = 150) {
        // Remove markdown formatting
        const plainText = content
            .replace(/#{1,6}\s+/g, '') // Remove headers
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
            .replace(/\*(.*?)\*/g, '$1') // Remove italic
            .replace(/`(.*?)`/g, '$1') // Remove inline code
            .replace(/```[\s\S]*?```/g, '') // Remove code blocks
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
            .replace(/\n+/g, ' ') // Replace newlines with spaces
            .trim();
        
        if (plainText.length <= maxLength) {
            return plainText;
        }
        
        return plainText.substring(0, maxLength).replace(/\s+\w*$/, '') + '...';
    }

    // Calculate reading time
    calculateReadTime(content) {
        const wordsPerMinute = 200;
        const wordCount = content.trim().split(/\s+/).length;
        const minutes = Math.ceil(wordCount / wordsPerMinute);
        return `${minutes}분`;
    }

    // Enhanced fallback sample posts
    async loadSamplePosts() {
        console.log('Loading sample posts as fallback...');
        
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
            },
            {
                slug: 'algorithm-fundamentals',
                frontmatter: {
                    title: '알고리즘 기초와 코딩 테스트 준비',
                    date: '2024-12-20',
                    category: 'Algorithm',
                    tags: ['Algorithm', 'Coding Test', 'Data Structure'],
                    excerpt: '코딩 테스트와 알고리즘 문제 해결을 위한 기본 개념과 접근 방법을 설명합니다.',
                    readTime: '10분'
                },
                content: `# 알고리즘 기초와 코딩 테스트 준비

## 기본 자료구조

### 배열과 리스트
배열과 리스트는 가장 기본적인 자료구조입니다.

### 스택과 큐
LIFO(Last In First Out)와 FIFO(First In First Out) 개념을 이해해야 합니다.

## 정렬 알고리즘

### 버블 정렬
가장 간단하지만 비효율적인 정렬 방법입니다.

### 퀵 정렬
분할 정복을 이용한 효율적인 정렬 알고리즘입니다.

## 검색 알고리즘

### 이진 검색
정렬된 배열에서 효율적으로 원소를 찾는 방법입니다.

## 결론

꾸준한 연습과 체계적인 학습이 알고리즘 실력 향상의 핵심입니다.`
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
                url: `/post/${post.slug}`,
                year: parseInt(post.frontmatter.date.split('-')[0])
            });
        });

        console.log(`Loaded ${samplePosts.length} sample posts`);
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

    // Enhanced markdown rendering with better code highlighting
    renderMarkdown(markdown) {
        if (typeof marked !== 'undefined') {
            // Configure marked options for better rendering
            marked.setOptions({
                highlight: function(code, language) {
                    // Add syntax highlighting class
                    const lang = language || 'text';
                    return `<pre class="code-block"><code class="language-${lang}" data-lang="${lang}">${code}</code></pre>`;
                },
                breaks: true,
                gfm: true,
                tables: true,
                smartLists: true,
                smartypants: true
            });
            return marked.parse(markdown);
        }
        // Enhanced fallback markdown rendering
        return this.enhancedMarkdownRender(markdown);
    }
    
    // Enhanced markdown rendering fallback
    enhancedMarkdownRender(markdown) {
        return markdown
            // Headers
            .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            // Code blocks
            .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="code-block"><code class="language-$1" data-lang="$1">$2</code></pre>')
            // Inline code
            .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
            // Bold and italic
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
            // Lists
            .replace(/^\- (.+$)/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            // Line breaks
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            // Wrap in paragraphs
            .replace(/^(?!<[hul]|<pre|<blockquote)(.+$)/gm, '<p>$1</p>')
            // Clean up empty paragraphs
            .replace(/<p><\/p>/g, '')
            .replace(/<p>(<[hul])/g, '$1')
            .replace(/(<\/[hul]>)<\/p>/g, '$1');
    }

    // Utility method to format date
    formatDate(dateString) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString; // Return original if invalid
        }
        
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Get recent posts
    getRecentPosts(limit = 5) {
        return this.posts.slice(0, limit);
    }

    // Get posts by year
    getPostsByYear(year) {
        if (!year) return this.posts;
        return this.posts.filter(post => post.year === parseInt(year));
    }

    // Get post statistics
    getStats() {
        return {
            totalPosts: this.posts.length,
            totalCategories: this.categories.size,
            totalTags: this.tags.size,
            years: [...new Set(this.posts.map(post => post.year))].sort((a, b) => b - a)
        };
    }

    // Force reload posts
    async reloadPosts() {
        this.isLoaded = false;
        this.loadingPromise = null;
        return this.loadPosts();
    }
}
}

// Global instance
window.markdownParser = new MarkdownParser();