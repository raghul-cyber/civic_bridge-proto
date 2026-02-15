import edge_tts
import os
import tempfile
import asyncio

class TTSEngine:
    def __init__(self):
        # Neural voices for high quality output
        self.voices = {
            "en": "en-US-ChristopherNeural",
            "hi": "hi-IN-SwaraNeural",
            "ta": "ta-IN-PallaviNeural",
            "kn": "kn-IN-GaganNeural",
            "te": "te-IN-MohanNeural"
        }

    async def generate_audio(self, text: str, language: str = "en") -> str:
        """
        Generates audio using edge-tts.
        Returns the path to the generated file.
        """
        voice = self.voices.get(language, self.voices["en"])
        communicate = edge_tts.Communicate(text, voice)
        
        # Create a temp file
        fd, output_file = tempfile.mkstemp(suffix=".mp3")
        os.close(fd)
        
        try:
            await communicate.save(output_file)
            return output_file
        except Exception as e:
            print(f"EdgeTTS Generation Error: {e}")
            if os.path.exists(output_file):
                os.remove(output_file)
            return None
