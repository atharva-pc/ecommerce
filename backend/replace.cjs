const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'utils/sendEmail.js');
let content = fs.readFileSync(targetFile, 'utf8');

const newFuncStr = fs.readFileSync(path.join(__dirname, 'new_function.js'), 'utf8');

const startIndex = content.indexOf('export const sendArtistActionEmail = async');
const endIndex = content.indexOf('export const sendSuggestionEmail = async');

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find bounds");
    process.exit(1);
}

// We also need to fix sendArtistStatusEmail!
// Wait, I will just rewrite sendArtistStatusEmail to point to sendArtistActionEmail since they essentially do the exact same thing!
// Actually, I'll just rewrite sendArtistStatusEmail separately next, or inside this script.

content = content.substring(0, startIndex) + newFuncStr + '\n/**\n * ' + content.substring(endIndex + 14); 
// Note: endIndex is at 'export const sendSuggestionEmail', I'll just substring from there.
// Actually, `content.substring(endIndex)` starts at `export...`
content = content.substring(0, startIndex) + newFuncStr + '\n' + content.substring(endIndex);

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Replaced sendArtistActionEmail successfully");
