-- Add Question.key with backfill for existing rows
ALTER TABLE "Question" ADD COLUMN "key" TEXT;

UPDATE "Question" SET "key" = "id" WHERE "key" IS NULL;

ALTER TABLE "Question" ALTER COLUMN "key" SET NOT NULL;

CREATE UNIQUE INDEX "Question_flowId_key_key" ON "Question"("flowId", "key");
