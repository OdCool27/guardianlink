/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ErrorNotificationSystem } from '../components/ErrorNotificationSystem';
import { ManualSOSFallback } from '../components/ManualSOSFallback';
import { errorHandlingService, ErrorType } from '../services/ErrorHandlingService';
import { fallbackService, FallbackMode } from '../services/FallbackService';
import { diagnosticService } from '../services/DiagnosticService';

/**
 * Example integration of the complete error handling and recovery system
 * This demonstrates how all error handling components work together
 */
export const ErrorHandlingIntegrationExample: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<string>('Initializing...');
  const [errorStats, setErrorStats] = useState<any>(null);
  const [fallbackMode, setFallbackMode] = useState<FallbackMode>(FallbackMode.FULL_FUNCTIONALITY);

  useEffect(() => {
    // Monitor system status
    const updateStatus = () => {
      const stats = errorHandlingService.getErrorStats();
      const mode = fallbackService.getCurrentMode();
      
      setErrorStats(stats);
      setFallbackMode(mode);
      
      if (mode === FallbackMode.FULL_FUNCTIONALITY) {
        setSystemStatus('All systems operational');
      } else if (mode === FallbackMode.EMERGENCY_FALLBACK) {
        setSystemStatus('Critical system failure - Emergency mode');
      } else {
        setSystemStatus(`System degraded - ${mode.replace(/_/g, ' ')} mode`);
      }
    };

    // Update status every 5 seconds
    const interval = setInterval(updateStatus, 5000);
    updateStatus();

    // Listen for fallback changes
    fallbackService.onFallback((config) => {
      console.log('Fallback activated:', config);
      updateStatus();
    });

    fallbackService.onRecovery((mode) => {
      console.log('System recovered to:', mode);
      updateStatus();
    });

    return () => {
      clearInterval(interval);
    };
  }, []);

  const simulateError = (errorType: ErrorType) => {
    const errorMessages = {
      [ErrorType.PERMISSION_DENIED]: 'Microphone permission was denied by the user',
      [ErrorType.BROWSER_UNSUPPORTED]: 'Browser does not support required Web APIs',
      [ErrorType.MICROPHONE_UNAVAILABLE]: 'No microphone devices detected',
      [ErrorType.SPEECH_RECOGNITION_FAILED]: 'Speech recognition service encountered an error',
      [ErrorType.AUDIO_ANALYSIS_FAILED]: 'Audio analysis engine failed to initialize',
      [ErrorType.API_ERROR]: 'AI service API returned an error',
      [ErrorType.NETWORK_ERROR]: 'Network connection lost',
      [ErrorType.EMERGENCY_RESPONSE_FAILED]: 'Emergency response system is unavailable',
      [ErrorType.INITIALIZATION_FAILED]: 'System failed to initialize properly',
      [ErrorType.SERVICE_CRASHED]: 'A critical service has crashed',
      [ErrorType.VERIFICATION_TIMEOUT]: 'User verification timed out'
    };

    errorHandlingService.reportError(
      errorType,
      'demo-service',
      errorMessages[errorType],
      new Error(errorMessages[errorType]),
      {
        simulation: true,
        timestamp: new Date().toISOString()
      }
    );
  };

  const testFallbackScenario = (scenario: string) => {
    switch (scenario) {
      case 'speech_failure':
        fallbackService.testFallbackScenario('speech_failure');
        break;
      case 'audio_failure':
        fallbackService.testFallbackScenario('audio_failure');
        break;
      case 'api_failure':
        fallbackService.testFallbackScenario('api_failure');
        break;
      case 'microphone_failure':
        fallbackService.testFallbackScenario('microphone_failure');
        break;
      case 'emergency_failure':
        fallbackService.testFallbackScenario('emergency_failure');
        break;
      case 'reset':
        fallbackService.resetToHealthy();
        break;
    }
  };

  const exportDiagnostics = async () => {
    const diagnostics = await diagnosticService.collectDiagnostics();
    const report = diagnosticService.generateDiagnosticReport(diagnostics);
    
    console.log('=== DIAGNOSTIC REPORT ===');
    console.log(report);
    
    // Also download as file
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-handling-demo-diagnostics-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Error Handling & Recovery System Demo</h1>
      
      <div style={{ 
        background: '#f8f9fa', 
        padding: '16px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3>System Status</h3>
        <p><strong>Status:</strong> {systemStatus}</p>
        <p><strong>Fallback Mode:</strong> {fallbackMode.replace(/_/g, ' ').toUpperCase()}</p>
        {errorStats && (
          <p><strong>Total Errors:</strong> {errorStats.totalErrors}</p>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Simulate Errors</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button onClick={() => simulateError(ErrorType.PERMISSION_DENIED)}>
            Permission Denied
          </button>
          <button onClick={() => simulateError(ErrorType.BROWSER_UNSUPPORTED)}>
            Browser Unsupported
          </button>
          <button onClick={() => simulateError(ErrorType.MICROPHONE_UNAVAILABLE)}>
            Microphone Unavailable
          </button>
          <button onClick={() => simulateError(ErrorType.SPEECH_RECOGNITION_FAILED)}>
            Speech Recognition Failed
          </button>
          <button onClick={() => simulateError(ErrorType.AUDIO_ANALYSIS_FAILED)}>
            Audio Analysis Failed
          </button>
          <button onClick={() => simulateError(ErrorType.API_ERROR)}>
            API Error
          </button>
          <button onClick={() => simulateError(ErrorType.NETWORK_ERROR)}>
            Network Error
          </button>
          <button onClick={() => simulateError(ErrorType.EMERGENCY_RESPONSE_FAILED)}>
            Emergency Response Failed
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Test Fallback Scenarios</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button onClick={() => testFallbackScenario('speech_failure')}>
            Speech Failure
          </button>
          <button onClick={() => testFallbackScenario('audio_failure')}>
            Audio Failure
          </button>
          <button onClick={() => testFallbackScenario('api_failure')}>
            API Failure
          </button>
          <button onClick={() => testFallbackScenario('microphone_failure')}>
            Microphone Failure
          </button>
          <button onClick={() => testFallbackScenario('emergency_failure')}>
            Emergency Failure
          </button>
          <button 
            onClick={() => testFallbackScenario('reset')}
            style={{ background: '#28a745', color: 'white' }}
          >
            Reset to Healthy
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Diagnostics</h3>
        <button onClick={exportDiagnostics}>
          Export System Diagnostics
        </button>
      </div>

      <div style={{ 
        background: '#fff3cd', 
        padding: '16px', 
        borderRadius: '8px',
        border: '1px solid #ffeaa7'
      }}>
        <h4>Instructions</h4>
        <ul>
          <li>Click "Simulate Errors" to trigger different error types and see notifications</li>
          <li>Click "Test Fallback Scenarios" to see how the system degrades gracefully</li>
          <li>Error notifications will appear in the top-right corner</li>
          <li>Manual SOS fallback will appear at the bottom for critical failures</li>
          <li>Use the troubleshooting guide to resolve issues</li>
          <li>Export diagnostics to see detailed system information</li>
        </ul>
      </div>

      {/* Error handling components */}
      <ErrorNotificationSystem 
        maxNotifications={5}
        autoHideDelay={15000}
        showRecoveryActions={true}
      />
      
      <ManualSOSFallback 
        onSOSTrigger={() => {
          console.log('🚨 Manual SOS triggered from demo');
          alert('Manual SOS triggered! In a real app, this would contact emergency services.');
        }}
      />
    </div>
  );
};

export default ErrorHandlingIntegrationExample;