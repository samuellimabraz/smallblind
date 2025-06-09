-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "detectionThreshold" DOUBLE PRECISION DEFAULT 0.5,
    "detectionModel" TEXT DEFAULT 'Xenova/yolos-tiny',
    "detectionDtype" TEXT DEFAULT 'fp16',
    "language" TEXT DEFAULT 'en',
    "theme" TEXT DEFAULT 'system',
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "deviceInfo" JSONB,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisionAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imageHash" TEXT,
    "imageFormat" TEXT,
    "fileName" TEXT,
    "imagePath" TEXT,
    "analysisType" TEXT NOT NULL,

    CONSTRAINT "VisionAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObjectDetection" (
    "id" TEXT NOT NULL,
    "visionAnalysisId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "modelSettings" JSONB,
    "processingTimeMs" INTEGER,

    CONSTRAINT "ObjectDetection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetectedObject" (
    "id" TEXT NOT NULL,
    "objectDetectionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "boundingBox" JSONB NOT NULL,
    "attributes" JSONB,

    CONSTRAINT "DetectedObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageDescription" (
    "id" TEXT NOT NULL,
    "visionAnalysisId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "maxNewTokens" INTEGER,
    "temperature" DOUBLE PRECISION,
    "description" TEXT NOT NULL,
    "processingTimeMs" INTEGER,

    CONSTRAINT "ImageDescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "sessionId" TEXT,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT,
    "scopes" TEXT[],
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AppSettings_userId_key" ON "AppSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ObjectDetection_visionAnalysisId_key" ON "ObjectDetection"("visionAnalysisId");

-- CreateIndex
CREATE UNIQUE INDEX "ImageDescription_visionAnalysisId_key" ON "ImageDescription"("visionAnalysisId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- AddForeignKey
ALTER TABLE "AppSettings" ADD CONSTRAINT "AppSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisionAnalysis" ADD CONSTRAINT "VisionAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisionAnalysis" ADD CONSTRAINT "VisionAnalysis_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectDetection" ADD CONSTRAINT "ObjectDetection_visionAnalysisId_fkey" FOREIGN KEY ("visionAnalysisId") REFERENCES "VisionAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectDetection" ADD CONSTRAINT "ObjectDetection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetectedObject" ADD CONSTRAINT "DetectedObject_objectDetectionId_fkey" FOREIGN KEY ("objectDetectionId") REFERENCES "ObjectDetection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageDescription" ADD CONSTRAINT "ImageDescription_visionAnalysisId_fkey" FOREIGN KEY ("visionAnalysisId") REFERENCES "VisionAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageDescription" ADD CONSTRAINT "ImageDescription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
