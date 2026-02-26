import { supabase } from '../config/supabase.js';

export const dmHandler = (io, socket) => {
  // Entrar na sala da conversa
  socket.on('dm:join', (conversationId) => {
    socket.join(`dm:${conversationId}`);
  });

  // Enviar DM
  socket.on('dm:message', async ({ conversationId, content }) => {
    try {
      const { data: message, error } = await supabase
        .from('direct_messages')
        .insert([{ conversation_id: conversationId, author_id: socket.user.id, content }])
        .select(`
          *,
          author:profiles!direct_messages_author_id_fkey(id, username, display_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      io.to(`dm:${conversationId}`).emit('dm:message', message);
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });
};