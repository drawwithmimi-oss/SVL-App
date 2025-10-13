# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive voice training web application that combines real-time pitch detection with curated reading material. The application uses React (via CDN) for the UI and Web Audio API for advanced audio processing, pitch detection, and drone tone generation.

## Architecture

- **Single-file React application**: Complete app embedded in `index.html`
- **CDN-based dependencies**: React 18, Babel, and Tailwind CSS loaded from CDNs
- **Web Audio API**: Real-time audio processing for pitch detection and synthesis
- **Functional React components**: Uses hooks for state management
- **No build process required**: Runs directly in browsers with Babel transpilation

## Project Structure

```
voice-app/
├── index.html          # Complete single-file React application
├── package.json        # Project metadata (no runtime dependencies)
├── .gitignore         # Git ignore rules
├── README.md          # User documentation
└── CLAUDE.md          # Development guidance (this file)
```

## Technical Stack

### Core Technologies
- **React 18**: UI framework loaded from unpkg CDN
- **Babel Standalone**: JSX transformation in browser
- **Tailwind CSS**: Utility-first styling from CDN
- **Web Audio API**: Audio processing and synthesis

### Audio Processing Chain
- **Microphone Input** → MediaStreamSource → AnalyserNode → Pitch Detection
- **Drone Generation**: OscillatorNode → BiquadFilter → DynamicsCompressor → GainNode → Destination

## Key Components and Features

### VoiceTrainingReader Component (Main)
Located within the `<script type="text/babel">` block in `index.html`:

**State Management:**
- `isDronePlaying`: Controls drone tone playback
- `selectedNote`: Target pitch (A3-G4 range)
- `currentPitch`: Real-time detected pitch
- `micPermission`: Microphone access status
- `showBubble`: Floating pitch monitor visibility
- `selectedReading`: Currently displayed text
- `timbre`, `volumePct`, `phoneBoost`, `softenHighs`: Audio processing parameters

**Core Functions:**
- `initAudio()`: Initializes microphone access and audio context
- `startPitchDetection()`: Real-time pitch detection using FFT analysis
- `startDrone()`/`stopDrone()`: Drone tone generation with audio processing
- `adjustNote()`: Pitch adjustment controls

### Audio Processing Features

**Pitch Detection:**
- FFT-based frequency analysis using AnalyserNode
- Dominant frequency detection with noise filtering
- Real-time visual feedback with color coding

**Drone Synthesis:**
- Multiple waveform types (sine, triangle, sawtooth, square)
- Configurable volume (0-200% of base gain)
- Low-pass filtering for "soften highs" feature
- High-shelf EQ and compression for "phone boost"

**Audio Chain:**
```
Oscillator → LowPass Filter → HighShelf EQ → Compressor → Gain → Output
```

## Development Workflow

### Running the Application

**Local Development:**
```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

**Requirements:**
- HTTPS or localhost for microphone access
- Modern browser with Web Audio API support

### Browser Compatibility

**Full Support:**
- Chrome (recommended)
- Microsoft Edge

**Limited Support:**
- Safari (Web Audio API limitations)
- Firefox (limited Web Audio API support)

### Making Changes

Since this is a single-file application, all changes are made directly to `index.html`:

1. **UI Changes**: Modify JSX within the React component
2. **Styling**: Use Tailwind classes or add CSS to the `<style>` block
3. **Logic Changes**: Update JavaScript functions within the component
4. **New Features**: Add new state variables and handlers

### Testing Considerations

**Audio Testing:**
- Test drone generation across different browsers
- Verify pitch detection accuracy with known frequencies
- Check audio processing features (EQ, compression)
- Test microphone permissions and error handling

**UI Testing:**
- Verify responsive layout on mobile devices
- Test touch interactions and accessibility features
- Check reading material display and font size controls
- Validate floating pitch bubble behavior

**Cross-browser Testing:**
- Chrome: Full functionality expected
- Edge: Full functionality expected
- Safari: May have audio context limitations
- Firefox: Limited Web Audio API support

### Common Development Tasks

**Adding New Reading Material:**
1. Add new objects to the `readings` array
2. Include `id`, `title`, `description`, and `content` properties
3. Content should use template literals for multi-line text

**Modifying Audio Processing:**
1. Adjust parameters in `startDrone()` function
2. Modify filter frequencies, compression ratios, etc.
3. Test changes across different devices and browsers

**UI Enhancements:**
1. Add new Tailwind classes for styling
2. Create new state variables for additional controls
3. Update the JSX structure for new components

### Performance Considerations

**Audio Performance:**
- Pitch detection runs on requestAnimationFrame
- Audio nodes are properly cleaned up on component unmount
- Avoid creating excessive audio nodes

**React Performance:**
- Use `useCallback` for function memoization
- Minimize unnecessary re-renders
- Clean up audio resources in useEffect cleanup

### Adding Dependencies

Since this uses CDN-based dependencies:

1. **New CDN Libraries**: Add script tags in the HTML head
2. **Package.json**: Only update for project metadata (no runtime deps)
3. **Consider Bundle Size**: Keep CDN dependencies minimal

### Security and Privacy

- **Microphone Access**: Requires explicit user permission
- **Local Processing**: All audio processing happens locally
- **No Network Transmission**: No audio data sent to external servers
- **HTTPS Requirement**: Microphone access requires secure context

### Voice Training Domain Knowledge

When making changes, consider:

**Pitch Training:**
- A3-G4 range covers typical vocal training needs
- 5Hz tolerance for "in tune" feedback is appropriate
- Visual feedback should be immediate and clear

**Audio Processing:**
- Low-pass filtering reduces harsh overtones
- Compression helps with volume perception on small speakers
- Different timbres help with pitch recognition training

**Reading Materials:**
- Texts chosen for specific vocal techniques
- Dyslexia-friendly spacing and fonts important
- Font size options accommodate different visual needs