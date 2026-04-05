import mongoose from 'mongoose';
import Chat from './src/models/Chat.js';

async function cleanupDuplicates() {
  try {
    await mongoose.connect('mongodb://localhost:27017/skill-swap');
    console.log('Connected to MongoDB');

    // Find duplicates
    const duplicates = await Chat.aggregate([
      {
        $group: {
          _id: {
            participantKey: '$participantKey',
            matchId: '$matchId'
          },
          chats: { $push: '$_id' },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    console.log(`Found ${duplicates.length} duplicate groups`);

    for (const dup of duplicates) {
      const idsToDelete = dup.chats.slice(1); // Keep the first, delete the rest
      await Chat.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`Deleted ${idsToDelete.length} duplicates`);
    }

    console.log('Cleanup complete');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

cleanupDuplicates();