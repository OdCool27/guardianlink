/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AudioAnalysisService } from '../services/AudioAnalysisService';

/**
 * Example component demonstrating performance optimization features
 */
export const PerformanceOptimizationExample: React.FC = () => {
  const [audioService] = useState(() => new AudioAnalysisService());
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [memoryStats, setMemoryStats] = useState<any>(null);
  const [batteryInfo, setBatteryInfo] = useState<any>(null);
  const [processingMetrics, setProcessingMetrics] = useState<any>(null);
  const [workerMetrics, setWorkerMetrics] = useState<any>(null);

  useEffect(() => {
    // Update metrics every 2 seconds
    const interval = setInterval(() => {
      if (isMonitoring) {
        setMemoryStats(audioService.getMemoryStats());
        setBatteryInfo(audioService.getBatteryInfo());
        setProcessingMetrics(audioService.getProcessingMetrics());
        setWorkerMetrics(audioService.getWorkerPerformanceMetrics());
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [audioService, isMonitoring]);

  const handleStartMonitoring = async () => {
    try {
      await audioService.initialize();
      audioService.startAnalysis();
      setIsMonitoring(true);
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      alert('Failed to start monitoring. Please check microphone permissions.');
    }
  };

  const handleStopMonitoring = () => {
    audioService.stopAnalysis();
    setIsMonitoring(false);
  };

  const handleRestartWorker = async () => {
    try {
      await audioService.restartWorker();
      alert('Web Worker restarted successfully');
    } catch (error) {
      console.error('Failed to restart worker:', error);
      alert('Failed to restart Web Worker');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Performance Optimization Demo</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={handleStartMonitoring}
          disabled={isMonitoring}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: isMonitoring ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isMonitoring ? 'not-allowed' : 'pointer'
          }}
        >
          Start Monitoring
        </button>
        
        <button 
          onClick={handleStopMonitoring}
          disabled={!isMonitoring}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: !isMonitoring ? '#ccc' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !isMonitoring ? 'not-allowed' : 'pointer'
          }}
        >
          Stop Monitoring
        </button>
        
        <button 
          onClick={handleRestartWorker}
          disabled={!isMonitoring}
          style={{ 
            padding: '10px 20px',
            backgroundColor: !isMonitoring ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !isMonitoring ? 'not-allowed' : 'pointer'
          }}
        >
          Restart Worker
        </button>
      </div>

      {isMonitoring && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Memory Statistics */}
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '15px',
            backgroundColor: memoryStats?.isHighUsage ? '#fff3cd' : '#f8f9fa'
          }}>
            <h3>Memory Usage</h3>
            {memoryStats ? (
              <div>
                <p><strong>Current:</strong> {formatPercentage(memoryStats.current)}</p>
                <p><strong>Average:</strong> {formatPercentage(memoryStats.average)}</p>
                <p><strong>Peak:</strong> {formatPercentage(memoryStats.peak)}</p>
                <p><strong>Status:</strong> 
                  <span style={{ 
                    color: memoryStats.isHighUsage ? '#856404' : '#155724',
                    fontWeight: 'bold'
                  }}>
                    {memoryStats.isHighUsage ? 'High Usage' : 'Normal'}
                  </span>
                </p>
              </div>
            ) : (
              <p>Loading...</p>
            )}
          </div>

          {/* Battery Information */}
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '15px',
            backgroundColor: batteryInfo?.status.level < 0.2 ? '#f8d7da' : '#f8f9fa'
          }}>
            <h3>Battery Status</h3>
            {batteryInfo ? (
              <div>
                <p><strong>Level:</strong> {formatPercentage(batteryInfo.status.level)}</p>
                <p><strong>Charging:</strong> {batteryInfo.status.charging ? 'Yes' : 'No'}</p>
                <p><strong>Analysis Depth:</strong> {batteryInfo.schedule.analysisDepth}</p>
                <p><strong>Frame Skip:</strong> {batteryInfo.schedule.frameSkipInterval}</p>
                <p><strong>Worker Enabled:</strong> {batteryInfo.schedule.workerEnabled ? 'Yes' : 'No'}</p>
                
                {batteryInfo.recommendations.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <strong>Recommendations:</strong>
                    <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                      {batteryInfo.recommendations.map((rec: string, index: number) => (
                        <li key={index} style={{ fontSize: '0.9em', color: '#666' }}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p>Loading...</p>
            )}
          </div>

          {/* Processing Metrics */}
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '15px',
            backgroundColor: '#f8f9fa'
          }}>
            <h3>Processing Performance</h3>
            {processingMetrics ? (
              <div>
                <p><strong>Frequency:</strong> {processingMetrics.frequency} fps</p>
                <p><strong>Last Processing Time:</strong> {processingMetrics.lastProcessingTime.toFixed(2)} ms</p>
                <p><strong>Queue Size:</strong> {processingMetrics.queueSize}</p>
                <p><strong>Frame Skip Interval:</strong> {processingMetrics.frameSkipInterval}</p>
                <p><strong>Using Web Worker:</strong> 
                  <span style={{ 
                    color: processingMetrics.usingWebWorker ? '#155724' : '#721c24',
                    fontWeight: 'bold'
                  }}>
                    {processingMetrics.usingWebWorker ? 'Yes' : 'No'}
                  </span>
                </p>
              </div>
            ) : (
              <p>Loading...</p>
            )}
          </div>

          {/* Web Worker Metrics */}
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '15px',
            backgroundColor: workerMetrics?.isHealthy === false ? '#f8d7da' : '#f8f9fa'
          }}>
            <h3>Web Worker Performance</h3>
            {workerMetrics ? (
              <div>
                <p><strong>Average Processing Time:</strong> {workerMetrics.averageProcessingTime.toFixed(2)} ms</p>
                <p><strong>Messages Sent:</strong> {workerMetrics.messagesSent}</p>
                <p><strong>Messages Received:</strong> {workerMetrics.messagesReceived}</p>
                <p><strong>Errors:</strong> {workerMetrics.errorsCount}</p>
                <p><strong>Health Status:</strong> 
                  <span style={{ 
                    color: workerMetrics.isHealthy ? '#155724' : '#721c24',
                    fontWeight: 'bold'
                  }}>
                    {workerMetrics.isHealthy ? 'Healthy' : 'Unhealthy'}
                  </span>
                </p>
                <p><strong>Uptime:</strong> {Math.floor((Date.now() - workerMetrics.workerStartTime) / 1000)} seconds</p>
              </div>
            ) : (
              <p>Web Worker not available</p>
            )}
          </div>
        </div>
      )}

      {!isMonitoring && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          color: '#666'
        }}>
          <h3>Start monitoring to see performance metrics</h3>
          <p>This demo shows real-time performance optimization features including:</p>
          <ul style={{ textAlign: 'left', display: 'inline-block' }}>
            <li>Memory usage monitoring and optimization</li>
            <li>Battery-aware processing schedules</li>
            <li>Web Worker performance metrics</li>
            <li>Adaptive processing frequency</li>
            <li>Circular buffer memory management</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default PerformanceOptimizationExample;