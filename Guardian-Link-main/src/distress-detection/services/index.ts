/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Export all distress detection services
export { PermissionsManager } from './PermissionsManager';
export { PrivacyConsentManager } from './PrivacyConsentManager';
export { SpeechRecognitionService } from './SpeechRecognitionService';
export { AudioAnalysisService } from './AudioAnalysisService';
export { DistressClassificationService } from './DistressClassificationService';
export { VerificationService } from './VerificationService';
export { DistressDetectionManager } from './DistressDetectionManager';
export { DetectionEventHandler } from './DetectionEventHandler';
export { EmergencyResponseHandlerImpl, emergencyResponseHandler } from './EmergencyResponseHandler';
export { DistressSettingsManager } from './DistressSettingsManager';
export type { ConsentRecord, PrivacyConsentState } from './PrivacyConsentManager';
export type { VerificationState, VerificationEventLog } from './VerificationService';
export type { DetectionEventFilter, DetectionCorrelation, DetectionMetrics } from './DetectionEventHandler';