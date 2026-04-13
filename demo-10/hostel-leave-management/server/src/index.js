import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const preferEnvPath = fs.existsSync(path.resolve(process.cwd(), '.env')) ? '.env' : 'env.local';
dotenv.config({ path: preferEnvPath });

const app = express();
app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
if (!mongoUri) {
  console.error('MONGO_URL is not set');
  process.exit(1);
}

await mongoose.connect(mongoUri);

const studentSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password_hash: { type: String, required: true },
  full_name: String,
  roll_number: String,
  register_number: String,
  department: String,
  room_number: String,
  // Prefer 'contact' but keep older 'contact_number' for backward compatibility
  contact: String,
  contact_number: String
}, { collection: 'students' });

const wardenSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password_hash: { type: String, required: true }
}, { collection: 'wardens' });

const Student = mongoose.model('Student', studentSchema);
const Warden = mongoose.model('Warden', wardenSchema);

app.get('/api/health', async (req, res) => {
  try {
    const state = mongoose.connection.readyState; // 1 = connected
    res.json({ ok: state === 1 });
  } catch (err) {
    res.status(500).json({ error: 'db_unavailable' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  try {
    const Model = role === 'warden' ? Warden : Student;
    const user = await Model.findOne({ username }).lean();
    if (!user) return res.status(401).json({ error: 'invalid_credentials' });

    const { default: bcrypt } = await import('bcrypt');
    const isMatch = user.password_hash?.startsWith('$2')
      ? await bcrypt.compare(password, user.password_hash)
      : password === user.password_hash;
    if (!isMatch) return res.status(401).json({ error: 'invalid_credentials' });

    res.json({ success: true, userId: String(user._id), username: user.username, role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

app.get('/api/students/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const doc = await Student.findOne({ username }).lean();
    if (!doc) return res.status(404).json({ error: 'not_found' });
    return res.json({
      id: String(doc._id),
      username: doc.username,
      studentName: doc.full_name || '',
      rollNumber: doc.roll_number || '',
      registerNumber: doc.register_number || '',
    department: doc.department || '',
    // include common variants to help frontend mapping
    room_number: doc.room_number || '',
    contact: doc.contact || doc.contact_number || ''
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

app.get('/api/wardens/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const doc = await Warden.findOne({ username }).lean();
    if (!doc) return res.status(404).json({ error: 'not_found' });
    return res.json({
      id: String(doc._id),
      username: doc.username
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

const port = Number(process.env.PORT || 5000);
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});


