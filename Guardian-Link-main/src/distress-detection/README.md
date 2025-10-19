# AI-Powered Distress Detection System

This module provides intelligent audio monitoring capabilities for the GuardianLink personal safety application. The system continuously monitors audio input to detect signs of distress through speech recognition, natural language processing, and audio analysis.

## Architecture Overview

The distress detection system is organized into the following components:

### Core Interfaces (`/interfaces`)
- **DistressDetectionManager**: Central coordinator for all distress detection activities
- **SpeechRecognitionEngine**: Converts speech to text using Web Speech API
- **AudioAnalysisEngine**: Analyzes raw audio for distress patterns using Web Audio API
- **DistressClassificationService**: AI/NLP service for analyzing text content
- **VerificationDialog**: User interface for distress confirmation
- **EmergencyResponseHandler**: Manages SOS activation and emergency protocols
- **PermissionsManager**: Handles browser permissions and privacy controls

### Type Definitions (`/types`)
- **DistressSettings**: Configuration interface for all detection settings
- **DistressAnalysis**: Results from NLP analysis of text content
- **DistressContext**: Context information for detected distress events
- **DistressEvent**: Complete event log structure for audit trails
- **VerificationResult**: User response to verification dialogs

### Configuration (`/config`)
- **defaults.ts**: Default settings, phrases, and configuration constants
- Audio analysis parameters (FFT size, thresholds, etc.)
- Speech recognition settings (languages, confidence thresholds)
- API endpoints and timeout configurations

### Utilities (`/utils`)
- **browser-support.ts**: Browser compatibility detection for Web APIs
- **storage.ts**: LocalStorage utilities for persisting settings and events

## Key Features

### Multi-Modal Detection
- **Speech Recognition**: Continuous monitoring using Web Speech API
- **Audio Analysis**: Real-time volume and frequency analysis
- **NLP Processing**: Local and cloud-based distress phrase detection

### Privacy-First Design
- Local processing by default
- Explicit consent for cloud API usage
- Configurable data retention policies
- No audio storage unless explicitly enabled

### Robust Error Handling
- Automatic service restart on failures
- Graceful degradation when features unavailable
- Comprehensive browser compatibility checks

### Integration Ready
- Designed to integrate with existing GuardianLink SOS system
- Event-driven architecture for loose coupling
- TypeScript interfaces for type safety

## Browser Support

### Required Features
- **MediaDevices API**: For microphone access
- **Web Speech API**: For speech-to-text conversion
- **Web Audio API**: For real-time audio analysis

### Optional Features
- **Permissions API**: For enhanced permission management
- **Web Workers**: For performance optimization

### Supported Browsers
- Chrome 25+ (full support)
- Firefox 44+ (full support)
- Safari 14.1+ (full support)
- Edge 79+ (full support)

## Configuration

The system uses a comprehensive settings interface that allows users to:

- Enable/disable individual detection methods
- Adjust sensitivity thresholds
- Choose between local and cloud processing
- Configure verification timeouts
- Set privacy preferences

## Next Steps

This foundation provides the structure and interfaces needed for implementing the complete distress detection system. The next tasks will involve:

1. Implementing the core services (speech recognition, audio analysis)
2. Building the NLP classification engine
3. Creating the verification dialog UI
4. Integrating with the existing SOS system
5. Adding comprehensive error handling and recovery

## Security Considerations

- All audio processing happens locally by default
- API keys and sensitive data are never logged
- User consent is required for any external data transmission
- Audit trails are maintained for all distress events