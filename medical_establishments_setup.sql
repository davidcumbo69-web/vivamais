-- Criar tabela de Estabelecimentos Médicos
CREATE TABLE IF NOT EXISTS medical_establishments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Clínica', 'Posto Médico', 'Hospital')),
    license_number TEXT NOT NULL,
    province TEXT NOT NULL,
    municipality TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    services TEXT[] DEFAULT '{}',
    opening_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rating DECIMAL(3,2) DEFAULT 5.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Segurança em nível de linha)
ALTER TABLE medical_establishments ENABLE ROW LEVEL SECURITY;

-- 1. Estabelecimentos aprovados são públicos
DROP POLICY IF EXISTS "Public can see approved establishments" ON medical_establishments;
CREATE POLICY "Public can see approved establishments" ON medical_establishments
    FOR SELECT USING (status = 'approved');

-- 2. Donos podem ver seus próprios estabelecimentos (mesmo pendentes)
DROP POLICY IF EXISTS "Owners can see their own establishments" ON medical_establishments;
CREATE POLICY "Owners can see their own establishments" ON medical_establishments
    FOR SELECT USING (auth.uid() = owner_id);

-- 3. Profissionais podem registar novos estabelecimentos
DROP POLICY IF EXISTS "Professionals can register establishments" ON medical_establishments;
CREATE POLICY "Professionals can register establishments" ON medical_establishments
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- 4. Donos podem editar seus estabelecimentos
DROP POLICY IF EXISTS "Owners can update their own establishments" ON medical_establishments;
CREATE POLICY "Owners can update their own establishments" ON medical_establishments
    FOR UPDATE USING (auth.uid() = owner_id);

-- 5. Administrador MASTER tem controlo total
DROP POLICY IF EXISTS "Admins can manage all establishments" ON medical_establishments;
CREATE POLICY "Admins can manage all establishments" ON medical_establishments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.email = 'davidcumbo69@gmail.com'
        )
    );
