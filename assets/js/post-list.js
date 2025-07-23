/**
 * Post list view switcher
 * Handles toggling between grid and list views for post listings
 */
document.addEventListener('DOMContentLoaded', function() {
  const viewOptions = document.querySelectorAll('.view-option');
  const cardsContainer = document.querySelector('.cards-container');
  
  // Get saved view preference from localStorage or default to grid
  const savedView = localStorage.getItem('blogViewPreference') || 'grid';
  
  // Set initial view based on saved preference
  if (cardsContainer) {
    cardsContainer.classList.remove('grid-view', 'list-view');
    cardsContainer.classList.add(savedView + '-view');
    
    // Update active button state
    viewOptions.forEach(option => {
      option.classList.remove('active');
      if (option.dataset.view === savedView) {
        option.classList.add('active');
      }
    });
  }
  
  // Add click handlers to view options
  viewOptions.forEach(option => {
    option.addEventListener('click', function() {
      const viewType = this.dataset.view;
      
      // Update active state
      viewOptions.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Switch view
      if (cardsContainer) {
        cardsContainer.classList.remove('grid-view', 'list-view');
        cardsContainer.classList.add(viewType + '-view');
        
        // Save preference
        localStorage.setItem('blogViewPreference', viewType);
      }
    });
  });
});
