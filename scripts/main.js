// Main JavaScript for nodove Blog
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Blog initializing...');
    
    try {
        // Show loading indicator
        showLoadingIndicator();
        
        // Initialize markdown parser and load posts
        await window.markdownParser.loadPosts();
        console.log('Posts loaded successfully');
        
        // Setup search functionality
        setupSearch();
        
        // Setup smooth scrolling for anchor links
        setupSmoothScrolling();
        
        // Setup scroll animations
        setupScrollAnimations();
        
        // Add custom styles
        addCustomStyles();
        
        // Setup theme toggle
        setupThemeToggle();
        
        // Setup mobile menu
        setupMobileMenu();
        
        // Hide loading indicator
        hideLoadingIndicator();
        
        console.log('Blog initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize blog:', error);
        hideLoadingIndicator();
        showErrorMessage('블로그를 로드하는 중 오류가 발생했습니다.');
    }
});

// Loading indicator functions
function showLoadingIndicator() {
    const loader = document.createElement('div');
    loader.id = 'page-loader';
    loader.innerHTML = `
        <div class="loader-content">
            <div class="loader-spinner"></div>
            <p>로딩 중...</p>
        </div>
    `;
    document.body.appendChild(loader);
}

function hideLoadingIndicator() {
    const loader = document.getElementById('page-loader');
    if (loader) {
        loader.remove();
    }
}

