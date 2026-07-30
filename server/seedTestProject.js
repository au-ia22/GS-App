/*
const admin = require('firebase-admin');
const axios = require('axios');
require('dotenv').config();

// Initialize Firebase
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

async function geocodeAddress(fullAddress) {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: fullAddress,
        key: process.env.GOOGLE_GEOCODING_API_KEY
      }
    });

    if (response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return { success: true, latitude: location.lat, longitude: location.lng };
    } else {
      return { success: false, error: 'No results found' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function addTestProject() {
  const projectId = 'G00-000';
  const projectName = 'GeoStructures';
  const address = '1000 W Ninth Ave Ste B King of Prussia, PA 19406';

  console.log(`Geocoding ${projectId}: ${address}`);

  const geocodeResult = await geocodeAddress(address);

  if (geocodeResult.success) {
    try {
      await db.collection('projects').doc(projectId).set({
        project_name: projectName,
        address: address,
        locations: [
          {
            address: address,
            latitude: geocodeResult.latitude,
            longitude: geocodeResult.longitude
          }
        ],
        radius_meters: 150,
        phases: []
      });

      console.log(`✓ ${projectId} seeded to Firestore`);
      console.log(`  Coordinates: ${geocodeResult.latitude}, ${geocodeResult.longitude}`);
    } catch (error) {
      console.log(`✗ Firestore write failed: ${error.message}`);
    }
  } else {
    console.log(`✗ Geocoding failed: ${geocodeResult.error}`);
  }

  process.exit(0);
}

addTestProject();
*/

const admin = require('firebase-admin');
const axios = require('axios');
require('dotenv').config();

// Initialize Firebase
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

async function geocodeAddress(fullAddress) {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: fullAddress,
        key: process.env.GOOGLE_GEOCODING_API_KEY
      }
    });

    if (response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return { success: true, latitude: location.lat, longitude: location.lng };
    } else {
      return { success: false, error: 'No results found' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function addTestProject() {
  const projectId = 'G00-001';
  const projectName = 'Silenta';
  const address = '1004 W Ninth Ave King of Prussia PA 19406';

  console.log(`Geocoding ${projectId}: ${address}`);

  const geocodeResult = await geocodeAddress(address);

  if (geocodeResult.success) {
    try {
      await db.collection('projects').doc(projectId).set({
        project_name: projectName,
        address: address,
        locations: [
          {
            address: address,
            latitude: geocodeResult.latitude,
            longitude: geocodeResult.longitude
          }
        ],
        radius_meters: 150,
        phases: []
      });

      console.log(`✓ ${projectId} seeded to Firestore`);
      console.log(`  Coordinates: ${geocodeResult.latitude}, ${geocodeResult.longitude}`);
    } catch (error) {
      console.log(`✗ Firestore write failed: ${error.message}`);
    }
  } else {
    console.log(`✗ Geocoding failed: ${geocodeResult.error}`);
  }

  process.exit(0);
}

addTestProject();