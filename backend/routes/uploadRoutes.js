const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Initialize Supabase Client (Requires SUPABASE_URL and SUPABASE_KEY in .env)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Use memory storage since we will stream the buffer directly to Supabase
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!supabase) {
      console.error("Missing SUPABASE_URL or SUPABASE_KEY in environment variables.");
      return res.status(500).json({ error: 'Storage not configured on server' });
    }

    const file = req.file;
    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}${fileExt}`;
    const filePath = `logos/${fileName}`;

    // Upload the file buffer to Supabase Storage
    const { data, error } = await supabase.storage
      .from('uploads') // You MUST create a public bucket named "uploads" in Supabase
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return res.status(500).json({ error: 'Failed to upload to cloud storage' });
    }

    // Get the public URL for the newly uploaded file
    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    // Return the Supabase URL instead of a local URL
    res.json({ url: urlData.publicUrl });
  } catch (err) {
    console.error('Unexpected error in upload route:', err);
    res.status(500).json({ error: 'Internal server error during upload' });
  }
});

module.exports = router;
