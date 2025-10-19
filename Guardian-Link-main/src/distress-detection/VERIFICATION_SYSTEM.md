# Distress Verification System

## Overview

The verification system provides a user-friendly dialog that appears when distress is detected, allowing users to confirm or dismiss alerts before emergency services are contacted. This helps minimize false positives while ensuring real emergencies are handled quickly.

## Components

### VerificationDialog

A React component that displays an urgent modal dialog with:
- **Urgent styling**: Red overlay with pulsing animations for critical situations
- **Countdown timer**: Visual and numeric countdown showing time remaining
- **Large buttons**: Touch-friendly "I NEED HELP" and "I'M OKAY" buttons
- **Accessibility**: Full keyboard navigation and screen reader support
- **Responsive design**: Works on both mobile and desktop devices

### VerificationService

A service class that manages:
- **State management**: Tracks active verifications and their context
- **Timeout handling**: Automatically triggers SOS after configurable timeout (default 10 seconds)
- **Event logging**: Records all verification events for analytics
- **Statistics**: Tracks false positive rates and response times

## Usage

### Basic Integration

```typescript
import { VerificationDialog, VerificationService } from '../distress-detection';

const MyComponent = () => {
  const [showDialog, setShowDialog] = useState(false);
  const verificationService = useRef(new VerificationService());

  const handleDistressDetected = (context: DistressContext) => {
    setShowDialog(true);
    
    verificationService.current.startVerification(
      context,
      10, // timeout in seconds
      handleVerificationResult,
      handleTimeout
    );
  };

  const handleVerificationResult = (result: VerificationResult, shouldTriggerSOS: boolean) => {
    setShowDialog(false);
    
    if (shouldTriggerSOS) {
      // Trigger emergency response
      emergencyResponseHandler.activateSOS(context);
    }
  };

  const handleTimeout = (context: DistressContext) => {
    // Automatic SOS trigger on timeout
    emergencyResponseHandler.activateSOS(context);
  };

  return (
    <div>
      {/* Your app content */}
      
      <VerificationDialog
        isOpen={showDialog}
        detectionSource="Speech Recognition"
        confidence={85}
        timeoutSeconds={10}
        onResult={handleVerificationResult}
      />
    </div>
  );
};
```

### Advanced Configuration

```typescript
// Configure timeout
verificationService.current.updateTimeoutSeconds(15);

// Get statistics
const stats = verificationService.current.getStatistics();
console.log(`False positive rate: ${stats.falsePositiveRate}%`);

// Get event log
const events = verificationService.current.getEventLog();

// Clear old events for privacy
verificationService.current.clearEventLog();
```

## Features

### Accessibility
- **Keyboard navigation**: Tab, Enter, Space, and Escape key support
- **Screen reader support**: Proper ARIA labels and roles
- **Focus management**: Automatic focus on primary action button
- **High contrast**: Clear visual hierarchy with urgent styling

### User Experience
- **Urgent visual design**: Red overlay with animations to grab attention
- **Clear messaging**: Simple "Are you okay?" with detection details
- **Large touch targets**: Easy to use on mobile devices
- **Progress indication**: Visual countdown bar and numeric timer
- **Audio alerts**: Optional beep sound when dialog appears

### Privacy & Analytics
- **Event logging**: Tracks verification outcomes for improvement
- **Statistics**: Monitors false positive rates and response times
- **Local storage**: Persists recent events (configurable retention)
- **Privacy controls**: Can disable logging or clear data

## Requirements Fulfilled

This implementation satisfies the following requirements:

- **4.1**: Verification popup with "Are you okay?" message and response options
- **4.2**: Two response options: "Yes, I'm fine" and "No, I need help"
- **4.3**: Dismisses alert when user selects "Yes, I'm fine"
- **4.4**: Triggers SOS when user selects "No, I need help"
- **4.5**: Automatic SOS trigger after 10-second timeout

## Testing

Use the `VerificationExample` component to test the system:

```bash
# Navigate to the example in your app
/distress-detection/examples/verification
```

The example provides:
- Simulation buttons for different detection types
- Real-time statistics display
- Event log monitoring
- Configurable timeout testing

## Integration Points

The verification system integrates with:
- **Distress Detection Manager**: Receives distress events
- **Emergency Response Handler**: Triggers SOS when confirmed
- **Settings System**: Configurable timeout and behavior
- **Analytics System**: Provides usage statistics and logs