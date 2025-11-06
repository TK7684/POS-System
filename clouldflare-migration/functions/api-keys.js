// Cloudflare Pages Function to expose API keys to client (safely)
// Only exposes the keys, doesn't expose other secrets

export async function onRequest(context) {
  const { env, request } = context;
  
  // Only allow GET requests
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Get API keys from environment
  const googleApiKey = env?.GOOGLE_CLOUD_API_KEY || '';
  const huggingFaceKey = env?.HUGGING_FACE_API_KEY || '';

  // Return as JavaScript that sets window variables
  // Only expose if keys are set (not empty)
  const hasGoogleKey = googleApiKey && googleApiKey.trim() !== '';
  const hasHuggingFaceKey = huggingFaceKey && huggingFaceKey.trim() !== '';
  
  const js = `
// API Keys injected from Cloudflare Pages environment
${hasGoogleKey ? `window.GOOGLE_CLOUD_API_KEY = "${googleApiKey}";` : 'window.GOOGLE_CLOUD_API_KEY = null;'}
${hasHuggingFaceKey ? `window.HUGGING_FACE_API_KEY = "${huggingFaceKey}";` : 'window.HUGGING_FACE_API_KEY = null;'}
console.log('✅ API keys loaded:', {
  google: ${hasGoogleKey ? 'true' : 'false'},
  huggingface: ${hasHuggingFaceKey ? 'true' : 'false'}
});
`;

  return new Response(js, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
