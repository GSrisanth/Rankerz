import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'rankerz_super_secret_jwt_key_cse3009_nosql_project',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rankerz_db',
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  admin: {
    name: process.env.ADMIN_NAME || 'Prof. Harapriya Kar',
    email: process.env.ADMIN_EMAIL || 'admin@rankerz.edu',
    password: process.env.ADMIN_PASSWORD || 'AdminRankerz@2025',
    studentId: process.env.ADMIN_STUDENT_ID || 'FACULTY-001',
    department: process.env.ADMIN_DEPT || 'CSE',
  },
};
