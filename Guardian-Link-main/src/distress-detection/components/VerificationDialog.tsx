/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { VerificationResult } from '../types';

interface VerificationDialogProps {
  isOpen: boolean;
  detectionSource: string;
  confidence: number;
  timeoutSeconds?: number;
  onResult: (result: VerificationResult) => void;
}

/**
 * Verification dialog component for distress detection confirmation
 * Displays urgent modal with countdown timer and accessibility features
 * Requirements: 4.1, 4.2
 */
export const VerificationDialog: React.FC<VerificationDialogProps> = ({
  isOpen,
  detectionSource,
  confidence,
  timeoutSeconds = 10,
  onResult
}) => {
  const [remainingTime, setRemainingTime] = useState(timeoutSeconds);
  const [isVisible, setIsVisible] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Initialize component when opened
  useEffect(() => {
    if (isOpen) {
      setRemainingTime(timeoutSeconds);
      setIsVisible(true);
      
      // Focus the confirm button for accessibility
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 100);

      // Start countdown timer
      intervalRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Play alert sound
      playAlertSound();
    } else {
      setIsVisible(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOpen, timeoutSeconds]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          handleDismiss();
          break;
        case 'Enter':
        case ' ':
          handleConfirm();
          break;
        case 'Tab':
          // Allow tab navigation between buttons
          break;
        default:
          // Prevent other keyboard interactions
          event.preventDefault();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const playAlertSound = () => {
    try {
      // Create audio context for alert beep
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      // Create urgent beep pattern
      oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.5);

      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play alert sound:', error);
    }
  };

  const handleConfirm = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    onResult({
      action: 'confirm',
      timestamp: new Date()
    });
  };

  const handleDismiss = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    onResult({
      action: 'dismiss',
      timestamp: new Date()
    });
  };

  const handleTimeout = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    onResult({
      action: 'timeout',
      timestamp: new Date()
    });
  };

  if (!isVisible) return null;

  const progressPercentage = (remainingTime / timeoutSeconds) * 100;
  const isUrgent = remainingTime <= 3;

  return (
    <div 
      className="distress-verification-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verification-title"
      aria-describedby="verification-description"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(220, 38, 38, 0.95)', // Red overlay for urgency
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20000, // Higher than other modals
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        animation: isUrgent ? 'pulse 0.5s infinite alternate' : 'none'
      }}
    >
      <style>
        {`
          @keyframes pulse {
            0% { background-color: rgba(220, 38, 38, 0.95); }
            100% { background-color: rgba(239, 68, 68, 0.98); }
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          
          .verification-button:focus {
            outline: 3px solid #fff;
            outline-offset: 2px;
          }
          
          @media (max-width: 768px) {
            .verification-content {
              margin: 1rem !important;
              padding: 1.5rem !important;
            }
            
            .verification-button {
              padding: 1rem 2rem !important;
              font-size: 1.1rem !important;
            }
          }
        `}
      </style>

      <div 
        className="verification-content"
        style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '3rem',
          maxWidth: '500px',
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          border: '4px solid #dc2626',
          animation: isUrgent ? 'shake 0.3s infinite' : 'none'
        }}
      >
        {/* Alert Icon */}
        <div style={{ 
          fontSize: '4rem', 
          marginBottom: '1rem',
          animation: 'pulse 1s infinite alternate'
        }}>
          🚨
        </div>

        {/* Title */}
        <h1 
          id="verification-title"
          style={{
            margin: '0 0 1rem 0',
            color: '#dc2626',
            fontSize: '1.8rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          DISTRESS DETECTED
        </h1>

        {/* Description */}
        <div 
          id="verification-description"
          style={{
            color: '#374151',
            fontSize: '1.1rem',
            lineHeight: '1.5',
            marginBottom: '2rem'
          }}
        >
          <p style={{ margin: '0 0 1rem 0', fontWeight: '600' }}>
            We detected signs of distress. Are you okay?
          </p>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#6b7280' }}>
            Detection source: {detectionSource} (confidence: {Math.round(confidence)}%)
          </p>
        </div>

        {/* Countdown Timer */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: isUrgent ? '#dc2626' : '#374151',
            marginBottom: '0.5rem',
            fontFamily: 'monospace'
          }}>
            {remainingTime}
          </div>
          
          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '0.5rem'
          }}>
            <div style={{
              width: `${progressPercentage}%`,
              height: '100%',
              backgroundColor: isUrgent ? '#dc2626' : '#f59e0b',
              transition: 'width 1s linear, background-color 0.3s ease',
              borderRadius: '4px'
            }} />
          </div>
          
          <p style={{
            margin: 0,
            fontSize: '0.9rem',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            {remainingTime > 0 
              ? `Emergency services will be contacted automatically in ${remainingTime} seconds`
              : 'Contacting emergency services...'
            }
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            ref={confirmButtonRef}
            className="verification-button"
            onClick={handleConfirm}
            style={{
              padding: '1rem 2.5rem',
              fontSize: '1.1rem',
              fontWeight: '700',
              color: 'white',
              backgroundColor: '#dc2626',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              minWidth: '180px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#b91c1c';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            🆘 I NEED HELP
          </button>

          <button
            className="verification-button"
            onClick={handleDismiss}
            style={{
              padding: '1rem 2.5rem',
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#374151',
              backgroundColor: '#f3f4f6',
              border: '2px solid #d1d5db',
              borderRadius: '12px',
              cursor: 'pointer',
              minWidth: '180px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
              e.currentTarget.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            ✅ I'M OKAY
          </button>
        </div>

        {/* Accessibility Instructions */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          fontSize: '0.85rem',
          color: '#6b7280',
          textAlign: 'left'
        }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>
            Keyboard shortcuts:
          </p>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            <li>Press <strong>Enter</strong> or <strong>Space</strong> to confirm distress</li>
            <li>Press <strong>Escape</strong> to dismiss alert</li>
            <li>Use <strong>Tab</strong> to navigate between buttons</li>
          </ul>
        </div>
      </div>
    </div>
  );
};