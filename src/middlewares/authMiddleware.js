import { supabase } from '../config/supabase.js';

export const authMiddleware = async (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Token não fornecido'));
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return next(new Error('Token inválido'));

    socket.user = user; // Injeta o usuário no socket para uso nos handlers
    next();
  } catch (err) {
    next(new Error('Erro de autenticação'));
  }
};