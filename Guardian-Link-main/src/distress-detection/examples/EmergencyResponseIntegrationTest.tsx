/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { emergencyResponseHandler } from '../services/EmergencyResponseHandler';
import { DistressContext, DistressEvent } from '../types';

/**
 * Integration test component for emergency response system
 * Tests the complete flow from distress detection to SOS activation
 */
export const EmergencyResponseIntegrationTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (testName: string, success: boolean, details: any) => {
    setTestResults(prev => [...prev, {
      testName,
      success,
      details,
      timestamp: new Date()
    }]);
  };

  const runIntegrationTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      // Test 1: Basic SOS Trigger
      await testBasicSOSTrigger();
      
      // Test 2: Event Logging
      await testEventLogging();
      
      // Test 3: Emergency Session Management
      await testEmergencySessionManagement();
      
      // Test 4: Multiple Detection Methods
      await testMultipleDetectionMethods();
      
      // Test 5: Error Handling
      await testErrorHandling();

    } catch (error) {
      addTestResult('Integration Test Suite', false, { error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  const testBasicSOSTrigger = async () => {
    try {
      const testContext: DistressContext = {
        detectionMethod: 'speech',
        confidence: 85,
        timestamp: new Date(),
        transcript: 'help me please'
      };

      await emergencyResponseHandler.triggerSOS(testContext);
      
      const isActive = emergencyResponseHandler.isEmergencyActive();
      const session = emergencyResponseHandler.getCurrentEmergencySession();

      addTestResult('Basic SOS Trigger', isActive && session !== null, {
        isActive,
        sessionId: session?.sessionId,
        context: testContext
      });

      // Clean up
      emergencyResponseHandler.endEmergencySession();

    } catch (error) {
      addTestResult('Basic SOS Trigger', false, { error: error.message });
    }
  };

  const testEventLogging = async () => {
    try {
      const testEvent: DistressEvent = {
        id: `test-${Date.now()}`,
        timestamp: new Date(),
        detectionMethod: 'audio',
        confidence: 92,
        userResponse: 'confirmed',
        sosTriggered: true,
        audioMetrics: {
          peakVolume: 95,
          duration: 2.5,
          frequencyProfile: [120, 250, 180]
        }
      };

      // Log the event
      emergencyResponseHandler.logDistressEvent(testEvent);

      // Check if it was logged
      const stats = emergencyResponseHandler.getEmergencyStats();
      
      addTestResult('Event Logging', stats.totalEvents > 0, {
        totalEvents: stats.totalEvents,
        eventId: testEvent.id
      });

    } catch (error) {
      addTestResult('Event Logging', false, { error: error.message });
    }
  };

  const testEmergencySessionManagement = async () => {
    try {
      // Start emergency
      const testContext: DistressContext = {
        detectionMethod: 'combined',
        confidence: 95,
        timestamp: new Date(),
        transcript: 'someone help me'
      };

      await emergencyResponseHandler.triggerSOS(testContext);
      
      const isActiveAfterStart = emergencyResponseHandler.isEmergencyActive();
      const sessionAfterStart = emergencyResponseHandler.getCurrentEmergencySession();

      // End emergency
      emergencyResponseHandler.endEmergencySession();
      
      const isActiveAfterEnd = emergencyResponseHandler.isEmergencyActive();
      const sessionAfterEnd = emergencyResponseHandler.getCurrentEmergencySession();

      const success = isActiveAfterStart && !isActiveAfterEnd && 
                     sessionAfterStart !== null && sessionAfterEnd === null;

      addTestResult('Emergency Session Management', success, {
        isActiveAfterStart,
        isActiveAfterEnd,
        hadSessionAfterStart: sessionAfterStart !== null,
        hasSessionAfterEnd: sessionAfterEnd !== null
      });

    } catch (error) {
      addTestResult('Emergency Session Management', false, { error: error.message });
    }
  };

  const testMultipleDetectionMethods = async () => {
    try {
      const methods: Array<'speech' | 'audio' | 'combined'> = ['speech', 'audio', 'combined'];
      const results: any[] = [];

      for (const method of methods) {
        const testContext: DistressContext = {
          detectionMethod: method,
          confidence: 80 + Math.random() * 20,
          timestamp: new Date(),
          transcript: method === 'speech' || method === 'combined' ? 'help me' : undefined,
          audioMetrics: method === 'audio' || method === 'combined' ? {
            peakVolume: 90,
            duration: 1.5,
            frequencyProfile: [100, 200, 150]
          } : undefined
        };

        try {
          await emergencyResponseHandler.triggerSOS(testContext);
          const session = emergencyResponseHandler.getCurrentEmergencySession();
          
          results.push({
            method,
            success: true,
            sessionId: session?.sessionId
          });

          emergencyResponseHandler.endEmergencySession();
          
        } catch (error) {
          results.push({
            method,
            success: false,
            error: error.message
          });
        }
      }

      const allSuccessful = results.every(r => r.success);
      
      addTestResult('Multiple Detection Methods', allSuccessful, { results });

    } catch (error) {
      addTestResult('Multiple Detection Methods', false, { error: error.message });
    }
  };

  const testErrorHandling = async () => {
    try {
      // Test with invalid context
      const invalidContext = {
        detectionMethod: 'invalid' as any,
        confidence: -1,
        timestamp: new Date()
      };

      let errorCaught = false;
      try {
        await emergencyResponseHandler.triggerSOS(invalidContext);
      } catch (error) {
        errorCaught = true;
      }

      // Test event callback error handling
      let callbackErrorHandled = false;
      const errorCallback = () => {
        throw new Error('Test callback error');
      };

      emergencyResponseHandler.onEmergencyEvent(errorCallback);
      
      try {
        const validContext: DistressContext = {
          detectionMethod: 'speech',
          confidence: 85,
          timestamp: new Date(),
          transcript: 'test'
        };
        
        await emergencyResponseHandler.triggerSOS(validContext);
        callbackErrorHandled = true; // If we get here, error was handled gracefully
        emergencyResponseHandler.endEmergencySession();
        
      } catch (error) {
        // Callback error should not propagate
      }

      emergencyResponseHandler.offEmergencyEvent(errorCallback);

      addTestResult('Error Handling', errorCaught && callbackErrorHandled, {
        invalidContextErrorCaught: errorCaught,
        callbackErrorHandled
      });

    } catch (error) {
      addTestResult('Error Handling', false, { error: error.message });
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const exportTestResults = () => {
    const results = {
      timestamp: new Date().toISOString(),
      tests: testResults,
      summary: {
        total: testResults.length,
        passed: testResults.filter(r => r.success).length,
        failed: testResults.filter(r => !r.success).length
      }
    };

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emergency-response-test-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const passedTests = testResults.filter(r => r.success).length;
  const totalTests = testResults.length;

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h2>🧪 Emergency Response Integration Tests</h2>
      
      {/* Test Controls */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runIntegrationTests}
          disabled={isRunning}
          style={{
            padding: '12px 20px',
            backgroundColor: isRunning ? '#ccc' : '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {isRunning ? '🔄 Running Tests...' : '▶️ Run Integration Tests'}
        </button>
        
        <button 
          onClick={clearTestResults}
          disabled={isRunning || testResults.length === 0}
          style={{
            padding: '12px 20px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: (isRunning || testResults.length === 0) ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          🗑️ Clear Results
        </button>

        {testResults.length > 0 && (
          <button 
            onClick={exportTestResults}
            style={{
              padding: '12px 20px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            📥 Export Results
          </button>
        )}
      </div>

      {/* Test Summary */}
      {testResults.length > 0 && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          backgroundColor: passedTests === totalTests ? '#e8f5e8' : '#ffebee',
          border: `2px solid ${passedTests === totalTests ? '#4caf50' : '#f44336'}`,
          borderRadius: '8px'
        }}>
          <h3>Test Summary</h3>
          <p>
            <strong>Passed:</strong> {passedTests} / {totalTests} 
            ({totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%)
          </p>
          <p>
            <strong>Status:</strong> {passedTests === totalTests ? '✅ All Tests Passed' : '❌ Some Tests Failed'}
          </p>
        </div>
      )}

      {/* Test Results */}
      <div>
        <h3>Test Results</h3>
        {testResults.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            No test results yet. Click "Run Integration Tests" to start testing.
          </p>
        ) : (
          <div>
            {testResults.map((result, index) => (
              <div 
                key={index}
                style={{
                  padding: '15px',
                  marginBottom: '10px',
                  backgroundColor: result.success ? '#f1f8e9' : '#ffebee',
                  border: `1px solid ${result.success ? '#4caf50' : '#f44336'}`,
                  borderRadius: '5px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0 }}>
                    {result.success ? '✅' : '❌'} {result.testName}
                  </h4>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    {result.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                
                <div style={{ 
                  marginTop: '10px', 
                  padding: '10px', 
                  backgroundColor: '#f9f9f9', 
                  borderRadius: '3px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  <pre>{JSON.stringify(result.details, null, 2)}</pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test Descriptions */}
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <h4>📋 Test Descriptions</h4>
        <ul>
          <li><strong>Basic SOS Trigger:</strong> Tests if SOS can be triggered with distress context and creates an active session</li>
          <li><strong>Event Logging:</strong> Verifies that distress events are properly logged and stored</li>
          <li><strong>Emergency Session Management:</strong> Tests starting and ending emergency sessions</li>
          <li><strong>Multiple Detection Methods:</strong> Tests SOS triggering with different detection methods (speech, audio, combined)</li>
          <li><strong>Error Handling:</strong> Tests system behavior with invalid inputs and callback errors</li>
        </ul>
      </div>
    </div>
  );
};

export default EmergencyResponseIntegrationTest;