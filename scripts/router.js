// Enhanced Router for Single Page Application
class Router {
    constructor() {
        this.routes = {
            '/': () => this.showPage('home'),
            '/posts': () => this.showPage('posts'),
            '/projects': () => this.showPage('projects'),
            '/about': () => this.showPage('about'),
            '/contact': () => this.showPage('contact'),
            '/post/:slug': (params) => this.showPostDetail(params.slug)
        };
        
        this.currentRoute = '';
        this.currentFilters = {};
        this.init();
    }

    init() {
        // Handle initial page load
        this.handleRoute();
        
        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });
        
        // Handle navigation clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-route]');
            if (link) {
                e.preventDefault();
                const route = link.getAttribute('href') || link.getAttribute('data-route');
                this.navigate(route);
            }
        });
    }

    navigate(path) {
        if (path !== this.currentRoute) {
            history.pushState(null, '', path);
            this.handleRoute();
        }
    }

    handleRoute() {
        const path = window.location.pathname;
        this.currentRoute = path;
        
        // Find matching route
        for (const [routePattern, handler] of Object.entries(this.routes)) {
            const params = this.matchRoute(routePattern, path);
            if (params !== null) {
                handler(params);
                this.updateActiveNavItem(path);
                return;
            }
        }
        
        // 404 - show home page as fallback
        this.showPage('home');
        this.updateActiveNavItem('/');
    }

    matchRoute(pattern, path) {
        // Convert pattern like '/post/:slug' to regex
        const regexPattern = pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)');
        const regex = new RegExp(`^${regexPattern}$`);
        const match = path.match(regex);
        
        if (match) {
            return match.groups || {};
        }
        return null;
    }

    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.style.display = 'none';
        });
        
        // Show target page
        const targetPage = document.getElementById(`${pageId}-page`);
        if (targetPage) {
            targetPage.style.display = 'block';
            
            // Load page-specific content
            this.loadPageContent(pageId);
        }
        
        // Scroll to top
        window.scrollTo(0, 0);
    }

    showPostDetail(slug) {
        const post = window.markdownParser.getPostBySlug(slug);
        if (!post) {
            this.navigate('/posts');
            return;
        }
        
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.style.display = 'none';
        });
        
        // Show post detail page
        const postDetailPage = document.getElementById('post-detail-page');
        postDetailPage.style.display = 'block';
        
        // Populate post content
        document.getElementById('post-title').textContent = post.frontmatter.title;
        document.getElementById('post-date').textContent = window.markdownParser.formatDate(post.frontmatter.date);
        document.getElementById('post-category').textContent = post.frontmatter.category;
        document.getElementById('post-read-time').textContent = post.frontmatter.readTime;
        
        // Render tags
        const tagsContainer = document.getElementById('post-tags');
        tagsContainer.innerHTML = '';
        if (post.frontmatter.tags && post.frontmatter.tags.length > 0) {
            post.frontmatter.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                tagElement.addEventListener('click', () => {
                    this.navigate('/posts?tag=' + encodeURIComponent(tag));
                });
                tagsContainer.appendChild(tagElement);
            });
        }
        
        // Render markdown content
        const contentContainer = document.getElementById('post-content');
        contentContainer.innerHTML = window.markdownParser.renderMarkdown(post.content);
        
        // Scroll to top
        window.scrollTo(0, 0);
        
        // Update page title
        document.title = `${post.frontmatter.title} - nodove`;
    }

    loadPageContent(pageId) {
        switch (pageId) {
            case 'home':
                this.loadHomePage();
                break;
            case 'posts':
                this.loadPostsPage();
                break;
            case 'projects':
                this.loadProjectsPage();
                break;
        }
        
        // Update page title
        const pageTitles = {
            'home': 'nodove - Tech Blog',
            'posts': 'Posts - nodove',
            'projects': 'Projects - nodove',
            'about': 'About - nodove',
            'contact': 'Contact - nodove'
        };
        document.title = pageTitles[pageId] || 'nodove';
    }

    loadHomePage() {
        // Load recent posts for home page
        const posts = window.markdownParser.getRecentPosts(6);
        const container = document.getElementById('recent-posts-grid');
        container.innerHTML = '';
        
        if (posts.length === 0) {
            container.innerHTML = '<p class="no-posts">아직 포스트가 없습니다.</p>';
            return;
        }
        
        posts.forEach(post => {
            const postCard = this.createPostCard(post);
            container.appendChild(postCard);
        });
    }

    loadPostsPage() {
        // Get URL parameters for filtering
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        const tag = urlParams.get('tag');
        const search = urlParams.get('search');
        
        this.currentFilters = { category, tag, search };
        
        let posts = window.markdownParser.posts;
        let filteredPosts = [...posts];
        
        // Apply filters
        if (category) {
            filteredPosts = window.markdownParser.getPostsByCategory(category);
        } else if (tag) {
            filteredPosts = window.markdownParser.getPostsByTag(tag);
        } else if (search) {
            filteredPosts = window.markdownParser.searchPosts(search);
        }
        
        // Update statistics
        this.updatePostsStats(filteredPosts.length, posts.length, { category, tag, search });
        
        // Populate posts grid
        const container = document.getElementById('all-posts-grid');
        container.innerHTML = '';
        
        if (filteredPosts.length === 0) {
            container.innerHTML = `
                <div class="no-posts-message">
                    <h3>검색 결과가 없습니다</h3>
                    <p>다른 검색어나 필터를 시도해보세요.</p>
                    <button class="btn-outline" onclick="window.router.clearAllFilters()">필터 초기화</button>
                </div>
            `;
            return;
        }
        
        filteredPosts.forEach(post => {
            const postCard = this.createPostCard(post);
            container.appendChild(postCard);
        });
        
        // Update filters
        this.updateFilters(category, tag);
        
        // Setup clear filters button
        this.setupClearFilters();
    }

    updatePostsStats(filtered, total, filters) {
        const statsContainer = document.getElementById('posts-stats');
        if (!statsContainer) return;
        
        let statsText = `총 ${total}개 포스트`;
        if (filtered !== total) {
            statsText += ` 중 ${filtered}개 표시`;
        }
        
        if (filters.search) {
            statsText += ` (검색: "${filters.search}")`;
        } else if (filters.category) {
            statsText += ` (카테고리: ${filters.category})`;
        } else if (filters.tag) {
            statsText += ` (태그: ${filters.tag})`;
        }
        
        statsContainer.innerHTML = `<p class="stats-text">${statsText}</p>`;
    }

    setupClearFilters() {
        const clearButton = document.getElementById('clear-filters');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
    }

    clearAllFilters() {
        // Clear search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Navigate to clean posts page
        this.navigate('/posts');
    }

    loadProjectsPage() {
        // Enhanced projects with more details
        const projects = [
            {
                title: "커스텀 블로그 시스템",
                description: "순수 JavaScript로 구현한 SPA 기반 개인 블로그 시스템. 마크다운 파싱, 검색, 필터링 기능 지원",
                tech: ["JavaScript", "HTML5", "CSS3", "SPA", "Markdown"],
                github: "https://github.com/nodove/blog",
                demo: "#",
                status: "완료",
                year: "2025"
            },
            {
                title: "차량 관리 시스템",
                description: "Spring Boot와 React를 활용한 종합적인 차량 관리 웹 애플리케이션. 실시간 데이터 동기화 지원",
                tech: ["Spring Boot", "React", "MySQL", "JPA", "REST API"],
                github: "https://github.com/nodove/car-management",
                demo: "#",
                status: "진행중",
                year: "2024"
            },
            {
                title: "AI 기반 키오스크",
                description: "음성 인식과 자연어 처리 기술을 활용한 스마트 주문 시스템. 다국어 지원 및 접근성 고려",
                tech: ["Python", "FastAPI", "OpenAI", "React", "TensorFlow"],
                github: "https://github.com/nodove/ai-kiosk",
                demo: "#",
                status: "완료",
                year: "2024"
            },
            {
                title: "실시간 채팅 앱",
                description: "WebSocket을 활용한 실시간 메시징 및 화상 통화 기능 지원. 확장 가능한 마이크로서비스 아키텍처",
                tech: ["Node.js", "Socket.io", "React", "WebRTC", "Redis"],
                github: "https://github.com/nodove/realtime-chat",
                demo: "#",
                status: "완료",
                year: "2024"
            },
            {
                title: "개인 일정 관리 API",
                description: "Django REST Framework를 활용한 일정 관리 API. JWT 인증 및 권한 관리 시스템 구현",
                tech: ["Django", "PostgreSQL", "JWT", "Docker", "AWS"],
                github: "https://github.com/nodove/schedule-api",
                demo: "#",
                status: "완료",
                year: "2023"
            },
            {
                title: "모바일 다이어리 앱",
                description: "React Native와 MongoDB를 활용한 크로스플랫폼 다이어리 앱. 오프라인 동기화 지원",
                tech: ["React Native", "MongoDB", "Express", "AWS S3"],
                github: "https://github.com/nodove/mobile-diary",
                demo: "#",
                status: "완료",
                year: "2023"
            }
        ];
        
        const container = document.getElementById('projects-grid');
        container.innerHTML = '';
        
        projects.forEach(project => {
            const projectCard = this.createProjectCard(project);
            container.appendChild(projectCard);
        });
    }

    createPostCard(post) {
        const card = document.createElement('div');
        card.className = 'post-card animate-on-scroll';
        card.innerHTML = `
            <div class="post-meta">
                <span class="post-date">${window.markdownParser.formatDate(post.frontmatter.date)}</span>
                <span class="post-separator">•</span>
                <span class="post-read-time">${post.frontmatter.readTime}</span>
                <span class="post-separator">•</span>
                <span class="post-category">${post.frontmatter.category}</span>
            </div>
            <h3 class="post-title">${post.frontmatter.title}</h3>
            <p class="post-excerpt">${post.frontmatter.excerpt || ''}</p>
            <div class="post-tags">
                ${post.frontmatter.tags && post.frontmatter.tags.length > 0 ? 
                    post.frontmatter.tags.map(tag => 
                        `<span class="tag-small" onclick="window.router.navigate('/posts?tag=${encodeURIComponent(tag)}')">${tag}</span>`
                    ).join('') : 
                    ''
                }
            </div>
            <a href="/post/${post.slug}" class="read-more" data-route="/post/${post.slug}">더 읽기 →</a>
        `;
        return card;
    }

    createProjectCard(project) {
        const card = document.createElement('div');
        card.className = 'project-card animate-on-scroll';
        card.innerHTML = `
            <div class="project-header">
                <h3 class="project-title">${project.title}</h3>
                <div class="project-meta">
                    <span class="project-year">${project.year}</span>
                    <span class="project-status status-${project.status === '완료' ? 'completed' : 'in-progress'}">${project.status}</span>
                </div>
            </div>
            <p class="project-description">${project.description}</p>
            <div class="tech-stack">
                ${project.tech.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
            </div>
            <div class="project-links">
                <a href="${project.github}" class="project-link github-link" target="_blank" rel="noopener noreferrer">
                    <span>GitHub</span>
                </a>
                ${project.demo !== '#' ? 
                    `<a href="${project.demo}" class="project-link demo-link" target="_blank" rel="noopener noreferrer">
                        <span>Demo</span>
                    </a>` : 
                    ''
                }
            </div>
        `;
        return card;
    }

    updateFilters(selectedCategory, selectedTag) {
        // Update category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">모든 카테고리</option>';
            const categories = window.markdownParser.getCategories();
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                option.selected = category === selectedCategory;
                categoryFilter.appendChild(option);
            });
            
            // Remove existing event listener and add new one
            categoryFilter.replaceWith(categoryFilter.cloneNode(true));
            const newCategoryFilter = document.getElementById('category-filter');
            newCategoryFilter.addEventListener('change', (e) => {
                const category = e.target.value;
                const newUrl = category ? `/posts?category=${encodeURIComponent(category)}` : '/posts';
                this.navigate(newUrl);
            });
        }
        
        // Update tags filter
        const tagsFilter = document.getElementById('tags-filter');
        if (tagsFilter) {
            tagsFilter.innerHTML = '';
            const tags = window.markdownParser.getTags();
            
            if (tags.length > 0) {
                // Add "All Tags" button
                const allTagsButton = document.createElement('button');
                allTagsButton.className = `tag-filter ${!selectedTag ? 'active' : ''}`;
                allTagsButton.textContent = '모든 태그';
                allTagsButton.addEventListener('click', () => {
                    this.navigate('/posts');
                });
                tagsFilter.appendChild(allTagsButton);
                
                // Add individual tag buttons
                tags.forEach(tag => {
                    const tagButton = document.createElement('button');
                    tagButton.className = `tag-filter ${tag === selectedTag ? 'active' : ''}`;
                    tagButton.textContent = tag;
                    tagButton.addEventListener('click', () => {
                        const newUrl = `/posts?tag=${encodeURIComponent(tag)}`;
                        this.navigate(newUrl);
                    });
                    tagsFilter.appendChild(tagButton);
                });
            }
        }
    }

    updateActiveNavItem(path) {
        // Remove active class from all nav items
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current nav item
        let baseRoute = path.split('/')[1] || '';
        if (path.startsWith('/post/')) {
            baseRoute = 'posts'; // Post detail pages should highlight Posts nav item
        }
        
        const routeMap = {
            '': 'home',
            'posts': 'posts',
            'projects': 'projects',
            'about': 'about',
            'contact': 'contact'
        };
        
        const targetRoute = routeMap[baseRoute] || 'home';
        const activeLink = document.querySelector(`.nav-menu a[href="/${targetRoute === 'home' ? '' : targetRoute}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
}
}

// Global router instance
window.router = new Router();