import express from 'express';
import askRoutes from './routes/ask.routes';
import cors from 'cors';

const server = express();

server.use(cors())
server.use(express.json());

server.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

server.use('/', askRoutes);

export default server;
