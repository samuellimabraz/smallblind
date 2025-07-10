import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DetectedObject } from '@/types';

interface ImageWithBoundingBoxesProps {
    imageDataUrl?: string;
    objects: DetectedObject[];
    className?: string;
}

export const ImageWithBoundingBoxes: React.FC<ImageWithBoundingBoxesProps> = ({
    imageDataUrl,
    objects,
    className = "",
}) => {
    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const drawBoxes = useCallback(() => {
        const image = imageRef.current;
        const canvas = canvasRef.current;
        if (!image || !canvas) {
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Match canvas dimensions to the displayed image dimensions
        canvas.width = image.width;
        canvas.height = image.height;

        // Calculate scaling factors
        const scaleX = image.width / image.naturalWidth;
        const scaleY = image.height / image.naturalHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        objects.forEach((obj, index) => {
            const { x, y, width, height } = obj.boundingBox;
            if (x === undefined || y === undefined || width === undefined || height === undefined) return;
            if (width <= 0 || height <= 0) return;

            const scaledX = x * scaleX;
            const scaledY = y * scaleY;
            const scaledWidth = width * scaleX;
            const scaledHeight = height * scaleY;

            const hue = (index * 137.5) % 360;
            const color = `hsl(${hue}, 70%, 50%)`;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

            const label = `${obj.label} (${Math.round(obj.confidence * 100)}%)`;
            ctx.font = '14px Arial';
            const textMetrics = ctx.measureText(label);
            const textWidth = textMetrics.width;
            const textHeight = 20;

            let labelY = scaledY - 6;
            if (labelY < textHeight) {
                labelY = scaledY + scaledHeight + textHeight - 6;
            }

            ctx.fillStyle = color;
            ctx.fillRect(scaledX, labelY - textHeight + 6, textWidth + 8, textHeight);
            ctx.fillStyle = 'white';
            ctx.fillText(label, scaledX + 4, labelY);
        });
    }, [objects]);

    useEffect(() => {
        setIsLoading(true);
        setError(null);

        if (!imageDataUrl) {
            setError("No image data provided");
            setIsLoading(false);
            return;
        }

        const image = imageRef.current;
        if (!image) return;

        const handleLoad = () => {
            setIsLoading(false);
        };

        const handleError = () => {
            setError("Failed to load image");
            setIsLoading(false);
        };

        image.addEventListener('load', handleLoad);
        image.addEventListener('error', handleError);
        image.src = imageDataUrl;

        return () => {
            image.removeEventListener('load', handleLoad);
            image.removeEventListener('error', handleError);
        };
    }, [imageDataUrl]);

    useEffect(() => {
        if (isLoading) return;

        const image = imageRef.current;
        if (!image) return;

        drawBoxes();

        const resizeObserver = new ResizeObserver(() => drawBoxes());
        resizeObserver.observe(image);

        return () => {
            resizeObserver.disconnect();
        };
    }, [isLoading, objects, drawBoxes]);

    if (error) {
        return (
            <div className={`flex items-center justify-center bg-red-50 rounded-lg p-4 ${className}`}>
                <div className="text-center">
                    <p className="text-red-500 font-medium">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-gray-600 text-sm">Loading image...</p>
                    </div>
                </div>
            )}
            <img
                ref={imageRef}
                alt="Analysis result"
                className={`max-w-full h-auto rounded-lg shadow-lg ${isLoading ? 'invisible' : ''}`}
            />
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 pointer-events-none"
            />
            {!isLoading && objects.length > 0 && (
                <div className="mt-2 text-xs text-gray-500 text-center">
                    {objects.length} object{objects.length !== 1 ? 's' : ''} detected
                </div>
            )}
        </div>
    );
}; 