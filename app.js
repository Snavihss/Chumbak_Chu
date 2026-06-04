/* ============================================================
   CHUMBAK CHU — Complete Application
   Single-file JS (no modules) for direct file:// usage
   ============================================================ */

(function () {
  'use strict';

  // ─── Supabase Client ─────────────────────────────────────
  let supabaseClient = null;

  // Default Supabase credentials (anon key is public by design — safe to commit)
  var SUPABASE_URL = 'https://spyyuyexrqhaxfpdoxyp.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_rJ59XgDDFfs7NdEFpvG9_A_kWkziLu5';

  function getConfig() {
    return { url: SUPABASE_URL, key: SUPABASE_KEY };
  }

  function getClient() {
    if (supabaseClient) return supabaseClient;
    const { url, key } = getConfig();
    if (!url || !key) return null;
    supabaseClient = window.supabase.createClient(url, key);
    return supabaseClient;
  }

  // ─── DB: Characters ──────────────────────────────────────
  async function fetchCharacters() {
    const client = getClient();
    if (!client) return [];
    const { data, error } = await client
      .from('characters')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) { console.error('fetchCharacters:', error); return []; }
    return data || [];
  }

  async function createCharacterDB() {
    const client = getClient();
    if (!client) return null;
    const { data, error } = await client
      .from('characters')
      .insert({ name: '', description: '', characteristics: [], personality_images: [], costume_images: [] })
      .select()
      .single();
    if (error) { console.error('createCharacter:', error); return null; }
    return data;
  }

  async function updateCharacterDB(id, fields) {
    const client = getClient();
    if (!client) return;
    const { error } = await client.from('characters').update(fields).eq('id', id);
    if (error) console.error('updateCharacter:', error);
  }

  async function deleteCharacterDB(id) {
    const client = getClient();
    if (!client) return;
    const { error } = await client.from('characters').delete().eq('id', id);
    if (error) console.error('deleteCharacter:', error);
  }

  // ─── DB: Scenes ──────────────────────────────────────────
  async function fetchScenes() {
    const client = getClient();
    if (!client) return [];
    const { data, error } = await client
      .from('scenes')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) { console.error('fetchScenes:', error); return []; }
    return data || [];
  }

  async function createSceneDB() {
    const client = getClient();
    if (!client) return null;
    const { data, error } = await client
      .from('scenes')
      .insert({ name: '', description: '', visual_images: [], lighting_tags: [], lighting_images: [] })
      .select()
      .single();
    if (error) { console.error('createScene:', error); return null; }
    return data;
  }

  async function updateSceneDB(id, fields) {
    const client = getClient();
    if (!client) return;
    const { error } = await client.from('scenes').update(fields).eq('id', id);
    if (error) console.error('updateScene:', error);
  }

  async function deleteSceneDB(id) {
    const client = getClient();
    if (!client) return;
    const { error } = await client.from('scenes').delete().eq('id', id);
    if (error) console.error('deleteScene:', error);
  }

  // ─── Storage ─────────────────────────────────────────────
  async function uploadImage(file, folder) {
    const client = getClient();
    if (!client) return null;
    const ext = file.name ? file.name.split('.').pop() : 'png';
    const fileName = folder + '/' + crypto.randomUUID() + '.' + ext;
    const { data, error } = await client.storage
      .from('references')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (error) { console.error('uploadImage:', error); return null; }
    const { data: urlData } = client.storage.from('references').getPublicUrl(data.path);
    return urlData.publicUrl;
  }

  async function deleteImageFromStorage(url) {
    const client = getClient();
    if (!client) return;
    try {
      const parts = url.split('/storage/v1/object/public/references/');
      if (parts.length < 2) return;
      const path = parts[1];
      await client.storage.from('references').remove([path]);
    } catch (e) {
      console.error('deleteImage:', e);
    }
  }

  // ─── Toast ───────────────────────────────────────────────
  let toastTimeout = null;

  function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    clearTimeout(toastTimeout);

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    toastTimeout = setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
  }

  // ─── Confirm Dialog ──────────────────────────────────────
  function showConfirm(title, message) {
    return new Promise(function (resolve) {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';

      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.innerHTML =
        '<div class="modal-title">' + title + '</div>' +
        '<div class="modal-text">' + message + '</div>' +
        '<div class="modal-actions">' +
        '  <button class="btn-cancel" id="confirm-cancel">Cancel</button>' +
        '  <button class="btn-confirm-delete" id="confirm-yes">Delete</button>' +
        '</div>';

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) { overlay.remove(); resolve(false); }
      });
      modal.querySelector('#confirm-cancel').addEventListener('click', function () {
        overlay.remove(); resolve(false);
      });
      modal.querySelector('#confirm-yes').addEventListener('click', function () {
        overlay.remove(); resolve(true);
      });
    });
  }

  // ─── Tag Input Component ─────────────────────────────────
  function createTagInput(opts) {
    var tags = opts.tags ? opts.tags.slice() : [];
    var placeholder = opts.placeholder || 'Type and press Enter...';
    var onChange = opts.onChange;

    var wrapper = document.createElement('div');

    var tagsContainer = document.createElement('div');
    tagsContainer.className = 'tags-container';
    wrapper.appendChild(tagsContainer);

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'tag-input';
    input.placeholder = placeholder;
    wrapper.appendChild(input);

    function render() {
      tagsContainer.innerHTML = '';
      tags.forEach(function (tag, index) {
        var tagEl = document.createElement('span');
        tagEl.className = 'tag';

        var text = document.createElement('span');
        text.textContent = tag;

        var removeBtn = document.createElement('button');
        removeBtn.className = 'tag-remove';
        removeBtn.innerHTML = '×';
        removeBtn.title = 'Remove';
        removeBtn.addEventListener('click', function () {
          tags.splice(index, 1);
          onChange(tags.slice());
          render();
        });

        tagEl.appendChild(text);
        tagEl.appendChild(removeBtn);
        tagsContainer.appendChild(tagEl);
      });
    }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        var value = input.value.trim();
        if (value && tags.indexOf(value) === -1) {
          tags.push(value);
          onChange(tags.slice());
          input.value = '';
          render();
        }
      }
      if (e.key === 'Backspace' && input.value === '' && tags.length > 0) {
        tags.pop();
        onChange(tags.slice());
        render();
      }
    });

    wrapper.updateTags = function (newTags) {
      tags = newTags.slice();
      render();
    };

    render();
    return wrapper;
  }

  // ─── Image Collage Component ─────────────────────────────
  function createCollage(opts) {
    var currentImages = opts.images ? opts.images.slice() : [];
    var folder = opts.folder || 'misc';
    var onChange = opts.onChange;

    var container = document.createElement('div');
    container.className = 'collage-box';

    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;
    fileInput.className = 'collage-input';
    container.appendChild(fileInput);

    function render() {
      Array.from(container.children).forEach(function (child) {
        if (child !== fileInput) child.remove();
      });

      if (currentImages.length === 0) {
        var placeholder = document.createElement('div');
        placeholder.className = 'collage-placeholder';
        placeholder.innerHTML =
          '<span class="collage-placeholder-icon">🖼️</span>' +
          '<span>Drop images here, paste from clipboard, or click to browse</span>';
        placeholder.addEventListener('click', function () { fileInput.click(); });
        container.appendChild(placeholder);
      } else {
        currentImages.forEach(function (url, index) {
          var item = document.createElement('div');
          item.className = 'collage-item';

          var img = document.createElement('img');
          img.src = url;
          img.alt = 'Reference ' + (index + 1);
          img.loading = 'lazy';
          img.style.cursor = 'zoom-in';
          img.addEventListener('click', function () { showLightbox(url); });

          var removeBtn = document.createElement('button');
          removeBtn.className = 'collage-item-remove';
          removeBtn.innerHTML = '×';
          removeBtn.title = 'Remove image';
          removeBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            item.style.transform = 'scale(0)';
            item.style.opacity = '0';
            setTimeout(async function () {
              await deleteImageFromStorage(url);
              currentImages.splice(index, 1);
              onChange(currentImages.slice());
              render();
            }, 200);
          });

          item.appendChild(img);
          item.appendChild(removeBtn);
          container.appendChild(item);
        });

        // Add-more tile
        var addMore = document.createElement('div');
        addMore.className = 'collage-add-more';
        addMore.innerHTML = '<span>+</span>';
        addMore.title = 'Add more images';
        addMore.addEventListener('click', function () { fileInput.click(); });
        container.appendChild(addMore);
      }
    }

    async function handleFiles(files) {
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (!file.type.startsWith('image/')) continue;
        showToast('Uploading image...');
        var url = await uploadImage(file, folder);
        if (url) {
          currentImages.push(url);
          onChange(currentImages.slice());
        } else {
          showToast('Upload failed — check Supabase config');
        }
      }
      render();
    }

    // Drag & drop
    container.addEventListener('dragover', function (e) {
      e.preventDefault();
      container.classList.add('dragover');
    });
    container.addEventListener('dragleave', function () {
      container.classList.remove('dragover');
    });
    container.addEventListener('drop', function (e) {
      e.preventDefault();
      container.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
    });

    // File picker
    fileInput.addEventListener('change', function () {
      if (fileInput.files.length > 0) {
        handleFiles(fileInput.files);
        fileInput.value = '';
      }
    });

    // Clipboard paste
    container.setAttribute('tabindex', '0');
    container.addEventListener('paste', function (e) {
      var items = e.clipboardData ? e.clipboardData.items : null;
      if (!items) return;
      var files = [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          files.push(items[i].getAsFile());
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        handleFiles(files);
      }
    });

    container.updateImages = function (newImages) {
      currentImages = newImages.slice();
      render();
    };

    render();
    return container;
  }

  function showLightbox(url) {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cursor = 'zoom-out';
    overlay.style.zIndex = '2000';
    overlay.style.transition = 'opacity 0.2s ease';

    var img = document.createElement('img');
    img.src = url;
    img.style.maxWidth = '90%';
    img.style.maxHeight = '90vh';
    img.style.objectFit = 'contain';
    img.style.borderRadius = '12px';
    img.style.boxShadow = '0 20px 50px rgba(0,0,0,0.6)';
    img.style.transform = 'scale(0.95)';
    img.style.transition = 'transform 0.2s ease';

    overlay.appendChild(img);
    document.body.appendChild(overlay);

    setTimeout(function () {
      img.style.transform = 'scale(1)';
    }, 10);

    var close = function () {
      img.style.transform = 'scale(0.95)';
      overlay.style.opacity = '0';
      setTimeout(function () {
        overlay.remove();
      }, 200);
    };

    overlay.addEventListener('click', close);
    
    var escListener = function (e) {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', escListener);
      }
    };
    document.addEventListener('keydown', escListener);
  }

  // ─── Navigation Bar Component ────────────────────────────
  function createNav(opts) {
    var nav = document.createElement('div');
    nav.className = 'nav-bar';

    var backBtn = document.createElement('button');
    backBtn.className = 'back-btn';
    backBtn.innerHTML = '← Back';
    backBtn.addEventListener('click', opts.onBack);

    var titleEl = document.createElement('span');
    titleEl.className = 'nav-title';
    titleEl.textContent = opts.title;

    var spacer = document.createElement('div');
    spacer.style.width = '80px';

    nav.appendChild(backBtn);
    nav.appendChild(titleEl);
    nav.appendChild(spacer);
    return nav;
  }

  // ─── App Globals ─────────────────────────────────────────
  var app = document.getElementById('app');
  var currentPage = 'home';

  // ─── Router ──────────────────────────────────────────────
  function navigate(page) {
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
      default:
        renderHome(app);
        break;
    }
  }

  window.addEventListener('hashchange', function () {
    var hash = window.location.hash.replace('#', '') || 'home';
    if (hash !== currentPage) {
      currentPage = hash;
      renderPage();
    }
  });

  // ─── Homepage ────────────────────────────────────────────
  function renderHome(container) {
    container.innerHTML = '';

    var home = document.createElement('div');
    home.className = 'home-container';

    var titleGroup = document.createElement('div');
    titleGroup.className = 'home-title-group';

    var title = document.createElement('h1');
    title.className = 'app-title';
    title.id = 'app-title';
    title.textContent = 'CHUMBAK CHU';

    var subtitle = document.createElement('p');
    subtitle.className = 'app-subtitle';
    subtitle.textContent = 'Reference Board';

    titleGroup.appendChild(title);
    titleGroup.appendChild(subtitle);

    var buttonsRow = document.createElement('div');
    buttonsRow.className = 'home-buttons';

    var charBtn = document.createElement('button');
    charBtn.className = 'home-btn';
    charBtn.id = 'btn-characters';
    charBtn.innerHTML =
      '<span class="home-btn-icon">🎭</span>' +
      '<span class="home-btn-text">Character References</span>' +
      '<span class="home-btn-hint">Personalities, costumes & visual refs</span>';
    charBtn.addEventListener('click', function () { navigate('characters'); });

    var sceneBtn = document.createElement('button');
    sceneBtn.className = 'home-btn';
    sceneBtn.id = 'btn-scenes';
    sceneBtn.innerHTML =
      '<span class="home-btn-icon">🎬</span>' +
      '<span class="home-btn-text">Scene References</span>' +
      '<span class="home-btn-hint">Visuals, lighting & mood boards</span>';
    sceneBtn.addEventListener('click', function () { navigate('scenes'); });

    buttonsRow.appendChild(charBtn);
    buttonsRow.appendChild(sceneBtn);

    home.appendChild(titleGroup);
    home.appendChild(buttonsRow);

    // Background orbs
    var orbsContainer = document.createElement('div');
    orbsContainer.className = 'bg-orbs';
    for (var i = 0; i < 3; i++) {
      var orb = document.createElement('div');
      orb.className = 'bg-orb bg-orb-' + (i + 1);
      orbsContainer.appendChild(orb);
    }
    home.appendChild(orbsContainer);

    container.appendChild(home);
  }

  // ─── Characters Page ─────────────────────────────────────
  var characters = [];
  var charIndex = 0;
  var charSaveTimeout = null;

  async function renderCharacters(container) {
    container.innerHTML = '';
    var page = document.createElement('div');
    page.className = 'page';

    var nav = createNav({ title: 'Character References', onBack: function () { navigate('home'); } });
    page.appendChild(nav);

    var loader = document.createElement('div');
    loader.className = 'empty-state';
    loader.innerHTML = '<div class="empty-state-icon">⏳</div><div class="empty-state-text">Loading characters...</div>';
    page.appendChild(loader);
    container.appendChild(page);

    characters = await fetchCharacters();
    loader.remove();

    // Layout wrapper: sidebar + main content
    var layout = document.createElement('div');
    layout.className = 'layout-with-sidebar';

    // Sidebar
    var sidebar = document.createElement('div');
    sidebar.className = 'sidebar';
    sidebar.id = 'char-sidebar';

    var sidebarHeader = document.createElement('div');
    sidebarHeader.className = 'sidebar-header';
    var sidebarTitle = document.createElement('span');
    sidebarTitle.className = 'sidebar-title';
    sidebarTitle.textContent = 'Characters';
    var sidebarAddBtn = document.createElement('button');
    sidebarAddBtn.className = 'sidebar-add-btn';
    sidebarAddBtn.title = 'Add new character';
    sidebarAddBtn.innerHTML = '+';
    sidebarAddBtn.addEventListener('click', handleAddCharacter);
    sidebarHeader.appendChild(sidebarTitle);
    sidebarHeader.appendChild(sidebarAddBtn);
    sidebar.appendChild(sidebarHeader);

    // Search input
    var searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'tag-input';
    searchInput.placeholder = 'Search...';
    searchInput.style.margin = '0.5rem 1rem';
    searchInput.style.padding = '0.4rem 0.8rem';
    searchInput.style.fontSize = '0.85rem';
    searchInput.value = sidebar.currentSearchQuery || '';
    searchInput.addEventListener('input', function () {
      sidebar.currentSearchQuery = searchInput.value.toLowerCase();
      filterCharList();
    });
    sidebar.appendChild(searchInput);

    var sidebarList = document.createElement('div');
    sidebarList.className = 'sidebar-list';
    sidebarList.id = 'char-sidebar-list';
    sidebar.appendChild(sidebarList);

    layout.appendChild(sidebar);

    // Main content
    var contentArea = document.createElement('div');
    contentArea.className = 'main-content';
    contentArea.id = 'character-content';
    layout.appendChild(contentArea);

    page.appendChild(layout);

    renderCharSidebar();
    renderCurrentCharacter(contentArea);
  }

  function renderCharSidebar() {
    var sidebarList = document.getElementById('char-sidebar-list');
    if (!sidebarList) return;
    sidebarList.innerHTML = '';

    if (characters.length === 0) {
      var emptyMsg = document.createElement('div');
      emptyMsg.className = 'sidebar-empty';
      emptyMsg.textContent = 'No characters yet';
      sidebarList.appendChild(emptyMsg);
      return;
    }

    characters.forEach(function (c, i) {
      var item = document.createElement('div');
      item.className = 'sidebar-item' + (i === charIndex ? ' active' : '');
      item.addEventListener('click', function () {
        charIndex = i;
        renderCharSidebar();
        var contentArea = document.getElementById('character-content');
        renderCurrentCharacter(contentArea);
      });

      var icon = document.createElement('span');
      icon.className = 'sidebar-item-icon';
      icon.textContent = '🎭';

      var name = document.createElement('span');
      name.className = 'sidebar-item-name';
      name.textContent = c.name || 'Unnamed';

      var idx = document.createElement('span');
      idx.className = 'sidebar-item-index';
      idx.textContent = '#' + (i + 1);

      item.appendChild(icon);
      item.appendChild(name);
      item.appendChild(idx);
      sidebarList.appendChild(item);
    });

    filterCharList();
  }

  function filterCharList() {
    var sidebar = document.getElementById('char-sidebar');
    if (!sidebar) return;
    var query = sidebar.currentSearchQuery || '';
    var list = document.getElementById('char-sidebar-list');
    if (!list) return;
    var items = list.querySelectorAll('.sidebar-item');
    items.forEach(function (item) {
      var name = item.querySelector('.sidebar-item-name').textContent.toLowerCase();
      if (name.includes(query)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  }

  function renderCurrentCharacter(contentArea) {
    contentArea.innerHTML = '';

    if (characters.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML =
        '<div class="empty-state-icon">🎭</div>' +
        '<div class="empty-state-text">No characters yet — click + to create one</div>';
      contentArea.appendChild(empty);
      return;
    }

    if (charIndex >= characters.length) charIndex = characters.length - 1;
    if (charIndex < 0) charIndex = 0;

    var char = characters[charIndex];

    // ── Character Name
    var nameSection = document.createElement('div');
    nameSection.className = 'section-card';
    var nameTitle = document.createElement('div');
    nameTitle.className = 'section-title';
    nameTitle.textContent = 'Character Name';
    var nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'name-input';
    nameInput.placeholder = 'Enter character name...';
    nameInput.value = char.name || '';
    nameInput.id = 'character-name-input';
    nameInput.addEventListener('input', function () {
      char.name = nameInput.value;
      charAutoSave(char);
      renderCharSidebar();
    });
    nameSection.appendChild(nameTitle);
    nameSection.appendChild(nameInput);
    contentArea.appendChild(nameSection);

    // ── Character Description
    var descSection = document.createElement('div');
    descSection.className = 'section-card';
    var descTitle = document.createElement('div');
    descTitle.className = 'section-title';
    descTitle.textContent = 'Description';
    var descInput = document.createElement('textarea');
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
    descInput.addEventListener('focus', function () { descInput.style.borderColor = 'var(--primary)'; });
    descInput.addEventListener('blur', function () { descInput.style.borderColor = 'var(--border)'; });
    descInput.placeholder = 'Enter character description...';
    descInput.value = char.description || '';
    descInput.addEventListener('input', function () {
      char.description = descInput.value;
      charAutoSave(char);
    });
    descSection.appendChild(descTitle);
    descSection.appendChild(descInput);
    contentArea.appendChild(descSection);

    // ── Characteristics
    var charSection = document.createElement('div');
    charSection.className = 'section-card';
    var charTitle = document.createElement('div');
    charTitle.className = 'section-title';
    charTitle.textContent = 'Characteristics';
    var tagInput = createTagInput({
      tags: char.characteristics || [],
      placeholder: 'Add keyword and press Enter...',
      onChange: function (tags) {
        char.characteristics = tags;
        charAutoSave(char);
      }
    });
    charSection.appendChild(charTitle);
    charSection.appendChild(tagInput);
    contentArea.appendChild(charSection);

    // ── Personality Visual References
    var personalitySection = document.createElement('div');
    personalitySection.className = 'section-card';
    var personalityTitle = document.createElement('div');
    personalityTitle.className = 'section-title';
    personalityTitle.textContent = 'Personality — Visual References';
    var personalityCollage = createCollage({
      images: char.personality_images || [],
      folder: 'characters/' + char.id + '/personality',
      onChange: function (urls) {
        char.personality_images = urls;
        charAutoSave(char);
      }
    });
    personalitySection.appendChild(personalityTitle);
    personalitySection.appendChild(personalityCollage);
    contentArea.appendChild(personalitySection);

    // ── Costume Visual References
    var costumeSection = document.createElement('div');
    costumeSection.className = 'section-card';
    var costumeTitle = document.createElement('div');
    costumeTitle.className = 'section-title';
    costumeTitle.textContent = 'Costume — Visual References';
    var costumeCollage = createCollage({
      images: char.costume_images || [],
      folder: 'characters/' + char.id + '/costume',
      onChange: function (urls) {
        char.costume_images = urls;
        charAutoSave(char);
      }
    });
    costumeSection.appendChild(costumeTitle);
    costumeSection.appendChild(costumeCollage);
    contentArea.appendChild(costumeSection);

    // ── Delete button
    var actions = document.createElement('div');
    actions.className = 'actions-bar';
    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = '🗑 Delete Character';
    deleteBtn.addEventListener('click', function () { handleDeleteCharacter(contentArea, char); });
    actions.appendChild(deleteBtn);
    contentArea.appendChild(actions);
  }

  async function handleAddCharacter() {
    showToast('Creating character...');
    var newChar = await createCharacterDB();
    if (newChar) {
      characters.push(newChar);
      charIndex = characters.length - 1;
      renderCharSidebar();
      var contentArea = document.getElementById('character-content');
      renderCurrentCharacter(contentArea);
      showToast('Character created!');
    } else {
      showToast('Failed — check Supabase config');
    }
  }

  async function handleDeleteCharacter(contentArea, char) {
    var confirmed = await showConfirm(
      'Delete Character',
      'Are you sure you want to delete "' + (char.name || 'Unnamed') + '"? This action cannot be undone.'
    );
    if (!confirmed) return;
    showToast('Deleting...');
    await deleteCharacterDB(char.id);
    characters = characters.filter(function (c) { return c.id !== char.id; });
    if (charIndex >= characters.length) charIndex = Math.max(0, characters.length - 1);
    renderCharSidebar();
    renderCurrentCharacter(contentArea);
    showToast('Character deleted');
  }

  function charAutoSave(char) {
    clearTimeout(charSaveTimeout);
    charSaveTimeout = setTimeout(async function () {
      await updateCharacterDB(char.id, {
        name: char.name,
        description: char.description,
        characteristics: char.characteristics,
        personality_images: char.personality_images,
        costume_images: char.costume_images,
      });
    }, 800);
  }

  // ─── Scenes Page ─────────────────────────────────────────
  var scenes = [];
  var sceneIndex = 0;
  var sceneSaveTimeout = null;

  async function renderScenes(container) {
    container.innerHTML = '';
    var page = document.createElement('div');
    page.className = 'page';

    var nav = createNav({ title: 'Scene References', onBack: function () { navigate('home'); } });
    page.appendChild(nav);

    var loader = document.createElement('div');
    loader.className = 'empty-state';
    loader.innerHTML = '<div class="empty-state-icon">⏳</div><div class="empty-state-text">Loading scenes...</div>';
    page.appendChild(loader);
    container.appendChild(page);

    scenes = await fetchScenes();
    loader.remove();

    // Layout wrapper: sidebar + main content
    var layout = document.createElement('div');
    layout.className = 'layout-with-sidebar';

    // Sidebar
    var sidebar = document.createElement('div');
    sidebar.className = 'sidebar';
    sidebar.id = 'scene-sidebar';

    var sidebarHeader = document.createElement('div');
    sidebarHeader.className = 'sidebar-header';
    var sidebarTitle = document.createElement('span');
    sidebarTitle.className = 'sidebar-title';
    sidebarTitle.textContent = 'Scenes';
    var sidebarAddBtn = document.createElement('button');
    sidebarAddBtn.className = 'sidebar-add-btn';
    sidebarAddBtn.title = 'Add new scene';
    sidebarAddBtn.innerHTML = '+';
    sidebarAddBtn.addEventListener('click', handleAddScene);
    sidebarHeader.appendChild(sidebarTitle);
    sidebarHeader.appendChild(sidebarAddBtn);
    sidebar.appendChild(sidebarHeader);

    // Search input
    var searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'tag-input';
    searchInput.placeholder = 'Search...';
    searchInput.style.margin = '0.5rem 1rem';
    searchInput.style.padding = '0.4rem 0.8rem';
    searchInput.style.fontSize = '0.85rem';
    searchInput.value = sidebar.currentSearchQuery || '';
    searchInput.addEventListener('input', function () {
      sidebar.currentSearchQuery = searchInput.value.toLowerCase();
      filterSceneList();
    });
    sidebar.appendChild(searchInput);

    var sidebarList = document.createElement('div');
    sidebarList.className = 'sidebar-list';
    sidebarList.id = 'scene-sidebar-list';
    sidebar.appendChild(sidebarList);

    layout.appendChild(sidebar);

    // Main content
    var contentArea = document.createElement('div');
    contentArea.className = 'main-content';
    contentArea.id = 'scene-content';
    layout.appendChild(contentArea);

    page.appendChild(layout);

    renderSceneSidebar();
    renderCurrentScene(contentArea);
  }

  function renderSceneSidebar() {
    var sidebarList = document.getElementById('scene-sidebar-list');
    if (!sidebarList) return;
    sidebarList.innerHTML = '';

    if (scenes.length === 0) {
      var emptyMsg = document.createElement('div');
      emptyMsg.className = 'sidebar-empty';
      emptyMsg.textContent = 'No scenes yet';
      sidebarList.appendChild(emptyMsg);
      return;
    }

    scenes.forEach(function (s, i) {
      var item = document.createElement('div');
      item.className = 'sidebar-item' + (i === sceneIndex ? ' active' : '');
      item.addEventListener('click', function () {
        sceneIndex = i;
        renderSceneSidebar();
        var contentArea = document.getElementById('scene-content');
        renderCurrentScene(contentArea);
      });

      var icon = document.createElement('span');
      icon.className = 'sidebar-item-icon';
      icon.textContent = '🎬';

      var name = document.createElement('span');
      name.className = 'sidebar-item-name';
      name.textContent = s.name || 'Unnamed';

      var idx = document.createElement('span');
      idx.className = 'sidebar-item-index';
      idx.textContent = '#' + (i + 1);

      item.appendChild(icon);
      item.appendChild(name);
      item.appendChild(idx);
      sidebarList.appendChild(item);
    });

    filterSceneList();
  }

  function filterSceneList() {
    var sidebar = document.getElementById('scene-sidebar');
    if (!sidebar) return;
    var query = sidebar.currentSearchQuery || '';
    var list = document.getElementById('scene-sidebar-list');
    if (!list) return;
    var items = list.querySelectorAll('.sidebar-item');
    items.forEach(function (item) {
      var name = item.querySelector('.sidebar-item-name').textContent.toLowerCase();
      if (name.includes(query)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  }

  function renderCurrentScene(contentArea) {
    contentArea.innerHTML = '';

    if (scenes.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML =
        '<div class="empty-state-icon">🎬</div>' +
        '<div class="empty-state-text">No scenes yet — click + to create one</div>';
      contentArea.appendChild(empty);
      return;
    }

    if (sceneIndex >= scenes.length) sceneIndex = scenes.length - 1;
    if (sceneIndex < 0) sceneIndex = 0;

    var scene = scenes[sceneIndex];

    // ── Scene Name
    var nameSection = document.createElement('div');
    nameSection.className = 'section-card';
    var nameTitle = document.createElement('div');
    nameTitle.className = 'section-title';
    nameTitle.textContent = 'Scene Name';
    var nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'name-input';
    nameInput.placeholder = 'Enter scene name...';
    nameInput.value = scene.name || '';
    nameInput.id = 'scene-name-input';
    nameInput.addEventListener('input', function () {
      scene.name = nameInput.value;
      sceneAutoSave(scene);
      renderSceneSidebar();
    });
    nameSection.appendChild(nameTitle);
    nameSection.appendChild(nameInput);
    contentArea.appendChild(nameSection);

    // ── Scene Description
    var descSection = document.createElement('div');
    descSection.className = 'section-card';
    var descTitle = document.createElement('div');
    descTitle.className = 'section-title';
    descTitle.textContent = 'Description';
    var descInput = document.createElement('textarea');
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
    descInput.addEventListener('focus', function () { descInput.style.borderColor = 'var(--primary)'; });
    descInput.addEventListener('blur', function () { descInput.style.borderColor = 'var(--border)'; });
    descInput.placeholder = 'Enter scene description...';
    descInput.value = scene.description || '';
    descInput.addEventListener('input', function () {
      scene.description = descInput.value;
      sceneAutoSave(scene);
    });
    descSection.appendChild(descTitle);
    descSection.appendChild(descInput);
    contentArea.appendChild(descSection);

    // ── Visual References
    var visualSection = document.createElement('div');
    visualSection.className = 'section-card';
    var visualTitle = document.createElement('div');
    visualTitle.className = 'section-title';
    visualTitle.textContent = 'Visual References';
    var visualCollage = createCollage({
      images: scene.visual_images || [],
      folder: 'scenes/' + scene.id + '/visual',
      onChange: function (urls) {
        scene.visual_images = urls;
        sceneAutoSave(scene);
      }
    });
    visualSection.appendChild(visualTitle);
    visualSection.appendChild(visualCollage);
    contentArea.appendChild(visualSection);

    // ── Lighting Tags
    var lightingTagSection = document.createElement('div');
    lightingTagSection.className = 'section-card';
    var lightingTagTitle = document.createElement('div');
    lightingTagTitle.className = 'section-title';
    lightingTagTitle.textContent = 'Lighting — Keywords';
    var lightingTagInput = createTagInput({
      tags: scene.lighting_tags || [],
      placeholder: 'e.g. warm, golden hour, high contrast...',
      onChange: function (tags) {
        scene.lighting_tags = tags;
        sceneAutoSave(scene);
      }
    });
    lightingTagSection.appendChild(lightingTagTitle);
    lightingTagSection.appendChild(lightingTagInput);
    contentArea.appendChild(lightingTagSection);

    // ── Lighting Visual References
    var lightingImgSection = document.createElement('div');
    lightingImgSection.className = 'section-card';
    var lightingImgTitle = document.createElement('div');
    lightingImgTitle.className = 'section-title';
    lightingImgTitle.textContent = 'Lighting — Visual References';
    var lightingCollage = createCollage({
      images: scene.lighting_images || [],
      folder: 'scenes/' + scene.id + '/lighting',
      onChange: function (urls) {
        scene.lighting_images = urls;
        sceneAutoSave(scene);
      }
    });
    lightingImgSection.appendChild(lightingImgTitle);
    lightingImgSection.appendChild(lightingCollage);
    contentArea.appendChild(lightingImgSection);

    // ── Delete button
    var actions = document.createElement('div');
    actions.className = 'actions-bar';
    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = '🗑 Delete Scene';
    deleteBtn.addEventListener('click', function () { handleDeleteScene(contentArea, scene); });
    actions.appendChild(deleteBtn);
    contentArea.appendChild(actions);
  }

  async function handleAddScene() {
    showToast('Creating scene...');
    var newScene = await createSceneDB();
    if (newScene) {
      scenes.push(newScene);
      sceneIndex = scenes.length - 1;
      renderSceneSidebar();
      var contentArea = document.getElementById('scene-content');
      renderCurrentScene(contentArea);
      showToast('Scene created!');
    } else {
      showToast('Failed — check Supabase config');
    }
  }

  async function handleDeleteScene(contentArea, scene) {
    var confirmed = await showConfirm(
      'Delete Scene',
      'Are you sure you want to delete "' + (scene.name || 'Unnamed') + '"? This action cannot be undone.'
    );
    if (!confirmed) return;
    showToast('Deleting...');
    await deleteSceneDB(scene.id);
    scenes = scenes.filter(function (s) { return s.id !== scene.id; });
    if (sceneIndex >= scenes.length) sceneIndex = Math.max(0, scenes.length - 1);
    renderSceneSidebar();
    renderCurrentScene(contentArea);
    showToast('Scene deleted');
  }

  function sceneAutoSave(scene) {
    clearTimeout(sceneSaveTimeout);
    sceneSaveTimeout = setTimeout(async function () {
      await updateSceneDB(scene.id, {
        name: scene.name,
        description: scene.description,
        visual_images: scene.visual_images,
        lighting_tags: scene.lighting_tags,
        lighting_images: scene.lighting_images,
      });
    }, 800);
  }



  // ─── Init ────────────────────────────────────────────────
  function init() {
    var hash = window.location.hash.replace('#', '') || 'home';
    currentPage = hash;
    renderPage();
  }

  init();
})();
