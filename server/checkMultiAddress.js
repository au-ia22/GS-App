


  // Only match if it's "number and number street" or "number-number street"
  // Examples that should match:
  //   "5618 and 5642 Heiskell Street" ✓
  //   "207-13 Vine Street" ✓
  //   "1900-22 N Front Street" ✓
  // Examples that should NOT match:
  //   "Cameron Square at 19th and Wylie Streets" ✗
  //   "Chickie's and Pete's Terminal E9" ✗
  //   "Liberty Coke Sales and Distribution Center" ✗
  
  // Pattern: starts with digit, has "and" or "-", followed by digit, then street name

const fs = require('fs');
const { parse } = require('csv-parse/sync');
const axios = require('axios');
require('dotenv').config();

const csvFilePath = 'C:\\Users\\faulk\\Downloads\\Project sh - Project (1).csv';
const csvContent = fs.readFileSync(csvFilePath, 'utf8');
const records = parse(csvContent, { columns: true, skip_empty_lines: true });

const excludeFromMultiAddress = new Set([
  'G25-408'
]);

const descriptiveKeywords = [
  'upgrade', 'replacement', 'project', 'phase', 'addition', 'expansion',
  'renovation', 'construction', 'development', 'monitoring', 'inspection',
  'design', 'drawings', 'testing', 'survey', 'work', 'plan', 'extension',
  'stabilization', 'electrical', 'mechanical', 'plumbing', 'hvac',
  'restoration', 'window', 'concrete'
];

const citiesFromData = new Set();
for (const record of records) {
  const city = record['City']?.trim();
  if (city && city.length > 0) citiesFromData.add(city);
}
const commonCities = Array.from(citiesFromData);

function cleanAddress(address) {
  let cleaned = address;
  cleaned = cleaned.replace(/\s*\([^)]*\)/g, '').trim();
  const dashParts = cleaned.split(' - ');
  if (dashParts.length > 1) {
    const lastPart = dashParts[dashParts.length - 1].trim();
    if (/^\d+/.test(lastPart) || /\b(street|avenue|road|lane|drive|court|way|blvd|st|ave|rd|ln|dr|ct|pl|st)\b/i.test(lastPart)) {
      cleaned = lastPart;
    }
  }
  const words = cleaned.split(/\s+/);
  while (words.length > 0) {
    const lastWord = words[words.length - 1].toLowerCase();
    if (descriptiveKeywords.some(keyword => lastWord.includes(keyword))) {
      words.pop();
    } else {
      break;
    }
  }
  cleaned = words.join(' ').trim();
  cleaned = cleaned.replace(/\s*-\s*$/, '').trim();
  return cleaned;
}

function extractCityFromName(address) {
  for (const city of commonCities) {
    const regex = new RegExp(`\\b${city}\\b`, 'i');
    if (regex.test(address)) return city;
  }
  return null;
}

function isMultiAddress(address) {
  return /^\d+\s+and\s+\d+\s+\w/i.test(address) || /^\d+-\d+\s+\w/i.test(address);
}

function extractAddresses(address) {
  const addresses = [];
  
  if (/^\d+\s+and\s+\d+\s+\w/i.test(address)) {
    const parts = address.split(/\s+and\s+/i);
    const lastPart = parts[parts.length - 1].trim();
    
    const streetMatch = lastPart.match(/(\w.*)/);
    const streetInfo = streetMatch ? streetMatch[1] : lastPart;
    
    parts.forEach((part, index) => {
      if (index < parts.length - 1) {
        const numMatch = part.trim().match(/\d+$/);
        if (numMatch) {
          addresses.push(`${part.trim()} ${streetInfo}`.trim());
        }
      } else {
        addresses.push(part.trim());
      }
    });
  } 
  else if (/^\d+-\d+\s+\w/.test(address)) {
    const rangeMatch = address.match(/(\d+)-(\d+)(.+)/);
    if (rangeMatch) {
      const startNum = rangeMatch[1];
      let endNum = rangeMatch[2];
      const streetInfo = rangeMatch[3].trim();
      
      if (endNum.length < 3) {
        const prefix = startNum.substring(0, startNum.length - endNum.length);
        endNum = prefix + endNum;
      }
      
      addresses.push(`${startNum} ${streetInfo}`);
      addresses.push(`${endNum} ${streetInfo}`);
    }
  }
  
  return addresses.length > 0 ? addresses : [address];
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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

async function checkMultiAddresses() {
  console.log('=== Multi-Address Projects ===\n');

  let multiCount = 0;

  for (const record of records) {
    const projectId = record['Project ID'];
    const displayName = record['Project Display Name'] || '';
    const city = record['City'] || '';
    const state = record['AddressState'] || '';
    const level = parseInt(record['Level'], 10);

    if (level !== 0) continue;

    const projectIdPattern = /^G\d+-\d+\s+-\s+(.+)$/;
    const match = displayName.match(projectIdPattern);
    let extractedAddress = match ? match[1].trim() : displayName;
    extractedAddress = cleanAddress(extractedAddress);

    if (isMultiAddress(extractedAddress) && !excludeFromMultiAddress.has(projectId)) {
      const extracted = extractAddresses(extractedAddress);
      console.log(`${projectId}: ${extractedAddress}`);
      console.log(`  → ${extracted.join(' | ')}`);

      // Geocode both addresses with city/state context and calculate distance
      const coords = [];
      for (const addr of extracted) {
        const cityStateContext = [];
        if (city) cityStateContext.push(city);
        if (state) cityStateContext.push(state);
        const fullAddr = cityStateContext.length > 0 
          ? `${addr}, ${cityStateContext.join(', ')}` 
          : addr;

        const geocodeResult = await geocodeAddress(fullAddr);
        if (geocodeResult.success) {
          coords.push(geocodeResult);
        } else {
          console.log(`  ⚠ Failed to geocode: ${fullAddr}`);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (coords.length === 2) {
        const distance = calculateDistance(coords[0].latitude, coords[0].longitude, coords[1].latitude, coords[1].longitude);
        const status = distance <= 150 ? '✓' : '✗';
        console.log(`  ${status} Distance: ${distance.toFixed(2)}m`);
      }

      console.log();
      multiCount++;
    }
  }

  console.log(`Total multi-address projects: ${multiCount}`);
  process.exit(0);
}

checkMultiAddresses().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});