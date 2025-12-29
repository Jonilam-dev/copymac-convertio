import { NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';
import { writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads');

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
            .toBuffer();

        // Save the upscaled image
        const filename = `upscaled_${scale}x_${uniqueId}.png`;
        const outputPath = path.join(UPLOAD_DIR, filename);

        await writeFile(outputPath, upscaledBuffer);

        return NextResponse.json({
            url: `/uploads/${filename}`,
            filename: `upscaled_${scale}x_${file.name}`,
            originalSize: { width: metadata.width, height: metadata.height },
            newSize: { width: newWidth, height: newHeight },
            scale: scale,
            message: 'Para mejor calidad, considera integrar servicios de IA como Replicate (Real-ESRGAN)',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

    } catch (error) {
        console.error('Upscaling failed:', error);
        return NextResponse.json({ error: 'Upscaling failed.' }, { status: 500 });
    }
}

/**
 * Integration guide for AI upscaling services:
 * 
 * 1. Replicate (Real-ESRGAN):
 *    npm install replicate
 *    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
 *    const output = await replicate.run("nightmareai/real-esrgan:...", { input: { image: base64 } });
 * 
 * 2. Stability AI:
 *    Similar approach with their API
 * 
 * 3. Custom model:
 *    Deploy your own Real-ESRGAN or GFPGAN model on a GPU server
 */
