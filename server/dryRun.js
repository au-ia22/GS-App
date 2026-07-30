
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const axios = require('axios');
require('dotenv').config();

const csvFilePath = 'C:\\Users\\faulk\\Downloads\\Project sh - Project (1).csv';
const csvContent = fs.readFileSync(csvFilePath, 'utf8');
const records = parse(csvContent, { columns: true, skip_empty_lines: true });

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

const projectIdPattern = /^G\d+-\d+\s+-\s+(.+)$/;

const hardExcludedProjects = new Set([
  'G25-391', 'G25-283', 'G25-412', 'G23-212', 'G23-182', 'G23-183', 'G21-279',
  'G18-102', 'G19-157', 'G26-132'
]);

const turnpikeKeywords = ['turnpike'];
const soeKeywords = ['soe'];
const labKeywords = ['lab', 'laboratory'];
const hwyKeywords = ['hwy'];
const bridgeKeywords = ['bridge'];

function isTurnpike(projectId, displayName) {
  return turnpikeKeywords.some(kw => 
    projectId.toLowerCase().includes(kw) || displayName.toLowerCase().includes(kw)
  );
}

function isSOE(projectId, displayName) {
  return soeKeywords.some(kw => 
    projectId.toLowerCase().includes(kw) || displayName.toLowerCase().includes(kw)
  );
}

function isLab(projectId, displayName) {
  return labKeywords.some(kw => 
    projectId.toLowerCase().includes(kw) || displayName.toLowerCase().includes(kw)
  );
}

function isHwy(displayName) {
  return hwyKeywords.some(kw => displayName.toLowerCase().includes(kw));
}

function isBridge(displayName) {
  return bridgeKeywords.some(kw => displayName.toLowerCase().includes(kw));
}

function shouldExclude(projectId, displayName) {
  if (hardExcludedProjects.has(projectId)) return true;
  
  for (const excluded of hardExcludedProjects) {
    if (projectId.includes(excluded)) return true;
  }
  
  return isTurnpike(projectId, displayName) || 
         isSOE(projectId, displayName) || 
         isLab(projectId, displayName) || 
         isHwy(displayName) || 
         isBridge(displayName);
}

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

function groupPhasesByProject(records) {
  const projectMap = new Map();

  for (const record of records) {
    const projectId = record['Project ID'];
    const displayName = record['Project Display Name'] || '';
    const city = record['City'] || '';
    const state = record['AddressState'] || '';
    const level = parseInt(record['Level'], 10);

    if (projectId.match(/^G(00-100|99-999)$/)) continue;

    if (level !== 0) {
      const parentMatch = projectId.match(/^(G\d+-\d+)/);
      if (parentMatch) {
        const parentId = parentMatch[1];
        if (!projectMap.has(parentId)) {
          projectMap.set(parentId, { phases: [] });
        }
        projectMap.get(parentId).phases.push(projectId);
      }
      continue;
    }

    if (shouldExclude(projectId, displayName)) continue;

    const match = displayName.match(projectIdPattern);
    let extractedAddress = match ? match[1].trim() : displayName;

    let finalCity = city;
    let finalState = state;

    if (!finalCity && displayName) {
      const extractedCity = extractCityFromName(displayName);
      if (extractedCity) finalCity = extractedCity;
    }

    extractedAddress = cleanAddress(extractedAddress);

    let fullAddress = extractedAddress;
    if (finalCity && !new RegExp(`\\b${finalCity}\\b`, 'i').test(extractedAddress)) {
      fullAddress += `, ${finalCity}`;
    }
    if (finalState && !new RegExp(`\\b${finalState}\\b`, 'i').test(fullAddress)) {
      fullAddress += `, ${finalState}`;
    }

    projectMap.set(projectId, {
      projectId,
      displayName,
      fullAddress,
      phases: []
    });
  }

  return projectMap;
}

async function dryRunSeeding() {
  console.log('Grouping phases by parent project...\n');
  const projectMap = groupPhasesByProject(records);

  console.log(`Total projects to geocode: ${projectMap.size}\n`);

  let successCount = 0;
  let failCount = 0;
  const documents = [];

  for (const [projectId, projectData] of projectMap) {
    if (!projectData.fullAddress) continue;

    console.log(`Geocoding ${projectId}: ${projectData.fullAddress}`);

    const geocodeResult = await geocodeAddress(projectData.fullAddress);

    if (geocodeResult.success) {
      const firestoreDoc = {
        project_id: projectId,
        project_name: projectData.displayName,
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude,
        radius_meters: 150,
        phases: projectData.phases
      };

      documents.push(firestoreDoc);
      successCount++;
      console.log(`  ✓ Valid document created\n`);
    } else {
      failCount++;
      console.log(`  ✗ Geocoding failed: ${geocodeResult.error}\n`);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n=== DRY RUN COMPLETE ===`);
  console.log(`Valid documents: ${successCount}`);
  console.log(`Failed: ${failCount}`);

  console.log(`\n=== SAMPLE DOCUMENTS (first 5) ===\n`);
  documents.slice(0, 5).forEach((doc, i) => {
    console.log(`${i + 1}. ${JSON.stringify(doc)}`);
  });

  console.log(`\n=== ALL DOCUMENTS ===\n`);
  console.log(JSON.stringify(documents, null, 2));

  process.exit(0);
}

dryRunSeeding().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
