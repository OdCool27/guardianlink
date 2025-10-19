/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { emergencyResponseHandler } from '../services/EmergencyResponseHandler';
import { EmergencyEvent } from '../interfaces/EmergencyResponseHandler';
import { DistressContext, DistressEvent } from '../types';

/**
 * Example component demonstrating emergency response system integration
 * Shows how to use the EmergencyResponseHandler service
 */
export const EmergencyResponseExample: React.FC = () => {
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [emergencyEvents, setEmergencyEvents] = useState<EmergencyEvent[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Set up emergency event listener
    const handleEmergencyEvent = (event: EmergencyEvent) => {
      setEmergencyEvents(prev => [...prev.slice(-9), event]); // Keep last 10 events
      
      // Update session state based on event type
      if (event.type === 'sos_triggered') {
        setIsEmergencyActive(true);
        setCurrentSession(emergencyResponseHandler.getCurrentEmergencySession());
      } else if (event.type === 'emergency_ended') {
        setIsEmergencyActive(false);
        setCurrentSession(null);
      }
    };

    emergencyResponseHandler.onEmergencyEvent(handleEmergencyEvent);

    // Initial state check
    setIsEmergencyActive(emergencyResponseHandler.isEmergencyActive());
    setCurrentSession(emergencyResponseHandler.getCurrentEmergencySession());
    setStats(emergencyResponseHandler.getEmergencyStats());

    return () => {
      emergencyResponseHandler.offEmergencyEvent(handleEmergencyEvent);
    };
  }, []);

  const handleTestDistressTrigger = async () => {
    try {
      const testContext: DistressContext = {
        detectionMethod: 'speech',
        confidence: 85,
        timestamp: new Date(),
        transcript: 'help me please',
        audioData: undefined
      };

      await emergencyResponseHandler.triggerSOS(testContext);
      
      // Log a test event
      const testEvent: DistressEvent = {
        id: `test-${Date.now()}`,
        timestamp: new Date(),
        detectionMethod: 'speech',
        confidence: 85,
        transcript: 'help me please',
        userResponse: 'confirmed',
        sosTriggered: true,
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10
        }
      };

      emergencyResponseHandler.logDistressEvent(testEvent);
      
    } catch (error) {
      console.error('Failed to trigger test emergency:', error);
      alert(`Failed to trigger emergency: ${error.message}`);
    }
  };

  const handleTestAudioDistress = async () => {
    try {
      const testContext: DistressContext = {
        detectionMethod: 'audio',
        confidence: 92,
        timestamp: new Date(),
        audioData: undefined,
        audioMetrics: {
          peakVolume: 95,
          duration: 2.5,
          frequencyProfile: [120, 250, 180, 300, 220]
        }
      };

      await emergencyResponseHandler.triggerSOS(testContext);
      
    } catch (error) {
      console.error('Failed to trigger audio emergency:', error);
      alert(`Failed to trigger emergency: ${error.message}`);
    }
  };

  const handleEndEmergency = () => {
    emergencyResponseHandler.endEmergencySession();
    setStats(emergencyResponseHandler.getEmergencyStats());
  };

  const handleClearLogs = () => {
    emergencyResponseHandler.clearEventLogs();
    setStats(emergencyResponseHandler.getEmergencyStats());
  };

  const refreshStats = () => {
    setStats(emergencyResponseHandler.getEmergencyStats());
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🚨 Emergency Response System Example</h2>
      
      {/* Current Status */}
      <div style={{ 
        padding: '15px', 
        marginBottom: '20px', 
        backgroundColor: isEmergencyActive ? '#ffebee' : '#e8f5e8',
        border: `2px solid ${isEmergencyActive ? '#f44336' : '#4caf50'}`,
        borderRadius: '8px'
      }}>
        <h3>Current Status</h3>
        <p><strong>Emergency Active:</strong> {isEmergencyActive ? '🚨 YES' : '✅ NO'}</p>
        {currentSession && (
          <div>
            <p><strong>Session ID:</strong> {currentSession.sessionId}</p>
            <p><strong>Started:</strong> {currentSession.startTime?.toLocaleString()}</p>
            <p><strong>Detection Method:</strong> {currentSession.context?.detectionMethod}</p>
            <p><strong>Confidence:</strong> {currentSession.context?.confidence}%</p>
          </div>
        )}
      </div>

      {/* Test Controls */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Test Emergency Response</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleTestDistressTrigger}
            disabled={isEmergencyActive}
            style={{
              padding: '10px 15px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isEmergencyActive ? 'not-allowed' : 'pointer',
              opacity: isEmergencyActive ? 0.5 : 1
            }}
          >
            🗣️ Test Speech Distress
          </button>
          
          <button 
            onClick={handleTestAudioDistress}
            disabled={isEmergencyActive}
            style={{
              padding: '10px 15px',
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isEmergencyActive ? 'not-allowed' : 'pointer',
              opacity: isEmergencyActive ? 0.5 : 1
            }}
          >
            🔊 Test Audio Distress
          </button>
          
          {isEmergencyActive && (
            <button 
              onClick={handleEndEmergency}
              style={{
                padding: '10px 15px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              ✅ End Emergency
            </button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Emergency Statistics</h3>
        <button 
          onClick={refreshStats}
          style={{
            padding: '5px 10px',
            marginBottom: '10px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh Stats
        </button>
        
        {stats && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '5px',
            fontFamily: 'monospace'
          }}>
            <p>Total Events: {stats.totalEvents}</p>
            <p>SOS Triggered: {stats.sosTriggered}</p>
            <p>False Positives: {stats.falsePositives}</p>
            <p>Last Event: {stats.lastEvent?.toLocaleString() || 'None'}</p>
          </div>
        )}
        
        <button 
          onClick={handleClearLogs}
          style={{
            padding: '5px 10px',
            marginTop: '10px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          🗑️ Clear Event Logs
        </button>
      </div>

      {/* Recent Emergency Events */}
      <div>
        <h3>Recent Emergency Events</h3>
        {emergencyEvents.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No emergency events yet</p>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {emergencyEvents.map((event, index) => (
              <div 
                key={index}
                style={{
                  padding: '10px',
                  marginBottom: '10px',
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{getEventIcon(event.type)} {event.type.replace('_', ' ').toUpperCase()}</strong>
                  <span style={{ color: '#666', fontSize: '12px' }}>
                    {event.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ marginTop: '5px', fontSize: '12px', color: '#555' }}>
                  Method: {event.context.detectionMethod} | 
                  Confidence: {event.context.confidence}%
                  {event.context.transcript && ` | "${event.context.transcript}"`}
                </div>
                {event.details && (
                  <div style={{ marginTop: '5px', fontSize: '11px', color: '#777' }}>
                    {JSON.stringify(event.details, null, 2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <h4>💡 How to Use</h4>
        <ol>
          <li>Click "Test Speech Distress" to simulate a voice-based distress detection</li>
          <li>Click "Test Audio Distress" to simulate an audio pattern-based detection</li>
          <li>Watch the emergency events appear in real-time</li>
          <li>Use "End Emergency" to stop an active emergency session</li>
          <li>Check statistics to see detection metrics</li>
          <li>Clear logs to reset the event history</li>
        </ol>
        <p><strong>Note:</strong> This is a demonstration. In a real scenario, the system would automatically detect distress and trigger emergency protocols.</p>
      </div>
    </div>
  );
};

function getEventIcon(eventType: string): string {
  switch (eventType) {
    case 'sos_triggered': return '🚨';
    case 'contacts_notified': return '📧';
    case 'location_shared': return '📍';
    case 'emergency_ended': return '✅';
    default: return '📋';
  }
}

export default EmergencyResponseExample;