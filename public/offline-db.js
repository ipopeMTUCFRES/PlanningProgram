// IndexedDB wrapper for offline data storage
class OfflineDB {
  constructor() {
    this.dbName = 'TreeSurveyOfflineDB';
    this.version = 1;
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

        // Create object store for pending operations
        if (!db.objectStoreNames.contains('pendingOperations')) {
          const store = db.createObjectStore('pendingOperations', {
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('entity', 'entity', { unique: false });
        }

        // Create object store for offline cache of data
        if (!db.objectStoreNames.contains('offlineCache')) {
          const cache = db.createObjectStore('offlineCache', {
            keyPath: 'key'
          });
          cache.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }
      };
    });
  }

  // Add a pending operation to the queue
  async addPendingOperation(operation) {
    const transaction = this.db.transaction(['pendingOperations'], 'readwrite');
    const store = transaction.objectStore('pendingOperations');

    const data = {
      ...operation,
      timestamp: Date.now(),
      status: 'pending'
    };

    return new Promise((resolve, reject) => {
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all pending operations
  async getPendingOperations() {
    const transaction = this.db.transaction(['pendingOperations'], 'readonly');
    const store = transaction.objectStore('pendingOperations');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get pending operations by type (create, update, delete)
  async getPendingOperationsByType(type) {
    const transaction = this.db.transaction(['pendingOperations'], 'readonly');
    const store = transaction.objectStore('pendingOperations');
    const index = store.index('type');

    return new Promise((resolve, reject) => {
      const request = index.getAll(type);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get pending operations by entity (project, section, group, tree)
  async getPendingOperationsByEntity(entity) {
    const transaction = this.db.transaction(['pendingOperations'], 'readonly');
    const store = transaction.objectStore('pendingOperations');
    const index = store.index('entity');

    return new Promise((resolve, reject) => {
      const request = index.getAll(entity);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Remove a pending operation after successful sync
  async removePendingOperation(id) {
    const transaction = this.db.transaction(['pendingOperations'], 'readwrite');
    const store = transaction.objectStore('pendingOperations');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Update operation status
  async updateOperationStatus(id, status) {
    const transaction = this.db.transaction(['pendingOperations'], 'readwrite');
    const store = transaction.objectStore('pendingOperations');

    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.status = status;
          const updateRequest = store.put(data);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Operation not found'));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Cache data for offline access
  async cacheData(key, data) {
    const transaction = this.db.transaction(['offlineCache'], 'readwrite');
    const store = transaction.objectStore('offlineCache');

    const cacheEntry = {
      key,
      data,
      lastUpdated: Date.now()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(cacheEntry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get cached data
  async getCachedData(key) {
    const transaction = this.db.transaction(['offlineCache'], 'readonly');
    const store = transaction.objectStore('offlineCache');

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all pending operations (use after successful sync)
  async clearAllPendingOperations() {
    const transaction = this.db.transaction(['pendingOperations'], 'readwrite');
    const store = transaction.objectStore('pendingOperations');

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get count of pending operations
  async getPendingCount() {
    const transaction = this.db.transaction(['pendingOperations'], 'readonly');
    const store = transaction.objectStore('pendingOperations');

    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Create singleton instance
const offlineDB = new OfflineDB();

// Initialize when script loads
offlineDB.init().catch(err => {
  console.error('Failed to initialize offline database:', err);
});
