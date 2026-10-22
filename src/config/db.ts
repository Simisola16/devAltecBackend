import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
dotenv.config();

export const connectDB = async (): Promise<void> => {
  const uri =
    process.env.MONGODB_URI ||
    'mongodb+srv://olamilekanmuhayad_db_user:aKqWBYlFiglZTB42@devaltecv.zhhbtid.mongodb.net/devaltec?retryWrites=true&w=majority&appName=DevAltecV';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    process.exit(1);
  }
};
