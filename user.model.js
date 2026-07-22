import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  profile: {
    photo: {
      url: { type: String, default: null },
      uploadedAt: { type: Date, default: null },
      fileName: { type: String, default: null },
      fileSize: { type: Number, default: null }
    },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    bio: { type: String, default: '' },
    phone: { type: String, default: '' }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;