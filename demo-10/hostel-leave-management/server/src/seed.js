import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const preferEnvPath = fs.existsSync(path.resolve(process.cwd(), '.env')) ? '.env' : 'env.local';
dotenv.config({ path: preferEnvPath });

const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
if (!mongoUri) {
  console.error('MONGO_URL is not set');
  process.exit(1);
}

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

async function main() {
  await mongoose.connect(mongoUri);
  const student = {
    username: 'student',
    password_hash: '123',
    full_name: 'John Doe',
    roll_number: 'CS2021001',
    register_number: 'REG123',
    department: 'CSE',
    room_number: 'B-204',
    contact: '+91 9876543210'
  };
  const warden = { username: 'warden', password_hash: '123' };
  // Ensure base record exists
  await Student.updateOne({ username: student.username }, { $setOnInsert: student }, { upsert: true });
  // Force-set new fields on existing records too
  await Student.updateOne(
    { username: student.username },
    { $set: { room_number: student.room_number, contact: student.contact } }
  );
  await Warden.updateOne({ username: warden.username }, { $setOnInsert: warden }, { upsert: true });
  console.log('Seed completed');
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });


