# Multi-User Testing Guide

## 🎯 Testing Companion Mode with Two Users

You now have **two frontend instances** running to test multi-user interactions!

## Current Setup ✅

### Instance 1 (User A - Primary User)
- **URL**: http://localhost:3001/
- **Role**: Will activate companion mode
- **Browser**: Use your main browser window

### Instance 2 (User B - Companion/Guardian)
- **URL**: http://localhost:5174/
- **Role**: Will receive companion mode alerts
- **Browser**: Open in a different browser window or incognito mode

### Backend (Shared)
- **URL**: http://localhost:8080/
- **Status**: Both frontend instances connect to the same backend

## 📝 Testing Steps

### Step 1: Create Two Test Accounts

#### Browser Window 1 (http://localhost:3001/)
1. Create account for **User A**:
   - Name: `Alice Test`
   - Email: `alice@test.com`
   - Password: `password123`
2. Sign in

#### Browser Window 2 (http://localhost:5174/)
1. Create account for **User B**:
   - Name: `Bob Guardian`
   - Email: `bob@test.com`
   - Password: `password123`
2. Sign in

### Step 2: Set Up Emergency Contacts

#### In User A's Account (Alice - Port 3001):
1. Go to **Contacts** tab
2. Add **Bob** as emergency contact:
   - Name: `Bob Guardian`
   - Phone: `+1234567890`
   - Email: `bob@test.com`
3. Save the contact

#### In User B's Account (Bob - Port 5174):
1. Go to **Contacts** tab  
2. Add **Alice** as emergency contact:
   - Name: `Alice Test`
   - Phone: `+0987654321`
   - Email: `alice@test.com`
3. Save the contact

### Step 3: Test Companion Mode Activation

#### In User A's Window (Alice - Port 3001):
1. Go to **Home** tab
2. Click **"Start Companion Mode"**
3. Select **Bob Guardian** as the companion
4. Set duration (e.g., 15 minutes)
5. Click **"Start Sharing"**
6. ✅ Observe: Location tracking starts, timer shows

#### In User B's Window (Bob - Port 5174):
1. Check **email** (bob@test.com) for notification
2. Check **phone** for SMS (if Twilio is configured)
3. **FUTURE FEATURE**: In-app notification (not yet implemented)

### Step 4: Test SOS Activation

#### In User A's Window (Alice - Port 3001):
1. Go to **Home** tab
2. Press **"SOS"** button
3. Wait for 5-second countdown
4. ✅ Observe: SOS alert sent, companion mode auto-starts

#### In User B's Window (Bob - Port 5174):
1. Check **email** for SOS alert
2. Check **phone** for emergency SMS
3. Should receive location link and alert details

## 🔍 What to Check

### Backend Logs (Terminal)
Watch the backend terminal for:
- ✅ Companion session created
- ✅ Location updates received
- ✅ Email/SMS notifications sent
- ✅ WebSocket connections

### Browser Console (F12)
Check both browser windows for:
- ✅ API requests succeeding (200 status)
- ✅ Location updates being sent
- ✅ No JavaScript errors

### Database (Supabase)
Check these tables:
- `companion_sessions` - Session created with correct user_id
- `companion_session_contacts` - Bob linked to Alice's session
- `location_updates` - Real-time location being recorded
- `alert_history` - SOS events logged

## 📧 Email & SMS Testing

### Email Notifications (via Gmail SMTP)
Bob should receive emails at `bob@test.com` with:
- Subject: "Companion Mode Alert" or "SOS Emergency Alert"
- Body: Alice's name, location link, duration
- Sent from: `vapfumiconnect@gmail.com`

### SMS Notifications (via Twilio)
Bob should receive SMS at `+1234567890` with:
- Alert message with location link
- From: Twilio number `+16073578897`

**Note**: Check backend logs for notification errors (Twilio auth issues noted earlier)

## 🚀 Advanced Testing Scenarios

