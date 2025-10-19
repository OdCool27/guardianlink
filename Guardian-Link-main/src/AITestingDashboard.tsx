/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { DistressClassificationService } from './distress-detection/services/DistressClassificationService';
import { AudioAnalysisService } from './distress-detection/services/AudioAnalysisService';
import { SpeechRecognitionService } from './distress-detection/services/SpeechRecognitionService';

/**
 * Simple AI Testing Dashboard for Guardian Link
 * Add this component to test AI distress detection features
 */
export const AITestingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('speech');
  const [testResults, setTestResults] = useState<any[]>([]);
  
  // Services
  const classificationService = useRef<DistressClassificationService | null>(null);
  const audioService = useRef<AudioAnalysisService | null>(null);
  const speechService = useRef<SpeechRecognitionService | null>(null);
  
  // States
  const [isAudioAnalyzing, setIsAudioAnalyzing] = useState(false);
  const [isSpeechListening, setIsSpeechListening] = useState(false);
  const [testText, setTestText] = useState('');
  const [audioMetrics, setAudioMetrics] = useState<any>(null);

  useEffect(() => {
    // Initialize services
    classificationService.current = new DistressClassificationService();
    audioService.current = new AudioAnalysisService();
    speechService.current = new SpeechRecognitionService();

    return () => {
      // Cleanup
      audioService.current?.destroy();
      speechService.current?.destroy();
    };
  }, []);

  const addTestResult = (result: any) => {
    setTestResults(prev => [
      { ...result, timestamp: new Date().toLocaleTimeString() },
      ...prev.slice(0, 9) // Keep last 10 results
    ]);
  };

  // Speech Classification Tests
  const testSpeechClassification = async (text: string) => {
    if (!classificationService.current) return;
    
    try {
      const result = await classificationService.current.analyzeText(text);
      addTestResult({
        type: 'Speech Classification',
        input: text,
        isDistress: result.isDistress,
        confidence: Math.round(result.confidence * 100),
        phrases: result.detectedPhrases,
        sentiment: result.sentiment
      });
    } catch (error) {
      console.error('Speech classification error:', error);
    }
  };

  // Audio Analysis Tests
  const startAudioAnalysis = async () => {
    if (!audioService.current) return;
    
    try {
      await audioService.current.initialize();
      
      // Set up callbacks
      audioService.current.onDistressDetected((confidence, metrics) => {
        addTestResult({
          type: 'Audio Detection',
          input: 'Audio input',
          isDistress: true,
          confidence: Math.round(confidence * 100),
          metrics: {
            peakVolume: metrics.peakVolume.toFixed(1),
            currentVolume: metrics.currentVolume.toFixed(1)
          }
        });
      });

      // Update metrics periodically
      const metricsInterval = setInterval(() => {
        if (audioService.current) {
          setAudioMetrics(audioService.current.getCurrentMetrics());
        }
      }, 500);

      audioService.current.startAnalysis();
      setIsAudioAnalyzing(true);

      // Store interval for cleanup
      (audioService.current as any).metricsInterval = metricsInterval;
    } catch (error) {
      console.error('Audio analysis error:', error);
    }
  };

  const stopAudioAnalysis = () => {
    if (audioService.current) {
      if ((audioService.current as any).metricsInterval) {
        clearInterval((audioService.current as any).metricsInterval);
      }
      audioService.current.destroy();
      audioService.current = new AudioAnalysisService();
    }
    setIsAudioAnalyzing(false);
    setAudioMetrics(null);
  };

  // Speech Recognition Tests
  const startSpeechRecognition = async () => {
    if (!speechService.current) return;
    
    try {
      await speechService.current.initialize();
      
      speechService.current.onProcessedResult((result) => {
        addTestResult({
          type: 'Speech Recognition',
          input: result.transcript,
          isDistress: result.isDistress,
          confidence: Math.round(result.distressConfidence * 100),
          phrases: result.detectedPhrases,
          sentiment: result.sentiment
        });
      });

      speechService.current.startListening();
      setIsSpeechListening(true);
    } catch (error) {
      console.error('Speech recognition error:', error);
    }
  };

  const stopSpeechRecognition = () => {
    if (speechService.current) {
      speechService.current.stopListening();
    }
    setIsSpeechListening(false);
  };

  // Test phrases
  const testPhrases = {
    distress: [
      "Help me please!",
      "I'm scared, someone help",
      "Stop it, leave me alone",
      "Please don't hurt me",
      "Call the police now"
    ],
    normal: [
      "Everything is fine, thank you",
      "Having a great day",
      "How are you doing?",
      "The weather is nice today",
      "I'm going to the store"
    ]
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🧪 AI Distress Detection Testing Dashboard</h1>
      
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        borderBottom: '1px solid #ddd',
        paddingBottom: '10px'
      }}>
        {[
          { id: 'speech', label: '💬 Speech Classification' },
          { id: 'audio', label: '🎤 Audio Analysis' },
          { id: 'recognition', label: '🗣️ Speech Recognition' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === tab.id ? '#007bff' : '#f8f9fa',
              color: activeTab === tab.id ? 'white' : '#333',
              border: '1px solid #ddd',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Main Testing Area */}
        <div style={{ flex: 2 }}>
          {/* Speech Classification Tab */}
          {activeTab === 'speech' && (
            <div>
              <h2>Speech Classification Testing</h2>
              
              {/* Manual Text Input */}
              <div style={{ marginBottom: '20px' }}>
                <h3>Manual Text Testing</h3>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    placeholder="Enter text to analyze..."
                    style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                  <button
                    onClick={() => testSpeechClassification(testText)}
                    disabled={!testText.trim()}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Analyze
                  </button>
                </div>
              </div>

              {/* Quick Test Phrases */}
              <div>
                <h3>Quick Test Phrases</h3>
                <div style={{ marginBottom: '15px' }}>
                  <h4 style={{ color: '#dc3545' }}>Distress Phrases (should detect)</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {testPhrases.distress.map((phrase, index) => (
                      <button
                        key={index}
                        onClick={() => testSpeechClassification(phrase)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#fff3cd',
                          border: '1px solid #ffeaa7',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        "{phrase}"
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ color: '#28a745' }}>Normal Phrases (should NOT detect)</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {testPhrases.normal.map((phrase, index) => (
                      <button
                        key={index}
                        onClick={() => testSpeechClassification(phrase)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#d1edff',
                          border: '1px solid #bee5eb',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        "{phrase}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audio Analysis Tab */}
          {activeTab === 'audio' && (
            <div>
              <h2>Audio Analysis Testing</h2>
              
              <div style={{ marginBottom: '20px' }}>
                <button
                  onClick={isAudioAnalyzing ? stopAudioAnalysis : startAudioAnalysis}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: isAudioAnalyzing ? '#dc3545' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginRight: '10px'
                  }}
                >
                  {isAudioAnalyzing ? '🛑 Stop Audio Analysis' : '🎤 Start Audio Analysis'}
                </button>
              </div>

              {audioMetrics && (
                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '5px',
                  marginBottom: '20px'
                }}>
                  <h3>Live Audio Metrics</h3>
                  <div style={{ fontFamily: 'monospace' }}>
                    <div>Current Volume: {audioMetrics.currentVolume?.toFixed(1) || 0} dB</div>
                    <div>Peak Volume: {audioMetrics.peakVolume?.toFixed(1) || 0} dB</div>
                    <div>Average Volume: {audioMetrics.averageVolume?.toFixed(1) || 0} dB</div>
                  </div>
                </div>
              )}

              <div style={{ fontSize: '14px', color: '#666' }}>
                <h4>Testing Instructions:</h4>
                <ul>
                  <li>Click "Start Audio Analysis" and allow microphone access</li>
                  <li>Try making sudden loud noises (clap, shout, bang on desk)</li>
                  <li>Try high-pitched sounds (scream, whistle)</li>
                  <li>Watch for distress detection alerts in the results panel</li>
                </ul>
              </div>
            </div>
          )}

          {/* Speech Recognition Tab */}
          {activeTab === 'recognition' && (
            <div>
              <h2>Speech Recognition Testing</h2>
              
              <div style={{ marginBottom: '20px' }}>
                <button
                  onClick={isSpeechListening ? stopSpeechRecognition : startSpeechRecognition}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: isSpeechListening ? '#dc3545' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  {isSpeechListening ? '🛑 Stop Listening' : '🗣️ Start Speech Recognition'}
                </button>
              </div>

              <div style={{ fontSize: '14px', color: '#666' }}>
                <h4>Testing Instructions:</h4>
                <ul>
                  <li>Click "Start Speech Recognition" and allow microphone access</li>
                  <li>Speak distress phrases like "help me please" or "I'm scared"</li>
                  <li>Try normal phrases like "hello how are you"</li>
                  <li>Watch for real-time speech-to-text and distress detection</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div style={{ flex: 1 }}>
          <h2>🔍 Test Results</h2>
          <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #ddd',
            borderRadius: '5px',
            padding: '15px',
            height: '500px',
            overflowY: 'auto'
          }}>
            {testResults.length === 0 ? (
              <div style={{ color: '#666', textAlign: 'center', marginTop: '50px' }}>
                No test results yet.<br />
                Start testing to see results here.
              </div>
            ) : (
              testResults.map((result, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: result.isDistress ? '#fff3cd' : '#d1edff',
                    border: `1px solid ${result.isDistress ? '#ffeaa7' : '#bee5eb'}`,
                    borderRadius: '4px',
                    padding: '10px',
                    marginBottom: '10px',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    {result.type} - {result.timestamp}
                  </div>
                  <div><strong>Input:</strong> {result.input}</div>
                  <div><strong>Distress:</strong> {result.isDistress ? '🚨 YES' : '✅ NO'}</div>
                  <div><strong>Confidence:</strong> {result.confidence}%</div>
                  {result.phrases && result.phrases.length > 0 && (
                    <div><strong>Phrases:</strong> {result.phrases.join(', ')}</div>
                  )}
                  {result.sentiment && (
                    <div><strong>Sentiment:</strong> {result.sentiment}</div>
                  )}
                  {result.metrics && (
                    <div><strong>Audio:</strong> Peak: {result.metrics.peakVolume}dB</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};