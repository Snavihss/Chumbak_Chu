// Character References Page
// One character per page, paginated, with name, characteristics, personality images, costume images

import { fetchCharacters, createCharacter, updateCharacter, deleteCharacter as apiDeleteCharacter } from '../lib/supabase.js';
import { createCollage } from '../components/imageCollage.js';
import { createTagInput } from '../components/tagInput.js';
import { createNav } from '../components/nav.js';
import { navigate, showToast, showConfirm } from '../main.js';

let characters = [];
let currentIndex = 0;
let saveTimeout = null;

export async function renderCharacters(container) {
  container.innerHTML = '';
  const page = document.createElement('div');
  page.className = 'page';

  // Nav
  const nav = createNav({ title: 'Character References', onBack: () => navigate('home') });
  page.appendChild(nav);

  // Loading
  const loader = document.createElement('div');
  loader.className = 'empty-state';
  loader.innerHTML = '<div class="empty-state-icon">⏳</div><div class="empty-state-text">Loading characters...</div>';
  page.appendChild(loader);
  container.appendChild(page);

  // Fetch data
  characters = await fetchCharacters();
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
  contentArea.id = 'character-content';
  layout.appendChild(contentArea);

  renderSidebar(sidebar, contentArea);
  renderCurrentCharacter(contentArea, sidebar);
}

