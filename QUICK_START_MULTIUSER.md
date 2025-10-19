# Multi-User Testing - Quick Start

## ✅ Setup Complete!

You now have **two frontend instances** running for multi-user testing.

## 🌐 Your Running Instances

### Frontend Instance 1 (User A)
- **URL**: http://localhost:3001/
- **Purpose**: Primary user who activates companion mode
- **Terminal**: Running in background

### Frontend Instance 2 (User B)  
- **URL**: http://localhost:5174/
- **Purpose**: Companion/guardian who receives alerts
- **Terminal**: Running in background

### Backend (Shared)
- **URL**: http://localhost:8080/
- **Purpose**: Both frontends connect to same backend
- **CORS**: Updated to allow both ports ✅

## 🚀 Quick Test (5 Minutes)

### 1. Create Two Accounts

**Window 1** (http://localhost:3001/):
- Create account: `alice@test.com` / `password123`

**Window 2** (http://localhost:5174/):
- Create account: `bob@test.com` / `password123`

### 2. Add Each Other as Contacts

**Alice's account**:
- Add contact: Bob Guardian, bob@test.com, +1234567890

**Bob's account**:
- Add contact: Alice Test, alice@test.com, +0987654321

### 3. Test Companion Mode

**In Alice's window**:
1. Click "Start Companion Mode"
2. Select Bob as companion
3. Set 5 minutes duration
4. Click "Start Sharing"

**In Bob's window**:
- Check email (bob@test.com) for alert ✅
- Check SMS if Twilio configured ✅

### 4. Check Backend Logs

Look for:
```
POST /api/companion/start 200
Companion mode started for 5 minutes
Email sent to bob@test.com
```

## 📧 Expected Notifications

Bob should receive:
- **Email** at bob@test.com with:
  - Subject: "Companion Mode Alert"
  - Alice's location link
  - Duration: 5 minutes
  
- **SMS** at +1234567890 (if Twilio working)

## 🎯 What You're Testing

✅ **Account creation** - Two separate users  
✅ **Emergency contacts** - Mutual contact setup  
✅ **Companion mode activation** - User A starts session  
✅ **Email notifications** - User B receives alert  
✅ **SMS notifications** - User B receives SMS  
✅ **Location tracking** - Backend stores locations  
✅ **Session management** - Timer, auto-stop, manual stop  

## ⚠️ Current Limitations

These features are **not yet implemented** (future work):

❌ Real-time in-app notifications for companion  
❌ Companion can't see Alice's live location in their app  
❌ No "Shared With Me" view in Bob's app  
❌ WebSocket real-time updates to companion  

**What DOES work:**
✅ Email/SMS notifications sent  
✅ Location tracked and stored  
✅ Sessions created in database  
✅ Timer and auto-stop  

## 🔄 Restart Instances

If you need to restart:

```powershell
# Stop both frontends (Ctrl+C in their terminals)

# Start instance 1
cd "c:\Users\odane\Desktop\Projects\Guardian-Link-main\Guardian-Link-main"
npm run dev

# Start instance 2 (new terminal)
cd "c:\Users\odane\Desktop\Projects\Guardian-Link-main\Guardian-Link-main"
npm run dev -- --port 5174
```

## 📚 Full Testing Guide

See [`MULTI_USER_TESTING.md`](./MULTI_USER_TESTING.md) for:
- Complete testing scenarios
- Advanced test cases
- Known issues and workarounds
- Future feature roadmap
- Testing checklist

## 🐛 Troubleshooting

**Issue**: Second instance won't start  
**Fix**: Port might be in use, try port 3002 or 5175

**Issue**: CORS error in browser  
**Fix**: Already fixed! CORS now allows ports 3001 and 5174

**Issue**: Can't receive notifications  
**Fix**: Check backend terminal for email/SMS errors

**Issue**: Both users get logged out  
**Fix**: Use different browsers or incognito mode

## 🎉 Ready to Test!

1. Open **http://localhost:3001/** in one browser window
2. Open **http://localhost:5174/** in another window (or incognito)
3. Follow the Quick Test steps above
4. Have fun testing multi-user companion mode! 🚀

---

**Note**: While Google Maps isn't working yet, companion mode functionality is fully operational - you'll see coordinates instead of maps.
