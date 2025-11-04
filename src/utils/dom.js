/**
 * DOM Utility Functions
 * High-performance DOM manipulation and element creation
 */

/**
 * Create DOM element with attributes and children
 * @param {string} tagName - Tag name
 * @param {Object} attributes - Element attributes
 * @param {string|Node|Array} children - Child elements or text content
 * @returns {HTMLElement} Created element
 */
export function createElement(tagName, attributes = {}, children = null) {
  const element = document.createElement(tagName);

  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('data-') || key.startsWith('aria-')) {
      element.setAttribute(key, value);
    } else if (key in element) {
      element[key] = value;
    } else {
      element.setAttribute(key, value);
    }
  });

  // Add children
  if (children !== null) {
    if (typeof children === 'string') {
      element.textContent = children;
    } else if (children instanceof Node) {
      element.appendChild(children);
    } else if (Array.isArray(children)) {
      children.forEach(child => {
        if (typeof child === 'string') {
          element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
          element.appendChild(child);
        }
      });
    }
  }

  return element;
}

/**
 * Find element by selector with error handling
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element (default: document)
 * @returns {HTMLElement|null} Found element or null
 */
export function findElement(selector, parent = document) {
  try {
    return parent.querySelector(selector);
  } catch (error) {
    console.error('Invalid selector:', selector, error);
    return null;
  }
}

/**
 * Find all elements by selector
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element (default: document)
 * @returns {NodeList} Found elements
 */
export function findElements(selector, parent = document) {
  try {
    return parent.querySelectorAll(selector);
  } catch (error) {
    console.error('Invalid selector:', selector, error);
    return [];
  }
}

/**
 * Add event listener with automatic cleanup
 * @param {HTMLElement} element - Target element
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object} options - Event options
 * @returns {Function} Cleanup function
 */
export function addEventListener(element, event, handler, options = {}) {
  element.addEventListener(event, handler, options);

  return () => {
    element.removeEventListener(event, handler, options);
  };
}

/**
 * Add multiple event listeners
 * @param {HTMLElement} element - Target element
 * @param {Object} events - Event map {event: handler}
 * @param {Object} options - Event options
 * @returns {Function} Cleanup function for all listeners
 */
export function addEventListeners(element, events, options = {}) {
  const cleanups = [];

  Object.entries(events).forEach(([event, handler]) => {
    const cleanup = addEventListener(element, event, handler, options);
    cleanups.push(cleanup);
  });

  return () => {
    cleanups.forEach(cleanup => cleanup());
  };
}

/**
 * Remove element from DOM safely
 * @param {HTMLElement} element - Element to remove
 */
