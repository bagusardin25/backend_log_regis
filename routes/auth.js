const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /api/auth/registrasi - registrasi user baru
router.post('/register', async (req, res) => {
  try {
    console.log("Request body:", req.body);
    const { name, email, password } = req.body;

    if (!name || !email || !password){
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Check if user already exist
    const existingUser = await User.findOne({ email });
    if (existingUser){
      return res.status(400).json({
        success: false,
        message: 'Pengguna dengan email ini sudah ada'
      });
    }

    // Create new user
    const user = new User({
      name, 
      email,
      password
    });

    await user.save();

    // Generate token
    const token = user.generateToken();

    res.status(201).json({
      success: true,
      message: 'Pengguna berhasil mendaftar',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    // Handle validation errors
    if (error.name == 'ValidationError') {
      const pesan = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: pesan[0]
      });
    }

    res.status(500).json({
      success: false,
      message: 'Kesalahan server saat pendaftaran',
      error: error.message
    });
  }
});
// POST /api/auth/registrasi - registrasi user baru

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email dan password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Harap isi email dan kata sandi'
      });
    }

    // find user by email (include password for comparison)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau kata sandi tidak valid'
      });
    }

    // Check if user is active
    if (!user.aktif){
      return res.status(401).json({
        success: false,
        message: 'Akun dinonaktifkan'
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email atau kata sandi tidak valid'
      });
    }

    // Generate token
    const token = user.generateToken();

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Kesalahan server saat login',
      error: error.message
    });
  }
});
// POST /api/auth/login - Login user

// GET /api/auth/me - Dapatkan profil pengguna saat ini
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token tidak diberikan'
      });
    }
        const token = authHeader.split(' ')[1]; // ✅ ambil token setelah Bearer

    // Verifikasi token
    const decode = jwt.verify(token, process.env.JWT_SECRET);

    // Menemukan user
    const user = await User.findById(decode.id);
    if (!user){
        return res.status (401).json ({
        success: false,
        message: 'Token tidak dapat ditemukan'
      });
    }
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          password: user.password,
          role: user.role,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    if (error.name == 'JsonWebTokenError') {
      return res.status(401).json ({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name == 'TokenExpiredError') {
      return res.status(401).json ({
        success: false,
        message: 'Token invalid'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});
// GET /api/auth/me - Dapatkan profil pengguna saat ini

module.exports = router;
