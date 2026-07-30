const fs = require('fs');
const { parse } = require('csv-parse');

const csvFilePath = 'C:\\Users\\faulk\\Downloads\\Project sh - Project (1).csv';

let level0Count = 0;
let phasesCount = 0; // Level 1 + Level 2
let totalRows = 0;

fs.createReadStream(csvFilePath)
  .pipe(parse({
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true
  }))
  .on('data', (row) => {
    const projectId = row['Project ID'];
    if (projectId === 'G00-100' || projectId === 'G99-999') return; // Skip
    
    totalRows++;
    const level = row['Level'];
    
    if (level === '0') {
      level0Count++;
    } else if (level === '1' || level === '2') {
      phasesCount++;
    }
  })
  .on('end', () => {
    console.log('\n========== CSV PARSED WITH csv-parse ==========\n');
    console.log(`Total rows parsed: ${totalRows}`);
    console.log(`\nRoot Projects (Level 0): ${level0Count}`);
    console.log(`Phases (Level 1 + Level 2): ${phasesCount}`);
    console.log(`\nTotal: ${level0Count} + ${phasesCount} = ${level0Count + phasesCount}`);
  });