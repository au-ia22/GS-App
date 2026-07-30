const admin = require('firebase-admin');
require('dotenv').config();

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

async function createOfficeProject() {
  await db.collection('projects').doc('OFFICE-TEST').set({
    project_name: 'GeoStructures Office - King of Prussia',
    latitude: 40.1018113,
    longitude: -75.4126032,
    radius_meters: 150,
    phases: []
  });

  console.log('Office test project created: OFFICE-TEST');
  process.exit(0);
}

createOfficeProject().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});