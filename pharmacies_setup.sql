-- Create pharmacies table
CREATE TABLE IF NOT EXISTS pharmacies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    license_number TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    opening_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rating DECIMAL(3,2) DEFAULT 5.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read approved pharmacies
DROP POLICY IF EXISTS "Approved pharmacies are public" ON pharmacies;
CREATE POLICY "Approved pharmacies are public" ON pharmacies
    FOR SELECT USING (status = 'approved');

-- Allow owners to read their own pharmacies regardless of status
DROP POLICY IF EXISTS "Owners can see their own pharmacies" ON pharmacies;
CREATE POLICY "Owners can see their own pharmacies" ON pharmacies
    FOR SELECT USING (auth.uid() = owner_id);

-- Allow professionals to insert their own pharmacy
DROP POLICY IF EXISTS "Professionals can register pharmacy" ON pharmacies;
CREATE POLICY "Professionals can register pharmacy" ON pharmacies
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Allow owners to update their own pharmacy
DROP POLICY IF EXISTS "Owners can update their own pharmacy" ON pharmacies;
CREATE POLICY "Owners can update their own pharmacy" ON pharmacies
    FOR UPDATE USING (auth.uid() = owner_id);

-- Allow davidcumbo69@gmail.com to manage all
DROP POLICY IF EXISTS "Admins can manage all pharmacies" ON pharmacies;
CREATE POLICY "Admins can manage all pharmacies" ON pharmacies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.email = 'davidcumbo69@gmail.com'
        )
    );
