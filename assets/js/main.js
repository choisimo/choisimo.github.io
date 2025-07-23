// Main JavaScript for nodove blog

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Dark mode toggle functionality
  setupDarkModeToggle();
  
  // Mobile navigation toggle
  setupMobileNavigation();
  
  // Dropdown menu functionality
  setupDropdownMenus();
});

/**
 * Setup dark mode toggle functionality
 */
function setupDarkModeToggle() {
  const darkModeToggle = document.querySelector('.dark-mode-toggle');
  const html = document.documentElement;
  
  // Check for saved user preference, default to light mode
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    html.classList.add('dark');
    updateToggleIcon(true);
  }
  
  // Toggle dark/light mode on click
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', function() {
      html.classList.toggle('dark');
      const isDarkMode = html.classList.contains('dark');
      
      // Save user preference
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
      
      // Update toggle icon
      updateToggleIcon(isDarkMode);
    });
  }
}

/**
 * Update dark mode toggle icon
 * @param {boolean} isDarkMode - Whether dark mode is active
 */
function updateToggleIcon(isDarkMode) {
  const moonIcon = document.querySelector('.moon-icon');
  const sunIcon = document.querySelector('.sun-icon');
  
  if (moonIcon && sunIcon) {
    if (isDarkMode) {
      moonIcon.classList.add('hidden');
      sunIcon.classList.remove('hidden');
    } else {
      moonIcon.classList.remove('hidden');
      sunIcon.classList.add('hidden');
    }
  }
}

/**
 * Setup mobile navigation toggle
 */
function setupMobileNavigation() {
  const mobileToggle = document.querySelector('.mobile-nav-toggle');
  const navbarNav = document.querySelector('.navbar-nav');
  
  if (mobileToggle && navbarNav) {
    mobileToggle.addEventListener('click', function() {
      mobileToggle.classList.toggle('active');
      navbarNav.classList.toggle('active');
      
      // Prevent body scrolling when nav is open
      document.body.classList.toggle('nav-open');
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
      if (navbarNav.classList.contains('active') && 
          !event.target.closest('.navbar-nav') && 
          !event.target.closest('.mobile-nav-toggle')) {
        mobileToggle.classList.remove('active');
        navbarNav.classList.remove('active');
        document.body.classList.remove('nav-open');
      }
    });
  }
}

/**
 * Setup dropdown menu functionality
 */
function setupDropdownMenus() {
  const dropdowns = document.querySelectorAll('.dropdown');
  
  // Desktop: Hover to show dropdown
  if (window.innerWidth > 991) {
    dropdowns.forEach(dropdown => {
      dropdown.addEventListener('mouseenter', function() {
        this.querySelector('.dropdown-menu').classList.add('show');
      });
      
      dropdown.addEventListener('mouseleave', function() {
        this.querySelector('.dropdown-menu').classList.remove('show');
      });
    });
  } 
  // Mobile: Click to show dropdown
  else {
    dropdowns.forEach(dropdown => {
      const toggle = dropdown.querySelector('.dropdown-toggle');
      if (toggle) {
        toggle.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          const menu = this.nextElementSibling;
          const isActive = menu.classList.contains('show');
          
          // Close all other open dropdowns
          document.querySelectorAll('.dropdown-menu.show').forEach(openMenu => {
            if (openMenu !== menu) {
              openMenu.classList.remove('show');
              openMenu.previousElementSibling.classList.remove('active');
            }
          });
          
          // Toggle this dropdown
          menu.classList.toggle('show');
          this.classList.toggle('active');
        });
      }
    });
  }
}
