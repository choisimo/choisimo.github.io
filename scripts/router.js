// Router for Single Page Application
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
        document.getElementById('post-date').textContent = post.frontmatter.date;
        document.getElementById('post-category').textContent = post.frontmatter.category;
        document.getElementById('post-read-time').textContent = post.frontmatter.readTime;
        
        // Render tags
        const tagsContainer = document.getElementById('post-tags');
        tagsContainer.innerHTML = '';
        if (post.frontmatter.tags) {
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
        document.title = `${post.frontmatter.title} - Nodove`;
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
            'home': 'Nodove - Tech Blog',
            'posts': 'Posts - Nodove',
            'projects': 'Projects - Nodove',
            'about': 'About - Nodove',
            'contact': 'Contact - Nodove'
        };
        document.title = pageTitles[pageId] || 'Nodove';
    }

    loadHomePage() {
        // Load recent posts for home page
        const posts = window.markdownParser.posts.slice(0, 6); // Show 6 recent posts
        const container = document.getElementById('recent-posts-grid');
        container.innerHTML = '';
        
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
        
        let posts = window.markdownParser.posts;
        
        // Apply filters
        if (category) {
            posts = window.markdownParser.getPostsByCategory(category);
        } else if (tag) {
            posts = window.markdownParser.getPostsByTag(tag);
        } else if (search) {
            posts = window.markdownParser.searchPosts(search);
        }
        
        // Populate posts grid
        const container = document.getElementById('all-posts-grid');
        container.innerHTML = '';
        
        posts.forEach(post => {
            const postCard = this.createPostCard(post);
            container.appendChild(postCard);
        });
        
        // Update filters
        this.updateFilters(category, tag);
    }

    loadProjectsPage() {
        // Load projects (you can move this data to a separate file)
        const projects = [
            {
                title: "차량 관리 시스템",
                description: "Spring Boot와 React를 활용한 종합적인 차량 관리 웹 애플리케이션",
                tech: ["Spring Boot", "React", "MySQL", "JPA"],
                github: "https://github.com/nodove/car-management",
                demo: "#"
            },
            {
                title: "AI 기반 키오스크",
                description: "음성 인식과 자연어 처리 기술을 활용한 스마트 주문 시스템",
                tech: ["Python", "FastAPI", "OpenAI", "React"],
                github: "https://github.com/nodove/ai-kiosk",
                demo: "#"
            },
            {
                title: "실시간 채팅 앱",
                description: "WebSocket을 활용한 실시간 메시징 및 화상 통화 기능 지원",
                tech: ["Node.js", "Socket.io", "React", "WebRTC"],
                github: "https://github.com/nodove/realtime-chat",
                demo: "#"
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
        card.className = 'post-card fade-in';
        card.innerHTML = `
            <div class="post-meta">${post.frontmatter.date} • ${post.frontmatter.readTime} • ${post.frontmatter.category}</div>
            <h3>${post.frontmatter.title}</h3>
            <p>${post.frontmatter.excerpt}</p>
            <div class="post-tags">
                ${post.frontmatter.tags ? post.frontmatter.tags.map(tag => 
                    `<span class="tag-small">${tag}</span>`
                ).join('') : ''}
            </div>
            <a href="/post/${post.slug}" class="read-more" data-route="/post/${post.slug}">더 읽기 →</a>
        `;
        return card;
    }

    createProjectCard(project) {
        const card = document.createElement('div');
        card.className = 'project-card fade-in';
        card.innerHTML = `
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            <div class="tech-stack">
                ${project.tech.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
            </div>
            <div class="project-links">
                <a href="${project.github}" class="project-link" target="_blank">GitHub</a>
                <a href="${project.demo}" class="project-link" target="_blank">Demo</a>
            </div>
        `;
        return card;
    }

    updateFilters(selectedCategory, selectedTag) {
        // Update category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">모든 카테고리</option>';
            window.markdownParser.getCategories().forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                option.selected = category === selectedCategory;
                categoryFilter.appendChild(option);
            });
            
            categoryFilter.addEventListener('change', (e) => {
                const category = e.target.value;
                const newUrl = category ? `/posts?category=${encodeURIComponent(category)}` : '/posts';
                this.navigate(newUrl);
            });
        }
        
        // Update tags filter
        const tagsFilter = document.getElementById('tags-filter');
        if (tagsFilter) {
            tagsFilter.innerHTML = '';
            window.markdownParser.getTags().forEach(tag => {
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

    updateActiveNavItem(path) {
        // Remove active class from all nav items
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current nav item
        const baseRoute = path.split('/')[1] || 'home';
        const activeLink = document.querySelector(`.nav-menu a[data-route="${baseRoute}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
}

// Global router instance
window.router = new Router();