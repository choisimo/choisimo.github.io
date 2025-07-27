// PRD-Aligned Dark Mode Theme Toggle
class ThemeToggle {
  constructor() {
    this.theme = this.getStoredTheme() || this.getPreferredTheme();
    this.init();
  }

  init() {
    this.setTheme(this.theme);
    this.createToggle();
    this.bindEvents();
  }

  getStoredTheme() {
    return localStorage.getItem('theme');
  }

  getPreferredTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  setTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
    
    // PRD: Trigger custom event for theme change
    document.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { theme } 
    }));
  }

  createToggle() {
    // Check if toggle already exists
    const existingToggle = document.getElementById('theme-toggle');
    if (existingToggle) {
      return;
    }

    const toggle = document.createElement('button');
    toggle.id = 'theme-toggle';
    toggle.className = 'theme-toggle';
    toggle.setAttribute('aria-label', 'Toggle dark mode');
    toggle.innerHTML = `
      <svg class="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
      <svg class="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>
      </svg>
    `;

    // PRD: Enhanced CSS styles for the toggle with proper theming
    const style = document.createElement('style');
    style.textContent = `
      .theme-toggle {
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        padding: 0.5rem;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        min-width: 44px;
        transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
        position: relative;
      }

      .theme-toggle:hover {
        color: var(--accent-blue);
        border-color: var(--accent-blue);
        background: rgba(var(--primary-rgb), 0.1);
        transform: translateY(-1px);
      }

      .theme-toggle:focus {
        outline: 2px solid var(--accent-blue);
        outline-offset: 2px;
      }

      .theme-toggle .sun-icon,
      .theme-toggle .moon-icon {
        position: absolute;
        transition: all 0.3s ease;
      }

      .theme-toggle .sun-icon {
        opacity: 1;
        transform: rotate(0deg) scale(1);
      }

      .theme-toggle .moon-icon {
        opacity: 0;
        transform: rotate(180deg) scale(0.5);
      }

      [data-theme="dark"] .theme-toggle .sun-icon,
      .dark .theme-toggle .sun-icon {
        opacity: 0;
        transform: rotate(-180deg) scale(0.5);
      }

      [data-theme="dark"] .theme-toggle .moon-icon,
      .dark .theme-toggle .moon-icon {
        opacity: 1;
        transform: rotate(0deg) scale(1);
      }

      @media (max-width: 768px) {
        .theme-toggle {
          min-height: 44px;
          min-width: 44px;
        }
      }
    `;

    document.head.appendChild(style);

    // Insert toggle into existing navbar structure
    const navbarActions = document.querySelector('.navbar-actions');
    if (navbarActions) {
      navbarActions.appendChild(toggle);
    } else {
      // Fallback: append to navbar or body
      const navbar = document.querySelector('.navbar') || document.querySelector('nav') || document.querySelector('header');
      if (navbar) {
        navbar.appendChild(toggle);
      } else {
        document.body.appendChild(toggle);
      }
    }
  }

  bindEvents() {
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const newTheme = this.theme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
      });
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!this.getStoredTheme()) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });

    // PRD: Handle theme transitions smoothly
    document.addEventListener('themeChanged', (e) => {
      // Add smooth transition class temporarily
      document.documentElement.style.transition = 'color 0.3s ease, background-color 0.3s ease';
      setTimeout(() => {
        document.documentElement.style.transition = '';
      }, 300);
    });
  }
}

// Initialize theme toggle when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ThemeToggle();
});

// PRD: Also handle case where script loads after DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ThemeToggle();
  });
} else {
  new ThemeToggle();
}