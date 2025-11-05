# Midnight Stock Alert Setup

The LINE bot will automatically send low stock alerts every midnight to your LINE group.

## Setup Instructions

### Option 1: Using External Cron Service (Free)

1. **Go to cron-job.org** (or similar service)
   - Sign up at: https://cron-job.org/

2. **Create a new cron job**
   - URL: `https://jade-cannoli-b0d851.netlify.app/.netlify/functions/midnight-stock-alert`
   - Schedule: Daily at 00:00 UTC (7:00 AM Thailand time)
   - Method: GET or POST

3. **Set environment variables in Netlify**
   ```bash
   netlify env:set LINE_GROUP_ID "your-line-group-id"
   ```

### Option 2: Netlify Scheduled Functions (Pro Plan)

If you have Netlify Pro, scheduled functions will work automatically.

## Environment Variables Required

- `LINE_GROUP_ID` - Your LINE group ID
- `LINE_CHANNEL_ACCESS_TOKEN` - Already set
- `SUPABASE_URL` - Already set
- `SUPABASE_SERVICE_ROLE_KEY` - Already set

## How It Works

1. Function runs at midnight (00:00 UTC = 7:00 AM Thailand)
2. Checks all ingredients for low stock (current_stock <= min_stock)
3. Sends message to LINE group with low stock items
4. Only sends if there are low stock items

## Example Alert Message

```
📦 สต็อกใกล้หมด (3 รายการ)

1. กุ้งสด
   สต็อก: 45 ตัว (ขั้นต่ำ: 50 ตัว)

2. แซลมอนสด
   สต็อก: 480 กรัม (ขั้นต่ำ: 500 กรัม)

3. พริกแดงจินดา
   สต็อก: 180 กรัม (ขั้นต่ำ: 200 กรัม)
```

