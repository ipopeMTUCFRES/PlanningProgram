let projects = [];
let sections = [];
let groups = [];
let trees = [];
let currentProjectId = null;
let currentSectionId = null;
let currentGroupId = null;
let treeMap = null;
let auditMap = null;
let currentMode = 'entry';

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    registerServiceWorker();
});

// Register Service Worker for PWA functionality
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration.scope);

                // Check for updates periodically
                setInterval(() => {
                    registration.update();
                }, 60000); // Check every minute
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
}

function initializeApp() {
    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️ Light Mode';
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            themeToggle.textContent = '☀️ Light Mode';
            localStorage.setItem('theme', 'dark');
        } else {
            themeToggle.textContent = '🌙 Dark Mode';
            localStorage.setItem('theme', 'light');
        }
    });

    // Projects
    document.getElementById('createNewProjectBtn').addEventListener('click', () => showProjectDetail(null));
    document.getElementById('backToProjectsBtn').addEventListener('click', showProjectsList);
    document.getElementById('projectForm').addEventListener('submit', handleProjectSubmit);
    document.getElementById('deleteProjectBtn').addEventListener('click', handleDeleteProject);

    // Sections
    document.getElementById('createNewSectionBtn').addEventListener('click', () => showSectionDetail(null));
    document.getElementById('backToSectionsBtn').addEventListener('click', () => showProjectDetail(currentProjectId));
    document.getElementById('sectionForm').addEventListener('submit', handleSectionSubmit);
    document.getElementById('exportSectionBtn').addEventListener('click', exportSectionToExcel);
    document.getElementById('deleteSectionBtn').addEventListener('click', handleDeleteSection);

    // Groups
    document.getElementById('createNewGroupBtn').addEventListener('click', () => showGroupDetail(null));
    document.getElementById('backToGroupsBtn').addEventListener('click', () => showSectionDetail(currentSectionId));
    document.getElementById('groupForm').addEventListener('submit', handleGroupSubmit);
    document.getElementById('deleteGroupBtn').addEventListener('click', handleDeleteGroup);
    document.getElementById('createAnotherGroupBtn').addEventListener('click', () => showGroupDetail(null));

    // Trees
    document.getElementById('treeForm').addEventListener('submit', handleTreeSubmit);
    document.getElementById('getLocationBtn').addEventListener('click', getCurrentLocation);
    document.getElementById('cancelEditTreeBtn').addEventListener('click', cancelEditTree);

    // Mode Switching
    document.getElementById('entryModeBtn').addEventListener('click', () => switchMode('entry'));
    document.getElementById('crewModeBtn').addEventListener('click', () => switchMode('crew'));
    document.getElementById('auditModeBtn').addEventListener('click', () => switchMode('audit'));

    // Crew Mode
    document.getElementById('backToCrewProjectsBtn').addEventListener('click', showCrewProjects);
    document.getElementById('backToCrewSectionsBtn').addEventListener('click', () => showCrewSections(currentProjectId));
    document.getElementById('backToCrewGroupsListBtn').addEventListener('click', () => showCrewGroups(currentSectionId));
    document.getElementById('saveCrewNotesBtn').addEventListener('click', saveCrewNotes);
    document.getElementById('completeGroupBtn').addEventListener('click', handleCompleteGroup);

    // Audit Mode
    document.getElementById('backToAuditProjectsBtn').addEventListener('click', showAuditProjects);
    document.getElementById('backToAuditSectionsBtn').addEventListener('click', () => showAuditSections(currentProjectId));

    loadProjects();
    loadSections();
    loadGroups();
    loadTrees();
}

// MODE SWITCHING
function switchMode(mode) {
    currentMode = mode;

    // Update button styles
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));

    // Hide all views
    document.getElementById('projectsListView').classList.remove('active');
    document.getElementById('projectDetailView').classList.remove('active');
    document.getElementById('sectionDetailView').classList.remove('active');
    document.getElementById('groupDetailView').classList.remove('active');
    document.getElementById('crewProjectsView').classList.remove('active');
    document.getElementById('crewSectionsView').classList.remove('active');
    document.getElementById('crewGroupsView').classList.remove('active');
    document.getElementById('crewWorkView').classList.remove('active');
    document.getElementById('auditProjectsView').classList.remove('active');
    document.getElementById('auditSectionsView').classList.remove('active');
    document.getElementById('auditGroupsView').classList.remove('active');

    if (mode === 'entry') {
        document.getElementById('entryModeBtn').classList.add('active');
        showProjectsList();
    } else if (mode === 'crew') {
        document.getElementById('crewModeBtn').classList.add('active');
        showCrewProjects();
    } else if (mode === 'audit') {
        document.getElementById('auditModeBtn').classList.add('active');
        showAuditProjects();
    }
}

// PROJECT FUNCTIONS
function showProjectsList() {
    document.getElementById('projectsListView').classList.add('active');
    document.getElementById('projectDetailView').classList.remove('active');
    document.getElementById('sectionDetailView').classList.remove('active');
    document.getElementById('groupDetailView').classList.remove('active');
    currentProjectId = null;
    currentSectionId = null;
    currentGroupId = null;
    loadProjects();
}

function showProjectDetail(projectId) {
    currentProjectId = projectId;
    currentSectionId = null;
    currentGroupId = null;
    document.getElementById('projectsListView').classList.remove('active');
    document.getElementById('projectDetailView').classList.add('active');
    document.getElementById('sectionDetailView').classList.remove('active');
    document.getElementById('groupDetailView').classList.remove('active');

    if (projectId) {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            document.getElementById('projectDetailTitle').textContent = `Edit Project: ${project.name}`;
            populateProjectForm(project);
            document.getElementById('deleteProjectBtn').style.display = 'inline-block';
            document.getElementById('sectionsListSection').style.display = 'block';
            renderSectionsForProject(projectId);
        }
    } else {
        document.getElementById('projectDetailTitle').textContent = 'Create New Project';
        resetProjectForm();
        document.getElementById('deleteProjectBtn').style.display = 'none';
        document.getElementById('sectionsListSection').style.display = 'none';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function handleProjectSubmit(e) {
    e.preventDefault();

    const projectData = {
        name: document.getElementById('projectName').value,
        wd_number: document.getElementById('wdNumber').value,
        work_type: document.getElementById('workType').value
    };

    const projectId = document.getElementById('projectId').value;
    const url = projectId ? `/api/projects/${projectId}` : '/api/projects';
    const method = projectId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData)
        });

        if (response.ok) {
            const result = await response.json();

            // Optimistic update - update local state immediately
            if (projectId) {
                const index = projects.findIndex(p => p.id == projectId);
                if (index !== -1) projects[index] = result;
            } else {
                projects.push(result);
            }
            renderProjects();

            if (!projectId) {
                showProjectDetail(result.id);
            } else {
                showProjectDetail(projectId);
            }

            alert(projectId ? 'Project updated successfully!' : 'Project created successfully! You can now add groups to this project.');
        }
    } catch (error) {
        console.error('Error saving project:', error);
        alert('Error saving project');
    }
}

