const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'utils/sendEmail.js');
let content = fs.readFileSync(targetFile, 'utf8');

const newFuncStr = fs.readFileSync(path.join(__dirname, 'new_status_function.js'), 'utf8');

const startIndex = content.indexOf('export const sendArtistStatusEmail = async');
const endIndex = content.indexOf('export const sendArtistActionEmail = async');

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find bounds");
    process.exit(1);
}

content = content.substring(0, startIndex) + newFuncStr + '\n/**\n * ' + content.substring(endIndex + 14); 
// Wait, `endIndex` points to `export const sendArtistActionEmail = async`.
// Above it is `/**\n * Send Artist Action Email`.
// Let's just find `/**\n * Send Artist Action Email` as endIndex.
const docIndex = content.lastIndexOf('/**', endIndex);
if (docIndex !== -1 && docIndex > startIndex) {
    content = content.substring(0, startIndex) + newFuncStr + '\n\n' + content.substring(docIndex);
} else {
    content = content.substring(0, startIndex) + newFuncStr + '\n\n' + content.substring(endIndex);
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Replaced sendArtistStatusEmail successfully");
