import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

// --- PROFILE QUERIES ---

export const useProfile = (userId?: string) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useCurrentProfile = () => {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
  });
};

// --- POSTS QUERIES (Infinite Scroll example) ---

export const usePosts = (groupId?: string) => {
  return useInfiniteQuery({
    queryKey: ['posts', groupId || 'all'],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * 10;
      const to = from + 9;
      
      let query = supabase
        .from('posts')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false })
        .range(from, to);
        
      if (groupId) {
        query = query.eq('group_id', groupId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length : undefined;
    },
  });
};

// --- SERVICES QUERIES ---

export const useWellnessServices = (category?: string) => {
  return useQuery({
    queryKey: ['services', category || 'all'],
    queryFn: async () => {
      let query = supabase.from('wellness_services').select('*');
      if (category) query = query.eq('category', category);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};
