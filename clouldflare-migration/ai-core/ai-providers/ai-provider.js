/**
 * AI Provider Abstraction Layer
 * Supports multiple AI providers (Gemini, OpenAI, HuggingFace, etc.)
 * No restrictions - full capabilities for all providers
 */

export class AIProvider {
  constructor(providerType, config) {
    this.providerType = providerType;
    this.config = config;
    this.initialized = false;
  }

  async initialize() {
    this.initialized = true;
  }

  // ==================== Core AI Operations ====================

  /**
   * Generate text completion with full context
   */
  async generateCompletion(prompt, options = {}) {
    const {
      maxTokens = 2048,
      temperature = 0.7,
      topP = 0.9,
      topK = 40,
      systemPrompt = null,
      context = null
    } = options;

    try {
      switch (this.providerType) {
        case 'gemini':
          try {
            return await this._generateGeminiCompletion(prompt, {
              maxTokens,
              temperature,
              topP,
              topK,
              systemPrompt,
              context
            });
          } catch (geminiError) {
            console.warn('[AI] Gemini failed, trying fallback options:', geminiError.message);
            
            // Fallback 1: Try HuggingFace
            if (this.config.huggingfaceApiKey || window.API_KEYS?.huggingface) {
              try {
                console.log('[AI] → Trying HuggingFace fallback...');
                const originalConfig = { ...this.config };
                this.config = {
                  apiKey: this.config.huggingfaceApiKey || window.API_KEYS?.huggingface,
                  model: 'mistralai/Mistral-7B-Instruct-v0.2'
                };
                
                const result = await this._generateHuggingFaceCompletion(prompt, {
                  maxTokens,
                  temperature,
                  topP,
                  systemPrompt,
                  context
                });
                
                this.config = originalConfig;
                console.log('[AI] ✓ Successfully used HuggingFace fallback');
                return result;
              } catch (hfError) {
                console.warn('[AI] HuggingFace fallback failed:', hfError.message);
                
                // Fallback 2: Try AssemblyAI
                if (this.config.assemblyaiApiKey || window.ASSEMBLYAI_API_KEY) {
                  try {
                    console.log('[AI] → Trying AssemblyAI fallback...');
                    const originalConfig = { ...this.config };
                    this.config = {
                      apiKey: this.config.assemblyaiApiKey || window.ASSEMBLYAI_API_KEY || '4d33cfaaa6904787a5a47a6f9e2780a6'
                    };
                    
                    const result = await this._generateAssemblyAICompletion(prompt, {
                      maxTokens,
                      temperature,
                      systemPrompt,
                      context
                    });
                    
                    this.config = originalConfig;
                    console.log('[AI] ✓ Successfully used AssemblyAI fallback');
                    return result;
                  } catch (assemblyError) {
                    console.error('[AI] All fallbacks failed. Gemini:', geminiError.message, 'HF:', hfError.message, 'Assembly:', assemblyError.message);
                    throw new Error(`All AI providers failed. Gemini: ${geminiError.message}`);
                  }
                } else {
                  console.error('[AI] No AssemblyAI key available. Both Gemini and HuggingFace failed.');
                  throw geminiError;
                }
              }
            } else {
              console.warn('[AI] No HuggingFace API key available for fallback');
              throw geminiError;
            }
          }

        case 'openai':
          return await this._generateOpenAICompletion(prompt, {
            maxTokens,
            temperature,
            topP,
            systemPrompt,
            context
          });

        case 'huggingface':
          return await this._generateHuggingFaceCompletion(prompt, {
            maxTokens,
            temperature,
            topP,
            systemPrompt,
            context
          });

        default:
          throw new Error(`Unsupported AI provider: ${this.providerType}`);
      }
    } catch (error) {
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  /**
   * Structured data extraction from text
   */
  async extractData(text, schema) {
    const prompt = `Extract structured data from the following text according to this schema:
${JSON.stringify(schema, null, 2)}

Text to extract from:
${text}

Return only valid JSON matching the schema exactly.`;

    const response = await this.generateCompletion(prompt, {
      temperature: 0.1,
      maxTokens: 1024
    });

    try {
      return JSON.parse(response);
    } catch (error) {
      throw new Error(`Failed to parse extracted data: ${error.message}`);
    }
  }

  /**
   * Text classification and sentiment analysis
   */
  async classifyText(text, categories) {
    const prompt = `Classify the following text into one of these categories: ${categories.join(', ')}

Text: ${text}

Respond with only the category name.`;

    return await this.generateCompletion(prompt, {
      temperature: 0.1,
      maxTokens: 50
    });
  }

  // ==================== Provider-Specific Implementations ====================

  async _generateGeminiCompletion(prompt, options) {
    const { maxTokens, temperature, topP, topK, systemPrompt, context } = options;

    let contents = [];

    if (systemPrompt) {
      contents.push({
        role: "user",
        parts: [{ text: systemPrompt }]
      });
      contents.push({
        role: "model",
        parts: [{ text: "I understand. I'll assist with full database access and capabilities." }]
      });
    }

    if (context) {
      contents.push({
        role: "user",
        parts: [{ text: `Context: ${JSON.stringify(context, null, 2)}` }]
      });
      contents.push({
        role: "model",
        parts: [{ text: "Context understood." }]
      });
    }

    contents.push({
      role: "user",
      parts: [{ text: prompt }]
    });

    const requestBody = {
      contents: contents,
      generationConfig: {
        temperature: temperature,
        topK: topK,
        topP: topP,
        maxOutputTokens: maxTokens,
        candidateCount: 1
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE"
        }
      ]
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.config.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  async _generateOpenAICompletion(prompt, options) {
    const { maxTokens, temperature, topP, systemPrompt, context } = options;

    const messages = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    if (context) {
      messages.push({ role: 'user', content: `Context: ${JSON.stringify(context, null, 2)}` });
      messages.push({ role: 'assistant', content: 'Context understood.' });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: maxTokens,
        temperature: temperature,
        top_p: topP
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async _generateHuggingFaceCompletion(prompt, options) {
    const { maxTokens, temperature, topP, systemPrompt, context } = options;

    let fullPrompt = '';

    if (systemPrompt) {
      fullPrompt += `System: ${systemPrompt}\n\n`;
    }

    if (context) {
      fullPrompt += `Context: ${JSON.stringify(context, null, 2)}\n\n`;
    }

    fullPrompt += `User: ${prompt}\n\nAssistant:`;

    const response = await fetch(`https://api-inference.huggingface.co/models/${this.config.model || 'mistralai/Mistral-7B-Instruct-v0.2'}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: maxTokens,
          temperature: temperature,
          top_p: topP,
          return_full_text: false,
          do_sample: true
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`HuggingFace API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      return data[0].generated_text || '';
    }

    throw new Error('No response from HuggingFace API');
  }

  /**
   * AssemblyAI LeMUR (LLM) for backup/fallback
   */
  async _generateAssemblyAICompletion(prompt, options) {
    const { maxTokens, temperature, systemPrompt } = options;

    let fullPrompt = prompt;
    if (systemPrompt) {
      fullPrompt = `${systemPrompt}\n\n${prompt}`;
    }

    // Using AssemblyAI's LeMUR (their LLM API)
    const response = await fetch('https://api.assemblyai.com/lemur/v3/generate/task', {
      method: 'POST',
      headers: {
        'Authorization': this.config.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        max_output_size: maxTokens,
        temperature: temperature
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AssemblyAI API error: ${error}`);
    }

    const data = await response.json();
    return data.response || '';
  }

  // ==================== Advanced Capabilities ====================

  /**
   * Chain multiple AI calls for complex reasoning
   */
  async chainOfThought(prompts, sharedContext = {}) {
    let context = { ...sharedContext };
    let responses = [];

    for (const prompt of prompts) {
      const response = await this.generateCompletion(prompt, {
        context: context,
        temperature: 0.5
      });

      responses.push(response);

      // Update context with response
      context.lastResponse = response;
    }

    return responses;
  }

  /**
   * Multi-provider fallback for reliability
   */
  async generateWithFallback(prompt, options = {}, fallbackProviders = []) {
    try {
      return await this.generateCompletion(prompt, options);
    } catch (error) {
      console.warn(`Primary provider ${this.providerType} failed, trying fallback:`, error.message);

      for (const fallbackConfig of fallbackProviders) {
        try {
          const fallbackProvider = new AIProvider(fallbackConfig.type, fallbackConfig.config);
          await fallbackProvider.initialize();
          return await fallbackProvider.generateCompletion(prompt, options);
        } catch (fallbackError) {
          console.warn(`Fallback provider ${fallbackConfig.type} also failed:`, fallbackError.message);
        }
      }

      throw new Error('All AI providers failed');
    }
  }

  /**
   * Batch processing for efficiency
   */
  async batchGenerate(prompts, options = {}) {
    const results = [];
    const batchSize = 5; // Process 5 requests in parallel

    for (let i = 0; i < prompts.length; i += batchSize) {
      const batch = prompts.slice(i, i + batchSize);
      const batchPromises = batch.map(prompt =>
        this.generateCompletion(prompt, options).catch(error => ({ error: error.message }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Streaming generation for long responses
   */
  async *generateStream(prompt, options = {}) {
    // This would need to be implemented based on provider-specific streaming APIs
    // For now, we'll yield the complete response
    const response = await this.generateCompletion(prompt, options);
    yield response;
  }
}

export default AIProvider;
