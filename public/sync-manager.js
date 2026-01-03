// Sync Manager for Offline-First Architecture
class SyncManager {
  constructor() {
    this.syncing = false;
    this.syncResults = {
      success: [],
      failed: []
    };
  }

  // Update sync badge count
  async updateSyncBadge() {
    try {
      const count = await offlineDB.getUnsyncedCount();
      const syncButton = document.getElementById('syncButton');
      const syncBadge = document.getElementById('syncBadge');

      if (count > 0) {
        syncButton.classList.remove('hidden');
        syncBadge.textContent = count;
      } else {
        syncButton.classList.add('hidden');
      }
    } catch (error) {
      console.error('Error updating sync badge:', error);
    }
  }

  // Main sync function
  async syncToServer() {
    if (this.syncing) {
      alert('Sync already in progress');
      return;
    }

    if (!navigator.onLine) {
      alert('Cannot sync while offline. Please connect to the internet.');
      return;
    }

    this.syncing = true;
    this.syncResults = { success: [], failed: [] };

    const syncButton = document.getElementById('syncButton');
    syncButton.classList.add('syncing');
    syncButton.disabled = true;

    try {
      const unsynced = await offlineDB.getUnsyncedItems();
      const totalItems = unsynced.projects.length + unsynced.sections.length +
                        unsynced.groups.length + unsynced.trees.length;

      if (totalItems === 0) {
        alert('Nothing to sync!');
        return;
      }

      console.log('Starting sync:', totalItems, 'items');

      // Sync in hierarchical order: Projects → Sections → Groups → Trees
      await this.syncProjects(unsynced.projects);
      await this.syncSections(unsynced.sections);
      await this.syncGroups(unsynced.groups);
      await this.syncTrees(unsynced.trees);

      // Update last sync time
      await offlineDB.setLastSyncTime();

      // Show results
      const successCount = this.syncResults.success.length;
      const failedCount = this.syncResults.failed.length;

      if (failedCount === 0) {
        alert(`Sync complete! ${successCount} items uploaded successfully.`);
      } else {
        alert(`Sync completed with errors.\n${successCount} succeeded, ${failedCount} failed.\nCheck console for details.`);
        console.error('Failed syncs:', this.syncResults.failed);
      }

      // Reload data from IndexedDB
      await loadAllDataFromLocal();

    } catch (error) {
      console.error('Sync error:', error);
      alert('Sync failed: ' + error.message);
    } finally {
      this.syncing = false;
      syncButton.classList.remove('syncing');
      syncButton.disabled = false;
      await this.updateSyncBadge();
    }
  }

  async syncProjects(projects) {
    for (const project of projects) {
      try {
        const isLocal = offlineDB.isLocalId(project.id);

        if (isLocal) {
          // Create new project on server
          const response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: project.name,
              wd_number: project.wd_number,
              work_type: project.work_type
            })
          });

          if (!response.ok) throw new Error(`Server returned ${response.status}`);

          const serverProject = await response.json();

          // Store ID mapping
          await offlineDB.updateIdMapping(project.id, serverProject.id, 'project');

          // Update local record with server ID and mark as synced
          await offlineDB.deleteProject(project.id);
          await offlineDB.saveProject({
            ...serverProject,
            sync_status: 'synced'
          });

          // Update all child sections' project_id
          await this.updateChildReferences(project.id, serverProject.id, 'section', 'project_id');

