const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    profession: {
      type: String,
      required: true,
      enum: ['Psychologue', 'Psychiatre', 'Psychothérapeute', 'Autre'],
    },
    workLocation: {
      type: String,
      required: false,
      default: '',
    },
    consultationType: {
    type: String,
    enum: ['online', 'inPerson', 'both'],
    default: 'both',
    },
    phone: {
      type: String,
      trim: true,
    },
    calendarIntegration: {
      type: {
        type: String,
        enum: ['doctolib', 'medoucine', 'calendly', 'google', 'systemeio', 'none'],
        default: 'none',
      },
      calendarUrl: String,
      apiKey: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);