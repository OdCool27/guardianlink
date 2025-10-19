/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { AudioAnalysisService } from '../services/AudioAnalysisService';
import { AudioMetrics } from '../interfaces/AudioAnalysisEngine';

/**
 * Example component demonstrating audio analysis functionality
 */
export const AudioAnalysisExample: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [metrics, setMetrics] = useState<AudioMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectionLog, setDetectionLog] = useState<string[]>([]);
  
  const audioServiceRef = useRef<AudioAnalysisService | null>(null);
  
  const startAnalysis = async () => {
    try {
      setError(null);
      
      // Create and initialize audio service
      audioServiceRef.current = new AudioAnalysisService();
      
      // Set up callbacks
      audioServiceRef.current.onDistressDetected((confidence, audioMetrics) => {
        const logEntry = `Distress detected: ${(confidence * 100).toFixed(1)}% confidence at ${new Date().toLocaleTimeString()}`;
        setDetectionLog(prev => [...prev.slice(-9), logEntry]); // Keep last 10 entries
        console.log('Distress detection:', { confidence, audioMetrics });
      });
      
      audioServiceRef.current.onError((err) => {
        setError(err.message);
        console.error('Audio analysis error:', err);
      });
      
      // Initialize and start
      await audioServiceRef.current.initialize();
      audioServiceRef.current.startAnalysis();
      
      setIsAnalyzing(true);
      
      // Update metrics periodically
      const metricsInterval = setInterval(() => {
        if (audioServiceRef.current) {
          setMetrics(audioServiceRef.current.getCurrentMetrics());
        }
      }, 100);
      
      // Store interval for cleanup
      (audioServiceRef.current as any).metricsInterval = metricsInterval;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start audio analysis');
    }
  };
  
  const stopAnalysis = () => {
    if (audioServiceRef.current) {
      // Clear metrics interval
      if ((audioServiceRef.current as any).metricsInterval) {
        clearInterval((audioServiceRef.current as any).metricsInterval);
      }
      
      audioServiceRef.current.destroy();
      audioServiceRef.current = null;
    }
    
    setIsAnalyzing(false);
    setMetrics(null);
  };
  
  const updateSettings = () => {
    if (audioServiceRef.current) {
      audioServiceRef.current.updateSettings({
        volumeThreshold: 15, // Lower threshold for testing
        spikeDetection: true,
        frequencyAnalysis: true,
        sensitivity: 80
      });
    }
  };
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Audio Analysis Engine Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={startAnalysis} 
          disabled={isAnalyzing}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: isAnalyzing ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Start Analysis
        </button>
        
        <button 
          onClick={stopAnalysis} 
          disabled={!isAnalyzing}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: !isAnalyzing ? '#ccc' : '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Stop Analysis
        </button>
        
        <button 
          onClick={updateSettings} 
          disabled={!isAnalyzing}
          style={{ 
            padding: '10px 20px',
            backgroundColor: !isAnalyzing ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Update Settings (Test Mode)
        </button>
      </div>
      
      {error && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          Error: {error}
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <h3>Current Audio Metrics</h3>
          {metrics ? (
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '15px', 
              borderRadius: '4px',
              fontFamily: 'monospace'
            }}>
              <div>Current Volume: {metrics.currentVolume.toFixed(2)} dB</div>
              <div>Peak Volume: {metrics.peakVolume.toFixed(2)} dB</div>
              <div>Average Volume: {metrics.averageVolume.toFixed(2)} dB</div>
              <div>Timestamp: {metrics.timestamp.toLocaleTimeString()}</div>
              <div>Frequency Data Length: {metrics.frequencyData.length}</div>
            </div>
          ) : (
            <div style={{ color: '#6c757d' }}>
              {isAnalyzing ? 'Loading metrics...' : 'Start analysis to see metrics'}
            </div>
          )}
        </div>
        
        <div style={{ flex: 1 }}>
          <h3>Distress Detection Log</h3>
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '4px',
            height: '200px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '12px'
          }}>
            {detectionLog.length > 0 ? (
              detectionLog.map((entry, index) => (
                <div key={index} style={{ marginBottom: '5px' }}>
                  {entry}
                </div>
              ))
            ) : (
              <div style={{ color: '#6c757d' }}>
                No distress detected yet. Try making loud noises or speaking distress phrases.
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#6c757d' }}>
        <h4>Testing Instructions:</h4>
        <ul>
          <li>Click "Start Analysis" to begin audio monitoring</li>
          <li>Try making sudden loud noises to trigger volume spike detection</li>
          <li>Try speaking in a high-pitched voice to trigger screaming pattern detection</li>
          <li>Click "Update Settings" to use more sensitive thresholds for testing</li>
          <li>Watch the detection log for distress alerts</li>
        </ul>
      </div>
    </div>
  );
};