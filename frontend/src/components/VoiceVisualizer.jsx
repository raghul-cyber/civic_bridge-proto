import React, { useEffect, useRef } from 'react';

export default function VoiceVisualizer({ isRecording }) {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        if (!isRecording) {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let time = 0;

        const resize = () => {
            canvas.width = canvas.parentElement.offsetWidth;
            canvas.height = 80;
        };
        resize();
        window.addEventListener('resize', resize);

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const centerY = canvas.height / 2;
            const width = canvas.width;

            // Multiple waves with different colors and frequencies
            const waves = [
                { color: '#22d3ee', amplitude: 20, frequency: 0.02, speed: 0.1 }, // Cyan
                { color: '#8b5cf6', amplitude: 15, frequency: 0.03, speed: 0.15 }, // Violet
                { color: '#ec4899', amplitude: 10, frequency: 0.04, speed: 0.2 },  // Pink
            ];

            waves.forEach(wave => {
                ctx.beginPath();
                ctx.lineWidth = 3;
                ctx.strokeStyle = wave.color;
                ctx.lineCap = 'round';

                for (let x = 0; x < width; x++) {
                    const y = centerY + Math.sin(x * wave.frequency + time * wave.speed) * wave.amplitude * Math.sin(time * 0.5);
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            });

            time += 0.5;
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [isRecording]);

    if (!isRecording) return null;

    return (
        <div className="w-full h-[80px] flex items-center justify-center overflow-hidden rounded-xl bg-slate-900/40 backdrop-blur-md border border-white/10 mb-4 shadow-inner">
            <canvas ref={canvasRef} className="w-full h-full" />
        </div>
    );
}
