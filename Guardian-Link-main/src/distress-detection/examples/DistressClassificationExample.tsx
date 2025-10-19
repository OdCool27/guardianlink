/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DistressClassificationService } from '../services/DistressClassificationService';
import { DistressAnalysis } from '../types';

/**
 * Example component demonstrating distress classification functionality
 */
export const DistressClassificationExample: React.FC = () => {
  const [service] = useState(() => new DistressClassificationService());
  const [inputText, setInputText] = useState('');
  const [analysis, setAnalysis] = useState<DistressAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [processingMode, setProcessingMode] = useState<'local' | 'api'>('local');
  const [apiKey, setApiKey] = useState('');
  const [customPhrases, setCustomPhrases] = useState<string[]>([]);
  const [newPhrase, setNewPhrase] = useState('');

  useEffect(() => {
    // Initialize service
    service.initialize().catch(console.error);
    
    return () => {
      service.destroy();
    };
  }, [service]);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const result = await service.analyzeText(inputText);
      setAnalysis(result);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed: ' + (error as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleModeChange = (mode: 'local' | 'api') => {
    setProcessingMode(mode);
    service.setProcessingMode(mode);
    
    if (mode === 'api' && apiKey) {
      service.updateSettings({ apiKey });
    }
  };

  const handleApiKeyUpdate = () => {
    if (apiKey) {
      service.updateSettings({ apiKey });
      alert('API key updated');
    }
  };

  const handleAddPhrase = () => {
    if (newPhrase.trim()) {
      const updatedPhrases = [...customPhrases, newPhrase.trim()];
      setCustomPhrases(updatedPhrases);
      service.addCustomPhrases([newPhrase.trim()]);
      setNewPhrase('');
    }
  };

  const handleRemovePhrase = (phrase: string) => {
    const updatedPhrases = customPhrases.filter(p => p !== phrase);
    setCustomPhrases(updatedPhrases);
    service.removeCustomPhrases([phrase]);
  };

  const testPhrases = [
    "Help me please!",
    "I'm scared, someone help",
    "Stop it, leave me alone",
    "Call the police now",
    "Everything is fine, thank you",
    "Having a great day",
    "Please don't hurt me",
    "I need help right now"
  ];

  const status = service.getStatus();

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Distress Classification Service Example</h2>
      
      {/* Service Status */}
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '5px', 
        marginBottom: '20px' 
      }}>
        <h3>Service Status</h3>
        <p><strong>Mode:</strong> {status.mode}</p>
        <p><strong>API Configured:</strong> {status.apiConfigured ? 'Yes' : 'No'}</p>
        <p><strong>Fallback Enabled:</strong> {status.fallbackEnabled ? 'Yes' : 'No'}</p>
        <p><strong>Initialized:</strong> {status.initialized ? 'Yes' : 'No'}</p>
      </div>

      {/* Processing Mode Selection */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Processing Mode</h3>
        <label style={{ marginRight: '20px' }}>
          <input
            type="radio"
            value="local"
            checked={processingMode === 'local'}
            onChange={(e) => handleModeChange(e.target.value as 'local' | 'api')}
          />
          Local Processing
        </label>
        <label>
          <input
            type="radio"
            value="api"
            checked={processingMode === 'api'}
            onChange={(e) => handleModeChange(e.target.value as 'local' | 'api')}
          />
          Hugging Face API
        </label>
      </div>

      {/* API Configuration */}
      {processingMode === 'api' && (
        <div style={{ marginBottom: '20px' }}>
          <h3>API Configuration</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="password"
              placeholder="Hugging Face API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{ flex: 1, padding: '8px' }}
            />
            <button onClick={handleApiKeyUpdate}>Update API Key</button>
          </div>
        </div>
      )}

      {/* Custom Phrases Management */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Custom Distress Phrases</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Add custom distress phrase"
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            style={{ flex: 1, padding: '8px' }}
            onKeyPress={(e) => e.key === 'Enter' && handleAddPhrase()}
          />
          <button onClick={handleAddPhrase}>Add Phrase</button>
        </div>
        
        {customPhrases.length > 0 && (
          <div>
            <strong>Custom Phrases:</strong>
            <ul style={{ margin: '5px 0' }}>
              {customPhrases.map((phrase, index) => (
                <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>"{phrase}"</span>
                  <button 
                    onClick={() => handleRemovePhrase(phrase)}
                    style={{ marginLeft: '10px', padding: '2px 8px', fontSize: '12px' }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Text Analysis */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Text Analysis</h3>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter text to analyze for distress indicators..."
          style={{ 
            width: '100%', 
            height: '100px', 
            padding: '10px',
            marginBottom: '10px',
            resize: 'vertical'
          }}
        />
        <button 
          onClick={handleAnalyze}
          disabled={isAnalyzing || !inputText.trim()}
          style={{ 
            padding: '10px 20px',
            backgroundColor: isAnalyzing ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isAnalyzing ? 'not-allowed' : 'pointer'
          }}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Text'}
        </button>
      </div>

      {/* Test Phrases */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Test Phrases</h3>
        <p>Click on any phrase to test it:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {testPhrases.map((phrase, index) => (
            <button
              key={index}
              onClick={() => setInputText(phrase)}
              style={{
                padding: '8px 12px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              "{phrase}"
            </button>
          ))}
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: analysis.isDistress ? '#fff3cd' : '#d1edff',
          border: `1px solid ${analysis.isDistress ? '#ffeaa7' : '#bee5eb'}`,
          borderRadius: '5px',
          marginTop: '20px'
        }}>
          <h3>Analysis Results</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <strong>Distress Detected:</strong> {analysis.isDistress ? 'YES' : 'NO'}
            </div>
            <div>
              <strong>Confidence:</strong> {analysis.confidence.toFixed(1)}%
            </div>
            <div>
              <strong>Sentiment:</strong> {analysis.sentiment}
            </div>
            <div>
              <strong>Detected Phrases:</strong> {analysis.detectedPhrases.length}
            </div>
          </div>
          
          {analysis.detectedPhrases.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <strong>Detected Phrases:</strong>
              <ul style={{ margin: '5px 0' }}>
                {analysis.detectedPhrases.map((phrase, index) => (
                  <li key={index}>"{phrase}"</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};