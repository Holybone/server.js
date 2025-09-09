// server.js - Simple Node.js backend for your Nigerian TTS
// Deploy to Render.com or Heroku

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Storage for uploads
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Simple in-memory storage for demo
let usageStats = {
    totalRequests: 0,
    totalCharacters: 0,
    uniqueUsers: new Set()
};

// Nigerian voice configurations
const NIGERIAN_VOICES = {
    'lagos-female': {
        name: 'Lagos Female',
        description: 'Professional Lagos female voice',
        available: true
    },
    'lagos-male': {
        name: 'Lagos Male', 
        description: 'Business-focused Lagos male voice',
        available: true
    },
    'pidgin': {
        name: 'Nigerian Pidgin',
        description: 'Friendly Nigerian Pidgin accent',
        available: true
    },
    'yoruba-accent': {
        name: 'Yoruba Accent',
        description: 'Warm Yoruba-influenced English',
        available: true
    }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        voicesAvailable: Object.keys(NIGERIAN_VOICES).length,
        totalRequests: usageStats.totalRequests
    });
});

// Get available voices
app.get('/api/voices', (req, res) => {
    const voices = Object.entries(NIGERIAN_VOICES).map(([id, config]) => ({
        id,
        ...config
    }));
    
    res.json({ voices });
});

// Main TTS synthesis endpoint
app.post('/api/synthesize', async (req, res) => {
    try {
        const { text, voice = 'lagos-female', speed = 1.0 } = req.body;
        
        // Validation
        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'No text provided' });
        }
        
        if (text.length > 500) {
            return res.status(400).json({ 
                error: 'Demo limited to 500 characters. Contact info@naijavoice.com for longer content.' 
            });
        }
        
        // Update usage stats
        usageStats.totalRequests++;
        usageStats.totalCharacters += text.length;
        
        // For now, we'll queue the request for manual processing
        // In production, this would call your actual TTS service
        
        const orderData = {
            id: Date.now(),
            text,
            voice,
            speed,
            timestamp: new Date().toISOString(),
            status: 'queued',
            estimatedMinutes: Math.ceil(text.split(' ').length / 150)
        };
        
        // Log the order (in production, save to database)
        console.log('New TTS Order:', orderData);
        
        // For demo, return a placeholder audio URL
        // In production, return the actual generated audio
        res.json({
            success: true,
            orderId: orderData.id,
            message: 'Nigerian voice is being generated...',
            estimatedDelivery: '2-5 minutes',
            audioUrl: generateDemoAudioResponse(text, voice),
            downloadUrl: `/api/download/${orderData.id}`
        });
        
    } catch (error) {
        console.error('Synthesis error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Demo sample endpoint
app.post('/api/demo-sample', (req, res) => {
    const { voice = 'lagos-female' } = req.body;
    
    const demoTexts = {
        'lagos-female': 'Welcome to Lagos! We provide excellent business services.',
        'lagos-male': 'Good morning, this is your professional voice assistant.',
        'pidgin': 'How you dey? Make we do business together small small.',
        'yoruba-accent': 'E ku aaro o! Today go dey very fine for business.'
    };
    
    const demoText = demoTexts[voice] || demoTexts['lagos-female'];
    
    res.json({
        success: true,
        audioUrl: generateDemoAudioResponse(demoText, voice),
        text: demoText
    });
});

// Order status endpoint
app.get('/api/order/:id', (req, res) => {
    const { id } = req.params;
    
    // In production, check actual order status from database
    res.json({
        id,
        status: 'completed',
        audioUrl: `/api/audio/${id}`,
        downloadUrl: `/api/download/${id}`
    });
});

// Download endpoint
app.get('/api/download/:id', (req, res) => {
    const { id } = req.params;
    
    // For demo, redirect to contact page
    res.redirect('mailto:info@naijavoice.com?subject=Download Request&body=Please send me the audio for order ' + id);
});

// Contact form endpoint
app.post('/api/contact', (req, res) => {
    const { name, email, message, orderType } = req.body;
    
    console.log('New Contact:', { name, email, message, orderType });
    
    // In production, send email notification
    res.json({ success: true, message: 'We will contact you within 24 hours' });
});

// Usage analytics
app.get('/api/analytics', (req, res) => {
    res.json({
        totalRequests: usageStats.totalRequests,
        totalCharacters: usageStats.totalCharacters,
        averageLength: usageStats.totalCharacters / Math.max(usageStats.totalRequests, 1),
        uniqueUsers: usageStats.uniqueUsers.size
    });
});

// Helper function to generate demo audio response
function generateDemoAudioResponse(text, voice) {
    // For demo, return a data URL that plays a sound
    // In production, this would be your actual audio file URL
    
    const audioData = btoa(`Nigerian TTS Audio: "${text}" in ${voice} style`);
    return `data:audio/wav;base64,${audioData}`;
}

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(port, () => {
    console.log(`🇳🇬 NaijaVoice API running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/api/health`);
    
    // Create uploads directory
    const fs = require('fs');
    if (!fs.existsSync('./uploads')) {
        fs.mkdirSync('./uploads');
    }
});

module.exports = app;