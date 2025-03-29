// Check if user is authenticated
const checkAuth = () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  return {
    isAuthenticated: !!token && !!user,
    user
  };
};

// Update UI based on authentication state
const updateAuthUI = () => {
  const { isAuthenticated, user } = checkAuth();
  const authElements = document.querySelectorAll('.auth-only');
  const noAuthElements = document.querySelectorAll('.no-auth-only');
  const adminElements = document.querySelectorAll('.admin-only');
  const tutorElements = document.querySelectorAll('.tutor-only');
  const pupilElements = document.querySelectorAll('.pupil-only');
  
  // Show/hide auth-only elements
  authElements.forEach(el => {
    el.style.display = isAuthenticated ? 'block' : 'none';
  });
  
  // Show/hide no-auth-only elements
  noAuthElements.forEach(el => {
    el.style.display = isAuthenticated ? 'none' : 'block';
  });
  
  // Show/hide role-specific elements
  if (isAuthenticated && user) {
    // Admin-only elements
    adminElements.forEach(el => {
      el.style.display = user.role === 'admin' ? 'block' : 'none';
    });
    
    // Tutor-only elements
    tutorElements.forEach(el => {
      el.style.display = user.role === 'tutor' ? 'block' : 'none';
    });
    
    // Pupil-only elements
    pupilElements.forEach(el => {
      el.style.display = user.role === 'pupil' ? 'block' : 'none';
    });
  }
};

// Handle logout
const setupLogout = () => {
  const logoutBtn = document.getElementById('logout-button');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to home
        window.location.href = '/';
      } catch (error) {
        console.error('Logout error:', error);
      }
    });
  }
};

// Initialize auth functionality
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  setupLogout();
}); 