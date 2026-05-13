import { createClient } from '@supabase/supabase-js';

// Helper to safely get environment variables and clean project URL
const getEnv = (key: string): string => {
  const value = (import.meta as any).env?.[key] || (process as any).env?.[key] || '';
  let trimmed = value.trim();
  
  if (key === 'VITE_SUPABASE_URL') {
    // Se o utilizador colou o URL do dashboard (com /rest/v1/), removemos isso
    trimmed = trimmed.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  }
  
  return trimmed;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

export const isConfigured = Boolean(
  supabaseUrl && 
  supabaseUrl.startsWith('https://') && 
  !supabaseUrl.includes('your-project-id') &&
  supabaseAnonKey
);

// Diagnostic log (safe, only shows start of URL)
if (isConfigured) {
  console.log('✅ Supabase configurado corretamente:', supabaseUrl.substring(0, 15) + '...');
} else {
  console.warn('⚠️ Supabase NÃO configurado. Verifique as Secrets no AI Studio.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-viva.supabase.co', 
  supabaseAnonKey || 'placeholder'
);

export type Profile = {
  id: string;
  username: string;
  full_name?: string;
  email?: string;
  bio?: string;
  avatar_url?: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  marital_status?: string;
  id_card_number?: string;
  province?: string;
  municipality?: string;
  vitus_balance: number;
  is_professional: boolean;
  specialty?: string;
  license_number?: string;
  is_verified: boolean;
  is_premium: boolean;
  xp_level: number;
  created_at: string;
};

export type Pharmacy = {
  id: string;
  owner_id: string;
  name: string;
  license_number: string;
  address: string;
  phone?: string;
  email?: string;
  opening_hours: {
    [key: string]: string;
  };
  description?: string;
  image_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  rating: number;
  created_at: string;
};

export type MedicalEstablishment = {
  id: string;
  owner_id: string;
  name: string;
  type: 'Clínica' | 'Posto Médico' | 'Hospital';
  license_number: string;
  province: string;
  municipality: string;
  address: string;
  phone?: string;
  email?: string;
  services: string[];
  opening_hours: {
    [key: string]: string;
  };
  description?: string;
  image_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  rating: number;
  created_at: string;
};

export type ProfessionalVerification = {
  id: string;
  user_id: string;
  professional_order: string;
  license_number: string;
  specialty: string;
  academic_degree?: string;
  phone_business?: string;
  workplace_name?: string;
  workplace_address?: string;
  image_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
};

export type HealthProfessional = {
  id: string;
  professional_order: string;
  license_number: string;
  workplace_name?: string;
  workplace_address?: string;
  specialty: string;
  academic_degree?: string;
  phone_business?: string;
  image_url?: string;
  is_verified: boolean;
  verified_at?: string;
  created_at: string;
};

export type HealthGroup = {
  id: string;
  creator_id: string;
  name: string;
  description?: string;
  category?: string;
  avatar_url?: string;
  theme_color: string;
  is_private: boolean;
  member_count: number;
  created_at: string;
  rules?: string;
  creator?: { username: string; avatar_url: string };
};

export type HealthGroupMember = {
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  group_id?: string;
  content_url: string;
  image_url?: string;
  caption?: string;
  category?: string;
  likes_count: number;
  is_approved: boolean;
  created_at: string;
  profiles?: Profile;
};

export type PostVideo = {
  id: string;
  user_id: string;
  caption: string;
  youtube_url?: string;
  category: string;
  is_approved: boolean;
  likes_count: number;
  created_at: string;
  profiles?: Profile;
};

export type Reel = {
  id: string;
  user_id: string;
  video_url: string;
  caption?: string;
  likes_count: number;
  is_approved: boolean;
  created_at: string;
  profiles?: Profile;
};

export type WellnessService = {
  id: string;
  name: string;
  provider_id: string;
  provider_name: string;
  category: string;
  location: string;
  image_url?: string;
  description?: string;
  base_price: number;
  vitus_discount_cap: number;
  rating: number;
  created_at: string;
};

export type Booking = {
  id: string;
  user_id: string;
  service_id: string;
  status: 'pendente' | 'confirmado' | 'concluído' | 'cancelado';
  vitus_spent: number;
  total_price: number;
  scheduled_at: string;
  created_at: string;
};

export type SavedItem = {
  id: string;
  user_id: string;
  item_id: string;
  item_type: 'post' | 'direct_message' | 'group_message' | 'service' | 'product';
  metadata?: any;
  created_at: string;
};
