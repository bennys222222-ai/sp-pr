const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const DATA_FILE = path.join(__dirname, '../public/data/ufc-data.json');

// GET /api/ufc/data
router.get('/data', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading UFC data:', error);
    res.status(500).json({ error: 'Failed to load UFC data' });
  }
});

module.exports = router;