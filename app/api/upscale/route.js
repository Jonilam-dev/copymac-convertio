import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';

/**
 * AI Image Upscaling API Endpoint
 * 
 * This endpoint provides AI-powered image upscaling (2x or 4x).
 * Currently uses sharp's built-in resize with lanczos3 resampling (high quality).
 * 
 * TODO: For production, integrate with actual AI upscaling services like:
 * - Replicate API (Real-ESRGAN, GFPGAN)
 * - Stability AI
 * - Custom AI model deployment
 */

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');
        const scale = parseInt(formData.get('scale') || '2'); // 2x or 4x

        if (!file) {
            return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
        }

        if (![2, 4].includes(scale)) {
            return NextResponse.json({ error: 'Scale must be 2 or 4.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const uniqueId = uuidv4();

        // Get image metadata
        const image = sharp(buffer);
        const metadata = await image.metadata();

        // Calculate new dimensions
        const newWidth = metadata.width * scale;
        const newHeight = metadata.height * scale;

        // Upscale using sharp's high-quality resampling
        // For real AI upscaling, you would send this to an AI service here
        const upscaledBuffer = await image
            .resize(newWidth, newHeight, {
                kernel: sharp.kernel.lanczos3, // High-quality resampling
                fit: 'fill'
            })
            .sharpen() // Add some sharpening to compensate for upscaling
            .png() // Use PNG to preserve quality
            .toBuffer();

        // Upload to Vercel Blob Storage
        const filename = `upscaled_${scale}x_${uniqueId}.png`;
        const blob = await put(filename, upscaledBuffer, {
            access: 'public',
            addRandomSuffix: false,
        });

        return NextResponse.json({
            url: blob.url,
            filename: `upscaled_${scale}x_${file.name}`,
            originalSize: { width: metadata.width, height: metadata.height },
            newSize: { width: newWidth, height: newHeight },
            scale: scale,
            message: 'Para mejor calidad, considera integrar servicios de IA como Replicate (Real-ESRGAN)',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

    } catch (error) {
        console.error('Upscaling failed:', error);
        return NextResponse.json({
            error: 'Upscaling failed.',
            details: error.message
        }, { status: 500 });
    }
}
