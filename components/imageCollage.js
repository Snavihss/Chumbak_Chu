// Image Collage Component
// Creates a drag-and-drop / paste / click-to-browse image grid

import { uploadImage, deleteImage } from '../lib/supabase.js';
import { showToast } from '../main.js';

/**
 * Creates an image collage widget
 * @param {Object} opts
 * @param {string[]} opts.images - Array of image URLs
 * @param {string} opts.folder - Storage folder name
 * @param {(urls: string[]) => void} opts.onChange - Callback when images change
 * @returns {HTMLElement}
 */
export function createCollage({ images = [], folder = 'misc', onChange }) {
  let currentImages = [...images];

  const container = document.createElement('div');
  container.className = 'collage-box';

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.multiple = true;
  fileInput.className = 'collage-input';

  container.appendChild(fileInput);

  // ─── Render ────────────────────────────────────────────
  function render() {
    // Remove everything except the file input
    Array.from(container.children).forEach(child => {
      if (child !== fileInput) child.remove();
    });

    if (currentImages.length === 0) {
      const placeholder = document.createElement('div');
      placeholder.className = 'collage-placeholder';
      placeholder.innerHTML = `
        <span class="collage-placeholder-icon">🖼️</span>
        <span>Drop images here, paste from clipboard, or click to browse</span>
      `;
      placeholder.addEventListener('click', () => fileInput.click());
      container.appendChild(placeholder);
    } else {
      currentImages.forEach((url, index) => {
        const item = document.createElement('div');
        item.className = 'collage-item';

        const img = document.createElement('img');
        img.src = url;
        img.alt = `Reference ${index + 1}`;
        img.loading = 'lazy';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'collage-item-remove';
        removeBtn.innerHTML = '×';
        removeBtn.title = 'Remove image';
        removeBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          item.style.transform = 'scale(0)';
          item.style.opacity = '0';
          setTimeout(async () => {
            await deleteImage(url);
            currentImages.splice(index, 1);
            onChange(currentImages);
            render();
          }, 200);
        });

        item.appendChild(img);
        item.appendChild(removeBtn);
        container.appendChild(item);
      });

      // Add button to add more
      const addMore = document.createElement('div');
      addMore.className = 'collage-add-more';
      addMore.innerHTML = `<span>+</span>`;
      addMore.title = 'Add more images';
      addMore.addEventListener('click', () => fileInput.click());
      container.appendChild(addMore);
    }
  }

  // ─── Upload handler ────────────────────────────────────
  async function handleFiles(files) {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      showToast('Uploading image...');
      const url = await uploadImage(file, folder);
      if (url) {
        currentImages.push(url);
        onChange(currentImages);
      } else {
        showToast('Upload failed — check Supabase config');
      }
    }
    render();
  }

  // ─── Drag & Drop ──────────────────────────────────────
  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    container.classList.add('dragover');
  });
  container.addEventListener('dragleave', () => {
    container.classList.remove('dragover');
  });
  container.addEventListener('drop', (e) => {
    e.preventDefault();
    container.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  });

  // ─── File input change ────────────────────────────────
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleFiles(fileInput.files);
      fileInput.value = ''; // reset
    }
  });

  // ─── Paste (clipboard) ────────────────────────────────
  // We attach paste listener to the collage box when focused/clicked
  container.setAttribute('tabindex', '0');
  container.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files = [];
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        files.push(item.getAsFile());
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      handleFiles(files);
    }
  });

  // ─── Public API to update images externally ───────────
  container.updateImages = (newImages) => {
    currentImages = [...newImages];
    render();
  };

  render();
  return container;
}
