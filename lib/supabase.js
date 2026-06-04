// Supabase client & helpers
let supabaseClient = null;

export function getConfig() {
  return {
    url: localStorage.getItem('supabase_url') || '',
    key: localStorage.getItem('supabase_key') || '',
  };
}

export function saveConfig(url, key) {
  localStorage.setItem('supabase_url', url.trim());
  localStorage.setItem('supabase_key', key.trim());
  supabaseClient = null; // Reset so next call re-initializes
}

export function isConfigured() {
  const { url, key } = getConfig();
  return url.length > 0 && key.length > 0;
}

export function getClient() {
  if (supabaseClient) return supabaseClient;
  const { url, key } = getConfig();
  if (!url || !key) return null;
  // supabase is loaded via CDN on window
  supabaseClient = window.supabase.createClient(url, key);
  return supabaseClient;
}

// ─── Characters ──────────────────────────────────────────
export async function fetchCharacters() {
  const client = getClient();
  if (!client) return [];
  const { data, error } = await client
    .from('characters')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) { console.error('fetchCharacters error:', error); return []; }
  return data || [];
}

export async function createCharacter() {
  const client = getClient();
  if (!client) return null;
  const { data, error } = await client
    .from('characters')
    .insert({ name: '', description: '', characteristics: [], personality_images: [], costume_images: [] })
    .select()
    .single();
  if (error) { console.error('createCharacter error:', error); return null; }
  return data;
}

export async function updateCharacter(id, fields) {
  const client = getClient();
  if (!client) return;
  const { error } = await client.from('characters').update(fields).eq('id', id);
  if (error) console.error('updateCharacter error:', error);
}

export async function deleteCharacter(id) {
  const client = getClient();
  if (!client) return;
  const { error } = await client.from('characters').delete().eq('id', id);
  if (error) console.error('deleteCharacter error:', error);
}

// ─── Scenes ──────────────────────────────────────────────
export async function fetchScenes() {
  const client = getClient();
  if (!client) return [];
  const { data, error } = await client
    .from('scenes')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) { console.error('fetchScenes error:', error); return []; }
  return data || [];
}

export async function createScene() {
  const client = getClient();
  if (!client) return null;
  const { data, error } = await client
    .from('scenes')
    .insert({ name: '', description: '', visual_images: [], lighting_tags: [], lighting_images: [] })
    .select()
    .single();
  if (error) { console.error('createScene error:', error); return null; }
  return data;
}

export async function updateScene(id, fields) {
  const client = getClient();
  if (!client) return;
  const { error } = await client.from('scenes').update(fields).eq('id', id);
  if (error) console.error('updateScene error:', error);
}

export async function deleteScene(id) {
  const client = getClient();
  if (!client) return;
  const { error } = await client.from('scenes').delete().eq('id', id);
  if (error) console.error('deleteScene error:', error);
}

// ─── Storage (images) ────────────────────────────────────
export async function uploadImage(file, folder) {
  const client = getClient();
  if (!client) return null;
  const ext = file.name ? file.name.split('.').pop() : 'png';
  const fileName = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await client.storage
    .from('references')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });
  if (error) { console.error('uploadImage error:', error); return null; }
  const { data: urlData } = client.storage.from('references').getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function deleteImage(url) {
  const client = getClient();
  if (!client) return;
  // Extract path from the public URL
  try {
    const parts = url.split('/storage/v1/object/public/references/');
    if (parts.length < 2) return;
    const path = parts[1];
    const { error } = await client.storage.from('references').remove([path]);
    if (error) console.error('deleteImage error:', error);
  } catch (e) {
    console.error('deleteImage parse error:', e);
  }
}
