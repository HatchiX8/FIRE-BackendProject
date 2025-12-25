import 'dotenv/config';
import { createApp } from './app.js';
import { AppDataSource } from './db/data-source.js';

const rawPort = process.env.PORT?.trim();

let port: number;

if (rawPort && /^\d+$/.test(rawPort)) {
  port = Number.parseInt(rawPort, 10);
} else if (process.env.NODE_ENV !== 'production') {
  port = 1911; // local / dev fallback
} else {
  throw new Error(`Invalid PORT env in production: "${rawPort}"`);
}

async function bootstrap() {
  await AppDataSource.initialize();

  const app = createApp();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`[api] listening on http://localhost:${port}`);
  });
}

bootstrap().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[api] bootstrap failed:', err);
  process.exit(1);
});
