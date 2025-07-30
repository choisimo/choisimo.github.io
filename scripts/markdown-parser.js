// GitHub Pages용 정적 JSON 기반 Markdown Parser
class MarkdownParser {
    constructor() {
        this.posts = [];
        this.categories = new Set();
        this.tags = new Set();
        this.isLoaded = false;
        this.loadingPromise = null;
        this.metadata = null;
        this.debugMode = true; // 디버깅 모드 활성화
    }

    log(message, ...args) {
        if (this.debugMode) {
            console.log(`[MarkdownParser] ${message}`, ...args);
        }
    }

    error(message, ...args) {
        console.error(`[MarkdownParser] ${message}`, ...args);
    }

    // GitHub Pages용 정적 JSON에서 포스트 로드
    async loadPosts() {
        this.log('loadPosts() called');
        
        // Prevent multiple simultaneous loads
        if (this.loadingPromise) {
            this.log('Already loading, returning existing promise');
            return this.loadingPromise;
        }

        this.loadingPromise = this._loadPostsInternal();
        return this.loadingPromise;
    }

    async _loadPostsInternal() {
        this.log('Starting _loadPostsInternal');
        
        try {
            this.log('Initializing data structures');
            this.posts = [];
            this.categories.clear();
            this.tags.clear();
            
            // 일단 샘플 데이터를 먼저 로드해서 기본 기능 확인
            this.log('Loading sample posts first as fallback');
            await this.loadSamplePosts();
            
            // 그 다음 실제 JSON 데이터 시도
            try {
                this.log('Attempting to load real JSON data');
                const posts = await this.loadFromStaticJSON();
                
                if (posts && posts.length > 0) {
                    this.log(`Found ${posts.length} posts in JSON, replacing sample data`);
                    // 샘플 데이터를 지우고 실제 데이터로 대체
                    this.posts = [];
                    this.categories.clear();
                    this.tags.clear();
                    this.processPosts(posts);
                }
            } catch (jsonError) {
                this.error('Failed to load JSON data, keeping sample data:', jsonError);
            }

            this.log(`Final result: ${this.posts.length} posts loaded`);
            this.isLoaded = true;
            this.loadingPromise = null;
            return this.posts;
            
        } catch (error) {
            this.error('Critical error in _loadPostsInternal:', error);
            this.loadingPromise = null;
            
            // 최후의 수단으로 하드코딩된 샘플 로드
            if (this.posts.length === 0) {
                this.log('Loading emergency fallback data');
                await this.loadEmergencyData();
            }
            
            return this.posts;
        }
    }

    // 메타데이터 로드
    async loadMetadata() {
        try {
            this.log('Attempting to load metadata');
            const response = await fetch('/data/metadata.json');
            if (response.ok) {
                this.metadata = await response.json();
                this.log('Metadata loaded successfully:', this.metadata);
            } else {
                this.log('Metadata response not ok:', response.status);
            }
        } catch (error) {
            this.log('Could not load metadata:', error.message);
        }
    }

