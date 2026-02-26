import { supabase } from '../config/supabase.js';

export const chatHandler = (io, socket) => {
  // Entrar em um canal de texto
  socket.on('channel:join', (channelId) => {
    socket.join(`channel:${channelId}`);
    console.log(`${socket.user.email} entrou no canal ${channelId}`);
  });

  // Sair de um canal
  socket.on('channel:leave', (channelId) => {
    socket.leave(`channel:${channelId}`);
  });

  // Enviar mensagem em um canal
  socket.on('channel:message', async ({ channelId, content }) => {
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert([{ channel_id: channelId, author_id: socket.user.id, content }])
        .select(`
          *,
          author:profiles!messages_author_id_fkey(id, username, display_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Emite para todos no canal (incluindo quem enviou)
      io.to(`channel:${channelId}`).emit('channel:message', message);
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });
};