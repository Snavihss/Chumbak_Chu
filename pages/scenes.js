// Scene References Page
// One scene per page, paginated, with name, visual references, lighting tags + lighting images

import { fetchScenes, createScene, updateScene, deleteScene as apiDeleteScene } from '../lib/supabase.js';
import { createCollage } from '../components/imageCollage.js';
import { createTagInput } from '../components/tagInput.js';
import { createNav } from '../components/nav.js';
import { navigate, showToast, showConfirm } from '../main.js';

let scenes = [];
let currentIndex = 0;
let saveTimeout = null;

export async function renderScenes(container) {
  container.innerHTML = '';
  const page = document.createElement('div');
  page.className = 'page';

  // Nav
  const nav = createNav({ title: 'Scene References', onBack: () => navigate('home') });
  page.appendChild(nav);

  // Loading
  const loader = document.createElement('div');
  loader.className = 'empty-state';
  loader.innerHTML = '<div class="empty-state-icon">⏳</div><div class="empty-state-text">Loading scenes...</div>';
  page.appendChild(loader);
  container.appendChild(page);

  // Fetch data
  scenes = await fetchScenes();
  loader.remove();

  // Create layout container
  const layout = document.createElement('div');
  layout.className = 'layout-with-sidebar';
  page.appendChild(layout);

  // Create sidebar
  const sidebar = document.createElement('div');
  sidebar.className = 'sidebar';
  layout.appendChild(sidebar);

  // Create main content
  const contentArea = document.createElement('div');
  contentArea.className = 'main-content';
  contentArea.id = 'scene-content';
  layout.appendChild(contentArea);

  renderSidebar(sidebar, contentArea);
  renderCurrentScene(contentArea, sidebar);
}

