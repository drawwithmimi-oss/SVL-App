/**
 * Voice Audio Core - Shared audio engine for all sections
 * Version 2.6 - Extracted from v2.3 transfem (working version)
 *
 * This module contains ALL audio-related logic:
 * - Pitch detection
 * - Drone tone generation
 * - Recording (using WebAudioRecorder)
 * - Microphone management (iOS-compatible)
 */

// Export custom hook that manages all audio state and functions
function useVoiceAudio(showRecordingsModal) {
  const { useState, useRef, useEffect, useCallback } = window.React;

  // ============================================================================
  // AUDIO STATE
  // ============================================================================
  const [isDronePlaying, setIsDronePlaying] = useState(false);
  const [selectedNote, setSelectedNote] = useState('C4');
  const [currentPitch, setCurrentPitch] = useState(0);
  const [micPermission, setMicPermission] = useState('pending');
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [micActive, setMicActive] = useState(false);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [lastRecording, setLastRecording] = useState(null);

  // Audio processing parameters
  const [volumePct, setVolumePct] = useState(100);
  const [timbre, setTimbre] = useState('sine'); // sine, triangle, sawtooth, square
  const [softenHighs, setSoftenHighs] = useState(true); // lowpass to avoid "metallic"
  const [phoneBoost, setPhoneBoost] = useState(false); // EQ + compressor for phones

  // ============================================================================
  // AUDIO REFS
  // ============================================================================
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null); // SINGLE MediaStreamSource for BOTH pitch + recording
  const micStreamRef = useRef(null);
  const pitchDetectionRef = useRef(null);
  const webAudioRecorderRef = useRef(null);
  const audioRefs = useRef({});

  // Processing nodes
  const lowpassRef = useRef(null); // soften highs
  const highshelfRef = useRef(null); // gentle clarity bump when boost on
  const compressorRef = useRef(null); // loudness control for phones

  // ============================================================================
  // CONSTANTS
  // ============================================================================
  const baseGain = 0.2;
  const notes = {
    'A3': 220.00, 'B3': 246.94, 'C4': 261.63, 'C#4': 277.18, 'D4': 293.66,
    'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00
  };

  // ============================================================================
  // CORE AUDIO FUNCTIONS
  // ============================================================================

  /* Init mic + analyser for pitch detection (v2.3) */
  const initAudio = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      micStreamRef.current = stream;
      setMicPermission('granted');

      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      sourceRef.current.connect(analyserRef.current);

      setAudioInitialized(true);
      setMicActive(true);

      // Start pitch detection
      startPitchDetection();
      console.log('✅ Pitch detection started - will pause during playback');
    } catch (err) {
      console.error('Microphone error:', err);
      if (err.name === 'NotAllowedError') {
        setMicPermission('denied');
      } else {
        setMicPermission('denied');
      }
    }
  }, []);

  /* Pitch detection (simple dominant-bin) */
  const startPitchDetection = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const detect = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);

      let maxValue = 0, maxIndex = 0;
      for (let i = 0; i < bufferLength; i++) {
        if (dataArray[i] > maxValue) { maxValue = dataArray[i]; maxIndex = i; }
      }

      if (maxValue > 50) {
        const nyquist = audioContextRef.current.sampleRate / 2;
        const frequency = (maxIndex * nyquist) / bufferLength;
        if (frequency > 80 && frequency < 500) setCurrentPitch(Math.round(frequency));
      } else {
        setCurrentPitch(0);
      }

      pitchDetectionRef.current = requestAnimationFrame(detect);
    };

    detect();
  }, []);

  // Stop microphone completely during playback - DEMO'S EXACT METHOD!
  const stopMicrophoneForPlayback = useCallback(() => {
    console.log('🛑 Stopping microphone for playback - DEMO METHOD');

    // Step 1: Stop microphone track FIRST (like demo line 114)
    // This is THE critical step that releases the mic on iOS!
    if (micStreamRef.current) {
      try {
        const audioTracks = micStreamRef.current.getAudioTracks();
        console.log(`🎤 Found ${audioTracks.length} audio tracks`);

        if (audioTracks.length > 0) {
          console.log(`🎤 Stopping track: ${audioTracks[0].label}`);
          audioTracks[0].stop(); // DEMO WAY: .getAudioTracks()[0].stop()
          console.log('✅ Audio track stopped!');
        }

        micStreamRef.current = null;
        console.log('✅ Mic stream cleared');
      } catch (e) {
        console.error('Error stopping audio track:', e);
      }
    } else {
      console.log('⚠️ No mic stream to stop');
    }

    // Step 2: Stop pitch detection
    if (pitchDetectionRef.current) {
      cancelAnimationFrame(pitchDetectionRef.current);
      pitchDetectionRef.current = null;
      console.log('✅ Pitch detection stopped');
    }

    // Step 3: Disconnect and clear source node
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
        sourceRef.current = null;
        console.log('✅ Source node disconnected and cleared');
      } catch (e) {
        console.log('Source disconnect error:', e);
      }
    }

    // Step 4: Clear WebAudioRecorder if exists
    if (webAudioRecorderRef.current) {
      try {
        if (isRecording) {
          webAudioRecorderRef.current.finishRecording();
          setIsRecording(false);
        }
        webAudioRecorderRef.current = null;
        console.log('✅ WebAudioRecorder cleared');
      } catch (e) {
        console.log('Recorder cleanup error:', e);
      }
    }

    // Step 5: Clear analyser
    if (analyserRef.current) {
      analyserRef.current = null;
      console.log('✅ Analyser cleared');
    }

    console.log('🎯 Microphone fully stopped - check for red indicator!');

    // NOTE: We keep AudioContext alive (demo does this too)
  }, [isRecording]);

  // Restart microphone after playback (v2.3: Always restart for pitch detection)
  const restartMicrophoneAfterPlayback = useCallback(async () => {
    console.log('🔄 Restarting microphone for pitch detection...');
    try {
      await initAudio();
    } catch (error) {
      console.error('Error restarting microphone:', error);
    }
  }, [initAudio]);

  // ============================================================================
  // DRONE FUNCTIONS
  // ============================================================================

  /* Start/Stop drone */
  const startDrone = useCallback(async () => {
    if (!audioContextRef.current) return;
    try {
      // iOS/Safari unlock on gesture
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const lowpass = ctx.createBiquadFilter();
      const shelf = ctx.createBiquadFilter();
      const comp = ctx.createDynamicsCompressor();

      // Timbre + note
      osc.type = timbre;
      osc.frequency.value = notes[selectedNote];

      // Soften metallic edge with a gentle lowpass when enabled
      lowpass.type = 'lowpass';
      lowpass.frequency.value = softenHighs ? 2400 : 18000;
      lowpass.Q.value = 0.7;

      // Subtle clarity for small speakers when "phone boost" is on
      shelf.type = 'highshelf';
      shelf.frequency.value = 2500;
      shelf.gain.value = phoneBoost ? 3 : 0;

      // Dynamics to raise perceived loudness on phones
      if (phoneBoost) {
        comp.threshold.setValueAtTime(-26, ctx.currentTime);
        comp.knee.setValueAtTime(9, ctx.currentTime);
        comp.ratio.setValueAtTime(3, ctx.currentTime);
      } else {
        // Neutral settings (effectively bypass)
        comp.threshold.setValueAtTime(0, ctx.currentTime);
        comp.knee.setValueAtTime(0, ctx.currentTime);
        comp.ratio.setValueAtTime(1, ctx.currentTime);
      }
      comp.attack.setValueAtTime(0.003, ctx.currentTime);
      comp.release.setValueAtTime(0.25, ctx.currentTime);

      // Volume uses base gain scaled by slider (0–200%)
      gain.gain.value = baseGain * (volumePct / 100);

      // Connect graph: osc -> lowpass -> highshelf -> compressor -> gain -> out
      osc.connect(lowpass);
      lowpass.connect(shelf);
      shelf.connect(comp);
      comp.connect(gain);
      gain.connect(ctx.destination);

      osc.start();

      oscillatorRef.current = osc;
      gainNodeRef.current = gain;
      lowpassRef.current = lowpass;
      highshelfRef.current = shelf;
      compressorRef.current = comp;

      setIsDronePlaying(true);
    } catch (error) {
      console.error('Drone error:', error);
    }
  }, [selectedNote, timbre, softenHighs, phoneBoost, volumePct]);

  const stopDrone = useCallback(() => {
    if (oscillatorRef.current) {
      try { oscillatorRef.current.stop(); } catch {}
      oscillatorRef.current = null;
    }
    gainNodeRef.current = null;
    lowpassRef.current = null;
    highshelfRef.current = null;
    compressorRef.current = null;
    setIsDronePlaying(false);
  }, []);

  const adjustNote = useCallback((direction) => {
    const noteArray = Object.keys(notes);
    const currentIndex = noteArray.indexOf(selectedNote);
    let newIndex = direction === 'up' ? currentIndex + 1 : currentIndex - 1;
    newIndex = Math.max(0, Math.min(noteArray.length - 1, newIndex));
    const newNote = noteArray[newIndex];
    setSelectedNote(newNote);

    if (oscillatorRef.current) {
      oscillatorRef.current.frequency.value = notes[newNote];
    }
  }, [selectedNote]);

  // ============================================================================
  // RECORDING FUNCTIONS
  // ============================================================================

  // COMPLETE REWRITE - Recording functions using DEMO'S EXACT APPROACH
  const startRecording = useCallback(() => {
    console.log("🎙️ startRecording() called - DEMO METHOD");

    // DEMO WAY: Get microphone access RIGHT NOW (not beforehand!)
    const constraints = { audio: true, video: false };

    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
      console.log("✅ getUserMedia() success, stream created");

      // DEMO WAY: Create AudioContext AFTER getUserMedia (iOS requirement)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        console.log("✅ AudioContext created");
      }

      // Store stream for later (to stop it)
      micStreamRef.current = stream;

      // Create MediaStreamSource from the stream
      const input = audioContextRef.current.createMediaStreamSource(stream);
      console.log("✅ MediaStreamSource created");

      // Create WebAudioRecorder
      const recorder = new window.WebAudioRecorder(input, {
        workerDir: "../js/",
        encoding: 'wav',
        numChannels: 2,
        onEncoderLoading: function(recorder, encoding) {
          console.log("Loading " + encoding + " encoder...");
        },
        onEncoderLoaded: function(recorder, encoding) {
          console.log(encoding + " encoder loaded");
        }
      });

      recorder.onComplete = function(recorder, blob) {
        console.log("✅ Encoding complete");
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toLocaleString();
        const newRecording = {
          id: Date.now(),
          timestamp,
          blob,
          url,
          duration: null,
          mimeType: 'audio/wav',
          encoding: 'wav'
        };

        setRecordings(prev => [...prev, newRecording]);
        setLastRecording(newRecording);
      };

      recorder.setOptions({
        timeLimit: 300,
        encodeAfterRecord: true
      });

      webAudioRecorderRef.current = recorder;
      recorder.startRecording();
      setIsRecording(true);
      console.log("✅ Recording started");

    }).catch(function(err) {
      console.error('getUserMedia() error:', err);
      alert('Microphone access denied or not available');
    });

  }, []);

  const stopRecording = useCallback(() => {
    console.log("🛑 stopRecording() called - DEMO METHOD");

    if (!webAudioRecorderRef.current || !isRecording) {
      console.log("⚠️ Nothing to stop");
      return;
    }

    // DEMO WAY: Stop microphone access FIRST! (Line 114 of demo)
    if (micStreamRef.current) {
      console.log("🎤 Stopping microphone track...");
      micStreamRef.current.getAudioTracks()[0].stop();
      micStreamRef.current = null;
      console.log("✅ Microphone track stopped - RED MIC SHOULD DISAPPEAR!");
    }

    // Then finish the recording
    webAudioRecorderRef.current.finishRecording();
    setIsRecording(false);
    console.log("✅ Recording stopped");

  }, [isRecording]);

  const deleteRecording = useCallback((id) => {
    setRecordings(prev => {
      const recording = prev.find(r => r.id === id);
      if (recording) {
        URL.revokeObjectURL(recording.url);
      }
      return prev.filter(r => r.id !== id);
    });
    if (lastRecording && lastRecording.id === id) {
      setLastRecording(null);
    }
  }, [lastRecording]);

  const downloadRecording = useCallback((recording) => {
    const a = document.createElement('a');
    a.href = recording.url;
    const ext = recording.encoding || 'wav';
    a.download = `voice-recording-${recording.id}.${ext}`;
    a.click();
  }, []);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const activateMicrophone = useCallback(async () => {
    if (!audioInitialized) {
      await initAudio();
    }
    // Ensure AudioContext is running (iOS requirement)
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    setMicActive(true);
  }, [audioInitialized, initAudio]);

  const togglePitchMonitor = useCallback(async () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      try { await audioContextRef.current.resume(); } catch {}
    }
  }, []);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /* Component mount - Start pitch detection automatically (v2.3) */
  useEffect(() => {
    initAudio(); // Start pitch detection on mount (will pause during playback)

    // Default: enable boost on small screens
    try {
      if (window.matchMedia && window.matchMedia('(max-width: 480px)').matches) {
        setPhoneBoost(true);
      }
    } catch {}

    return () => {
      if (pitchDetectionRef.current) cancelAnimationFrame(pitchDetectionRef.current);
      if (oscillatorRef.current) { try { oscillatorRef.current.stop(); } catch {} }
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
      // NOTE: Keep audioContext alive like demo does - don't close it
      // iOS needs the context to remain active for proper audio routing
    };
  }, [initAudio]);

  /* Stop mic when recordings modal opens (for loud playback on iOS) */
  useEffect(() => {
    const handleModalMicrophone = async () => {
      if (showRecordingsModal) {
        console.log('Recordings modal opened - stopping microphone');
        stopMicrophoneForPlayback();
        // Give Safari time to fully release microphone and update audio route
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log('Microphone released, ready for playback');
      } else if (micActive && !micStreamRef.current) {
        console.log('Recordings modal closed - restarting microphone');
        restartMicrophoneAfterPlayback();
      }
    };
    handleModalMicrophone();
  }, [showRecordingsModal, micActive, stopMicrophoneForPlayback, restartMicrophoneAfterPlayback]);

  /* Live updates while playing */
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = baseGain * (volumePct / 100);
    }
  }, [volumePct]);

  useEffect(() => {
    if (oscillatorRef.current) oscillatorRef.current.type = timbre;
  }, [timbre]);

  useEffect(() => {
    if (oscillatorRef.current) {
      oscillatorRef.current.frequency.value = notes[selectedNote];
    }
  }, [selectedNote]);

  useEffect(() => {
    if (lowpassRef.current) {
      lowpassRef.current.frequency.value = softenHighs ? 2400 : 18000;
    }
  }, [softenHighs]);

  useEffect(() => {
    const ctx = audioContextRef.current;
    if (ctx && compressorRef.current && highshelfRef.current) {
      const comp = compressorRef.current;
      const shelf = highshelfRef.current;
      if (phoneBoost) {
        comp.threshold.setValueAtTime(-26, ctx.currentTime);
        comp.knee.setValueAtTime(9, ctx.currentTime);
        comp.ratio.setValueAtTime(3, ctx.currentTime);
        shelf.gain.value = 3;
      } else {
        comp.threshold.setValueAtTime(0, ctx.currentTime);
        comp.knee.setValueAtTime(0, ctx.currentTime);
        comp.ratio.setValueAtTime(1, ctx.currentTime);
        shelf.gain.value = 0;
      }
    }
  }, [phoneBoost]);

  // ============================================================================
  // RETURN API
  // ============================================================================

  return {
    // State
    isDronePlaying,
    selectedNote,
    currentPitch,
    micPermission,
    audioInitialized,
    micActive,
    isRecording,
    recordings,
    lastRecording,
    volumePct,
    timbre,
    softenHighs,
    phoneBoost,

    // Setters for audio parameters
    setVolumePct,
    setTimbre,
    setSoftenHighs,
    setPhoneBoost,
    setSelectedNote,

    // Microphone functions
    activateMicrophone,
    togglePitchMonitor,
    stopMicrophoneForPlayback,
    restartMicrophoneAfterPlayback,

    // Drone functions
    startDrone,
    stopDrone,
    adjustNote,

    // Recording functions
    startRecording,
    stopRecording,
    deleteRecording,
    downloadRecording,

    // Refs (for advanced usage)
    audioRefs,
    notes,
    baseGain
  };
}

// Export for ES6 modules and global usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { useVoiceAudio };
} else {
  window.useVoiceAudio = useVoiceAudio;
}
