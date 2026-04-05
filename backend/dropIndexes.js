import mongoose from 'mongoose';
import Chat from './src/models/Chat.js';

async function dropIndexes() {
  try {
    await mongoose.connect('mongodb://localhost:27017/skill-swap');
    console.log('Connected to MongoDB');

    await Chat.collection.dropIndexes();
    console.log('Dropped all indexes on Chat');

    console.log('Done');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

dropIndexes();