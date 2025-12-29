'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, FileImage, X, Download, Sun, Moon, AlertTriangle, Settings2, Trash2, Sparkles, Zap, ArrowLeftRight, Check } from 'lucide-react';

export default function Home() {
    const [files, setFiles] = useState([]);
    const [targetFormat, setTargetFormat] = useState('image/webp');
    const [quality, setQuality] = useState(0.9);
    const [theme, setTheme] = useState('light');
    const [isProcessing, setIsProcessing] = useState(false);
    const [toast, setToast] = useState(null);
    const [upscaleModal, setUpscaleModal] = useState(null); // { fileId, isProcessing, previewData }
    const fileInputRef = useRef(null);

    useEffect(() => {
        // Check system preference or saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.setAttribute('data-theme', savedTheme);
            if (savedTheme === 'dark') document.documentElement.classList.add('dark');
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        document.documentElement.classList.toggle('dark');
    };

    const handleFiles = (newFiles) => {
        const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff', 'image/avif'];
        const addedFiles = Array.from(newFiles)
            .filter(file => validTypes.includes(file.type) || true)
            .map(file => ({
                id: Math.random().toString(36).substr(2, 9),
                file,
                preview: URL.createObjectURL(file),
                status: 'pending',
                resultUrl: null,
                downloadName: null
            }));

        if (addedFiles.length > 0) {
            setFiles(prev => [...prev, ...addedFiles]);
            showToast(`Se añadieron ${addedFiles.length} imágenes`, 'success');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.target.closest('.drop-zone').classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.target.closest('.drop-zone').classList.add('drag-over');
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.target.closest('.drop-zone').classList.remove('drag-over');
    };

    const removeFile = (id) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const clearAll = () => {
        setFiles([]);
    };

    const convertAll = async () => {
        const pendingFiles = files.filter(f => f.status !== 'done');
        if (pendingFiles.length === 0) return;

        setIsProcessing(true);

        const newFilesState = [...files];

        for (let i = 0; i < newFilesState.length; i++) {
            const fileObj = newFilesState[i];
            if (fileObj.status === 'done') continue;

            setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'converting' } : f));

            const formData = new FormData();
            formData.append('file', fileObj.file);
            formData.append('format', targetFormat);
            formData.append('quality', quality * 100);

            try {
                const res = await fetch('/api/convert', {
                    method: 'POST',
                    body: formData,
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.details || data.error || 'Falló la conversión');

                setFiles(prev => prev.map(f => f.id === fileObj.id ? {
                    ...f,
                    status: 'done',
                    resultUrl: data.url,
                    downloadName: data.filename
                } : f));

            } catch (err) {
                console.error(err);
                showToast(err.message, 'error');
                setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'error' } : f));
            }
        }

        setIsProcessing(false);
        // Sólo mostrar éxito si no hubo errores totales
        if (!files.some(f => f.status === 'error')) {
            showToast('Proceso completado', 'success');
        }
    };

    const openUpscalePreview = async (fileId, scale) => {
        const fileObj = files.find(f => f.id === fileId);
        if (!fileObj) return;

        setUpscaleModal({ fileId, scale, isProcessing: true, previewData: null });

        const formData = new FormData();
        formData.append('file', fileObj.file);
        formData.append('scale', scale);

        try {
            const res = await fetch('/api/upscale', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Falló el upscaling');
            const data = await res.json();
            if (!res.ok) throw new Error(data.details || data.error || 'Falló el upscaling');

            setUpscaleModal(prev => ({
                ...prev,
                isProcessing: false,
                previewData: {
                    originalUrl: fileObj.preview,
                    upscaledUrl: data.url,
                    originalSize: data.originalSize,
                    newSize: data.newSize,
                    scale: data.scale,
                    downloadName: data.filename // Assuming data.filename is still provided by the API
                }
            }));

        } catch (err) {
            console.error(err);
            showToast(err.message, 'error');
            setUpscaleModal(null);
        }
    };

    const confirmDownload = () => {
        if (!upscaleModal?.previewData) return;

        const link = document.createElement('a');
        link.href = upscaleModal.previewData.upscaledUrl;
        link.download = upscaleModal.previewData.downloadName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast(`✨ Imagen ${upscaleModal.scale}x descargada!`, 'success');
        setUpscaleModal(null);
    };

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <header>
                <div className="brand">
                    <Settings2 className="w-8 h-8" />
                    <span>copymac-convertio</span>
                </div>
                <button onClick={toggleTheme} className="theme-toggle" aria-label="Cambiar tema">
                    {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
                </button>
            </header>

            <main>
                <div className="warning-box">
                    <AlertTriangle size={20} className="text-red-500" />
                    <span>
                        <strong>Importante:</strong> Descarga tus imágenes convertidas pronto. Por seguridad y privacidad,
                        todos los archivos se eliminan permanentemente de nuestros servidores 24 horas después de su procesamiento.
                    </span>
                </div>

                <section
                    className="drop-zone"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                                handleFiles(e.target.files);
                            }
                        }}
                        style={{ display: 'none' }}
                    />
                    <Upload className="mx-auto text-primary mb-4 w-16 h-16 drop-zone-icon" />
                    <h2>Arrastra y suelta tus imágenes aquí</h2>
                    <p>Soporta WEBP, PNG, JPG, GIF, AVIF, TIFF y más</p>
                    <button
                        type="button"
                        className="btn-upload"
                        onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                        }}
                    >
                        Seleccionar Imágenes
                    </button>
                </section>

                <section className={`control-panel ${files.length > 0 ? 'active' : ''}`}>
                    <div className="control-group">
                        <label htmlFor="formatSelect">Convertir a</label>
                        <select
                            id="formatSelect"
                            value={targetFormat}
                            onChange={(e) => setTargetFormat(e.target.value)}
                        >
                            <option value="image/png">PNG (Transparencia)</option>
                            <option value="image/jpeg">JPEG (Compacto)</option>
                            <option value="image/webp">WEBP (Web Moderno)</option>
                            <option value="image/avif">AVIF (Ultra Eficiente)</option>
                            <option value="image/tiff">TIFF (Alta Calidad)</option>
                        </select>
                    </div>

                    {targetFormat !== 'image/png' && (
                        <div className="control-group">
                            <label htmlFor="qualityRange">
                                Calidad: <span className="range-value">{quality}</span>
                            </label>
                            <input
                                type="range"
                                id="qualityRange"
                                min="0.1"
                                max="1"
                                step="0.05"
                                value={quality}
                                onChange={(e) => setQuality(parseFloat(e.target.value))}
                            />
                        </div>
                    )}

                    <div className="actions">
                        <button
                            className="btn-convert"
                            onClick={convertAll}
                            disabled={isProcessing || files.length === 0}
                        >
                            {isProcessing ? 'Procesando...' : 'Convertir Todas'}
                        </button>
                        <button
                            className="btn-clear"
                            onClick={clearAll}
                            disabled={isProcessing}
                        >
                            Limpiar
                        </button>
                    </div>
                </section>

                <section className="image-grid">
                    {files.map(item => (
                        <div key={item.id} className="image-card">
                            <div className="card-preview relative">
                                <img src={item.preview} alt="preview" />
                                {item.status === 'done' && <span className="status-badge done">✓ Listo</span>}
                                {item.status === 'converting' && <span className="status-badge">⚙️ ...</span>}
                                {item.status === 'error' && <span className="status-badge error">Error</span>}
                            </div>
                            <div className="card-info">
                                <div className="file-name" title={item.file.name}>{item.file.name}</div>
                                <div className="file-meta">
                                    <span>{(item.file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    <span>{item.file.type.split('/')[1]?.toUpperCase() || 'UNK'}</span>
                                </div>
                            </div>
                            <div className="card-actions" style={{ flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <a
                                        href={item.resultUrl || '#'}
                                        download={item.downloadName}
                                        className={`btn-download ${!item.resultUrl ? 'pointer-events-none opacity-50' : ''}`}
                                    >
                                        <Download size={16} /> Descargar
                                    </a>
                                    <button className="btn-remove" onClick={() => removeFile(item.id)}>
                                        <X size={16} />
                                    </button>
                                </div>
                                <button
                                    className="btn-upscale"
                                    onClick={() => setUpscaleModal({ fileId: item.id, scale: null, isProcessing: false, previewData: null })}
                                    title="Ampliar con IA"
                                >
                                    <Sparkles size={16} /> Ampliar con IA
                                </button>
                            </div>
                        </div>
                    ))}
                </section>
            </main>

            {/* Upscale Modal */}
            {upscaleModal && (
                <div className="modal-overlay" onClick={() => !upscaleModal.isProcessing && setUpscaleModal(null)}>
                    <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
                        {!upscaleModal.previewData ? (
                            // Scale Selection Screen
                            <>
                                <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Sparkles size={24} />
                                    Opciones de Ampliación
                                </h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.05rem' }}>
                                    Selecciona el multiplicador de tamaño para tu imagen:
                                </p>
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                                    <button
                                        className="btn-scale"
                                        onClick={() => openUpscalePreview(upscaleModal.fileId, 2)}
                                        disabled={upscaleModal.isProcessing}
                                    >
                                        <Zap size={20} /> 2x
                                    </button>
                                    <button
                                        className="btn-scale"
                                        onClick={() => openUpscalePreview(upscaleModal.fileId, 4)}
                                        disabled={upscaleModal.isProcessing}
                                    >
                                        <Sparkles size={20} /> 4x
                                    </button>
                                </div>
                                {upscaleModal.isProcessing && (
                                    <p style={{ textAlign: 'center', color: 'var(--primary)', fontSize: '1.1rem', fontWeight: '600' }}>
                                        ⚙️ Procesando ampliación...
                                    </p>
                                )}
                                <button
                                    className="btn-clear"
                                    onClick={() => setUpscaleModal(null)}
                                    disabled={upscaleModal.isProcessing}
                                    style={{ width: '100%', marginTop: '1rem' }}
                                >
                                    Cancelar
                                </button>
                            </>
                        ) : (
                            // Preview Comparison Screen
                            <>
                                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <ArrowLeftRight size={24} />
                                    Comparación: Antes vs Después
                                </h3>
                                <BeforeAfterSlider
                                    beforeImage={upscaleModal.previewData.originalUrl}
                                    afterImage={upscaleModal.previewData.upscaledUrl}
                                    beforeSize={upscaleModal.previewData.originalSize}
                                    afterSize={upscaleModal.previewData.newSize}
                                />
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                    <button
                                        className="btn-confirm-download"
                                        onClick={confirmDownload}
                                    >
                                        <Check size={20} /> Descargar Imagen {upscaleModal.scale}x
                                    </button>
                                    <button
                                        className="btn-clear"
                                        onClick={() => setUpscaleModal(null)}
                                        style={{ flex: '0 0 auto' }}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {toast && (
                <div className="toast-container">
                    <div className={`toast ${toast.type}`}>
                        {toast.type === 'success' ? '✅' : '⚠️'} {toast.message}
                    </div>
                </div>
            )}
        </div>
    );
}

// Before/After Comparison Slider Component
function BeforeAfterSlider({ beforeImage, afterImage, beforeSize, afterSize }) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef(null);

    const handleMove = (clientX) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPosition(percentage);
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            handleMove(e.clientX);
        }
    };

    const handleTouchMove = (e) => {
        if (isDragging && e.touches[0]) {
            handleMove(e.touches[0].clientX);
        }
    };

    const handleStart = () => setIsDragging(true);
    const handleEnd = () => setIsDragging(false);

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleEnd);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging]);

    return (
        <div className="comparison-container" ref={containerRef}>
            {/* After Image (Full) */}
            <div className="comparison-image after-image">
                <img src={afterImage} alt="Después" draggable={false} />
                <div className="image-label after-label">
                    <span className="label-text">Después {afterSize.width} × {afterSize.height} px</span>
                </div>
            </div>

            {/* Before Image (Clipped) */}
            <div className="comparison-image before-image" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
                <img src={beforeImage} alt="Antes" draggable={false} />
                <div className="image-label before-label">
                    <span className="label-text">Antes {beforeSize.width} × {beforeSize.height} px</span>
                </div>
            </div>

            {/* Slider */}
            <div
                className="slider-line"
                style={{ left: `${sliderPosition}%` }}
                onMouseDown={handleStart}
                onTouchStart={handleStart}
            >
                <div className="slider-handle">
                    <ArrowLeftRight size={20} />
                </div>
            </div>
        </div>
    );
}
