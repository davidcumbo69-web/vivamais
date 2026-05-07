-- SQL to update prescription signature codes to a more secure format
-- This involves adding the 'the-MMXVI-cedav' prefix and converting numbers to Roman numerals.

-- 1. Create the to_roman function helper
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

-- 2. Update existing prescriptions to follow the new format
-- Note: This will change existing codes, which might break old physical printouts if they don't use IDs.
-- However, since the lookup supports ID lookup too, it remains accessible.
UPDATE public.prescriptions 
SET signature_code = 'the-MMXVI-cedav-' || to_roman((random() * 3000 + 1)::integer) || '-' || to_roman((random() * 3000 + 1)::integer)
WHERE signature_code NOT LIKE 'the-MMXVI-cedav%';

-- 3. (Optional) Update the get_prescription_by_signature_code to handle the prefix better if needed,
-- but the current implementation already searches for exact matches.
