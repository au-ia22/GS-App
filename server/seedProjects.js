const fs = require('fs');
const { parse } = require('csv-parse/sync');
const admin = require('firebase-admin');
const axios = require('axios');
require('dotenv').config();

// Initialize Firebase
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const csvFilePath = 'C:\\Users\\faulk\\Downloads\\Project sh - Project (1).csv';
const csvContent = fs.readFileSync(csvFilePath, 'utf8');
const records = parse(csvContent, { columns: true, skip_empty_lines: true });

const descriptiveKeywords = [
  'upgrade', 'replacement', 'project', 'phase', 'addition', 'expansion',
  'renovation', 'construction', 'development', 'monitoring', 'inspection',
  'design', 'drawings', 'testing', 'survey', 'work', 'plan', 'extension',
  'stabilization', 'electrical', 'mechanical', 'plumbing', 'hvac',
  'restoration', 'window', 'concrete', 'mixed use', 'summer', 'projects on',
  'roof', 'deck', 'alterations'
];

const phaseExclusionKeywords = [
  'design'
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
  'G18-102', 'G19-157', 'G26-132', 'G22-243', 'G22-274', 'G22-295',
  'G25-217', 'G25-227', 'G25-382', 'G26-141', 'G26-205', 'G26-206',
  'G26-277', 'G26-254', 'G22-206', 'G21-205', 'G19-159', 'G24-197',
  'G24-125', 'G24-111', 'G23-257', 'G23-257A', 'G23-214', 'G23-168',
  'G23-261', 'G24-279', 'G25-135', 'G25-116', 'G24-226', 'G24-234',
  'G24-248', 'G24-349', 'G25-293', 'G25-312', 'G25-390', 'G25-378',
  'G26-151', 'G26-154', 'G26-158', 'G26-171', 'G26-174', 'G26-176',
  'G26-180', 'G26-233', 'G26-219', 'G26-191', 'G26-274', 'G26-273',
  'G26-267', 'G26-264', 'G26-263', 'G24-299', 'G25-403', 'G26-136',
  'G26-148', 'G26-202'
]);

const excludeFromMultiAddress = new Set(['G25-408']);

const excludeStringFromProject = {
  'G22-206': 'Swatara Township',
  'G20-208': 'Mixed Use',
  'G20-326': 'Projects on',
  'G22-212': 'Summer 2022',
  'G23-168': 'Exterior Walk In Freezer',
  'G23-202': 'Infrastructure',
  'G24-197': 'Repair Various Buildings',
  'G23-203': 'Project 4 Sites',
  'G25-145': 'Tenant Improvements',
  'G24-324': 'Concrete Testing for',
  'G25-266': 'Meeting Room Update',
  'G25-260': '7 Homes',
  'G25-229': 'Alterations',
  'G25-369': ' - COPP Connector',
  'G25-314': 'Sinkhole Investigation',
  'G25-313': 'Mattison Estate Homes',
  'G26-125': 'Triplex',
  'G26-112': 'Concrete Testing',
  'G26-111': 'Workforce Housing'
};

const hardcodedAddresses = {
  'G22-315': 'Villanova Library, Villanova, PA',
  'G23-168': 'NPSD, Lansdale, PA',
  'G23-214': 'Wawa Gettysburg, Gettysburg, PA',
  'G23-261': 'Wawa Morganville, Morganville, NJ',
  'G24-108': '501 Station Avenue, Haddon Heights, NJ',
  'G24-186': '151 N 3rd Street / 225 Quarry Street, Philadelphia, PA',
  'G23-203': 'Brewerytown, Philadelphia, PA',
  'G25-135': 'Wawa Princess Anne, Princess Anne, MD',
  'G24-203': 'Philadelphia Country Club, Philadelphia, PA',
  'G24-282': 'New Kensington Community Development, Philadelphia, PA',
  'G25-182': 'YMCA, Lansdale, PA',
  'G25-383': 'Gladwyne Square, Gladwyne, PA',
  'G25-345': 'Philadelphia Healthcare Center, Philadelphia, PA',
  'G26-129': '140 Swan Street, Lambertville, NJ',
  'G26-116': 'Gough Residence, West Chester, PA',
  'G26-124': 'Villanova University Tolentine Hall, Villanova, PA',
  'G26-113': 'Lucid Motors, King of Prussia, PA',
  'G26-105': 'Wawa Glenmoore, Glenmoore, PA',
  'G25-405': 'Plymouth Meeting Metroplex, Plymouth Meeting, PA',
  'G26-274': 'Wawa Middletown, Middletown, DE',
  'G22-156': '113 S 19th Street / 121 S 19th Street (Harper Square), Philadelphia, PA',
  'G25-398': '90 Broadway, Somers Point, NJ',
  'G25-394': '915 Clayton Road, Monroe, NJ',
  'G26-179': 'Adidas King of Prussia Mall, King of Prussia, PA',
  'G26-214': 'Live! Casino, Philadelphia, PA',
  'G26-201': 'Francisville, Philadelphia, PA',
  'G26-196': 'Westpark, Philadelphia, PA',
  'G26-193': 'Westpark, Philadelphia, PA',
  'G26-194': 'Westpark, Philadelphia, PA',
  'G26-195': 'Westpark, Philadelphia, PA',
  'G26-257': 'George School, Newtown, PA'
};

