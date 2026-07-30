const axios = require('axios');
require('dotenv').config();

async function geocodeOffice() {
  const address = '1000 W Ninth Ave Ste B King of Prussia PA 19406 United States';
  
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,
        key: process.env.GOOGLE_GEOCODING_API_KEY
      }
    });

    if (response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      console.log(`Office Address: ${address}`);
      console.log(`Latitude: ${location.lat}`);
      console.log(`Longitude: ${location.lng}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

geocodeOffice();