export function removeElement(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/**
 * Empty element content efficiently
 * @param {HTMLElement} element - Element to empty
 */
export function emptyElement(element) {
  if (element) {
    // Faster than innerHTML = '' for large elements
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }
}

/**
 * Check if element is visible in viewport
 * @param {HTMLElement} element - Element to check
 * @param {number} threshold - Visibility threshold (0-1)
 * @returns {boolean} True if element is visible
 */
export function isElementVisible(element, threshold = 0) {
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  const verticalVisible = (rect.top <= windowHeight * threshold) &&
                          (rect.bottom >= windowHeight * (1 - threshold));
  const horizontalVisible = (rect.left <= windowWidth * threshold) &&
                            (rect.right >= windowWidth * (1 - threshold));

  return verticalVisible && horizontalVisible;
}

/**
 * Check if element intersects with another element
 * @param {HTMLElement} elem1 - First element
 * @param {HTMLElement} elem2 - Second element
 * @returns {boolean} True if elements intersect
 */
export function elementsIntersect(elem1, elem2) {
  const rect1 = elem1.getBoundingClientRect();
  const rect2 = elem2.getBoundingClientRect();

  return !(rect1.right < rect2.left ||
           rect1.left > rect2.right ||
           rect1.bottom < rect2.top ||
           rect1.top > rect2.bottom);
}

/**
 * Get element's computed style
 * @param {HTMLElement} element - Target element
 * @param {string} property - CSS property
 * @returns {string} Computed style value
 */
export function getComputedStyle(element, property) {
  if (!element) return '';

  const styles = window.getComputedStyle(element);
  return styles.getPropertyValue(property) || styles[property];
}

/**
 * Set CSS custom properties on element
 * @param {HTMLElement} element - Target element
 * @param {Object} properties - CSS properties object
 */
export function setCSSProperties(element, properties) {
  if (!element || !properties) return;

  Object.entries(properties).forEach(([property, value]) => {
    element.style.setProperty(property, value);
  });
}

/**
 * Add CSS class to element
 * @param {HTMLElement} element - Target element
 * @param {string|Array} classes - Class name(s) to add
 */
export function addClass(element, classes) {
  if (!element) return;

  const classArray = Array.isArray(classes) ? classes : [classes];
  element.classList.add(...classArray);
}

/**
 * Remove CSS class from element
 * @param {HTMLElement} element - Target element
 * @param {string|Array} classes - Class name(s) to remove
 */
export function removeClass(element, classes) {
  if (!element) return;

  const classArray = Array.isArray(classes) ? classes : [classes];
  element.classList.remove(...classArray);
}

/**
 * Toggle CSS class on element
 * @param {HTMLElement} element - Target element
 * @param {string} className - Class name to toggle
 * @param {boolean} force - Force add/remove (optional)
 * @returns {boolean} True if class is present after toggle
 */
export function toggleClass(element, className, force) {
  if (!element) return false;

  return element.classList.toggle(className, force);
}

/**
 * Check if element has CSS class
 * @param {HTMLElement} element - Target element
 * @param {string} className - Class name to check
 * @returns {boolean} True if element has class
 */
export function hasClass(element, className) {
  if (!element) return false;

  return element.classList.contains(className);
}

/**
 * Find closest ancestor by selector
 * @param {HTMLElement} element - Starting element
 * @param {string} selector - CSS selector
 * @returns {HTMLElement|null} Closest matching ancestor
 */
export function closest(element, selector) {
  if (!element) return null;

  try {
    return element.closest(selector);
  } catch (error) {
    console.error('Invalid selector:', selector, error);
    return null;
  }
}

/**
 * Get element's offset relative to document
 * @param {HTMLElement} element - Target element
 * @returns {Object} Offset object {top, left}
 */
export function getOffset(element) {
  if (!element) return { top: 0, left: 0 };

  const rect = element.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

  return {
    top: rect.top + scrollTop,
    left: rect.left + scrollLeft
  };
}

/**
 * Get element's dimensions
 * @param {HTMLElement} element - Target element
 * @returns {Object} Dimensions object {width, height}
 */
export function getDimensions(element) {
  if (!element) return { width: 0, height: 0 };

  return {
    width: element.offsetWidth,
    height: element.offsetHeight
  };
}

/**
 * Animate element with CSS transitions
 * @param {HTMLElement} element - Element to animate
 * @param {Object} properties - CSS properties to animate
 * @param {number} duration - Animation duration in milliseconds
 * @param {string} easing - Easing function
 * @returns {Promise} Animation promise
 */
export function animate(element, properties, duration = 300, easing = 'ease-in-out') {
  return new Promise((resolve) => {
    if (!element) {
      resolve();
      return;
    }

    // Store original transition
    const originalTransition = element.style.transition;

    // Set new transition and properties
    element.style.transition = `all ${duration}ms ${easing}`;
    Object.assign(element.style, properties);

    // Listen for transition end
    const handleTransitionEnd = () => {
      element.style.transition = originalTransition;
      element.removeEventListener('transitionend', handleTransitionEnd);
      resolve();
    };

    element.addEventListener('transitionend', handleTransitionEnd);

    // Fallback for browsers without transition support
    setTimeout(() => {
      element.removeEventListener('transitionend', handleTransitionEnd);
      resolve();
    }, duration + 50);
  });
}

/**
 * Fade in element
 * @param {HTMLElement} element - Element to fade in
 * @param {number} duration - Fade duration in milliseconds
 * @returns {Promise} Animation promise
 */
export function fadeIn(element, duration = 300) {
  if (!element) return Promise.resolve();

  element.style.opacity = '0';
  element.style.display = '';

  return animate(element, { opacity: '1' }, duration);
}

/**
 * Fade out element
 * @param {HTMLElement} element - Element to fade out
 * @param {number} duration - Fade duration in milliseconds
 * @returns {Promise} Animation promise
 */
export function fadeOut(element, duration = 300) {
  if (!element) return Promise.resolve();

  return animate(element, { opacity: '0' }, duration).then(() => {
    element.style.display = 'none';
  });
}

/**
 * Slide element up (hide)
 * @param {HTMLElement} element - Element to slide up
 * @param {number} duration - Slide duration in milliseconds
 * @returns {Promise} Animation promise
 */
export function slideUp(element, duration = 300) {
  if (!element) return Promise.resolve();

  const height = element.scrollHeight;
  element.style.height = height + 'px';
  element.style.overflow = 'hidden';

  return animate(element, { height: '0px' }, duration).then(() => {
    element.style.display = 'none';
    element.style.height = '';
    element.style.overflow = '';
  });
}

/**
 * Slide element down (show)
 * @param {HTMLElement} element - Element to slide down
 * @param {number} duration - Slide duration in milliseconds
 * @returns {Promise} Animation promise
 */
export function slideDown(element, duration = 300) {
  if (!element) return Promise.resolve();

  element.style.height = '0px';
  element.style.overflow = 'hidden';
  element.style.display = '';

  return animate(element, { height: element.scrollHeight + 'px' }, duration).then(() => {
    element.style.height = '';
    element.style.overflow = '';
  });
}

/**
 * Debounce scroll events for performance
 * @param {Function} callback - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounceScroll(callback, delay = 16) {
  let ticking = false;

  return function() {
    if (!ticking) {
      requestAnimationFrame(() => {
        callback();
        ticking = false;
      });
      ticking = true;
    }
  };
}

/**
 * Check if element is in viewport with callback
 * @param {HTMLElement} element - Element to watch
 * @param {Function} callback - Callback function
 * @param {Object} options - Intersection options
 * @returns {IntersectionObserver|null} Intersection observer
 */
export function watchIntersection(element, callback, options = {}) {
  if (!element || !window.IntersectionObserver) {
    return null;
  }

  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '0px',
    ...options
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      callback(entry);
    });
  }, defaultOptions);

  observer.observe(element);
  return observer;
}