function renderSidebar(sidebar, contentArea) {
  sidebar.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'sidebar-header';

  const title = document.createElement('span');
  title.className = 'sidebar-title';
  title.textContent = 'Characters';

  const addBtn = document.createElement('button');
  addBtn.className = 'sidebar-add-btn';
  addBtn.textContent = '+';
  addBtn.title = 'Add New Character';
  addBtn.addEventListener('click', () => handleAddCharacter(contentArea, sidebar));

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

  if (characters.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'sidebar-empty';
    empty.textContent = 'No characters';
    list.appendChild(empty);
  } else {
    characters.forEach((char, idx) => {
      const item = document.createElement('div');
      item.className = `sidebar-item ${idx === currentIndex ? 'active' : ''}`;
      item.dataset.index = idx;
      
      const icon = document.createElement('span');
      icon.className = 'sidebar-item-icon';
      icon.textContent = '🎭';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'sidebar-item-name';
      nameSpan.textContent = char.name || 'Unnamed Character';

      const indexSpan = document.createElement('span');
      indexSpan.className = 'sidebar-item-index';
      indexSpan.textContent = idx + 1;

      item.appendChild(icon);
      item.appendChild(nameSpan);
      item.appendChild(indexSpan);

      item.addEventListener('click', () => {
        currentIndex = idx;
        renderSidebar(sidebar, contentArea);
        renderCurrentCharacter(contentArea, sidebar);
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

function renderCurrentCharacter(contentArea, sidebar) {
  contentArea.innerHTML = '';

  if (characters.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
      <div class="empty-state-icon">🎭</div>
      <div class="empty-state-text">No characters yet</div>
    `;
    contentArea.appendChild(empty);

    const actions = document.createElement('div');
    actions.className = 'actions-bar';
    const addBtn = document.createElement('button');
    addBtn.className = 'btn-add';
    addBtn.textContent = '+ New Character';
    addBtn.addEventListener('click', () => handleAddCharacter(contentArea, sidebar));
    actions.appendChild(addBtn);
    contentArea.appendChild(actions);
    return;
  }

  // Ensure valid index
  if (currentIndex >= characters.length) currentIndex = characters.length - 1;
  if (currentIndex < 0) currentIndex = 0;

  const char = characters[currentIndex];

  // ─── Pagination ─────────────────────────────────────
  const pagination = document.createElement('div');
  pagination.className = 'pagination';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'page-btn';
  prevBtn.textContent = '‹ Prev';
  prevBtn.disabled = currentIndex === 0;
  prevBtn.addEventListener('click', () => { currentIndex--; renderSidebar(sidebar, contentArea); renderCurrentCharacter(contentArea, sidebar); });

  const pageInfo = document.createElement('div');
  pageInfo.className = 'page-dots';
  characters.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = `page-dot ${i === currentIndex ? 'active' : ''}`;
    dot.title = characters[i].name || `Character ${i + 1}`;
    dot.addEventListener('click', () => { currentIndex = i; renderSidebar(sidebar, contentArea); renderCurrentCharacter(contentArea, sidebar); });
    pageInfo.appendChild(dot);
  });

  const nextBtn = document.createElement('button');
  nextBtn.className = 'page-btn';
  nextBtn.textContent = 'Next ›';
  nextBtn.disabled = currentIndex === characters.length - 1;
  nextBtn.addEventListener('click', () => { currentIndex++; renderSidebar(sidebar, contentArea); renderCurrentCharacter(contentArea, sidebar); });

  const pageLabel = document.createElement('span');
  pageLabel.className = 'page-label';
  pageLabel.textContent = `${currentIndex + 1} / ${characters.length}`;

  pagination.appendChild(prevBtn);
  pagination.appendChild(pageInfo);
  pagination.appendChild(pageLabel);
  pagination.appendChild(nextBtn);
  contentArea.appendChild(pagination);

  // ─── Character Name ─────────────────────────────────
  const nameSection = document.createElement('div');
  nameSection.className = 'section-card';
  const nameTitle = document.createElement('div');
  nameTitle.className = 'section-title';
  nameTitle.textContent = 'Character Name';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'name-input';
  nameInput.placeholder = 'Enter character name...';
  nameInput.value = char.name || '';
  nameInput.id = 'character-name-input';
  nameInput.addEventListener('input', () => {
    char.name = nameInput.value;
    const nameSpan = sidebar.querySelector(`.sidebar-item[data-index="${currentIndex}"] .sidebar-item-name`);
    if (nameSpan) {
      nameSpan.textContent = nameInput.value || 'Unnamed Character';
    }
    autoSave(char);
  });
  nameSection.appendChild(nameTitle);
  nameSection.appendChild(nameInput);
  contentArea.appendChild(nameSection);

  // ─── Characteristics ────────────────────────────────
  const charSection = document.createElement('div');
  charSection.className = 'section-card';
  const charTitle = document.createElement('div');
  charTitle.className = 'section-title';
  charTitle.textContent = 'Characteristics';
  const tagInput = createTagInput({
    tags: char.characteristics || [],
    placeholder: 'Add keyword and press Enter...',
    onChange: (tags) => {
      char.characteristics = tags;
      autoSave(char);
    }
  });
  charSection.appendChild(charTitle);
  charSection.appendChild(tagInput);
  contentArea.appendChild(charSection);

  // ─── Personality Visual References ──────────────────
  const personalitySection = document.createElement('div');
  personalitySection.className = 'section-card';
  const personalityTitle = document.createElement('div');
  personalityTitle.className = 'section-title';
  personalityTitle.textContent = 'Personality — Visual References';
  const personalityCollage = createCollage({
    images: char.personality_images || [],
    folder: `characters/${char.id}/personality`,
    onChange: (urls) => {
      char.personality_images = urls;
      autoSave(char);
    }
  });
  personalitySection.appendChild(personalityTitle);
  personalitySection.appendChild(personalityCollage);
  contentArea.appendChild(personalitySection);

  // ─── Costume Visual References ──────────────────────
  const costumeSection = document.createElement('div');
  costumeSection.className = 'section-card';
  const costumeTitle = document.createElement('div');
  costumeTitle.className = 'section-title';
  costumeTitle.textContent = 'Costume — Visual References';
  const costumeCollage = createCollage({
    images: char.costume_images || [],
    folder: `characters/${char.id}/costume`,
    onChange: (urls) => {
      char.costume_images = urls;
      autoSave(char);
    }
  });
  costumeSection.appendChild(costumeTitle);
  costumeSection.appendChild(costumeCollage);
  contentArea.appendChild(costumeSection);

  // ─── Action Buttons ─────────────────────────────────
  const actions = document.createElement('div');
  actions.className = 'actions-bar';

  const addBtn = document.createElement('button');
  addBtn.className = 'btn-add';
  addBtn.textContent = '+ New Character';
  addBtn.addEventListener('click', () => handleAddCharacter(contentArea, sidebar));

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-delete';
  deleteBtn.textContent = '🗑 Delete Character';
  deleteBtn.addEventListener('click', () => handleDeleteCharacter(contentArea, sidebar, char));

  actions.appendChild(addBtn);
  actions.appendChild(deleteBtn);
  contentArea.appendChild(actions);
}

async function handleAddCharacter(contentArea, sidebar) {
  showToast('Creating character...');
  const newChar = await createCharacter();
  if (newChar) {
    characters.push(newChar);
    currentIndex = characters.length - 1;
    renderSidebar(sidebar, contentArea);
    renderCurrentCharacter(contentArea, sidebar);
    showToast('Character created!');
  } else {
    showToast('Failed — check Supabase config');
  }
}

async function handleDeleteCharacter(contentArea, sidebar, char) {
  const confirmed = await showConfirm(
    'Delete Character',
    `Are you sure you want to delete "${char.name || 'Unnamed'}"? This action cannot be undone.`
  );
  if (!confirmed) return;
  showToast('Deleting...');
  await apiDeleteCharacter(char.id);
  characters = characters.filter(c => c.id !== char.id);
  if (currentIndex >= characters.length) currentIndex = Math.max(0, characters.length - 1);
  renderSidebar(sidebar, contentArea);
  renderCurrentCharacter(contentArea, sidebar);
  showToast('Character deleted');
}

function autoSave(char) {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    await updateCharacter(char.id, {
      name: char.name,
      characteristics: char.characteristics,
      personality_images: char.personality_images,
      costume_images: char.costume_images,
    });
  }, 800);
}
