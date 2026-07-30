/*
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const exclusions = require('./filterProjects.js');

const csvFilePath = 'C:\\Users\\faulk\\Downloads\\Project sh - Project (1).csv';
const csvContent = fs.readFileSync(csvFilePath, 'utf8');

const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
});

const {
  hardExcludedProjects,
  turnpikeProjects,
  soeProjects,
  labProjects,
  hwyProjects,
  bridgeProjects,
  standaloneProjectsToExclude
} = exclusions;

// Words/phrases to exclude from addresses (descriptive suffixes)
const descriptiveKeywords = [
  'upgrade',
  'replacement',
  'project',
  'phase',
  'addition',
  'expansion',
  'renovation',
  'construction',
  'development',
  'monitoring',
  'inspection',
  'design',
  'drawings',
  'testing',
  'survey',
  'work',
  'plan',
  'extension',
  'stabilization',
  'electrical',
  'mechanical',
  'plumbing',
  'hvac',
  'restoration',
  'window',
  'concrete'
];

// Build commonCities dynamically from CSV data
const citiesFromData = new Set();
for (const record of records) {
  const city = record['City']?.trim();
  if (city && city.length > 0) {
    citiesFromData.add(city);
  }
}
const commonCities = Array.from(citiesFromData);

// Regex pattern for extracting Project ID and address separately
const projectIdPattern = /^G\d+-\d+\s+-\s+(.+)$/;

// Function to clean extracted address
function cleanAddress(address) {
  let cleaned = address;

  // Remove content in parentheses
  cleaned = cleaned.replace(/\s*\([^)]*\)/g, '').trim();

  // Strip business/landmark name before dash if followed by a street address
  const dashParts = cleaned.split(' - ');
  if (dashParts.length > 1) {
    const lastPart = dashParts[dashParts.length - 1].trim();
    // Check if last part looks like a street address (starts with number or has street type)
    if (/^\d+/.test(lastPart) || /\b(street|avenue|road|lane|drive|court|way|blvd|st|ave|rd|ln|dr|ct|pl|st)\b/i.test(lastPart)) {
      cleaned = lastPart;
    }
  }

  // Remove trailing descriptive keywords
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

  // Clean up trailing dashes
  cleaned = cleaned.replace(/\s*-\s*$/, '').trim();

  return cleaned;
}

// Function to extract city from project name
function extractCityFromName(address) {
  for (const city of commonCities) {
    const regex = new RegExp(`\\b${city}\\b`, 'i');
    if (regex.test(address)) {
      return city;
    }
  }
  return null;
}

const results = [];
let excludedCount = 0;

for (const record of records) {
  const projectId = record['Project ID'];
  const displayName = record['Project Display Name'] || '';
  const city = record['City'] || '';
  const state = record['AddressState'] || '';
  const level = parseInt(record['Level'], 10);

  // Skip placeholders
  if (projectId.match(/^G(00-100|99-999)$/)) continue;

  // Skip non-Level-0 projects
  if (level !== 0) continue;

  // Skip excluded projects
  if (hardExcludedProjects.has(projectId) || 
      turnpikeProjects.has(projectId) || 
      soeProjects.has(projectId) || 
      labProjects.has(projectId) || 
      hwyProjects.has(projectId) || 
      bridgeProjects.has(projectId) ||
      standaloneProjectsToExclude.has(projectId)) {
    excludedCount++;
    continue;
  }

  // Extract address from display name (everything after "G##-### - ")
  const match = displayName.match(projectIdPattern);
  let extractedAddress = match ? match[1].trim() : displayName;

  // Determine final city and state BEFORE cleaning the address
  let finalCity = city;
  let finalState = state;

  // If city is missing from CSV, try to extract from the ORIGINAL display name (before cleaning)
  if (!finalCity && displayName) {
    const extractedCity = extractCityFromName(displayName);
    if (extractedCity) {
      finalCity = extractedCity;
    }
  }

  // Clean the extracted address
  extractedAddress = cleanAddress(extractedAddress);

  // Build full address for geocoding
  let fullAddress = extractedAddress;
  
  // Only add city if it's not already in the extracted address as a standalone word
  if (finalCity && !new RegExp(`\\b${finalCity}\\b`, 'i').test(extractedAddress)) {
    fullAddress += `, ${finalCity}`;
  }
  
  // Only add state if it's not already in the extracted address or full address
  // Check for state as a standalone word/abbreviation, not just substring
  if (finalState && !new RegExp(`\\b${finalState}\\b`, 'i').test(fullAddress)) {
    fullAddress += `, ${finalState}`;
  }

  results.push({
    projectId,
    displayName,
    extractedAddress,
    fullAddress,
    city: finalCity,
    state: finalState
  });
}

// Print results
console.log('=== EXTRACTED ADDRESSES (Inspector-Related Projects Only) ===\n');
results.forEach(r => {
  console.log(`${r.projectId}`);
  console.log(`  Display Name: ${r.displayName}`);
  console.log(`  Extracted: ${r.extractedAddress}`);
  console.log(`  Full Address: ${r.fullAddress}`);
  console.log('');
});

console.log(`\nTotal Level 0 projects (after exclusions): ${results.length}`);
console.log(`Total excluded projects: ${excludedCount}`);
*/

const fs = require('fs');
const { parse } = require('csv-parse/sync');

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

// Hardcoded exclusions
const hardExcludedProjects = new Set([
  'G25-391', 'G25-283', 'G25-412', 'G23-212', 'G23-182', 'G23-183', 'G21-279',
  'G18-102', 'G19-157', 'G26-132'
]);

// Projects containing these keywords in Project ID or Display Name
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
  
  // Check if projectId contains any hardcoded exclusion as substring
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

const results = [];
let excludedCount = 0;

for (const record of records) {
  const projectId = record['Project ID'];
  const displayName = record['Project Display Name'] || '';
  const city = record['City'] || '';
  const state = record['AddressState'] || '';
  const level = parseInt(record['Level'], 10);

  if (projectId.match(/^G(00-100|99-999)$/)) continue;
  if (level !== 0) continue;
  if (shouldExclude(projectId, displayName)) {
    excludedCount++;
    continue;
  }

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

  results.push({ projectId, fullAddress });
}

results.forEach(r => {
  console.log(`${r.projectId} | ${r.fullAddress}`);
});

console.log(`\nTotal: ${results.length} | Excluded: ${excludedCount}`);