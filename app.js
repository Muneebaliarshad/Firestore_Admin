import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// =========================================================
// 🌐 GLOBAL STATE & APP
// =========================================================
let app, db;
let config = {
  firebase: null,
  masterCollection: ""
};

// =========================================================
// 🎯 DOM ELEMENTS
// =========================================================
const appContainer = document.querySelector('.app-container');
const settingsToggle = document.getElementById('settings-toggle');
const settingsOverlay = document.getElementById('settings-overlay');
const closeSettingsBtn = document.getElementById('close-settings');
const settingsView = document.getElementById('settings-view');
const mainContent = document.getElementById('main-content');

const firebaseConfigInput = document.getElementById('firebase-config-input');
const masterCollectionInput = document.getElementById('master-collection-input');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const clearCacheBtn = document.getElementById('clear-cache-btn');

const mainCollectionSelect = document.getElementById('main-collection-select');
const collectionSelect = document.getElementById('collection-select');
const subDocSelectWrapper = document.getElementById('sub-doc-select-wrapper');
const toggleNewDocBtn = document.getElementById('toggle-new-doc');
const resetSubDocBtn = document.getElementById('reset-sub-doc');
const newDocInputWrapper = document.getElementById('new-doc-input-wrapper');
const newDocumentIdInput = document.getElementById('new-document-id');
const deepLevelGroup = document.getElementById('deep-level-group');
const subCollectionIdInput = document.getElementById('sub-collection-id');
const deepDocIdInput = document.getElementById('deep-doc-id');
const plusIcon = toggleNewDocBtn.querySelector('.plus-icon');
const backIcon = toggleNewDocBtn.querySelector('.back-icon');

let isNewDocMode = false;
let isDeepMode = false;

const jsonInput = document.getElementById('json-input');
const jsonError = document.getElementById('json-error');
const saveBtn = document.getElementById('save-btn');
const btnText = saveBtn.querySelector('.btn-text');
const loader = saveBtn.querySelector('.loader');
const toastContainer = document.getElementById('toast-container');

// Visibility Groups
const documentGroup = document.getElementById('document-group');
const jsonGroup = document.getElementById('json-group');
const saveGroup = document.getElementById('save-group');

// Full Data Modal Elements
const viewAllDataBtn = document.getElementById('view-all-data-btn');
const dataModalOverlay = document.getElementById('data-modal-overlay');
const closeDataModalBtn = document.getElementById('close-data-modal');
const fullTreeContainer = document.getElementById('full-tree-container');
const dataModalTitle = document.getElementById('data-modal-title');
const dataModalSubtitle = document.getElementById('data-modal-subtitle');

// =========================================================
// 🔑 CONFIGURATION & PERSISTENCE
// =========================================================

function loadSettings() {
  const savedConfig = localStorage.getItem('firebase_db_writer_config');
  if (savedConfig) {
    try {
      config = JSON.parse(savedConfig);
      firebaseConfigInput.value = JSON.stringify(config.firebase, null, 2);
      masterCollectionInput.value = config.masterCollection;
      return true;
    } catch (e) {
      console.error("Failed to parse saved config", e);
    }
  }
  return false;
}

function saveSettings(firebaseConfig, masterCollection) {
  const newConfig = {
    firebase: firebaseConfig,
    masterCollection: masterCollection
  };
  localStorage.setItem('firebase_db_writer_config', JSON.stringify(newConfig));
  config = newConfig;
}

async function initFirebase() {
  if (!config.firebase || !config.masterCollection) {
    showSettings(true);
    return false;
  }

  try {
    app = initializeApp(config.firebase);
    db = getFirestore(app);
    
    // Test connectivity by loading roots
    await loadRootCollections();
    
    showSettings(false);
    appContainer.classList.remove('setup-required');
    return true;
  } catch (error) {
    console.error("Firebase Initialization Error:", error);
    showToast("Init Error", "Failed to connect to Firebase. Check your config.", "error");
    showSettings(true);
    return false;
  }
}

function showSettings(show) {
  if (show) {
    settingsOverlay.classList.remove('hidden');
  } else {
    settingsOverlay.classList.add('hidden');
  }
}

