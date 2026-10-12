import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { config } from '../config/env.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  studentIdCode: z.string().min(3, 'Student ID / Registration number required'),
  department: z.enum(['CSE', 'ECE', 'AI&ML', 'Data Science', 'IT', 'Mechanical', 'Civil']),
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Helper to sign JWT
function signToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const parseResult = RegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.errors,
      });
      return;
    }

    const { name, email, password, studentIdCode, department } = parseResult.data;

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: 'student', // Public registration is strictly student role
      studentIdCode,
      department,
    });

    const token = signToken(user._id.toString(), user.role);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.errors,
      });
      return;
    }

    const { email, password } = parseResult.data;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const token = signToken(user._id.toString(), user.role);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, department } = req.body;
    const user = req.user!;

    if (name) user.name = name.trim();
    if (department) user.department = department;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
