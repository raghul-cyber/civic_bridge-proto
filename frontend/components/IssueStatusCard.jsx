import React from 'react';
import { Bell, MapPin, Clock } from 'lucide-react';
import TextToSpeech from './TextToSpeech';

/**
 * IssueStatusCard — Renders a single issue-status notification
 * with an inline TTS button so users can listen to the update.
 *
 * @param {object}  props
 * @param {string}  props.issueId       – Issue identifier (e.g. "SR-34981").
 * @param {string}  props.issueType     – Type label (e.g. "Pothole").
 * @param {string}  props.location      – Address / landmark.
 * @param {string}  props.status        – Current status (open | in_progress | resolved | closed).
 * @param {string}  props.statusMessage – Human-readable status narrative.
 * @param {string}  props.updatedAt     – ISO date string of last update.
 */
export default function IssueStatusCard({
    issueId = '',
    issueType = '',
    location = '',
    status = 'open',
    statusMessage = '',
    updatedAt = ''
}) {
    const STATUS_COLORS = {
        open: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
        resolved: 'bg-green-100 text-green-700 border-green-300',
        closed: 'bg-slate-100 text-slate-600 border-slate-300'
    };

    /** Compose a sentence that TTS will read aloud. */
    const spokenText = `Issue ${issueId}: ${issueType} at ${location}. Status: ${status.replace('_', ' ')}. ${statusMessage}`;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700">Issue Update</span>
                    <span className="text-xs text-slate-400">{issueId}</span>
                </div>
                {/* TTS button */}
                <TextToSpeech text={spokenText} showVoiceSelector />
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[status] || STATUS_COLORS.open}`}>
                        {status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-slate-700">{issueType}</span>
                </div>

                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{location}</span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">{statusMessage}</p>

                {updatedAt && (
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>Updated {new Date(updatedAt).toLocaleDateString()}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