// =========================================================
// 📥 FETCH COLLECTIONS
// =========================================================

/**
 * Populates the 1st dropdown with names entered in settings.
 */
async function loadRootCollections() {
  const collectionsStr = config.masterCollection || "";
  const names = collectionsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
  
  // Update label
  const label = document.querySelector('label[for="main-collection-select"]');
  if (label) label.textContent = `Main Collection`;

  if (names.length === 0) {
    mainCollectionSelect.innerHTML = '<option value="" disabled selected>No collections configured</option>';
    return;
  }

  mainCollectionSelect.innerHTML = '<option value="" disabled selected>Select Main Collection...</option>';
  names.forEach((name, index) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    mainCollectionSelect.appendChild(option);
  });

  // Reset visibility states
  updateFormVisibility();
}

function updateFormVisibility() {
  const mainSelected = mainCollectionSelect.value;
  const docSelected = collectionSelect.value;
  const isCreatingNew = isNewDocMode;

  // Level 1: Main Collection -> Document Group
  if (mainSelected) {
    showGroup(documentGroup);
  } else {
    hideGroup(documentGroup);
  }

  // Level 2: Document -> JSON & Save Group
  if (docSelected || isCreatingNew) {
    showGroup(jsonGroup);
    showGroup(saveGroup);
  } else {
    hideGroup(jsonGroup);
    hideGroup(saveGroup);
  }
}

function showGroup(group) {
  if (group.classList.contains('hidden')) {
    group.classList.remove('hidden');
    group.classList.add('reveal-animation');
    // Remove animation class after it finishes to allow re-triggering if needed
    group.addEventListener('animationend', () => {
      group.classList.remove('reveal-animation');
    }, { once: true });
  }
}

function hideGroup(group) {
  group.classList.add('hidden');
  group.classList.remove('reveal-animation');
}

async function updateTree() {
  // This function is now deprecated after removing the inline explorer
}

function buildTree(key, value, isRoot = false) {
  const node = document.createElement('div');
  node.className = isRoot ? '' : 'tree-node';

  const item = document.createElement('div');
  item.className = 'tree-item';

  const isObject = value !== null && typeof value === 'object';
  const hasChildren = isObject && Object.keys(value).length > 0;

  // Toggle button for objects
  if (hasChildren) {
    const toggle = document.createElement('span');
    toggle.className = 'tree-toggle';
    toggle.textContent = '▶';
    item.appendChild(toggle);
    
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const children = node.querySelector('.tree-children');
      const isExpanded = children.classList.toggle('visible');
      toggle.textContent = isExpanded ? '▼' : '▶';
      toggle.classList.toggle('expanded', isExpanded);
    });
  } else if (isObject) {
    const spacer = document.createElement('span');
    spacer.style.width = '16px';
    item.appendChild(spacer);
  }

  // Icon
  const icon = document.createElement('span');
  icon.className = 'tree-icon';
  icon.textContent = isObject ? '📁' : '📄';
  item.appendChild(icon);

  // Key
  const keySpan = document.createElement('span');
  keySpan.className = 'tree-key';
  keySpan.textContent = key + (isObject ? ':' : ': ');
  item.appendChild(keySpan);

  // Value (for primitives)
  if (!isObject) {
    const valueSpan = document.createElement('span');
    const type = typeof value;
    valueSpan.className = `tree-value ${type}`;
    valueSpan.textContent = type === 'string' ? `"${value}"` : value;
    item.appendChild(valueSpan);
  }

  node.appendChild(item);

  // Children (for objects)
  if (hasChildren) {
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'tree-children';
    
    Object.entries(value).forEach(([childKey, childValue]) => {
      childrenContainer.appendChild(buildTree(childKey, childValue));
    });
    
    node.appendChild(childrenContainer);
    
    // Auto-expand root
    if (isRoot) {
      const toggle = item.querySelector('.tree-toggle');
      toggle.textContent = '▼';
      toggle.classList.add('expanded');
      childrenContainer.classList.add('visible');
    }
  }

  return node;
}

