/**
 * Intelligent Database-Aware AI Assistant
 * Uses Google Gemini/Hugging Face to understand database queries and answer questions
 */

// Complete database schema for AI context
const DATABASE_SCHEMA = {
  tables: {
    users: {
      description: "User accounts and authentication",
      columns: ["id", "email", "display_name", "role", "created_at"],
      relationships: []
    },
    platforms: {
      description: "Delivery platforms (ร้าน, Grab, FoodPanda, Line Man) with commission rates",
      columns: ["id", "name", "commission_rate", "is_active"],
      relationships: []
    },
    categories: {
      description: "Categories for ingredients and menus",
      columns: ["id", "name", "type"],
      relationships: []
    },
    ingredients: {
      description: "Ingredient inventory with stock levels, suppliers, and costs",
      columns: ["id", "name", "unit", "current_stock", "min_stock", "cost_per_unit", "supplier"],
      relationships: ["category_id -> categories"]
    },
    menus: {
      description: "Menu items with pricing, availability, and preparation time",
      columns: ["id", "menu_id", "name", "price", "is_active", "is_available", "preparation_time_minutes"],
      relationships: ["category_id -> categories"]
    },
    menu_recipes: {
      description: "Junction table linking menus to ingredients with quantities",
      columns: ["id", "menu_id", "ingredient_id", "quantity_per_serve", "unit"],
      relationships: ["menu_id -> menus", "ingredient_id -> ingredients"]
    },
    sales: {
      description: "Sales transactions with order details and payment info",
      columns: ["id", "menu_id", "platform_id", "quantity", "unit_price", "total_amount", "order_date", "order_time", "payment_method"],
      relationships: ["menu_id -> menus", "platform_id -> platforms", "user_id -> users"]
    },
    purchases: {
      description: "Ingredient purchases with vendor info and receipts",
      columns: ["id", "ingredient_id", "quantity", "unit", "unit_price", "total_amount", "vendor", "purchase_date", "purchase_time"],
      relationships: ["ingredient_id -> ingredients", "user_id -> users"]
    },
    expenses: {
      description: "Business expenses tracking with categories and receipts",
      columns: ["id", "description", "amount", "expense_date", "category", "payment_method", "vendor", "status"],
      relationships: ["user_id -> users"]
    },
    stock_transactions: {
      description: "Audit trail for all stock movements",
      columns: ["id", "ingredient_id", "transaction_type", "quantity_change", "created_at"],
      relationships: ["ingredient_id -> ingredients"]
    },
    labor_logs: {
      description: "Employee time tracking with shifts and pay",
      columns: ["id", "employee_name", "date", "hours_worked", "rate_per_hour", "total_amount"],
      relationships: ["user_id -> users"]
    },
    waste: {
      description: "Waste tracking for ingredients and menus",
      columns: ["id", "ingredient_id", "quantity", "reason", "date"],
      relationships: ["ingredient_id -> ingredients"]
    }
  },
  views: {
    low_stock_view: "Items needing reorder (current_stock < min_stock)",
    recent_transactions_view: "Recent sales and purchases",
    daily_sales_summary: "Daily revenue by platform"
  },
  commonQueries: {
    recentPurchases: "Get recent purchases from purchases table ordered by purchase_date DESC",
    bestSellers: "Get best selling menus from sales table grouped by menu_id, sum quantities",
    expensiveIngredients: "Get most expensive ingredients from ingredients table ordered by cost_per_unit DESC",
    menuCost: "Calculate menu cost from menu_recipes joining ingredients to sum (quantity_per_serve * cost_per_unit)",
    recentExpenses: "Get recent expenses from expenses table ordered by expense_date DESC",
    lowStock: "Get low stock items from ingredients where current_stock < min_stock"
  }
};

/**
 * Get database context for AI
 */
async function getDatabaseContext() {
  const context = {
    schema: DATABASE_SCHEMA,
    stats: {}
  };

  try {
    // Get basic statistics
    if (window.supabase) {
      // Count records in key tables
      const [menus, ingredients, sales, purchases, expenses] = await Promise.all([
        window.supabase.from("menus").select("id", { count: "exact", head: true }),
        window.supabase.from("ingredients").select("id", { count: "exact", head: true }),
        window.supabase.from("sales").select("id", { count: "exact", head: true }),
        window.supabase.from("purchases").select("id", { count: "exact", head: true }),
        window.supabase.from("expenses").select("id", { count: "exact", head: true })
      ]);

      context.stats = {
        menus: menus.count || 0,
        ingredients: ingredients.count || 0,
        sales: sales.count || 0,
        purchases: purchases.count || 0,
        expenses: expenses.count || 0
      };
    }
  } catch (error) {
    console.warn("Error getting database context:", error);
  }

  return context;
}

/**
 * Execute database query based on AI's understanding
 */
async function executeDatabaseQuery(queryPlan) {
  try {
    if (!window.supabase) {
      throw new Error("Database not available");
    }

    const { table, filters, orderBy, limit, joins, calculation } = queryPlan;

    // Handle special calculations (like menu cost)
    if (calculation === "menu_cost" && table === "menu_recipes") {
      return await calculateMenuCost(queryPlan);
    }

    // Build select with joins
    let selectQuery = "*";
    if (joins) {
      // Parse joins like "ingredients:ingredient_id(name,cost_per_unit)"
      const joinParts = joins.split(",").map(j => j.trim());
      const selectParts = [];
      
      joinParts.forEach(join => {
        if (join.includes(":")) {
          const [joinTable, joinSpec] = join.split(":");
          const match = joinSpec.match(/(\w+)\(([^)]+)\)/);
          if (match) {
            const foreignKey = match[1];
            const fields = match[2];
            selectParts.push(`${joinTable}(${fields})`);
          } else {
            selectParts.push(`${joinTable}(*)`);
          }
        } else {
          selectParts.push(join);
        }
      });
      
      selectQuery = selectParts.join(",");
    }

    let query = window.supabase.from(table).select(selectQuery);

    // Apply filters
    if (filters) {
      for (const filter of filters) {
        const { column, operator, value } = filter;
        if (operator === "eq") query = query.eq(column, value);
        else if (operator === "gte") query = query.gte(column, value);
        else if (operator === "lte") query = query.lte(column, value);
        else if (operator === "like") query = query.ilike(column, `%${value}%`);
        else if (operator === "gt") query = query.gt(column, value);
        else if (operator === "lt") query = query.lt(column, value);
      }
    }

    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending !== false });
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    } else if (!calculation) {
      query = query.limit(50); // Default limit for safety
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

/**
 * Calculate menu cost from recipes
 */
async function calculateMenuCost(queryPlan) {
  try {
    const { filters } = queryPlan;
    const menuIdFilter = filters?.find(f => f.column === "menu_id");
    
    if (!menuIdFilter) {
      throw new Error("Menu ID required for cost calculation");
    }

    const menuId = menuIdFilter.value;
    
    // First, find the menu by menu_id or name
    let menu = null;
    if (menuId.match(/^[A-Z]\d+$/)) {
      // It's a menu_id like "A1"
      const { data: menus } = await window.supabase
        .from("menus")
        .select("id, menu_id, name")
        .eq("menu_id", menuId)
        .limit(1);
      
      if (menus && menus.length > 0) {
        menu = menus[0];
      }
    } else {
      // It's a name, search for it
      const { data: menus } = await window.supabase
        .from("menus")
        .select("id, menu_id, name")
        .ilike("name", `%${menuId}%`)
        .limit(1);
      
      if (menus && menus.length > 0) {
        menu = menus[0];
      }
    }

    if (!menu) {
      throw new Error(`ไม่พบเมนู "${menuId}"`);
    }

    // Get recipes with ingredient costs
    const { data: recipes, error } = await window.supabase
      .from("menu_recipes")
      .select(`
        quantity_per_serve,
        unit,
        ingredients (
          name,
          cost_per_unit,
          unit
        )
      `)
      .eq("menu_id", menu.id);

    if (error) {
      throw error;
    }

    if (!recipes || recipes.length === 0) {
      return {
        menu: menu,
        totalCost: 0,
        ingredients: [],
        message: `เมนู "${menu.name}" ยังไม่มีสูตร`
      };
    }

    // Calculate total cost
    let totalCost = 0;
    const ingredients = recipes.map(recipe => {
      const ingredient = recipe.ingredients;
      const cost = (parseFloat(recipe.quantity_per_serve) || 0) * (parseFloat(ingredient?.cost_per_unit) || 0);
      totalCost += cost;
      
      return {
        name: ingredient?.name || "ไม่ระบุ",
        quantity: recipe.quantity_per_serve,
        unit: recipe.unit,
        costPerUnit: ingredient?.cost_per_unit || 0,
        totalCost: cost
      };
    });

    return {
      menu: menu,
      totalCost: totalCost,
      ingredients: ingredients,
      price: menu.price || 0,
      profit: (menu.price || 0) - totalCost,
      profitMargin: menu.price ? ((menu.price - totalCost) / menu.price * 100) : 0
    };
  } catch (error) {
    console.error("Menu cost calculation error:", error);
    throw error;
  }
}

/**
 * Intelligent AI Assistant with Database Knowledge
 */
async function intelligentAIAssistant(userMessage) {
  // Get API keys from window (injected by /api-keys Cloudflare Function)
  // The keys are loaded by index.html via fetch('/api-keys') and eval()
  // Wait a bit for the keys to be loaded if they haven't been loaded yet
  if (!window.GOOGLE_GEMINI_API_KEY && !window.GOOGLE_CLOUD_API_KEY && !window.HUGGING_FACE_API_KEY) {
    // Wait up to 2 seconds for API keys to be loaded by index.html
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (window.GOOGLE_GEMINI_API_KEY || window.GOOGLE_CLOUD_API_KEY || window.HUGGING_FACE_API_KEY) {
        break;
      }
    }
  }
  
  // Get API keys - support both new (GOOGLE_GEMINI_API_KEY) and old (GOOGLE_CLOUD_API_KEY) names
  const googleApiKey = (window.GOOGLE_GEMINI_API_KEY && 
                       window.GOOGLE_GEMINI_API_KEY !== 'null' && 
                       window.GOOGLE_GEMINI_API_KEY !== '' &&
                       window.GOOGLE_GEMINI_API_KEY !== 'YOUR_API_KEY_HERE') 
                       ? window.GOOGLE_GEMINI_API_KEY 
                       : (window.GOOGLE_CLOUD_API_KEY && 
                          window.GOOGLE_CLOUD_API_KEY !== 'null' && 
                          window.GOOGLE_CLOUD_API_KEY !== '' &&
                          window.GOOGLE_CLOUD_API_KEY !== 'YOUR_API_KEY_HERE') 
                          ? window.GOOGLE_CLOUD_API_KEY 
                          : null;
  
  const huggingFaceKey = (window.HUGGING_FACE_API_KEY && 
                          window.HUGGING_FACE_API_KEY !== 'null' && 
                          window.HUGGING_FACE_API_KEY !== '' &&
                          window.HUGGING_FACE_API_KEY !== 'hf_YOUR_HUGGING_FACE_API_KEY_HERE') 
                          ? window.HUGGING_FACE_API_KEY 
                          : null;

  // Get database context
  const dbContext = await getDatabaseContext();

  // Build comprehensive system prompt with database schema
  const systemPrompt = `You are an intelligent POS (Point of Sale) system assistant with full access to the database.

DATABASE SCHEMA:
${JSON.stringify(dbContext.schema, null, 2)}

DATABASE STATISTICS:
${JSON.stringify(dbContext.stats, null, 2)}

YOUR CAPABILITIES:
1. Answer questions about the database (purchases, sales, expenses, menus, ingredients)
2. Query data intelligently based on user questions
3. Calculate costs, profits, and business metrics
4. Provide insights and recommendations

RESPONSE FORMAT:
When the user asks a question, you should:
1. Understand what data they need
2. Determine which tables/columns to query
3. Return a JSON object with a "queryPlan" field that describes how to fetch the data
4. Also provide a natural language explanation

QUERY PLAN FORMAT:
{
  "queryPlan": {
    "table": "table_name",
    "filters": [{"column": "col_name", "operator": "eq|gte|lte|like", "value": "value"}],
    "orderBy": {"column": "col_name", "ascending": true/false},
    "limit": 10,
    "joins": "table1:col1,table2:col2" (optional, for foreign key relationships)
  },
  "explanation": "Natural language explanation of what you're doing"
}

EXAMPLES:

User: "What are the recent purchases?"
Response: {
  "queryPlan": {
    "table": "purchases",
    "orderBy": {"column": "purchase_date", "ascending": false},
    "limit": 10,
    "joins": "ingredients:ingredient_id(name)"
  },
  "explanation": "I'll get the 10 most recent purchases with ingredient names."
}

User: "What are the best seller menus?"
Response: {
  "queryPlan": {
    "table": "sales",
    "orderBy": {"column": "quantity", "ascending": false},
    "joins": "menus:menu_id(menu_id,name,price)"
  },
  "explanation": "I'll analyze sales data to find the best selling menus."
}

User: "What are the most expensive ingredients?"
Response: {
  "queryPlan": {
    "table": "ingredients",
    "orderBy": {"column": "cost_per_unit", "ascending": false},
    "limit": 10
  },
  "explanation": "I'll get the top 10 most expensive ingredients by cost per unit."
}

User: "What is the cost of menu A1?"
Response: {
  "queryPlan": {
    "table": "menu_recipes",
    "filters": [{"column": "menu_id", "operator": "eq", "value": "A1"}],
    "joins": "ingredients:ingredient_id(cost_per_unit)"
  },
  "explanation": "I'll calculate the cost of menu A1 by summing ingredient costs from recipes."
}

IMPORTANT:
- Always respond in Thai language
- Be concise and helpful
- If you can't determine a query plan, provide helpful guidance
- For calculations, explain the formula you would use`;

  // Try Google Gemini API
  if (googleApiKey) {
    try {
      // Try gemini-2.5-flash first (fastest, free tier friendly)
      // For free tier, try v1 endpoint first, then v1beta
      let response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${googleApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nUser Question: ${userMessage}\n\nAssistant Response (JSON format):`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      // If v1 fails with 404, try v1beta with gemini-2.5-flash
      if (!response.ok && response.status === 404) {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${googleApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${systemPrompt}\n\nUser Question: ${userMessage}\n\nAssistant Response (JSON format):`
              }]
            }],
            generationConfig: {
              temperature: 0.3,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            }
          })
        });
      }

      // If still fails, try gemini-2.0-flash
      if (!response.ok && (response.status === 404 || response.status === 403)) {
        console.warn('Gemini 2.5 Flash failed, trying gemini-2.0-flash...');
        response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${googleApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${systemPrompt}\n\nUser Question: ${userMessage}\n\nAssistant Response (JSON format):`
              }]
            }],
            generationConfig: {
              temperature: 0.3,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            }
          })
        });
      }

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          const aiResponse = data.candidates[0].content.parts[0].text;
          
          // Try to parse JSON from response
          try {
            // Extract JSON from response (might be wrapped in markdown code blocks)
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              return parsed;
            }
          } catch (e) {
            // If JSON parsing fails, return the text response
            return { explanation: aiResponse, queryPlan: null };
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Google Gemini API error:', response.status, errorData);
        if (response.status === 403 || response.status === 401) {
          console.warn('This usually means the API key is invalid, expired, or lacks permissions. Please check your Google AI Studio.');
        }
      }
    } catch (error) {
      console.warn('Google Gemini API error:', error);
    }
  }

  // Fallback to Hugging Face (via Cloudflare Function proxy to avoid CORS)
  if (huggingFaceKey) {
    try {
      // Use Cloudflare Function proxy to avoid CORS issues
      const response = await fetch('/api/huggingface', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'microsoft/DialoGPT-large',
          inputs: `${systemPrompt}\n\nUser: ${userMessage}\n\nAssistant:`,
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.generated_text) {
          return { explanation: data.generated_text, queryPlan: null };
        } else if (data.error) {
          console.warn('Hugging Face API error:', data.error);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Hugging Face proxy error:', errorData);
      }
    } catch (error) {
      console.warn('Hugging Face API error:', error);
    }
  }

  return null;
}

/**
 * Process AI message with database intelligence
 */
async function processAIMessageWithDatabase(userMessage) {
  // Always try AI first for database questions
  // The AI understands the database schema and can answer any question
  const message = userMessage.toLowerCase().trim();
  
  // Check if it's a database-related question
  const isDatabaseQuery = /รายการ|เมนู|วัตถุดิบ|ต้นทุน|ซื้อ|ขาย|ค่าใช้จ่าย|purchase|menu|ingredient|cost|expense|sales|recent|best|expensive|seller/i.test(message);
  
  if (!isDatabaseQuery) {
    // Not a database question, let pattern matching handle it
    return null;
  }

  // Use AI to understand and answer the question
  addChatMessage("กำลังวิเคราะห์คำถามและค้นหาข้อมูลจากฐานข้อมูล...");
  
  try {
    const aiResponse = await intelligentAIAssistant(userMessage);
    
    if (!aiResponse) {
      return null; // Fall back to pattern matching
    }

    // If AI provided a query plan, execute it
    if (aiResponse.queryPlan) {
      addChatMessage(aiResponse.explanation || "กำลังดึงข้อมูล...");
      
      try {
        const data = await executeDatabaseQuery(aiResponse.queryPlan);
        
        // Handle both array and object results
        if (data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)) {
          // Format the results intelligently
          const formattedResponse = formatQueryResults(aiResponse.queryPlan.table, data, userMessage);
          addChatMessage(formattedResponse);
          return true;
        } else {
          addChatMessage("ไม่พบข้อมูลที่ต้องการค่ะ");
          return true;
        }
      } catch (error) {
        console.error("Query execution error:", error);
        addChatMessage(`เกิดข้อผิดพลาด: ${error.message}`);
        return true;
      }
    } else if (aiResponse.explanation) {
      // AI provided explanation but no query plan
      addChatMessage(aiResponse.explanation);
      return true;
    }
  } catch (error) {
    console.error("AI processing error:", error);
    addChatMessage(`เกิดข้อผิดพลาด: ${error.message}`);
    return false;
  }

  return null;
}

/**
 * Format query results in a user-friendly way
 */
function formatQueryResults(table, data, originalQuestion) {
  // Handle special case: menu cost calculation returns an object, not array
  if (table === "menu_recipes" && data && !Array.isArray(data) && data.menu) {
    return formatMenuCostResult(data);
  }

  if (!data || data.length === 0) {
    return "ไม่พบข้อมูลที่ต้องการค่ะ";
  }

  let response = "";

  switch (table) {
    case "purchases":
      response = `📦 รายการซื้อล่าสุด (${data.length} รายการ):\n\n`;
      data.forEach((purchase, i) => {
        const ingredientName = purchase.ingredients?.name || "ไม่ระบุ";
        response += `${i + 1}. ${ingredientName}\n`;
        response += `   จำนวน: ${purchase.quantity} ${purchase.unit}\n`;
        response += `   ราคา: ฿${parseFloat(purchase.total_amount || 0).toFixed(2)}\n`;
        response += `   ผู้ขาย: ${purchase.vendor || "ไม่ระบุ"}\n`;
        response += `   วันที่: ${purchase.purchase_date || ""}\n\n`;
      });
      break;

    case "sales":
      // Group by menu for best sellers
      const menuStats = {};
      data.forEach(sale => {
        const menuId = sale.menu_id;
        if (!menuStats[menuId]) {
          menuStats[menuId] = {
            menu_id: sale.menus?.menu_id || menuId,
            name: sale.menus?.name || "Unknown",
            totalQuantity: 0,
            totalRevenue: 0,
            saleCount: 0
          };
        }
        menuStats[menuId].totalQuantity += sale.quantity || 0;
        menuStats[menuId].totalRevenue += (sale.quantity || 0) * (sale.unit_price || 0);
        menuStats[menuId].saleCount += 1;
      });

      const sortedMenus = Object.values(menuStats)
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 10);

      response = `🏆 เมนูขายดี (Top ${sortedMenus.length}):\n\n`;
      sortedMenus.forEach((menu, i) => {
        const rankIcon = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
        response += `${rankIcon} ${menu.name} (${menu.menu_id})\n`;
        response += `   ขายทั้งหมด: ${menu.totalQuantity} จาน\n`;
        response += `   รายได้รวม: ฿${menu.totalRevenue.toFixed(2)}\n`;
        response += `   จำนวนครั้ง: ${menu.saleCount} ครั้ง\n\n`;
      });
      break;

    case "ingredients":
      response = `💎 วัตถุดิบที่แพงที่สุด (Top ${data.length}):\n\n`;
      data.forEach((ingredient, i) => {
        response += `${i + 1}. ${ingredient.name}\n`;
        response += `   ราคาต่อหน่วย: ฿${parseFloat(ingredient.cost_per_unit || 0).toFixed(2)}/${ingredient.unit || ""}\n`;
        response += `   สต๊อกปัจจุบัน: ${ingredient.current_stock || 0} ${ingredient.unit || ""}\n\n`;
      });
      break;

    case "menu_recipes":
      // This is a menu cost calculation result
      if (data.menu) {
        response = `💰 ต้นทุนเมนู: ${data.menu.name} (${data.menu.menu_id})\n\n`;
        response += `📋 ส่วนประกอบ:\n`;
        data.ingredients.forEach((ing, i) => {
          response += `${i + 1}. ${ing.name}: ${ing.quantity} ${ing.unit}\n`;
          response += `   ราคา: ฿${parseFloat(ing.costPerUnit || 0).toFixed(2)}/${ing.unit}\n`;
          response += `   รวม: ฿${parseFloat(ing.totalCost || 0).toFixed(2)}\n\n`;
        });
        response += `💵 ต้นทุนรวม: ฿${parseFloat(data.totalCost || 0).toFixed(2)}\n`;
        if (data.price) {
          response += `💰 ราคาขาย: ฿${parseFloat(data.price).toFixed(2)}\n`;
          response += `📊 กำไร: ฿${parseFloat(data.profit || 0).toFixed(2)}\n`;
          response += `📈 กำไร (%): ${parseFloat(data.profitMargin || 0).toFixed(1)}%\n`;
        }
      } else {
        response = data.message || "ไม่สามารถคำนวณต้นทุนได้";
      }
      break;

    case "expenses":
      response = `💰 รายการค่าใช้จ่ายล่าสุด (${data.length} รายการ):\n\n`;
      data.forEach((expense, i) => {
        response += `${i + 1}. ${expense.description || "ไม่ระบุ"}\n`;
        response += `   จำนวนเงิน: ฿${parseFloat(expense.amount || 0).toFixed(2)}\n`;
        response += `   ประเภท: ${expense.category || "ไม่ระบุ"}\n`;
        response += `   วันที่: ${expense.expense_date || ""}\n\n`;
      });
      break;

    case "menus":
      response = `🍽️ รายการเมนูทั้งหมด (${data.length} รายการ):\n\n`;
      
      // Simple list format - show menu ID, name, and price clearly
      data.forEach((menu, i) => {
        const status = menu.is_active && menu.is_available ? "✅" : "❌";
        const menuId = menu.menu_id ? `[${menu.menu_id}]` : "";
        response += `${i + 1}. ${status} ${menuId} ${menu.name || "ไม่ระบุชื่อ"}\n`;
        response += `   💰 ราคา: ฿${parseFloat(menu.price || 0).toFixed(2)}\n`;
        if (menu.cost_price && menu.cost_price > 0) {
          const profit = (menu.price || 0) - menu.cost_price;
          const profitMargin = menu.price ? ((profit / menu.price) * 100).toFixed(1) : 0;
          response += `   💵 ต้นทุน: ฿${parseFloat(menu.cost_price).toFixed(2)}\n`;
          response += `   📊 กำไร: ฿${profit.toFixed(2)} (${profitMargin}%)\n`;
        }
        if (menu.preparation_time_minutes) {
          response += `   ⏱️ เวลาทำ: ${menu.preparation_time_minutes} นาที\n`;
        }
        response += `\n`;
      });
      
      // Add summary if there are many menus
      if (data.length > 20) {
        const activeCount = data.filter(m => m.is_active && m.is_available).length;
        const totalPrice = data.reduce((sum, m) => sum + (parseFloat(m.price || 0)), 0);
        response += `\n📊 สรุป:\n`;
        response += `   • เมนูที่เปิดขาย: ${activeCount}/${data.length}\n`;
        response += `   • ราคาเฉลี่ย: ฿${(totalPrice / data.length).toFixed(2)}\n`;
      }
      break;

    default:
      // Generic formatting
      response = `📊 ผลลัพธ์ (${data.length} รายการ):\n\n`;
      data.slice(0, 10).forEach((item, i) => {
        response += `${i + 1}. ${JSON.stringify(item, null, 2)}\n\n`;
      });
      if (data.length > 10) {
        response += `... และอีก ${data.length - 10} รายการ`;
      }
  }

  return response;
}

/**
 * Format menu cost calculation result
 */
function formatMenuCostResult(data) {
  let response = `💰 ต้นทุนเมนู: ${data.menu.name} (${data.menu.menu_id})\n\n`;
  response += `📋 ส่วนประกอบ:\n`;
  data.ingredients.forEach((ing, i) => {
    response += `${i + 1}. ${ing.name}: ${ing.quantity} ${ing.unit}\n`;
    response += `   ราคา: ฿${parseFloat(ing.costPerUnit || 0).toFixed(2)}/${ing.unit}\n`;
    response += `   รวม: ฿${parseFloat(ing.totalCost || 0).toFixed(2)}\n\n`;
  });
  response += `💵 ต้นทุนรวม: ฿${parseFloat(data.totalCost || 0).toFixed(2)}\n`;
  if (data.price) {
    response += `💰 ราคาขาย: ฿${parseFloat(data.price).toFixed(2)}\n`;
    response += `📊 กำไร: ฿${parseFloat(data.profit || 0).toFixed(2)}\n`;
    response += `📈 กำไร (%): ${parseFloat(data.profitMargin || 0).toFixed(1)}%\n`;
  }
  return response;
}

// Export for use
if (typeof window !== 'undefined') {
  window.intelligentAIAssistant = intelligentAIAssistant;
  window.processAIMessageWithDatabase = processAIMessageWithDatabase;
  window.executeDatabaseQuery = executeDatabaseQuery;
  window.getDatabaseContext = getDatabaseContext;
  window.calculateMenuCost = calculateMenuCost;
}

