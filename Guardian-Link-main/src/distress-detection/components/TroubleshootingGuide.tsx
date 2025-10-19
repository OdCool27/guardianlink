/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ErrorType, DistressError, errorHandlingService } from '../services/ErrorHandlingService';
import { diagnosticService, SystemDiagnostics } from '../services/DiagnosticService';
import './TroubleshootingGuide.css';

interface TroubleshootingStep {
  title: string;
  description: string;
  action?: () => Promise<boolean>;
  actionLabel?: string;
  completed?: boolean;
}

interface TroubleshootingGuideProps {
  visible: boolean;
  onClose: () => void;
  errorType?: ErrorType;
}

/**
 * Interactive troubleshooting guide for distress detection issues
 * Requirements: 1.5, 3.5
 */
export const TroubleshootingGuide: React.FC<TroubleshootingGuideProps> = ({
  visible,
  onClose,
  errorType
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TroubleshootingStep[]>([]);
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostics | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (visible) {
      loadDiagnostics();
      generateTroubleshootingSteps();
    }
  }, [visible, errorType]);

  const loadDiagnostics = async () => {
    try {
      const diag = await diagnosticService.collectDiagnostics();
      setDiagnostics(diag);
    } catch (error) {
      console.error('Failed to load diagnostics:', error);
    }
  };

  const generateTroubleshootingSteps = () => {
    let troubleshootingSteps: TroubleshootingStep[] = [];

    switch (errorType) {
      case ErrorType.PERMISSION_DENIED:
        troubleshootingSteps = [
          {
            title: 'Check Browser Permissions',
            description: 'Ensure microphone access is allowed in your browser settings.',
            action: async () => {
              try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());
                return true;
              } catch (error) {
                return false;
              }
            },
            actionLabel: 'Request Permission'
          },
          {
            title: 'Check Browser Address Bar',
            description: 'Look for a microphone icon in the address bar and click it to allow access.'
          },
          {
            title: 'Check System Settings',
            description: 'Ensure your operating system allows browser access to the microphone.'
          },
          {
            title: 'Restart Browser',
            description: 'Close and reopen your browser, then try again.'
          }
        ];
        break;

      case ErrorType.MICROPHONE_UNAVAILABLE:
        troubleshootingSteps = [
          {
            title: 'Check Physical Connection',
            description: 'Ensure your microphone is properly connected to your device.'
          },
          {
            title: 'Test Microphone',
            description: 'Test if your microphone works in other applications.',
            action: async () => {
              try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioInputs = devices.filter(device => device.kind === 'audioinput');
                return audioInputs.length > 0;
              } catch (error) {
                return false;
              }
            },
            actionLabel: 'Check Devices'
          },
          {
            title: 'Check System Audio Settings',
            description: 'Verify microphone is enabled and set as default in system settings.'
          },
          {
            title: 'Try Different Microphone',
            description: 'If available, try connecting a different microphone or headset.'
          }
        ];
        break;

      case ErrorType.BROWSER_UNSUPPORTED:
        troubleshootingSteps = [
          {
            title: 'Update Your Browser',
            description: 'Ensure you\'re using the latest version of your browser.',
            action: async () => {
              // Check if features are supported after potential update
              const speechSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
              const audioSupported = 'AudioContext' in window || 'webkitAudioContext' in window;
              return speechSupported && audioSupported;
            },
            actionLabel: 'Check Support'
          },
          {
            title: 'Switch to Supported Browser',
            description: 'Use Chrome, Firefox, Safari, or Edge for the best experience.'
          },
          {
            title: 'Enable Experimental Features',
            description: 'In Chrome, go to chrome://flags and enable experimental web platform features.'
          }
        ];
        break;

      case ErrorType.SPEECH_RECOGNITION_FAILED:
        troubleshootingSteps = [
          {
            title: 'Check Microphone Quality',
            description: 'Ensure your microphone is working and not muted.',
            action: async () => {
              try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const source = audioContext.createMediaStreamSource(stream);
                const analyzer = audioContext.createAnalyser();
                source.connect(analyzer);
                
                // Check for audio input
                const dataArray = new Uint8Array(analyzer.frequencyBinCount);
                analyzer.getByteFrequencyData(dataArray);
                const hasAudio = dataArray.some(value => value > 0);
                
                stream.getTracks().forEach(track => track.stop());
                audioContext.close();
                
                return hasAudio;
              } catch (error) {
                return false;
              }
            },
            actionLabel: 'Test Audio Input'
          },
          {
            title: 'Check Language Settings',
            description: 'Ensure speech recognition is set to your preferred language.'
          },
          {
            title: 'Reduce Background Noise',
            description: 'Move to a quieter environment or use noise-canceling headphones.'
          },
          {
            title: 'Speak Clearly',
            description: 'Speak clearly and at a normal volume for better recognition.'
          }
        ];
        break;

      case ErrorType.AUDIO_ANALYSIS_FAILED:
        troubleshootingSteps = [
          {
            title: 'Check Audio Context',
            description: 'Verify Web Audio API is working properly.',
            action: async () => {
              try {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const success = audioContext.state === 'running' || audioContext.state === 'suspended';
                audioContext.close();
                return success;
              } catch (error) {
                return false;
              }
            },
            actionLabel: 'Test Audio Context'
          },
          {
            title: 'Check Browser Resources',
            description: 'Close other tabs or applications that might be using audio resources.'
          },
          {
            title: 'Restart Audio Services',
            description: 'Try refreshing the page to restart audio processing.'
          }
        ];
        break;

      case ErrorType.NETWORK_ERROR:
        troubleshootingSteps = [
          {
            title: 'Check Internet Connection',
            description: 'Verify you have a stable internet connection.',
            action: async () => {
              try {
                const response = await fetch('https://www.google.com/favicon.ico', { 
                  method: 'HEAD',
                  mode: 'no-cors'
                });
                return true;
              } catch (error) {
                return navigator.onLine;
              }
            },
            actionLabel: 'Test Connection'
          },
          {
            title: 'Check Firewall Settings',
            description: 'Ensure your firewall isn\'t blocking the application.'
          },
          {
            title: 'Try Different Network',
            description: 'Switch to a different WiFi network or use mobile data.'
          }
        ];
        break;

      default:
        troubleshootingSteps = [
          {
            title: 'Run System Diagnostics',
            description: 'Check overall system health and identify issues.',
            action: async () => {
              const healthCheck = await diagnosticService.runHealthCheck();
              return healthCheck.overall === 'healthy';
            },
            actionLabel: 'Run Diagnostics'
          },
          {
            title: 'Refresh the Page',
            description: 'Try refreshing the page to restart all services.'
          },
          {
            title: 'Clear Browser Cache',
            description: 'Clear your browser cache and cookies, then try again.'
          },
          {
            title: 'Contact Support',
            description: 'If issues persist, contact technical support with diagnostic information.'
          }
        ];
    }

    setSteps(troubleshootingSteps);
    setCurrentStep(0);
  };

  const executeStep = async (stepIndex: number) => {
    const step = steps[stepIndex];
    if (!step.action) return;

    setLoading(true);
    try {
      const result = await step.action();
      setTestResults(prev => ({ ...prev, [stepIndex]: result }));
      
      // Mark step as completed
      const updatedSteps = [...steps];
      updatedSteps[stepIndex] = { ...step, completed: result };
      setSteps(updatedSteps);
      
      if (result) {
        // Success - move to next step or finish
        if (stepIndex < steps.length - 1) {
          setCurrentStep(stepIndex + 1);
        }
      }
    } catch (error) {
      console.error('Step execution failed:', error);
      setTestResults(prev => ({ ...prev, [stepIndex]: false }));
    } finally {
      setLoading(false);
    }
  };

  const exportDiagnostics = () => {
    const report = diagnosticService.generateDiagnosticReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `distress-detection-diagnostics-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="troubleshooting-guide-overlay">
      <div className="troubleshooting-guide">
        <div className="guide-header">
          <h2>Troubleshooting Guide</h2>
          <button className="close-button" onClick={onClose} aria-label="Close guide">
            ×
          </button>
        </div>

        <div className="guide-content">
          {errorType && (
            <div className="error-info">
              <h3>Issue: {errorType.replace(/_/g, ' ').toUpperCase()}</h3>
              <p>Follow these steps to resolve the issue:</p>
            </div>
          )}

          <div className="steps-container">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`troubleshooting-step ${
                  index === currentStep ? 'active' : ''
                } ${step.completed ? 'completed' : ''} ${
                  testResults[index] === false ? 'failed' : ''
                }`}
              >
                <div className="step-header">
                  <div className="step-number">
                    {step.completed ? '✓' : index + 1}
                  </div>
                  <h4>{step.title}</h4>
                </div>

                <p className="step-description">{step.description}</p>

                {step.action && (
                  <button
                    className="step-action"
                    onClick={() => executeStep(index)}
                    disabled={loading}
                  >
                    {loading && index === currentStep ? 'Testing...' : step.actionLabel}
                  </button>
                )}

                {testResults[index] !== undefined && (
                  <div className={`step-result ${testResults[index] ? 'success' : 'failure'}`}>
                    {testResults[index] ? '✓ Test passed' : '✗ Test failed'}
                  </div>
                )}
              </div>
            ))}
          </div>

          {diagnostics && (
            <div className="diagnostics-section">
              <h3>System Information</h3>
              <div className="diagnostic-summary">
                <div className="diagnostic-item">
                  <strong>Browser:</strong> {diagnostics.browser.userAgent.split(' ')[0]}
                </div>
                <div className="diagnostic-item">
                  <strong>Speech Recognition:</strong> {
                    diagnostics.browser.speechRecognitionSupported ? 'Supported' : 'Not Supported'
                  }
                </div>
                <div className="diagnostic-item">
                  <strong>Web Audio:</strong> {
                    diagnostics.browser.webAudioSupported ? 'Supported' : 'Not Supported'
                  }
                </div>
                <div className="diagnostic-item">
                  <strong>Microphone Permission:</strong> {diagnostics.permissions.microphone}
                </div>
                <div className="diagnostic-item">
                  <strong>Audio Devices:</strong> {diagnostics.audioCapabilities.inputDevices.length} input(s)
                </div>
              </div>

              <button className="export-button" onClick={exportDiagnostics}>
                Export Full Diagnostics
              </button>
            </div>
          )}
        </div>

        <div className="guide-footer">
          <p>
            If you continue to experience issues, please export the diagnostics and contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TroubleshootingGuide;