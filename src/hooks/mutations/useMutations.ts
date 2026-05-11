import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    // Optimistic Update can be added here
    onSuccess: (data) => {
      // Invalidate current user profile
      queryClient.setQueryData(['profile', 'me'], data);
      queryClient.invalidateQueries({ queryKey: ['profile', data.id] });
    },
  });
};

export const useCreatePostMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (post: any) => {
      const { data, error } = await supabase
        .from('posts')
        .insert([post])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate posts list to trigger refetch (only when needed)
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useBookServiceMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (booking: any) => {
      const { data, error } = await supabase
        .from('bookings')
        .insert([booking])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};
