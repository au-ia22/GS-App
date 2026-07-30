const admin = require('firebase-admin');
require('dotenv').config();

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

async function countDocuments() {
  const snapshot = await db.collection('projects').get();
  console.log(`Total documents in 'projects' collection: ${snapshot.size}`);
  process.exit(0);
}

countDocuments().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});