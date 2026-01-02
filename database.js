const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'tree_survey.json');

function loadData() {
  if (!fs.existsSync(dbPath)) {
    const initialData = {
      projects: [],
      sections: [],
      groups: [],
      trees: [],
      nextProjectId: 1,
      nextSectionId: 1,
      nextGroupId: 1,
      nextTreeId: 1
    };
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  const data = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(data);
}

function saveData(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
  getAllProjects: () => {
    const data = loadData();
    return data.projects || [];
  },

  createProject: (project) => {
    const data = loadData();
    if (!data.projects) data.projects = [];
    if (!data.nextProjectId) data.nextProjectId = 1;
    const newProject = {
      id: data.nextProjectId++,
      ...project,
      created_at: new Date().toISOString()
    };
    data.projects.push(newProject);
    saveData(data);
    return newProject.id;
  },

  updateProject: (id, project) => {
    const data = loadData();
    const index = data.projects.findIndex(p => p.id === parseInt(id));
    if (index !== -1) {
      data.projects[index] = { ...data.projects[index], ...project };
      saveData(data);
      return true;
    }
    return false;
  },

  deleteProject: (id) => {
    const data = loadData();
    data.projects = data.projects.filter(p => p.id !== parseInt(id));
    data.sections = data.sections.filter(s => s.project_id !== parseInt(id));
    data.groups = data.groups.filter(g => {
      const section = data.sections.find(s => s.id === g.section_id);
      return section && section.project_id !== parseInt(id);
    });
    data.trees = data.trees.filter(t => {
      const group = data.groups.find(g => g.id === t.group_id);
      return group;
    });
    saveData(data);
    return true;
  },

  getAllSections: () => {
    const data = loadData();
    return data.sections || [];
  },

  createSection: (section) => {
    const data = loadData();
    if (!data.sections) data.sections = [];
    if (!data.nextSectionId) data.nextSectionId = 1;
    const newSection = {
      id: data.nextSectionId++,
      ...section,
      created_at: new Date().toISOString()
    };
    data.sections.push(newSection);
    saveData(data);
    return newSection.id;
  },

  updateSection: (id, section) => {
    const data = loadData();
    const index = data.sections.findIndex(s => s.id === parseInt(id));
    if (index !== -1) {
      data.sections[index] = { ...data.sections[index], ...section };
      saveData(data);
      return true;
    }
    return false;
  },

  deleteSection: (id) => {
    const data = loadData();
    data.sections = data.sections.filter(s => s.id !== parseInt(id));
    data.groups = data.groups.filter(g => g.section_id !== parseInt(id));
    data.trees = data.trees.filter(t => {
      const group = data.groups.find(g => g.id === t.group_id);
      return group;
    });
    saveData(data);
    return true;
  },

  getAllGroups: () => {
    const data = loadData();
    return data.groups;
  },

  createGroup: (group) => {
    const data = loadData();
    const newGroup = {
      id: data.nextGroupId++,
      ...group,
      created_at: new Date().toISOString()
    };
    data.groups.push(newGroup);
    saveData(data);
    return newGroup.id;
  },

  updateGroup: (id, group) => {
    const data = loadData();
    const index = data.groups.findIndex(g => g.id === parseInt(id));
    if (index !== -1) {
      data.groups[index] = { ...data.groups[index], ...group };
      saveData(data);
      return true;
    }
    return false;
  },

  deleteGroup: (id) => {
    const data = loadData();
    data.groups = data.groups.filter(g => g.id !== parseInt(id));
    data.trees = data.trees.filter(t => t.group_id !== parseInt(id));
    saveData(data);
    return true;
  },

  getAllTrees: (groupId) => {
    const data = loadData();
    if (groupId) {
      return data.trees.filter(t => t.group_id === parseInt(groupId));
    }
    return data.trees;
  },

  createTree: (tree) => {
    const data = loadData();
    const newTree = {
      id: data.nextTreeId++,
      ...tree,
      created_at: new Date().toISOString()
    };
    data.trees.push(newTree);
    saveData(data);
    return newTree.id;
  },

  updateTree: (id, tree) => {
    const data = loadData();
    const index = data.trees.findIndex(t => t.id === parseInt(id));
    if (index !== -1) {
      data.trees[index] = { ...data.trees[index], ...tree };
      saveData(data);
      return true;
    }
    return false;
  },

  deleteTree: (id) => {
    const data = loadData();
    data.trees = data.trees.filter(t => t.id !== parseInt(id));
    saveData(data);
    return true;
  }
};
