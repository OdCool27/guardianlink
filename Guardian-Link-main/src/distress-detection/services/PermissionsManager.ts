/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PermissionsManager as IPermissionsManager, PermissionState } from '../interfaces/PermissionsManager';

/**
 * Implementation of permissions manager for handling microphone access
 * and user privacy controls for distress detection
 */
export class PermissionsManager implements IPermissionsManager {
  private permissionCallbacks: Set<(granted: boolean) => void> = new Set();
  private currentPermissionState: PermissionState = 'prompt';
  private permissionQuery: PermissionStatus | null = null;

  constructor() {
    this.initializePermissionMonitoring();
  }

  /**
   * Initialize permission monitoring if supported by browser
   */
  private async initializePermissionMonitoring(): Promise<void> {
    try {
      const permissions = (navigator as any).permissions;
      if (permissions) {
        this.permissionQuery = await permissions.query({ name: 'microphone' as PermissionName });
        this.currentPermissionState = this.permissionQuery.state as PermissionState;
        
        // Listen for permission changes
        this.permissionQuery.addEventListener('change', () => {
          const newState = this.permissionQuery!.state as PermissionState;
          const wasGranted = this.currentPermissionState === 'granted';
          const isGranted = newState === 'granted';
          
          this.currentPermissionState = newState;
          
          // Notify callbacks if permission status changed
          if (wasGranted !== isGranted) {
            this.notifyPermissionChange(isGranted);
          }
        });
      }
    } catch (error) {
      console.warn('Permission monitoring not supported:', error);
    }
  }

  /**
   * Request microphone permissions from the user
   */
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      // Check if getUserMedia is available
      const mediaDevices = (navigator as any).mediaDevices;
      if (!mediaDevices || !mediaDevices.getUserMedia) {
        console.error('getUserMedia not supported');
        return false;
      }

      // Try to get user media to trigger permission request
      const stream = await mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Stop the stream immediately as we only needed it for permission
      stream.getTracks().forEach(track => track.stop());
      
