import { supabase } from '@/lib/customSupabaseClient';

export const logAction = async (action, details = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('audit_logs').insert({
      user_id: user.id,
      action,
      details,
    });

    if (error) {
      console.error('Error logging action:', error);
    }
  } catch (error) {
    console.error('Error in logAction:', error);
  }
};