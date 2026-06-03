// Homepage — CHUMBAK CHU title + two big navigation buttons
import { navigate } from '../main.js';

export function renderHome(container) {
  container.innerHTML = '';

  const home = document.createElement('div');
  home.className = 'home-container';

  // ─── Title area ────────────────────────────────────────
  const titleGroup = document.createElement('div');
  titleGroup.className = 'home-title-group';

  const title = document.createElement('h1');
  title.className = 'app-title';
  title.textContent = 'CHUMBAK CHU';

  const subtitle = document.createElement('p');
  subtitle.className = 'app-subtitle';
  subtitle.textContent = 'Reference Board';

  titleGroup.appendChild(title);
  titleGroup.appendChild(subtitle);

  // ─── Buttons ───────────────────────────────────────────
  const buttonsRow = document.createElement('div');
  buttonsRow.className = 'home-buttons';

  // Character References button
  const charBtn = document.createElement('button');
  charBtn.className = 'home-btn';
  charBtn.id = 'btn-characters';
  charBtn.innerHTML = `
    <span class="home-btn-icon">🎭</span>
    <span class="home-btn-text">Character References</span>
    <span class="home-btn-hint">Personalities, costumes & visual refs</span>
  `;
  charBtn.addEventListener('click', () => navigate('characters'));

  // Scene References button
  const sceneBtn = document.createElement('button');
  sceneBtn.className = 'home-btn';
  sceneBtn.id = 'btn-scenes';
  sceneBtn.innerHTML = `
    <span class="home-btn-icon">🎬</span>
    <span class="home-btn-text">Scene References</span>
    <span class="home-btn-hint">Visuals, lighting & mood boards</span>
  `;
  sceneBtn.addEventListener('click', () => navigate('scenes'));

  buttonsRow.appendChild(charBtn);
  buttonsRow.appendChild(sceneBtn);

  // ─── Assemble ──────────────────────────────────────────
  home.appendChild(titleGroup);
  home.appendChild(buttonsRow);

  // ─── Background floating orbs ──────────────────────────
  const orbsContainer = document.createElement('div');
  orbsContainer.className = 'bg-orbs';
  for (let i = 0; i < 3; i++) {
    const orb = document.createElement('div');
    orb.className = `bg-orb bg-orb-${i + 1}`;
    orbsContainer.appendChild(orb);
  }
  home.appendChild(orbsContainer);

  container.appendChild(home);
}
