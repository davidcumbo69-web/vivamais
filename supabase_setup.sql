-- SQL to create professional reviews system
CREATE TABLE IF NOT EXISTS professional_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(professional_id, reviewer_id)
);

-- RLS Policies
ALTER TABLE professional_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can see reviews
CREATE POLICY "Anyone can view reviews" 
ON professional_reviews FOR SELECT 
USING (true);

-- Only patients who received a prescription can review
-- We Check if there is at least one prescription from this professional to this patient
CREATE POLICY "Patients with prescriptions can review" 
ON professional_reviews FOR INSERT 
WITH CHECK (
  auth.uid() = reviewer_id AND
  EXISTS (
    SELECT 1 FROM prescriptions 
    WHERE patient_id = auth.uid() 
    AND professional_id = professional_id
  )
);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews" 
ON professional_reviews FOR UPDATE 
USING (auth.uid() = reviewer_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews" 
ON professional_reviews FOR DELETE 
USING (auth.uid() = reviewer_id);
