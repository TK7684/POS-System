// Netlify Scheduled Function - Runs every midnight to check low stock
// Configure in netlify.toml as a scheduled function

const crypto = require('crypto');

exports.handler = async (event, context) => {
  try {
    console.log('Running midnight stock check...');
    
    const supabaseUrl = process.env.SUPABASE_URL || 'https://rtfreafhlelpxqwohspq.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    const lineChannelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const lineGroupId = process.env.LINE_GROUP_ID;
    
    if (!supabaseKey || !supabaseUrl) {
      console.error('Supabase not configured');
      return { statusCode: 500, body: JSON.stringify({ error: 'Supabase not configured' }) };
    }

    if (!lineChannelAccessToken || !lineGroupId) {
      console.error('LINE Bot not configured for stock alerts');
      return { statusCode: 500, body: JSON.stringify({ error: 'LINE Bot not configured' }) };
    }

    // Get all ingredients with low stock
    const ingredientsResponse = await fetch(
      `${supabaseUrl}/rest/v1/ingredients?select=id,name,current_stock,min_stock,unit&current_stock=not.is.null&min_stock=not.is.null`,
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
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No low stock items', count: 0 })
      };
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
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        lowStockCount: lowStockItems.length,
        message: 'Stock alert sent successfully'
      })
    };
  } catch (error) {
    console.error('Error in midnight stock check:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

