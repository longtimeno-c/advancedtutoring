require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key',
  sessionSecret: process.env.SESSION_SECRET || 'your_session_secret_key',
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_PASSWORD || 'admin_password',
    accessCode: process.env.ADMIN_ACCESS_CODE || 'ADMIN123'
  },
  app: {
    name: process.env.APP_NAME || 'Advanced Tutoring',
    url: process.env.APP_URL || 'http://localhost:3000'
  }
}; 