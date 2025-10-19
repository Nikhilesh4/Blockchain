require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');

// Import middleware
const { 
    errorHandler, 
    notFoundHandler, 
    multerErrorHandler,
    logErrors,
    corsErrorHandler
} = require('./middleware/errorHandler');

const {
    securityHeaders,
    corsOptions,
    sanitizeRequest,
    requestLogger,
    preventParameterPollution,
    detectSuspiciousActivity
} = require('./middleware/security');

const {
    generalLimiter
} = require('./middleware/rateLimit');

// Import routes
const certificatesRouter = require('./routes/certificates');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================================
// SECURITY MIDDLEWARE (Apply before routes)
// ============================================================================

// Security headers
app.use(securityHeaders);

// CORS configuration
app.use(cors(corsOptions));

// Request logging
if (process.env.NODE_ENV !== 'test') {
    app.use(requestLogger);
}

// Rate limiting (general)
app.use('/api/', generalLimiter);

// Body parsers
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(sanitizeRequest);
app.use(preventParameterPollution);
app.use(detectSuspiciousActivity);

// ============================================================================
// HEALTH CHECK ROUTES
// ============================================================================

// Root health check
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Blockchain Certificate API Server',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            api: '/api/certificates'
        }
    });
});

// API health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// ============================================================================
// API ROUTES
// ============================================================================

app.use('/api/certificates', certificatesRouter);

// ============================================================================
// ERROR HANDLING MIDDLEWARE (Apply after routes)
// ============================================================================

// Handle CORS errors
app.use(corsErrorHandler);

// Handle multer errors
app.use(multerErrorHandler);

// Log errors
app.use(logErrors);

// Handle 404 - Route not found
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = app.listen(PORT, () => {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 BLOCKCHAIN CERTIFICATE SYSTEM - BACKEND SERVER');
    console.log('='.repeat(70));
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📝 Contract Address: ${process.env.CONTRACT_ADDRESS || 'Not configured'}`);
    console.log(`🔗 RPC URL: ${process.env.RPC_URL || 'http://127.0.0.1:8545'}`);
    console.log('='.repeat(70));
    console.log('\n📋 Available Endpoints:');
    console.log('   GET  /                           - API Info');
    console.log('   GET  /health                     - Health Check');
    console.log('   GET  /api/certificates/health    - Detailed Health');
    console.log('   POST /api/certificates/upload-image');
    console.log('   POST /api/certificates/generate-metadata');
    console.log('   POST /api/certificates/mint');
    console.log('   GET  /api/certificates/:tokenId');
    console.log('   GET  /api/certificates/verify/:tokenId');
    console.log('   POST /api/certificates/revoke/:tokenId');
    console.log('   GET  /api/certificates/stats/overview');
    console.log('='.repeat(70));
    console.log('\n✅ Server is ready to accept requests');
    console.log('   Press Ctrl+C to stop\n');
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

const gracefulShutdown = (signal) => {
    console.log(`\n\n🛑 ${signal} received. Starting graceful shutdown...`);
    
    server.close(() => {
        console.log('✅ HTTP server closed');
        console.log('👋 Goodbye!\n');
        process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('⚠️  Forcing shutdown after timeout');
        process.exit(1);
    }, 10000);
};

// Handle graceful shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
    console.error('Error:', error.name, error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 UNHANDLED REJECTION! Shutting down...');
    console.error('Reason:', reason);
    console.error('Promise:', promise);
    process.exit(1);
});

module.exports = app;