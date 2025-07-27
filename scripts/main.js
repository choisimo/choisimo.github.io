// Main JavaScript for Custom Blog
document.addEventListener('DOMContentLoaded', function() {
    // Sample blog posts data
    const posts = [
        {
            title: "React와 Next.js로 모던 웹 개발하기",
            excerpt: "최신 React 기능과 Next.js의 장점을 활용한 웹 개발 방법론을 소개합니다.",
            date: "2025-01-20",
            readTime: "5분",
            category: "Web Development"
        },
        {
            title: "Python으로 AI 챗봇 만들기",
            excerpt: "OpenAI API를 활용하여 실용적인 AI 챗봇을 구현하는 과정을 단계별로 설명합니다.",
            date: "2025-01-15",
            readTime: "8분",
            category: "AI/ML"
        },
        {
            title: "Docker와 Kubernetes 실전 가이드",
            excerpt: "컨테이너 기술의 핵심인 Docker와 오케스트레이션 도구 Kubernetes 활용법을 다룹니다.",
            date: "2025-01-10",
            readTime: "12분",
            category: "DevOps"
        },
        {
            title: "모바일 앱 개발: React Native vs Flutter",
            excerpt: "크로스 플랫폼 모바일 개발 프레임워크의 특징과 선택 기준을 비교 분석합니다.",
            date: "2025-01-05",
            readTime: "7분",
            category: "Mobile"
        },
        {
            title: "웹 성능 최적화 기법",
            excerpt: "사용자 경험을 향상시키는 웹사이트 성능 최적화 방법들을 실무 관점에서 소개합니다.",
            date: "2024-12-28",
            readTime: "6분",
            category: "Performance"
        },
        {
            title: "Git과 GitHub 마스터하기",
            excerpt: "버전 관리의 핵심인 Git과 협업 도구 GitHub의 고급 기능들을 활용하는 방법을 설명합니다.",
            date: "2024-12-20",
            readTime: "9분",
            category: "Tools"
        }
    ];

    // Sample projects data
    const projects = [
        {
            title: "차량 관리 시스템",
            description: "Spring Boot와 React를 활용한 종합적인 차량 관리 웹 애플리케이션",
            tech: ["Spring Boot", "React", "MySQL", "JPA"],
            github: "#",
            demo: "#"
        },
        {
            title: "AI 기반 키오스크",
            description: "음성 인식과 자연어 처리 기술을 활용한 스마트 주문 시스템",
            tech: ["Python", "FastAPI", "OpenAI", "React"],
            github: "#",
            demo: "#"
        },
        {
            title: "실시간 채팅 앱",
            description: "WebSocket을 활용한 실시간 메시징 및 화상 통화 기능 지원",
            tech: ["Node.js", "Socket.io", "React", "WebRTC"],
            github: "#",
            demo: "#"
        },
        {
            title: "날씨 예보 대시보드",
            description: "오픈 API를 활용한 실시간 날씨 정보 및 예보 시각화 대시보드",
            tech: ["Vue.js", "Chart.js", "OpenWeather API"],
            github: "#",
            demo: "#"
        }
    ];

    // Render posts
    function renderPosts() {
        const postsGrid = document.getElementById('posts-grid');
        if (!postsGrid) return;

        posts.forEach(post => {
            const postCard = document.createElement('div');
            postCard.className = 'post-card fade-in';
            postCard.innerHTML = `
                <div class="post-meta">${post.date} • ${post.readTime} • ${post.category}</div>
                <h3>${post.title}</h3>
                <p>${post.excerpt}</p>
                <a href="#" class="read-more">더 읽기 →</a>
            `;
            postsGrid.appendChild(postCard);
        });
    }

    // Render projects
    function renderProjects() {
        const projectsGrid = document.getElementById('projects-grid');
        if (!projectsGrid) return;

        projects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card fade-in';
            projectCard.innerHTML = `
                <h3>${project.title}</h3>
                <p>${project.description}</p>
                <div class="tech-stack">
                    ${project.tech.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                </div>
                <div class="project-links">
                    <a href="${project.github}" class="project-link">GitHub</a>
                    <a href="${project.demo}" class="project-link">Demo</a>
                </div>
            `;
            projectsGrid.appendChild(projectCard);
        });
    }

    // Smooth scrolling for navigation links
    function setupSmoothScrolling() {
        const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Intersection Observer for animations
    function setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);

        // Observe sections
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            observer.observe(section);
        });
    }

    // Initialize everything
    renderPosts();
    renderProjects();
    setupSmoothScrolling();
    setupScrollAnimations();

    // Add CSS for tech tags and project links
    const style = document.createElement('style');
    style.textContent = `
        .tech-stack {
            margin: 1rem 0;
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        
        .tech-tag {
            background-color: var(--primary-color);
            color: white;
            padding: 0.3rem 0.8rem;
            border-radius: 16px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        
        .project-links {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .project-link {
            color: var(--primary-color);
            text-decoration: none;
            font-weight: 500;
            padding: 0.5rem 1rem;
            border: 1px solid var(--primary-color);
            border-radius: 6px;
            transition: all 0.3s ease;
        }
        
        .project-link:hover {
            background-color: var(--primary-color);
            color: white;
        }
    `;
    document.head.appendChild(style);
});