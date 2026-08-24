import { buildApp } from './app.js';
import { env } from './config/env.js';

const app = buildApp();

const server = app.listen(env.PORT, () => {
  console.log(`[guidely] API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

// Graceful shutdown so `node --watch` restarts and container stops don't leak the port.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
