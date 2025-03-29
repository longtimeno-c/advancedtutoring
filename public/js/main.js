// Main JavaScript file for client-side functionality

document.addEventListener('DOMContentLoaded', () => {
  // Initialize tooltips if Bootstrap is used
  if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
  
  // Handle mobile navigation toggle
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
      const navbarMenu = document.querySelector('.navbar-menu');
      navbarMenu.classList.toggle('active');
    });
  }
  
  // Handle message notification badge update
  updateUnreadMessageCount();
  
  // Set up polling for unread messages (every 30 seconds)
  setInterval(updateUnreadMessageCount, 30000);
});

// Update unread message count for authenticated users
async function updateUnreadMessageCount() {
  const { isAuthenticated } = checkAuth();
  
  if (!isAuthenticated) return;
  
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch('/api/messages/unread', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch unread messages');
    }
    
    const data = await response.json();
    const unreadCount = data.total;
    
    // Update message badge if it exists
    const messageBadge = document.querySelector('.message-badge');
    if (messageBadge) {
      if (unreadCount > 0) {
        messageBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        messageBadge.style.display = 'inline-block';
      } else {
        messageBadge.style.display = 'none';
      }
    }
    
    // Update page title if on message page
    if (window.location.pathname.includes('/messages')) {
      document.title = unreadCount > 0 ? `(${unreadCount}) Messages` : 'Messages';
    }
    
  } catch (error) {
    console.error('Error updating unread message count:', error);
  }
}

// Format date as relative time (e.g., "2 hours ago")
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}

// Add alert method for showing notifications
function showAlert(message, type = 'info', duration = 3000) {
  // Create alert element
  const alertEl = document.createElement('div');
  alertEl.className = `alert alert-${type}`;
  alertEl.textContent = message;
  
  // Add to the DOM
  const alertContainer = document.querySelector('.alert-container') || createAlertContainer();
  alertContainer.appendChild(alertEl);
  
  // Auto remove after duration
  setTimeout(() => {
    alertEl.classList.add('fade-out');
    setTimeout(() => alertEl.remove(), 300);
  }, duration);
}

// Create alert container if it doesn't exist
function createAlertContainer() {
  const alertContainer = document.createElement('div');
  alertContainer.className = 'alert-container';
  document.body.appendChild(alertContainer);
  return alertContainer;
}

// Validate form inputs
function validateForm(form) {
  let isValid = true;
  
  form.querySelectorAll('input, textarea, select').forEach(input => {
    if (input.hasAttribute('required') && !input.value.trim()) {
      input.classList.add('is-invalid');
      isValid = false;
    } else {
      input.classList.remove('is-invalid');
    }
    
    // Email validation
    if (input.type === 'email' && input.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.value.trim())) {
        input.classList.add('is-invalid');
        isValid = false;
      }
    }
    
    // Password validation
    if (input.type === 'password' && input.dataset.minLength) {
      const minLength = parseInt(input.dataset.minLength);
      if (input.value.length < minLength) {
        input.classList.add('is-invalid');
        isValid = false;
      }
    }
  });
  
  return isValid;
} 