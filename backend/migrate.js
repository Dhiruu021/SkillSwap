import mongoose from 'mongoose';
import Chat from './src/models/Chat.js';

async function migrateChats() {
  try {
    await mongoose.connect('mongodb://localhost:27017/skill-swap');
    console.log('Connected to MongoDB');

    const chats = await Chat.find({});
    for (const chat of chats) {
      if (!chat.participantKey) {
        chat.participants.sort((a, b) => a.toString().localeCompare(b.toString()));
        chat.participantKey = chat.participants.map(id => id.toString()).join(',');
        await chat.save();
        console.log(`Updated chat ${chat._id}`);
      }
    }

    console.log('Migration complete');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

migrateChats();