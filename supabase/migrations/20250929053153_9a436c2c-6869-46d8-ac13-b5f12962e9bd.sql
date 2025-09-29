-- Add barcode column to medicines table
ALTER TABLE public.medicines ADD COLUMN barcode TEXT;

-- Create index for barcode lookups
CREATE INDEX idx_medicines_barcode ON public.medicines(barcode) WHERE barcode IS NOT NULL;