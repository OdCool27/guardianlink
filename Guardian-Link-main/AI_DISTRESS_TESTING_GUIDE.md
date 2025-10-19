# 🧪 AI Distress Detection Testing Guide

This guide shows you how to test all the AI distress detection features in your Guardian Link app.

## 🚀 Quick Start Testing

### 1. **Add Test Components to Your App**

First, add the example components to your main app for easy testing. Add this to your `index.tsx`:

```typescript
// Import the test components
import { DistressClassificationExample } from './src/distress-detection/examples/DistressClassificationExample';
import { AudioAnalysisExample } from './src/distress-detection/examples/AudioAnalysisExample';
import { EmergencyResponseExample } from './src/distress-detection/examples/EmergencyResponseExample';

// Add a test tab to your navigation
const TestScreen = () => {
  const [activeTest, setActiveTest] = useState('classification');
  
  return (
    <div className="page-content">
      <div className="header">
        <h1>🧪 AI Testing Dashboard</h1>
      </div>
      
      <div className="test-nav">
        <button 
          className={activeTest === 'classification' ? 'active' : ''}
          onClick={() => setActiveTest('classification')}
        >
          Speech Classification
        </button>
        <button 
          className={activeTest === 'audio' ? 'active' : ''}
          onClick={() => setActiveTest('audio')}
        >
          Audio Analysis
        </button>
        <button 
          className={activeTest === 'emergency' ? 'active' : ''}
          onClick={() => setActiveTest('emergency')}
        >
          Emergency Response
        </button>
      </div>
      
      <div className="test-content">
        {activeTest === 'classification' && <DistressClassificationExample />}
        {activeTest === 'audio' && <AudioAnalysisExample />}
        {activeTest === 'emergency' && <EmergencyResponseExample />}
      </div>
    </div>
  );
};

// Add to your main navigation
const tabs = [
  { id: 'home', label: t('nav.home'), component: HomeScreen },
  { id: 'contacts', label: t('nav.contacts'), component: ContactsScreen },
  { id: 'map', label: t('nav.map'), component: MapScreen },
  { id: 'history', label: t('nav.history'), component: HistoryScreen },
  { id: 'profile', label: t('nav.profile'), component: ProfileScreen },
  { id: 'test', label: '🧪 Test AI', component: TestScreen } // Add this line
];
```

## 🎯 Testing Each Feature

### 1. **Speech Classification Testing**

**What it does:** Analyzes text/speech for distress phrases and sentiment

**How to test:**
1. Navigate to the "Speech Classification" test tab
2. Try these test phrases:

**Distress Phrases (should detect):**
- "Help me please!"
- "I'm scared, someone help"
- "Stop it, leave me alone"
- "Please don't hurt me"
- "Call the police now"
- "I need help right now"

**Normal Phrases (should NOT detect):**
- "Everything is fine, thank you"
- "Having a great day"
- "How are you doing?"
- "The weather is nice"

**Expected Results:**
- Distress phrases: `isDistress: true`, confidence > 70%
- Normal phrases: `isDistress: false`, confidence < 30%

### 2. **Audio Analysis Testing**

**What it does:** Analyzes real-time audio for volume spikes and distress patterns

**How to test:**
1. Navigate to the "Audio Analysis" test tab
2. Click "Start Analysis" (allow microphone access)
3. Try these tests:

**Volume Spike Tests:**
- Clap your hands loudly
- Shout suddenly
- Bang on the desk
- Drop something heavy

**Frequency Pattern Tests:**
- Scream or yell in a high pitch
- Make sudden loud noises
- Whistle sharply

**Expected Results:**
- Volume spikes should trigger distress detection
- High-frequency sounds should be detected as potential screaming
- Normal conversation should not trigger alerts

### 3. **Combined Detection Testing**

**How to test the full system:**
1. Enable both speech and audio detection
2. Speak distress phrases while making loud noises
3. Test the verification dialog system

## 🔧 Advanced Testing Options

### 1. **API vs Local Processing**

Test both modes:

```typescript
// Local processing (default)
service.setProcessingMode('local');

// API processing (requires Hugging Face API key)
service.setProcessingMode('api');
service.updateSettings({ 
  apiKey: 'your-huggingface-api-key' 
});
```

### 2. **Custom Distress Phrases**

Add your own test phrases:

```typescript
service.addCustomPhrases(['code red', 'emergency situation', 'need backup']);
```

