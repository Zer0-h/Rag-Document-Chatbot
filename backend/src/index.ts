import 'dotenv/config';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import server from './server.js';
import { ingestDocuments } from './rag/ingest.js';
import { setStore } from './services/ask.service.js';
import { flushAsync } from './services/observability.service.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = resolve(__dirname, '../../docs');
const PORT = process.env.PORT;

async function main() {
  const store = await ingestDocuments(DOCS_DIR);
  setStore(store);

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

async function shutdown() {
  console.log('Flushing LangFuse traces...');
  await flushAsync();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});