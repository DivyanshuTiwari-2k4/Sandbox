import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Project from '../models/Project.js';
import { detectLanguage } from '../utils/languageDetector.js';

const router = express.Router();

// GET all files for a project
router.get('/:projectId', async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId).select('files activeFileId');
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    const files = project.files instanceof Map 
      ? Object.fromEntries(project.files) 
      : project.files || {};
    
    res.json({ success: true, data: { files, activeFileId: project.activeFileId } });
  } catch (err) {
    next(err);
  }
});

// POST create file or folder
router.post('/:projectId', async (req, res, next) => {
  try {
    const { name, type = 'file', parentId = null, content = '' } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'File name is required' });
    }
    
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    const fileId = uuidv4();
    const language = type === 'file' ? detectLanguage(name) : 'folder';
    
    const newFile = {
      id: fileId,
      name: name.trim(),
      type,
      content: type === 'file' ? content : '',
      language,
      parentId,
      children: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add file to project's files map
    project.files.set(fileId, newFile);
    
    // If file has a parent folder, add to parent's children
    if (parentId && project.files.has(parentId)) {
      const parent = project.files.get(parentId);
      if (!parent.children) parent.children = [];
      parent.children.push(fileId);
      project.files.set(parentId, parent);
    }
    
    // Set as active file if first file
    if (type === 'file' && !project.activeFileId) {
      project.activeFileId = fileId;
    }
    
    project.markModified('files');
    await project.save();
    
    req.io.to(`project:${req.params.projectId}`).emit('file:created', { 
      projectId: req.params.projectId,
      file: newFile 
    });
    
    res.status(201).json({ success: true, data: newFile });
  } catch (err) {
    next(err);
  }
});

// PUT update file content or name
router.put('/:projectId/:fileId', async (req, res, next) => {
  try {
    const { content, name } = req.body;
    const { projectId, fileId } = req.params;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    if (!project.files.has(fileId)) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    
    const file = project.files.get(fileId);
    
    if (content !== undefined) file.content = content;
    if (name !== undefined) {
      file.name = name.trim();
      file.language = detectLanguage(name);
    }
    file.updatedAt = new Date();
    
    project.files.set(fileId, file);
    project.markModified('files');
    await project.save();
    
    req.io.to(`project:${projectId}`).emit('file:updated', { 
      projectId,
      fileId,
      updates: { content, name, updatedAt: file.updatedAt }
    });
    
    res.json({ success: true, data: file });
  } catch (err) {
    next(err);
  }
});

// DELETE file or folder
router.delete('/:projectId/:fileId', async (req, res, next) => {
  try {
    const { projectId, fileId } = req.params;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    if (!project.files.has(fileId)) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    
    const file = project.files.get(fileId);
    
    // Recursively collect IDs to delete
    const idsToDelete = collectDescendantIds(file, project.files);
    idsToDelete.push(fileId);
    
    // Remove from parent's children
    if (file.parentId && project.files.has(file.parentId)) {
      const parent = project.files.get(file.parentId);
      parent.children = (parent.children || []).filter(id => id !== fileId);
      project.files.set(file.parentId, parent);
    }
    
    // Delete all collected files
    idsToDelete.forEach(id => project.files.delete(id));
    
    // Reset activeFileId if deleted
    if (project.activeFileId && idsToDelete.includes(project.activeFileId)) {
      const remainingFiles = [...project.files.values()].filter(f => f.type === 'file');
      project.activeFileId = remainingFiles.length > 0 ? remainingFiles[0].id : null;
    }
    
    project.markModified('files');
    await project.save();
    
    req.io.to(`project:${projectId}`).emit('file:deleted', { 
      projectId,
      fileId,
      deletedIds: idsToDelete
    });
    
    res.json({ success: true, data: { deletedIds: idsToDelete } });
  } catch (err) {
    next(err);
  }
});

// POST move file
router.post('/:projectId/:fileId/move', async (req, res, next) => {
  try {
    const { newParentId, newName } = req.body;
    const { projectId, fileId } = req.params;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    const file = project.files.get(fileId);
    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    
    // Remove from old parent
    if (file.parentId && project.files.has(file.parentId)) {
      const oldParent = project.files.get(file.parentId);
      oldParent.children = (oldParent.children || []).filter(id => id !== fileId);
      project.files.set(file.parentId, oldParent);
    }
    
    // Update file
    file.parentId = newParentId || null;
    if (newName) {
      file.name = newName.trim();
      file.language = detectLanguage(newName);
    }
    file.updatedAt = new Date();
    
    // Add to new parent
    if (newParentId && project.files.has(newParentId)) {
      const newParent = project.files.get(newParentId);
      if (!newParent.children) newParent.children = [];
      newParent.children.push(fileId);
      project.files.set(newParentId, newParent);
    }
    
    project.files.set(fileId, file);
    project.markModified('files');
    await project.save();
    
    req.io.to(`project:${projectId}`).emit('file:moved', { projectId, fileId, file });
    
    res.json({ success: true, data: file });
  } catch (err) {
    next(err);
  }
});

// Helper: recursively collect descendant IDs
function collectDescendantIds(node, filesMap) {
  if (node.type !== 'folder' || !node.children || node.children.length === 0) {
    return [];
  }
  
  let ids = [];
  for (const childId of node.children) {
    ids.push(childId);
    if (filesMap.has(childId)) {
      ids = ids.concat(collectDescendantIds(filesMap.get(childId), filesMap));
    }
  }
  return ids;
}

export default router;