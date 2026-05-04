import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

export function useVitus() {
  const { profile, refreshProfile } = useAuth();

  const addVitus = async (amount: number, action: string) => {
    if (!profile) return { error: 'Utilizador não autenticado' };

    try {
      // Call the RPC function defined in the schema
      const { error } = await supabase.rpc('increment_vitus', {
        user_id_param: profile.id,
        amount_param: amount,
        action_param: action,
      });

      if (error) throw error;

      // Refresh local profile to show updated balance
      await refreshProfile();
      return { success: true };
    } catch (error) {
      console.error('Error adding vitus:', error);
      return { error };
    }
  };

  return {
    balance: profile?.vitus_balance ?? 0,
    addVitus,
  };
}
