const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

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

// 1. Define SYSTEM_INSTRUCTION first
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

// 2. Initialize Gemini AI using SYSTEM_INSTRUCTION
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: SYSTEM_INSTRUCTION
});

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

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: message,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION
      }
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error('Gemini AI Error:', error);
    res.status(500).json({ error: 'Failed to process AI request.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});