/**
 * Create fragment for efficient DOM manipulation
 * @returns {DocumentFragment} Empty document fragment
 */
export function createFragment() {
  return document.createDocumentFragment();
}

/**
 * Clone element with events
 * @param {HTMLElement} element - Element to clone
 * @param {boolean} deep - Deep clone
 * @returns {HTMLElement} Cloned element
 */
export function cloneElement(element, deep = true) {
  if (!element) return null;

  return element.cloneNode(deep);
}

/**
 * Get scroll position
 * @returns {Object} Scroll position {x, y}
 */
export function getScrollPosition() {
  return {
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop
  };
}

/**
 * Scroll to element smoothly
 * @param {HTMLElement} element - Target element
 * @param {Object} options - Scroll options
 */
export function scrollToElement(element, options = {}) {
  if (!element) return;

  const defaultOptions = {
    behavior: 'smooth',
    block: 'start',
    inline: 'nearest',
    offset: 0,
    ...options
  };

  const offset = getOffset(element);
  const targetY = offset.top - defaultOptions.offset;

  window.scrollTo({
    behavior: defaultOptions.behavior,
    top: targetY
  });
}

/**
 * Preload image
 * @param {string} src - Image source URL
 * @returns {Promise} Image load promise
 */
export function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Batch DOM operations for performance
 * @param {Function} operations - Function containing DOM operations
 */
export function batchDOMUpdates(operations) {
  // Use requestAnimationFrame for batching
  requestAnimationFrame(() => {
    operations();
  });
}

/**
 * Check if element is focusable
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if element is focusable
 */
export function isFocusable(element) {
  if (!element) return false;

  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');

  return element.matches(focusableSelectors);
}

/**
 * Get all focusable elements within container
 * @param {HTMLElement} container - Container element
 * @returns {Array} Array of focusable elements
 */
export function getFocusableElements(container) {
  if (!container) return [];

  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');

  return Array.from(container.querySelectorAll(focusableSelectors));
}

// Export default object with all functions
export default {
  createElement,
  findElement,
  findElements,
  addEventListener,
  addEventListeners,
  removeElement,
  emptyElement,
  isElementVisible,
  elementsIntersect,
  getComputedStyle,
  setCSSProperties,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  closest,
  getOffset,
  getDimensions,
  animate,
  fadeIn,
  fadeOut,
  slideUp,
  slideDown,
  debounceScroll,
  watchIntersection,
  createFragment,
  cloneElement,
  getScrollPosition,
  scrollToElement,
  preloadImage,
  batchDOMUpdates,
  isFocusable,
  getFocusableElements
};
