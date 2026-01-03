// IndexedDB wrapper for offline-first data storage
class OfflineDB {
  constructor() {
    this.dbName = 'TreeSurveyOfflineDB';
    this.version = 2; // Upgraded to v2 for new schema
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores for actual data entities
        if (!db.objectStoreNames.contains('projects')) {
          const store = db.createObjectStore('projects', { keyPath: 'id' });
          store.createIndex('sync_status', 'sync_status', { unique: false });
        }

        if (!db.objectStoreNames.contains('sections')) {
          const store = db.createObjectStore('sections', { keyPath: 'id' });
          store.createIndex('project_id', 'project_id', { unique: false });
          store.createIndex('sync_status', 'sync_status', { unique: false });
        }

        if (!db.objectStoreNames.contains('groups')) {
          const store = db.createObjectStore('groups', { keyPath: 'id' });
          store.createIndex('section_id', 'section_id', { unique: false });
          store.createIndex('sync_status', 'sync_status', { unique: false });
        }

        if (!db.objectStoreNames.contains('trees')) {
          const store = db.createObjectStore('trees', { keyPath: 'id' });
          store.createIndex('group_id', 'group_id', { unique: false });
          store.createIndex('sync_status', 'sync_status', { unique: false });
        }

        // Keep sync metadata store
        if (!db.objectStoreNames.contains('syncMetadata')) {
          db.createObjectStore('syncMetadata', { keyPath: 'key' });
        }
      };
    });
  }

  // ========== LOCAL ID GENERATION ==========

  generateLocalId(entity) {
    return `local_${entity}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  isLocalId(id) {
    return typeof id === 'string' && id.startsWith('local_');
  }

  // ========== PROJECTS ==========

  async saveProject(project) {
    const transaction = this.db.transaction(['projects'], 'readwrite');
    const store = transaction.objectStore('projects');

    const projectData = {
      ...project,
      sync_status: project.sync_status || 'local_only',
      modified_at: Date.now()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(projectData);
      request.onsuccess = () => resolve(projectData);
      request.onerror = () => reject(request.error);
    });
  }

  async getProject(id) {
    const transaction = this.db.transaction(['projects'], 'readonly');
    const store = transaction.objectStore('projects');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllProjects() {
    const transaction = this.db.transaction(['projects'], 'readonly');
    const store = transaction.objectStore('projects');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProject(id) {
    const transaction = this.db.transaction(['projects'], 'readwrite');
    const store = transaction.objectStore('projects');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ========== SECTIONS ==========

  async saveSection(section) {
    const transaction = this.db.transaction(['sections'], 'readwrite');
    const store = transaction.objectStore('sections');

    const sectionData = {
      ...section,
      sync_status: section.sync_status || 'local_only',
      modified_at: Date.now()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(sectionData);
      request.onsuccess = () => resolve(sectionData);
      request.onerror = () => reject(request.error);
    });
  }

  async getSection(id) {
    const transaction = this.db.transaction(['sections'], 'readonly');
    const store = transaction.objectStore('sections');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllSections() {
    const transaction = this.db.transaction(['sections'], 'readonly');
    const store = transaction.objectStore('sections');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getSectionsByProject(projectId) {
    const transaction = this.db.transaction(['sections'], 'readonly');
    const store = transaction.objectStore('sections');
    const index = store.index('project_id');

    return new Promise((resolve, reject) => {
      const request = index.getAll(projectId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSection(id) {
    const transaction = this.db.transaction(['sections'], 'readwrite');
    const store = transaction.objectStore('sections');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ========== GROUPS ==========

  async saveGroup(group) {
    const transaction = this.db.transaction(['groups'], 'readwrite');
    const store = transaction.objectStore('groups');

    const groupData = {
      ...group,
      sync_status: group.sync_status || 'local_only',
      modified_at: Date.now()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(groupData);
      request.onsuccess = () => resolve(groupData);
      request.onerror = () => reject(request.error);
    });
  }

  async getGroup(id) {
    const transaction = this.db.transaction(['groups'], 'readonly');
    const store = transaction.objectStore('groups');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllGroups() {
    const transaction = this.db.transaction(['groups'], 'readonly');
    const store = transaction.objectStore('groups');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getGroupsBySection(sectionId) {
    const transaction = this.db.transaction(['groups'], 'readonly');
    const store = transaction.objectStore('groups');
    const index = store.index('section_id');

    return new Promise((resolve, reject) => {
      const request = index.getAll(sectionId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteGroup(id) {
    const transaction = this.db.transaction(['groups'], 'readwrite');
    const store = transaction.objectStore('groups');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ========== TREES ==========

  async saveTree(tree) {
    const transaction = this.db.transaction(['trees'], 'readwrite');
    const store = transaction.objectStore('trees');

    const treeData = {
      ...tree,
      sync_status: tree.sync_status || 'local_only',
      modified_at: Date.now()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(treeData);
      request.onsuccess = () => resolve(treeData);
      request.onerror = () => reject(request.error);
    });
  }

  async getTree(id) {
    const transaction = this.db.transaction(['trees'], 'readonly');
    const store = transaction.objectStore('trees');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllTrees() {
    const transaction = this.db.transaction(['trees'], 'readonly');
    const store = transaction.objectStore('trees');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getTreesByGroup(groupId) {
    const transaction = this.db.transaction(['trees'], 'readonly');
    const store = transaction.objectStore('trees');
    const index = store.index('group_id');

    return new Promise((resolve, reject) => {
      const request = index.getAll(groupId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteTree(id) {
    const transaction = this.db.transaction(['trees'], 'readwrite');
    const store = transaction.objectStore('trees');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ========== SYNC OPERATIONS ==========

  async getUnsyncedItems() {
    const [projects, sections, groups, trees] = await Promise.all([
      this.getAllProjects(),
      this.getAllSections(),
      this.getAllGroups(),
      this.getAllTrees()
    ]);

    return {
      projects: projects.filter(p => p.sync_status === 'local_only' || p.sync_status === 'modified'),
      sections: sections.filter(s => s.sync_status === 'local_only' || s.sync_status === 'modified'),
      groups: groups.filter(g => g.sync_status === 'local_only' || g.sync_status === 'modified'),
      trees: trees.filter(t => t.sync_status === 'local_only' || t.sync_status === 'modified')
    };
  }

  async getUnsyncedCount() {
    const unsynced = await this.getUnsyncedItems();
    return unsynced.projects.length + unsynced.sections.length +
           unsynced.groups.length + unsynced.trees.length;
  }

  async updateIdMapping(oldId, newId, entity) {
    // Store ID mapping for relationship updates
    const transaction = this.db.transaction(['syncMetadata'], 'readwrite');
    const store = transaction.objectStore('syncMetadata');

    const mapping = {
      key: `id_map_${entity}_${oldId}`,
      oldId,
      newId,
      entity,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(mapping);
      request.onsuccess = () => resolve(mapping);
      request.onerror = () => reject(request.error);
    });
  }

  async getIdMapping(oldId, entity) {
    const transaction = this.db.transaction(['syncMetadata'], 'readonly');
    const store = transaction.objectStore('syncMetadata');
    const key = `id_map_${entity}_${oldId}`;

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.newId : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ========== SYNC METADATA ==========

  async setLastSyncTime() {
    const transaction = this.db.transaction(['syncMetadata'], 'readwrite');
    const store = transaction.objectStore('syncMetadata');

    const metadata = {
      key: 'last_sync',
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(metadata);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getLastSyncTime() {
    const transaction = this.db.transaction(['syncMetadata'], 'readonly');
    const store = transaction.objectStore('syncMetadata');

    return new Promise((resolve, reject) => {
      const request = store.get('last_sync');
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.timestamp : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ========== UTILITY ==========

  async clearAll() {
    const stores = ['projects', 'sections', 'groups', 'trees', 'syncMetadata'];
    const transaction = this.db.transaction(stores, 'readwrite');

    const promises = stores.map(storeName => {
      const store = transaction.objectStore(storeName);
      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    return Promise.all(promises);
  }
}

// Create singleton instance
const offlineDB = new OfflineDB();

// Note: Database is initialized explicitly in app.js during DOMContentLoaded
// to ensure proper timing with data loading
