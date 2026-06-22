import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Score } from '../models/Score.js';
import { AppError } from '../middleware/errorHandler.js';
import { sanitize, sanitizeEmail, validateEmail, validatePassword } from '../utils/validation.js';

const SALT_ROUNDS = 12;

function toSafeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    college: user.college || '',
    avatar: user.avatar || user.name.charAt(0).toUpperCase(),
    streak: user.streak || 0,
    createdAt: user.createdAt,
  };
}

function createToken(user) {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: '7d' }
  );
}

export async function signup(req, res, next) {
  try {
    const { name, email, password, college = '', role } = req.body;

    // Input validation
    const sanitizedName = sanitize(name);
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedCollege = sanitize(college);

    if (!sanitizedName || sanitizedName.length < 2 || sanitizedName.length > 100) {
      throw new AppError('Name must be between 2 and 100 characters', 'VALIDATION_ERROR', 400);
    }

    if (!validateEmail(sanitizedEmail)) {
      throw new AppError('Invalid email format', 'VALIDATION_ERROR', 400);
    }

    if (!validatePassword(password)) {
      throw new AppError('Password must be at least 8 characters with uppercase, lowercase, and numbers', 'VALIDATION_ERROR', 400);
    }

    if (role && role !== 'student') {
      throw new AppError('Admin signup is not allowed', 'AUTH_FORBIDDEN', 403);
    }

    if (env.adminEmail && sanitizedEmail.toLowerCase() === env.adminEmail.toLowerCase()) {
      throw new AppError('Admin signup is not allowed. Use admin login.', 'AUTH_FORBIDDEN', 403);
    }

    const existing = await User.findOne({ email: sanitizedEmail.toLowerCase() });
    if (existing) {
      throw new AppError('Email already registered', 'AUTH_CONFLICT', 409);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      name: sanitizedName,
      email: sanitizedEmail.toLowerCase(),
      passwordHash,
      role: 'student',
      college: sanitizedCollege,
      avatar: sanitizedName.charAt(0).toUpperCase(),
      streak: 0,
    });

    console.log(`[AUTH SUCCESS] User registered: ${sanitizedEmail}`);
    return res.status(201).json({ user: toSafeUser(user), token: createToken(user) });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 'VALIDATION_ERROR', 400);
    }

    const sanitizedEmail = sanitizeEmail(email);
    if (!validateEmail(sanitizedEmail)) {
      throw new AppError('Invalid email format', 'VALIDATION_ERROR', 400);
    }

    const user = await User.findOne({ email: sanitizedEmail.toLowerCase() });
    if (!user) {
      throw new AppError('Invalid email or password', 'UNAUTHORIZED', 401);
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new AppError('Invalid email or password', 'UNAUTHORIZED', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    console.log(`[AUTH SUCCESS] User logged in: ${sanitizedEmail}`);
    return res.json({ user: toSafeUser(user), token: createToken(user) });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AppError('User not found', 'NOT_FOUND', 404);
    }
    return res.json({ user: toSafeUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function listUsers(req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      throw new AppError('Admin access required', 'AUTH_FORBIDDEN', 403);
    }
    const users = await User.find().sort({ createdAt: -1 });
    return res.json({ users: users.map(toSafeUser) });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin' && id !== req.user.id) {
      throw new AppError('Cannot delete another user', 'AUTH_FORBIDDEN', 403);
    }

    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found', 'NOT_FOUND', 404);
    }

    if (user.role === 'admin') {
      throw new AppError('Admin user deletion is not allowed', 'AUTH_FORBIDDEN', 403);
    }

    await User.findByIdAndDelete(id);
    await Score.deleteMany({ userId: id });

    console.log(`[AUTH SUCCESS] User deleted: ${user.email} (ID: ${id})`);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}