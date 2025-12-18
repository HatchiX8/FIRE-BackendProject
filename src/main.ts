import 'dotenv/config';
import { createApp } from './app';
import { AppDataSource } from './db/data-source';

const port = Number(process.env.PORT ?? '3001');

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
