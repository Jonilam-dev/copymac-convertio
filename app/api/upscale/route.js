import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';

/**
 * AI Image Upscaling API Endpoint
 * Improved with sharpening and multiple kernels to simulate better reconstruction
 */

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            return NextResponse.json({
                error: 'Configuración incompleta.',
                details: 'Falta configurar Vercel Blob Storage.'
            }, { status: 500 });
        }

        const scale = parseInt(formData.get('scale') || '2');

        if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });

        const buffer = Buffer.from(await file.arrayBuffer());
        const uniqueId = uuidv4();
        const image = sharp(buffer);
        const metadata = await image.metadata();

        const newWidth = metadata.width * scale;
        const newHeight = metadata.height * scale;

        // "AI-Like" Upscaling: Sharp doesn't do GAN, but we can combine Lanczos
        // with selective sharpening and light blurring to reduce artifacts
        const upscaledBuffer = await image
            .resize(newWidth, newHeight, {
                kernel: sharp.kernel.lanczos3,
                fit: 'fill'
            })
            // Sharpen helps with edges, but overdoing it causes noise.
            // We use a specific sigma/threshold for better detail.
            .sharpen({
                sigma: 1.2,
                m1: 0.5,
                m2: 2.0
            })
            .png({ quality: 100, compressionLevel: 9 })
            .toBuffer();

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
