-- VIVA+ Database Schema (Supabase/PostgreSQL)
-- This SQL should be executed in the Supabase SQL Editor.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text,
  bio text,
  avatar_url text,
  vitus_balance bigint default 0 check (vitus_balance >= 0),
  is_professional boolean default false,
  specialty text,
  email text,
  license_number text,
  is_verified boolean default false,
  is_admin boolean default false,
  xp_level integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Health Groups (Reddit-style interaction)
create table if not exists health_groups (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references profiles(id) on delete cascade not null,
  name text not null unique,
  description text,
  category text,
  avatar_url text,
  theme_color text default '#006747',
  is_private boolean default false,
  member_count integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Health Group Members
create table if not exists health_group_members (
  group_id uuid references health_groups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  role text default 'member', -- member, moderator, admin
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (group_id, user_id)
);

-- 4. Posts Table
create table if not exists posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  group_id uuid references health_groups(id) on delete cascade,
  content_url text not null,
  image_url text,
  caption text,
  category text,
  likes_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Likes Table
create table if not exists likes (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, user_id)
);

-- 6. Vitus Ledger
create table if not exists vitus_ledger (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  amount integer not null,
  action_type text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Wellness Services (Marketplace)
create table if not exists wellness_services (
  id uuid default uuid_generate_v4() primary key,
  provider_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  provider_name text not null,
  category text not null,
  location text,
  image_url text,
  description text,
  base_price numeric not null,
  vitus_discount_cap integer default 50,
  rating numeric default 5.0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Bookings
create table if not exists bookings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  service_id uuid references wellness_services(id) on delete cascade not null,
  status text default 'pendente' check (status in ('pendente', 'confirmado', 'concluído', 'cancelado')),
  vitus_spent integer default 0,
  total_price numeric not null,
  scheduled_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Health Professional Table
create table if not exists health_professionals (
  id uuid references profiles(id) on delete cascade primary key,
  professional_order text not null,
  license_number text not null unique,
  workplace_name text,
  workplace_address text,
  specialty text not null,
  academic_degree text,
  phone_business text,
  image_url text,
  professional_image_url text,
  verification_doc_url text,
  is_verified boolean default false,
  verified_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Professional Verification Requests
create table if not exists professional_verifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  professional_order text not null,
  license_number text not null,
  specialty text not null,
  academic_degree text,
  phone_business text,
  workplace_name text,
  workplace_address text,
  image_url text,
  professional_image_url text,
  verification_doc_url text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RPC Functions
create or replace function increment_vitus(user_id_param uuid, amount_param integer, action_param text)
returns void as $$
begin
  update profiles set vitus_balance = vitus_balance + amount_param where id = user_id_param;
  insert into vitus_ledger (user_id, amount, action_type) values (user_id_param, amount_param, action_param);
end;
$$ language plpgsql security definer;

-- Trigger for new user
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url, email)
  values (new.id, split_part(new.email, '@', 1), new.raw_user_meta_data->>'full_name', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id || '&backgroundColor=b6e3f4', new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- RLS Policies
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Admins can update all profiles" on profiles for update using (exists (select 1 from profiles where id = auth.uid() and email = 'davidcumbo69@gmail.com'));

alter table health_groups enable row level security;
create policy "Groups are viewable by everyone" on health_groups for select using (true);
create policy "Professionals can create groups" on health_groups for insert with check (exists (select 1 from profiles where id = auth.uid() and is_professional = true));
create policy "Creators can update groups" on health_groups for update using (auth.uid() = creator_id);

-- Enable RLS for health_group_members
alter table health_group_members enable row level security;
create policy "Membership is public" on health_group_members for select using (true);
create policy "Users can join/leave groups" on health_group_members for all using (auth.uid() = user_id);

-- Trigger to update member_count in health_groups
create or replace function handle_member_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update health_groups set member_count = member_count + 1 where id = new.group_id;
  elsif (TG_OP = 'DELETE') then
    update health_groups set member_count = member_count - 1 where id = old.group_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_member_added after insert on health_group_members for each row execute procedure handle_member_count();
create trigger on_member_removed after delete on health_group_members for each row execute procedure handle_member_count();

-- Group Discussion Topics
create table health_group_topics (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references health_groups(id) on delete cascade not null,
  creator_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  content text,
  topic_type text default 'discussion', -- 'discussion', 'qa', 'announcement'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table health_group_topics enable row level security;
create policy "Topics are viewable by group members" on health_group_topics for select using (
  exists (select 1 from health_group_members where group_id = health_group_topics.group_id and user_id = auth.uid()) OR
  exists (select 1 from health_groups where id = health_group_topics.group_id and creator_id = auth.uid())
);
create policy "Members can create topics" on health_group_topics for insert with check (
  exists (select 1 from health_group_members where group_id = group_id and user_id = auth.uid()) OR
  exists (select 1 from health_groups where id = group_id and creator_id = auth.uid())
);

-- Topic Comments/Messages
create table health_topic_messages (
  id uuid primary key default uuid_generate_v4(),
  topic_id uuid references health_group_topics(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table health_topic_messages enable row level security;
create policy "Messages are viewable by topic accessible users" on health_topic_messages for select using (
  exists (select 1 from health_group_topics where id = topic_id)
);
create policy "Members can post messages" on health_topic_messages for insert with check (
  exists (select 1 from health_group_topics t join health_group_members m on t.group_id = m.group_id where t.id = topic_id and m.user_id = auth.uid()) OR
  exists (select 1 from health_group_topics t join health_groups g on t.group_id = g.id where t.id = topic_id and g.creator_id = auth.uid())
);

alter table posts enable row level security;
create policy "Posts are viewable by everyone" on posts for select using (true);
create policy "Only health professionals can create posts" on posts for insert with check (exists (select 1 from health_professionals where id = auth.uid() OR exists (select 1 from health_group_members where group_id = group_id and user_id = auth.uid())));
create policy "Users can delete their own posts" on posts for delete using (auth.uid() = user_id);

alter table vitus_ledger enable row level security;
create policy "Users can view their own ledger" on vitus_ledger for select using (auth.uid() = user_id);
create policy "Anyone can insert ledger entries" on vitus_ledger for insert with check (auth.uid() = user_id OR exists (select 1 from profiles where id = auth.uid() and email = 'davidcumbo69@gmail.com'));

alter table wellness_services enable row level security;
create policy "Wellness services are viewable by everyone" on wellness_services for select using (true);
create policy "Professionals can manage their services" on wellness_services for all using (auth.uid() = provider_id);

alter table bookings enable row level security;
create policy "Users can view their own bookings" on bookings for select using (auth.uid() = user_id OR exists (select 1 from wellness_services s where s.id = service_id and s.provider_id = auth.uid()));
create policy "Users can create their own bookings" on bookings for insert with check (auth.uid() = user_id);
create policy "Professionals can update bookings for their services" on bookings for update using (exists (select 1 from wellness_services s where s.id = service_id and s.provider_id = auth.uid()));

alter table health_professionals enable row level security;
create policy "Health professionals viewable" on health_professionals for select using (true);
create policy "Users update own professional info" on health_professionals for update using (auth.uid() = id);
create policy "Admins manage professionals" on health_professionals for all using (exists (select 1 from profiles where id = auth.uid() and email = 'davidcumbo69@gmail.com'));

alter table professional_verifications enable row level security;
create policy "Users can view own verifications" on professional_verifications for select using (auth.uid() = user_id);
create policy "Users can create verification" on professional_verifications for insert with check (auth.uid() = user_id);
create policy "Admins can view all verifications" on professional_verifications for select using (exists (select 1 from profiles where id = auth.uid() and email = 'davidcumbo69@gmail.com'));
create policy "Admins can update verifications" on professional_verifications for update using (exists (select 1 from profiles where id = auth.uid() and email = 'davidcumbo69@gmail.com'));

-- 11. Products (Marketplace)
create table if not exists products (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  description text,
  price numeric not null,
  image_url text,
  category text not null,
  stock_quantity integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. Product Orders
create table if not exists product_orders (
  id uuid default uuid_generate_v4() primary key,
  buyer_id uuid references profiles(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  quantity integer default 1,
  total_price numeric not null,
  vitus_used numeric default 0,
  cash_paid numeric default 0,
  status text default 'pendente' check (status in ('pendente', 'enviado', 'concluído', 'cancelado')),
  shipped_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Vitus Logic Functions & Triggers

-- A. Reward 1 Vitus on Booking
create or replace function handle_booking_vitus()
returns trigger as $$
begin
    -- As requested: "em cada reserva de serviço que o usuário faz, apenas ganha 1 vitus"
    perform increment_vitus(new.user_id, 1, 'booking_reward');
    return new;
end;
$$ language plpgsql security definer;

create trigger on_booking_created
  after insert on bookings
  for each row execute procedure handle_booking_vitus();

-- B. Reward Professional on Order Completion
create or replace function handle_order_completion_vitus()
returns trigger as $$
declare
    v_seller_id uuid;
    v_vitus_from_client integer;
    v_cash_reward_amount integer;
begin
    -- Only trigger when status changes to 'concluído'
    -- This happens when user confirms receipt OR when auto-confirmed after 23h
    if (new.status = 'concluído' and old.status != 'concluído') then
        -- Get seller_id from products
        select seller_id into v_seller_id from products where id = new.product_id;
        
        -- Relationship: Professional receives the Vitus the client spent
        v_vitus_from_client := floor(new.vitus_used)::integer;
        
        -- Logic: 1 Vitus = 10 Euros cash paid
        v_cash_reward_amount := floor(new.cash_paid / 10)::integer;
        
        if (v_seller_id is not null) then
            -- 1. Reward: Vitus spent by the client goes to professional
            if (v_vitus_from_client > 0) then
                perform increment_vitus(v_seller_id, v_vitus_from_client, 'vitus_from_client');
            end if;
            
            -- 2. Reward: 1 Vitus for every 10€ cash paid
            if (v_cash_reward_amount > 0) then
                perform increment_vitus(v_seller_id, v_cash_reward_amount, 'cash_sale_reward');
            end if;
            
            -- 3. Completion Bonus (e.g. 1 Vitus)
            perform increment_vitus(v_seller_id, 1, 'sale_completion_bonus');
        end if;
    end if;
    return new;
end;
$$ language plpgsql security definer;

-- C. Automatic Order Handling
-- Set shipped_at when status changes to 'enviado'
create or replace function handle_order_status_timestamps()
returns trigger as $$
begin
    if (new.status = 'enviado' and old.status != 'enviado') then
        new.shipped_at = timezone('utc'::text, now());
    end if;
    return new;
end;
$$ language plpgsql security definer;

create trigger on_order_status_update
  before update on product_orders
  for each row execute procedure handle_order_status_timestamps();

-- Function to be called via cron job or manually to confirm orders after 23h
create or replace function confirm_overdue_orders()
returns void as $$
begin
    update product_orders
    set status = 'concluído'
    where status = 'enviado'
    and shipped_at < (timezone('utc'::text, now()) - interval '23 hours');
end;
$$ language plpgsql security definer;

create trigger on_order_completed
  after update on product_orders
  for each row execute procedure handle_order_completion_vitus();

-- Marketplace RLS Policies
alter table products enable row level security;
create policy "Products are viewable by everyone" on products for select using (true);
create policy "Sellers can manage their products" on products for all using (auth.uid() = seller_id);

alter table product_orders enable row level security;
create policy "Users can view their own orders" on product_orders for select using (auth.uid() = buyer_id OR exists (select 1 from products p where p.id = product_id and p.seller_id = auth.uid()));
create policy "Users can create orders" on product_orders for insert with check (auth.uid() = buyer_id);
create policy "Sellers can update order status" on product_orders for update using (exists (select 1 from products p where p.id = product_id and p.seller_id = auth.uid()));
create policy "Buyers can confirm or refute receipt" on product_orders for update using (auth.uid() = buyer_id AND status = 'enviado') with check (status in ('concluído', 'pendente'));

-- Reels Table & Policies
create table if not exists reels (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  video_url text not null,
  caption text,
  is_approved boolean default false,
  likes_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table reels enable row level security;

create policy "Anyone can view approved reels"
  on reels for select
  using (is_approved = true);

create policy "Professionals can view their own reels"
  on reels for select
  using (auth.uid() = user_id);

create policy "Professionals can create reels"
  on reels for insert
  with check (
    auth.uid() = user_id and 
    exists (
      select 1 from profiles 
      where id = auth.uid() and is_professional = true
    )
  );

create policy "Professionals can update their own reels"
  on reels for update
  using (auth.uid() = user_id);

create policy "Admins can manage all reels"
  on reels for all
  using (
    exists (
      select 1 from profiles 
      where id = auth.uid() and email = 'davidcumbo69@gmail.com'
    )
  );

-- Reels Interaction System (Likes & Views)
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS views_count bigint DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.reel_likes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    reel_id uuid REFERENCES public.reels(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(reel_id, user_id)
);

ALTER TABLE public.reel_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone" 
ON public.reel_likes FOR SELECT USING (true);

CREATE POLICY "Users can toggle their own likes" 
ON public.reel_likes FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to increment reel views
CREATE OR REPLACE FUNCTION increment_reel_view(reel_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.reels
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = reel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Post Like Sync Functions
CREATE OR REPLACE FUNCTION increment_post_likes(post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.posts
  SET likes_count = likes_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_post_likes(post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.posts
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to keep likes_count in sync for posts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_post_like_change
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- 15. Patients (Professional-Patient Relationship)
CREATE TABLE IF NOT EXISTS patients (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  professional_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, professional_id)
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own patient relationships" ON patients FOR SELECT USING (auth.uid() = user_id OR auth.uid() = professional_id);
CREATE POLICY "Users can request professional" ON patients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Professionals can update patient status" ON patients FOR UPDATE USING (auth.uid() = professional_id);
CREATE POLICY "Users can remove patient relationship" ON patients FOR DELETE USING (auth.uid() = user_id OR auth.uid() = professional_id);

-- 16. Clinical Histories
CREATE TABLE IF NOT EXISTS clinical_histories (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  professional_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  professional_name text,
  
  -- Step 1 fields
  full_name text,
  year text,
  gender text,
  id_number text,
  contact text,
  profession text,
  marital_status text,
  address text,
  
  -- Step 2 fields
  main_complaint text,
  symptoms_start_date date,
  duration text,
  pain_intensity integer,
  detailed_description text,
  
  -- Step 3 fields
  previous_diseases text,
  surgeries_history text,
  allergies text,
  vaccination_status text,
  smoking_habits text,
  alcohol_consumption text,
  habitual_medication text,
  
  -- Step 4 fields
  hereditary_diseases text,
  
  -- Step 5 fields
  weight numeric,
  height numeric,
  calculated_imc numeric,
  temperature numeric,
  blood_pressure text,
  heart_rate integer,
  respiratory_rate integer,
  spo2 integer,
  physical_exam_observations text,
  
  -- Step 6 fields
  primary_diagnosis text,
  secondary_diagnosis text,
  requested_exams text,
  clinical_notes text,
  next_appointment_date date,
  referral text,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE clinical_histories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can view own history" ON clinical_histories FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Professionals can manage history for their patients" ON clinical_histories FOR ALL USING (
  auth.uid() = professional_id OR 
  EXISTS (SELECT 1 FROM patients WHERE professional_id = auth.uid() AND user_id = clinical_histories.patient_id AND status = 'accepted')
);

-- 17. Direct Messages
CREATE TABLE IF NOT EXISTS direct_messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own messages" ON direct_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update is_read status" ON direct_messages FOR UPDATE USING (auth.uid() = receiver_id);

-- 18. Saved Items (Bookmarks)
CREATE TABLE IF NOT EXISTS saved_items (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  item_id uuid NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('post', 'product', 'service', 'reel', 'message', 'direct_message', 'group_message')),
  metadata jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, item_id, item_type)
);

ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own saved items" ON saved_items FOR ALL USING (auth.uid() = user_id);

-- 19. Vitus Transactions
CREATE TABLE IF NOT EXISTS vitus_transactions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  reason text NOT NULL,
  description text,
  reference_id uuid,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE vitus_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transactions" ON vitus_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System/Admins can manage transactions" ON vitus_transactions FOR ALL USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 20. Post Videos (Approval System)
CREATE TABLE IF NOT EXISTS post_videos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  youtube_url text,
  video_url text,
  thumbnail_url text,
  caption text,
  category text,
  is_approved boolean DEFAULT false,
  views_count bigint DEFAULT 0,
  likes_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE post_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved videos are viewable by everyone" ON post_videos FOR SELECT USING (is_approved = true OR auth.uid() = user_id);
CREATE POLICY "Users can create videos" ON post_videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all videos" ON post_videos FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Ad Sync and Management
CREATE TABLE IF NOT EXISTS public.ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    link_url TEXT,
    target_category TEXT DEFAULT 'Geral',
    ad_type TEXT DEFAULT 'image', -- 'image' or 'text'
    display_location TEXT DEFAULT 'all', -- 'all', 'groups', 'profiles'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for ads
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Ad Policies
CREATE POLICY "Public ads are viewable by everyone" 
ON public.ads FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all ads" 
ON public.ads FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
));

-- Storage Bucket for Ad Images
-- Note: You need to create a bucket named 'ad-images' manually in Supabase dashboard or via API
-- but we define policies here if the bucket is created
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'ad-images');
-- CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ad-images' AND (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)));

-- Custom function to get ads by location/category
CREATE OR REPLACE FUNCTION get_active_ads(p_location TEXT, p_category TEXT DEFAULT 'Geral')
RETURNS SETOF public.ads AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.ads
    WHERE is_active = true
    AND (display_location = 'all' OR display_location = p_location)
    AND (target_category = 'Geral' OR target_category = p_category)
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to keep likes_count in sync for reels
CREATE OR REPLACE FUNCTION update_reel_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.reels SET likes_count = likes_count + 1 WHERE id = NEW.reel_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.reels SET likes_count = likes_count - 1 WHERE id = OLD.reel_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_reel_like_change
AFTER INSERT OR DELETE ON public.reel_likes
FOR EACH ROW EXECUTE FUNCTION update_reel_likes_count();

-- Storage Policies for reels bucket
-- IMPORTANT: Run these in Supabase SQL Editor
insert into storage.buckets (id, name, public) 
values ('reels', 'reels', true)
on conflict (id) do nothing;

create policy "Reel videos are public"
on storage.objects for select
using ( bucket_id = 'reels' );

create policy "Professionals can upload reel videos"
on storage.objects for insert
with check (
  bucket_id = 'reels' AND 
  auth.role() = 'authenticated'
);

create policy "Professionals can delete their own reel videos"
on storage.objects for delete
using (
  bucket_id = 'reels' AND 
  (select auth.uid()::text) = (storage.foldername(name))[1]
);

-- Storage Policies for product-images bucket
-- Note: Bucket 'product-images' must be created in Supabase Dashboard
/*
create policy "Product images are public"
on storage.objects for select
using ( bucket_id = 'product-images' );

create policy "Professionals can upload product images"
on storage.objects for insert
with check (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated'
);
*/

-- 13. Storage Configuration (Manual steps in Dashboard usually required)
insert into storage.buckets (id, name, public) 
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Product images are public"
on storage.objects for select
using ( bucket_id = 'product-images' );

create policy "Professionals can upload product images_v2"
on storage.objects for insert
with check (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated'
);

create policy "Professionals can update product images"
on storage.objects for update
using (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated'
);

-- 14. Professional Followers Table (Relationships)
create table if not exists professional_followers (
  id uuid default gen_random_uuid() primary key,
  professional_id uuid references profiles(id) on delete cascade not null,
  follower_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(professional_id, follower_id)
);

alter table professional_followers enable row level security;
create policy "Followers viewable by everyone" on professional_followers for select using (true);
create policy "Users can follow/unfollow" on professional_followers for all using (auth.uid() = follower_id);

-- 15. Prescriptions Table
create table if not exists prescriptions (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references profiles(id) on delete cascade not null,
  professional_id uuid references profiles(id) on delete cascade not null,
  diagnosis text,
  start_date date default current_date,
  signature_code text not null unique, -- Format: the-MMXVI-cedav-ROMAN1-ROMAN2
  patient_name text,
  professional_name text,
  taken_doses jsonb default '{}'::jsonb, -- Store tracking of taken doses
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 15.1 Prescription items table
create table if not exists prescription_items (
  id uuid default uuid_generate_v4() primary key,
  prescription_id uuid references prescriptions(id) on delete cascade not null,
  medication text not null,
  form text,
  dosage text,
  frequency text,
  duration text,
  special_instructions text,
  color text,
  total_units float,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table prescription_items enable row level security;

create policy "Users can view items of prescriptions they have access to"
on prescription_items for select
using (
  exists (
    select 1 from prescriptions p
    where p.id = prescription_id
    and (p.patient_id = auth.uid() or p.professional_id = auth.uid())
  )
);

create policy "Professionals can insert items for their prescriptions"
on prescription_items for insert
with check (
  exists (
    select 1 from prescriptions p
    where p.id = prescription_id
    and p.professional_id = auth.uid()
  )
);

-- Storage bucket for prescription PDFs
insert into storage.buckets (id, name, public) 
values ('prescription-pdfs', 'prescription-pdfs', true)
on conflict (id) do nothing;

create policy "Prescription PDFs are public"
on storage.objects for select
using ( bucket_id = 'prescription-pdfs' );

create policy "Professionals can upload prescription PDFs"
on storage.objects for insert
with check (
  bucket_id = 'prescription-pdfs' AND 
  auth.role() = 'authenticated'
);

-- Helper for Roman Numerals
CREATE OR REPLACE FUNCTION public.to_roman(num integer) 
RETURNS text 
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    result text := '';
    remaining integer := num;
    vals integer[] := ARRAY[1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    syms text[] := ARRAY['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
BEGIN
    IF num IS NULL OR num <= 0 THEN 
      RETURN ''; 
    END IF;
    FOR i IN 1..13 LOOP
        WHILE remaining >= vals[i] LOOP
            result := result || syms[i];
            remaining := remaining - vals[i];
        END LOOP;
    END LOOP;
    RETURN result;
END;
$$;

-- RPC for public verification
create or replace function public.get_prescription_by_signature_code(signature_code_in text)
returns jsonb
language plpgsql
security definer -- runs with bypass RLS to allow public validation if code is known
as $$
declare
  result jsonb;
begin
  select 
    jsonb_build_object(
      'id', p.id,
      'signature_code', p.signature_code,
      'patient_id', p.patient_id,
      'professional_id', p.professional_id,
      'professional_name', coalesce(p.professional_name, prof_profile.full_name, 'Profissional Identificado'),
      'patient_name', coalesce(p.patient_name, pat_profile.full_name, 'Paciente Identificado'),
      'patient_username', pat_profile.username,
      'license_number', hp.license_number,
      'professional_specialty', hp.specialty,
      'diagnosis', p.diagnosis,
      'items', (
        select jsonb_agg(
          jsonb_build_object(
            'medication', pi.medication,
            'form', pi.form,
            'dosage', pi.dosage,
            'frequency', pi.frequency,
            'duration', pi.duration,
            'special_instructions', pi.special_instructions,
            'color', pi.color,
            'total_units', pi.total_units
          )
        ) from public.prescription_items pi where pi.prescription_id = p.id
      ),
      'taken_doses', p.taken_doses,
      'start_date', coalesce(p.start_date, p.created_at::date),
      'created_at', p.created_at
    ) into result
  from public.prescriptions p
  left join public.profiles prof_profile on p.professional_id = prof_profile.id
  left join public.profiles pat_profile on p.patient_id = pat_profile.id
  left join public.health_professionals hp on p.professional_id = hp.id
  where (p.signature_code = signature_code_in or p.id::text = signature_code_in)
  limit 1;

  return result;
end;
$$;

-- Alias for consistency with some frontend calls if needed
create or replace function public.search_prescription_by_code(search_signature text)
returns json as $$
begin
    return public.get_prescription_by_signature_code(search_signature)::json;
end;
$$ language plpgsql security definer;

alter table prescriptions enable row level security;

create policy "Patients can view their own prescriptions"
on prescriptions for select
using (auth.uid() = patient_id);

create policy "Professionals can view prescriptions they issued"
on prescriptions for select
using (auth.uid() = professional_id);

create policy "Everyone can view a prescription by ID (for verification)"
on prescriptions for select
using (true);

create policy "Patients can update tracking on their own prescriptions"
on prescriptions for update
using (auth.uid() = patient_id)
with check (auth.uid() = patient_id);

create policy "Professionals can create prescriptions"
on prescriptions for insert
with check (
  exists (
    select 1 from profiles 
    where id = auth.uid() and is_professional = true
  )
);

