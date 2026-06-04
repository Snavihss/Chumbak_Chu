// Chumbak Chu Sync — Figma Engine Code
figma.showUI(__html__, { width: 320, height: 420 });

// Map to keep track of image load requests
const pendingFills = new Map();

// Helper to load Inter font for text editing
async function loadFont() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
}

// Locate target frame for character or scene
function findFrameForRecord(id) {
  // Search the current page for a frame whose name contains or matches the ID
  const cleanId = id.trim().toLowerCase();
  
  // Try finding by name or by custom plugin data
  const frames = figma.currentPage.findAll(node => {
    if (node.type !== 'FRAME' && node.type !== 'SECTION' && node.type !== 'GROUP') return false;
    
    // Check plugin data
    if (node.getPluginData('recordId') === cleanId) return true;
    
    // Check name pattern e.g., "Chumbak [ID: b98f9e2a...]"
    const nameMatch = node.name.toLowerCase().includes(cleanId);
    if (nameMatch) return true;

    // Check if it has a child text node with the ID
    if (node.type === 'FRAME') {
      const idNode = node.findOne(child => child.type === 'TEXT' && child.characters.toLowerCase().includes(cleanId));
      if (idNode) return true;
    }
    
    return false;
  });

  return frames.length > 0 ? frames[0] : null;
}

// Update Figma layers based on Database Record
async function updateFigmaFrame(record, type) {
  const frame = findFrameForRecord(record.id);
  if (!frame) return;

  // Set plugin data to lock link
  frame.setPluginData('recordId', record.id);
  frame.setPluginData('recordType', type);

  await loadFont();

  // 1. Update Name Text Layer
  // Look for a text node named "Name", "Title", or containing the tag '[Name]'
  const nameNode = frame.findOne(node => 
    node.type === 'TEXT' && 
    (node.name.toLowerCase() === 'name' || node.name.toLowerCase() === 'title' || node.name.startsWith('[ID:'))
  ) || frame.findOne(node => node.type === 'TEXT'); // fallback to first text layer found

  if (nameNode && nameNode.type === 'TEXT') {
    await figma.loadFontAsync(nameNode.fontName);
    nameNode.characters = record.name || 'Unnamed';
  }

  // 1.5 Update Description Text Layer
  const descNode = frame.findOne(node => 
    node.type === 'TEXT' && 
    (node.name.toLowerCase() === 'description' || node.name.toLowerCase() === '#description')
  );

  if (descNode && descNode.type === 'TEXT') {
    await figma.loadFontAsync(descNode.fontName);
    descNode.characters = record.description || '';
  }

  // 2. Update Characteristics / Keywords (for characters) or Lighting Keywords (for scenes)
  const tags = type === 'characters' ? (record.characteristics || []) : (record.lighting_tags || []);
  const tagsNode = frame.findOne(node => 
    node.type === 'TEXT' && 
    (node.name.toLowerCase().includes('tag') || node.name.toLowerCase().includes('characteristic') || node.name.toLowerCase().includes('keyword'))
  );

  if (tagsNode && tagsNode.type === 'TEXT') {
    await figma.loadFontAsync(tagsNode.fontName);
    tagsNode.characters = tags.join(', ');
  }

  // 3. Update Image Collages
  if (type === 'characters') {
    // Sync Personality and Costume collages
    await syncCollageImages(frame, 'personality', record.personality_images || []);
    await syncCollageImages(frame, 'costume', record.costume_images || []);
  } else {
    // Sync Visual and Lighting collages
    await syncCollageImages(frame, 'visual', record.visual_images || []);
    await syncCollageImages(frame, 'lighting', record.lighting_images || []);
  }
}

// Sync visual collage boxes with database image arrays
async function syncCollageImages(parentFrame, collageType, urls) {
  // Find a frame or group representing the collage named "Personality", "Costume", "Visual", "Lighting"
  const collageFrame = parentFrame.findOne(node => 
    node.name.toLowerCase().includes(collageType.toLowerCase())
  );

  if (!collageFrame) return;

  // Find all rectangles/nodes inside the collage frame to fill with images
  const placeholders = collageFrame.findAll(node => 
    node.type === 'RECTANGLE' || node.type === 'FRAME'
  );

  if (placeholders.length === 0) return;

  // Map each URL to a placeholder index
  urls.forEach((url, idx) => {
    if (idx >= placeholders.length) return;
    const targetNode = placeholders[idx];

    // Request the UI to fetch image bytes for this URL
    figma.ui.postMessage({ 
      type: 'fetch-image-bytes', 
      url: url, 
      targetNodeId: targetNode.id 
    });
  });
}

// Listen to messages from plugin UI (ui.html)
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'sync-from-db') {
    const { record, table } = msg;
    await updateFigmaFrame(record, table);
  } else if (msg.type === 'bulk-pull-data') {
    const { characters, scenes } = msg;
    for (const char of characters) {
      await updateFigmaFrame(char, 'characters');
    }
    for (const sc of scenes) {
      await updateFigmaFrame(sc, 'scenes');
    }
  } else if (msg.type === 'image-bytes-result') {
    const { bytes, targetNodeId } = msg;
    const targetNode = figma.getNodeById(targetNodeId);
    if (targetNode && (targetNode.type === 'RECTANGLE' || targetNode.type === 'FRAME')) {
      const image = figma.createImage(bytes);
      targetNode.fills = [
        {
          type: 'IMAGE',
          imageHash: image.hash,
          scaleMode: 'FILL'
        }
      ];
    }
  }
};

// Monitor user selections / edits in Figma to sync BACK to database
figma.on("documentchange", (event) => {
  for (const change of event.documentChanges) {
    if (change.type === 'PROPERTY') {
      const node = change.node;
      
      // Look up parent frames to see if it is tagged to a record
      let parent = node.parent;
      let recordId = null;
      let recordType = null;
      
      while (parent) {
        recordId = parent.getPluginData('recordId');
        recordType = parent.getPluginData('recordType');
        if (recordId) break;
        parent = parent.parent;
      }

      if (!recordId || !recordType) continue;

      // Handle Text changes
      if (node.type === 'TEXT') {
        const nameLower = node.name.toLowerCase();
        
        // Sync Name field
        if (nameLower === 'name' || nameLower === 'title') {
          figma.ui.postMessage({
            type: 'sync-to-db',
            table: recordType,
            id: recordId,
            field: 'name',
            value: node.characters
          });
        }
        
        // Sync Description field
        if (nameLower === 'description' || nameLower === '#description') {
          figma.ui.postMessage({
            type: 'sync-to-db',
            table: recordType,
            id: recordId,
            field: 'description',
            value: node.characters
          });
        }
        
        // Sync Characteristics / Tags field
        if (nameLower.includes('tag') || nameLower.includes('characteristic') || nameLower.includes('keyword')) {
          const tags = node.characters.split(',').map(t => t.trim()).filter(Boolean);
          figma.ui.postMessage({
            type: 'sync-to-db',
            table: recordType,
            id: recordId,
            field: recordType === 'characters' ? 'characteristics' : 'lighting_tags',
            value: tags
          });
        }
      }
    }
  }
});
