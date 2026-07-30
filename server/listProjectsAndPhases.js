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

const turnpikeKeywords = ['turnpike'];
const soeKeywords = ['soe'];
const labKeywords = ['lab', 'laboratory'];
const hwyKeywords = ['hwy'];
const bridgeKeywords = ['bridge'];

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

  if (hardExcludedProjects.has(projectId)) return 'hardExcluded';
  if (isTurnpike(projectId, displayName, root, parent, sortSeq, client)) return 'turnpike';
  if (isSOE(projectId, displayName, root, parent, sortSeq, client)) return 'soe';
  if (isLab(projectId, displayName, root, parent, sortSeq, client)) return 'lab';
  if (isHwy(projectId, displayName, root, parent, sortSeq, client)) return 'hwy';
  if (isBridge(projectId, displayName, root, parent, sortSeq, client)) return 'bridge';
  return null;
}

function shouldExclude(projectId, displayName, root, parent, sortSeq, client) {
  return getExclusionReason(projectId, displayName, root, parent, sortSeq, client) !== null;
}

function listProjectsAndPhases() {
  const projectMap = new Map();
  const excludedProjectsHard = [];
  const excludedProjectsKeywords = [];
  const excludedPhases = [];

  // First pass: identify excluded parent projects
  for (const record of records) {
    const projectId = record['Project ID'];
    const displayName = record['Project Display Name'] || '';
    const root = record['Root'] || '';
    const parent = record['Parent'] || '';
    const sortSeq = record['Sort Sequence'] || '';
    const client = record['Client'] || '';
    const level = parseInt(record['Level'], 10);

    if (projectId.match(/^G(00-100|99-999)$/)) continue;

    if (level === 0) {
      const reason = getExclusionReason(projectId, displayName, root, parent, sortSeq, client);
      
      if (reason === 'hardExcluded') {
        excludedProjectsHard.push(`${projectId} - ${displayName}`);
      } else if (reason) {
        excludedProjectsKeywords.push(`${projectId} - ${displayName} (${reason.toUpperCase()})`);
      } else {
        projectMap.set(projectId, {
          projectId,
          displayName,
          phases: []
        });
      }
    }
  }

  // Second pass: add phases and exclude only phases with keywords
  for (const record of records) {
    const projectId = record['Project ID'];
    const displayName = record['Project Display Name'] || '';
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
        
        if (excludedProjectsHard.some(p => p.startsWith(parentId)) || 
            excludedProjectsKeywords.some(p => p.startsWith(parentId))) {
          excludedPhases.push(`${projectId} - ${displayName}`);
        } else if (projectMap.has(parentId)) {
          // Check if THIS PHASE has excluded keywords
          const reason = getExclusionReason(projectId, displayName, root, parent, sortSeq, client);
          if (reason) {
            excludedPhases.push(`${projectId} - ${displayName} (${reason.toUpperCase()})`);
          } else {
            // Only include phase if it doesn't have excluded keywords
            projectMap.get(parentId).phases.push({
              projectId,
              displayName
            });
          }
        }
      }
    }
  }

  const projectArray = Array.from(projectMap.entries());
  let totalPhases = 0;

  console.log(`=== PROJECTS AND PHASES (INCLUDED) ===\n`);

  projectArray.forEach(([projectId, projectData]) => {
    console.log(`${projectId} - ${projectData.displayName}`);
    
    if (projectData.phases.length > 0) {
      projectData.phases.forEach(phase => {
        console.log(`  ${phase.projectId} - ${phase.displayName}`);
        totalPhases++;
      });
    }
  });

  console.log(`\n\n=== EXCLUDED PROJECTS (hardExcludedProjects list) (${excludedProjectsHard.length}) ===`);
  excludedProjectsHard.forEach(project => {
    console.log(project);
  });

  console.log(`\n\n=== EXCLUDED PROJECTS (keywords) (${excludedProjectsKeywords.length}) ===`);
  excludedProjectsKeywords.forEach(project => {
    console.log(project);
  });

  console.log(`\n\n=== EXCLUDED PHASES (${excludedPhases.length}) ===`);
  excludedPhases.forEach(phase => {
    console.log(phase);
  });

  console.log(`\n\n=== SUMMARY ===`);
  console.log(`Total projects (included): ${projectArray.length}`);
  console.log(`Total phases (included): ${totalPhases}`);
  console.log(`Total excluded projects (hardExcluded): ${excludedProjectsHard.length}`);
  console.log(`Total excluded projects (keywords): ${excludedProjectsKeywords.length}`);
  console.log(`Total excluded phases: ${excludedPhases.length}`);
}

listProjectsAndPhases();