-- CreateTable
CREATE TABLE "ContentEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "linkedinPost" TEXT,
    "imagePath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentEntry_date_key" ON "ContentEntry"("date");

-- CreateIndex
CREATE INDEX "ContentEntry_category_idx" ON "ContentEntry"("category");

-- CreateIndex
CREATE INDEX "ContentEntry_topic_idx" ON "ContentEntry"("topic");
