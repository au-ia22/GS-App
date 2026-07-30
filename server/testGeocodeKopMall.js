const axios = require('axios');
require('dotenv').config();

async function geocodeKOP() {
  const address = 'King of Prussia Mall King of Prussia PA';
  
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,
        key: process.env.GOOGLE_GEOCODING_API_KEY
      }
    });

    if (response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      console.log(`Address: ${address}`);
      console.log(`Latitude: ${location.lat}`);
      console.log(`Longitude: ${location.lng}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

geocodeKOP();