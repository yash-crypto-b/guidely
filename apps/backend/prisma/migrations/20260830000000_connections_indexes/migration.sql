-- CreateIndex for Search Performance
CREATE INDEX "CreatorTag_tagId_idx" ON "CreatorTag"("tagId");

CREATE INDEX "BlackoutDate_date_idx" ON "BlackoutDate"("date");

CREATE INDEX "Booking_creatorId_startTime_idx" ON "Booking"("creatorId", "startTime");
CREATE INDEX "Booking_studentId_startTime_idx" ON "Booking"("studentId", "startTime");
CREATE INDEX "Booking_status_startTime_idx" ON "Booking"("status", "startTime");
CREATE INDEX "Booking_attributionSource_idx" ON "Booking"("attributionSource");

CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");
CREATE INDEX "User_displayName_idx" ON "User"("displayName");
CREATE INDEX "User_industry_idx" ON "User"("industry");
CREATE INDEX "User_yearsExperience_idx" ON "User"("yearsExperience");

CREATE INDEX "SessionTypeDefinition_creatorId_isActive_idx" ON "SessionTypeDefinition"("creatorId", "isActive");
CREATE INDEX "SessionTypeDefinition_deliveryType_idx" ON "SessionTypeDefinition"("deliveryType");

CREATE INDEX "Review_creatorId_idx" ON "Review"("creatorId");
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

-- Create SearchIndex table for full-text search
CREATE TABLE "SearchIndex" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchIndex_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SearchIndex_entityType_entityId_idx" ON "SearchIndex"("entityType", "entityId");
CREATE INDEX "SearchIndex_content_idx" ON "SearchIndex"("content");

-- Create AnalyticsEvent table for funnel tracking
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "data" JSONB,
    "source" TEXT,
    "page" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AnalyticsEvent_eventType_createdAt_idx" ON "AnalyticsEvent"("eventType", "createdAt");
CREATE INDEX "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");
CREATE INDEX "AnalyticsEvent_source_idx" ON "AnalyticsEvent"("source");
