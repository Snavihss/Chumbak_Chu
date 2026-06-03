// Navigation Bar Component

/**
 * Creates the top nav bar with back button and title
 * @param {Object} opts
 * @param {string} opts.title
 * @param {() => void} opts.onBack
 * @returns {HTMLElement}
 */
export function createNav({ title, onBack }) {
  const nav = document.createElement('div');
  nav.className = 'nav-bar';

  const backBtn = document.createElement('button');
  backBtn.className = 'back-btn';
  backBtn.innerHTML = '← Back';
  backBtn.addEventListener('click', onBack);

  const titleEl = document.createElement('span');
  titleEl.className = 'nav-title';
  titleEl.textContent = title;

  // Right spacer for centering
  const spacer = document.createElement('div');
  spacer.style.width = '80px';

  nav.appendChild(backBtn);
  nav.appendChild(titleEl);
  nav.appendChild(spacer);

  return nav;
}
