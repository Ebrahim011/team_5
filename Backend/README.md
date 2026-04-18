# Class Track Backend

A production-ready Node.js backend application built with Express.js following MVC architecture.

## 🏗️ Architecture

This project follows the **MVC (Model-View-Controller)** pattern with additional layers for better separation of concerns:

```
src/
├── config/        # Database connection, environment config
├── models/        # Mongoose schemas (data layer)
├── controllers/   # Business logic handlers
├── routes/        # Express route definitions
├── middlewares/   # Auth, validation, error handling
├── services/      # Reusable business logic
├── utils/         # Helper functions
└── app.js         # Express app configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create environment file:
   ```bash
   cp .env.example .env
   ```
4. Update `.env` with your configuration
5. Start the development server:
   ```bash
   npm run dev
   ```

## 📚 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/profile` | Get current user | Yes |
| POST | `/api/auth/logout` | Logout user | Yes |

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | development |
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | Token expiration | 7d |

## 🔒 Security Features

- **Helmet** - Sets security HTTP headers
- **CORS** - Configurable cross-origin requests
- **bcrypt** - Password hashing
- **JWT** - Stateless authentication

## 🚀 Deploying to Vercel

لرفع الـ Backend على Vercel، اتبع الخطوات في ملف [VERCEL_SETUP.md](./VERCEL_SETUP.md)

**ملخص سريع:**
1. أضف متغيرات البيئة في Vercel Dashboard:
   - `MONGODB_URI` (مطلوب)
   - `JWT_SECRET` (مطلوب)
   - `CORS_ORIGINS` (اختياري)
2. تأكد من إعداد MongoDB Atlas Network Access
3. ارفع المشروع على Vercel
4. استخدم `/api` كـ base path للـ API
- **Input Validation** - Request validation with express-validator

## 🔄 Switching to PostgreSQL

To use PostgreSQL instead of MongoDB:

1. Install Sequelize:
   ```bash
   npm uninstall mongoose
   npm install sequelize pg pg-hstore
   ```

2. Update `src/config/database.js` with Sequelize setup
3. Convert Mongoose models to Sequelize models
4. Update environment variables with PostgreSQL connection string

## 📝 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload

## 📄 License

ISC
