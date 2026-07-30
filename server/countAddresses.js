const fs = require('fs');
const { parse } = require('csv-parse');

const csvFilePath ='C:\\Users\\faulk\\Downloads\\Project sh - Project (1).csv';

let level0WithBoth = 0;
let level0WithCityOnly = 0;
let level0WithStateOnly = 0;
let level0WithNeither = 0;
const projectsMissingData = [];

fs.createReadStream(csvFilePath)
  .pipe(parse({
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true
  }))
  .on('data', (row) => {
    if (row['Level'] === '0') {
      const projectId = row['Project ID'];
      if (projectId === 'G00-100' || projectId === 'G99-999') return; // Skip
      
      const city = row['City'] ? row['City'].trim() : '';
      const state = row['AddressState'] ? row['AddressState'].trim() : '';
      
      if (city && state) {
        level0WithBoth++;
      } else if (city && !state) {
        level0WithCityOnly++;
        projectsMissingData.push({
          id: row['Project ID'],
          name: row['Project Display Name'],
          missing: 'State'
        });
      } else if (!city && state) {
        level0WithStateOnly++;
        projectsMissingData.push({
          id: row['Project ID'],
          name: row['Project Display Name'],
          missing: 'City'
        });
      } else {
        level0WithNeither++;
        projectsMissingData.push({
          id: row['Project ID'],
          name: row['Project Display Name'],
          missing: 'Both'
        });
      }
    }
  })
  .on('end', () => {
    console.log('\n========== ADDRESS COVERAGE ==========\n');
    console.log(`Root projects WITH City AND State: ${level0WithBoth}`);
    console.log(`Root projects with City only (missing State): ${level0WithCityOnly}`);
    console.log(`Root projects with State only (missing City): ${level0WithStateOnly}`);
    console.log(`Root projects with neither City nor State: ${level0WithNeither}`);
    console.log(`\nProjects with incomplete address (first 10):`);
    projectsMissingData.slice(0, 10).forEach(p => {
      console.log(`  ${p.id} - ${p.name} [Missing: ${p.missing}]`);
    });
  });