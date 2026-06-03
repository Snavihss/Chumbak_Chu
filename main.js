// Main application bootstrap — Router, Settings Modal, Toast, Confirm Dialog
import { renderHome } from './pages/home.js';
import { renderCharacters } from './pages/characters.js';
import { renderScenes } from './pages/scenes.js';
import { getConfig, saveConfig, isConfigured } from './lib/supabase.js';

const app = document.getElementById('app');

// ─── Router ──────────────────────────────────────────────
let currentPage = 'home';

export function navigate(page) {
  currentPage = page;
  window.location.hash = page;
  renderPage();
}

function renderPage() {
  switch (currentPage) {
    case 'characters':
      renderCharacters(app);
      break;
    case 'scenes':
      renderScenes(app);
      break;
    case 'home':
    default:
      renderHome(app);
      break;
  }
}

// Handle back/forward buttons
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '') || 'home';
  if (hash !== currentPage) {
    currentPage = hash;
    renderPage();
  }
});

// ─── Settings Modal ──────────────────────────────────────
const settingsBtn = document.getElementById('settings-btn');

function openSettings() {
  const config = getConfig();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'settings-modal';

  const modal = document.createElement('div');
  modal.className = 'modal';

  modal.innerHTML = `
    <div class="modal-title">⚙️ Supabase Configuration</div>
    <div class="modal-text">Connect your Supabase project to enable data persistence.</div>
    <div class="settings-form">
      <div>
        <label class="settings-label">Project URL</label>
        <input type="text" class="settings-input" id="settings-url" 
               placeholder="https://your-project.supabase.co" 
               value="${config.url}">
      </div>
      <div>
        <label class="settings-label">Anon / Public Key</label>
        <input type="text" class="settings-input" id="settings-key" 
               placeholder="eyJhbGciOiJIUzI1NiIs..." 
               value="${config.key}">
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-cancel" id="settings-cancel">Cancel</button>
      <button class="btn-add" id="settings-save">Save & Connect</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSettings();
  });

  document.getElementById('settings-cancel').addEventListener('click', closeSettings);
  document.getElementById('settings-save').addEventListener('click', () => {
    const url = document.getElementById('settings-url').value;
    const key = document.getElementById('settings-key').value;
    saveConfig(url, key);
    closeSettings();
    showToast('Supabase connected! ✓');
    // Re-render current page to load data
    renderPage();
  });
}

function closeSettings() {
  const modal = document.getElementById('settings-modal');
  if (modal) modal.remove();
}

settingsBtn.addEventListener('click', openSettings);

// ─── Toast Notification ──────────────────────────────────
let toastTimeout = null;

export function showToast(message) {
  // Remove existing
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  clearTimeout(toastTimeout);

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  toastTimeout = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ─── Confirm Dialog ──────────────────────────────────────
export function showConfirm(title, message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-title">${title}</div>
      <div class="modal-text">${message}</div>
      <div class="modal-actions">
        <button class="btn-cancel" id="confirm-cancel">Cancel</button>
        <button class="btn-confirm-delete" id="confirm-yes">Delete</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) { overlay.remove(); resolve(false); }
    });

    modal.querySelector('#confirm-cancel').addEventListener('click', () => {
      overlay.remove(); resolve(false);
    });
    modal.querySelector('#confirm-yes').addEventListener('click', () => {
      overlay.remove(); resolve(true);
    });
  });
}

// ─── Initial render ──────────────────────────────────────
function init() {
  const hash = window.location.hash.replace('#', '') || 'home';
  currentPage = hash;

  // Show setup prompt if not configured
  if (!isConfigured()) {
    renderPage();
    setTimeout(() => {
      showToast('Click ⚙️ to configure Supabase');
    }, 1000);
  } else {
    renderPage();
  }
}

init();
