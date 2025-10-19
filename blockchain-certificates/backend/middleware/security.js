const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// =================================================================
// SECURITY HEADERS
// =================================================================
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});

// =================================================================
// CORS OPTIONS
// =================================================================
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5000',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5000'
        ];
        
        // Allow requests with no origin (like mobile apps, Postman, etc.)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// =================================================================
// SANITIZE REQUEST
// =================================================================
const sanitizeRequest = (req, res, next) => {
    // Remove any keys that contain $ or . to prevent NoSQL injection
    const sanitizeObject = (obj) => {
        for (let key in obj) {
            if (key.includes('$') || key.includes('.')) {
                delete obj[key];
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        }
    };

    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);

    next();
};

// =================================================================
// REQUEST LOGGER
// =================================================================
const requestLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
};

// =================================================================
// PREVENT PARAMETER POLLUTION
// =================================================================
const preventParameterPollution = hpp({
    whitelist: ['tokenId', 'name', 'description'] // Add parameters that can be duplicated
});

// =================================================================
// DETECT SUSPICIOUS ACTIVITY
// =================================================================
const detectSuspiciousActivity = (req, res, next) => {
    const suspiciousPatterns = [
        /(\$|\.\.\/|<script|javascript:|onerror=|onload=)/i,
        /(union|select|insert|update|delete|drop|create|alter|exec|execute)/i
    ];

    const checkForPatterns = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                for (let pattern of suspiciousPatterns) {
                    if (pattern.test(obj[key])) {
                        console.warn(`⚠️  Suspicious activity detected from IP: ${req.ip}`);
                        console.warn(`   Pattern: ${pattern}`);
                        console.warn(`   Value: ${obj[key]}`);
                        return true;
                    }
                }
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                if (checkForPatterns(obj[key])) return true;
            }
        }
        return false;
    };

    if (req.body && checkForPatterns(req.body)) {
        return res.status(400).json({
            success: false,
            message: 'Suspicious activity detected. Request blocked.'
        });
    }

    if (req.query && checkForPatterns(req.query)) {
        return res.status(400).json({
            success: false,
            message: 'Suspicious activity detected. Request blocked.'
        });
    }

    next();
};

module.exports = {
    securityHeaders,
    corsOptions,
    sanitizeRequest,
    requestLogger,
    preventParameterPollution,
    detectSuspiciousActivity
};