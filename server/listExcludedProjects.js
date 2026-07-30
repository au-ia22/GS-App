const fs = require('fs');
const { parse } = require('csv-parse/sync');

const csvFilePath = 'C:\\Users\\faulk\\Downloads\\Project sh - Project (1).csv';
const csvContent = fs.readFileSync(csvFilePath, 'utf8');
const records = parse(csvContent, { columns: true, skip_empty_lines: true });

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

const projectIdPattern = /^G\d+-\d+\s+-\s+(.+)$/;

function listExcludedProjects() {
  const excludedProjects = [];
  let totalProjects = 0;

  for (const record of records) {
    const projectId = record['Project ID'];
    const displayName = record['Project Display Name'] || '';
    const level = parseInt(record['Level'], 10);

    if (projectId.match(/^G(00-100|99-999)$/)) continue;
    if (level !== 0) continue;

    totalProjects++;

    if (hardExcludedProjects.has(projectId)) {
      const match = displayName.match(projectIdPattern);
      const address = match ? match[1].trim() : displayName;
      
      excludedProjects.push({
        id: projectId,
        name: address
      });
    }
  }

  const remaining = totalProjects - excludedProjects.length;
  const percentage = ((remaining / totalProjects) * 100).toFixed(2);

  console.log(`=== Excluded Projects (${excludedProjects.length}) ===\n`);
  
  excludedProjects.forEach((project, index) => {
    console.log(`${index + 1}. ${project.id} - ${project.name}`);
  });
  
  console.log(`\nTotal projects: ${totalProjects}`);
  console.log(`Excluded: ${excludedProjects.length}`);
  console.log(`Remaining: ${remaining}`);
  console.log(`Percentage remaining: ${percentage}%`);
}

listExcludedProjects();