const turnpikeKeywords = ['turnpike'];
const soeKeywords = ['soe'];
const labKeywords = ['lab', 'laboratory'];
const hwyKeywords = ['hwy'];
const bridgeKeywords = ['bridge'];

const wawasKeywords = ['wawa'];

function isWawa(projectId, displayName, root, parent, sortSeq, client) {
  return wawasKeywords.some(kw =>
    projectId.toLowerCase().includes(kw) ||
    displayName.toLowerCase().includes(kw) ||
    root.toLowerCase().includes(kw) ||
    parent.toLowerCase().includes(kw) ||
    sortSeq.toLowerCase().includes(kw) ||
    client.toLowerCase().includes(kw)
  );
}

function isTurnpike(projectId, displayName, root, parent, sortSeq, client) {
  return turnpikeKeywords.some(kw =>
    projectId.toLowerCase().includes(kw) ||
    displayName.toLowerCase().includes(kw) ||
    root.toLowerCase().includes(kw) ||
    parent.toLowerCase().includes(kw) ||
    sortSeq.toLowerCase().includes(kw) ||
    client.toLowerCase().includes(kw)
  );
}

function isSOE(projectId, displayName, root, parent, sortSeq, client) {
  return soeKeywords.some(kw =>
    projectId.toLowerCase().includes(kw) ||
    displayName.toLowerCase().includes(kw) ||
    root.toLowerCase().includes(kw) ||
    parent.toLowerCase().includes(kw) ||
    sortSeq.toLowerCase().includes(kw) ||
    client.toLowerCase().includes(kw)
  );
}

function isLab(projectId, displayName, root, parent, sortSeq, client) {
  return labKeywords.some(kw =>
    projectId.toLowerCase().includes(kw) ||
    displayName.toLowerCase().includes(kw) ||
    root.toLowerCase().includes(kw) ||
    parent.toLowerCase().includes(kw) ||
    sortSeq.toLowerCase().includes(kw) ||
    client.toLowerCase().includes(kw)
  );
}

function isHwy(projectId, displayName, root, parent, sortSeq, client) {
  return /\bhwy\b/i.test(projectId) ||
         /\bhwy\b/i.test(displayName) ||
         /\bhwy\b/i.test(root) ||
         /\bhwy\b/i.test(parent) ||
         /\bhwy\b/i.test(sortSeq) ||
         /\bhwy\b/i.test(client);
}

function isBridge(projectId, displayName, root, parent, sortSeq, client) {
  return /\bbridge\b/i.test(projectId) ||
         /\bbridge\b/i.test(displayName) ||
         /\bbridge\b/i.test(root) ||
         /\bbridge\b/i.test(parent) ||
         /\bbridge\b/i.test(sortSeq) ||
         /\bbridge\b/i.test(client);
}

const keywordExceptions = new Set([
  'G26-161',
  'G26-183',
  'G25-389'
]);

function getExclusionReason(projectId, displayName, root, parent, sortSeq, client) {
  if (keywordExceptions.has(projectId)) return null;

  for (const excluded of hardExcludedProjects) {
    if (projectId.includes(excluded)) return 'hardExcluded';
  }

  if (isTurnpike(projectId, displayName, root, parent, sortSeq, client)) return 'turnpike';
  if (isSOE(projectId, displayName, root, parent, sortSeq, client)) return 'soe';
  if (isLab(projectId, displayName, root, parent, sortSeq, client)) return 'lab';
  if (isHwy(projectId, displayName, root, parent, sortSeq, client)) return 'hwy';
  if (isBridge(projectId, displayName, root, parent, sortSeq, client)) return 'bridge';
  if (isWawa(projectId, displayName, root, parent, sortSeq, client)) return 'wawa';
  return null;
}

