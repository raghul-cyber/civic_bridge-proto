import React from 'react';
import { Building2, Phone, Globe, Clock } from 'lucide-react';
import TextToSpeech from './TextToSpeech';

/**
 * ServiceDescriptionCard — Renders a government service description
 * with a TTS button to read the details aloud (accessibility feature).
 *
 * @param {object}   props
 * @param {string}   props.name         – Service name (e.g. "Property Tax Assessment").
 * @param {string}   props.department   – Department offering the service.
 * @param {string}   props.description  – Full description of the service.
 * @param {string}   [props.phone]      – Contact phone number.
 * @param {string}   [props.website]    – Service website URL.
 * @param {string}   [props.hours]      – Operating hours summary.
 */
export default function ServiceDescriptionCard({
    name = '',
    department = '',
    description = '',
    phone = '',
    website = '',
    hours = ''
}) {
    /** Compose a sentence TTS will read. */
    const spokenText = `${name}, offered by ${department}. ${description}. ${phone ? `Contact: ${phone}.` : ''} ${hours ? `Hours: ${hours}.` : ''}`;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-semibold text-slate-700">{name}</span>
                </div>
                <TextToSpeech text={spokenText} showVoiceSelector />
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-3">
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {department}
                </span>

                <p className="text-sm text-slate-600 leading-relaxed">{description}</p>

                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    {phone && (
                        <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{phone}</span>
                        </div>
                    )}
                    {website && (
                        <div className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5" />
                            <a href={website} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{website}</a>
                        </div>
                    )}
                    {hours && (
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{hours}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
