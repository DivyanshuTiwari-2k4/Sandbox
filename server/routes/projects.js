import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Project from '../models/Project.js';
import { getTemplateFiles } from '../utils/templates.js';

const router = express.Router();

// GET all projects
router.get('/', async (req, res, next) => {
  try {
    const projects = await Project.find({})
      .select('name description template createdAt updatedAt installedPackages settings tags')
      .sort({ updatedAt: -1 })
      .lean();
    
    res.json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
});

// GET single project
router.get('/:id', async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    const projectObj = project.toObject();
    if (projectObj.files instanceof Map) {
      projectObj.files = Object.fromEntries(projectObj.files);
    }
    
    res.json({ success: true, data: projectObj });
  } catch (err) {
    next(err);
  }
});

// POST create project
router.post('/', async (req, res, next) => {
  try {
    const { name, description, template = 'blank', settings } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Project name is required' });
    }

    const templateFiles = getTemplateFiles(template);
    
    const project = new Project({
      name: name.trim(),
      description: description || '',
      template,
      files: templateFiles.files,
      activeFileId: templateFiles.activeFileId,
      settings: { 
        ...{ theme: 'dark', fontSize: 14, tabSize: 2, wordWrap: true, autoSave: true }, 
        ...settings 
      }
    });

    await project.save();
    
    const projectObj = project.toObject();
    if (projectObj.files instanceof Map) {
      projectObj.files = Object.fromEntries(projectObj.files);
    }
    
    req.io.emit('project:created', { projectId: project._id, name: project.name });
    
    res.status(201).json({ success: true, data: projectObj });
  } catch (err) {
    next(err);
  }
});

// PUT update project
router.put('/:id', async (req, res, next) => {
  try {
    const { name, description, settings, activeFileId, lastOpenedFiles, tags } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (settings !== undefined) updateData.settings = settings;
    if (activeFileId !== undefined) updateData.activeFileId = activeFileId;
    if (lastOpenedFiles !== undefined) updateData.lastOpenedFiles = lastOpenedFiles;
    if (tags !== undefined) updateData.tags = tags;
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    req.io.to(`project:${req.params.id}`).emit('project:updated', { 
      projectId: req.params.id, 
      updates: updateData 
    });
    
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

// DELETE project
router.delete('/:id', async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    req.io.emit('project:deleted', { projectId: req.params.id });
    
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// POST duplicate project
router.post('/:id/duplicate', async (req, res, next) => {
  try {
    const original = await Project.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    const duplicateData = original.toObject();
    delete duplicateData._id;
    delete duplicateData.id;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;
    duplicateData.name = `${original.name} (Copy)`;
    
    const duplicate = new Project(duplicateData);
    await duplicate.save();
    
    const projectObj = duplicate.toObject();
    if (projectObj.files instanceof Map) {
      projectObj.files = Object.fromEntries(projectObj.files);
    }
    
    res.status(201).json({ success: true, data: projectObj });
  } catch (err) {
    next(err);
  }
});

export default router;