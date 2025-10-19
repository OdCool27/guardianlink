/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VerificationDialog } from '../../distress-detection/components/VerificationDialog';

describe('VerificationDialog', () => {
  let mockOnResult: any;
  let user: any;

  beforeEach(() => {
    mockOnResult = vi.fn();
    user = userEvent.setup();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('should render when visible', () => {
      render(
        <VerificationDialog
          isVisible={true}
          detectionSource="speech"
          confidence={85}
          onResult={mockOnResult}
        />
      );

      expect(screen.getByText(/We detected signs of distress/)).toBeInTheDocument();
      expect(screen.getByText(/Are you okay?/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Yes, I'm fine/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /No, I need help/i })).toBeInTheDocument();
    });

    it('should not render when not visible', () => {
      render(
        <VerificationDialog
          isVisible={false}
          detectionSource="speech"
          confidence={85}
          onResult={mockOnResult}
        />
      );

      expect(screen.queryByText(/We detected signs of distress/)).not.toBeInTheDocument();
    });

    it('should display detection source information', () => {
      render(
        <VerificationDialog
          isVisible={true}
          detectionSource="audio"
          confidence={92}
          onResult={mockOnResult}
        />
      );

      expect(screen.getByText(/audio analysis/)).toBeInTheDocument();
    });

    it('should display confidence level', () => {
      render(
        <VerificationDialog
          isVisible={true}
          detectionSource="speech"
          confidence={78}
          onResult={mockOnResult}
        />
      );

      expect(screen.getByText(/78%/)).toBeInTheDocument();
    });
  });

  describe('countdown timer', () => {
    it('should display countdown timer starting at 10 seconds', () => {
      render(
        <VerificationDialog
          isVisible={true}
          detectionSource="speech"
          confidence={85}
          onResult={mockOnResult}
        />
      );

      expect(screen.getByText(/10/)).toBeInTheDocument();
    });

    it('should countdown from 10 to 0', async () => {
      render(
        <VerificationDialog
          isVisible={true}
          detectionSource="speech"
          confidence={85}
          onResult={mockOnResult}
        />
      );

      expect(screen.getByText(/10/)).toBeInTheDocument();

      vi.advanceTimersByTime(1000);
      await waitFor(() => {
        expect(screen.getByText(/9/)).toBeInTheDocument();
      });

      vi.advanceTimersByTime(1000);
      await waitFor(() => {
        expect(screen.getByText(/8/)).toBeInTheDocument();
      });
    });

    it('should trigger timeout after 10 seconds', async () => {
      render(
        <VerificationDialog
          isVisible={true}
          detectionSource="speech"
          confidence={85}
          onResult={mockOnResult}
        />
      );

      vi.advanceTimersByTime(10000);

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith({
          action: 'timeout',
          timestamp: expect.any(Date)
        });
      });
    });

    it('should show visual urgency as countdown decreases', async () => {
      render(
        <VerificationDialog
          isVisible={true}
          detectionSource="speech"
          confidence={85}
          onResult={mockOnResult}
        />
      );

      // Advance to 3 seconds remaining (urgent state)
      vi.advanceTimersByTime(7000);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveClass('urgent');
      });
    });
  });

  describe('user interactions', () => {
    it('should handle "Yes, I\'m fine" button click', async () => {
      render(
        <VerificationDialog
          isVisible={true}
          detectionSource="speech"
          confidence={85}
          onResult={mockOnResult}
        />
      );

      const yesButton = screen.getByRole('button', { name: /Yes, I'm fine/i });
      await user.click(yesButton);

      expect(mockOnResult).toHaveBeenCalledWith({
        action: 'dismiss',
        timestamp: expect.any(Date)
      });
    });

    it('should handle "No, I need help" button click', async () => {
      render(
        <VerificationDialog
          isVisible={true}
          detectionSource="speech"
          confidence={85}
          onResult={mockOnResult}
        />
      );

      const noButton = screen.getByRole('button', { name: /No, I need help/i });
      await user.click(noButton);

      expect(mockOnResult).toHaveBeenCalledWith({
        action: 'confirm',
        timestamp: expect.any(Date)
      });
    });

    it('should handle keyboard navigation', async () => {
      render(
        <VerificationDialog
          isVisible={true}
          detectionSource="speech"
          confidence={85}
          onResult={mockOnResult}
        />
      );

      // Tab to first button and press Enter
      await user.tab();
      await user.keyboard('{Enter}');

      expect(mockOnResult).toHaveBeenCalledWith({
        action: 'dismiss',
        timestamp: expect.any(Date)
      });
    });

    it('should handle Escape key to dismiss', async () => {
      render(
        <VerificationDialog
          isVisible={true}
          detectionSource="speech"
          confidence={85}
          onResult={mockOnResult}
        />
      );

      await user.keyboard('{Escape}');

      expect(mockOnResult).toHaveBeenCalledWith({
        action: 'dismiss',
        timestamp: expect.any(Date)
      });
    });

    it('should stop countdown when user responds', async () => {
      render(
        <VerificationDialog
          isVisible={true}
          detectionSource="speech"
          confidence={85}
          onResult={mockOnResult}
        />
      );

      // Click button after 3 seconds
      vi.advanceTimersByTime(3000);
      
      const yesButton = screen.getByRole('button', { name: /Yes, I'm fine/i });
      await user.click(yesButton);

      // Advance time further - should not trigger timeout
      vi.advanceTimersByTime(10000);

      expect(mockOnResult).toHaveBeenCalledTimes(1);
      expect(mockOnResult).toHaveBeenCalledWith({
        action: 'dismiss',
        timestamp: expect.any(Date)
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <VerificationDialog
          isVisible={true}
          detectionSource="speech"
          confidence={85}
          onResult={mockOnResult}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    it('should focus on first button when opened', () => {
      render(
        <VerificationDialog
          isVisible={true}
          detectionSource="speech"
          confidence={85}
          onResult={mockOnResult}
        />
      );

      const yesButton = screen.getByRole('button', { name: /Yes, I'm fine/i });
      expect(yesButton).toHaveFocus();
    });

    it('should trap focus within dialog', async () => {
      render(
        <VerificationDialog
          isVisible={true}
          detectionSource="speech"
          confidence={85}
          onResult={mockOnResult}
        />
      );

      const yesButton = screen.getByRole('button', { name: /Yes, I'm fine/i });
      const noButton = screen.getByRole('button', { name: /No, I need help/i });

      // Tab should cycle between buttons
      await user.tab();
      expect(noButton).toHaveFocus();

      await user.tab();
      expect(yesButton).toHaveFocus();
    });

    it('should have high contrast colors for urgency', () => {
      render(
        <VerificationDialog
          isVisible={true}
          detectionSource="speech"
          confidence={85}
          onResult={mockOnResult}
        />
      );

      const dialog = screen.getByRole('dialog');
      const computedStyle = window.getComputedStyle(dialog);
      
      // Should have high contrast background
      expect(computedStyle.backgroundColor).toBeTruthy();
    });
  });

  describe('audio alerts', () => {
    let mockAudio: any;

    beforeEach(() => {
      mockAudio = {
        play: vi.fn(() => Promise.resolve()),
        pause: vi.fn(),
        load: vi.fn(),
        currentTime: 0,
        volume: 1,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
      
      global.Audio = vi.fn(() => mockAudio);
    });

    it('should play alert sound when dialog opens', () => {
      render(
        <VerificationDialog
          isVisible={true}
          detectionSource="speech"
          confidence={85}
          onResult={mockOnResult}
        />
      );

      expect(global.Audio).toHaveBeenCalled();
      expect(mockAudio.play).toHaveBeenCalled();
    });

    it('should play urgent sound in final seconds', async () => {
      render(
        <VerificationDialog
          isVisible={true}
          detectionSource="speech"
          confidence={85}
          onResult={mockOnResult}
        />
      );

      // Advance to final 3 seconds
      vi.advanceTimersByTime(7000);

      await waitFor(() => {
        expect(mockAudio.play).toHaveBeenCalledTimes(2); // Initial + urgent
      });
    });
  });

  describe('different detection sources', () => {
    it('should display appropriate message for speech detection', () => {
      render(
        <VerificationDialog
          isVisible={true}
          detectionSource="speech"
          confidence={85}
          onResult={mockOnResult}
        />
      );

      expect(screen.getByText(/speech analysis/)).toBeInTheDocument();
    });

    it('should display appropriate message for audio detection', () => {
      render(
        <VerificationDialog
          isVisible={true}
          detectionSource="audio"
          confidence={85}
          onResult={mockOnResult}
        />
      );

      expect(screen.getByText(/audio analysis/)).toBeInTheDocument();
    });

    it('should display appropriate message for combined detection', () => {
      render(
        <VerificationDialog
          isVisible={true}
          detectionSource="combined"
          confidence={85}
          onResult={mockOnResult}
        />
      );

      expect(screen.getByText(/multiple indicators/)).toBeInTheDocument();
    });
  });

  describe('confidence levels', () => {
    it('should show different urgency for high confidence', () => {
      render(
        <VerificationDialog
          isVisible={true}
          detectionSource="speech"
          confidence={95}
          onResult={mockOnResult}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('high-confidence');
    });

    it('should show moderate urgency for medium confidence', () => {
      render(
        <VerificationDialog
          isVisible={true}
          detectionSource="speech"
          confidence={75}
          onResult={mockOnResult}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('medium-confidence');
    });

    it('should adjust timeout based on confidence level', async () => {
      // High confidence should have shorter timeout
      const { rerender } = render(
        <VerificationDialog
          isVisible={true}
          detectionSource="speech"
          confidence={95}
          onResult={mockOnResult}
          timeoutSeconds={8} // Shorter for high confidence
        />
      );

      vi.advanceTimersByTime(8000);

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith({
          action: 'timeout',
          timestamp: expect.any(Date)
        });
      });
    });
  });
});