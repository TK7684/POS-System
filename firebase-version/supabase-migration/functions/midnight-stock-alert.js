// Cloudflare Worker for Midnight Stock Alert
// Runs daily at midnight to check low stock

export default {
  async scheduled(event, env, ctx) {
    // This runs on a schedule
    ctx.waitUntil(processStockAlert(env));
  },
  
  async fetch(request, env) {
    // Also allow manual trigger via HTTP request
    if (request.method === 'POST' || request.method === 'GET') {
      const result = await processStockAlert(env);
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('Method not allowed', { status: 405 });
  },
};

async function processStockAlert(env) {
  try {
    console.log('Running midnight stock check...');
    
    const supabaseUrl = env?.SUPABASE_URL || 'https://rtfreafhlelpxqwohspq.supabase.co';
    const supabaseKey = env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_ANON_KEY;
    const lineChannelAccessToken = env?.LINE_CHANNEL_ACCESS_TOKEN;
    const lineGroupId = env?.LINE_GROUP_ID;
    
    if (!supabaseKey || !supabaseUrl) {
      console.error('Supabase not configured');
      return { success: false, error: 'Supabase not configured' };
    }

    if (!lineChannelAccessToken || !lineGroupId) {
      console.error('LINE Bot not configured for stock alerts');
      return { success: false, error: 'LINE Bot not configured' };
    }

    // Get all ingredients with low stock
    const ingredientsResponse = await fetch(
      `${supabaseUrl}/rest/v1/ingredients?select=id,name,current_stock,min_stock,unit&current_stock=not.is.null&min_stock=not.is.null&is_active=eq.true`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!ingredientsResponse.ok) {
      throw new Error(`Failed to fetch ingredients: ${ingredientsResponse.status}`);
    }

    const ingredients = await ingredientsResponse.json();
    
    // Filter low stock items
    const lowStockItems = ingredients.filter(ing => {
      const currentStock = parseFloat(ing.current_stock) || 0;
      const minStock = parseFloat(ing.min_stock) || 0;
      return currentStock <= minStock && minStock > 0;
    });

    if (lowStockItems.length === 0) {
      console.log('No low stock items found');
      return { success: true, message: 'No low stock items', count: 0 };
    }

    // Format message
    let message = `📦 สต็อกใกล้หมด (${lowStockItems.length} รายการ)\n\n`;
    
    lowStockItems.slice(0, 10).forEach((item, index) => {
      const stock = parseFloat(item.current_stock) || 0;
      const min = parseFloat(item.min_stock) || 0;
      const unit = item.unit || '';
      message += `${index + 1}. ${item.name}\n`;
      message += `   สต็อก: ${stock} ${unit} (ขั้นต่ำ: ${min} ${unit})\n\n`;
    });

    if (lowStockItems.length > 10) {
      message += `... และอีก ${lowStockItems.length - 10} รายการ`;
    }

    // Send to LINE group
    const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineChannelAccessToken}`,
      },
      body: JSON.stringify({
        to: lineGroupId,
        messages: [{
          type: 'text',
          text: message,
        }],
      }),
    });

    if (!lineResponse.ok) {
      const errorText = await lineResponse.text();
      console.error('Error sending LINE message:', lineResponse.status, errorText);
      throw new Error(`LINE API error: ${lineResponse.status}`);
    }

    console.log(`Stock alert sent: ${lowStockItems.length} items`);
    
    return {
      success: true,
      lowStockCount: lowStockItems.length,
      message: 'Stock alert sent successfully'
    };
  } catch (error) {
    console.error('Error in midnight stock check:', error);
    return { success: false, error: error.message };
  }
}

