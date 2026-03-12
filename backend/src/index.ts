import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

import app from './app.js';
import { config } from './config/env.js';

const PORT = config.port;
const baseUrl = config.apiBaseUrl ?? `http://localhost:${PORT}`;

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Login endpoint: ${baseUrl}/api/auth/login`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Error: Port ${PORT} is already in use`);
  } else {
    console.error('❌ Error starting server:', error);
  }
  process.exit(1);
});
