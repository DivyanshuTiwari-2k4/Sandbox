import express from 'express';
import Project from '../models/Project.js';

const router = express.Router();

// GET installed packages for a project
router.get('/:projectId', async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId).select('installedPackages');
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({ success: true, data: project.installedPackages });
  } catch (err) {
    next(err);
  }
});

// POST install package
router.post('/:projectId/install', async (req, res, next) => {
  try {
    const { packageName } = req.body;
    
    if (!packageName || !packageName.trim()) {
      return res.status(400).json({ success: false, error: 'Package name is required' });
    }

    const cleanName = packageName.trim().toLowerCase();
    
    // Validate package name format
    const validPackageRegex = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*(@[\w.-]+)?$/;
    if (!validPackageRegex.test(cleanName)) {
      return res.status(400).json({ success: false, error: 'Invalid package name format' });
    }

    // Emit install start event
    req.io.to(`project:${req.params.projectId}`).emit('package:installing', { 
      packageName: cleanName,
      status: 'fetching'
    });

    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Check if already installed
    const existingIdx = project.installedPackages.findIndex(p => p.name === cleanName);
    
    const packageEntry = {
      name: cleanName,
      version: 'latest',
      installedAt: new Date()
    };
    
    if (existingIdx >= 0) {
      project.installedPackages[existingIdx] = packageEntry;
    } else {
      project.installedPackages.push(packageEntry);
    }

    await project.save();

    // Emit success
    req.io.to(`project:${req.params.projectId}`).emit('package:installed', { 
      packageName: cleanName,
      version: 'latest',
      status: 'success'
    });

    res.json({ 
      success: true, 
      data: packageEntry,
      message: `Package '${cleanName}' added successfully.`
    });
  } catch (err) {
    req.io.to(`project:${req.params.projectId}`).emit('package:error', { 
      packageName: req.body.packageName,
      error: err.message 
    });
    next(err);
  }
});

// DELETE uninstall package
router.delete('/:projectId/:packageName', async (req, res, next) => {
  try {
    const { projectId, packageName } = req.params;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    const beforeLen = project.installedPackages.length;
    project.installedPackages = project.installedPackages.filter(p => p.name !== packageName);
    
    if (project.installedPackages.length === beforeLen) {
      return res.status(404).json({ success: false, error: 'Package not found in project' });
    }
    
    await project.save();
    
    req.io.to(`project:${projectId}`).emit('package:uninstalled', { packageName });
    
    res.json({ success: true, message: `Package '${packageName}' removed` });
  } catch (err) {
    next(err);
  }
});

// GET search popular packages
router.get('/search/:query', async (req, res, next) => {
  try {
    const popularPackages = [
      { name: 'lodash', description: 'JavaScript utility library', version: '4.17.21' },
      { name: 'axios', description: 'Promise based HTTP client', version: '1.6.2' },
      { name: 'moment', description: 'Parse and display dates', version: '2.29.4' },
      { name: 'dayjs', description: 'Fast 2kB date utility library', version: '1.11.10' },
      { name: 'uuid', description: 'UUID generation', version: '9.0.0' },
      { name: 'chart.js', description: 'Simple HTML5 charts', version: '4.4.0' },
      { name: 'd3', description: 'Data-Driven Documents', version: '7.8.5' },
      { name: 'three', description: '3D library for the web', version: '0.159.0' },
      { name: 'gsap', description: 'Animation library', version: '3.12.3' },
      { name: 'react', description: 'UI component library', version: '18.2.0' },
      { name: 'vue', description: 'Progressive JavaScript framework', version: '3.3.9' },
      { name: 'jquery', description: 'JavaScript library', version: '3.7.1' },
      { name: 'bootstrap', description: 'CSS framework', version: '5.3.2' },
      { name: 'marked', description: 'Markdown parser', version: '9.1.6' },
      { name: 'highlight.js', description: 'Syntax highlighting', version: '11.9.0' }
    ];
    
    const query = req.params.query.toLowerCase();
    const filtered = popularPackages.filter(p => 
      p.name.includes(query) || p.description.toLowerCase().includes(query)
    );
    
    res.json({ success: true, data: filtered.slice(0, 10) });
  } catch (err) {
    next(err);
  }
});

export default router;