const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const path = require('path');

// Load environment variables (use absolute path so it works no matter where node is started from)
dotenv.config({ path: path.join(__dirname, '.env'), override: true });

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const mongoUri = process.env.MONGO_URI;
const mongoHost = (() => {
  try {
    const withoutProtocol = mongoUri.split('://')[1] || mongoUri;
    const afterAt = withoutProtocol.includes('@') ? withoutProtocol.split('@').pop() : withoutProtocol;
    return (afterAt.split('/')[0] || '').split('?')[0];
  } catch {
    return 'unknown-host';
  }
})();

console.log(`[db] MONGO_URI ${process.env.MONGO_URI ? 'loaded' : 'missing'}; connecting to ${mongoHost}`);

mongoose.connect(mongoUri)
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

// Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all for dev
    methods: ["GET", "POST"]
  }
});

// Socket Logic
const socketHandler = require('./socket');
socketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