function shouldExclude(projectId, displayName, root, parent, sortSeq, client) {
  return getExclusionReason(projectId, displayName, root, parent, sortSeq, client) !== null;
}

function shouldExcludePhase(phaseId) {
  return phaseExclusionKeywords.some(keyword =>
    phaseId.toLowerCase().includes(keyword)
  );
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

function isMultiAddress(address) {
  return /^\d+\s+and\s+\d+\s+\w/i.test(address) || /^\d+-\d+\s+\w/i.test(address) || /^\d+\s+&\s+\d+/i.test(address) || /\//.test(address) || /^\d+\s+\d+\s+\w/.test(address);
}

function extractAddresses(address) {
  const addresses = [];

  let cleanedAddress = address.replace(/,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s*$/i, '').replace(/,\s*[A-Z]{2}\s*$/i, '').trim();

  if (/^\d+\s+\d+\s+\w/.test(cleanedAddress)) {
    const spaceMatch = cleanedAddress.match(/^(\d+)\s+(\d+)\s+(.+)$/);
    if (spaceMatch) {
      const firstNum = spaceMatch[1];
      const secondNum = spaceMatch[2];
      const streetInfo = spaceMatch[3].trim();

      addresses.push(`${firstNum} ${streetInfo}`);
      addresses.push(`${secondNum} ${streetInfo}`);
    }
  }
  else if (/\//.test(cleanedAddress)) {
    const parts = cleanedAddress.split(/\s*\/\s*/);
    return parts.map(part => part.trim());
  }
  else if (/^\d+\s+and\s+\d+\s+\w/i.test(cleanedAddress)) {
    const andMatch = cleanedAddress.match(/^(\d+)\s+and\s+(\d+)\s+(.+)$/i);
    if (andMatch) {
      const firstNum = andMatch[1];
      const secondNum = andMatch[2];
      const streetInfo = andMatch[3].trim();

      addresses.push(`${firstNum} ${streetInfo}`);
      addresses.push(`${secondNum} ${streetInfo}`);
    }
  }
  else if (/^\d+\s+&\s+\d+/.test(cleanedAddress)) {
    const ampMatch = cleanedAddress.match(/(\d+)\s+&\s+(\d+)-(\d+)(.+)/);
    if (ampMatch) {
      const firstNum = ampMatch[1];
      const rangeStart = ampMatch[2];
      let rangeEnd = ampMatch[3];
      const streetInfo = ampMatch[4].trim();

      if (rangeEnd.length < 3) {
        const prefix = rangeStart.substring(0, rangeStart.length - rangeEnd.length);
        rangeEnd = prefix + rangeEnd;
      }

      addresses.push(`${firstNum} ${streetInfo}`);
      addresses.push(`${rangeStart} ${streetInfo}`);
      addresses.push(`${rangeEnd} ${streetInfo}`);
    }
  }
  else if (/^\d+-\d+\s+\w/.test(cleanedAddress)) {
    const rangeMatch = cleanedAddress.match(/(\d+)-(\d+)(.+)/);
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

  return addresses.length > 0 ? addresses : [cleanedAddress];
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
    const root = record['Root'] || '';
    const parent = record['Parent'] || '';
    const sortSeq = record['Sort Sequence'] || '';
    const client = record['Client'] || '';
    const level = parseInt(record['Level'], 10);

    if (projectId.match(/^G(00-100|99-999)$/)) continue;

    if (level !== 0) {
      const parentMatch = projectId.match(/^(G\d+-\d+)/);
      if (parentMatch) {
        const parentId = parentMatch[1];
        if (!projectMap.has(parentId)) {
          projectMap.set(parentId, { phases: [] });
        }
        if (!shouldExclude(projectId, displayName, root, parent, sortSeq, client)) {
          // Check if phase should be excluded based on phase exclusion keywords
          if (!shouldExcludePhase(projectId)) {
            projectMap.get(parentId).phases.push(projectId);
          }
        }
      }
      continue;
    }

    if (shouldExclude(projectId, displayName, root, parent, sortSeq, client)) continue;

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
      city: finalCity,
      state: finalState,
      phases: []
    });
  }

  return projectMap;
}