### 3. **Sensitivity Adjustment**

For testing, make detection more sensitive:

```typescript
// Audio settings
audioService.updateSettings({
  volumeThreshold: 10, // Lower = more sensitive
  spikeDetection: true,
  frequencyAnalysis: true,
  sensitivity: 90 // Higher = more sensitive
});

// Speech settings
classificationService.setConfidenceThreshold(0.3); // Lower = more sensitive
```

## 🎮 Interactive Testing Console

Add this to your browser console for quick testing:

```javascript
// Test speech classification
async function testSpeech(text) {
  const service = new DistressClassificationService();
  await service.initialize();
  const result = await service.analyzeText(text);
  console.log('Result:', result);
  return result;
}

// Test phrases
testSpeech("help me please");
testSpeech("having a great day");

// Test audio analysis
async function testAudio() {
  const service = new AudioAnalysisService();
  await service.initialize();
  
  service.onDistressDetected((confidence, metrics) => {
    console.log('🚨 Distress detected!', { confidence, metrics });
  });
  
  service.startAnalysis();
  console.log('Audio analysis started - make some noise!');
}

testAudio();
```

## 📊 Monitoring and Debugging

### 1. **Enable Debug Logging**

```typescript
// Enable detailed logging
localStorage.setItem('distress-detection-debug', 'true');

// Check service status
const status = service.getStatus();
console.log('Service Status:', status);

// Monitor performance
const metrics = service.getPerformanceMetrics();
console.log('Performance:', metrics);
```

### 2. **Real-time Monitoring Dashboard**

Use the built-in monitoring components:

```typescript
import { MonitoringDashboard } from './src/distress-detection/components/MonitoringDashboard';

// Add to your test screen
<MonitoringDashboard 
  services={[speechService, audioService, classificationService]}
  showDetailedMetrics={true}
/>
```

## 🧪 Automated Testing

Run the comprehensive test suite:

```bash
# Run all AI distress detection tests
npm test -- src/test/services/
npm test -- src/test/integration/
npm test -- src/test/performance/

# Run specific test files
npm test -- src/test/services/DistressClassificationService.test.ts
npm test -- src/test/services/AudioAnalysisService.test.ts
npm test -- src/test/integration/DistressDetectionFlow.test.ts
```

## 🔍 Troubleshooting

### Common Issues:

1. **Microphone not working:**
   - Check browser permissions
   - Ensure HTTPS (required for microphone access)
   - Try different browsers

2. **Speech recognition not working:**
   - Check if Web Speech API is supported
   - Verify language settings
   - Test with different phrases

3. **API mode not working:**
   - Verify Hugging Face API key
   - Check network connectivity
   - Monitor browser console for errors

4. **Low detection accuracy:**
   - Adjust sensitivity settings
   - Add custom phrases for your use case
   - Check audio input levels

### Debug Commands:

```javascript
// Check browser support
console.log('Speech Recognition:', 'webkitSpeechRecognition' in window);
console.log('Audio Context:', 'AudioContext' in window);
console.log('Media Devices:', 'mediaDevices' in navigator);

// Test microphone access
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(() => console.log('✅ Microphone access granted'))
  .catch(err => console.error('❌ Microphone access denied:', err));
```

## 📈 Performance Testing

Monitor system performance:

```typescript
// Memory usage
const memoryInfo = (performance as any).memory;
console.log('Memory usage:', memoryInfo);

// Processing time
const startTime = performance.now();
await service.analyzeText("test phrase");
const endTime = performance.now();
console.log('Processing time:', endTime - startTime, 'ms');

// Real-time performance
setInterval(() => {
  const metrics = service.getPerformanceMetrics();
  console.log('Performance:', metrics);
}, 5000);
```

## 🎯 Success Criteria

Your AI distress detection is working correctly if:

✅ **Speech Classification:**
- Detects distress phrases with >70% confidence
- Rejects normal phrases with <30% confidence
- Processes text in <100ms

✅ **Audio Analysis:**
- Detects volume spikes above threshold
- Identifies frequency patterns for screaming
- Updates metrics in real-time (<100ms)

✅ **Integration:**
- Verification dialog appears on detection
- Emergency response triggers correctly
- Location data is captured and stored

✅ **Performance:**
- Memory usage stays stable during long sessions
- CPU usage remains reasonable
- No memory leaks after extended use

Happy testing! 🚀