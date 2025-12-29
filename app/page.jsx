'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, FileImage, X, Download, Sun, Moon, AlertTriangle, Settings2, Trash2, Sparkles, Zap } from 'lucide-react';

export default function Home() {
    const [files, setFiles] = useState([]);
    const [targetFormat, setTargetFormat] = useState('image/webp');
    const [quality, setQuality] = useState(0.9);
    const [theme, setTheme] = useState('light');
    const [isProcessing, setIsProcessing] = useState(false);
    const [toast, setToast] = useState(null);
    const [upscaleModal, setUpscaleModal] = useState(null); // { fileId, isProcessing }

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
            .filter(file => validTypes.includes(file.type) || true) // Allow all for now, server handles restrictions
            .map(file => ({
                id: Math.random().toString(36).substr(2, 9),
                file,
                preview: URL.createObjectURL(file), // Local preview
                status: 'pending', // pending, converting, done, error
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

        // Process files one by one or in parallel batches
        // We'll update state as we go
        const newFilesState = [...files];

        for (let i = 0; i < newFilesState.length; i++) {
            const fileObj = newFilesState[i];
            if (fileObj.status === 'done') continue;

            // Update to processing
            setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'converting' } : f));

            const formData = new FormData();
            formData.append('file', fileObj.file);
            formData.append('format', targetFormat);
            formData.append('quality', quality * 100); // 0-100 for sharp

            try {
                const res = await fetch('/api/convert', {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) throw new Error('Falló la conversión');

                const data = await res.json();

                setFiles(prev => prev.map(f => f.id === fileObj.id ? {
                    ...f,
                    status: 'done',
                    resultUrl: data.url,
                    downloadName: data.filename
                } : f));

            } catch (err) {
                console.error(err);
                setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'error' } : f));
            }
        }

        setIsProcessing(false);
        showToast('Proceso completado', 'success');
    };

    const upscaleImage = async (fileId, scale) => {
        const fileObj = files.find(f => f.id === fileId);
        if (!fileObj) return;

        setUpscaleModal({ fileId, isProcessing: true });

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

            // Create a link and auto-download
            const link = document.createElement('a');
            link.href = data.url;
            link.download = data.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast(`✨ Ampliación ${scale}x completada! (${data.newSize.width}x${data.newSize.height})`, 'success');
            setUpscaleModal(null);

        } catch (err) {
            console.error(err);
            showToast('Error en la ampliación', 'error');
            setUpscaleModal(null);
        }
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
                        id="fileInput"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleFiles(e.target.files)}
                    />
                    <Upload className="mx-auto text-primary mb-4 w-16 h-16 drop-zone-icon" />
                    <h2>Arrastra y suelta tus imágenes aquí</h2>
                    <p>Soporta WEBP, PNG, JPG, GIF, AVIF, TIFF y más</p>
                    <button className="btn-upload" onClick={() => document.getElementById('fileInput').click()}>
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
                            <div className="card-actions" style={{ flexDirection: 'column', gap: '0.5rem' }}>
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
                                    onClick={() => setUpscaleModal({ fileId: item.id, isProcessing: false })}
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
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
                            <Sparkles size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                            Ampliar con IA
                        </h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            Selecciona el factor de ampliación:
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <button
                                className="btn-scale"
                                onClick={() => upscaleImage(upscaleModal.fileId, 2)}
                                disabled={upscaleModal.isProcessing}
                            >
                                <Zap size={18} /> 2x
                            </button>
                            <button
                                className="btn-scale"
                                onClick={() => upscaleImage(upscaleModal.fileId, 4)}
                                disabled={upscaleModal.isProcessing}
                            >
                                <Sparkles size={18} /> 4x
                            </button>
                        </div>
                        {upscaleModal.isProcessing && (
                            <p style={{ textAlign: 'center', color: 'var(--primary)' }}>
                                ⚙️ Procesando...
                            </p>
                        )}
                        <button
                            className="btn-clear"
                            onClick={() => setUpscaleModal(null)}
                            disabled={upscaleModal.isProcessing}
                            style={{ width: '100%' }}
                        >
                            Cancelar
                        </button>
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
