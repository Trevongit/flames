// Example express server for TTS synthesis.
// Do NOT use in production without adding authentication and rate limiting.
const express = require('express');

const app = express();
app.use(express.json());

app.post('/synth', async (req, res) => {
  // Here you would call your real TTS provider and stream the result.
  // This example just returns 501 to show the shape of the request.
  console.log('Received synth request', req.body);
  res.status(501).send('Not implemented');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Example TTS server listening on ${port}`));
