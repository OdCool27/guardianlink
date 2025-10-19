# AI Distress Detection Testing Suite

This directory contains a comprehensive testing suite for the AI-powered distress detection system. The tests are designed to validate all components of the distress detection functionality, from individual services to full end-to-end workflows.

## Testing Framework

- **Framework**: Vitest with React Testing Library
- **Environment**: jsdom for browser API simulation
- **Coverage**: Comprehensive unit, integration, and performance tests
- **Mocking**: Extensive browser API mocks for Web Speech API, Web Audio API, and media devices

## Test Structure

### Unit Tests (`/services/`)
Individual component testing with isolated functionality:

- **SpeechRecognitionService.test.ts**: Tests speech recognition initialization, listening control, result processing, error handling, and cleanup
- **AudioAnalysisService.test.ts**: Tests audio analysis initialization, distress detection algorithms, metrics tracking, and performance
- **DistressClassificationService.test.ts**: Tests NLP processing, distress phrase detection, sentiment analysis, and API integration
- **DistressDetectionManager.test.ts**: Tests central coordination, service management, and detection workflows

### Component Tests (`/components/`)
React component testing with user interaction simulation:

- **VerificationDialog.test.tsx**: Tests verification UI, countdown timer, user interactions, accessibility, and audio alerts

### Integration Tests (`/integration/`)
End-to-end workflow testing:

- **DistressDetectionFlow.test.ts**: Tests complete distress detection workflows, cross-browser compatibility, mobile optimization, and error recovery

### Performance Tests (`/performance/`)
Load and performance validation:

- **PerformanceTests.test.ts**: Tests audio processing performance, memory usage, battery optimization, and scalability

## Key Testing Features

### Browser API Mocking
Comprehensive mocks for:
- Web Speech API (SpeechRecognition)
- Web Audio API (AudioContext, AnalyserNode)
- MediaDevices API (getUserMedia)
- Storage APIs (localStorage, IndexedDB)
- Performance APIs (performance.memory)

### Test Scenarios Covered

#### Speech Recognition Testing
- Initialization and browser compatibility
- Continuous listening and error recovery
- Result processing and confidence filtering
- Automatic restart on recoverable errors
- Settings management and state tracking

#### Audio Analysis Testing
- Real-time audio processing
- Volume spike detection
- Frequency pattern analysis for screaming
- Performance optimization with Web Workers
- Memory management and cleanup

#### Distress Classification Testing
- Local NLP processing with regex patterns
- Hugging Face API integration
- Sentiment analysis and confidence scoring
- Custom phrase management
- Fallback mechanisms for API failures

#### Integration Testing
- Complete distress detection workflows
- Multi-source detection correlation
- Verification dialog interactions
- Emergency response triggering
- Cross-browser compatibility scenarios

#### Performance Testing
- Real-time audio processing constraints
- Memory leak detection
- Battery usage optimization
- Concurrent operation handling
- Scalability under load

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Files
```bash
npm test -- src/test/services/SpeechRecognitionService.test.ts
```

### With Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

### UI Mode
```bash
npm run test:ui
```

## Test Utilities

### TestUtils Class (`test-runner.ts`)
Provides common mocking utilities:
- `createMockAudioContext()`: Mock Web Audio API
- `createMockSpeechRecognition()`: Mock Web Speech API
- `generateSyntheticAudio()`: Create test audio data
- `generateDistressAudio()`: Create distress pattern audio
- `setupCommonMocks()`: Initialize all browser API mocks

### TestDataGenerator Class
Provides test data for consistent scenarios:
- `getDistressPhrases()`: Common distress phrases for testing
- `getNormalPhrases()`: Normal conversation phrases
- `getEdgeCasePhrases()`: Ambiguous phrases for edge case testing
- `getTestAudioMetrics()`: Audio metrics for different scenarios

### PerformanceTestUtils Class
Performance testing utilities:
- `measureExecutionTime()`: Time function execution
- `benchmarkFunction()`: Run performance benchmarks
- `simulateMemoryPressure()`: Test memory constraints

## Test Configuration

### Vitest Configuration (`vite.config.ts`)
- jsdom environment for browser simulation
- Global test utilities
- Coverage reporting with exclusions
- Setup file for common mocks

### Setup File (`setup.ts`)
- Browser API mocks initialization
- Global test environment configuration
- Mock implementations for all required APIs

## Coverage Goals

The test suite aims for:
- **Unit Tests**: 90%+ code coverage for core services
- **Integration Tests**: Complete workflow coverage
- **Performance Tests**: Real-time processing validation
- **Error Handling**: Comprehensive error scenario coverage
- **Cross-Browser**: Compatibility testing for major browsers

## Test Data and Scenarios

### Distress Detection Scenarios
1. **Speech-based detection**: Various distress phrases and confidence levels
2. **Audio-based detection**: Volume spikes, frequency patterns, sudden changes
3. **Combined detection**: Multi-source correlation and confidence boosting
4. **False positive prevention**: Normal conversation and ambient noise handling

### Error Scenarios
1. **Permission denied**: Microphone access rejection
2. **API failures**: Network errors, rate limiting, service unavailable
3. **Browser compatibility**: Missing API support, degraded functionality
4. **Resource constraints**: Memory pressure, CPU limitations, battery optimization

### Performance Scenarios
1. **Real-time processing**: Audio frame processing within time constraints
2. **Continuous monitoring**: Long-term stability and memory management
3. **Concurrent operations**: Multiple simultaneous detection events
4. **Mobile optimization**: Battery-aware processing and memory efficiency

## Maintenance

### Adding New Tests
1. Follow existing naming conventions
2. Use appropriate test utilities and mocks
3. Include both positive and negative test cases
4. Add performance considerations for real-time components
5. Update this documentation for new test categories

### Mock Updates
When browser APIs change or new APIs are added:
1. Update mock implementations in `setup.ts`
2. Add new utility functions to `test-runner.ts`
3. Ensure backward compatibility with existing tests
4. Test across different browser environments

This comprehensive testing suite ensures the reliability, performance, and compatibility of the AI distress detection system across various scenarios and environments.