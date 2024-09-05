const express = require('express');
const mongoose = require('mongoose');
const natural = require('natural');
const axios = require('axios');
const qs = require('qs');
const uploadRoutes = require('./Routes/upload'); // Make sure this path is correct

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize natural components
const TfIdf = natural.TfIdf;
const levenshtein = natural.LevenshteinDistance;
const tokenizer = new natural.WordTokenizer();

// Connect to MongoDB
mongoose.connect('mongodb://localhost/plagiarism_checker', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Function to calculate cosine similarity
function cosineSimilarity(vectorA, vectorB) {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    // Calculate dot product
    for (let key in vectorA) {
        if (vectorB.hasOwnProperty(key)) {
            dotProduct += vectorA[key] * vectorB[key];
        }
    }

    // Calculate magnitudes
    for (let key in vectorA) {
        magnitudeA += Math.pow(vectorA[key], 2);
    }
    magnitudeA = Math.sqrt(magnitudeA);

    for (let key in vectorB) {
        magnitudeB += Math.pow(vectorB[key], 2);
    }
    magnitudeB = Math.sqrt(magnitudeB);

    // Return cosine similarity
    return (magnitudeA * magnitudeB === 0) ? 0 : (dotProduct / (magnitudeA * magnitudeB));
}

// Function to check plagiarism
function checkPlagiarism(text1, text2) {
    // Step 2: Calculate Cosine Similarity using TfIdf
    const tfidf = new TfIdf();
    tfidf.addDocument(text1);
    tfidf.addDocument(text2);

    const vector1 = {};
    const vector2 = {};

    tfidf.listTerms(0).forEach(term => vector1[term.term] = term.tfidf);
    tfidf.listTerms(1).forEach(term => vector2[term.term] = term.tfidf);

    const cosineSim = cosineSimilarity(vector1, vector2);

    // Step 3: Calculate Levenshtein Distance
    const levenshteinDistance = levenshtein(text1, text2);

    // Step 4: Compute the overall similarity score
    const similarityScore = (cosineSim + (1 - levenshteinDistance / Math.max(text1.length, text2.length))) / 2;

    // Step 5: Output results
    console.log('Cosine Similarity:', cosineSim.toFixed(2));
    console.log('Levenshtein Distance:', levenshteinDistance.toFixed(2));
    console.log('Overall Similarity Score:', similarityScore.toFixed(2));

    return similarityScore;
}

// Define routes
app.use(express.json());
app.use('/api', uploadRoutes);

// Route to handle plagiarism check
app.post('/check-plagiarism', (req, res) => {
    const { text1, text2 } = req.body;
    if (!text1 || !text2) {
        return res.status(400).json({ error: 'Both text1 and text2 are required.' });
    }
    const similarityScore = checkPlagiarism(text1, text2);
    res.json({ similarityScore });
});

// Route to make an external API request using Axios
app.get('/external-api', (req, res) => {
    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://plagiarismcheck.org/api/v1/text/report/22621123',
        headers: { 
            'X-API-TOKEN': 'N_T2UDPwEcwo0APTrJuZFnnRjJVeew9h'
        }
    };

    axios.request(config)
    .then(response => {
        res.json(response.data);
    })
    .catch(error => {
        res.status(500).json({ error: 'An error occurred while making the API request.' });
    });
});

app.post('/submit-text', async (req, res) => {
  try {
      const text = req.body.text;
      if (!text) {
          return res.status(400).json({ error: 'Text is required.' });
      }

      // Prepare the request data
      const data = qs.stringify({
          'language': 'en',
          'text': text
      });

      // Configure Axios request
      const config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: 'https://plagiarismcheck.org/api/v1/text',
          headers: { 
              'X-API-TOKEN': 'N_T2UDPwEcwo0APTrJuZFnnRjJVeew9h', 
              'Content-Type': 'application/x-www-form-urlencoded', 
          },
          data: data
      };

      // Make the API request
      const response = await axios.request(config);
      res.json(response.data);
  } catch (error) {
      console.error('Error making API request:', error);
      res.status(500).json({ error: 'An error occurred while making the API request.' });
  }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
