const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const axios = require('axios');
const Document = require('../Models/Document');
 
// Extract text from file
exports.extractTextFromFile = async (filePath, fileType) => {
  let text = '';
 
  if (fileType === 'pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    text = data.text;
  } else if (fileType === 'docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    text = result.value;
  } else if (fileType === 'txt') {
    text = fs.readFileSync(filePath, 'utf8');
  }
 
  return text;
};
 
// Check plagiarism online using Google Custom Search API
exports.checkPlagiarismOnline = async (text) => {
  const apiKey = 'YOUR_GOOGLE_API_KEY';
  const cx = 'YOUR_CUSTOM_SEARCH_ENGINE_ID';
  const query = encodeURIComponent(text);
  const url = 'https://www.googleapis.com/customsearch/v1?q=${query}&key=${apiKey}&cx=${cx}';
 
  try {
    const response = await axios.get(url);
    return response.data.items || [];
  } catch (error) {
    console.error('Error checking plagiarism online:', error);
    return [];
  }
};
 
// Compare with internal database
exports.compareWithDatabase = async (text) => {
  const results = await Document.find();
  const matches = [];
 
  results.forEach((doc) => {
    const similarity = calculateSimilarity(text, doc.text); // Implement this function
    if (similarity > 0.8) {
      matches.push({
        title: doc.title,
        similarity: similarity,
        text: doc.text
      });
    }
  });
 
  return matches;
};
 
// Generate plagiarism report
exports.generatePlagiarismReport = (onlineMatches, databaseMatches) => {
  const report = {
    onlineMatches: onlineMatches.map(item => ({ title: item.title, link: item.link })),
    databaseMatches: databaseMatches.map(doc => ({ title: doc.title, similarity: doc.similarity }))
  };
 
  return report;
};
 
// A simple similarity checker (using Jaccard Index as an example)
const calculateSimilarity = (text1, text2) => {
  const set1 = new Set(text1.split(/\s+/));
  const set2 = new Set(text2.split(/\s+/));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
};