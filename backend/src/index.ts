import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

import app from './app.js';
import { config } from './config/env.js';

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`✅ Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📍 Endpoint de login: http://localhost:${PORT}/api/auth/login`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Error: El puerto ${PORT} ya está en uso`);
  } else {
    console.error('❌ Error al iniciar el servidor:', error);
  }
  process.exit(1);
});