### Scenario 1: Multiple Companions
1. Add a third account (Charlie)
2. Alice adds both Bob and Charlie as contacts
3. Alice starts companion mode with BOTH selected
4. Both should receive notifications

### Scenario 2: Companion Mode Timeout
1. Alice starts 5-minute companion mode
2. Wait 5 minutes
3. ✅ Check: Session auto-stops, Bob receives "session ended" notification

### Scenario 3: Manual Stop
1. Alice starts companion mode
2. Alice clicks "Stop Sharing" before timer ends
3. ✅ Check: Session stops, backend updates `is_active = false`

### Scenario 4: Concurrent Sessions
1. Alice starts companion mode
2. Bob starts companion mode (separate session)
3. ✅ Check: Both sessions run independently

## 🐛 Known Limitations (Current)

### ❌ Not Yet Implemented:
1. **Real-time in-app notifications** - Companions don't see alerts in the app yet
2. **Live location viewing** - Companions can't view Alice's location in real-time within app
3. **WebSocket broadcasting** - Location updates not pushed to companion's app
4. **Session list view** - Bob can't see active sessions shared with him

### ✅ Currently Working:
1. **Email notifications** to emergency contacts
2. **SMS notifications** (when Twilio configured)
3. **Location tracking** and storage
4. **Session management** (start/stop)
5. **Database persistence**

## 🔧 Future Enhancements Needed

### For Full Multi-User Experience:

1. **Add "Shared With Me" view** in Bob's app to see active sessions
2. **Implement WebSocket real-time updates** for companions
3. **Show live location map** of person sharing with you
4. **In-app notification system** for companion alerts
5. **Push notifications** (requires mobile app or PWA)

### Implementation Priority:
```
HIGH:   Shared sessions view (so Bob can see Alice's location)
HIGH:   WebSocket live updates to companion
MEDIUM: In-app notifications
LOW:    Push notifications (requires PWA setup)
```

## 📊 Testing Checklist

Use this checklist for comprehensive testing:

- [ ] Two accounts created successfully
- [ ] Emergency contacts added on both sides
- [ ] Companion mode starts without errors
- [ ] Location coordinates displayed (or map if API fixed)
- [ ] Timer counts down correctly
- [ ] Email notification received by companion
- [ ] SMS notification received (if Twilio working)
- [ ] Location updates sent to backend
- [ ] Session stored in database correctly
- [ ] Session stops when timer reaches zero
- [ ] Manual stop works correctly
- [ ] SOS creates companion session automatically
- [ ] Multiple contacts receive notifications

## 🛠️ Troubleshooting

### Issue: Second user doesn't receive notification
**Check**:
1. Backend terminal for email/SMS errors
2. Email spam folder
3. Twilio account credentials in backend `.env`

### Issue: "Already have active session" error
**Fix**: Stop existing session first or use the dialog to auto-stop and restart

### Issue: Can't see companion's location
**Status**: Feature not yet implemented - coming in next phase

### Issue: Ports keep changing
**Fix**: The `--strictPort` flag is set, but Vite may still change ports if blocked

## 📝 Test Results Template

After testing, document your results:

```
Date: ___________
Tester: ___________

COMPANION MODE ACTIVATION:
✅/❌ Session started successfully
✅/❌ Timer displayed correctly
✅/❌ Location tracked

NOTIFICATIONS:
✅/❌ Email sent to companion
✅/❌ SMS sent to companion
✅/❌ Correct contact information

SOS ACTIVATION:
✅/❌ SOS alert triggered
✅/❌ Companion mode auto-started
✅/❌ Emergency notifications sent

ISSUES FOUND:
- 
- 

NOTES:
- 
```

## 🎯 Next Steps After Testing

1. **Document bugs** you find
2. **Note missing features** you need
3. **Test edge cases** (no internet, wrong contact info, etc.)
4. **Prepare for production** (secure API keys, deploy backend, etc.)

---

**Ready to test!** Open both URLs in separate browser windows and start testing multi-user companion mode! 🚀
