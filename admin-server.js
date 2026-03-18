require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Static admin frontend
app.use(express.static(path.join(__dirname, 'admin-frontend')));

// Admin API routes
app.use('/admin/api', require('./routes/admin'));

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/admin/api')) return res.status(404).json({ error: 'not found' });
  res.sendFile(path.join(__dirname, 'admin-frontend', 'index.html'));
});

const PORT = process.env.ADMIN_PORT || 6701;
app.listen(PORT, () => console.log(`YYClaw Admin running on http://localhost:${PORT}`));
