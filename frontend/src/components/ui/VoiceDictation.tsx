import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface VoiceDictationProps {
  /** Called with the transcribed text when recording finishes */
  onTranscript: (text: string) => void;
  /** Optional className for positioning */
  className?: string;
  /** Button size variant */
  size?: 'sm' | 'md';
}

type RecordingState = 'idle' | 'recording' | 'transcribing';

export default function VoiceDictation({ onTranscript, className = '', size = 'sm' }: VoiceDictationProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const transcribe = useCallback(async (blob: Blob) => {
    setState('transcribing');
    setError('');
    try {
      const token = localStorage.getItem('neurovia_patient_token')
        || localStorage.getItem('neurovia_doctor_token')
        || '';

      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');

      const res = await fetch(`${API_URL}/audio/transcribe`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Transcription failed');

      const data = await res.json();
      if (data.text) {
        onTranscript(data.text);
      } else {
        setError('No speech detected');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err: any) {
      console.error('[VoiceDictation]', err);
      setError('Transcription failed');
      setTimeout(() => setError(''), 3000);
    } finally {
      setState('idle');
    }
  }, [onTranscript]);

  const startRecording = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stopStream();
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size > 100) {
          transcribe(blob);
        } else {
          setError('Recording too short');
          setTimeout(() => setError(''), 3000);
          setState('idle');
        }
      };

      mediaRecorder.start();
      setState('recording');
    } catch (err: any) {
      console.error('[VoiceDictation] Mic access denied:', err);
      setError('Microphone access denied');
      setTimeout(() => setError(''), 4000);
      setState('idle');
    }
  }, [transcribe, stopStream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleClick = () => {
    if (state === 'idle') startRecording();
    else if (state === 'recording') stopRecording();
    // do nothing while transcribing
  };

  const btnSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={state === 'transcribing'}
        title={
          state === 'idle' ? 'Click to dictate'
          : state === 'recording' ? 'Click to stop'
          : 'Transcribing...'
        }
        className={`
          ${btnSize} rounded-full flex items-center justify-center transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-1
          ${state === 'idle'
            ? 'bg-[#8C9A86]/15 text-[#8C9A86] hover:bg-[#8C9A86]/25 focus:ring-[#8C9A86]/40 cursor-pointer'
            : state === 'recording'
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse cursor-pointer focus:ring-red-400'
            : 'bg-[#0D2B45]/10 text-[#0D2B45]/50 cursor-wait focus:ring-[#0D2B45]/20'
          }
        `}
      >
        {state === 'idle' && <Mic className={iconSize} />}
        {state === 'recording' && <MicOff className={iconSize} />}
        {state === 'transcribing' && <Loader2 className={`${iconSize} animate-spin`} />}
      </button>

      {state === 'recording' && (
        <span className="text-xs font-semibold text-red-500 animate-pulse">Recording...</span>
      )}
      {state === 'transcribing' && (
        <span className="text-xs font-semibold text-[#0D2B45]/50">Transcribing...</span>
      )}
      {error && (
        <span className="text-xs font-semibold text-red-400">{error}</span>
      )}
    </div>
  );
}
