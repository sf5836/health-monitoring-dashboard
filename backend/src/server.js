const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');

const env = require('./config/env');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const doctorRoutes = require('./routes/doctors');
const vitalRoutes = require('./routes/vitals');
const blogRoutes = require('./routes/blogs');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');
const appointmentRoutes = require('./routes/appointments');
const prescriptionRoutes = require('./routes/prescriptions');
const chatHandler = require('./sockets/chatHandler');
const notificationHandler = require('./sockets/notificationHandler');
const { setIO } = require('./sockets/socketState');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.clientOrigin,
    credentials: true
  }
});

setIO(io);

app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'healthmonitorpro-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/vitals', vitalRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);

chatHandler(io);
notificationHandler(io);

app.use(errorHandler);

connectDB()
  .catch((error) => {
    console.error('[db] connection failed:', error.message);
  })
  .finally(() => {
    server.listen(env.port, () => {
      console.log('[server] running on http://localhost:' + env.port);
    });
  });