async function previewSeeding(pageNum = 1) {
  const PROJECTS_PER_PAGE = 20;
  
  console.log('=== PREVIEW PROJECTS ===\n');
  const projectMap = groupPhasesByProject(records);

  const allProjects = [];
  for (const [projectId, projectData] of projectMap) {
    if (!projectData.fullAddress) continue;

    let addressToUse = hardcodedAddresses[projectId] || projectData.fullAddress;

    if (excludeStringFromProject[projectId] && !hardcodedAddresses[projectId]) {
      addressToUse = addressToUse.replace(excludeStringFromProject[projectId], '').replace(/,\s*,/g, ',').trim();
    }

    const isMulti = isMultiAddress(addressToUse) && !excludeFromMultiAddress.has(projectId);
    const extractedAddrs = isMulti ? extractAddresses(addressToUse) : null;

    allProjects.push({
      projectId,
      projectName: projectData.displayName,
      addressToUse,
      isMulti,
      extractedAddrs
    });
  }

  const totalPages = Math.ceil(allProjects.length / PROJECTS_PER_PAGE);

  if (pageNum < 1 || pageNum > totalPages) {
    console.log(`Invalid page number. Total pages: ${totalPages}`);
    process.exit(0);
  }

  const startIdx = (pageNum - 1) * PROJECTS_PER_PAGE;
  const endIdx = startIdx + PROJECTS_PER_PAGE;
  const pageProjects = allProjects.slice(startIdx, endIdx);

  console.log(`Total projects: ${allProjects.length}`);
  console.log(`Page ${pageNum} of ${totalPages}\n`);

  pageProjects.forEach((project, idx) => {
    const actualNum = startIdx + idx + 1;
    console.log(`[${actualNum}] ${project.projectId} - ${project.projectName}`);
    console.log(`    Address: ${project.addressToUse}`);
    if (project.isMulti) {
      console.log(`    Multi-address extractions:`);
      project.extractedAddrs.forEach((addr, addrIdx) => {
        console.log(`      [${addrIdx + 1}] ${addr}`);
      });
    }
  });

  console.log(`\nPage ${pageNum} of ${totalPages}`);
  process.exit(0);
}

async function previewPhases(pageNum = 1) {
  const PHASES_PER_PAGE = 20;
  
  console.log('=== PREVIEW PHASES ===\n');
  const projectMap = groupPhasesByProject(records);

  const allPhases = [];
  for (const [projectId, projectData] of projectMap) {
    if (projectData.phases.length > 0) {
      projectData.phases.forEach(phase => {
        allPhases.push({
          parentProjectId: projectId,
          phaseId: phase
        });
      });
    }
  }

  const totalPages = Math.ceil(allPhases.length / PHASES_PER_PAGE);

  if (pageNum < 1 || pageNum > totalPages) {
    console.log(`Invalid page number. Total pages: ${totalPages}`);
    process.exit(0);
  }

  const startIdx = (pageNum - 1) * PHASES_PER_PAGE;
  const endIdx = startIdx + PHASES_PER_PAGE;
  const pagePhases = allPhases.slice(startIdx, endIdx);

  console.log(`Total phases: ${allPhases.length}`);
  console.log(`Page ${pageNum} of ${totalPages}\n`);

  pagePhases.forEach((phase, idx) => {
    const actualNum = startIdx + idx + 1;
    console.log(`[${actualNum}] Parent: ${phase.parentProjectId} → Phase: ${phase.phaseId}`);
  });

  console.log(`\nPage ${pageNum} of ${totalPages}`);
  process.exit(0);
}

async function listProjectsWithKeyword(keyword) {
  console.log(`=== PROJECTS CONTAINING "${keyword.toUpperCase()}" ===\n`);

  const matching = [];
  for (const record of records) {
    const projectId = record['Project ID'];
    const displayName = record['Project Display Name'] || '';
    const level = parseInt(record['Level'], 10);

    // Only show root projects (Level 0)
    if (level === 0 && displayName.toLowerCase().includes(keyword.toLowerCase())) {
      matching.push({
        projectId,
        projectName: displayName,
        exclusionReason: getExclusionReason(projectId, displayName, record['Root'] || '', record['Parent'] || '', record['Sort Sequence'] || '', record['Client'] || '')
      });
    }
  }

  console.log(`Found ${matching.length} projects\n`);

  matching.forEach((project, idx) => {
    console.log(`[${idx + 1}] ${project.projectId} - ${project.projectName}`);
    if (project.exclusionReason) {
      console.log(`    ⚠ EXCLUDED: ${project.exclusionReason}`);
    }
  });

  process.exit(0);
}

