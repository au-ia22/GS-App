const fs = require('fs');
const { parse } = require('csv-parse/sync');

const csvFilePath = 'C:\\Users\\faulk\\Downloads\\Project sh - Project (1).csv';
const csvContent = fs.readFileSync(csvFilePath, 'utf8');
const records = parse(csvContent, { columns: true, skip_empty_lines: true });

const projectIds = ['G21-275', 'G22-347', 'G25-168', 'G25-284', 'G25-342', 'G25-408'];

for (const record of records) {
  if (projectIds.includes(record['Project ID'])) {
    console.log(`${record['Project ID']}: ${record['Project Display Name']}`);
  }
}