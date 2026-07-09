import mongoose from 'mongoose';
import crypto from 'crypto';

// ---------------------- MONGOOSE USER SCHEMA ----------------------

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
      url: {
        type: String,
        default: null
      },
      uploadedAt: {
        type: Date,
        default: null
      },
      fileName: {
        type: String,
        default: null
      },
      fileSize: {
        type: Number,
        default: null
      }
    },
    firstName: {
      type: String,
      default: ''
    },
    lastName: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const hashedPassword = crypto.createHash('sha256').update(this.password).digest('hex');
  this.password = hashedPassword;
  this.updatedAt = Date.now();
  next();
});

// Compare password method
userSchema.methods.comparePassword = function(plainPassword) {
  const hashedPassword = crypto.createHash('sha256').update(plainPassword).digest('hex');
  return this.password === hashedPassword;
};

// Get user profile without password
userSchema.methods.getPublicProfile = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Update profile photo
userSchema.methods.updateProfilePhoto = function(photoUrl, fileName, fileSize) {
  this.profile.photo = {
    url: photoUrl,
    uploadedAt: new Date(),
    fileName: fileName,
    fileSize: fileSize
  };
  return this.save();
};

// Create and export User model
const User = mongoose.model('User', userSchema);
export default User;
  return Array.from(users.values()).some(u => u.email === email)