async function showFullCollectionData() {
  const mainCol = mainCollectionSelect.value;
  if (!mainCol) {
    showToast("Error", "Please select a main collection first.", "error");
    return;
  }

  dataModalOverlay.classList.remove('hidden');
  dataModalTitle.textContent = "Loading Tree...";
  dataModalSubtitle.textContent = `Fetching all documents in '${mainCol}'`;
  fullTreeContainer.innerHTML = '<div class="empty-tree-msg">Gathering collection data...</div>';

  try {
    const querySnapshot = await getDocs(collection(db, mainCol));
    fullTreeContainer.innerHTML = '';
    
    if (querySnapshot.empty) {
        fullTreeContainer.innerHTML = '<div class="empty-tree-msg">This collection is empty.</div>';
    } else {
        querySnapshot.forEach((docSnap) => {
            const docId = docSnap.id;
            const data = docSnap.data();
            const docTree = buildTree(docId, data, true);
            
            // Add extra styling for separation in the full view
            docTree.style.marginBottom = '20px';
            docTree.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            docTree.style.paddingBottom = '15px';
            
            fullTreeContainer.appendChild(docTree);
        });
    }
    
    dataModalTitle.textContent = "Collection Explorer";
    dataModalSubtitle.textContent = `Showing all documents in '${mainCol}'`;
    
  } catch (error) {
    console.error("Error fetching full collection:", error);
    fullTreeContainer.innerHTML = '<div class="empty-tree-msg" style="color: var(--error-text)">Failed to load collection data.</div>';
    dataModalTitle.textContent = "Error";
  }
}

async function loadCollections() {
  const mainCollection = mainCollectionSelect.value;
  if (!mainCollection) return;

  collectionSelect.innerHTML = '<option value="" disabled selected>Loading documents...</option>';
  
  try {
    const querySnapshot = await getDocs(collection(db, mainCollection));
    
    let collections = [];
    querySnapshot.forEach(docSnap => {
      collections.push(docSnap.id);
    });

    collectionSelect.innerHTML = '<option value="" disabled selected>Select Document...</option>';

    if (collections.length === 0) {
      collectionSelect.innerHTML = '<option value="" disabled>No documents found</option>';
      return;
    }

    collections.forEach(col => {
      const option = document.createElement('option');
      option.value = col;
      option.textContent = col;
      collectionSelect.appendChild(option);
    });

    // Auto-show reset button if something is selected
    if (collectionSelect.value) {
      resetSubDocBtn.style.display = 'flex';
    }

  } catch (error) {
    console.error("Error loading documents:", error);
    showToast("Load Error", "Failed to fetch sub-documents.", "error");
    collectionSelect.innerHTML = '<option value="" disabled>Error</option>';
  }
}

// =========================================================
// 💾 WRITE TO FIRESTORE
// =========================================================
async function saveDocument(subDocName, subColName, deepDocId, processedData) {
  setLoading(true);
  const mainCollection = mainCollectionSelect.value;

  try {
    let docRef;
    const jsonDocId = deepDocId || processedData.id || processedData.word || processedData.expression;

    if (subColName) {
      // Path: MainCol / SubDoc / SubCol / ID_from_JSON (or custom ID)
      docRef = doc(db, mainCollection, subDocName, subColName, jsonDocId);
      await setDoc(docRef, processedData);
    } else {
      // Path: MainCol / SubDoc (Standard document save)
      docRef = doc(db, mainCollection, subDocName);
      await setDoc(docRef, processedData);
    }

    const descriptiveName = processedData.word || processedData.expression || processedData.id || subDocName;
    showToast("Success", `Saved '${descriptiveName}' to ${subDocName}`, "success");
    triggerCelebration();

    jsonInput.value = '';
    
    // If we just created a new document, refresh the list and switch back to select mode
    if (isNewDocMode) {
      newDocumentIdInput.value = '';
      toggleNewDocBtn.click(); // Switch back to select mode
      await loadCollections();
      // Select the newly created doc in the dropdown
      collectionSelect.value = subDocName;
    }

  } catch (error) {
    console.error("Error writing to Firestore:", error);
    showToast("Error", error.message, "error");
  } finally {
    setLoading(false);
  }
}

