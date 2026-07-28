import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'mini_erp_crm_super_secret_jwt_key_2026';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']).default('SALES')
});

// POST /api/auth/register - Register new user account
router.post('/register', async (req: Request, res: Response) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.errors });
    }

    const { name, email, password, role } = parseResult.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: `An account with email '${email}' already exists. Please login.` });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role
      }
    });

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    return res.status(201).json({
      message: 'Account registered successfully',
      token,
      user: payload
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Server error during registration', message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid email or password format', details: parseResult.error.errors });
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    return res.json({
      message: 'Login successful',
      token,
      user: payload
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error during authentication', message: error.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });
    return res.json({ user });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
