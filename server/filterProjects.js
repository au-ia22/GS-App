const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const csvFilePath = 'C:\\Users\\faulk\\Downloads\\Project sh - Project (1).csv';
const csvContent = fs.readFileSync(csvFilePath, 'utf8');


const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
});

const turnpikeProjects = [];
const soeProjects = [];
const labProjects = [];
const hwyProjects = [];
const bridgeProjects = [];
const standaloneProjects = [];

// Hardcoded exclusion list - projects that should not appear in any list
const hardExcludedProjects = new Set([
  'G26-183',
  'G25-290',
  'G23-183',
  'G23-182',
  'G23-163',
  'G21-351',
  'G19-184',
  'G25-412',
  'G23-212',
  'G21-279',
  'G19-184 SOE Design Contract',
  'G21-351 - Revising SOE & Underpinning Design ',
  'G23-163 - SOE Design',
  'G23-163 - Final SOE design/Excavation Plan drawings',
  'G23-163 - Revised SOE Design and Underpinning',
  'G23-182 - Preconstruction Surveys & SOE Design',
  'G23-183 - Preconstruction Surveys & SOE Design',
  'G25-290 - Aggregate Pier and SOE',
  'G21-279 Permanent Underslab Drainage Design'
]);

// Standalone projects to exclude
const standaloneProjectsToExclude = new Set(['G18-102']);

// Exclusions for specific checks
const excludedHwy = new Set(['G25-391']);
const excludedBridge = new Set(['G25-283']);

for (const record of records) {
  const projectId = record['Project ID'];

  // Skip placeholders only
  if (projectId.match(/^G(00-100|99-999)$/)) continue;

  // Skip hardcoded exclusions
  if (hardExcludedProjects.has(projectId)) continue;

  // Check for standalone projects to exclude
  if (standaloneProjectsToExclude.has(projectId)) {
    standaloneProjects.push(`${projectId} - ${record['Project Display Name']} (Level ${parseInt(record['Level'], 10)})`);
    continue;
  }

  const displayName = record['Project Display Name'] || '';
  const root = record['Root'] || '';
  const parent = record['Parent'] || '';
  const sortSeq = record['Sort Sequence'] || '';
  const client = record['Client'] || '';
  const level = parseInt(record['Level'], 10);

  // Check for "turnpike" in multiple columns (all levels)
  const hasTurnpike = displayName.toLowerCase().includes('turnpike') ||
                       root.toLowerCase().includes('turnpike') ||
                       parent.toLowerCase().includes('turnpike') ||
                       sortSeq.toLowerCase().includes('turnpike') ||
                       client.toLowerCase().includes('turnpike');
  
  if (hasTurnpike) {
    turnpikeProjects.push(`${projectId} - ${displayName} (Level ${level})`);
  }

  // Check for "SOE" in Project ID or Display Name (all levels)
  const hasSoe = projectId.toLowerCase().includes('soe') ||
                 displayName.toLowerCase().includes('soe');
  
  if (hasSoe) {
    soeProjects.push(`${projectId} - ${displayName} (Level ${level})`);
  }

  // Check for "Lab" or "Laboratory" in Project ID or Display Name (all levels)
  const hasLab = projectId.toLowerCase().includes('lab') ||
                 displayName.toLowerCase().includes('lab') ||
                 displayName.toLowerCase().includes('laboratory');
  
  if (hasLab) {
    labProjects.push(`${projectId} - ${displayName} (Level ${level})`);
  }

  // Check for "hwy" as standalone word in Project Display Name
  const hasHwy = /\bhwy\b/i.test(displayName);
  
  if (hasHwy && !excludedHwy.has(projectId)) {
    hwyProjects.push(`${projectId} - ${displayName} (Level ${level})`);
  }

  // Check for "bridge" as standalone word (not part of another word like Bridgeport)
  const hasBridge = /\bbridge\b/i.test(displayName);
  
  if (hasBridge && !excludedBridge.has(projectId)) {
    bridgeProjects.push(`${projectId} - ${displayName} (Level ${level})`);
  }
}

console.log('=== TURNPIKE (in any column) ===');
console.log(turnpikeProjects.length > 0 ? turnpikeProjects.join('\n') : 'None found');

console.log('\n\n=== SOE (in Project ID or Display Name) - EXCLUDING: G26-183, G25-290, G23-183, G23-182, G23-163, G21-351, G19-184 ===');
console.log(soeProjects.length > 0 ? soeProjects.join('\n') : 'None found');

console.log('\n\n=== LAB / LABORATORY (in Project ID or Display Name) - EXCLUDING: G25-412, G23-212, G21-279 ===');
console.log(labProjects.length > 0 ? labProjects.join('\n') : 'None found');

console.log('\n\n=== HWY (in Project Display Name) - EXCLUDING: G25-391 ===');
console.log(hwyProjects.length > 0 ? hwyProjects.join('\n') : 'None found');

console.log('\n\n=== BRIDGE (in Project Display Name) - EXCLUDING: G25-283 ===');
console.log(bridgeProjects.length > 0 ? bridgeProjects.join('\n') : 'None found');

console.log('\n\n=== STANDALONE (to exclude) ===');
console.log(standaloneProjects.length > 0 ? standaloneProjects.join('\n') : 'None found');

// Export exclusion sets for use in other scripts
module.exports = {
  hardExcludedProjects,
  turnpikeProjects: new Set(turnpikeProjects.map(p => p.split(' - ')[0])),
  soeProjects: new Set(soeProjects.map(p => p.split(' - ')[0])),
  labProjects: new Set(labProjects.map(p => p.split(' - ')[0])),
  hwyProjects: new Set(hwyProjects.map(p => p.split(' - ')[0])),
  bridgeProjects: new Set(bridgeProjects.map(p => p.split(' - ')[0])),
  standaloneProjectsToExclude
};