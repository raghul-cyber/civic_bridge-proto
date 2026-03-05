import React, { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';
const MAX_FILES = 5;
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * PhotoUpload — drag-and-drop photo upload component for CivicBridge.
 *
 * Features:
 *   - Drag & drop zone
 *   - Click-to-browse fallback
 *   - Thumbnail previews with remove button
 *   - Per-file progress bar
 *   - Max 5 photos, max 10 MB each
 *   - Returns array of S3 URLs to parent
 *
 * @param {object}   props
 * @param {string}   props.issueId    – Issue ID to associate photos with.
 * @param {Function} props.onUploadComplete – Callback with array of S3 URLs.
 */
export default function PhotoUpload({ issueId = 'unassigned', onUploadComplete }) {
    const [files, setFiles] = useState([]);           // { id, file, preview, progress, url, error }
    const [isDragging, setIsDragging] = useState(false);
    const [globalError, setGlobalError] = useState(null);

    // ── Validate & add files ──
    const addFiles = useCallback((incoming) => {
        setGlobalError(null);
        const currentCount = files.length;
        const newFiles = [];

        for (const file of incoming) {
            if (currentCount + newFiles.length >= MAX_FILES) {
                setGlobalError(`Maximum ${MAX_FILES} photos allowed.`);
                break;
            }
            if (file.size > MAX_SIZE_BYTES) {
                setGlobalError(`"${file.name}" exceeds 10 MB limit.`);
                continue;
            }
            if (!ACCEPTED_TYPES.includes(file.type)) {
                setGlobalError(`"${file.name}" is not a supported image type.`);
                continue;
            }
            newFiles.push({
                id: crypto.randomUUID(),
                file,
                preview: URL.createObjectURL(file),
                progress: 0,
                url: null,
                error: null,
            });
        }

        if (newFiles.length > 0) {
            setFiles((prev) => [...prev, ...newFiles]);
            // Start uploading each new file
            newFiles.forEach((f) => uploadFile(f));
        }
    }, [files]);

    // ── Upload a single file ──
    const uploadFile = async (fileEntry) => {
        const formData = new FormData();
        formData.append('file', fileEntry.file);
        formData.append('issue_id', issueId);

        try {
            const response = await axios.post(`${API_BASE}/media/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => {
                    const pct = Math.round((e.loaded * 100) / (e.total || 1));
                    setFiles((prev) =>
                        prev.map((f) => (f.id === fileEntry.id ? { ...f, progress: pct } : f))
                    );
                },
            });

            setFiles((prev) =>
                prev.map((f) =>
                    f.id === fileEntry.id ? { ...f, progress: 100, url: response.data.url } : f
                )
            );
        } catch (err) {
            setFiles((prev) =>
                prev.map((f) =>
                    f.id === fileEntry.id ? { ...f, error: err.message } : f
                )
            );
        }
    };

    // ── Remove a file ──
    const removeFile = (id) => {
        setFiles((prev) => {
            const target = prev.find((f) => f.id === id);
            if (target?.preview) URL.revokeObjectURL(target.preview);
            return prev.filter((f) => f.id !== id);
        });
    };

    // ── Notify parent when all uploads are done ──
    React.useEffect(() => {
        const allDone = files.length > 0 && files.every((f) => f.url || f.error);
        if (allDone && onUploadComplete) {
            const urls = files.filter((f) => f.url).map((f) => f.url);
            onUploadComplete(urls);
        }
    }, [files, onUploadComplete]);

    // ── Drag events ──
    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        addFiles(Array.from(e.dataTransfer.files));
    };
    const handleBrowse = (e) => addFiles(Array.from(e.target.files));

    return (
        <div className="w-full max-w-2xl">
            {/* ── Global error ── */}
            {globalError && (
                <div className="mb-3 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-sm text-red-700">{globalError}</p>
                </div>
            )}

            {/* ── Drop zone ── */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    relative border-2 border-dashed rounded-xl p-8 text-center
                    transition-all duration-200 cursor-pointer
                    ${isDragging
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-white'}
                    ${files.length >= MAX_FILES ? 'opacity-50 pointer-events-none' : ''}
                `}
            >
                <input
                    type="file"
                    multiple
                    accept={ACCEPTED_TYPES.join(',')}
                    onChange={handleBrowse}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={files.length >= MAX_FILES}
                />
                <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
                <p className="text-sm font-medium text-slate-600">
                    {isDragging ? 'Drop photos here' : 'Drag & drop photos or click to browse'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                    Max {MAX_FILES} files · JPEG, PNG, WebP · 10 MB each
                </p>
            </div>

            {/* ── Thumbnail grid ── */}
            {files.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {files.map((f) => (
                        <div
                            key={f.id}
                            className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm"
                        >
                            {/* Preview */}
                            <img
                                src={f.preview}
                                alt={f.file.name}
                                className="w-full h-28 object-cover"
                            />

                            {/* ── Progress bar ── */}
                            {f.progress < 100 && !f.error && (
                                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-200">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-300"
                                        style={{ width: `${f.progress}%` }}
                                    />
                                </div>
                            )}

                            {/* ── Status overlay ── */}
                            {f.progress < 100 && !f.error && (
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                                </div>
                            )}

                            {f.url && (
                                <div className="absolute top-1.5 left-1.5">
                                    <CheckCircle className="w-5 h-5 text-emerald-500 drop-shadow" />
                                </div>
                            )}

                            {f.error && (
                                <div className="absolute inset-0 bg-red-900/40 flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6 text-white" />
                                </div>
                            )}

                            {/* ── Remove button ── */}
                            <button
                                onClick={() => removeFile(f.id)}
                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white
                                           flex items-center justify-center opacity-0 group-hover:opacity-100
                                           transition-opacity hover:bg-black/70"
                                aria-label="Remove photo"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>

                            {/* ── Filename ── */}
                            <div className="px-2 py-1.5">
                                <p className="text-xs text-slate-500 truncate">{f.file.name}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Counter ── */}
            {files.length > 0 && (
                <p className="mt-2 text-xs text-slate-400 text-right">
                    {files.length} / {MAX_FILES} photos
                </p>
            )}
        </div>
    );
}
