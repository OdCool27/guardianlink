# GuardianLink - Personal Safety Application

A comprehensive personal safety application with SOS alerts, real-time location sharing, and emergency contact management.

## 🏗️ Project Structure

```
Guardian-Link-main/
├── Guardian-Link-main/          # Frontend (React + TypeScript + Vite)
│   ├── index.tsx                # Main React application
│   ├── index.html
│   ├── index.css
│   ├── package.json
│   └── vite.config.ts
│
└── backend-nodejs/              # Backend (Node.js + Express)
    ├── src/
    │   ├── config/              # Database configuration
    │   ├── middleware/          # Auth & error handling
    │   ├── models/              # Sequelize models
    │   ├── routes/              # API endpoints
    │   ├── utils/               # Email & SMS services
    │   └── server.js            # Main server file
    ├── .env                     # Environment variables
    ├── package.json
    └── README.md
```

## 🚀 Quick Start

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd Guardian-Link-main
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

The frontend will run at `http://localhost:5173`

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend-nodejs
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
- Edit `.env` file
- Add your Supabase database password

4. Run database schema:
- Execute the SQL script in Supabase SQL Editor

5. Start server:
```bash
npm run dev
```

The backend will run at `http://localhost:8080`

## ✅ Cleanup Complete

### Removed Files
- ✅ Spring Boot backend (had build issues)
- ✅ All Java source files
- ✅ Maven configuration files
- ✅ Lombok dependencies

### Current Stack
- ✅ **Frontend**: React 19 + TypeScript + Vite
- ✅ **Backend**: Node.js 18+ + Express
- ✅ **Database**: PostgreSQL (Supabase)
- ✅ **ORM**: Sequelize
- ✅ **Real-time**: Socket.IO
- ✅ **Email**: Nodemailer (Google SMTP)
- ✅ **SMS**: Twilio

## 📚 Documentation

### Frontend
- Multi-language support (7 languages)
- Elderly mode for accessibility
- Real-time location sharing
- SOS emergency system
- Custom status and profile

### Backend
See `backend-nodejs/README.md` for:
- Complete API documentation
- Setup instructions
- Testing examples
- Deployment guide

## 🔑 Features

- ✅ User authentication (JWT)
- ✅ Emergency contacts management
- ✅ One-tap SOS alerts
- ✅ Email & SMS notifications
- ✅ Companion mode (location sharing)
- ✅ Multi-user location viewing
- ✅ Alert history logging
- ✅ WebSocket real-time updates
- ✅ Public location viewing

## 🌐 API Base URL

Development: `http://localhost:8080`

## 📖 Next Steps

1. **Frontend**: Run `npm install` in `Guardian-Link-main/` folder
2. **Backend**: Run `npm install` in `backend-nodejs/` folder
3. **Database**: Add Supabase password to backend `.env`
4. **Database**: Execute SQL schema in Supabase
5. **Start**: Run both frontend and backend

## 📝 Important Notes

- The Spring Boot backend has been removed due to Lombok build issues
- Node.js backend provides the same features with easier setup
- All credentials are pre-configured in backend `.env` file
- Database schema SQL file is in `backend-nodejs/` folder

## 🆘 Support

For setup issues:
1. Check backend `SETUP_GUIDE.md`
2. Review backend `QUICK_REFERENCE.md`
3. See backend `MIGRATION_SUMMARY.md`

---

**Ready to build! 🛡️**
