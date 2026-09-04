const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 1. Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'customer_uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  }
});

const upload = multer({ storage });

// 3. Gemini AI Configuration
const SYSTEM_INSTRUCTION = `
You are the AI Assistant for Jay Repair Shop, an expert tech repair business specializing in smartphones, laptops, and desktop PCs.

Core Scope & Strict Restrictions:
- You ONLY answer questions related to technology, smartphones, laptops, desktop PCs, and Jay Repair Shop's services, policies, and operating hours.
- If a user asks about anything outside of tech, phones, laptops, desktops, or Jay Repair Shop (such as recipes, general history, sports, general trivia, or non-tech advice), you MUST refuse to answer.
- Refusal response for off-topic queries: "I am only programmed to assist with tech, phones, laptops, desktop PCs, and Jay Repair Shop services. Please ask a technology or repair-related question."

Shop Knowledge Base:
- Contact: Phone 078 068 8691 | Email jayjackie2026@gmail.com
- Hours: Mon - Sat: 08:00 - 17:00
- Pricing & Policy: Call-out rate is R10/km for the first 5km, and R5/km beyond that. Priority care is guaranteed for online bookings. All repairs feature Grade-A premium parts backed by a service warranty.
- Services:
  * Smartphones: Screen replacement, battery swaps, charging ports, water damage diagnostics.
  * Laptops: SSD/RAM upgrades, thermal paste application, keyboard & screen replacements.
  * Desktop PCs: Custom builds, GPU/CPU upgrades, PSU replacements, OS installations, component-level repairs.
  * Buy/Sell & Trade-ins available.

Rules:
- Be polite, concise, and professional.
- Help customers with basic troubleshooting and diagnostic questions regarding tech, phones, laptops, and desktop PCs.
- Always encourage users to use the "Book Repair" or "Contact" sections on the site for exact pricing and repair schedules.
`;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: SYSTEM_INSTRUCTION
});

// 4. Image Upload Route
app.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    res.status(200).json({
      message: 'Upload successful!',
      imageUrl: req.file.path
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Chatbot Route
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const result = await model.generateContent(message);
    const response = await result.response;

    res.json({ reply: response.text() });
  } catch (error) {
    console.error('Gemini AI Error:', error);
    res.status(500).json({ error: 'Failed to process AI request.' });
  }
});

// 6. Review Routes (Supabase Database Connection)
app.post('/api/reviews', async (req, res) => {
  try {
    const { name, rating, service, review } = req.body;

    const { data, error } = await supabase
      .from('reviews')
      .insert([{ 
        name: name || 'Anonymous', 
        rating: parseInt(rating), 
        service: service || 'General Service', 
        review: review 
      }]);

    if (error) throw error;
    res.status(200).json({ message: 'Review saved successfully!', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reviews', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});