// =========================================================
// 🖱️ EVENT LISTENERS
// =========================================================

/**
 * Smarter parser that handles pure JSON, JS Objects, and variable assignments
 */
function parseConfigInput(str) {
  const input = str.trim();
  // Attempt to extract the object portion if we see 'const/let/var x = { ... }'
  const objectMatch = input.match(/\{[\s\S]*\}/);
  const sanitized = objectMatch ? objectMatch[0] : input;

  try {
    // 1. Try standard JSON
    return JSON.parse(sanitized);
  } catch (e) {
    try {
      // 2. Try parsing as a JS Object (common Firebase Console format)
      // We use Function constructor for a safer-ish eval of the object snippet
      return (new Function(`return ${sanitized}`))();
    } catch (e2) {
      throw new Error("Invalid format. Please paste valid JSON or the Firebase Config object.");
    }
  }
}

// Reset Sub-Document Selection
resetSubDocBtn.addEventListener('click', () => {
  collectionSelect.value = "";
  isDeepMode = false;
  deepLevelGroup.classList.add('hidden');
  resetSubDocBtn.style.display = 'none';
  plusIcon.classList.remove('hidden');
  backIcon.classList.add('hidden');
  toggleNewDocBtn.title = "Create New Document";
  showToast("Cleared", "Selection reset", "info");
  updateFormVisibility();
});

collectionSelect.addEventListener('change', () => {
  if (collectionSelect.value) {
    resetSubDocBtn.style.display = 'flex';
  } else {
    resetSubDocBtn.style.display = 'none';
  }
  updateFormVisibility();
});

// Smart Toggle Logic
toggleNewDocBtn.addEventListener('click', () => {
  const currentDocSelected = collectionSelect.value;

  // CASE 1: No doc selected - Toggle Level 2 mode (for regular sub-doc creation)
  if (!currentDocSelected || isNewDocMode) {
    isNewDocMode = !isNewDocMode;
    isDeepMode = false;
    deepLevelGroup.classList.add('hidden');

    if (isNewDocMode) {
      subDocSelectWrapper.classList.add('hidden');
      newDocInputWrapper.classList.remove('hidden');
      plusIcon.classList.add('hidden');
      backIcon.classList.remove('hidden');
      toggleNewDocBtn.title = "Back to selection";
      newDocumentIdInput.focus();
    } else {
      subDocSelectWrapper.classList.remove('hidden');
      newDocInputWrapper.classList.add('hidden');
      plusIcon.classList.remove('hidden');
      backIcon.classList.add('hidden');
      toggleNewDocBtn.title = "Create New Document";
    }
    updateFormVisibility();
  } 
  // CASE 2: Doc IS selected - Toggle Level 3 mode (Deep Selection / Sub-Collection)
  else {
    isDeepMode = !isDeepMode;

    if (isDeepMode) {
      deepLevelGroup.classList.remove('hidden');
      plusIcon.classList.add('hidden');
      backIcon.classList.remove('hidden');
      toggleNewDocBtn.title = "Back to normal save";
      subCollectionIdInput.focus();
    } else {
      deepLevelGroup.classList.add('hidden');
      plusIcon.classList.remove('hidden');
      backIcon.classList.add('hidden');
      toggleNewDocBtn.title = "Create Sub-Collection";
      subCollectionIdInput.value = '';
    }
  }
});

settingsToggle.addEventListener('click', () => {
  showSettings(true);
});

closeSettingsBtn.addEventListener('click', () => {
  showSettings(false);
});

// Close modal when clicking outside
settingsOverlay.addEventListener('click', (e) => {
  if (e.target === settingsOverlay) {
    showSettings(false);
  }
});

saveSettingsBtn.addEventListener('click', async () => {
  const configStr = firebaseConfigInput.value.trim();
  const masterCol = masterCollectionInput.value.trim();

  if (!configStr || !masterCol) {
    showToast("Incomplete", "Please provide both config and master collection.", "error");
    return;
  }

  let fbConfig;
  try {
    fbConfig = parseConfigInput(configStr);
  } catch (e) {
    showToast("Invalid Format", e.message, "error");
    return;
  }

  saveSettings(fbConfig, masterCol);
  const success = await initFirebase();
  if (success) {
    showToast("Connected", "Settings saved and Firebase initialized.", "success");
  }
});

