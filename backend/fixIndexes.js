import mongoose from 'mongoose';
import Chat from './src/models/Chat.js';

async function fixIndexes() {
  try {
    await mongoose.connect('mongodb://localhost:27017/skill-swap');
    console.log('Connected to MongoDB');

    // Drop old index if exists
    try {
      await Chat.collection.dropIndex({ participants: 1, matchId: 1 });
      console.log('Dropped old index');
    } catch (e) {
      console.log('Old index not found or already dropped');
    }

    // Create new index
    await Chat.collection.createIndex({ participantKey: 1, matchId: 1 }, { unique: true, sparse: true });
    console.log('Created new index');

    console.log('Indexes fixed');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixIndexes();