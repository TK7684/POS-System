/**
 * Gemini API Integration for Enhanced AI Agent
 * Provides intelligent text processing and categorization using Google's Gemini AI
 *
 * @author Gemini Integration Specialist
 * @version 1.0
 */

class AIAgentGemini {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
    this.model = 'gemini-1.5-flash';
    this.cache = new Map();
    this.cacheTimeout = 300000; // 5 minutes
  }

  /**
   * Initialize Gemini API
   * @returns {boolean} Success status
   */
  async initialize() {
    try {
      const response = await this.generateContent("Test connection", "Respond with 'OK' if you can read this.");
      return response.includes('OK');
    } catch (error) {
      console.error('Gemini API initialization failed:', error);
      return false;
    }
  }

  /**
   * Generate content using Gemini API
   * @param {string} prompt - The prompt to send
   * @param {string} context - Context information
   * @returns {string} Generated response
   */
  async generateContent(prompt, context = '') {
    const cacheKey = `${prompt}-${context}`.substring(0, 100);

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.response;
      }
    }

    try {
      const response = await fetch(`${this.baseURL}/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${context}\n\n${prompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
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
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const generatedText = data.candidates[0].content.parts[0].text;

        // Cache the response
        this.cache.set(cacheKey, {
          response: generatedText,
          timestamp: Date.now()
        });

        return generatedText;
      } else {
        throw new Error('No response from Gemini API');
      }
    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw error;
    }
  }

  /**
   * Parse expense text using Gemini AI
   * @param {string} text - Raw expense text
   * @returns {Object} Parsed expense data
   */
  async parseExpenseText(text) {
    const prompt = `
Parse the following restaurant expense text and return a JSON object with the following structure:
{
  "items": [
    {
      "date": "YYYY-MM-DD",
      "description": "Item description in Thai",
      "quantity": number,
      "unit": "unit type",
      "pricePerUnit": number,
      "totalPrice": number,
      "multiplier": number,
      "category": "one of: วัตถุดิบ, ค่าใช้จ่าย, อุปกรณ์, วัสดุสิ้นเปลือง",
      "subcategory": "specific category",
      "confidence": 0.9
    }
  ]
}

Rules:
- Date format: Parse "20-Sep-2025" to "2025-09-20"
- Handle multipliers: "*12" means 12 units
- Categories:
  * วัตถุดิบ: Food ingredients (กุ้ง, พริก, มะนาว, etc.)
  * ค่าใช้จ่าย: Operating costs (ค่าจ้าง, ค่าน้ำ, ค่าไฟ)
  * อุปกรณ์: Equipment (เครื่องพิมพ์, โทรศัพท์, ที่นอน)
  * วัสดุสิ้นเปลือง: Consumables (ถุง, กล่อง, สติ๊กเกอร์)
- Calculate price per unit: totalPrice / (quantity * multiplier)
- Return ONLY JSON, no other text

Text to parse:
${text}
`;

    try {
      const response = await this.generateContent(prompt);

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      } else {
        throw new Error('No JSON found in Gemini response');
      }
    } catch (error) {
      console.error('Failed to parse expense text with Gemini:', error);
      throw error;
    }
  }

  /**
   * Categorize items using Gemini AI
   * @param {Array} items - Array of uncategorized items
   * @returns {Array} Categorized items
   */
  async categorizeItems(items) {
    const itemsText = items.map((item, index) =>
      `${index + 1}. "${item.description}" - ${item.quantity} ${item.unit} - ${item.totalPrice} บาท`
    ).join('\n');

    const prompt = `
Categorize the following restaurant items and return JSON:

${itemsText}

Return JSON structure:
{
  "categorized": {
    "วัตถุดิบ": [indices],
    "ค่าใช้จ่าย": [indices],
    "อุปกรณ์": [indices],
    "วัสดุสิ้นเปลือง": [indices]
  },
  "explanations": {
    "1": "Reason for categorization"
  }
}

Categories:
- วัตถุดิบ: Food ingredients, raw materials, seasonings
- ค่าใช้จ่าย: Operating costs, wages, utilities, services
- อุปกรณ์: Equipment, tools, furniture, appliances
- วัสดุสิ้นเปลือง: Consumables, packaging, cleaning supplies

Return ONLY JSON.
`;

    try {
      const response = await this.generateContent(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const categorized = JSON.parse(jsonMatch[0]);

        // Apply categories to items
        const categorizedItems = [...items];

        for (const [category, indices] of Object.entries(categorized.categorized)) {
          indices.forEach(index => {
            if (categorizedItems[index]) {
              categorizedItems[index].category = category;
              categorizedItems[index].aiCategorized = true;
            }
          });
        }

        return categorizedItems;
      } else {
        throw new Error('No JSON found in categorization response');
      }
    } catch (error) {
      console.error('Failed to categorize items with Gemini:', error);
      return items; // Return original items if categorization fails
    }
  }

  /**
   * Generate intelligent insights about expenses
   * @param {Object} expenseData - Processed expense data
   * @returns {Object} Insights and recommendations
   */
  async generateInsights(expenseData) {
    const summary = {
      totalItems: expenseData.totalItems,
      totalAmount: expenseData.totalAmount,
      categories: expenseData.categories
    };

    const prompt = `
Analyze this restaurant expense data and provide insights:

${JSON.stringify(summary, null, 2)}

Provide insights in Thai covering:
1. สรุปการใช้จ่ายโดยรวม (Overall expense summary)
2. ประเภทที่ใช้จ่ายสูงสุด (Highest expense category)
3. ข้อเสนอแนะในการลดต้นทุน (Cost reduction recommendations)
4. จุดที่น่าสังเกต (Notable observations)

Format as JSON:
{
  "summary": "Brief overall summary",
  "topCategory": "Category with highest expense",
  "recommendations": ["recommendation1", "recommendation2"],
  "observations": ["observation1", "observation2"]
}
`;

    try {
      const response = await this.generateContent(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        return {
          summary: "ไม่สามารถวิเคราะห์ข้อมูลได้",
          topCategory: "ไม่ทราบ",
          recommendations: [],
          observations: []
        };
      }
    } catch (error) {
      console.error('Failed to generate insights with Gemini:', error);
      return {
        summary: "เกิดข้อผิดพลาดในการวิเคราะห์",
        topCategory: "ไม่ทราบ",
        recommendations: [],
        observations: []
      };
    }
  }

  /**
   * Validate and correct parsed data
   * @param {Array} items - Parsed items
   * @returns {Array} Validated and corrected items
   */
  async validateAndCorrect(items) {
    const itemsText = items.map((item, index) =>
      `${index + 1}. Date: ${item.date}, Description: "${item.description}", Quantity: ${item.quantity}, Unit: ${item.unit}, Price: ${item.totalPrice}`
    ).join('\n');

    const prompt = `
Validate and correct this parsed expense data. Identify and fix:

${itemsText}

Common issues to check:
- Invalid dates (should be YYYY-MM-DD)
- Negative or zero prices
- Unrealistic quantities
- Missing units
- Calculation errors

Return corrected JSON:
{
  "items": [
    {
      "index": number,
      "original": {...},
      "corrected": {...},
      "issues": ["issue1", "issue2"],
      "confidence": 0.95
    }
  ]
}

If no corrections needed, return original data.
`;

    try {
      const response = await this.generateContent(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const validation = JSON.parse(jsonMatch[0]);

        // Apply corrections
        const correctedItems = [...items];
        validation.items.forEach(correction => {
          if (correction.corrected) {
            correctedItems[correction.index] = { ...correctedItems[correction.index], ...correction.corrected };
            correctedItems[correction.index].validationIssues = correction.issues;
          }
        });

        return correctedItems;
      } else {
        return items;
      }
    } catch (error) {
      console.error('Failed to validate with Gemini:', error);
      return items;
    }
  }

  /**
   * Generate natural language summary
   * @param {Object} data - Processed expense data
   * @returns {string} Natural language summary in Thai
   */
  async generateSummary(data) {
    const prompt = `
สรุงข้อมูลค่าใช้จ่ายร้านอาหารนี้เป็นภาษาไทยธรรมชาติ:

${JSON.stringify(data, null, 2)}

ให้สรุป:
1. จำนวนรายการและมูลค่ารวม
2. การแบ่งตามประเภท
3. ไฮไลท์ของค่าใช้จ่าย
4. ข้อสังเกตที่น่าสนใจ

ใช้โทนเป็นกันเอง เหมือนผู้ช่วยร้านอาหาร
`;

    try {
      return await this.generateContent(prompt);
    } catch (error) {
      console.error('Failed to generate summary with Gemini:', error);
      return "ไม่สามารถสรุปข้อมูลได้ในขณะนี้";
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      timeout: this.cacheTimeout,
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key: key.substring(0, 50) + '...',
        age: Date.now() - value.timestamp,
        expired: Date.now() - value.timestamp > this.cacheTimeout
      }))
    };
  }

  /**
   * Test API connection
   * @returns {boolean} Connection status
   */
  async testConnection() {
    try {
      const response = await this.generateContent("ทดสอบการเชื่อมต่อ", "ตอบว่า 'เชื่อมต่อสำเร็จ' ถ้าอ่านข้อความนี้ได้");
      return response.includes('เชื่อมต่อสำเร็จ') || response.includes('สำเร็จ');
    } catch (error) {
      return false;
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIAgentGemini;
} else if (typeof window !== 'undefined') {
  window.AIAgentGemini = AIAgentGemini;
}
