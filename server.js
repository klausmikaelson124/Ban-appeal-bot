// Import required packages
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

// Create an instance of express
const app = express();
const port = 3000;

// Set your GitHub Webhook secret (optional but recommended)
const secret = 'https://discord.com/api/webhooks/1327916700523565117/JSLPYLL2N1LHpJKcp6ewl_t_FxCYR7fCHnGBT8FaDmlC6JxrUY8SEm93KAqlr0Pf0dlJ'; // Change this to your actual secret

// Use body-parser to parse JSON payloads
app.use(bodyParser.json());

// Function to verify the GitHub webhook signature
function verifySignature(req, res, next) {
  const signature = req.headers['x-hub-signature'];
  const payload = JSON.stringify(req.body);

  // Create the HMAC (hash) using the secret and payload
  const hmac = crypto.createHmac('sha1', secret);
  const digest = 'sha1=' + hmac.update(payload).digest('hex');

  if (signature === digest) {
    next(); // Signature is valid, proceed with the request
  } else {
    res.status(400).send('Invalid signature'); // Reject if signatures do not match
  }
}

// Set up the route to handle the webhook payload
app.post('/github-webhook', verifySignature, (req, res) => {
  const payload = req.body;

  // Log the received GitHub webhook payload
  console.log('Received GitHub webhook:', payload);

  // Process the payload based on the event type (example: push event)
  if (payload && payload.action) {
    if (payload.action === 'push') {
      console.log(`New push to branch ${payload.ref} by ${payload.pusher.name}`);
    }
    // Add other event types if needed (pull request, issues, etc.)
  }

  // Respond with status 200 to acknowledge receipt of the webhook
  res.status(200).send('Webhook received');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
