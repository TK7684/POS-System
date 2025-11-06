// Cloudflare Pages Function to proxy Hugging Face API calls
// This avoids CORS issues when calling Hugging Face from the browser
// Route: /api/huggingface

export async function onRequestPost(context) {
  const { env, request } = context;
  
  try {
    const huggingFaceKey = env?.HUGGING_FACE_API_KEY || '';
    
    if (!huggingFaceKey || huggingFaceKey.trim() === '') {
      return new Response(JSON.stringify({ error: 'Hugging Face API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get the request body
    const body = await request.json();
    const { model = 'microsoft/DialoGPT-large', inputs } = body;
    
    if (!inputs) {
      return new Response(JSON.stringify({ error: 'Missing inputs parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Call Hugging Face API (using new endpoint)
    const response = await fetch(`https://router.huggingface.co/hf-inference/v1/models/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${huggingFaceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ 
        error: 'Hugging Face API error',
        details: errorText 
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const data = await response.json();
    
    // Return the response with CORS headers
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle OPTIONS for CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

