/*
const { Firestore } = require('@google-cloud/firestore');
const path = require('path');

const keyPath = path.join(__dirname, 'serviceAccountKey.json');

const db = new Firestore({
  keyFilename: keyPath,
  projectId: 'condition-survey-9b5b9'
});

module.exports = db;
*/

/*
const { Firestore } = require('@google-cloud/firestore');

const db = new Firestore({
  projectId: 'condition-survey-9b5b9'
});

module.exports = db;
*/

const { Firestore } = require('@google-cloud/firestore');

console.log('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
console.log('Initializing Firestore with projectId: condition-survey-9b5b9');

const db = new Firestore({
  projectId: 'condition-survey-9b5b9'
});

console.log('Firestore initialized successfully');

module.exports = db;