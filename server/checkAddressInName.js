const fs = require('fs');
const { parse } = require('csv-parse');

const csvFilePath = 'C:\\Users\\faulk\\Downloads\\Project sh - Project (1).csv';

let allProjects = 0;
let withCompleteAddress = 0;
let withAddressInName = 0;
let withNeither = 0;
const projectsWithNeither = [];

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
      
      allProjects++;
      const city = row['City'] ? row['City'].trim() : '';
      const state = row['AddressState'] ? row['AddressState'].trim() : '';
      const name = row['Project Display Name'] || '';
      
      const hasCompleteAddress = city && state;
      const hasAddressPattern = /\d+|street|road|avenue|lane|drive|blvd|pike|bridge|park/i.test(name);
      
      if (hasCompleteAddress) {
        withCompleteAddress++;
      } else if (hasAddressPattern) {
        withAddressInName++;
      } else {
        withNeither++;
        projectsWithNeither.push({
          id: row['Project ID'],
          name: name
        });
      }
    }
  })
  .on('end', () => {
    console.log('\n========== ADDRESS COVERAGE ACROSS ALL PROJECTS ==========\n');
    console.log(`Total root projects: ${allProjects}`);
    console.log(`With complete City AND State: ${withCompleteAddress}`);
    console.log(`Missing City/State but have address in name: ${withAddressInName}`);
    console.log(`With NO address info anywhere: ${withNeither}\n`);
    
    if (projectsWithNeither.length > 0) {
      console.log(`Projects with no address info (${projectsWithNeither.length}):`);
      projectsWithNeither.forEach(p => {
        console.log(`  ${p.id} - ${p.name}`);
      });
    }
  });