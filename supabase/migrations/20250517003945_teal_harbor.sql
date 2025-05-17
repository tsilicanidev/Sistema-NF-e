/*
  # Add inscricaoEstadual to emissor table

  1. Changes
    - Add inscricaoEstadual column to emissor table
    - Make inscricaoEstadual NOT NULL to match the application requirements
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'emissor' AND column_name = 'inscricao_estadual'
  ) THEN
    ALTER TABLE emissor 
    ADD COLUMN inscricao_estadual text NOT NULL;
  END IF;
END $$;