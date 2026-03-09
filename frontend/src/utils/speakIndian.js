export function speakIndian(text, langCode, { onStart, onEnd } = {}) {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = langCode;
    u.rate = 0.88;
    u.pitch = 1.05;
    u.volume = 1.0;

    const trySpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        const v = voices.find(x => x.lang === langCode)
            || voices.find(x => x.lang.startsWith(langCode.split('-')[0]))
            || voices.find(x => x.lang.includes('IN'));

        if (v) u.voice = v;

        u.onstart = () => onStart && onStart();
        u.onend = () => onEnd && onEnd();

        window.speechSynthesis.speak(u);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
        trySpeak();
    } else {
        window.speechSynthesis.onvoiceschanged = trySpeak;
    }
}
