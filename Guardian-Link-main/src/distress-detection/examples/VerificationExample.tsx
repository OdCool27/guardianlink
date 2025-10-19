/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { VerificationDialog } from '../components/VerificationDialog';
import { VerificationService } from '../services/VerificationService';
import { DistressContext, VerificationResult } from '../types';

/**
 * Example component demonstrating verification dialog and service integration
 * Shows how to handle distress detection verification flow
 */
export const VerificationExample: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentContext, setCurrentContext] = useState<DistressContext | null>(null);
  const [verificationLog, setVerificationLog] = useState<string[]>([]);
  const [timeoutSeconds, setTimeoutSeconds] = useState(10);
  const verificationServiceRef = useRef(new VerificationService());

  useEffect(() => {
    // Load persisted event log on mount
    verificationServiceRef.current.loadPersistedEventLog();
  }, []);

  const addLogEntry = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setVerificationLog(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
  };

  const simulateDistressDetection = (method: 'speech' | 'audio' | 'combined') => {
    const confidence = Math.floor(Math.random() * 30) + 70; // 70-100%
    
    const context: DistressContext = {
      detectionMethod: method,
      confidence,
      timestamp: new Date(),
      transcript: method === 'speech' || method === 'combined' 
        ? 'Help me please, I need assistance!' 
        : undefined,
      audioData: method === 'audio' || method === 'combined' 
        ? new Blob(['mock audio data'], { type: 'audio/wav' }) 
        : undefined
    };

    setCurrentContext(context);
    setIsDialogOpen(true);

    addLogEntry(`Distress detected via ${method} (${confidence}% confidence)`);

    // Start verification service
    verificationServiceRef.current.startVerification(
      context,
      timeoutSeconds,
      handleVerificationResult,
      handleVerificationTimeout
    );
  };

  const handleVerificationResult = (result: VerificationResult, shouldTriggerSOS: boolean) => {
    setIsDialogOpen(false);
    
    const action = result.action;
    addLogEntry(`User response: ${action.toUpperCase()}`);
    
    if (shouldTriggerSOS) {
      addLogEntry('🚨 SOS TRIGGERED - Emergency services contacted');
      // In real implementation, this would call the emergency response handler
      simulateSOSActivation();
    } else {
      addLogEntry('✅ Alert dismissed - Continuing monitoring');
    }

    setCurrentContext(null);
  };

  const handleVerificationTimeout = (context: DistressContext) => {
    addLogEntry('⏰ Verification timed out - Auto-triggering SOS');
    addLogEntry('🚨 SOS TRIGGERED - Emergency services contacted');
    simulateSOSActivation();
  };

  const simulateSOSActivation = () => {
    // Simulate SOS activation delay
    setTimeout(() => {
      addLogEntry('📱 SMS sent to emergency contacts');
      addLogEntry('📧 Email alerts dispatched');
      addLogEntry('📍 Location sharing activated');
    }, 1000);
  };

  const getStatistics = () => {
    return verificationServiceRef.current.getStatistics();
  };

  const clearLog = () => {
    setVerificationLog([]);
    verificationServiceRef.current.clearEventLog();
    addLogEntry('Event log cleared');
  };

  const stats = getStatistics();

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <h1 style={{ color: '#333', marginBottom: '2rem' }}>
        🚨 Distress Verification System Demo
      </h1>

      {/* Controls */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#495057' }}>
          Simulation Controls
        </h3>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Verification Timeout (seconds):
          </label>
          <input
            type="number"
            min="5"
            max="60"
            value={timeoutSeconds}
            onChange={(e) => setTimeoutSeconds(parseInt(e.target.value) || 10)}
            style={{
              padding: '0.5rem',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              width: '100px'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => simulateDistressDetection('speech')}
            disabled={isDialogOpen}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isDialogOpen ? 'not-allowed' : 'pointer',
              opacity: isDialogOpen ? 0.6 : 1
            }}
          >
            🎤 Simulate Speech Detection
          </button>
          
          <button
            onClick={() => simulateDistressDetection('audio')}
            disabled={isDialogOpen}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isDialogOpen ? 'not-allowed' : 'pointer',
              opacity: isDialogOpen ? 0.6 : 1
            }}
          >
            🔊 Simulate Audio Detection
          </button>
          
          <button
            onClick={() => simulateDistressDetection('combined')}
            disabled={isDialogOpen}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isDialogOpen ? 'not-allowed' : 'pointer',
              opacity: isDialogOpen ? 0.6 : 1
            }}
          >
            🎯 Simulate Combined Detection
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div style={{
        backgroundColor: '#e7f3ff',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        border: '1px solid #b3d9ff'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#0056b3' }}>
          📊 Verification Statistics
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0056b3' }}>
              {stats.totalVerifications}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#495057' }}>Total Verifications</div>
          </div>
          
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc3545' }}>
              {stats.confirmedDistress}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#495057' }}>Confirmed Distress</div>
          </div>
          
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
              {stats.dismissedAlerts}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#495057' }}>Dismissed Alerts</div>
          </div>
          
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffc107' }}>
              {stats.timeouts}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#495057' }}>Timeouts</div>
          </div>
          
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6f42c1' }}>
              {Math.round(stats.averageResponseTime)}ms
            </div>
            <div style={{ fontSize: '0.9rem', color: '#495057' }}>Avg Response Time</div>
          </div>
          
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fd7e14' }}>
              {Math.round(stats.falsePositiveRate)}%
            </div>
            <div style={{ fontSize: '0.9rem', color: '#495057' }}>False Positive Rate</div>
          </div>
        </div>
      </div>

      {/* Event Log */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '12px',
        border: '1px solid #e9ecef'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h3 style={{ margin: 0, color: '#495057' }}>
            📝 Event Log
          </h3>
          <button
            onClick={clearLog}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Clear Log
          </button>
        </div>
        
        <div style={{
          backgroundColor: '#000',
          color: '#00ff00',
          padding: '1rem',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          height: '200px',
          overflowY: 'auto',
          border: '2px solid #333'
        }}>
          {verificationLog.length === 0 ? (
            <div style={{ color: '#666' }}>No events logged yet...</div>
          ) : (
            verificationLog.map((entry, index) => (
              <div key={index} style={{ marginBottom: '0.25rem' }}>
                {entry}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Verification Dialog */}
      {isDialogOpen && currentContext && (
        <VerificationDialog
          isOpen={isDialogOpen}
          detectionSource={`${currentContext.detectionMethod} detection`}
          confidence={currentContext.confidence}
          timeoutSeconds={timeoutSeconds}
          onResult={handleVerificationResult}
        />
      )}

      {/* Instructions */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        fontSize: '0.9rem',
        color: '#856404'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>How to test:</h4>
        <ol style={{ margin: 0, paddingLeft: '1.5rem' }}>
          <li>Click one of the simulation buttons to trigger a distress detection</li>
          <li>The verification dialog will appear with a countdown timer</li>
          <li>You can either respond or let it timeout to see different behaviors</li>
          <li>Watch the event log and statistics update in real-time</li>
          <li>Try different timeout values to see how it affects the user experience</li>
        </ol>
      </div>
    </div>
  );
};