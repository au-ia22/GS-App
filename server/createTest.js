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

async function createOverlappingProjectsTest() {
  console.log('Creating two overlapping projects test...\n');

  const address1 = '1000 W Ninth Ave, King of Prussia, PA';
  const address2 = '1004 W Ninth Ave, King of Prussia, PA';

  console.log(`Geocoding ${address1}...`);
  const geo1 = await geocodeAddress(address1);
  
  if (!geo1.success) {
    console.log(`✗ Failed to geocode address 1: ${geo1.error}`);
    process.exit(1);
  }
  console.log(`✓ Address 1: ${geo1.latitude}, ${geo1.longitude}\n`);

  await new Promise(resolve => setTimeout(resolve, 100));

  console.log(`Geocoding ${address2}...`);
  const geo2 = await geocodeAddress(address2);
  
  if (!geo2.success) {
    console.log(`✗ Failed to geocode address 2: ${geo2.error}`);
    process.exit(1);
  }
  console.log(`✓ Address 2: ${geo2.latitude}, ${geo2.longitude}\n`);

  // Calculate distance
  const R = 6371000;
  const dLat = (geo2.latitude - geo1.latitude) * Math.PI / 180;
  const dLon = (geo2.longitude - geo1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(geo1.latitude * Math.PI / 180) * Math.cos(geo2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Calculate midpoint
  const midpointLat = (geo1.latitude + geo2.latitude) / 2;
  const midpointLon = (geo1.longitude + geo2.longitude) / 2;

  console.log(`\n=== TEST COORDINATES ===`);
  console.log(`Project 1 (1000 W Ninth Ave): ${geo1.latitude}, ${geo1.longitude}`);
  console.log(`Project 2 (1004 W Ninth Ave): ${geo2.latitude}, ${geo2.longitude}`);
  console.log(`Distance between them: ${distance.toFixed(2)}m`);
  console.log(`Midpoint (your test location): ${midpointLat}, ${midpointLon}\n`);

  if (distance > 300) {
    console.log('⚠️  WARNING: Addresses are ' + distance.toFixed(2) + 'm apart.');
    console.log('With 150m radius each, they WON\'T overlap (need < 300m apart).\n');
  } else {
    console.log('✓ Addresses are close enough to overlap with 150m radius\n');
  }

  // Create Project 1
  try {
    await db.collection('projects').doc('OVERLAP-TEST-1').set({
      project_name: '1000 W Ninth Ave, King of Prussia',
      latitude: geo1.latitude,
      longitude: geo1.longitude,
      radius_meters: 150,
      phases: []
    });
    console.log('✓ Project 1 "OVERLAP-TEST-1" created\n');
  } catch (error) {
    console.log(`✗ Failed to create project 1: ${error.message}`);
    process.exit(1);
  }

  // Create Project 2
  try {
    await db.collection('projects').doc('OVERLAP-TEST-2').set({
      project_name: '1004 W Ninth Ave, King of Prussia',
      latitude: geo2.latitude,
      longitude: geo2.longitude,
      radius_meters: 150,
      phases: []
    });
    console.log('✓ Project 2 "OVERLAP-TEST-2" created\n');
  } catch (error) {
    console.log(`✗ Failed to create project 2: ${error.message}`);
    process.exit(1);
  }

  console.log('=== CLOCK-IN TEST ===');
  console.log('Test Location (midpoint): ' + midpointLat + ', ' + midpointLon);
  console.log('Expected Result: Popup showing both projects\n');

  process.exit(0);
}

createOverlappingProjectsTest();