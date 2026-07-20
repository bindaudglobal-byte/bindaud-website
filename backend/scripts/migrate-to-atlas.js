const { MongoClient } = require('mongodb');

const localUri = 'mongodb://127.0.0.1:27017';
const atlasUri = 'mongodb+srv://bindaudglobal_db_user:Bindaud213@cluster0.qpdqxe3.mongodb.net';
const dbName = 'bindaud';

(async () => {
  const localClient = new MongoClient(localUri);
  const atlasClient = new MongoClient(atlasUri);

  try {
    console.log('Connecting to local MongoDB...');
    await localClient.connect();
    console.log('Connecting to Atlas MongoDB...');
    await atlasClient.connect();

    const localDb = localClient.db(dbName);
    const atlasDb = atlasClient.db(dbName);

    const collections = await localDb.listCollections().toArray();
    const names = collections.map(c => c.name).filter(n => !n.startsWith('system.'));
    console.log('Collections to migrate:', names);

    for (const name of names) {
      const docs = await localDb.collection(name).find().toArray();
      console.log(`Migrating ${name}: ${docs.length} docs`);
      if (docs.length) {
        await atlasDb.collection(name).deleteMany({});
        await atlasDb.collection(name).insertMany(docs);
        const newCount = await atlasDb.collection(name).countDocuments();
        console.log(`${name} migrated, new count: ${newCount}`);
      }
    }

    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await localClient.close();
    await atlasClient.close();
  }
})();
