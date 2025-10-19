/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple test to verify emergency response implementation
import { emergencyResponseHandler } from './services/EmergencyResponseHandler';
import { DistressContext } from './types';

// Test function to verify the emergency response system
export async function testEmergencyResponse() {
  console.log('🧪 Testing Emergency Response System...');

  try {
    // Test context with all properties
    const testContext: DistressContext = {
      detectionMethod: 'combined',
      confidence: 85,
      timestamp: new Date(),
      transcript: 'help me please',
      audioMetrics: {
        peakVolume: 95,
        duration: 2.5,
        frequencyProfile: [120, 250, 180, 300, 220]
      }
    };

    console.log('✅ DistressContext created successfully');
    console.log('Context:', testContext);

    // Test emergency response handler methods
    const isActive = emergencyResponseHandler.isEmergencyActive();
    console.log('Emergency active:', isActive);

    const stats = emergencyResponseHandler.getEmergencyStats();
    console.log('Emergency stats:', stats);

    console.log('✅ Emergency Response System test completed successfully');
    return true;

  } catch (error) {
    console.error('❌ Emergency Response System test failed:', error);
    return false;
  }
}

// Export for use in other components
export { emergencyResponseHandler };