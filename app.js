/* ============================================================
   CHUMBAK CHU — Complete Application
   Single-file JS (no modules) for direct file:// usage
   ============================================================ */

(function () {
  'use strict';

  // ─── Supabase Client ─────────────────────────────────────
  let supabaseClient = null;

  function getConfig() {
    return {
      url: localStorage.getItem('supabase_url') || '',
      key: localStorage.getItem('supabase_key') || '',
    };
  }

  function saveConfig(url, key) {
    localStorage.setItem('supabase_url', url.trim());
    localStorage.setItem('supabase_key', key.trim());
    supabaseClient = null;
  }

  function isConfigured() {
    const { url, key } = getConfig();
    return url.length > 0 && key.length > 0;
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
      .insert({ name: '', characteristics: [], personality_images: [], costume_images: [] })
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
      .insert({ name: '', visual_images: [], lighting_tags: [], lighting_images: [] })
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

    var contentArea = document.createElement('div');
    contentArea.id = 'character-content';
    page.appendChild(contentArea);

    renderCurrentCharacter(contentArea);
  }

  function renderCurrentCharacter(contentArea) {
    contentArea.innerHTML = '';

    if (characters.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML =
        '<div class="empty-state-icon">🎭</div>' +
        '<div class="empty-state-text">No characters yet</div>';
      contentArea.appendChild(empty);

      var actions = document.createElement('div');
      actions.className = 'actions-bar';
      var addBtn = document.createElement('button');
      addBtn.className = 'btn-add';
      addBtn.textContent = '+ New Character';
      addBtn.addEventListener('click', handleAddCharacter);
      actions.appendChild(addBtn);
      contentArea.appendChild(actions);
      return;
    }

    if (charIndex >= characters.length) charIndex = characters.length - 1;
    if (charIndex < 0) charIndex = 0;

    var char = characters[charIndex];

    // ── Pagination
    var pagination = document.createElement('div');
    pagination.className = 'pagination';

    var prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.textContent = '‹ Prev';
    prevBtn.disabled = charIndex === 0;
    prevBtn.addEventListener('click', function () { charIndex--; renderCurrentCharacter(contentArea); });

    var dotsWrap = document.createElement('div');
    dotsWrap.className = 'page-dots';
    characters.forEach(function (_, i) {
      var dot = document.createElement('span');
      dot.className = 'page-dot' + (i === charIndex ? ' active' : '');
      dot.title = characters[i].name || ('Character ' + (i + 1));
      dot.addEventListener('click', function () { charIndex = i; renderCurrentCharacter(contentArea); });
      dotsWrap.appendChild(dot);
    });

    var pageLabel = document.createElement('span');
    pageLabel.className = 'page-label';
    pageLabel.textContent = (charIndex + 1) + ' / ' + characters.length;

    var nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.textContent = 'Next ›';
    nextBtn.disabled = charIndex === characters.length - 1;
    nextBtn.addEventListener('click', function () { charIndex++; renderCurrentCharacter(contentArea); });

    pagination.appendChild(prevBtn);
    pagination.appendChild(dotsWrap);
    pagination.appendChild(pageLabel);
    pagination.appendChild(nextBtn);
    contentArea.appendChild(pagination);

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
    });
    nameSection.appendChild(nameTitle);
    nameSection.appendChild(nameInput);
    contentArea.appendChild(nameSection);

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

    // ── Actions
    var actions = document.createElement('div');
    actions.className = 'actions-bar';

    var addBtn = document.createElement('button');
    addBtn.className = 'btn-add';
    addBtn.textContent = '+ New Character';
    addBtn.addEventListener('click', handleAddCharacter);

    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = '🗑 Delete Character';
    deleteBtn.addEventListener('click', function () { handleDeleteCharacter(contentArea, char); });

    actions.appendChild(addBtn);
    actions.appendChild(deleteBtn);
    contentArea.appendChild(actions);
  }

  async function handleAddCharacter() {
    showToast('Creating character...');
    var newChar = await createCharacterDB();
    if (newChar) {
      characters.push(newChar);
      charIndex = characters.length - 1;
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
    renderCurrentCharacter(contentArea);
    showToast('Character deleted');
  }

  function charAutoSave(char) {
    clearTimeout(charSaveTimeout);
    charSaveTimeout = setTimeout(async function () {
      await updateCharacterDB(char.id, {
        name: char.name,
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

    var contentArea = document.createElement('div');
    contentArea.id = 'scene-content';
    page.appendChild(contentArea);

    renderCurrentScene(contentArea);
  }

  function renderCurrentScene(contentArea) {
    contentArea.innerHTML = '';

    if (scenes.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML =
        '<div class="empty-state-icon">🎬</div>' +
        '<div class="empty-state-text">No scenes yet</div>';
      contentArea.appendChild(empty);

      var actions = document.createElement('div');
      actions.className = 'actions-bar';
      var addBtn = document.createElement('button');
      addBtn.className = 'btn-add';
      addBtn.textContent = '+ New Scene';
      addBtn.addEventListener('click', handleAddScene);
      actions.appendChild(addBtn);
      contentArea.appendChild(actions);
      return;
    }

    if (sceneIndex >= scenes.length) sceneIndex = scenes.length - 1;
    if (sceneIndex < 0) sceneIndex = 0;

    var scene = scenes[sceneIndex];

    // ── Pagination
    var pagination = document.createElement('div');
    pagination.className = 'pagination';

    var prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.textContent = '‹ Prev';
    prevBtn.disabled = sceneIndex === 0;
    prevBtn.addEventListener('click', function () { sceneIndex--; renderCurrentScene(contentArea); });

    var dotsWrap = document.createElement('div');
    dotsWrap.className = 'page-dots';
    scenes.forEach(function (_, i) {
      var dot = document.createElement('span');
      dot.className = 'page-dot' + (i === sceneIndex ? ' active' : '');
      dot.title = scenes[i].name || ('Scene ' + (i + 1));
      dot.addEventListener('click', function () { sceneIndex = i; renderCurrentScene(contentArea); });
      dotsWrap.appendChild(dot);
    });

    var pageLabel = document.createElement('span');
    pageLabel.className = 'page-label';
    pageLabel.textContent = (sceneIndex + 1) + ' / ' + scenes.length;

    var nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.textContent = 'Next ›';
    nextBtn.disabled = sceneIndex === scenes.length - 1;
    nextBtn.addEventListener('click', function () { sceneIndex++; renderCurrentScene(contentArea); });

    pagination.appendChild(prevBtn);
    pagination.appendChild(dotsWrap);
    pagination.appendChild(pageLabel);
    pagination.appendChild(nextBtn);
    contentArea.appendChild(pagination);

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
    });
    nameSection.appendChild(nameTitle);
    nameSection.appendChild(nameInput);
    contentArea.appendChild(nameSection);

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

    // ── Actions
    var actions = document.createElement('div');
    actions.className = 'actions-bar';

    var addBtn = document.createElement('button');
    addBtn.className = 'btn-add';
    addBtn.textContent = '+ New Scene';
    addBtn.addEventListener('click', handleAddScene);

    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = '🗑 Delete Scene';
    deleteBtn.addEventListener('click', function () { handleDeleteScene(contentArea, scene); });

    actions.appendChild(addBtn);
    actions.appendChild(deleteBtn);
    contentArea.appendChild(actions);
  }

  async function handleAddScene() {
    showToast('Creating scene...');
    var newScene = await createSceneDB();
    if (newScene) {
      scenes.push(newScene);
      sceneIndex = scenes.length - 1;
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
    renderCurrentScene(contentArea);
    showToast('Scene deleted');
  }

  function sceneAutoSave(scene) {
    clearTimeout(sceneSaveTimeout);
    sceneSaveTimeout = setTimeout(async function () {
      await updateSceneDB(scene.id, {
        name: scene.name,
        visual_images: scene.visual_images,
        lighting_tags: scene.lighting_tags,
        lighting_images: scene.lighting_images,
      });
    }, 800);
  }

  // ─── Settings Modal ──────────────────────────────────────
  var settingsBtn = document.getElementById('settings-btn');

  function openSettings() {
    var config = getConfig();

    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'settings-modal';

    var modal = document.createElement('div');
    modal.className = 'modal';

    modal.innerHTML =
      '<div class="modal-title">⚙️ Supabase Configuration</div>' +
      '<div class="modal-text">Connect your Supabase project to enable data persistence and image uploads.</div>' +
      '<div class="settings-form">' +
      '  <div>' +
      '    <label class="settings-label">Project URL</label>' +
      '    <input type="text" class="settings-input" id="settings-url" ' +
      '           placeholder="https://your-project.supabase.co" ' +
      '           value="' + config.url + '">' +
      '  </div>' +
      '  <div>' +
      '    <label class="settings-label">Anon / Public Key</label>' +
      '    <input type="text" class="settings-input" id="settings-key" ' +
      '           placeholder="eyJhbGciOiJIUzI1NiIs..." ' +
      '           value="' + config.key + '">' +
      '  </div>' +
      '</div>' +
      '<div class="modal-actions">' +
      '  <button class="btn-cancel" id="settings-cancel">Cancel</button>' +
      '  <button class="btn-add" id="settings-save">Save & Connect</button>' +
      '</div>';

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeSettings();
    });

    document.getElementById('settings-cancel').addEventListener('click', closeSettings);
    document.getElementById('settings-save').addEventListener('click', function () {
      var url = document.getElementById('settings-url').value;
      var key = document.getElementById('settings-key').value;
      saveConfig(url, key);
      closeSettings();
      showToast('Supabase connected! ✓');
      renderPage();
    });
  }

  function closeSettings() {
    var modal = document.getElementById('settings-modal');
    if (modal) modal.remove();
  }

  settingsBtn.addEventListener('click', openSettings);

  // ─── Init ────────────────────────────────────────────────
  function init() {
    var hash = window.location.hash.replace('#', '') || 'home';
    currentPage = hash;

    if (!isConfigured()) {
      renderPage();
      setTimeout(function () {
        showToast('Click ⚙️ to configure Supabase');
      }, 1000);
    } else {
      renderPage();
    }
  }

  init();
})();
