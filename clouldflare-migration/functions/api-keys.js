// Cloudflare Pages Function to expose API keys to client (safely)
// Route: /api-keys (Cloudflare Pages Functions route without .js extension)
// Only exposes the keys, doesn't expose other secrets

export async function onRequest(context) {
  const { env, request } = context;
  
  // Only allow GET requests
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  // Get API keys from environment (support both old and new variable names for backward compatibility)
  const googleApiKey = env?.GOOGLE_GEMINI_API || env?.GOOGLE_CLOUD_API_KEY || '';
  const huggingFaceKey = env?.HUGGING_FACE_API_KEY || '';
  const assemblyAIKey = env?.ASSEMBLYAI_API_KEY || '4d33cfaaa6904787a5a47a6f9e2780a6'; // Fallback key provided

  // Return as JavaScript that sets window variables
  // Only expose if keys are set (not empty)
  const hasGoogleKey = googleApiKey && googleApiKey.trim() !== '';
  const hasHuggingFaceKey = huggingFaceKey && huggingFaceKey.trim() !== '';
  const hasAssemblyAIKey = assemblyAIKey && assemblyAIKey.trim() !== '';
  
  // Escape any quotes in the keys to prevent injection
  const escapedGoogleKey = hasGoogleKey ? googleApiKey.replace(/"/g, '\\"') : '';
  const escapedHuggingFaceKey = hasHuggingFaceKey ? huggingFaceKey.replace(/"/g, '\\"') : '';
  const escapedAssemblyAIKey = hasAssemblyAIKey ? assemblyAIKey.replace(/"/g, '\\"') : '';
  
  const js = `// API Keys injected from Cloudflare Pages environment
// Support both variable names for backward compatibility
${hasGoogleKey ? `window.GOOGLE_GEMINI_API_KEY = "${escapedGoogleKey}";` : 'window.GOOGLE_GEMINI_API_KEY = null;'}
${hasGoogleKey ? `window.GOOGLE_CLOUD_API_KEY = "${escapedGoogleKey}";` : 'window.GOOGLE_CLOUD_API_KEY = null;'}
${hasHuggingFaceKey ? `window.HUGGING_FACE_API_KEY = "${escapedHuggingFaceKey}";` : 'window.HUGGING_FACE_API_KEY = null;'}
${hasAssemblyAIKey ? `window.ASSEMBLYAI_API_KEY = "${escapedAssemblyAIKey}";` : 'window.ASSEMBLYAI_API_KEY = null;'}
console.log('✅ API keys loaded from Cloudflare Pages:', {
  google: ${hasGoogleKey ? 'true' : 'false'},
  huggingface: ${hasHuggingFaceKey ? 'true' : 'false'},
  assemblyai: ${hasAssemblyAIKey ? 'true' : 'false'}
});
`;

  return new Response(js, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
