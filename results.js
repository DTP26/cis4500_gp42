const fs = require('fs');

const masterFile = 'masterdata.json';
const resultsFile = 'resultsData.json';

try {
  // Read and parse the masterdata.json file
  const data = JSON.parse(fs.readFileSync(masterFile, 'utf-8'));

  // Extract the "results" field
  const resultsData = data.map(item => item.results).flat(); // Flattens nested arrays if needed

  // Write the extracted "results" data to resultsData.json
  fs.writeFileSync(resultsFile, JSON.stringify(resultsData, null, 2));
  console.log(`"results" data successfully extracted to ${resultsFile}`);
} catch (error) {
  console.error(`Error processing file:`, error);
}
