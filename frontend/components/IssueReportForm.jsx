import React, { useState, useEffect, useCallback } from 'react';
import {
    Mic, ToggleLeft, ToggleRight, Loader2, Sparkles, Languages,
    MapPin, AlertTriangle, Clock, FileText, Send, ChevronDown, ChevronUp
} from 'lucide-react';
import axios from 'axios';
import VoiceInput from './VoiceInput';

const API_BASE = 'http://localhost:8000';

const ISSUE_TYPES = [
    'pothole', 'streetlight', 'water_leak', 'garbage',
    'noise', 'graffiti', 'traffic_signal', 'flooding', 'other'
];

const SEVERITY_LEVELS = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700 border-red-200' }
];

const LANGUAGES = [
    { code: 'en-US', label: 'English' },
    { code: 'es-US', label: 'Spanish' },
    { code: 'hi-IN', label: 'Hindi' },
    { code: 'fr-FR', label: 'French' },
    { code: 'pt-BR', label: 'Portuguese' }
];

export default function IssueReportForm() {
    // ── Form State ──
    const [issueType, setIssueType] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState('');
    const [estimatedDuration, setEstimatedDuration] = useState('');

    // ── UI State ──
    const [voiceReportMode, setVoiceReportMode] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractionResult, setExtractionResult] = useState(null);
    const [showTranslation, setShowTranslation] = useState(false);
    const [translatedText, setTranslatedText] = useState('');
    const [originalTranscript, setOriginalTranscript] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('en-US');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [error, setError] = useState(null);

    // ── Computed Values ──
    const charCount = description.length;
    const wordCount = description.trim() ? description.trim().split(/\s+/).length : 0;

    // ── Translation Logic ──
    const checkAndTranslate = useCallback(async (text) => {
        if (selectedLanguage !== 'en-US' && text.trim()) {
            try {
                const res = await axios.post(`${API_BASE}/nlp/translate`, {
                    text: text,
                    source_language: selectedLanguage,
                    target_language: 'en'
                });
                setTranslatedText(res.data.translated);
                setOriginalTranscript(text);
                setShowTranslation(true);
            } catch (err) {
                console.error('Translation failed:', err);
                setShowTranslation(false);
            }
        } else {
            setShowTranslation(false);
        }
    }, [selectedLanguage]);

    // ── Handle Description Voice Input (standard mode) ──
    const handleDescriptionTranscript = (transcript) => {
        setDescription(transcript);
        checkAndTranslate(transcript);
    };

    // ── Handle Voice Report Mode Extraction ──
    const handleVoiceReportTranscript = async (transcript) => {
        setDescription(transcript);
        setIsExtracting(true);
        setError(null);

        // If non-English, translate first
        await checkAndTranslate(transcript);

        try {
            const res = await axios.post(`${API_BASE}/nlp/extract`, {
                transcript: transcript
            });

            const extracted = res.data.extracted;
            setExtractionResult(extracted);

            // Auto-populate form fields
            setIssueType(extracted.issue_type || '');
            setLocation(extracted.location || '');
            setDescription(extracted.description || transcript);
            setSeverity(extracted.severity || '');
            setEstimatedDuration(extracted.estimated_duration || '');

        } catch (err) {
            console.error('Extraction failed:', err);
            setError('Failed to extract fields from your report. Please fill in manually.');
        } finally {
            setIsExtracting(false);
        }
    };

    // ── Submit Handler ──
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // Stub submission — replace with real API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            setSubmitSuccess(true);
            setTimeout(() => setSubmitSuccess(false), 4000);
        } catch (err) {
            setError('Failed to submit report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Reset ──
    const resetForm = () => {
        setIssueType('');
        setLocation('');
        setDescription('');
        setSeverity('');
        setEstimatedDuration('');
        setExtractionResult(null);
        setShowTranslation(false);
        setTranslatedText('');
        setOriginalTranscript('');
        setError(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4">
            <div className="max-w-3xl mx-auto">

                {/* ── Header ── */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                        Report a Civic Issue
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Use your voice or type to report issues in your community
                    </p>
                </div>

                {/* ── Mode Toggle ── */}
                <div className="flex items-center justify-center mb-8">
                    <button
                        onClick={() => { setVoiceReportMode(!voiceReportMode); resetForm(); }}
                        className={`
                            flex items-center space-x-3 px-6 py-3 rounded-full font-medium transition-all duration-300 shadow-sm
                            ${voiceReportMode
                                ? 'bg-violet-600 text-white shadow-violet-200 hover:bg-violet-700'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}
                        `}
                    >
                        {voiceReportMode
                            ? <ToggleRight className="w-5 h-5" />
                            : <ToggleLeft className="w-5 h-5" />
                        }
                        <span>
                            {voiceReportMode ? 'Voice Report Mode ON' : 'Switch to Voice Report Mode'}
                        </span>
                        <Mic className={`w-4 h-4 ${voiceReportMode ? 'animate-pulse' : ''}`} />
                    </button>
                </div>

                {/* ── Error Banner ── */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {/* ── Success Banner ── */}
                {submitSuccess && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                        <p className="text-emerald-700 font-medium">✓ Issue reported successfully!</p>
                    </div>
                )}

                {/* ══════════════════════════════════════════════
                     VOICE REPORT MODE
                   ══════════════════════════════════════════════ */}
                {voiceReportMode ? (
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center space-x-2 bg-violet-50 text-violet-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                                <Sparkles className="w-4 h-4" />
                                <span>AI-Powered Voice Report</span>
                            </div>
                            <p className="text-slate-500 text-sm max-w-md mx-auto">
                                Speak naturally about the issue. For example:<br />
                                <em className="text-slate-400">"There is a broken streetlight at 123 Main Street, it has been broken for 3 days"</em>
                            </p>
                        </div>

                        {/* Language selector */}
                        <div className="flex justify-center mb-6">
                            <select
                                value={selectedLanguage}
                                onChange={(e) => setSelectedLanguage(e.target.value)}
                                className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
                            >
                                {LANGUAGES.map(l => (
                                    <option key={l.code} value={l.code}>{l.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Large VoiceInput */}
                        <VoiceInput onTranscriptConfirm={handleVoiceReportTranscript} />

                        {/* Extraction loading spinner */}
                        {isExtracting && (
                            <div className="mt-6 flex items-center justify-center space-x-3 text-violet-600">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm font-medium">Analyzing your report with AI...</span>
                            </div>
                        )}

                        {/* Translation display */}
                        {showTranslation && (
                            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Languages className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-700">Translation</span>
                                </div>
                                <p className="text-sm text-slate-600 mb-1"><strong>Original:</strong> {originalTranscript}</p>
                                <p className="text-sm text-slate-800"><strong>English:</strong> {translatedText}</p>
                            </div>
                        )}

                        {/* Extracted fields — editable review */}
                        {extractionResult && !isExtracting && (
                            <div className="mt-8 border-t border-slate-100 pt-6">
                                <div className="flex items-center space-x-2 mb-6">
                                    <Sparkles className="w-5 h-5 text-violet-500" />
                                    <h3 className="font-semibold text-slate-700">Extracted Fields — Review & Edit</h3>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {renderFormFields({
                                        issueType, setIssueType,
                                        location, setLocation,
                                        description, setDescription,
                                        severity, setSeverity,
                                        estimatedDuration, setEstimatedDuration,
                                        charCount, wordCount
                                    })}

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full flex items-center justify-center space-x-2 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors disabled:opacity-50"
                                    >
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                        <span>{isSubmitting ? 'Submitting...' : 'Submit Report'}</span>
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                ) : (

                    /* ══════════════════════════════════════════════
                         STANDARD FORM MODE
                       ══════════════════════════════════════════════ */
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 space-y-6">

                        {renderFormFields({
                            issueType, setIssueType,
                            location, setLocation,
                            description, setDescription,
                            severity, setSeverity,
                            estimatedDuration, setEstimatedDuration,
                            charCount, wordCount
                        })}

                        {/* VoiceInput below the Description */}
                        <div>
                            <p className="text-xs text-slate-400 mb-2 ml-1">Or dictate your description:</p>
                            <VoiceInput onTranscriptConfirm={handleDescriptionTranscript} />
                        </div>

                        {/* Translation display */}
                        {showTranslation && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Languages className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-700">Translation</span>
                                </div>
                                <p className="text-sm text-slate-600 mb-1"><strong>Original:</strong> {originalTranscript}</p>
                                <p className="text-sm text-slate-800"><strong>English:</strong> {translatedText}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            <span>{isSubmitting ? 'Submitting...' : 'Submit Report'}</span>
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════
   Shared Editable Form Fields
   ══════════════════════════════════════════════ */
function renderFormFields({
    issueType, setIssueType,
    location, setLocation,
    description, setDescription,
    severity, setSeverity,
    estimatedDuration, setEstimatedDuration,
    charCount, wordCount
}) {
    return (
        <>
            {/* Issue Type */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <FileText className="w-4 h-4 inline mr-1.5 relative -top-px" />
                    Issue Type
                </label>
                <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                >
                    <option value="">Select issue type...</option>
                    {ISSUE_TYPES.map(type => (
                        <option key={type} value={type}>
                            {type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </option>
                    ))}
                </select>
            </div>

            {/* Location */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <MapPin className="w-4 h-4 inline mr-1.5 relative -top-px" />
                    Location
                </label>
                <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. 123 Main Street, Ward 5"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
            </div>

            {/* Description + Character/Word Count */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Description
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue in detail..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
                <div className="flex justify-end space-x-4 mt-1">
                    <span className="text-xs text-slate-400">{charCount} characters</span>
                    <span className="text-xs text-slate-400">{wordCount} words</span>
                </div>
            </div>

            {/* Severity */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    <AlertTriangle className="w-4 h-4 inline mr-1.5 relative -top-px" />
                    Severity
                </label>
                <div className="flex flex-wrap gap-2">
                    {SEVERITY_LEVELS.map(level => (
                        <button
                            key={level.value}
                            type="button"
                            onClick={() => setSeverity(level.value)}
                            className={`
                                px-4 py-1.5 rounded-full text-sm font-medium border transition-all
                                ${severity === level.value
                                    ? `${level.color} ring-2 ring-offset-1 ring-current`
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}
                            `}
                        >
                            {level.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Estimated Duration */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <Clock className="w-4 h-4 inline mr-1.5 relative -top-px" />
                    How long has this issue existed?
                </label>
                <input
                    type="text"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    placeholder="e.g. 3 days, 1 week, unknown"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
            </div>
        </>
    );
}
