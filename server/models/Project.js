import mongoose from 'mongoose';

const FileNodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['file', 'folder'], required: true },
  content: { type: String, default: '' },
  language: { type: String, default: 'javascript' },
  parentId: { type: String, default: null },
  children: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const ProjectSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 100
  },
  description: { 
    type: String, 
    default: '',
    maxlength: 500
  },
  template: {
    type: String,
    enum: ['blank', 'react', 'vanilla-js', 'node-express', 'html-css'],
    default: 'blank'
  },
  files: {
    type: Map,
    of: FileNodeSchema,
    default: {}
  },
  activeFileId: { 
    type: String, 
    default: null 
  },
  installedPackages: [{
    name: { type: String, required: true },
    version: { type: String, default: 'latest' },
    installedAt: { type: Date, default: Date.now }
  }],
  settings: {
    theme: { type: String, default: 'dark' },
    fontSize: { type: Number, default: 14 },
    tabSize: { type: Number, default: 2 },
    wordWrap: { type: Boolean, default: true },
    autoSave: { type: Boolean, default: true }
  },
  lastOpenedFiles: [{ type: String }],
  isPublic: { type: Boolean, default: false },
  tags: [{ type: String }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ name: 'text', description: 'text' });

// Virtual for file count
ProjectSchema.virtual('fileCount').get(function() {
  return this.files ? this.files.size : 0;
});

export default mongoose.model('Project', ProjectSchema);