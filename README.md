# Voice Training Companion - Reading Edition

A comprehensive voice training web application that combines real-time pitch detection with curated reading material for voice practice. Perfect for voice training, speech therapy, and vocal exercises.

## Features

### 🎵 Pitch Training
- **Real-time Pitch Detection**: Live monitoring of vocal pitch using Web Audio API
- **Reference Drone Tones**: Configurable drone tones (A3-G4) to match your voice
- **Visual Pitch Feedback**: Color-coded indicators showing pitch accuracy
- **Floating Pitch Monitor**: Compact pitch bubble for reading while monitoring

### 🎚️ Audio Controls
- **Multiple Timbre Options**: Choose from sine, triangle, sawtooth, or square wave timbres
- **Volume Control**: Adjustable drone volume (0-200%) for comfortable listening
- **Phone Boost**: EQ and compression optimized for small speakers
- **Soften Highs**: Low-pass filtering to reduce metallic overtones

### 📚 Reading Material
- **Rainbow Passage**: Classic voice training text
- **Quick Practice Sentences**: Short warm-up exercises
- **Specialized Monologues**:
  - Bouncy Voice training passages
  - Tempo Variance exercises
  - Vowel Elongation practices
  - Diction & Articulation texts
  - Syllable Separation exercises

### 📱 User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Dyslexia-Friendly Typography**: Enhanced spacing and readable fonts
- **Adjustable Font Sizes**: Four size options for comfortable reading
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Getting Started

### Prerequisites

- **Modern Browser**: Chrome, Edge, or Safari (Firefox has limited Web Audio API support)
- **Microphone Access**: Required for pitch detection
- **HTTPS/Localhost**: Microphone access requires secure context

### Installation

1. Clone or download this repository
2. Open `index.html` in a web browser
3. Allow microphone permissions when prompted
4. Start with a simple reading passage to test your setup

### Local Development

Serve the file using any HTTP server:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

Navigate to `http://localhost:8000` in your browser.

## Usage

### Basic Voice Training

1. **Set Your Target Note**: Choose a comfortable pitch in your vocal range
2. **Start the Drone**: Click "Start Drone" to play the reference tone
3. **Monitor Your Pitch**: Enable the pitch monitor to see real-time feedback
4. **Select Reading Material**: Choose from various practice texts
5. **Practice**: Read aloud while matching the drone pitch

### Advanced Features

- **Timbre Adjustment**: Experiment with different wave shapes for comfort
- **Volume Control**: Adjust drone volume to balance with your voice
- **Phone Boost**: Enable for better sound on mobile devices or small speakers
- **Font Size Control**: Use the "Aa" button to cycle through text sizes

## Project Structure

```
voice-app/
├── index.html          # Complete single-file application
├── package.json        # Project metadata
├── README.md          # This documentation
├── CLAUDE.md          # Development guidance
└── .gitignore         # Git ignore rules
```

## Technical Architecture

- **Single-File Application**: All code embedded in `index.html`
- **React via CDN**: Uses React 18 with Babel for JSX transformation
- **Tailwind CSS**: Utility-first styling via CDN
- **Web Audio API**: Real-time audio processing and pitch detection
- **No Build Process**: Ready to run directly in the browser

## Browser Support

- ✅ **Chrome** (Recommended - full Web Audio API support)
- ✅ **Microsoft Edge** (Full support)
- ⚠️ **Safari** (Limited Web Audio API support)
- ❌ **Firefox** (Limited Web Audio API support)

## Voice Training Tips

### For Beginners
- Start with the "Quick Practice Sentences"
- Use a lower target note (A3, B3, C4) initially
- Practice with the drone at 50-75% volume
- Focus on matching pitch rather than perfect articulation

### Advanced Practice
- Try the specialized monologue exercises
- Experiment with different timbres to challenge pitch recognition
- Practice without the drone, then check with the pitch monitor
- Work on maintaining pitch while emphasizing different syllables

## Troubleshooting

### Audio Issues
- **No drone sound**: Check browser volume and audio permissions
- **Pitch detection not working**: Verify microphone access and speak louder
- **Distorted audio**: Try enabling "Soften Highs" or reducing volume

### Performance Issues
- **Laggy interface**: Close other browser tabs, try Chrome
- **Battery drain on mobile**: Disable phone boost when on battery power
- **Poor pitch accuracy**: Reduce background noise, speak closer to microphone

### Browser Issues
- **HTTPS required**: Use `https://` or `localhost` for microphone access
- **No microphone permission**: Check browser settings and grant access
- **Audio context issues**: Click a button to initialize audio on mobile Safari

## Contributing

1. Fork the repository
2. Make your changes to `index.html`
3. Test across different browsers and devices
4. Submit a pull request with detailed changes

## License

This project is open source and available under the [MIT License](LICENSE).