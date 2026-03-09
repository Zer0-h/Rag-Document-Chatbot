import 'dotenv/config';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import server from './server.js';
import { ingestDocuments } from './rag/ingest.js';
import { setStore } from './services/ask.service.js';

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

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});