      this.currentPermissionState = 'granted';
      this.notifyPermissionChange(true);
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      this.currentPermissionState = 'denied';
      this.notifyPermissionChange(false);
      return false;
    }
  }

  /**
   * Check current microphone permission status
   */
  async getMicrophonePermissionStatus(): Promise<PermissionState> {
    try {
      const permissions = (navigator as any).permissions;
      if (permissions) {
        const result = await permissions.query({ name: 'microphone' as PermissionName });
        this.currentPermissionState = result.state as PermissionState;
        return this.currentPermissionState;
      }
      
      // Fallback: try to access microphone to check permission
      const mediaDevices = (navigator as any).mediaDevices;
      if (mediaDevices && mediaDevices.getUserMedia) {
        try {
          const stream = await mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          this.currentPermissionState = 'granted';
          return 'granted';
        } catch {
          // If we can't access, assume it's either denied or needs prompt
          return this.currentPermissionState === 'granted' ? 'denied' : 'prompt';
        }
      } else {
        return 'prompt';
      }
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      return 'prompt';
    }
  }

  /**
   * Monitor permission changes and notify callbacks
   */
  onPermissionChange(callback: (granted: boolean) => void): void {
    this.permissionCallbacks.add(callback);
  }

  /**
   * Remove permission change callback
   */
  offPermissionChange(callback: (granted: boolean) => void): void {
    this.permissionCallbacks.delete(callback);
  }

  /**
   * Check if all required permissions are granted
   */
  async hasRequiredPermissions(): Promise<boolean> {
    const status = await this.getMicrophonePermissionStatus();
    return status === 'granted';
  }

  /**
   * Show permission request UI with explanation
   */
  async showPermissionRequest(reason: string): Promise<boolean> {
    // Create and show permission request modal
    return new Promise((resolve) => {
      const modal = this.createPermissionModal(reason, async (userAccepted: boolean) => {
        if (userAccepted) {
          const granted = await this.requestMicrophonePermission();
          resolve(granted);
        } else {
          resolve(false);
        }
        document.body.removeChild(modal);
      });
      
      document.body.appendChild(modal);
    });
  }

  /**
   * Get user-friendly permission status message
   */
  getPermissionStatusMessage(): string {
    switch (this.currentPermissionState) {
      case 'granted':
        return 'Microphone access granted. Distress detection is ready.';
      case 'denied':
        return 'Microphone access denied. Please enable microphone permissions in your browser settings to use distress detection.';
      case 'prompt':
        return 'Microphone permission required. Click to enable distress detection.';
      default:
        return 'Unknown permission status.';
    }
  }

  /**
   * Handle permission denial and provide guidance
   */
  handlePermissionDenied(): void {
    const guidance = this.createPermissionGuidanceModal();
    document.body.appendChild(guidance);
  }

  /**
   * Notify all callbacks about permission changes
   */
  private notifyPermissionChange(granted: boolean): void {
    this.permissionCallbacks.forEach(callback => {
      try {
        callback(granted);
      } catch (error) {
        console.error('Error in permission change callback:', error);
      }
    });
  }

  /**
   * Create permission request modal
   */
  private createPermissionModal(reason: string, onResponse: (accepted: boolean) => void): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'distress-permission-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      padding: 2rem;
      border-radius: 12px;
      max-width: 500px;
      margin: 1rem;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    `;

    content.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🎤</div>
        <h2 style="margin: 0 0 1rem 0; color: #333; font-size: 1.5rem;">Microphone Permission Required</h2>
        <p style="color: #666; line-height: 1.5; margin: 0 0 1rem 0;">${reason}</p>
        <p style="color: #888; font-size: 0.9rem; margin: 0;">
          Your audio data will be processed locally on your device for privacy protection.
        </p>
      </div>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button id="deny-permission" style="
          padding: 0.75rem 1.5rem;
          border: 2px solid #ddd;
          background: white;
          color: #666;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
        ">Not Now</button>
        <button id="grant-permission" style="
          padding: 0.75rem 1.5rem;
          border: none;
          background: #007AFF;
          color: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
        ">Allow Access</button>
      </div>
    `;

    const denyButton = content.querySelector('#deny-permission') as HTMLButtonElement;
    const grantButton = content.querySelector('#grant-permission') as HTMLButtonElement;

    denyButton.addEventListener('click', () => onResponse(false));
    grantButton.addEventListener('click', () => onResponse(true));

    // Add hover effects
    grantButton.addEventListener('mouseenter', () => {
      grantButton.style.background = '#0056CC';
    });
    grantButton.addEventListener('mouseleave', () => {
      grantButton.style.background = '#007AFF';
    });

    denyButton.addEventListener('mouseenter', () => {
      denyButton.style.background = '#f5f5f5';
    });
    denyButton.addEventListener('mouseleave', () => {
      denyButton.style.background = 'white';
    });

    modal.appendChild(content);
    return modal;
  }

  /**
   * Create permission guidance modal for when permissions are denied
   */
  private createPermissionGuidanceModal(): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'distress-permission-guidance-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      padding: 2rem;
      border-radius: 12px;
      max-width: 600px;
      margin: 1rem;
      text-align: left;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    `;

    const browserName = this.getBrowserName();
    const instructions = this.getPermissionInstructions(browserName);

    content.innerHTML = `
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
        <h2 style="margin: 0 0 1rem 0; color: #333; font-size: 1.5rem;">Enable Microphone Access</h2>
        <p style="color: #666; line-height: 1.5; margin: 0;">
          To use distress detection, please enable microphone permissions in your browser.
        </p>
      </div>
      
      <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1rem 0; color: #333; font-size: 1.1rem;">Instructions for ${browserName}:</h3>
        <ol style="margin: 0; padding-left: 1.5rem; color: #555; line-height: 1.6;">
          ${instructions.map(step => `<li>${step}</li>`).join('')}
        </ol>
      </div>
      
      <div style="text-align: center;">
        <button id="close-guidance" style="
          padding: 0.75rem 2rem;
          border: none;
          background: #007AFF;
          color: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
        ">Got It</button>
      </div>
    `;

    const closeButton = content.querySelector('#close-guidance') as HTMLButtonElement;
    closeButton.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.background = '#0056CC';
    });
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.background = '#007AFF';
    });

    modal.appendChild(content);
    return modal;
  }

  /**
   * Get browser name for permission instructions
   */
  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'your browser';
  }

  /**
   * Get browser-specific permission instructions
   */
  private getPermissionInstructions(browser: string): string[] {
    switch (browser) {
      case 'Chrome':
        return [
          'Click the camera/microphone icon in the address bar',
          'Select "Always allow" for microphone access',
          'Refresh the page to apply changes'
        ];
      case 'Firefox':
        return [
          'Click the shield icon in the address bar',
          'Click "Turn off Blocking" for this site',
          'Refresh the page and allow microphone access'
        ];
      case 'Safari':
        return [
          'Go to Safari > Preferences > Websites',
          'Select "Microphone" from the left sidebar',
          'Set this website to "Allow"'
        ];
      case 'Edge':
        return [
          'Click the lock icon in the address bar',
          'Set microphone permission to "Allow"',
          'Refresh the page to apply changes'
        ];
      default:
        return [
          'Look for a microphone icon in your address bar',
          'Click it and select "Allow" for microphone access',
          'Refresh the page if needed'
        ];
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.permissionCallbacks.clear();
    if (this.permissionQuery) {
      this.permissionQuery.removeEventListener('change', () => {});
    }
  }
}