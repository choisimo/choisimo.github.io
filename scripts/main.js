// Main JavaScript for Custom Blog
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize markdown parser and load posts
    await window.markdownParser.loadPosts();
    
    // Setup search functionality
    setupSearch();
    
    // Setup smooth scrolling for anchor links
    setupSmoothScrolling();
    
    // Setup scroll animations
    setupScrollAnimations();
    
    // Add custom styles
    addCustomStyles();
});

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        // Debounce search
        searchTimeout = setTimeout(() => {
            if (query) {
                window.router.navigate(`/posts?search=${encodeURIComponent(query)}`);
            } else if (window.location.pathname === '/posts' && window.location.search.includes('search=')) {
                window.router.navigate('/posts');
            }
        }, 300);
    });
    
    // Handle search on posts page
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery) {
        searchInput.value = searchQuery;
    }
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

    // Observe elements that should animate
    const animateElements = document.querySelectorAll('.post-card, .project-card, .hero, .about-content');
    animateElements.forEach(element => {
        observer.observe(element);
    });
}

// Add custom CSS styles
function addCustomStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Search input styling */
        .search-input {
            padding: 0.5rem 1rem;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            background-color: var(--card-bg);
            color: var(--text-color);
            font-size: 0.9rem;
            width: 200px;
            transition: all 0.3s ease;
        }
        
        .search-input:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
        
        .nav-controls {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        /* Page structure */
        .page {
            min-height: calc(100vh - 160px);
            padding: 2rem 0;
        }
        
        .page-header {
            text-align: center;
            margin-bottom: 3rem;
        }
        
        .page-header h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            color: var(--text-color);
        }
        
        /* Filters */
        .filters {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            align-items: center;
            margin-top: 2rem;
        }
        
        .filter-select {
            padding: 0.5rem 1rem;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            background-color: var(--card-bg);
            color: var(--text-color);
            font-size: 0.9rem;
        }
        
        .tags-filter {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            justify-content: center;
        }
        
        .tag-filter {
            padding: 0.3rem 0.8rem;
            border: 1px solid var(--border-color);
            border-radius: 16px;
            background-color: var(--card-bg);
            color: var(--text-color);
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .tag-filter:hover,
        .tag-filter.active {
            background-color: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
        }
        
        /* Tags in posts */
        .post-tags {
            margin: 1rem 0;
            display: flex;
            flex-wrap: wrap;
            gap: 0.3rem;
        }
        
        .tag-small {
            background-color: var(--primary-color);
            color: white;
            padding: 0.2rem 0.5rem;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: 500;
        }
        
        .tag {
            background-color: var(--primary-color);
            color: white;
            padding: 0.3rem 0.8rem;
            border-radius: 16px;
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-block;
            margin: 0.2rem;
        }
        
        .tag:hover {
            background-color: var(--secondary-color);
            transform: translateY(-1px);
        }
        
        /* Post detail styling */
        .post-detail {
            max-width: 800px;
            margin: 0 auto;
        }
        
        .post-header {
            margin-bottom: 3rem;
            text-align: center;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 2rem;
        }
        
        .post-header h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            color: var(--text-color);
        }
        
        .post-content {
            line-height: 1.8;
            font-size: 1.1rem;
        }
        
        .post-content h1,
        .post-content h2,
        .post-content h3 {
            margin: 2rem 0 1rem 0;
            color: var(--text-color);
        }
        
        .post-content h1 {
            font-size: 2rem;
            border-bottom: 2px solid var(--primary-color);
            padding-bottom: 0.5rem;
        }
        
        .post-content h2 {
            font-size: 1.5rem;
        }
        
        .post-content h3 {
            font-size: 1.3rem;
        }
        
        .post-content p {
            margin-bottom: 1.5rem;
        }
        
        .post-content ul,
        .post-content ol {
            margin: 1rem 0;
            padding-left: 2rem;
        }
        
        .post-content li {
            margin-bottom: 0.5rem;
        }
        
        .post-content pre {
            background-color: #f1f5f9;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 1.5rem;
            overflow-x: auto;
            margin: 1.5rem 0;
            font-size: 0.9rem;
            line-height: 1.5;
        }
        
        [data-theme="dark"] .post-content pre {
            background-color: #1e293b;
            border-color: #374151;
        }
        
        .post-content code {
            background-color: #f1f5f9;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        
        [data-theme="dark"] .post-content code {
            background-color: #374151;
        }
        
        .post-content blockquote {
            border-left: 4px solid var(--primary-color);
            padding-left: 1rem;
            margin: 1.5rem 0;
            color: #6b7280;
            font-style: italic;
        }
        
        .post-navigation {
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid var(--border-color);
            text-align: center;
        }
        
        /* Button styles */
        .btn-outline {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            border: 2px solid var(--primary-color);
            color: var(--primary-color);
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        .btn-outline:hover {
            background-color: var(--primary-color);
            color: white;
            transform: translateY(-2px);
        }
        
        /* Navigation active state */
        .nav-menu a.active {
            color: var(--primary-color);
            font-weight: 600;
        }
        
        /* Recent posts section on home */
        .recent-posts-section {
            padding: 4rem 0;
            background-color: var(--header-bg);
        }
        
        .view-all-posts {
            text-align: center;
            margin-top: 2rem;
        }
        
        /* Responsive design updates */
        @media (max-width: 768px) {
            .search-input {
                width: 150px;
            }
            
            .nav-controls {
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .filters {
                flex-direction: column;
                align-items: stretch;
            }
            
            .tags-filter {
                justify-content: flex-start;
            }
            
            .post-header h1 {
                font-size: 2rem;
            }
            
            .post-content {
                font-size: 1rem;
            }
        }
    `;
    document.head.appendChild(style);
}