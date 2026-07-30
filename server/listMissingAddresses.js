const fs = require('fs');
const { parse } = require('csv-parse');

const csvFilePath = 'C:\\Users\\faulk\\Downloads\\Project sh - Project (1).csv';

const projectsMissing = [];

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
      
      if (!city || !state) {
        projectsMissing.push({
          id: row['Project ID'],
          name: row['Project Display Name'],
          city: city || '(missing)',
          state: state || '(missing)',
          missing: !city && !state ? 'Both' : (!city ? 'City' : 'State')
        });
      }
    }
  })
  .on('end', () => {
    console.log('\n========== PROJECTS WITH INCOMPLETE ADDRESSES ==========\n');
    console.log(`Total projects missing address: ${projectsMissing.length}\n`);
    
    projectsMissing.forEach(p => {
      console.log(`${p.id} - ${p.name}`);
      console.log(`  City: ${p.city} | State: ${p.state} | Missing: ${p.missing}`);
      console.log();
    });
  });