function renderSidebar(sidebar, contentArea) {
  sidebar.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'sidebar-header';

  const title = document.createElement('span');
  title.className = 'sidebar-title';
  title.textContent = 'Scenes';

  const addBtn = document.createElement('button');
  addBtn.className = 'sidebar-add-btn';
  addBtn.textContent = '+';
  addBtn.title = 'Add New Scene';
  addBtn.addEventListener('click', () => handleAddScene(contentArea, sidebar));

  header.appendChild(title);
  header.appendChild(addBtn);
  sidebar.appendChild(header);

  // Search input
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'tag-input';
  searchInput.placeholder = 'Search...';
  searchInput.style.margin = '0.5rem 1rem';
  searchInput.style.padding = '0.4rem 0.8rem';
  searchInput.style.fontSize = '0.85rem';
  searchInput.value = sidebar.currentSearchQuery || '';
  searchInput.addEventListener('input', () => {
    sidebar.currentSearchQuery = searchInput.value.toLowerCase();
    filterList();
  });
  sidebar.appendChild(searchInput);

  const list = document.createElement('div');
  list.className = 'sidebar-list';

  if (scenes.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'sidebar-empty';
    empty.textContent = 'No scenes';
    list.appendChild(empty);
  } else {
    scenes.forEach((scene, idx) => {
      const item = document.createElement('div');
      item.className = `sidebar-item ${idx === currentIndex ? 'active' : ''}`;
      item.dataset.index = idx;
      
      const icon = document.createElement('span');
      icon.className = 'sidebar-item-icon';
      icon.textContent = '🎬';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'sidebar-item-name';
      nameSpan.textContent = scene.name || 'Unnamed Scene';

      const indexSpan = document.createElement('span');
      indexSpan.className = 'sidebar-item-index';
      indexSpan.textContent = idx + 1;

      item.appendChild(icon);
      item.appendChild(nameSpan);
      item.appendChild(indexSpan);

      item.addEventListener('click', () => {
        currentIndex = idx;
        renderSidebar(sidebar, contentArea);
        renderCurrentScene(contentArea, sidebar);
      });

      list.appendChild(item);
    });
  }

  sidebar.appendChild(list);

  const filterList = () => {
    const query = sidebar.currentSearchQuery || '';
    const items = list.querySelectorAll('.sidebar-item');
    items.forEach(item => {
      const name = item.querySelector('.sidebar-item-name').textContent.toLowerCase();
      if (name.includes(query)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  };

  // Run filter initially in case of redraw
  filterList();
}

function renderCurrentScene(contentArea, sidebar) {
  contentArea.innerHTML = '';

  if (scenes.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
      <div class="empty-state-icon">🎬</div>
      <div class="empty-state-text">No scenes yet</div>
    `;
    contentArea.appendChild(empty);

    const actions = document.createElement('div');
    actions.className = 'actions-bar';
    const addBtn = document.createElement('button');
    addBtn.className = 'btn-add';
    addBtn.textContent = '+ New Scene';
    addBtn.addEventListener('click', () => handleAddScene(contentArea, sidebar));
    actions.appendChild(addBtn);
    contentArea.appendChild(actions);
    return;
  }

  // Ensure valid index
  if (currentIndex >= scenes.length) currentIndex = scenes.length - 1;
  if (currentIndex < 0) currentIndex = 0;

  const scene = scenes[currentIndex];

  // ─── Pagination ─────────────────────────────────────
  const pagination = document.createElement('div');
  pagination.className = 'pagination';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'page-btn';
  prevBtn.textContent = '‹ Prev';
  prevBtn.disabled = currentIndex === 0;
  prevBtn.addEventListener('click', () => { currentIndex--; renderSidebar(sidebar, contentArea); renderCurrentScene(contentArea, sidebar); });

  const pageInfo = document.createElement('div');
  pageInfo.className = 'page-dots';
  scenes.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = `page-dot ${i === currentIndex ? 'active' : ''}`;
    dot.title = scenes[i].name || `Scene ${i + 1}`;
    dot.addEventListener('click', () => { currentIndex = i; renderSidebar(sidebar, contentArea); renderCurrentScene(contentArea, sidebar); });
    pageInfo.appendChild(dot);
  });

  const nextBtn = document.createElement('button');
  nextBtn.className = 'page-btn';
  nextBtn.textContent = 'Next ›';
  nextBtn.disabled = currentIndex === scenes.length - 1;
  nextBtn.addEventListener('click', () => { currentIndex++; renderSidebar(sidebar, contentArea); renderCurrentScene(contentArea, sidebar); });

  const pageLabel = document.createElement('span');
  pageLabel.className = 'page-label';
  pageLabel.textContent = `${currentIndex + 1} / ${scenes.length}`;

  pagination.appendChild(prevBtn);
  pagination.appendChild(pageInfo);
  pagination.appendChild(pageLabel);
  pagination.appendChild(nextBtn);
  contentArea.appendChild(pagination);

  // ─── Scene Name ─────────────────────────────────────
  const nameSection = document.createElement('div');
  nameSection.className = 'section-card';
  const nameTitle = document.createElement('div');
  nameTitle.className = 'section-title';
  nameTitle.textContent = 'Scene Name';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'name-input';
  nameInput.placeholder = 'Enter scene name...';
  nameInput.value = scene.name || '';
  nameInput.id = 'scene-name-input';
  nameInput.addEventListener('input', () => {
    scene.name = nameInput.value;
    const nameSpan = sidebar.querySelector(`.sidebar-item[data-index="${currentIndex}"] .sidebar-item-name`);
    if (nameSpan) {
      nameSpan.textContent = nameInput.value || 'Unnamed Scene';
    }
    autoSave(scene);
  });
  nameSection.appendChild(nameTitle);
  nameSection.appendChild(nameInput);
  contentArea.appendChild(nameSection);

  // ─── Description ────────────────────────────────────
  const descSection = document.createElement('div');
  descSection.className = 'section-card';
  const descTitle = document.createElement('div');
  descTitle.className = 'section-title';
  descTitle.textContent = 'Description';
  const descInput = document.createElement('textarea');
  descInput.className = 'tag-input';
  descInput.style.width = '100%';
  descInput.style.minHeight = '80px';
  descInput.style.background = 'rgba(255, 255, 255, 0.02)';
  descInput.style.border = '1px solid var(--border)';
  descInput.style.borderRadius = 'var(--radius-input)';
  descInput.style.color = 'var(--text-primary)';
  descInput.style.padding = '0.75rem 1rem';
  descInput.style.fontSize = '0.95rem';
  descInput.style.outline = 'none';
  descInput.style.resize = 'vertical';
  descInput.style.fontFamily = 'var(--font)';
  descInput.style.transition = 'border-color 0.3s ease';
  descInput.addEventListener('focus', () => descInput.style.borderColor = 'var(--primary)');
  descInput.addEventListener('blur', () => descInput.style.borderColor = 'var(--border)');
  descInput.placeholder = 'Enter scene description...';
  descInput.value = scene.description || '';
  descInput.addEventListener('input', () => {
    scene.description = descInput.value;
    autoSave(scene);
  });
  descSection.appendChild(descTitle);
  descSection.appendChild(descInput);
  contentArea.appendChild(descSection);

  // ─── Visual References ──────────────────────────────
  const visualSection = document.createElement('div');
  visualSection.className = 'section-card';
  const visualTitle = document.createElement('div');
  visualTitle.className = 'section-title';
  visualTitle.textContent = 'Visual References';
  const visualCollage = createCollage({
    images: scene.visual_images || [],
    folder: `scenes/${scene.id}/visual`,
    onChange: (urls) => {
      scene.visual_images = urls;
      autoSave(scene);
    }
  });
  visualSection.appendChild(visualTitle);
  visualSection.appendChild(visualCollage);
  contentArea.appendChild(visualSection);

  // ─── Lighting Tags ─────────────────────────────────
  const lightingTagSection = document.createElement('div');
  lightingTagSection.className = 'section-card';
  const lightingTagTitle = document.createElement('div');
  lightingTagTitle.className = 'section-title';
  lightingTagTitle.textContent = 'Lighting — Keywords';
  const lightingTagInput = createTagInput({
    tags: scene.lighting_tags || [],
    placeholder: 'e.g. warm, golden hour, high contrast...',
    onChange: (tags) => {
      scene.lighting_tags = tags;
      autoSave(scene);
    }
  });
  lightingTagSection.appendChild(lightingTagTitle);
  lightingTagSection.appendChild(lightingTagInput);
  contentArea.appendChild(lightingTagSection);

  // ─── Lighting Visual References ─────────────────────
  const lightingImgSection = document.createElement('div');
  lightingImgSection.className = 'section-card';
  const lightingImgTitle = document.createElement('div');
  lightingImgTitle.className = 'section-title';
  lightingImgTitle.textContent = 'Lighting — Visual References';
  const lightingCollage = createCollage({
    images: scene.lighting_images || [],
    folder: `scenes/${scene.id}/lighting`,
    onChange: (urls) => {
      scene.lighting_images = urls;
      autoSave(scene);
    }
  });
  lightingImgSection.appendChild(lightingImgTitle);
  lightingImgSection.appendChild(lightingCollage);
  contentArea.appendChild(lightingImgSection);

  // ─── Action Buttons ─────────────────────────────────
  const actions = document.createElement('div');
  actions.className = 'actions-bar';

  const addBtn = document.createElement('button');
  addBtn.className = 'btn-add';
  addBtn.textContent = '+ New Scene';
  addBtn.addEventListener('click', () => handleAddScene(contentArea, sidebar));

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-delete';
  deleteBtn.textContent = '🗑 Delete Scene';
  deleteBtn.addEventListener('click', () => handleDeleteScene(contentArea, sidebar, scene));

  actions.appendChild(addBtn);
  actions.appendChild(deleteBtn);
  contentArea.appendChild(actions);
}

async function handleAddScene(contentArea, sidebar) {
  showToast('Creating scene...');
  const newScene = await createScene();
  if (newScene) {
    scenes.push(newScene);
    currentIndex = scenes.length - 1;
    renderSidebar(sidebar, contentArea);
    renderCurrentScene(contentArea, sidebar);
    showToast('Scene created!');
  } else {
    showToast('Failed — check Supabase config');
  }
}

async function handleDeleteScene(contentArea, sidebar, scene) {
  const confirmed = await showConfirm(
    'Delete Scene',
    `Are you sure you want to delete "${scene.name || 'Unnamed'}"? This action cannot be undone.`
  );
  if (!confirmed) return;
  showToast('Deleting...');
  await apiDeleteScene(scene.id);
  scenes = scenes.filter(s => s.id !== scene.id);
  if (currentIndex >= scenes.length) currentIndex = Math.max(0, scenes.length - 1);
  renderSidebar(sidebar, contentArea);
  renderCurrentScene(contentArea, sidebar);
  showToast('Scene deleted');
}

function autoSave(scene) {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    await updateScene(scene.id, {
      name: scene.name,
      description: scene.description,
      visual_images: scene.visual_images,
      lighting_tags: scene.lighting_tags,
      lighting_images: scene.lighting_images,
    });
  }, 800);
}
