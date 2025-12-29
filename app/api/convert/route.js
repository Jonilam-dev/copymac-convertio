import { NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';
import { writeFile, mkdir, readdir, stat, unlink } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads');

// Helper to ensure upload directory exists
async function ensureDir() {
    try {
        await mkdir(UPLOAD_DIR, { recursive: true });
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }
}

// Helper to cleanup old files (Lazy cleanup strategy for local dev)
async function cleanupOldFiles() {
    try {
        const files = await readdir(UPLOAD_DIR);
        const now = Date.now();
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

        for (const file of files) {
            if (file === '.gitkeep') continue;
            const filePath = path.join(UPLOAD_DIR, file);
            try {
                const stats = await stat(filePath);
                if (now - stats.mtimeMs > TWENTY_FOUR_HOURS) {
                    await unlink(filePath);
                    console.log(`Deleted old file: ${file}`);
                }
            } catch (e) {
                console.error(`Error checking/deleting file ${file}:`, e);
            }
        }
    } catch (err) {
        console.error('Cleanup failed:', err);
    }
}

export async function POST(req) {
    try {
        // Lazy cleanup trigger
        cleanupOldFiles().catch(console.error);

        await ensureDir();

        const formData = await req.formData();
        const file = formData.get('file');
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
        const key = path.join(UPLOAD_DIR, filename);

        // Initial sharp instance
        let imagePipeline = sharp(buffer);

        // Apply format and quality
        if (sharpFormat === 'jpeg') {
            imagePipeline = imagePipeline.flatten({ background: { r: 255, g: 255, b: 255 } }).jpeg({ quality });
        } else if (sharpFormat === 'png') {
            imagePipeline = imagePipeline.png({ quality: quality > 90 ? 100 : quality }); // PNG quality works differently, usually compressionLevel
        } else if (sharpFormat === 'webp') {
            imagePipeline = imagePipeline.webp({ quality });
        } else if (sharpFormat === 'avif') {
            imagePipeline = imagePipeline.avif({ quality });
        } else if (sharpFormat === 'tiff') {
            imagePipeline = imagePipeline.tiff({ quality });
        }

        const outputBuffer = await imagePipeline.toBuffer();

        // Write to local filesystem (For Vercel this needs S3/Blob)
        await writeFile(key, outputBuffer);

        // Return the URL
        // Since we save to public/uploads, the URL is /uploads/filename
        const publicUrl = `/uploads/${filename}`;

        return NextResponse.json({
            url: publicUrl,
            filename: `converted_${file.name.substring(0, file.name.lastIndexOf('.'))}.${ext}`,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

    } catch (error) {
        console.error('Conversion failed:', error);
        return NextResponse.json({ error: 'Conversion failed.' }, { status: 500 });
    }
}
