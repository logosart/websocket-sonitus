import { createClient } from '@supabase/supabase-js';

export const dmHandler = (io, socket) => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${socket.accessToken}`,
        },
      },
    }
  );

  socket.on('join_dm', (conversationId) => {
    socket.join(`dm:${conversationId}`);
    console.log(`${socket.userId} entrou na conversa ${conversationId}`);
  });

  socket.on('send_dm', async ({ conversationId, content }) => {
    console.log("Token:", socket.accessToken ? "✅ presente" : "❌ NULO");
    console.log("UserId:", socket.userId);
    console.log("💾 SALVANDO NO BANCO - ConvID:", conversationId, "Content:", content);

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .insert([{
          conversation_id: conversationId,
          sender_id: socket.userId,
          content
        }])
        .select(`
          id,
          content,
          created_at,
          sender_id,
          conversation_id,
          profiles:sender_id(username)
        `)
        .single();

      if (error) throw error;

      console.log("✅ Mensagem salva com ID:", data.id, "no ConvID real:", data.conversation_id);

      io.to(`dm:${conversationId}`).emit('new_dm', {
        id: data.id,
        content: data.content,
        created_at: data.created_at,
        sender_id: data.sender_id,
        sender_username: data.profiles.username
      });

    } catch (err) {
      console.error('Erro ao salvar mensagem:', err.message);
      socket.emit('error', { message: 'Erro ao enviar mensagem' });
    }
  });
};