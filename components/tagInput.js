// Tag Input Component
// Creates a keyword/tag input with add/remove functionality

/**
 * Creates a tag input widget
 * @param {Object} opts
 * @param {string[]} opts.tags - Initial tags
 * @param {string} opts.placeholder - Placeholder text
 * @param {(tags: string[]) => void} opts.onChange - Callback when tags change
 * @returns {HTMLElement}
 */
export function createTagInput({ tags = [], placeholder = 'Type and press Enter...', onChange }) {
  let currentTags = [...tags];

  const wrapper = document.createElement('div');

  const tagsContainer = document.createElement('div');
  tagsContainer.className = 'tags-container';
  wrapper.appendChild(tagsContainer);

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'tag-input';
  input.placeholder = placeholder;
  wrapper.appendChild(input);

  function render() {
    tagsContainer.innerHTML = '';
    currentTags.forEach((tag, index) => {
      const tagEl = document.createElement('span');
      tagEl.className = 'tag';

      const text = document.createElement('span');
      text.textContent = tag;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'tag-remove';
      removeBtn.innerHTML = '×';
      removeBtn.title = 'Remove';
      removeBtn.addEventListener('click', () => {
        currentTags.splice(index, 1);
        onChange(currentTags);
        render();
      });

      tagEl.appendChild(text);
      tagEl.appendChild(removeBtn);
      tagsContainer.appendChild(tagEl);
    });
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = input.value.trim();
      if (value && !currentTags.includes(value)) {
        currentTags.push(value);
        onChange(currentTags);
        input.value = '';
        render();
      }
    }
    // Backspace removes last tag when input is empty
    if (e.key === 'Backspace' && input.value === '' && currentTags.length > 0) {
      currentTags.pop();
      onChange(currentTags);
      render();
    }
  });

  // Public update method
  wrapper.updateTags = (newTags) => {
    currentTags = [...newTags];
    render();
  };

  render();
  return wrapper;
}