async function handleDeleteProject() {
    if (!currentProjectId) return;

    if (!confirm('Are you sure you want to delete this project and all its sections, groups and trees?')) {
        return;
    }

    try {
        const response = await fetch(`/api/projects/${currentProjectId}`, { method: 'DELETE' });
        if (response.ok) {
            // Optimistic update - remove from local state immediately
            projects = projects.filter(p => p.id !== currentProjectId);
            sections = sections.filter(s => s.project_id !== currentProjectId);

            // Remove all groups and trees for this project's sections
            const projectSectionIds = sections.filter(s => s.project_id === currentProjectId).map(s => s.id);
            groups = groups.filter(g => !projectSectionIds.includes(g.section_id));
            const projectGroupIds = groups.filter(g => projectSectionIds.includes(g.section_id)).map(g => g.id);
            trees = trees.filter(t => !projectGroupIds.includes(t.group_id));

            showProjectsList();
            alert('Project deleted successfully');
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        alert('Error deleting project');
    }
}

function resetProjectForm() {
    document.getElementById('projectForm').reset();
    document.getElementById('projectId').value = '';
}

function populateProjectForm(project) {
    document.getElementById('projectId').value = project.id;
    document.getElementById('projectName').value = project.name;
    document.getElementById('wdNumber').value = project.wd_number || '';
    document.getElementById('workType').value = project.work_type;
}

// SECTION FUNCTIONS
function showSectionDetail(sectionId) {
    currentSectionId = sectionId;
    currentGroupId = null;
    document.getElementById('projectsListView').classList.remove('active');
    document.getElementById('projectDetailView').classList.remove('active');
    document.getElementById('sectionDetailView').classList.add('active');
    document.getElementById('groupDetailView').classList.remove('active');

    if (sectionId) {
        const section = sections.find(s => s.id === sectionId);
        if (section) {
            document.getElementById('sectionDetailTitle').textContent = `Edit Section: ${section.name}`;
            populateSectionForm(section);
            document.getElementById('exportSectionBtn').style.display = 'inline-block';
            document.getElementById('deleteSectionBtn').style.display = 'inline-block';
            document.getElementById('groupsListSection').style.display = 'block';
            renderGroupsForSection(sectionId);
        }
    } else {
        document.getElementById('sectionDetailTitle').textContent = 'Create New Section';
        resetSectionForm();
        document.getElementById('exportSectionBtn').style.display = 'none';
        document.getElementById('deleteSectionBtn').style.display = 'none';
        document.getElementById('groupsListSection').style.display = 'none';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function handleSectionSubmit(e) {
    e.preventDefault();

    if (!currentProjectId) {
        alert('Please save the project first before adding sections');
        return;
    }

    const sectionData = {
        project_id: currentProjectId,
        name: document.getElementById('sectionName').value,
        description: document.getElementById('sectionDescription').value
    };

    const sectionId = document.getElementById('sectionId').value;
    const url = sectionId ? `/api/sections/${sectionId}` : '/api/sections';
    const method = sectionId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sectionData)
        });

        if (response.ok) {
            const result = await response.json();

            // Optimistic update - update local state immediately
            if (sectionId) {
                const index = sections.findIndex(s => s.id == sectionId);
                if (index !== -1) sections[index] = result;
            } else {
                sections.push(result);
            }

            if (!sectionId) {
                showSectionDetail(result.id);
            } else {
                showSectionDetail(sectionId);
            }

            alert(sectionId ? 'Section updated successfully!' : 'Section created successfully! You can now add groups to this section.');
        }
    } catch (error) {
        console.error('Error saving section:', error);
        alert('Error saving section');
    }
}

async function handleDeleteSection() {
    if (!currentSectionId) return;

    if (!confirm('Are you sure you want to delete this section and all its groups and trees?')) {
        return;
    }

    try {
        const response = await fetch(`/api/sections/${currentSectionId}`, { method: 'DELETE' });
        if (response.ok) {
            // Optimistic update - remove from local state immediately
            sections = sections.filter(s => s.id !== currentSectionId);

            // Remove all groups and trees for this section
            const sectionGroupIds = groups.filter(g => g.section_id === currentSectionId).map(g => g.id);
            groups = groups.filter(g => g.section_id !== currentSectionId);
            trees = trees.filter(t => !sectionGroupIds.includes(t.group_id));

            showProjectDetail(currentProjectId);
            alert('Section deleted successfully');
        }
    } catch (error) {
        console.error('Error deleting section:', error);
        alert('Error deleting section');
    }
}

function resetSectionForm() {
    document.getElementById('sectionForm').reset();
    document.getElementById('sectionId').value = '';
}

function populateSectionForm(section) {
    document.getElementById('sectionId').value = section.id;
    document.getElementById('sectionName').value = section.name;
    document.getElementById('sectionDescription').value = section.description || '';
}

