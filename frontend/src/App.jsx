import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, Globe, FileText, Activity, StopCircle, Sparkles, WifiOff, Volume2, Info } from 'lucide-react';
import LanguageSelector, { languages } from './components/LanguageSelector';
import VoiceVisualizer from './components/VoiceVisualizer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Namaste! I am your Village Assistant. You can ask me about government schemes, pensions, or local updates.', original_query: null }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState('en');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSend = async (overrideInput) => {
    const queryText = overrideInput || input;
    if (!queryText.trim()) return;

    const userMessage = { role: 'user', content: queryText, original_query: null };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Get Text Response with Language Context
      const res = await axios.post(`${API_URL}/query`, {
        query: userMessage.content,
        language: language
      });

      const { result, sources, original_query } = res.data;

      const botMessage = { role: 'assistant', content: result, sources, original_query };
      setMessages(prev => [...prev, botMessage]);

      // 2. Get Audio (Auto-play)
      playVoice(result);

    } catch (error) {
      console.error(error);
      const errorMsg = isOffline
        ? "I seem to be offline. I'll check my local records..."
        : "I'm having trouble retrieving that information. Please check the connection.";

      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const playVoice = async (text) => {
    try {
      setIsSpeaking(true);
      const res = await axios.post(`${API_URL}/voice`, {
        text,
        language: language
      }, { responseType: 'blob' });

      const audioUrl = URL.createObjectURL(res.data);
      const audio = new Audio(audioUrl);

      audio.onended = () => setIsSpeaking(false);
      audio.play();
    } catch (err) {
      console.error("Voice generation failed", err);
      setIsSpeaking(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioForTranscription(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioForTranscription = async (audioBlob) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');

    try {
      const res = await axios.post(`${API_URL}/transcribe`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const transcribedText = res.data.text;

      if (transcribedText) {
        handleSend(transcribedText);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "I couldn't clear hear that. Could you please say it again?" }]);
        setIsLoading(false);
      }

    } catch (error) {
      console.error("Transcription failed:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Error processing voice input." }]);
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden relative selection:bg-pink-500/30">

      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-indigo-900/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-fuchsia-900/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[20%] w-[40%] h-[40%] bg-cyan-900/10 rounded-full blur-[100px] mix-blend-screen animate-float" />
      </div>

      <div className="max-w-4xl mx-auto h-screen flex flex-col relative z-10 glass-container">

        {/* Header */}
        <header className="px-6 py-5 flex items-center justify-between backdrop-blur-xl bg-white/5 border-b border-white/5 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-fuchsia-500 rounded-xl blur opacity-40 animate-pulse"></div>
              <div className="relative p-2.5 bg-slate-900 rounded-xl border border-white/10 shadow-xl">
                <Globe className="text-cyan-400 w-6 h-6" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-blue-300 to-fuchsia-300 tracking-tight">
                Civic Bridge
              </h1>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-red-500' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'} animate-pulse`} />
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  {isOffline ? "Offline Mode" : "System Online"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Prompt */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-300">Select language below</span>
            </div>
          </div>
        </header>

        {/* content container */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

          {/* Sidebar / Language Select (Desktop) */}
          <div className="hidden md:block w-64 p-4 border-r border-white/5 bg-slate-900/30 backdrop-blur-sm overflow-y-auto custom-scrollbar">
            <h3 className="text-sm font-semibold text-slate-400 mb-4 px-2 uppercase tracking-wider">Languages</h3>
            <LanguageSelector selectedLang={language} onSelect={setLanguage} vertical={true} />
          </div>

          {/* Mobile Language Bar */}
          <div className="md:hidden px-4 py-2 bg-slate-900/40 backdrop-blur-md border-b border-white/5 overflow-x-auto scrollbar-none">
            <LanguageSelector selectedLang={language} onSelect={setLanguage} />
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col relative">

            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              <AnimatePresence mode='popLayout'>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg border border-white/10 ${msg.role === 'user'
                      ? 'bg-slate-800'
                      : 'bg-gradient-to-br from-indigo-500 to-fuchsia-600 shadow-fuchsia-500/20'
                      }`}>
                      {msg.role === 'user' ? '👤' : <Sparkles className="w-5 h-5 text-white" />}
                    </div>

                    {/* Bubble */}
                    <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`p-5 rounded-3xl relative overflow-hidden group shadow-md ${msg.role === 'user'
                        ? 'bg-slate-800 text-slate-100 rounded-tr-sm border border-slate-700/50'
                        : 'bg-white/5 backdrop-blur-2xl border border-white/10 rounded-tl-sm text-slate-100'
                        }`}>

                        {/* Glass sheen effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                        <p className="leading-7 relative z-10 text-[15px]">{msg.content}</p>

                        {/* Original Query (if translated) */}
                        {msg.original_query && (
                          <p className="text-xs text-slate-500 mt-3 border-t border-white/5 pt-2 italic">
                            Original: "{msg.original_query}"
                          </p>
                        )}
                      </div>

                      {/* Sources */}
                      {msg.sources && msg.sources.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="flex flex-wrap gap-2 mt-3 pl-1"
                        >
                          {msg.sources.map((source, sIdx) => (
                            <span key={sIdx} className="flex items-center gap-1.5 text-[10px] bg-slate-900/40 px-3 py-1.5 rounded-full text-cyan-300 border border-cyan-500/10 hover:border-cyan-500/30 transition-all cursor-help backdrop-blur-sm">
                              <FileText className="w-3 h-3" />
                              {source}
                            </span>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center shrink-0 animate-pulse">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-center gap-3 px-5 py-4 bg-white/5 rounded-3xl rounded-tl-sm border border-white/10 backdrop-blur-sm">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                      <span className="w-2 h-2 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <span className="w-2 h-2 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-xs text-slate-400 font-medium tracking-wide">
                      {isRecording ? "Listening to environment..." : "Consulting village records..."}
                    </span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input Area */}
            <div className="p-6 pt-2 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent backdrop-blur-[2px]">
              <div className="relative max-w-3xl mx-auto">

                {/* Visualizer Container */}
                <AnimatePresence>
                  {isRecording && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <VoiceVisualizer isRecording={isRecording} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input Bar */}
                <div className={`relative flex items-end bg-slate-900/60 backdrop-blur-2xl rounded-2xl border border-white/10 p-2 gap-3 shadow-2xl transition-all duration-300 ${isRecording ? 'ring-2 ring-red-500/50 border-red-500/20' : 'ring-1 ring-white/5 hover:ring-white/10'}`}>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-3.5 rounded-xl transition-all duration-300 flex items-center justify-center ${isRecording
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    {isRecording ? <StopCircle className="w-6 h-6 animate-pulse" /> : <Mic className="w-6 h-6" />}
                  </motion.button>

                  <div className="flex-1 py-3 flex flex-col justify-center min-h-[50px]">
                    {!isRecording ? (
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder={`Ask a question in ${languages.find(l => l.code === language)?.name}...`}
                        className="w-full bg-transparent border-none outline-none text-slate-100 placeholder-slate-500 resize-none h-auto max-h-32 py-0 text-[16px] leading-relaxed scrollbar-none font-medium"
                        rows={1}
                        style={{ height: 'auto' }}
                        disabled={isLoading}
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium">Recording active...</span>
                      </div>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSend()}
                    disabled={isLoading || (!input.trim() && !isRecording)}
                    className="p-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center"
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                </div>

                <div className="mt-4 flex justify-between items-center text-[11px] text-slate-500 font-medium px-2">
                  <span>Civic Bridge v2.0</span>
                  <span className="flex items-center gap-1.5"><WifiOff className="w-3 h-3" /> Offline Capable</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
