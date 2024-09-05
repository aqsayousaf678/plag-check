const express = require('express');
const router = express.Router();
const upload= require('../middleware/uploadMiddleWare');
const { extractTextFromFile, checkPlagiarismOnline, compareWithDatabase, generatePlagiarismReport } = require('../Controllers/plagiarismController');
const Document = require('../Models/Document');
router.post('/upload', async (req, res) => {
  upload(req, res, async (err) => {
    console.log("req landed",req.file)
    if (err) {
      return res.status(400).send({ message: err });
    }
    if (!req.file) {
      return res.status(400).send({ message: 'No file selected!' });
    }
 
    try {
      const text = await extractTextFromFile(req.file.path, req.file.mimetype.split('/')[1]);
      const onlineMatches = await checkPlagiarismOnline(text);
      const databaseMatches = await compareWithDatabase(text);
      
      // Save the document in the database
      const newDocument = new Document({ title: req.file.filename, text });
      await newDocument.save();
 
      const report = generatePlagiarismReport(onlineMatches, databaseMatches);
 
      res.send({ message: 'File processed successfully', report });
    } catch (error) {
      res.status(500).send({ message: 'Error processing file', error });
    }
  });
});
 
module.exports = router;