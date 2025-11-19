import { Request, Response } from 'express';
import { pool } from '../db/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req: Request, res: Response) => {
  const { name, email, password, role_id } = req.body;
  if (!name || !email || !password || !role_id)
    return res.status(400).json({ error: 'All fields required' });

  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const [existing]: any = await pool.query('SELECT * FROM users WHERE email=?', [email]);
    if (existing.length)
      return res.status(409).json({ error: 'Email already exists' });

    await pool.query(
      'INSERT INTO users (name, email, status, role_id, password) VALUES (?, ?, ?, ?, ?)',
      [name, email, 'Active', role_id, hashedPassword]
    );
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'All fields required' });

  try {
    const [users]: any = await pool.query('SELECT * FROM users WHERE email=?', [email]);
    if (!users.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ user_id: user.user_id, role_id: user.role_id }, process.env.JWT_SECRET as string, { expiresIn: '1d' });
    res.json({ token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
