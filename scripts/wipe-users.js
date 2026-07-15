import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Define Minimal User schema
const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema);

async function wipeUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');
    
    console.log('Wiping all users...');
    const result = await User.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} users.`);
    
    await mongoose.disconnect();
    console.log('Disconnected.');
  } catch (err) {
    console.error('Error wiping users:', err);
    process.exit(1);
  }
}

wipeUsers();
