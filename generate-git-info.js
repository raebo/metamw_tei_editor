// generate-git-info.js
const { execSync } = require('child_process');
const fs = require('fs');

// Get the latest Git commit hash
const commitHash = execSync('git rev-parse --short HEAD').toString().trim();

// Get the latest Git commit date
const commitDate = execSync('git log -1 --format=%cd --date=iso').toString().trim();

// Create an object with the Git info
const gitInfo = {
  commitHash,
  commitDate,
};

// Write the Git info to a JSON file
fs.writeFileSync('./dist/git-info.json', JSON.stringify(gitInfo, null, 2));

console.log('Git info generated:', gitInfo);
