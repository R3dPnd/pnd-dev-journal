import { useCallback, useEffect, useState } from 'react';

const DANN_VOICE_PREFERENCES = [
  'Microsoft Aria Online (Natural) - English (United States)',
  'Microsoft Jenny Online (Natural) - English (United States)',
  'Microsoft Zira Desktop - English (United States)',
  'Samantha',
  'Google US English',
];

function pickDannVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  for (const name of DANN_VOICE_PREFERENCES) {
    const v = voices.find((v) => v.name === name);
    if (v) return v;
  }
  return voices.find((v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
    ?? voices.find((v) => v.lang.startsWith('en'))
    ?? voices[0]
    ?? null;
}

export function useTTS() {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const load = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) setVoice(pickDannVoice(voices));
    };
    window.speechSynthesis.addEventListener('voiceschanged', load);
    load();
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  const speak = useCallback(
    (text: string) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (voice) utterance.voice = voice;
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [voice]
  );

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking, voiceName: voice?.name ?? 'Loading...' };
}
