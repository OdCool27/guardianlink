# GuardianLink Backend - Node.js/Express

A comprehensive Node.js/Express backend for the GuardianLink personal safety application with real-time location sharing, SOS alerts, and emergency contact management.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL database (Supabase account recommended)
- Google Gmail account with App Password
- Twilio account with phone number

### Installation

1. **Install Dependencies**

```bash
cd backend-nodejs
npm install
```

2. **Configure Environment**

Copy `.env.example` to `.env` and update with your credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your:
- Supabase database password
- JWT secret (generate a random 256+ bit string)
- Google SMTP credentials (already configured)
- Twilio credentials (already configured)

3. **Run Database Schema**

Execute the `database_schema.sql` file in your Supabase SQL Editor to create all necessary tables.

4. **Start the Server**

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start at `http://localhost:8080`

## ✅ Features

- ✅ **User Authentication** - JWT-based secure authentication
- ✅ **Emergency Contacts** - CRUD operations for managing contacts
- ✅ **SOS System** - One-tap emergency alerts with email & SMS
- ✅ **Companion Mode** - Real-time location sharing with WebSocket
- ✅ **Multi-user Support** - View all locations shared with you
- ✅ **Alert History** - Comprehensive event logging
- ✅ **Notifications** - Email (Nodemailer) & SMS (Twilio)
- ✅ **Security** - Helmet.js, CORS, password hashing
- ✅ **Validation** - Express-validator for input validation
- ✅ **Error Handling** - Centralized error management

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### User Management
- `GET /api/user/me` - Get current user profile
- `PUT /api/user/me` - Update profile
- `POST /api/user/password` - Change password
- `PUT /api/user/settings` - Update settings

### Emergency Contacts
- `GET /api/contacts` - List all contacts
- `POST /api/contacts` - Create contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

### SOS System
- `POST /api/sos/activate` - Activate emergency
- `POST /api/sos/mark-safe` - Mark as safe

### Companion Mode
- `POST /api/companion/start` - Start session
- `POST /api/companion/stop` - Stop session
- `GET /api/companion/active` - Get active session
- `POST /api/companion/location` - Update location
- `GET /api/companion/shared-with-me` - View shared sessions

### Alert History
- `GET /api/history` - Get user history
- `GET /api/history/:id` - Get specific alert

### Public Location (No Auth)
- `GET /location/:sessionId` - View live location
- `GET /location/:sessionId/history` - Location history

### WebSocket
- Connect to `http://localhost:8080` with Socket.IO
- Join session: `socket.emit('join-session', sessionId)`
- Listen for updates: `socket.on('location-update', callback)`

## 🗄️ Database

Uses Sequelize ORM with PostgreSQL (Supabase). Models:
- `User` - User accounts and settings
- `EmergencyContact` - Emergency contact information
- `CompanionSession` - Location sharing sessions
- `LocationUpdate` - GPS coordinates history
- `AlertHistory` - Event logs

## 🔐 Security

- Passwords hashed with bcryptjs (10 rounds)
- JWT tokens with configurable expiration
- Helmet.js for security headers
- CORS configured for specific origins
- Input validation with express-validator
- SQL injection prevention via Sequelize ORM

## 📧 Notifications

### Email (Nodemailer + Google SMTP)
- Professional HTML templates
- SOS alerts (red theme)
- Companion mode (blue theme)
- Safe status (green theme)

### SMS & WhatsApp (Twilio)
- Emergency text messages
- Companion mode notifications
- Safe status updates

## 🔌 WebSocket Integration

Real-time location updates using Socket.IO:

```javascript
const socket = io('http://localhost:8080');

// Join a session
socket.emit('join-session', sessionId);

// Listen for location updates
socket.on('location-update', (location) => {
  console.log('New location:', location);
});
```

## 📦 Project Structure

```
backend-nodejs/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── EmergencyContact.js
│   │   ├── CompanionSession.js
│   │   ├── LocationUpdate.js
│   │   ├── AlertHistory.js
│   │   └── index.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── user.js
│   │   ├── contacts.js
│   │   ├── sos.js
│   │   ├── companion.js
│   │   ├── history.js
│   │   └── location.js
│   ├── utils/
│   │   ├── emailService.js
│   │   └── smsService.js
│   └── server.js
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🧪 Testing

Test the API with cURL or Postman:

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@example.com","password":"Test123!@#"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'

# Get user profile (with token)
curl http://localhost:8080/api/user/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🌐 Deployment

### Environment Variables for Production

Set these in your hosting platform:
- `NODE_ENV=production`
- `PORT=8080`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET` (use a strong random string)
- `SMTP_USER`, `SMTP_PASS`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- `APP_BASE_URL` (your production URL)
- `CORS_ORIGIN` (your frontend URLs)

### Deployment Platforms

**Heroku:**
```bash
heroku create guardianlink-api
git push heroku main
```

**Railway:**
```bash
railway login
railway init
railway up
```

**Render, AWS, GCP, Azure:**
Upload files and configure environment variables in the platform dashboard.

## 🐛 Troubleshooting

### Database Connection Fails
- Verify Supabase password in `.env`
- Check IP allowlist in Supabase settings
- Ensure SSL is enabled

### Email Not Sending
- Verify Gmail App Password (16 chars)
- Enable 2FA on Gmail account
- Check SMTP settings

### SMS Not Sending
- Verify Twilio credentials
- Check phone number format (+country code)
- Ensure trial account has credits

## 📄 License

Apache 2.0

## 🆘 Support

For issues:
1. Check server console logs
2. Verify environment variables
3. Test database connection
4. Review API error responses

---

**Ready to keep people safe! 🛡️**
