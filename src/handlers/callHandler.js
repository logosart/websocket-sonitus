// Mapa de salas de voz ativas: { roomId: Set(userId) }
const voiceRooms = new Map();

export const callHandler = (io, socket) => {
  // Iniciar ou entrar em uma call (canal de voz ou DM)
  socket.on('call:join', ({ roomId }) => {
    socket.join(`call:${roomId}`);

    if (!voiceRooms.has(roomId)) voiceRooms.set(roomId, new Set());
    voiceRooms.get(roomId).add(socket.user.id);

    // Avisa os outros na sala que alguém entrou
    socket.to(`call:${roomId}`).emit('call:user_joined', {
      userId: socket.user.id,
    });

    // Envia para quem entrou a lista de quem já está na sala
    socket.emit('call:existing_users', {
      users: [...voiceRooms.get(roomId)].filter(id => id !== socket.user.id),
    });

    console.log(`${socket.user.email} entrou na call ${roomId}`);
  });

  // Sinalização WebRTC: Offer
  socket.on('call:offer', ({ targetUserId, offer }) => {
    socket.to(`user:${targetUserId}`).emit('call:offer', {
      fromUserId: socket.user.id,
      offer,
    });
  });

  // Sinalização WebRTC: Answer
  socket.on('call:answer', ({ targetUserId, answer }) => {
    socket.to(`user:${targetUserId}`).emit('call:answer', {
      fromUserId: socket.user.id,
      answer,
    });
  });

  // Sinalização WebRTC: ICE Candidate
  socket.on('call:ice_candidate', ({ targetUserId, candidate }) => {
    socket.to(`user:${targetUserId}`).emit('call:ice_candidate', {
      fromUserId: socket.user.id,
      candidate,
    });
  });

  // Sair da call
  socket.on('call:leave', ({ roomId }) => {
    socket.leave(`call:${roomId}`);
    voiceRooms.get(roomId)?.delete(socket.user.id);

    if (voiceRooms.get(roomId)?.size === 0) voiceRooms.delete(roomId);

    io.to(`call:${roomId}`).emit('call:user_left', {
      userId: socket.user.id,
    });
  });

  // Limpeza automática ao desconectar
  socket.on('disconnect', () => {
    voiceRooms.forEach((users, roomId) => {
      if (users.has(socket.user.id)) {
        users.delete(socket.user.id);
        io.to(`call:${roomId}`).emit('call:user_left', { userId: socket.user.id });
        if (users.size === 0) voiceRooms.delete(roomId);
      }
    });
  });
};