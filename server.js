const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/api/projects', (req, res) => {
  try {
    const projects = db.getAllProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects', (req, res) => {
  try {
    const { name, wd_number, work_type } = req.body;
    const id = db.createProject({ name, wd_number, work_type });
    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/projects/:id', (req, res) => {
  try {
    const { name, wd_number, work_type } = req.body;
    db.updateProject(req.params.id, { name, wd_number, work_type });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/projects/:id', (req, res) => {
  try {
    db.deleteProject(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sections', (req, res) => {
  try {
    const sections = db.getAllSections();
    res.json(sections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sections', (req, res) => {
  try {
    const { project_id, name, section_number, description } = req.body;
    const id = db.createSection({ project_id, name, section_number, description });
    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sections/:id', (req, res) => {
  try {
    const { project_id, name, section_number, description } = req.body;
    db.updateSection(req.params.id, { project_id, name, section_number, description });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/sections/:id', (req, res) => {
  try {
    db.deleteSection(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/groups', (req, res) => {
  try {
    const groups = db.getAllGroups();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/groups', (req, res) => {
  try {
    const { section_id, name, circuit_number, section_number, id_number, comments, brush_amount, cutting_equipment, cleanup_equipment, customer_notification } = req.body;
    const id = db.createGroup({ section_id, name, circuit_number, section_number, id_number, comments, brush_amount, cutting_equipment, cleanup_equipment, customer_notification });
    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/groups/:id', (req, res) => {
  try {
    const { section_id, name, circuit_number, section_number, id_number, comments, brush_amount, cutting_equipment, cleanup_equipment, customer_notification, completed } = req.body;
    db.updateGroup(req.params.id, { section_id, name, circuit_number, section_number, id_number, comments, brush_amount, cutting_equipment, cleanup_equipment, customer_notification, completed });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/groups/:id', (req, res) => {
  try {
    db.deleteGroup(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/trees', (req, res) => {
  try {
    const groupId = req.query.group_id;
    const trees = db.getAllTrees(groupId);
    res.json(trees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/trees', (req, res) => {
  try {
    const { group_id, latitude, longitude, species, diameter, tree_type, action, health_condition, notes } = req.body;
    const id = db.createTree({ group_id, latitude, longitude, species, diameter, tree_type, action, health_condition, notes });
    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/trees/:id', (req, res) => {
  try {
    const { group_id, latitude, longitude, species, diameter, tree_type, action, health_condition, notes, completed } = req.body;
    db.updateTree(req.params.id, { group_id, latitude, longitude, species, diameter, tree_type, action, health_condition, notes, completed });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/trees/:id', (req, res) => {
  try {
    db.deleteTree(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Tree Survey App running on http://localhost:${PORT}`);
});