function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div class="error-content">
            <h3>오류 발생</h3>
            <p>${message}</p>
            <button onclick="location.reload()" class="btn-outline">새로고침</button>
        </div>
    `;
    document.body.appendChild(errorDiv);
}

// Enhanced search functionality
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        // Debounce search with better timing
        searchTimeout = setTimeout(() => {
            if (query.length >= 2) {
                window.router.navigate(`/posts?search=${encodeURIComponent(query)}`);
            } else if (window.location.pathname === '/posts' && window.location.search.includes('search=')) {
                window.router.navigate('/posts');
            }
        }, 300);
    });
    
    // Handle Enter key
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            if (query) {
                window.router.navigate(`/posts?search=${encodeURIComponent(query)}`);
            }
        }
    });
    
    // Initialize search from URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery) {
        searchInput.value = searchQuery;
    }
}

// Theme toggle functionality
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    // Check for saved theme or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggleIcon(savedTheme);
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeToggleIcon(newTheme);
    });
}

function updateThemeToggleIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    themeToggle.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}

// Mobile menu functionality
function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    if (!mobileMenuBtn || !navMenu) return;
    
    mobileMenuBtn.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
        
        // Update aria-expanded
        const isExpanded = navMenu.classList.contains('active');
        mobileMenuBtn.setAttribute('aria-expanded', isExpanded);
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!navMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            navMenu.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
        }
    });
    
    // Close menu on navigation
    navMenu.addEventListener('click', function(e) {
        if (e.target.tagName === 'A') {
            navMenu.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
        }
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

// Enhanced scroll animations with better performance
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                // Stop observing once animated to improve performance
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
        const animateElements = document.querySelectorAll('.post-card, .project-card, .hero, .about-content, .service-card');
        animateElements.forEach(element => {
            // Add initial animation class
            element.classList.add('animate-on-scroll');
            observer.observe(element);
        });
    });
}

// Enhanced custom CSS with loader and animations
function addCustomStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Loading indicator */
        #page-loader {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(255, 255, 255, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            backdrop-filter: blur(5px);
        }
        
        [data-theme="dark"] #page-loader {
            background-color: rgba(17, 24, 39, 0.9);
        }
        
        .loader-content {
            text-align: center;
            color: var(--text-color);
        }
        
        .loader-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--border-color);
            border-top: 3px solid var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem auto;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Error message */
        .error-message {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            text-align: center;
            max-width: 400px;
            width: 90%;
        }
        
        .error-content h3 {
            color: #ef4444;
            margin-bottom: 1rem;
        }
        
        /* Animations */
        .animate-on-scroll {
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.6s ease-out;
        }
        
        .animate-on-scroll.fade-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        /* Enhanced search input styling */
        .search-input {
            padding: 0.75rem 1rem;
            border: 2px solid var(--border-color);
            border-radius: 25px;
            background-color: var(--card-bg);
            color: var(--text-color);
            font-size: 0.9rem;
            width: 250px;
            transition: all 0.3s ease;
            outline: none;
        }
        
        .search-input:focus {
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            transform: scale(1.02);
        }
        
        .search-input::placeholder {
            color: var(--text-secondary);
        }
        
        /* Theme toggle button */
        #theme-toggle {
            background: none;
            border: 2px solid var(--border-color);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 1.2rem;
        }
        
        #theme-toggle:hover {
            border-color: var(--primary-color);
            transform: scale(1.1);
        }
        
        /* Mobile menu button */
        #mobile-menu-btn {
            display: none;
            background: none;
            border: none;
            font-size: 1.5rem;
            color: var(--text-color);
            cursor: pointer;
            padding: 0.5rem;
        }
        
        /* Navigation improvements */
        .nav-controls {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .nav-menu a.active {
            color: var(--primary-color);
            font-weight: 600;
            position: relative;
        }
        
        .nav-menu a.active::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 0;
            width: 100%;
            height: 2px;
            background-color: var(--primary-color);
        }
        
        /* Enhanced page structure */
        .page {
            min-height: calc(100vh - 160px);
            padding: 2rem 0;
            opacity: 0;
            animation: pageEnter 0.5s ease-out forwards;
        }
        
        @keyframes pageEnter {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .page-header {
            text-align: center;
            margin-bottom: 3rem;
        }
        
        .page-header h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            color: var(--text-color);
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        /* Enhanced filters */
        .filters {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            align-items: center;
            margin: 2rem 0;
            padding: 1.5rem;
            background: var(--card-bg);
            border-radius: 12px;
            border: 1px solid var(--border-color);
        }
        
        .filter-row {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .filter-select {
            padding: 0.5rem 1rem;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            background-color: var(--card-bg);
            color: var(--text-color);
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .filter-select:hover {
            border-color: var(--primary-color);
        }
        
        .tags-filter {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            justify-content: center;
            max-width: 600px;
        }
        
        .tag-filter {
            padding: 0.4rem 1rem;
            border: 1px solid var(--border-color);
            border-radius: 20px;
            background-color: var(--card-bg);
            color: var(--text-color);
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.3s ease;
            white-space: nowrap;
        }
        
        .tag-filter:hover,
        .tag-filter.active {
            background-color: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
            transform: translateY(-1px);
        }
        
        /* Post styling improvements */
        .post-tags {
            margin: 1rem 0;
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        
        .tag {
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
            padding: 0.3rem 0.8rem;
            border-radius: 16px;
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-block;
            text-decoration: none;
        }
        
        .tag:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        .tag-small {
            padding: 0.2rem 0.6rem;
            font-size: 0.7rem;
        }
        
        /* Enhanced post detail styling */
        .post-detail {
            max-width: 800px;
            margin: 0 auto;
            background: var(--card-bg);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        
        .post-header {
            margin-bottom: 0;
            text-align: center;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
            padding: 3rem 2rem;
        }
        
        .post-header h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            color: white;
        }
        
        .post-meta {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.9rem;
        }
        
        .post-content {
            padding: 3rem;
            line-height: 1.8;
            font-size: 1.1rem;
        }
        
        .post-content h1,
        .post-content h2,
        .post-content h3 {
            margin: 2.5rem 0 1.5rem 0;
            color: var(--text-color);
        }
        
        .post-content h1 {
            font-size: 2rem;
            border-bottom: 3px solid var(--primary-color);
            padding-bottom: 0.5rem;
        }
        
        .post-content h2 {
            font-size: 1.6rem;
            color: var(--primary-color);
        }
        
        .post-content h3 {
            font-size: 1.3rem;
        }
        
        .post-content p {
            margin-bottom: 1.5rem;
            text-align: justify;
        }
        
        .post-content ul,
        .post-content ol {
            margin: 1.5rem 0;
            padding-left: 2rem;
        }
        
        .post-content li {
            margin-bottom: 0.75rem;
        }
        
        /* Enhanced code styling */
        .post-content pre {
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1.5rem;
            overflow-x: auto;
            margin: 2rem 0;
            font-size: 0.9rem;
            line-height: 1.6;
            position: relative;
        }
        
        .post-content pre::before {
            content: attr(data-lang);
            position: absolute;
            top: 0.5rem;
            right: 1rem;
            background: var(--primary-color);
            color: white;
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            font-size: 0.7rem;
            text-transform: uppercase;
        }
        
        [data-theme="dark"] .post-content pre {
            background: linear-gradient(135deg, #1e293b, #0f172a);
            border-color: #374151;
        }
        
        .post-content code {
            background-color: var(--code-bg);
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
            font-size: 0.9em;
            color: var(--code-color);
        }
        
        .post-content blockquote {
            border-left: 4px solid var(--primary-color);
            background: var(--card-bg);
            padding: 1rem 1.5rem;
            margin: 2rem 0;
            border-radius: 0 8px 8px 0;
            color: var(--text-secondary);
            font-style: italic;
        }
        
        /* Button enhancements */
        .btn-outline {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            border: 2px solid var(--primary-color);
            color: var(--primary-color);
            text-decoration: none;
            border-radius: 25px;
            font-weight: 600;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .btn-outline::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: var(--primary-color);
            transition: left 0.3s ease;
            z-index: -1;
        }
        
        .btn-outline:hover::before {
            left: 0;
        }
        
        .btn-outline:hover {
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        /* Responsive improvements */
        @media (max-width: 768px) {
            #mobile-menu-btn {
                display: block;
            }
            
            .nav-menu {
                display: none;
                position: absolute;
                top: 100%;
                left: 0;
                width: 100%;
                background: var(--header-bg);
                border-top: 1px solid var(--border-color);
                flex-direction: column;
                padding: 1rem 0;
            }
            
            .nav-menu.active {
                display: flex;
            }
            
            .nav-menu a {
                padding: 0.75rem 1rem;
                border-bottom: 1px solid var(--border-color);
            }
            
            .search-input {
                width: 200px;
            }
            
            .nav-controls {
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .filters {
                margin: 1rem;
                padding: 1rem;
            }
            
            .filter-row {
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .tags-filter {
                justify-content: flex-start;
            }
            
            .post-header {
                padding: 2rem 1rem;
            }
            
            .post-header h1 {
                font-size: 2rem;
            }
            
            .post-content {
                padding: 2rem 1rem;
                font-size: 1rem;
            }
            
            .post-meta {
                flex-direction: column;
                gap: 0.5rem;
            }
        }
        
        @media (max-width: 480px) {
            .search-input {
                width: 150px;
            }
            
            .post-header h1 {
                font-size: 1.5rem;
            }
            
            .page-header h1 {
                font-size: 2rem;
            }
        }
    `;
    document.head.appendChild(style);
}