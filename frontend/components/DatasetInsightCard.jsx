import React from 'react';
import { BarChart3, Database, TrendingUp, Calendar } from 'lucide-react';
import TextToSpeech from './TextToSpeech';

/**
 * DatasetInsightCard — Displays a summary insight derived from
 * a civic dataset, with a TTS button so users can hear the
 * key findings read aloud.
 *
 * @param {object}  props
 * @param {string}  props.datasetName   – Name of the source dataset.
 * @param {string}  props.insightTitle  – Headline of the insight.
 * @param {string}  props.insightBody   – Full narrative insight text.
 * @param {number}  [props.recordCount] – Number of records analysed.
 * @param {string}  [props.period]      – Time period covered (e.g. "Jan–Dec 2024").
 * @param {string}  [props.trend]       – Trend indicator (e.g. "+12% vs prior year").
 */
export default function DatasetInsightCard({
    datasetName = '',
    insightTitle = '',
    insightBody = '',
    recordCount = 0,
    period = '',
    trend = ''
}) {
    /** Compose spoken summary. */
    const spokenText = `Dataset insight from ${datasetName}. ${insightTitle}. ${insightBody}. ${trend ? `Trend: ${trend}.` : ''}`;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-semibold text-slate-700">{insightTitle}</span>
                </div>
                <TextToSpeech text={spokenText} showVoiceSelector />
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        {datasetName}
                    </span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">{insightBody}</p>

                {/* Metadata chips */}
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    {recordCount > 0 && (
                        <div className="flex items-center gap-1">
                            <Database className="w-3 h-3" />
                            <span>{recordCount.toLocaleString()} records</span>
                        </div>
                    )}
                    {period && (
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{period}</span>
                        </div>
                    )}
                    {trend && (
                        <div className="flex items-center gap-1 text-emerald-600 font-medium">
                            <TrendingUp className="w-3 h-3" />
                            <span>{trend}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
