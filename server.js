// server.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const adminRoutes = require('./routes/admin'); // Import the admin routes
const User = require('./models/User'); // Import the User model

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = "2fdb6b5a5bfafa5ede903eb75d98bc90dd61e540061ed7836a64e42d7d871b08";

// MongoDB connection
mongoose.connect(
  "mongodb+srv://shawnbuckhannon:S8h7a6wN@mikes-sports0new.pn8ro.mongodb.net/?retryWrites=true&w=majority&appName=mikes-sports0new",
  { useNewUrlParser: true, useUnifiedTopology: true }
)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
// Login Page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login API
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Username and password are required.');
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send('User not found.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send('Invalid credentials.');
    }

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true }).redirect('/dashboard');
  } catch (error) {
    res.status(500).send('Error logging in.');
  }
});

// Admin Routes
app.use('/api/admin', adminRoutes); // Use the admin routes

// Dashboard (Black Screen)
app.get('/dashboard', (req, res) => {
  res.send('<body style="background-color: black;"></body>');
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;


// routes/admin.js
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const router = express.Router();

// Route to create a new user (admin only)
router.post('/add-user', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error });
  }
});

module.exports = router;
