/*
  # Add created_at column to notas_fiscais table
  
  1. Changes
    - Add created_at column to notas_fiscais table
    - Set default value to now()
    - Update existing rows to have created_at value
  
  2. Notes
    - This migration adds the missing created_at column that is being referenced in the Dashboard component
*/

-- Add created_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notas_fiscais' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.notas_fiscais ADD COLUMN created_at timestamptz DEFAULT now();
    
    -- Update existing rows to have created_at value
    UPDATE public.notas_fiscais SET created_at = emitida_em WHERE created_at IS NULL AND emitida_em IS NOT NULL;
    UPDATE public.notas_fiscais SET created_at = now() WHERE created_at IS NULL;
  END IF;
END $$;

-- Create index on created_at column
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_created_at ON public.notas_fiscais(created_at);