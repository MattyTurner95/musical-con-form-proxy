// functions/audience-republic.js
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Enable CORS for your Webflow domain
  const headers = {
    'Access-Control-Allow-Origin': '*',
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
    console.log('Received request with email:', email);
    
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

    const provider = 'webflow';
    console.log('Sending contact data to Audience Republic');
    
    // Step 1: Create/update the contact with tags
    const contactResponse = await fetch(`https://arep.co/api/v1/ingest/contacts?provider=${provider}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer f908b70e7f08fc11315dd4d1baa553266a5faaca7fcbfff89b1f166f627a58f3'
      },
      body: JSON.stringify(contactData)
    });

    if (!contactResponse.ok) {
      const errorText = await contactResponse.text();
      console.error('Error creating contact:', errorText);
      throw new Error(`Failed to create contact: ${contactResponse.status} ${contactResponse.statusText}`);
    }
    
    const contactResult = await contactResponse.json();
    console.log('Contact created successfully:', contactResult);
    
    // Step 2: Add the contact to a mailing list
    const mailingListData = {
      "name": "Musical Con", // Exact list name with proper capitalization
      "contact-ids": [email]
    };
    
    console.log('Adding contact to mailing list');
    const listResponse = await fetch(`https://arep.co/api/v1/ingest/mailing-list?provider=${provider}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer f908b70e7f08fc11315dd4d1baa553266a5faaca7fcbfff89b1f166f627a58f3'
      },
      body: JSON.stringify(mailingListData)
    });
    
    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.error('Error adding to mailing list:', errorText);
      // We still return success if contact was created but list addition failed
      return {
        statusCode: 207,
        headers,
        body: JSON.stringify({ 
          success: true, 
          contact: contactResult,
          warning: `Contact created but not added to list: ${listResponse.status} ${listResponse.statusText}`
        })
      };
    }
    
    const listResult = await listResponse.json();
    console.log('Contact added to mailing list:', listResult);
    
    // Return success with both results
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        contact: contactResult,
        list: listResult
      })
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
