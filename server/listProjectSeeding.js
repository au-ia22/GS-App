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
  'restoration', 'window', 'concrete', 'mixed use', 'summer', 'projects on',
  'roof', 'deck', 'alterations'
];

const citiesFromData = new Set();
for (const record of records) {
  const city = record['City']?.trim();
  if (city && city.length > 0) citiesFromData.add(city);
}
const commonCities = Array.from(citiesFromData);

const projectIdPattern = /^G\d+-\d+\s+-\s+(.+)$/;

const hardExcludedProjects = new Set([
  'G25-391', 'G25-283', 'G25-412', 'G23-212', 'G23-182', 'G23-183',
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
  'G25-313': 'Mattison Estate Homes, ',
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
}

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

function isMultiAddress(address) {
  return /^\d+\s+and\s+\d+\s+\w/i.test(address) || /^\d+-\d+\s+\w/i.test(address) || /^\d+\s+&\s+\d+/i.test(address) || /\//.test(address) || /^\d+\s+\d+\s+\w/.test(address);
}

function extractAddresses(address) {
  const addresses = [];
  
  // Remove city/state pattern (", City, STATE" or ", City, State")
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
      city: finalCity,
      state: finalState,
      phases: []
    });
  }

  return projectMap;
}

function listProjectsSeeding(page = 1, itemsPerPage = 50) {
  const projectMap = groupPhasesByProject(records);
  const projectArray = Array.from(projectMap.entries());
  const totalProjects = projectArray.length;
  const totalPages = Math.ceil(totalProjects / itemsPerPage);

  if (page < 1 || page > totalPages) {
    console.log(`Invalid page. Valid range: 1-${totalPages}`);
    return;
  }

  const startIdx = (page - 1) * itemsPerPage;
  const endIdx = Math.min(startIdx + itemsPerPage, totalProjects);

  console.log(`=== Projects As They Will Be Seeded - Page ${page}/${totalPages} ===\n`);

  for (let i = startIdx; i < endIdx; i++) {
    const [projectId, projectData] = projectArray[i];

    if (!projectData.fullAddress) continue;

    let addressToUse = hardcodedAddresses[projectId] || projectData.fullAddress;

    if (excludeStringFromProject[projectId] && !hardcodedAddresses[projectId]) {
      addressToUse = addressToUse.replace(excludeStringFromProject[projectId], '').replace(/,\s*,/g, ',').trim();
    }

    let seedType = 'SINGLE-ADDRESS';
    let geocodeAddresses = [addressToUse];

    if (isMultiAddress(addressToUse) && !excludeFromMultiAddress.has(projectId)) {
      seedType = 'MULTI-ADDRESS';
      const individualAddresses = extractAddresses(addressToUse);
      const cityStateContext = [];
      if (projectData.city) cityStateContext.push(projectData.city);
      if (projectData.state) cityStateContext.push(projectData.state);
      
      geocodeAddresses = individualAddresses.map(addr => {
        return cityStateContext.length > 0 
          ? `${addr}, ${cityStateContext.join(', ')}` 
          : addr;
      });
    }

    console.log(`${projectId} [${seedType}]`);
    geocodeAddresses.forEach((addr, index) => {
      console.log(`  ${index + 1}. ${addr}`);
    });
    console.log();
  }

  console.log(`Showing ${endIdx - startIdx} of ${totalProjects} projects`);
  if (page < totalPages) {
    console.log(`\nRun with page ${page + 1} to see next batch`);
  }
}

const pageArg = parseInt(process.argv[2]) || 1;
listProjectsSeeding(pageArg, 50);