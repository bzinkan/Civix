-- Add Question.key with backfill for existing rows (if column doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='Question' AND column_name='key') THEN
    ALTER TABLE "Question" ADD COLUMN "key" TEXT;
    UPDATE "Question" SET "key" = "id" WHERE "key" IS NULL;
    ALTER TABLE "Question" ALTER COLUMN "key" SET NOT NULL;
  END IF;
END $$;

-- Create unique index if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS "Question_flowId_key_key" ON "Question"("flowId", "key");
