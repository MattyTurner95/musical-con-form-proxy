// functions/audience-republic.js
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Enable CORS for your Webflow domain
  const headers = {
    'Access-Control-Allow-Origin': '*', // For development, lock this down to your specific domain later
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse the request body
    const { email } = JSON.parse(event.body);
    
    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email is required' })
      };
    }
    
    // Prepare the data for Audience Republic
    const contactData = [{
      "id": email,
      "email-address": email,
      "tags": ["musical con sign up form"]
    }];

    // Send to Audience Republic
    const response = await fetch('https://arep.co/api/v1/ingest/contacts?provider=webflow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer f908b70e7f08fc11315dd4d1baa553266a5faaca7fcbfff89b1f166f627a58f3'
      },
      body: JSON.stringify(contactData)
    });

    const data = await response.json();
    
    // Return success
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data })
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message 
      })
    };
  }
};