    // 정적 JSON에서 포스트 로드
    async loadFromStaticJSON() {
        this.log('Starting loadFromStaticJSON');
        
        try {
            this.log('Attempting to fetch /data/posts.json');
            const response = await fetch('/data/posts.json');
            
            this.log('Response status:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const posts = await response.json();
            this.log('JSON parsed successfully, posts count:', posts.length);
            
            if (!Array.isArray(posts)) {
                throw new Error('Posts data is not an array');
            }
            
            return posts;
            
        } catch (error) {
            this.error('Error loading main posts JSON:', error);
            this.log('Trying yearly JSON files as fallback');
            
            // 연도별 파일들을 시도
            return await this.loadFromYearlyJSON();
        }
    }

    // 연도별 JSON 파일에서 로드
    async loadFromYearlyJSON() {
        try {
            const allPosts = [];
            const years = ['2024', '2025'];
            
            for (const year of years) {
                try {
                    this.log(`Attempting to load posts for ${year}`);
                    const response = await fetch(`/data/posts_${year}.json`);
                    if (response.ok) {
                        const yearPosts = await response.json();
                        if (Array.isArray(yearPosts)) {
                            allPosts.push(...yearPosts);
                            this.log(`Loaded ${yearPosts.length} posts from ${year}`);
                        }
                    } else {
                        this.log(`Failed to load ${year}:`, response.status);
                    }
                } catch (error) {
                    this.log(`Error loading posts for ${year}:`, error.message);
                }
            }
            
            this.log(`Total posts from yearly files: ${allPosts.length}`);
            return allPosts;
            
        } catch (error) {
            this.error('Error loading yearly JSON files:', error);
            return [];
        }
    }

    // 포스트 데이터 처리
    processPosts(postsData) {
        this.log(`Processing ${postsData.length} posts`);
        
        postsData.forEach((postData, index) => {
            try {
                // 데이터 구조 정규화
                const post = {
                    id: postData.id || postData.slug,
                    slug: postData.slug || postData.id,
                    frontmatter: {
                        title: postData.title,
                        date: postData.date,
                        author: postData.author || 'nodove',
                        categories: postData.categories || [],
                        tags: postData.tags || [],
                        excerpt: postData.excerpt,
                        readTime: postData.readTime
                    },
                    content: postData.content,
                    url: `/post/${postData.slug || postData.id}`,
                    year: parseInt((postData.date || '2024-01-01').split('-')[0])
                };

                // 카테고리와 태그 수집
                if (post.frontmatter.categories) {
                    post.frontmatter.categories.forEach(cat => this.categories.add(cat));
                }
                if (post.frontmatter.tags) {
                    post.frontmatter.tags.forEach(tag => this.tags.add(tag));
                }

                this.posts.push(post);
                
            } catch (error) {
                this.error(`Error processing post ${index}:`, postData.title || 'Unknown', error);
            }
        });

        // 날짜순 정렬 (최신순)
        this.posts.sort((a, b) => {
            const dateA = new Date(a.frontmatter.date || '1970-01-01');
            const dateB = new Date(b.frontmatter.date || '1970-01-01');
            return dateB - dateA;
        });
        
        this.log(`Successfully processed ${this.posts.length} posts`);
    }

    // 샘플 포스트 로드 (fallback용)

    // 샘플 포스트 로드 (fallback용)
    async loadSamplePosts() {
        console.log('Loading sample posts as fallback...');
        
        const samplePosts = [
            {
                slug: 'react-nextjs-modern-web-development',
                frontmatter: {
                    title: 'React와 Next.js로 모던 웹 개발하기',
                    date: '2025-01-20',
                    categories: ['Web Development'],
                    tags: ['React', 'Next.js', 'JavaScript', 'Frontend'],
                    excerpt: '최신 React 기능과 Next.js의 장점을 활용한 웹 개발 방법론을 소개합니다.',
                    readTime: '5분',
                    author: 'nodove'
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
                    categories: ['AI/ML'],
                    tags: ['Python', 'AI', 'Chatbot', 'OpenAI'],
                    excerpt: 'OpenAI API를 활용하여 실용적인 AI 챗봇을 구현하는 과정을 단계별로 설명합니다.',
                    readTime: '8분',
                    author: 'nodove'
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
                slug: 'algorithm-fundamentals',
                frontmatter: {
                    title: '알고리즘 기초와 코딩 테스트 준비',
                    date: '2024-12-20',
                    categories: ['Algorithm'],
                    tags: ['Algorithm', 'Coding Test', 'Data Structure'],
                    excerpt: '코딩 테스트와 알고리즘 문제 해결을 위한 기본 개념과 접근 방법을 설명합니다.',
                    readTime: '10분',
                    author: 'nodove'
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
            if (post.frontmatter.categories) {
                post.frontmatter.categories.forEach(cat => this.categories.add(cat));
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
        return this.posts.filter(post => 
            post.frontmatter.categories && post.frontmatter.categories.includes(category)
        );
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

    // 응급 fallback 데이터 (절대 실패하지 않음)
    async loadEmergencyData() {
        this.log('Loading emergency fallback data');
        
        const emergencyPosts = [
            {
                id: 'emergency-post-1',
                slug: 'emergency-post-1',
                frontmatter: {
                    title: '블로그 시스템 테스트 포스트',
                    date: '2025-01-01',
                    author: 'nodove',
                    categories: ['System'],
                    tags: ['Test', 'Emergency'],
                    excerpt: '이 포스트는 블로그 시스템이 정상 작동하는지 확인하기 위한 테스트 포스트입니다.',
                    readTime: '1분'
                },
                content: `# 블로그 시스템 테스트

이 포스트는 응급 fallback 데이터입니다. 

만약 이 포스트가 보인다면:
- JSON 데이터 로딩에 실패했거나
- 서버 연결에 문제가 있을 수 있습니다.

## 문제 해결 방법

1. 브라우저 개발자 도구의 콘솔을 확인하세요
2. 네트워크 탭에서 실패한 요청을 확인하세요
3. \`/data/posts.json\` 파일이 접근 가능한지 확인하세요

정상적인 포스트들이 로드되면 이 메시지는 사라집니다.`,
                url: '/post/emergency-post-1',
                year: 2025
            }
        ];

        emergencyPosts.forEach(post => {
            if (post.frontmatter.categories) {
                post.frontmatter.categories.forEach(cat => this.categories.add(cat));
            }
            if (post.frontmatter.tags) {
                post.frontmatter.tags.forEach(tag => this.tags.add(tag));
            }
            this.posts.push(post);
        });

        this.log(`Loaded ${emergencyPosts.length} emergency posts`);
    }

    // 샘플 포스트 로드 (fallback용)
    async loadSamplePosts() {
        this.log('Loading sample posts as fallback');
        
        const samplePosts = [
            {
                id: 'react-nextjs-modern-web-development',
                slug: 'react-nextjs-modern-web-development',
                frontmatter: {
                    title: 'React와 Next.js로 모던 웹 개발하기',
                    date: '2025-01-20',
                    author: 'nodove',
                    categories: ['Web Development'],
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

React와 Next.js는 모던 웹 개발의 표준이 되었습니다. 두 기술을 잘 활용하면 사용자 경험과 개발자 경험 모두를 향상시킬 수 있습니다.`,
                url: '/post/react-nextjs-modern-web-development',
                year: 2025
            },
            {
                id: 'python-ai-chatbot-development',
                slug: 'python-ai-chatbot-development',
                frontmatter: {
                    title: 'Python으로 AI 챗봇 만들기',
                    date: '2025-01-15',
                    author: 'nodove',
                    categories: ['AI/ML'],
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

### 2. 기본 대화 기능

\`\`\`python
def chat_with_ai(message, conversation_history=[]):
    conversation_history.append({"role": "user", "content": message})
    
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=conversation_history,
        max_tokens=500,
        temperature=0.7
    )
    
    ai_response = response.choices[0].message.content
    conversation_history.append({"role": "assistant", "content": ai_response})
    
    return ai_response, conversation_history
\`\`\`

## 결론

Python과 OpenAI API를 활용하면 강력한 AI 챗봇을 쉽게 구현할 수 있습니다.`,
                url: '/post/python-ai-chatbot-development',
                year: 2025
            },
            {
                id: 'algorithm-fundamentals',
                slug: 'algorithm-fundamentals',
                frontmatter: {
                    title: '알고리즘 기초와 코딩 테스트 준비',
                    date: '2024-12-20',
                    author: 'nodove',
                    categories: ['Algorithm'],
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

꾸준한 연습과 체계적인 학습이 알고리즘 실력 향상의 핵심입니다.`,
                url: '/post/algorithm-fundamentals',
                year: 2024
            }
        ];

        // Process sample posts
        samplePosts.forEach(post => {
            // Add to categories and tags
            if (post.frontmatter.categories) {
                post.frontmatter.categories.forEach(cat => this.categories.add(cat));
            }
            if (post.frontmatter.tags) {
                post.frontmatter.tags.forEach(tag => this.tags.add(tag));
            }
            
            this.posts.push(post);
        });

        this.log(`Loaded ${samplePosts.length} sample posts`);
    }
}

// Global instance
window.markdownParser = new MarkdownParser();