clearCacheBtn.addEventListener('click', () => {
  if (confirm("Are you sure you want to clear all settings? This will reload the page.")) {
    localStorage.removeItem('firebase_db_writer_config');
    window.location.reload();
  }
});

mainCollectionSelect.addEventListener('change', () => {
  loadCollections();
  updateFormVisibility();
});

viewAllDataBtn.addEventListener('click', showFullCollectionData);
closeDataModalBtn.addEventListener('click', () => {
    dataModalOverlay.classList.add('hidden');
});

dataModalOverlay.addEventListener('click', (e) => {
    if (e.target === dataModalOverlay) {
        dataModalOverlay.classList.add('hidden');
    }
});

jsonInput.addEventListener('input', () => {
  jsonError.classList.remove('visible');
  jsonInput.style.borderColor = "rgba(255, 255, 255, 0.1)";
});

saveBtn.addEventListener('click', async () => {
  jsonError.classList.remove('visible');

  const mainCollection = mainCollectionSelect.value;
  let subDocName, subColName, deepDocId;

  if (isNewDocMode) {
    subDocName = newDocumentIdInput.value.trim();
  } else {
    subDocName = collectionSelect.value;
  }

  if (isDeepMode) {
    subColName = subCollectionIdInput.value.trim();
    deepDocId = deepDocIdInput.value.trim();
  }

  const jsonString = jsonInput.value.trim();

  if (!subDocName || !jsonString) {
    showError("Please select a document and enter valid JSON.");
    return;
  }

  if (isDeepMode && !subColName) {
    showError("Please enter a Sub-Collection name.");
    return;
  }

  try {
    const parsedData = JSON.parse(jsonString);
    
    // In deep mode, check if we have a valid ID (from input or JSON)
    if (isDeepMode) {
      const tempId = deepDocId || parsedData.id || parsedData.word || parsedData.expression;
      if (!tempId) {
        showError("Document ID is required for sub-collections. Please enter one or add 'id' to your JSON.");
        return;
      }
    }
    
    // Save with the relative context
    await saveDocument(subDocName, subColName, deepDocId, parsedData);
  } catch (e) {
    showError("Invalid JSON: " + e.message);
  }
});

// =========================================================
// 💅 UI HELPERS
// =========================================================
function showError(msg) {
  jsonError.textContent = msg;
  jsonError.classList.add('visible');
  jsonInput.style.borderColor = "var(--error-border)";
}

function setLoading(isLoading) {
  saveBtn.disabled = isLoading;
  if (isLoading) {
    btnText.classList.add('hidden');
    loader.classList.remove('hidden');
  } else {
    btnText.classList.remove('hidden');
    loader.classList.add('hidden');
  }
}

function showToast(title, message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? '✅' : '⚠️';
  toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <span class="toast-title">${title}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove());
  }, 4000);
}

function triggerCelebration() {
  const container = document.body;
  const particleCount = 40;
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#f8fafc'];

  for (let i = 0; i < particleCount; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    
    // Position at center of screen
    sparkle.style.left = '50%';
    sparkle.style.top = '50%';
    
    // Randomize trajectory
    const angle = Math.random() * Math.PI * 2;
    const distance = 100 + Math.random() * 300;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    
    sparkle.style.setProperty('--x', `${x}px`);
    sparkle.style.setProperty('--y', `${y}px`);
    
    // Randomize color and size
    sparkle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    const size = 4 + Math.random() * 6;
    sparkle.style.width = `${size}px`;
    sparkle.style.height = `${size}px`;
    
    // Randomize delay
    sparkle.style.animationDelay = `${Math.random() * 0.2}s`;

    container.appendChild(sparkle);

    // Clean up
    sparkle.addEventListener('animationend', () => {
      sparkle.remove();
    });
  }
}

// =========================================================
// 🚀 BOOTSTRAP
// =========================================================
if (loadSettings()) {
  initFirebase();
} else {
  showSettings(true);
}
