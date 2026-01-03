# Offline-First Implementation Status

## ✅ Completed

### 1. Enhanced IndexedDB Module (`offline-db.js`)
- **Version 2** with new schema
- Stores all entities: projects, sections, groups, trees
- Local ID generation system (`generateLocalId()`, `isLocalId()`)
- Sync status tracking (`local_only`, `modified`, `synced`)
- ID mapping for relationship updates
- CRUD operations for all entities
- Sync helpers: `getUnsyncedItems()`, `getUnsyncedCount()`

### 2. Sync Manager (`sync-manager.js`)
- Complete batch sync system
- Hierarchical sync: Projects → Sections → Groups → Trees
- ID remapping with relationship updates
- Progress tracking and error handling
- Sync badge management
- Visual feedback (syncing state)

### 3. UI Components
**HTML:**
- Sync button with badge counter in header
- Upload icon and text
- Hidden by default, shows when items need sync

**CSS:**
- Green sync button styling
- Badge with count
- Syncing state (yellow, rotating icon)
- Hover effects and transitions

## 🔨 In Progress

### 4. App.js Integration
Need to modify app.js to work offline-first. This is a large change that involves:

#### Required Changes:

**A. Initialize Sync Manager**
```javascript
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    registerServiceWorker();
    initializeOfflineFirst(); // NEW
});

function initializeOfflineFirst() {
    // Set up sync button
    document.getElementById('syncButton').addEventListener('click', () => {
        syncManager.syncToServer();
    });

    // Update sync badge periodically
    setInterval(() => {
        syncManager.updateSyncBadge();
    }, 5000);

    // Initial badge update
    syncManager.updateSyncBadge();
}
```

**B. Load Data from IndexedDB First**
```javascript
async function loadProjects() {
    try {
        // Try to load from IndexedDB first
        const localProjects = await offlineDB.getAllProjects();

        if (localProjects.length > 0) {
            projects = localProjects;
            renderProjects();
        }

        // Then fetch from server if online
        if (navigator.onLine) {
            const response = await fetch('/api/projects');
            if (response.ok) {
                const serverProjects = await response.json();

                // Merge with local data
                await mergeProjects(serverProjects);
            }
        }
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}
```

**C. Modify Save Functions to Store Locally**

Current handleProjectSubmit:
```javascript
async function handleProjectSubmit(e) {
    e.preventDefault();

    const projectData = {
        name: document.getElementById('projectName').value,
        wd_number: document.getElementById('wdNumber').value,
        work_type: document.getElementById('workType').value
    };

    const projectId = document.getElementById('projectId').value;

    // If offline, queue the operation
    if (!isOnline) {
        await offlineDB.addPendingOperation({...});
        alert('You are offline...');
        return;
    }

    // Otherwise save to server...
}
```

New offline-first handleProjectSubmit:
```javascript
async function handleProjectSubmit(e) {
    e.preventDefault();

    const projectData = {
        name: document.getElementById('projectName').value,
        wd_number: document.getElementById('wdNumber').value,
        work_type: document.getElementById('workType').value
    };

    const projectId = document.getElementById('projectId').value;
    let savedProject;

    if (projectId) {
        // UPDATE existing
        const existing = await offlineDB.getProject(projectId);

        savedProject = {
            ...existing,
            ...projectData,
            sync_status: offlineDB.isLocalId(projectId) ? 'local_only' : 'modified'
        };

        await offlineDB.saveProject(savedProject);

    } else {
        // CREATE new
        const localId = offlineDB.generateLocalId('project');

        savedProject = {
            id: localId,
            ...projectData,
            sync_status: 'local_only',
            created_at: new Date().toISOString()
        };

        await offlineDB.saveProject(savedProject);
        projects.push(savedProject);
    }

    // Update UI immediately
    renderProjects();
    showProjectDetail(savedProject.id);

    // Update sync badge
    await syncManager.updateSyncBadge();

    alert('Project saved locally! Click Sync button to upload to server.');
}
```

**Same pattern for:**
- `handleSectionSubmit()`
- `handleGroupSubmit()`
- `handleTreeSubmit()`

**D. Global Load Function**
```javascript
async function loadAllDataFromLocal() {
    projects = await offlineDB.getAllProjects();
    sections = await offlineDB.getAllSections();
    groups = await offlineDB.getAllGroups();
    trees = await offlineDB.getAllTrees();

    renderProjects(); // Refresh UI
}
```

**E. Merge Server Data**
```javascript
async function mergeProjects(serverProjects) {
    for (const serverProject of serverProjects) {
        // Check if we have it locally
        const local = await offlineDB.getProject(serverProject.id);

        if (!local) {
            // New from server, save it
            await offlineDB.saveProject({
                ...serverProject,
                sync_status: 'synced'
            });
        } else if (local.sync_status === 'synced') {
            // Update our local copy if it was already synced
            await offlineDB.saveProject({
                ...serverProject,
                sync_status: 'synced'
            });
        }
        // If local.sync_status === 'modified', keep local version
    }

    // Reload from IndexedDB
    await loadAllDataFromLocal();
}
```

## 📋 Implementation Plan

### Phase 1: Basic Structure (DONE)
- ✅ Enhanced IndexedDB module
- ✅ Sync Manager
- ✅ UI components (sync button, CSS)

### Phase 2: App.js Integration (CURRENT)
This is complex because app.js is ~1500 lines. We need to:

1. **Remove old offline queue code** (the one that queued operations)
2. **Add loadAllDataFromLocal()** function
3. **Modify load functions** to read from IndexedDB
4. **Modify save functions** to save locally first
5. **Add merge functions** for server data
6. **Initialize sync button** handler

### Phase 3: Testing
1. Test creating project/section/group/tree offline
2. Verify local IDs generated
3. Check sync badge updates
4. Test sync to server
5. Verify ID remapping
6. Test editing synced items

### Phase 4: Polish
1. Add visual indicators (unsync icon next to items)
2. Improve error messages
3. Add sync progress dialog
4. Handle edge cases

## 🎯 Current Next Step

I should create a simplified integration that:
1. Removes the old offline queue approach from app.js
2. Adds the new offline-first save handlers
3. Tests with just TREES first (simplest entity)
4. Then roll out to groups, sections, projects

This incremental approach is safer than rewriting everything at once.

## Questions to Consider

1. **When to auto-fetch from server?**
   - On app load if online?
   - Only when user manually refreshes?
   - Current approach: Load local first, then fetch and merge from server

2. **What if user edits while offline, then server has newer version?**
   - Current approach: Local changes marked as 'modified', preserved during merge
   - Need to decide: last-write-wins or prompt user?

3. **Should we sync automatically when online?**
   - Current approach: Manual sync only (user clicks button)
   - Could add auto-sync option later

4. **How to handle deletes?**
   - Current approach: Not fully implemented yet
   - Need to track deleted items and sync deletions

## Files Modified So Far

1. ✅ `public/offline-db.js` - Complete rewrite for v2
2. ✅ `public/sync-manager.js` - NEW file
3. ✅ `public/index.html` - Added sync button and script tag
4. ✅ `public/styles.css` - Added sync button styles
5. ⏳ `public/app.js` - PENDING major modifications

## Estimated Remaining Work

- **App.js integration:** 2-3 hours
- **Testing and debugging:** 1-2 hours
- **Polish and edge cases:** 1 hour

**Total:** 4-6 hours of development time

Would recommend breaking into smaller commits:
1. Commit sync manager + UI (done)
2. Commit tree offline-first (test)
3. Commit group offline-first (test)
4. Commit section offline-first (test)
5. Commit project offline-first (test)
6. Final polish commit