function exportSectionToExcel() {
    if (!currentSectionId) {
        alert('Please save the section first before exporting');
        return;
    }

    const section = sections.find(s => s.id === currentSectionId);
    if (!section) return;

    const project = projects.find(p => p.id === section.project_id);
    const sectionGroups = groups.filter(g => g.section_id === currentSectionId);

    // Create CSV content
    let csv = '';

    // Add header with project and section info
    csv += `Project:,${project ? project.name : 'Unknown'}\n`;
    csv += `Work Type:,${project ? project.work_type : 'Unknown'}\n`;
    csv += `Section:,${section.name}\n`;
    csv += `Description:,${section.description || 'N/A'}\n`;
    csv += `Export Date:,${new Date().toLocaleString()}\n`;
    csv += '\n';

    // Add tree data headers
    csv += 'Group Name,Circuit Number,Section Number,ID Number,Address,Brush Amount,Crew Notes,';
    csv += 'Tree Number,Tree Species,Latitude,Longitude,Diameter (in),Tree Type,Action,Health Condition,Canopy Removal,Notes,Completed\n';

    // Add tree data for each group
    sectionGroups.forEach(group => {
        const groupTrees = trees.filter(t => t.group_id === group.id);

        // Escape quotes in group text fields
        const groupAddress = (group.address || '').replace(/"/g, '""');
        const crewNotes = (group.crew_notes || '').replace(/"/g, '""');

        if (groupTrees.length === 0) {
            // Add group row even if no trees
            csv += `"${group.name || ''}","${group.circuit_number || ''}","${group.section_number || ''}","${group.id_number || ''}","${groupAddress}","${group.brush_amount || ''}","${crewNotes}",`;
            csv += ',,,,,,,,,,\n';
        } else {
            groupTrees.forEach(tree => {
                // Escape quotes in tree text fields
                const species = (tree.species || '').replace(/"/g, '""');
                const notes = (tree.notes || '').replace(/"/g, '""');

                csv += `"${group.name || ''}","${group.circuit_number || ''}","${group.section_number || ''}","${group.id_number || ''}","${groupAddress}","${group.brush_amount || ''}","${crewNotes}",`;
                csv += `${tree.id},"${species}",${tree.latitude},${tree.longitude},${tree.diameter || ''},`;
                csv += `"${tree.tree_type || ''}","${tree.action || ''}","${tree.health_condition || ''}",${tree.canopy_removal ? 'Yes' : 'No'},"${notes}",${tree.completed ? 'Yes' : 'No'}\n`;
            });
        }
    });

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const filename = `${project ? project.name : 'Project'}_${section.name}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename.replace(/[^a-z0-9_\-\.]/gi, '_'));
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// GROUP FUNCTIONS
function showGroupDetail(groupId) {
    currentGroupId = groupId;
    document.getElementById('projectsListView').classList.remove('active');
    document.getElementById('projectDetailView').classList.remove('active');
    document.getElementById('sectionDetailView').classList.remove('active');
    document.getElementById('groupDetailView').classList.add('active');

    if (groupId) {
        const group = groups.find(g => g.id === groupId);
        if (group) {
            document.getElementById('groupDetailTitle').textContent = `Edit Group: ${group.name || group.circuit_number}`;
            populateGroupForm(group);
            document.getElementById('deleteGroupBtn').style.display = 'inline-block';
            document.getElementById('createAnotherGroupBtn').style.display = 'inline-block';
            document.getElementById('treeFormSection').style.display = 'block';
            document.getElementById('treeMapSection').style.display = 'block';
            document.getElementById('treesListSection').style.display = 'block';
            renderTreesForGroup(groupId);
            setTimeout(() => initializeTreeMap(groupId), 100);
        }
    } else {
        document.getElementById('groupDetailTitle').textContent = 'Create New Group';
        resetGroupForm();
        document.getElementById('deleteGroupBtn').style.display = 'none';
        document.getElementById('createAnotherGroupBtn').style.display = 'inline-block';
        document.getElementById('treeFormSection').style.display = 'none';
        document.getElementById('treeMapSection').style.display = 'none';
        document.getElementById('treesListSection').style.display = 'none';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function handleGroupSubmit(e) {
    e.preventDefault();

    if (!currentSectionId) {
        alert('Please save the section first before adding groups');
        return;
    }

    const circuitNumber = document.getElementById('circuitNumber').value;
    const sectionNumber = document.getElementById('sectionNumber').value;
    const idNumber = document.getElementById('idNumber').value;

    const name = `${circuitNumber}-${sectionNumber}-${idNumber}`;

    const cuttingEquipment = Array.from(document.querySelectorAll('input[name="cuttingEquipment"]:checked'))
        .map(cb => cb.value);

    const cleanupEquipment = Array.from(document.querySelectorAll('input[name="cleanupEquipment"]:checked'))
        .map(cb => cb.value);

    const customerNotification = Array.from(document.querySelectorAll('input[name="customerNotification"]:checked'))
        .map(cb => cb.value);

    const groupData = {
        section_id: currentSectionId,
        name: name,
        circuit_number: circuitNumber,
        section_number: sectionNumber,
        id_number: idNumber,
        address: document.getElementById('groupAddress').value,
        comments: document.getElementById('groupComments').value,
        brush_amount: document.getElementById('brushAmount').value,
        cutting_equipment: cuttingEquipment,
        cleanup_equipment: cleanupEquipment,
        customer_notification: customerNotification
    };

    const groupId = document.getElementById('groupId').value;
    const url = groupId ? `/api/groups/${groupId}` : '/api/groups';
    const method = groupId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(groupData)
        });

        if (response.ok) {
            const result = await response.json();

            // Optimistic update - update local state immediately
            if (groupId) {
                const index = groups.findIndex(g => g.id == groupId);
                if (index !== -1) groups[index] = result;
            } else {
                groups.push(result);
            }

            if (!groupId) {
                showGroupDetail(result.id);
            } else {
                showGroupDetail(groupId);
            }

            alert(groupId ? 'Group updated successfully!' : 'Group created successfully! You can now add trees to this group.');
        }
    } catch (error) {
        console.error('Error saving group:', error);
        alert('Error saving group');
    }
}

async function handleDeleteGroup() {
    if (!currentGroupId) return;

    if (!confirm('Are you sure you want to delete this group and all its trees?')) {
        return;
    }

    try {
        const response = await fetch(`/api/groups/${currentGroupId}`, { method: 'DELETE' });
        if (response.ok) {
            // Optimistic update - remove from local state immediately
            groups = groups.filter(g => g.id !== currentGroupId);
            trees = trees.filter(t => t.group_id !== currentGroupId);

            showSectionDetail(currentSectionId);
            alert('Group deleted successfully');
        }
    } catch (error) {
        console.error('Error deleting group:', error);
        alert('Error deleting group');
    }
}

function resetGroupForm() {
    document.getElementById('groupForm').reset();
    document.getElementById('groupId').value = '';
    document.querySelectorAll('input[name="cuttingEquipment"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[name="cleanupEquipment"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[name="customerNotification"]').forEach(cb => cb.checked = false);

    // Auto-fill circuit and section numbers from the most recent group in the same section
    if (currentSectionId) {
        const sectionGroups = groups.filter(g => g.section_id === currentSectionId);
        if (sectionGroups.length > 0) {
            // Sort by ID to get the most recent group
            sectionGroups.sort((a, b) => b.id - a.id);
            const lastGroup = sectionGroups[0];

            // Auto-fill circuit and section numbers
            if (lastGroup.circuit_number) {
                document.getElementById('circuitNumber').value = lastGroup.circuit_number;
            }
            if (lastGroup.section_number) {
                document.getElementById('sectionNumber').value = lastGroup.section_number;
            }
        }
    }
}

function populateGroupForm(group) {
    document.getElementById('groupId').value = group.id;
    document.getElementById('circuitNumber').value = group.circuit_number;
    document.getElementById('sectionNumber').value = group.section_number || '';
    document.getElementById('idNumber').value = group.id_number || '';
    document.getElementById('groupAddress').value = group.address || '';
    document.getElementById('groupComments').value = group.comments || group.description || '';
    document.getElementById('brushAmount').value = group.brush_amount || '';

    document.querySelectorAll('input[name="cuttingEquipment"]').forEach(cb => {
        cb.checked = group.cutting_equipment && group.cutting_equipment.includes(cb.value);
    });

    document.querySelectorAll('input[name="cleanupEquipment"]').forEach(cb => {
        cb.checked = group.cleanup_equipment && group.cleanup_equipment.includes(cb.value);
    });

    const notifications = Array.isArray(group.customer_notification)
        ? group.customer_notification
        : (group.customer_notification ? [group.customer_notification] : []);

    document.querySelectorAll('input[name="customerNotification"]').forEach(cb => {
        cb.checked = notifications.includes(cb.value);
    });
}

// TREE FUNCTIONS
function getCurrentLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }

    const btn = document.getElementById('getLocationBtn');
    btn.textContent = 'Getting location...';
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        (position) => {
            document.getElementById('latitude').value = position.coords.latitude.toFixed(6);
            document.getElementById('longitude').value = position.coords.longitude.toFixed(6);
            btn.textContent = 'Get Current Location';
            btn.disabled = false;
        },
        (error) => {
            alert('Error getting location: ' + error.message);
            btn.textContent = 'Get Current Location';
            btn.disabled = false;
        }
    );
}

async function handleTreeSubmit(e) {
    e.preventDefault();

    if (!currentGroupId) {
        alert('Please save the group first before adding trees');
        return;
    }

    const diameter = parseFloat(document.getElementById('diameter').value);

    // Validate diameter - warn if less than 4 inches
    if (diameter && diameter < 4) {
        if (!confirm('Warning: Trees less than 4 inches in diameter are considered brush, not trees. Do you want to continue recording this as a tree?')) {
            return;
        }
    }

    const treeData = {
        group_id: currentGroupId,
        latitude: parseFloat(document.getElementById('latitude').value),
        longitude: parseFloat(document.getElementById('longitude').value),
        species: document.getElementById('species').value,
        diameter: diameter || null,
        tree_type: document.getElementById('treeType').value,
        action: document.getElementById('action').value,
        health_condition: document.getElementById('healthCondition').value,
        canopy_removal: document.getElementById('canopyRemoval').checked,
        notes: document.getElementById('notes').value
    };

    const treeId = document.getElementById('treeId').value;
    const url = treeId ? `/api/trees/${treeId}` : '/api/trees';
    const method = treeId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(treeData)
        });

        if (response.ok) {
            const savedTree = await response.json();

            // Update locally for instant feedback
            if (treeId) {
                const index = trees.findIndex(t => t.id == treeId);
                if (index !== -1) trees[index] = savedTree;
            } else {
                trees.push(savedTree);
            }

            resetTreeForm();
            renderTreesForGroup(currentGroupId);
            initializeTreeMap(currentGroupId);
            // Removed alert for faster UX
        }
    } catch (error) {
        console.error('Error saving tree:', error);
        alert('Error saving tree');
    }
}

async function deleteTree(id) {
    if (!confirm('Are you sure you want to delete this tree?')) {
        return;
    }

    try {
        const response = await fetch(`/api/trees/${id}`, { method: 'DELETE' });
        if (response.ok) {
            // Optimistic update - remove from local state immediately
            trees = trees.filter(t => t.id !== id);
            renderTreesForGroup(currentGroupId);
            initializeTreeMap(currentGroupId);
        }
    } catch (error) {
        console.error('Error deleting tree:', error);
        alert('Error deleting tree');
    }
}

function editTree(id) {
    const tree = trees.find(t => t.id === id);
    if (!tree) return;

    // Populate the form with tree data
    document.getElementById('treeId').value = tree.id;
    document.getElementById('latitude').value = tree.latitude;
    document.getElementById('longitude').value = tree.longitude;
    document.getElementById('species').value = tree.species || '';
    document.getElementById('diameter').value = tree.diameter || '';
    document.getElementById('treeType').value = tree.tree_type || '';
    document.getElementById('action').value = tree.action || '';
    document.getElementById('healthCondition').value = tree.health_condition || '';
    document.getElementById('canopyRemoval').checked = tree.canopy_removal || false;
    document.getElementById('notes').value = tree.notes || '';

    // Update UI for edit mode
    document.getElementById('treeFormTitle').textContent = 'Edit Tree';
    document.getElementById('saveTreeBtn').textContent = 'Update Tree';
    document.getElementById('cancelEditTreeBtn').style.display = 'inline-block';

    // Scroll to form
    document.getElementById('treeFormSection').scrollIntoView({ behavior: 'smooth' });
}

function cancelEditTree() {
    resetTreeForm();
}

function resetTreeForm() {
    document.getElementById('treeForm').reset();
    document.getElementById('treeId').value = '';
    document.getElementById('treeFormTitle').textContent = 'Record Trees for This Group';
    document.getElementById('saveTreeBtn').textContent = 'Save Tree';
    document.getElementById('cancelEditTreeBtn').style.display = 'none';
}

// DATA LOADING
async function loadProjects() {
    try {
        const response = await fetch('/api/projects');
        projects = await response.json();
        renderProjects();
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

async function loadSections() {
    try {
        const response = await fetch('/api/sections');
        sections = await response.json();
    } catch (error) {
        console.error('Error loading sections:', error);
    }
}

async function loadGroups() {
    try {
        const response = await fetch('/api/groups');
        groups = await response.json();
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

async function loadTrees() {
    try {
        const response = await fetch('/api/trees');
        trees = await response.json();
    } catch (error) {
        console.error('Error loading trees:', error);
    }
}

// RENDERING
function renderProjects() {
    const container = document.getElementById('projectsList');

    if (projects.length === 0) {
        container.innerHTML = '<div class="empty-state">No projects created yet. Click "Create New Project" to get started.</div>';
        return;
    }

    container.innerHTML = projects.map(project => {
        const projectSections = sections.filter(s => s.project_id === project.id);
        const projectGroups = groups.filter(g => {
            const section = sections.find(s => s.id === g.section_id);
            return section && section.project_id === project.id;
        });
        const treeCount = trees.filter(t => {
            const group = groups.find(g => g.id === t.group_id);
            if (!group) return false;
            const section = sections.find(s => s.id === group.section_id);
            return section && section.project_id === project.id;
        }).length;

        return `
            <div class="item-card" onclick="showProjectDetail(${project.id})" style="cursor: pointer;">
                <h3>${project.name}</h3>
                <div class="item-details">
                    <div class="detail-item"><strong>WD Number:</strong> ${project.wd_number || 'N/A'}</div>
                    <div class="detail-item"><strong>Work Type:</strong> ${project.work_type}</div>
                    <div class="detail-item"><strong>Sections:</strong> ${projectSections.length}</div>
                    <div class="detail-item"><strong>Groups:</strong> ${projectGroups.length}</div>
                    <div class="detail-item"><strong>Total Trees:</strong> ${treeCount}</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderSectionsForProject(projectId) {
    const container = document.getElementById('sectionsList');
    const projectSections = sections.filter(s => s.project_id === projectId);

    if (projectSections.length === 0) {
        container.innerHTML = '<div class="empty-state">No sections created yet for this project</div>';
        return;
    }

    container.innerHTML = projectSections.map(section => {
        const sectionGroups = groups.filter(g => g.section_id === section.id);
        const treeCount = trees.filter(t => {
            const group = groups.find(g => g.id === t.group_id);
            return group && group.section_id === section.id;
        }).length;

        return `
            <div class="item-card" onclick="showSectionDetail(${section.id})" style="cursor: pointer;">
                <h3>${section.name}</h3>
                <div class="item-details">
                    ${section.description ? `<div class="detail-item"><strong>Description:</strong> ${section.description}</div>` : ''}
                    <div class="detail-item"><strong>Groups:</strong> ${sectionGroups.length}</div>
                    <div class="detail-item"><strong>Trees:</strong> ${treeCount}</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderGroupsForSection(sectionId) {
    const container = document.getElementById('groupsList');
    const sectionGroups = groups.filter(g => g.section_id === sectionId);

    if (sectionGroups.length === 0) {
        container.innerHTML = '<div class="empty-state">No groups created yet for this section</div>';
        return;
    }

    container.innerHTML = sectionGroups.map(group => {
        const treeCount = trees.filter(t => t.group_id === group.id).length;
        const displayName = group.name || group.circuit_number || 'Unnamed Group';
        const comments = group.comments || group.description || '';

        const cuttingEquip = group.cutting_equipment || (group.equipment_needed ? [group.equipment_needed] : []);
        const cleanupEquip = group.cleanup_equipment || [];
        const notifications = Array.isArray(group.customer_notification)
            ? group.customer_notification
            : (group.customer_notification ? [group.customer_notification] : []);

        return `
            <div class="item-card" onclick="showGroupDetail(${group.id})" style="cursor: pointer;">
                <h3>${displayName}</h3>
                <div class="item-details">
                    ${comments ? `<div class="detail-item"><strong>Comments:</strong> ${comments}</div>` : ''}
                    <div class="detail-item"><strong>Trees:</strong> ${treeCount}</div>
                    ${group.brush_amount ? `<div class="detail-item"><strong>Brush:</strong> ${group.brush_amount} Quarter Spans</div>` : ''}
                    ${cuttingEquip.length > 0 ? `<div class="detail-item"><strong>Cutting Equipment:</strong> ${cuttingEquip.join(', ')}</div>` : ''}
                    ${cleanupEquip.length > 0 ? `<div class="detail-item"><strong>Cleanup Codes:</strong> ${cleanupEquip.join(', ')}</div>` : ''}
                    ${notifications.length > 0 ? `<div class="detail-item"><strong>Notification:</strong> ${notifications.join(', ')}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function renderTreesForGroup(groupId) {
    const container = document.getElementById('treesList');
    const groupTrees = trees.filter(t => t.group_id === groupId);

    if (groupTrees.length === 0) {
        container.innerHTML = '<div class="empty-state">No trees recorded for this group yet</div>';
        return;
    }

    container.innerHTML = groupTrees.map(tree => {
        const actionBadge = tree.action ? `<span class="badge badge-${tree.action}">${tree.action.toUpperCase()}</span>` : '';
        const canopyBadge = tree.canopy_removal ? `<span class="badge" style="background: #8B4513; color: white;">CANOPY-REMOVAL</span>` : '';

        return `
            <div class="item-card">
                <h3>
                    Tree #${tree.id} - ${tree.species || 'Unidentified'}
                    ${actionBadge}
                    ${canopyBadge}
                </h3>
                <div class="item-details">
                    <div class="detail-item">
                        <strong>Location:</strong>
                        <a href="https://www.google.com/maps?q=${tree.latitude},${tree.longitude}"
                           target="_blank" class="location-link">
                            ${tree.latitude.toFixed(6)}, ${tree.longitude.toFixed(6)}
                        </a>
                    </div>
                    ${tree.tree_type ? `<div class="detail-item"><strong>Type:</strong> ${tree.tree_type}</div>` : ''}
                    ${tree.diameter ? `<div class="detail-item"><strong>Diameter:</strong> ${tree.diameter}"</div>` : ''}
                    ${tree.health_condition ? `<div class="detail-item"><strong>Health:</strong> ${tree.health_condition}</div>` : ''}
                    ${tree.notes ? `<div class="detail-item"><strong>Notes:</strong> ${tree.notes}</div>` : ''}
                    <div class="detail-item"><strong>Recorded:</strong> ${new Date(tree.created_at).toLocaleString()}</div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-secondary" onclick="editTree(${tree.id})">Edit</button>
                    <button class="btn btn-danger" onclick="deleteTree(${tree.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// MAP FUNCTIONS
function initializeTreeMap(groupId) {
    const groupTrees = trees.filter(t => t.group_id === groupId);

    // Remove existing map if present
    if (treeMap) {
        treeMap.remove();
        treeMap = null;
    }

    // Don't initialize map if no trees
    if (groupTrees.length === 0) {
        document.getElementById('treeMap').innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No trees recorded yet. Add trees to see them on the map.</div>';
        return;
    }

    // Calculate center and bounds
    const lats = groupTrees.map(t => t.latitude);
    const lngs = groupTrees.map(t => t.longitude);
    const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

    // Initialize map with mobile-friendly options
    treeMap = L.map('treeMap', {
        tap: true, // Enable tap for mobile
        tapTolerance: 15, // Larger touch tolerance
        touchZoom: true, // Enable pinch zoom
        dragging: true,
        zoomControl: true
    }).setView([centerLat, centerLng], 17);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(treeMap);

    // Create color mapping for actions
    const actionColors = {
        'trim': '#ffcc00',
        'remove': '#ff3333',
        'hazard': '#ff6600',
        '': '#3366ff'
    };

    // Add markers for each tree
    groupTrees.forEach(tree => {
        const color = actionColors[tree.action] || actionColors[''];

        const icon = L.divIcon({
            className: 'tree-marker',
            html: `<div style="
                background-color: ${color};
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 3px solid #fff;
                box-shadow: 0 2px 6px rgba(0,0,0,0.5);
                cursor: pointer;
            "></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        const marker = L.marker([tree.latitude, tree.longitude], { icon: icon }).addTo(treeMap);

        const popupContent = `
            <div style="font-family: 'Trebuchet MS', Tahoma, Arial, sans-serif; font-size: 12px;">
                <strong>Tree #${tree.id}</strong><br>
                <strong>${tree.species || 'Unidentified Tree'}</strong><br>
                ${tree.tree_type ? `Type: ${tree.tree_type}<br>` : ''}
                ${tree.diameter ? `Diameter: ${tree.diameter}"<br>` : ''}
                ${tree.action ? `Action: ${tree.action.toUpperCase()}<br>` : ''}
                ${tree.health_condition ? `Health: ${tree.health_condition}<br>` : ''}
                ${tree.notes ? `Notes: ${tree.notes}<br>` : ''}
            </div>
        `;

        marker.bindPopup(popupContent);
    });

    // Fit bounds to show all markers
    if (groupTrees.length > 1) {
        const bounds = L.latLngBounds(groupTrees.map(t => [t.latitude, t.longitude]));
        treeMap.fitBounds(bounds, { padding: [50, 50] });
    }
}

// CREW MODE FUNCTIONS
function showCrewProjects() {
    document.getElementById('crewProjectsView').classList.add('active');
    document.getElementById('crewSectionsView').classList.remove('active');
    document.getElementById('crewGroupsView').classList.remove('active');
    document.getElementById('crewWorkView').classList.remove('active');
    currentProjectId = null;
    currentSectionId = null;
    currentGroupId = null;
    renderCrewProjectsList();
}

function renderCrewProjectsList() {
    const container = document.getElementById('crewProjectsList');

    if (projects.length === 0) {
        container.innerHTML = '<div class="empty-state">No projects available</div>';
        return;
    }

    container.innerHTML = projects.map(project => {
        const projectSections = sections.filter(s => s.project_id === project.id);
        const projectGroups = groups.filter(g => {
            const section = sections.find(s => s.id === g.section_id);
            return section && section.project_id === project.id;
        });

        const completedGroups = projectGroups.filter(g => g.completed).length;
        const totalGroups = projectGroups.length;

        return `
            <div class="item-card" onclick="showCrewSections(${project.id})" style="cursor: pointer;">
                <h3>${project.name}</h3>
                <div class="item-details">
                    <div class="detail-item"><strong>Work Type:</strong> ${project.work_type}</div>
                    <div class="detail-item"><strong>Sections:</strong> ${projectSections.length}</div>
                    <div class="detail-item"><strong>Groups Completed:</strong> ${completedGroups} / ${totalGroups}</div>
                </div>
            </div>
        `;
    }).join('');
}

function showCrewSections(projectId) {
    currentProjectId = projectId;
    currentSectionId = null;
    currentGroupId = null;
    document.getElementById('crewProjectsView').classList.remove('active');
    document.getElementById('crewSectionsView').classList.add('active');
    document.getElementById('crewGroupsView').classList.remove('active');
    document.getElementById('crewWorkView').classList.remove('active');

    const project = projects.find(p => p.id === projectId);
    if (project) {
        document.getElementById('crewSectionsTitle').textContent = `Sections in ${project.name}`;
    }

    renderCrewSectionsList(projectId);
}

function renderCrewSectionsList(projectId) {
    const container = document.getElementById('crewSectionsList');
    const projectSections = sections.filter(s => s.project_id === projectId);

    if (projectSections.length === 0) {
        container.innerHTML = '<div class="empty-state">No sections available</div>';
        return;
    }

    container.innerHTML = projectSections.map(section => {
        const sectionGroups = groups.filter(g => g.section_id === section.id);
        const completedGroups = sectionGroups.filter(g => g.completed).length;
        const totalGroups = sectionGroups.length;

        return `
            <div class="item-card" onclick="showCrewGroups(${section.id})" style="cursor: pointer;">
                <h3>${section.name}</h3>
                <div class="item-details">
                    ${section.description ? `<div class="detail-item"><strong>Description:</strong> ${section.description}</div>` : ''}
                    <div class="detail-item"><strong>Groups Completed:</strong> ${completedGroups} / ${totalGroups}</div>
                </div>
            </div>
        `;
    }).join('');
}

function showCrewGroups(sectionId) {
    currentSectionId = sectionId;
    currentGroupId = null;
    document.getElementById('crewProjectsView').classList.remove('active');
    document.getElementById('crewSectionsView').classList.remove('active');
    document.getElementById('crewGroupsView').classList.add('active');
    document.getElementById('crewWorkView').classList.remove('active');

    const section = sections.find(s => s.id === sectionId);
    if (section) {
        document.getElementById('crewGroupsTitle').textContent = `Groups in ${section.name}`;
    }

    renderCrewGroupsList(sectionId);
}

function renderCrewGroupsList(sectionId) {
    const container = document.getElementById('crewGroupsList');
    const sectionGroups = groups.filter(g => g.section_id === sectionId);

    if (sectionGroups.length === 0) {
        container.innerHTML = '<div class="empty-state">No groups available in this section</div>';
        return;
    }

    container.innerHTML = sectionGroups.map(group => {
        const displayName = group.name || group.circuit_number || 'Unnamed Group';
        const groupTrees = trees.filter(t => t.group_id === group.id);
        const completedTrees = groupTrees.filter(t => t.completed).length;
        const totalTrees = groupTrees.length;
        const isCompleted = group.completed || false;

        const statusBadge = isCompleted
            ? '<span class="badge" style="background: #22cc22; color: white;">✓ COMPLETED</span>'
            : completedTrees === totalTrees && totalTrees > 0
            ? '<span class="badge" style="background: #ff9933; color: white;">READY TO COMPLETE</span>'
            : '<span class="badge" style="background: #6ba3ff; color: white;">IN PROGRESS</span>';

        return `
            <div class="item-card" onclick="showCrewWork(${group.id})" style="cursor: pointer;">
                <h3>${displayName} ${statusBadge}</h3>
                <div class="item-details">
                    <div class="detail-item"><strong>Trees:</strong> ${completedTrees} / ${totalTrees} completed</div>
                    ${group.comments ? `<div class="detail-item"><strong>Comments:</strong> ${group.comments}</div>` : ''}
                    ${group.brush_amount ? `<div class="detail-item"><strong>Brush:</strong> ${group.brush_amount} Quarter Spans</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function showCrewWork(groupId) {
    currentGroupId = groupId;
    const group = groups.find(g => g.id === groupId);

    if (!group) return;

    document.getElementById('crewProjectsView').classList.remove('active');
    document.getElementById('crewSectionsView').classList.remove('active');
    document.getElementById('crewGroupsView').classList.remove('active');
    document.getElementById('crewWorkView').classList.add('active');

    const displayName = group.name || group.circuit_number || 'Unnamed Group';
    document.getElementById('crewGroupTitle').textContent = `Working on: ${displayName}`;

    // Show group info
    const groupInfo = document.getElementById('crewGroupInfo');
    groupInfo.innerHTML = `
        <div class="detail-item"><strong>Circuit:</strong> ${group.circuit_number}</div>
        ${group.comments ? `<div class="detail-item"><strong>Comments:</strong> ${group.comments}</div>` : ''}
        ${group.brush_amount ? `<div class="detail-item"><strong>Brush Amount:</strong> ${group.brush_amount} Quarter Spans</div>` : ''}
        ${group.cutting_equipment && group.cutting_equipment.length > 0 ? `<div class="detail-item"><strong>Equipment:</strong> ${group.cutting_equipment.join(', ')}</div>` : ''}
    `;

    // Load crew notes
    document.getElementById('crewNotes').value = group.crew_notes || '';

    renderCrewTreesList(groupId);
}

function renderCrewTreesList(groupId) {
    const container = document.getElementById('crewTreesList');
    const groupTrees = trees.filter(t => t.group_id === groupId);

    if (groupTrees.length === 0) {
        container.innerHTML = '<div class="empty-state">No trees in this group</div>';
        return;
    }

    container.innerHTML = groupTrees.map(tree => {
        const isCompleted = tree.completed || false;
        const actionBadge = tree.action ? `<span class="badge badge-${tree.action}">${tree.action.toUpperCase()}</span>` : '';
        const canopyBadge = tree.canopy_removal ? `<span class="badge" style="background: #8B4513; color: white;">CANOPY-REMOVAL</span>` : '';

        return `
            <div class="item-card" style="${isCompleted ? 'opacity: 0.6;' : ''}">
                <h3>
                    Tree #${tree.id} - ${tree.species || 'Unidentified'}
                    ${actionBadge}
                    ${canopyBadge}
                    ${isCompleted ? '<span class="badge" style="background: #22cc22; color: white;">✓ DONE</span>' : ''}
                </h3>
                <div class="item-details">
                    ${tree.tree_type ? `<div class="detail-item"><strong>Type:</strong> ${tree.tree_type}</div>` : ''}
                    ${tree.diameter ? `<div class="detail-item"><strong>Diameter:</strong> ${tree.diameter}"</div>` : ''}
                    ${tree.health_condition ? `<div class="detail-item"><strong>Health:</strong> ${tree.health_condition}</div>` : ''}
                    ${tree.notes ? `<div class="detail-item"><strong>Notes:</strong> ${tree.notes}</div>` : ''}
                </div>
                <div class="item-actions">
                    ${!isCompleted ?
                        `<button class="btn btn-primary" onclick="markTreeCompleted(${tree.id})">Mark as Completed</button>` :
                        `<div style="display: flex; gap: 10px; align-items: center;">
                            <span style="color: #22cc22; font-weight: bold;">Completed</span>
                            <button class="btn btn-secondary" onclick="reopenTree(${tree.id})">Reopen Tree</button>
                        </div>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

async function markTreeCompleted(treeId) {
    try {
        const tree = trees.find(t => t.id === treeId);
        if (!tree) return;

        // Update locally first for instant UI feedback
        tree.completed = true;
        renderCrewTreesList(currentGroupId);

        // Then save to server in background
        const response = await fetch(`/api/trees/${treeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...tree, completed: true })
        });

        if (!response.ok) {
            // Revert on error
            tree.completed = false;
            renderCrewTreesList(currentGroupId);
            alert('Error marking tree as completed');
        }
    } catch (error) {
        console.error('Error marking tree as completed:', error);
        // Revert on error
        const tree = trees.find(t => t.id === treeId);
        if (tree) tree.completed = false;
        renderCrewTreesList(currentGroupId);
        alert('Error marking tree as completed');
    }
}

async function reopenTree(treeId) {
    try {
        const tree = trees.find(t => t.id === treeId);
        if (!tree) return;

        // Update locally first for instant UI feedback
        tree.completed = false;
        renderCrewTreesList(currentGroupId);

        // Then save to server in background
        const response = await fetch(`/api/trees/${treeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...tree, completed: false })
        });

        if (!response.ok) {
            // Revert on error
            tree.completed = true;
            renderCrewTreesList(currentGroupId);
            alert('Error reopening tree');
        }
    } catch (error) {
        console.error('Error reopening tree:', error);
        // Revert on error
        const tree = trees.find(t => t.id === treeId);
        if (tree) tree.completed = true;
        renderCrewTreesList(currentGroupId);
        alert('Error reopening tree');
    }
}

async function saveCrewNotes() {
    if (!currentGroupId) return;

    const group = groups.find(g => g.id === currentGroupId);
    if (!group) return;

    const crewNotes = document.getElementById('crewNotes').value;

    try {
        // Update locally first
        group.crew_notes = crewNotes;

        // Save to server
        const response = await fetch(`/api/groups/${currentGroupId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(group)
        });

        if (response.ok) {
            // Show success feedback
            const saveBtn = document.getElementById('saveCrewNotesBtn');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '✓ Saved';
            saveBtn.style.background = '#22cc22';
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.style.background = '';
            }, 2000);
        } else {
            alert('Error saving crew notes');
        }
    } catch (error) {
        console.error('Error saving crew notes:', error);
        alert('Error saving crew notes');
    }
}

async function handleCompleteGroup() {
    if (!currentGroupId) return;

    const group = groups.find(g => g.id === currentGroupId);
    if (!group) return;

    const groupTrees = trees.filter(t => t.group_id === currentGroupId);
    const allTreesCompleted = groupTrees.every(t => t.completed);

    if (!allTreesCompleted) {
        alert('Please mark all trees as completed before completing the group.');
        return;
    }

    if (!confirm('Mark this group as completed?')) {
        return;
    }

    try {
        const response = await fetch(`/api/groups/${currentGroupId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...group, completed: true })
        });

        if (response.ok) {
            await loadGroups();
            alert('Group marked as completed!');
            showCrewGroups(currentSectionId);
        }
    } catch (error) {
        console.error('Error completing group:', error);
        alert('Error completing group');
    }
}

// AUDIT MODE FUNCTIONS
function showAuditProjects() {
    document.getElementById('auditProjectsView').classList.add('active');
    document.getElementById('auditSectionsView').classList.remove('active');
    document.getElementById('auditGroupsView').classList.remove('active');
    currentProjectId = null;
    currentSectionId = null;
    renderAuditProjectsList();
}

function renderAuditProjectsList() {
    const container = document.getElementById('auditProjectsList');

    if (projects.length === 0) {
        container.innerHTML = '<div class="empty-state">No projects available</div>';
        return;
    }

    container.innerHTML = projects.map(project => {
        const projectSections = sections.filter(s => s.project_id === project.id);
        const projectGroups = groups.filter(g => {
            const section = sections.find(s => s.id === g.section_id);
            return section && section.project_id === project.id;
        });

        const completedGroups = projectGroups.filter(g => g.completed).length;
        const totalGroups = projectGroups.length;
        const percentage = totalGroups > 0 ? Math.round((completedGroups / totalGroups) * 100) : 0;

        let statusColor = percentage === 100 ? '#22cc22' : percentage > 0 ? '#ff9933' : '#cccccc';

        return `
            <div class="item-card" onclick="showAuditSections(${project.id})" style="cursor: pointer;">
                <h3>${project.name}</h3>
                <div class="item-details">
                    <div class="detail-item"><strong>Work Type:</strong> ${project.work_type}</div>
                    <div class="detail-item"><strong>Sections:</strong> ${projectSections.length}</div>
                    <div class="detail-item"><strong>Progress:</strong> <span style="color: ${statusColor}; font-weight: bold;">${percentage}%</span> (${completedGroups} / ${totalGroups} groups)</div>
                </div>
            </div>
        `;
    }).join('');
}

function showAuditSections(projectId) {
    currentProjectId = projectId;
    currentSectionId = null;
    document.getElementById('auditProjectsView').classList.remove('active');
    document.getElementById('auditSectionsView').classList.add('active');
    document.getElementById('auditGroupsView').classList.remove('active');

    const project = projects.find(p => p.id === projectId);
    if (project) {
        document.getElementById('auditSectionsTitle').textContent = `Sections in ${project.name}`;
    }

    renderAuditSectionsList(projectId);
}

function renderAuditSectionsList(projectId) {
    const container = document.getElementById('auditSectionsList');
    const projectSections = sections.filter(s => s.project_id === projectId);

    if (projectSections.length === 0) {
        container.innerHTML = '<div class="empty-state">No sections available</div>';
        return;
    }

    container.innerHTML = projectSections.map(section => {
        const sectionGroups = groups.filter(g => g.section_id === section.id);
        const completedGroups = sectionGroups.filter(g => g.completed).length;
        const totalGroups = sectionGroups.length;
        const percentage = totalGroups > 0 ? Math.round((completedGroups / totalGroups) * 100) : 0;

        let statusColor = percentage === 100 ? '#22cc22' : percentage > 0 ? '#ff9933' : '#cccccc';

        return `
            <div class="item-card" onclick="showAuditGroups(${section.id})" style="cursor: pointer;">
                <h3>${section.name}</h3>
                <div class="item-details">
                    ${section.description ? `<div class="detail-item"><strong>Description:</strong> ${section.description}</div>` : ''}
                    <div class="detail-item"><strong>Progress:</strong> <span style="color: ${statusColor}; font-weight: bold;">${percentage}%</span> (${completedGroups} / ${totalGroups} groups)</div>
                </div>
            </div>
        `;
    }).join('');
}

function showAuditGroups(sectionId) {
    currentSectionId = sectionId;
    document.getElementById('auditProjectsView').classList.remove('active');
    document.getElementById('auditSectionsView').classList.remove('active');
    document.getElementById('auditGroupsView').classList.add('active');

    const section = sections.find(s => s.id === sectionId);
    if (section) {
        document.getElementById('auditGroupsListTitle').textContent = `Groups in ${section.name}`;
    }

    renderAuditGroupsList(sectionId);
    setTimeout(() => initializeAuditMap(sectionId), 100);
}

function renderAuditGroupsList(sectionId) {
    const container = document.getElementById('auditGroupsList');
    const sectionGroups = groups.filter(g => g.section_id === sectionId);

    if (sectionGroups.length === 0) {
        container.innerHTML = '<div class="empty-state">No groups available in this section</div>';
        return;
    }

    container.innerHTML = sectionGroups.map(group => {
        const displayName = group.name || group.circuit_number || 'Unnamed Group';
        const groupTrees = trees.filter(t => t.group_id === group.id);
        const completedTrees = groupTrees.filter(t => t.completed).length;
        const totalTrees = groupTrees.length;
        const isCompleted = group.completed || false;

        let statusColor, statusText;
        if (isCompleted) {
            statusColor = '#22cc22';
            statusText = 'COMPLETED';
        } else if (completedTrees > 0) {
            statusColor = '#ff9933';
            statusText = 'IN PROGRESS';
        } else {
            statusColor = '#cccccc';
            statusText = 'NOT STARTED';
        }

        return `
            <div class="item-card">
                <h3>
                    ${displayName}
                    <span class="badge" style="background: ${statusColor}; color: ${statusColor === '#cccccc' ? '#000' : 'white'};">${statusText}</span>
                </h3>
                <div class="item-details">
                    <div class="detail-item"><strong>Trees Completed:</strong> ${completedTrees} / ${totalTrees}</div>
                    ${group.comments ? `<div class="detail-item"><strong>Comments:</strong> ${group.comments}</div>` : ''}
                    ${group.brush_amount ? `<div class="detail-item"><strong>Brush:</strong> ${group.brush_amount} Quarter Spans</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function initializeAuditMap(sectionId) {
    // Remove existing map if present
    if (auditMap) {
        auditMap.remove();
        auditMap = null;
    }

    // Get groups for current section with at least one tree for positioning
    const sectionGroups = groups.filter(g => g.section_id === sectionId);
    const groupsWithTrees = sectionGroups.filter(g => {
        const groupTrees = trees.filter(t => t.group_id === g.id);
        return groupTrees.length > 0;
    });

    if (groupsWithTrees.length === 0) {
        document.getElementById('auditMap').innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No groups with trees recorded yet.</div>';
        return;
    }

    // Calculate center based on all trees
    const allLats = [], allLngs = [];
    groupsWithTrees.forEach(group => {
        const groupTrees = trees.filter(t => t.group_id === group.id);
        groupTrees.forEach(t => {
            allLats.push(t.latitude);
            allLngs.push(t.longitude);
        });
    });

    const centerLat = allLats.reduce((a, b) => a + b, 0) / allLats.length;
    const centerLng = allLngs.reduce((a, b) => a + b, 0) / allLngs.length;

    // Initialize map with mobile-friendly options
    auditMap = L.map('auditMap', {
        tap: true, // Enable tap for mobile
        tapTolerance: 15, // Larger touch tolerance
        touchZoom: true, // Enable pinch zoom
        dragging: true,
        zoomControl: true
    }).setView([centerLat, centerLng], 14);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(auditMap);

    // Add markers for each group
    groupsWithTrees.forEach(group => {
        const groupTrees = trees.filter(t => t.group_id === group.id);
        if (groupTrees.length === 0) return;

        // Calculate group center
        const lats = groupTrees.map(t => t.latitude);
        const lngs = groupTrees.map(t => t.longitude);
        const groupLat = lats.reduce((a, b) => a + b, 0) / lats.length;
        const groupLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

        // Determine status color
        const completedTrees = groupTrees.filter(t => t.completed).length;
        const isCompleted = group.completed || false;

        let color;
        if (isCompleted) {
            color = '#22cc22';
        } else if (completedTrees > 0) {
            color = '#ff9933';
        } else {
            color = '#cccccc';
        }

        const icon = L.divIcon({
            className: 'group-marker',
            html: `<div style="
                background-color: ${color};
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 3px solid #fff;
                box-shadow: 0 2px 6px rgba(0,0,0,0.5);
            "></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        const marker = L.marker([groupLat, groupLng], { icon: icon }).addTo(auditMap);

        const displayName = group.name || group.circuit_number || 'Unnamed Group';
        const popupContent = `
            <div style="font-family: 'Trebuchet MS', Tahoma, Arial, sans-serif; font-size: 12px;">
                <strong>${displayName}</strong><br>
                Status: ${isCompleted ? 'Completed' : completedTrees > 0 ? 'In Progress' : 'Not Started'}<br>
                Trees Completed: ${completedTrees} / ${groupTrees.length}<br>
                ${group.comments ? `Comments: ${group.comments}` : ''}
            </div>
        `;

        marker.bindPopup(popupContent);
    });

    // Fit bounds to show all markers
    if (allLats.length > 1) {
        const bounds = L.latLngBounds(allLats.map((lat, i) => [lat, allLngs[i]]));
        auditMap.fitBounds(bounds, { padding: [50, 50] });
    }
}