          this.syncResults.success.push({ type: 'project', id: project.id, newId: serverProject.id });
          console.log(`✓ Synced project: ${project.id} → ${serverProject.id}`);

        } else {
          // Update existing project
          const response = await fetch(`/api/projects/${project.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: project.name,
              wd_number: project.wd_number,
              work_type: project.work_type
            })
          });

          if (!response.ok) throw new Error(`Server returned ${response.status}`);

          const serverProject = await response.json();

          await offlineDB.saveProject({
            ...serverProject,
            sync_status: 'synced'
          });

          this.syncResults.success.push({ type: 'project', id: project.id });
          console.log(`✓ Updated project: ${project.id}`);
        }

      } catch (error) {
        console.error(`Failed to sync project ${project.id}:`, error);
        this.syncResults.failed.push({ type: 'project', id: project.id, error: error.message });
      }
    }
  }

  async syncSections(sections) {
    for (const section of sections) {
      try {
        const isLocal = offlineDB.isLocalId(section.id);

        // Resolve parent project ID if it was mapped
        let projectId = section.project_id;
        if (offlineDB.isLocalId(projectId)) {
          const mappedId = await offlineDB.getIdMapping(projectId, 'project');
          if (mappedId) projectId = mappedId;
        }

        if (isLocal) {
          const response = await fetch('/api/sections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              project_id: projectId,
              name: section.name,
              section_number: section.section_number,
              description: section.description
            })
          });

          if (!response.ok) throw new Error(`Server returned ${response.status}`);

          const serverSection = await response.json();

          await offlineDB.updateIdMapping(section.id, serverSection.id, 'section');

          await offlineDB.deleteSection(section.id);
          await offlineDB.saveSection({
            ...serverSection,
            sync_status: 'synced'
          });

          await this.updateChildReferences(section.id, serverSection.id, 'group', 'section_id');

          this.syncResults.success.push({ type: 'section', id: section.id, newId: serverSection.id });
          console.log(`✓ Synced section: ${section.id} → ${serverSection.id}`);

        } else {
          const response = await fetch(`/api/sections/${section.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              project_id: projectId,
              name: section.name,
              section_number: section.section_number,
              description: section.description
            })
          });

          if (!response.ok) throw new Error(`Server returned ${response.status}`);

          const serverSection = await response.json();

          await offlineDB.saveSection({
            ...serverSection,
            sync_status: 'synced'
          });

          this.syncResults.success.push({ type: 'section', id: section.id });
          console.log(`✓ Updated section: ${section.id}`);
        }

      } catch (error) {
        console.error(`Failed to sync section ${section.id}:`, error);
        this.syncResults.failed.push({ type: 'section', id: section.id, error: error.message });
      }
    }
  }

  async syncGroups(groups) {
    for (const group of groups) {
      try {
        const isLocal = offlineDB.isLocalId(group.id);

        let sectionId = group.section_id;
        if (offlineDB.isLocalId(sectionId)) {
          const mappedId = await offlineDB.getIdMapping(sectionId, 'section');
          if (mappedId) sectionId = mappedId;
        }

        if (isLocal) {
          const response = await fetch('/api/groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              section_id: sectionId,
              name: group.name,
              circuit_number: group.circuit_number,
              section_number: group.section_number,
              id_number: group.id_number,
              address: group.address,
              comments: group.comments,
              brush_amount: group.brush_amount,
              cutting_equipment: group.cutting_equipment,
              cleanup_equipment: group.cleanup_equipment,
              customer_notification: group.customer_notification
            })
          });

          if (!response.ok) throw new Error(`Server returned ${response.status}`);

          const serverGroup = await response.json();

          await offlineDB.updateIdMapping(group.id, serverGroup.id, 'group');

          await offlineDB.deleteGroup(group.id);
          await offlineDB.saveGroup({
            ...serverGroup,
            sync_status: 'synced'
          });

          await this.updateChildReferences(group.id, serverGroup.id, 'tree', 'group_id');

          this.syncResults.success.push({ type: 'group', id: group.id, newId: serverGroup.id });
          console.log(`✓ Synced group: ${group.id} → ${serverGroup.id}`);

        } else {
          const response = await fetch(`/api/groups/${group.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              section_id: sectionId,
              name: group.name,
              circuit_number: group.circuit_number,
              section_number: group.section_number,
              id_number: group.id_number,
              address: group.address,
              comments: group.comments,
              brush_amount: group.brush_amount,
              cutting_equipment: group.cutting_equipment,
              cleanup_equipment: group.cleanup_equipment,
              customer_notification: group.customer_notification,
              completed: group.completed
            })
          });

          if (!response.ok) throw new Error(`Server returned ${response.status}`);

          const serverGroup = await response.json();

          await offlineDB.saveGroup({
            ...serverGroup,
            sync_status: 'synced'
          });

          this.syncResults.success.push({ type: 'group', id: group.id });
          console.log(`✓ Updated group: ${group.id}`);
        }

      } catch (error) {
        console.error(`Failed to sync group ${group.id}:`, error);
        this.syncResults.failed.push({ type: 'group', id: group.id, error: error.message });
      }
    }
  }

  async syncTrees(trees) {
    for (const tree of trees) {
      try {
        const isLocal = offlineDB.isLocalId(tree.id);

        let groupId = tree.group_id;
        if (offlineDB.isLocalId(groupId)) {
          const mappedId = await offlineDB.getIdMapping(groupId, 'group');
          if (mappedId) groupId = mappedId;
        }

        if (isLocal) {
          const response = await fetch('/api/trees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              group_id: groupId,
              latitude: tree.latitude,
              longitude: tree.longitude,
              species: tree.species,
              diameter: tree.diameter,
              tree_type: tree.tree_type,
              action: tree.action,
              health_condition: tree.health_condition,
              canopy_removal: tree.canopy_removal,
              notes: tree.notes,
              refusal: tree.refusal,
              refusal_reason: tree.refusal_reason
            })
          });

          if (!response.ok) throw new Error(`Server returned ${response.status}`);

          const serverTree = await response.json();

          await offlineDB.deleteTree(tree.id);
          await offlineDB.saveTree({
            ...serverTree,
            sync_status: 'synced'
          });

          this.syncResults.success.push({ type: 'tree', id: tree.id, newId: serverTree.id });
          console.log(`✓ Synced tree: ${tree.id} → ${serverTree.id}`);

        } else {
          const response = await fetch(`/api/trees/${tree.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              group_id: groupId,
              latitude: tree.latitude,
              longitude: tree.longitude,
              species: tree.species,
              diameter: tree.diameter,
              tree_type: tree.tree_type,
              action: tree.action,
              health_condition: tree.health_condition,
              canopy_removal: tree.canopy_removal,
              notes: tree.notes,
              refusal: tree.refusal,
              refusal_reason: tree.refusal_reason
            })
          });

          if (!response.ok) throw new Error(`Server returned ${response.status}`);

          const serverTree = await response.json();

          await offlineDB.saveTree({
            ...serverTree,
            sync_status: 'synced'
          });

          this.syncResults.success.push({ type: 'tree', id: tree.id });
          console.log(`✓ Updated tree: ${tree.id}`);
        }

      } catch (error) {
        console.error(`Failed to sync tree ${tree.id}:`, error);
        this.syncResults.failed.push({ type: 'tree', id: tree.id, error: error.message });
      }
    }
  }

  // Update child references after parent ID mapping
  async updateChildReferences(oldId, newId, childEntity, foreignKeyField) {
    let children;

    switch (childEntity) {
      case 'section':
        children = await offlineDB.getAllSections();
        break;
      case 'group':
        children = await offlineDB.getAllGroups();
        break;
      case 'tree':
        children = await offlineDB.getAllTrees();
        break;
      default:
        return;
    }

    const toUpdate = children.filter(child => child[foreignKeyField] === oldId);

    for (const child of toUpdate) {
      child[foreignKeyField] = newId;

      switch (childEntity) {
        case 'section':
          await offlineDB.saveSection(child);
          break;
        case 'group':
          await offlineDB.saveGroup(child);
          break;
        case 'tree':
          await offlineDB.saveTree(child);
          break;
      }
    }

    if (toUpdate.length > 0) {
      console.log(`Updated ${toUpdate.length} ${childEntity} references: ${oldId} → ${newId}`);
    }
  }
}

// Create singleton instance
const syncManager = new SyncManager();
