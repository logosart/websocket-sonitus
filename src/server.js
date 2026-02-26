import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { authMiddleware } from './middlewares/authMiddleware.js';
import { chatHandler } from './handlers/chatHandler.js';
import { dmHandler } from './handlers/dmHandler.js';
import { callHandler } from './handlers/callHandler.js';

dotenv.config();

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Trocar pelo domínio do frontend em produção
    methods: ['GET', 'POST']
  }
});

// Middleware de autenticação (roda antes de qualquer conexão)
io.use(authMiddleware);

io.on('connection', (socket) => {
  console.log(`✅ Conectado: ${socket.user.email}`);

  // Cada usuário entra em uma sala pessoal (para receber calls diretas)
  socket.join(`user:${socket.user.id}`);

  // Registrar handlers
  chatHandler(io, socket);
  dmHandler(io, socket);
  callHandler(io, socket);

  socket.on('disconnect', () => {
    console.log(`❌ Desconectado: ${socket.user.email}`);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`⚡ Sonitus WebSocket running on port ${PORT}`);
});