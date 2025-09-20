const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nama diperlukan'],
        trim: true,
        minlenght: [2, 'Nama harus minimal 2 karakter'],
        maxlenght: [50, 'Nama tidak boleh lebih 50 karakter']
    },
    email: {
        type: String,
        required: [true, 'Email diperlukan'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Password diperlukan'],
        minlenght: [6, 'Password harus minimal 6 karakter'],
        select: false // kalau ambil data user dari database, password tidak ikut ditampilkan secara default (lebih aman).
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    aktif: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true // MongoDB akan otomatis menambahkan field createdAt dan updatedAt.

});

// Hash password sebelum save ke database
userSchema.pre('save', async function(next){ // ini otomatis dijalankan sebelum dokumen disimpan ke database
    if (!this.isModified('password')) return next(); // Jika password TIDAK diubah
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method untuk compare password saat login
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
        
    } catch (error) {
        throw error;
    }
};

// Method untuk untuk membuat JWT(JSON Web Token) token 
userSchema.methods.generateToken = function() {
    const jwt = require('jsonwebtoken');

    return jwt.sign(
        {
            id: this._id,
            email: this.email,
            role: this.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRE || '7d'
        }
    );
};

module.exports = mongoose.model('User', userSchema);
