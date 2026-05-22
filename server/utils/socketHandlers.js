import Project from '../models/Project.js';

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join a project room
    socket.on('project:join', async ({ projectId }) => {
      socket.join(`project:${projectId}`);
      console.log(`📁 Socket ${socket.id} joined project:${projectId}`);
      socket.emit('project:joined', { projectId });
    });

    // Leave project room
    socket.on('project:leave', ({ projectId }) => {
      socket.leave(`project:${projectId}`);
      console.log(`👋 Socket ${socket.id} left project:${projectId}`);
    });

    // Real-time file content sync
    socket.on('file:change', async ({ projectId, fileId, content }) => {
      try {
        // Broadcast to all OTHER clients in same project room
        socket.to(`project:${projectId}`).emit('file:changed', {
          fileId,
          content,
          senderId: socket.id,
          timestamp: Date.now()
        });

        // Auto-save to DB
        await Project.findByIdAndUpdate(
          projectId,
          { 
            $set: { 
              [`files.${fileId}.content`]: content, 
              [`files.${fileId}.updatedAt`]: new Date() 
            } 
          }
        );
      } catch (err) {
        console.error('Error syncing file change:', err);
        socket.emit('error', { message: 'Failed to sync file change' });
      }
    });

    // Cursor position broadcast
    socket.on('cursor:move', ({ projectId, fileId, position, userId }) => {
      socket.to(`project:${projectId}`).emit('cursor:moved', {
        fileId,
        position,
        userId,
        senderId: socket.id
      });
    });

    // Terminal command execution
    socket.on('terminal:command', ({ projectId, command }) => {
      console.log(`💻 Terminal command in ${projectId}: ${command}`);
      
      const cmd = command.trim();
      let output = '';

      if (cmd === 'clear' || cmd === 'cls') {
        socket.emit('terminal:clear');
        return;
      } else if (cmd === 'ls' || cmd === 'dir') {
        output = 'index.html  styles.css  app.js  package.json';
      } else if (cmd.startsWith('echo ')) {
        output = cmd.slice(5);
      } else if (cmd === 'pwd') {
        output = '/workspace';
      } else if (cmd === 'node --version' || cmd === 'node -v') {
        output = 'v20.10.0';
      } else if (cmd === 'npm --version' || cmd === 'npm -v') {
        output = '10.2.3';
      } else if (cmd.startsWith('npm install ')) {
        const pkg = cmd.replace('npm install ', '').trim();
        output = `Installing ${pkg}...\nadded 1 package successfully`;
      } else if (cmd === 'help') {
        output = [
          'Available commands:',
          '  ls / dir       - List files',
          '  pwd            - Print working directory',
          '  echo <text>    - Print text',
          '  node -v        - Node version',
          '  npm -v         - NPM version',
          '  npm install    - Install package',
          '  clear / cls    - Clear terminal',
        ].join('\n');
      } else {
        output = `bash: ${cmd.split(' ')[0]}: command not found\nType "help" for available commands.`;
      }
      
      socket.emit('terminal:output', { 
        command,
        output,
        type: output.includes('not found') ? 'error' : 'success',
        timestamp: Date.now()
      });
    });

    // Preview refresh
    socket.on('preview:refresh', ({ projectId }) => {
      io.to(`project:${projectId}`).emit('preview:refreshed', { 
        projectId, 
        timestamp: Date.now() 
      });
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
    });

    socket.on('error', (err) => {
      console.error(`Socket error for ${socket.id}:`, err);
    });
  });
}