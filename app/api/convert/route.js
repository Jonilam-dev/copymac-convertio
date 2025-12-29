import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');

        // Check for Blob token
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            return NextResponse.json({
                error: 'Configuración incompleta.',
                details: 'Falta configurar Vercel Blob Storage en el panel de Vercel (Pestaña Storage).'
            }, { status: 500 });
        }

        const formatMime = formData.get('format') || 'image/webp';
        const quality = parseInt(formData.get('quality') || '90');

        if (!file) {
            return NextResponse.json({ error: 'No files received.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const uniqueId = uuidv4();

        // Determine extension
        let ext = 'webp';
        let sharpFormat = 'webp';
        if (formatMime === 'image/jpeg') { ext = 'jpg'; sharpFormat = 'jpeg'; }
        if (formatMime === 'image/png') { ext = 'png'; sharpFormat = 'png'; }
        if (formatMime === 'image/avif') { ext = 'avif'; sharpFormat = 'avif'; }
        if (formatMime === 'image/tiff') { ext = 'tiff'; sharpFormat = 'tiff'; }

        const filename = `${uniqueId}.${ext}`;

        // Initial sharp instance
        let imagePipeline = sharp(buffer);

        // Apply format and quality
        if (sharpFormat === 'jpeg') {
            imagePipeline = imagePipeline.flatten({ background: { r: 255, g: 255, b: 255 } }).jpeg({ quality });
        } else if (sharpFormat === 'png') {
            imagePipeline = imagePipeline.png({ quality: quality > 90 ? 100 : quality });
        } else if (sharpFormat === 'webp') {
            imagePipeline = imagePipeline.webp({ quality });
        } else if (sharpFormat === 'avif') {
            imagePipeline = imagePipeline.avif({ quality });
        } else if (sharpFormat === 'tiff') {
            imagePipeline = imagePipeline.tiff({ quality });
        }

        const outputBuffer = await imagePipeline.toBuffer();

        // Upload to Vercel Blob Storage
        const blob = await put(filename, outputBuffer, {
            access: 'public',
            addRandomSuffix: false,
        });

        return NextResponse.json({
            url: blob.url,
            filename: `converted_${file.name.substring(0, file.name.lastIndexOf('.'))}.${ext}`,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

    } catch (error) {
        console.error('Conversion failed:', error);
        return NextResponse.json({
            error: 'Conversion failed.',
            details: error.message
        }, { status: 500 });
    }
}