async function seedProjects() {
  console.log('Grouping phases by parent project...\n');
  const projectMap = groupPhasesByProject(records);

  console.log(`Total projects to seed: ${projectMap.size}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const [projectId, projectData] of projectMap) {
    if (!projectData.fullAddress) continue;

    let addressToUse = hardcodedAddresses[projectId] || projectData.fullAddress;

    if (excludeStringFromProject[projectId] && !hardcodedAddresses[projectId]) {
      addressToUse = addressToUse.replace(excludeStringFromProject[projectId], '').replace(/,\s*,/g, ',').trim();
    }

    console.log(`Seeding ${projectId}: ${addressToUse}`);

    if (isMultiAddress(addressToUse) && !excludeFromMultiAddress.has(projectId)) {
      console.log(`  → Multi-address detected, geocoding each address separately...`);

      const individualAddresses = extractAddresses(addressToUse);
      const locations = [];
      let allSuccess = true;

      for (const addr of individualAddresses) {
        const cityStateContext = [];
        if (projectData.city) cityStateContext.push(projectData.city);
        if (projectData.state) cityStateContext.push(projectData.state);

        const fullAddr = cityStateContext.length > 0
          ? `${addr}, ${cityStateContext.join(', ')}`
          : addr;

        const geocodeResult = await geocodeAddress(fullAddr);
        if (geocodeResult.success) {
          locations.push({
            address: fullAddr,
            latitude: geocodeResult.latitude,
            longitude: geocodeResult.longitude
          });
        } else {
          console.log(`    ✗ Failed to geocode: ${fullAddr}`);
          allSuccess = false;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (allSuccess && locations.length > 0) {
        try {
          await db.collection('projects').doc(projectId).set({
            project_name: projectData.displayName,
            address: addressToUse,
            locations: locations,
            radius_meters: 150,
            phases: projectData.phases
          });

          console.log(`  ✓ Seeded to Firestore with ${locations.length} locations\n`);
          successCount++;
        } catch (error) {
          console.log(`  ✗ Firestore write failed: ${error.message}\n`);
          failCount++;
        }
      } else {
        console.log(`  ✗ Geocoding failed for multi-address project\n`);
        failCount++;
      }
    } else {
      const geocodeResult = await geocodeAddress(addressToUse);

      if (geocodeResult.success) {
        try {
          await db.collection('projects').doc(projectId).set({
            project_name: projectData.displayName,
            address: addressToUse,
            locations: [
              {
                address: addressToUse,
                latitude: geocodeResult.latitude,
                longitude: geocodeResult.longitude
              }
            ],
            radius_meters: 150,
            phases: projectData.phases
          });

          console.log(`  ✓ Seeded to Firestore\n`);
          successCount++;
        } catch (error) {
          console.log(`  ✗ Firestore write failed: ${error.message}\n`);
          failCount++;
        }
      } else {
        console.log(`  ✗ Geocoding failed: ${geocodeResult.error}\n`);
        failCount++;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n=== SEEDING COMPLETE ===`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failCount}`);

  process.exit(0);
}

// Get command and page number from command line
const command = process.argv[2] || 'projects';
const pageNum = parseInt(process.argv[3]) || 1;
const keyword = process.argv[3];

if (command === 'projects') {
  previewSeeding(pageNum).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} else if (command === 'phases') {
  previewPhases(pageNum).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} else if (command === 'find') {
  if (!keyword) {
    console.log('Usage: node seedProjects.js find <keyword>');
    process.exit(0);
  }
  listProjectsWithKeyword(keyword).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} else if (command === 'seed') {
  seedProjects().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} else {
  console.log('Usage:');
  console.log('  node seedProjects.js projects [page]     - Preview projects');
  console.log('  node seedProjects.js phases [page]       - Preview phases');
  console.log('  node seedProjects.js find <keyword>      - Find projects with keyword');
  console.log('  node seedProjects.js seed                - Seed to Firestore');
  process.exit(0);
}