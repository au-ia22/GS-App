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

const { Firestore } = require('@google-cloud/firestore');

const db = new Firestore({
  projectId: 'condition-survey-9b5b9'
});

module.exports = db;