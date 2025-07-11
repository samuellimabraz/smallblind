-- CreateTable
CREATE TABLE "FaceRecognition" (
    "id" TEXT NOT NULL,
    "visionAnalysisId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "processingTimeMs" INTEGER,

    CONSTRAINT "FaceRecognition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecognizedFace" (
    "id" TEXT NOT NULL,
    "faceRecognitionId" TEXT NOT NULL,
    "personId" TEXT,
    "personName" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "boundingBox" JSONB,
    "attributes" JSONB,

    CONSTRAINT "RecognizedFace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FaceRecognition_visionAnalysisId_key" ON "FaceRecognition"("visionAnalysisId");

-- AddForeignKey
ALTER TABLE "FaceRecognition" ADD CONSTRAINT "FaceRecognition_visionAnalysisId_fkey" FOREIGN KEY ("visionAnalysisId") REFERENCES "VisionAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaceRecognition" ADD CONSTRAINT "FaceRecognition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecognizedFace" ADD CONSTRAINT "RecognizedFace_faceRecognitionId_fkey" FOREIGN KEY ("faceRecognitionId") REFERENCES "FaceRecognition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
