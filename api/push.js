// Vercel Serverless Function - /api/push
// Ensure you have run: npm install web-push
const webpush = require('web-push');

// Set your VAPID keys in Vercel Environment Variables
const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

// You must set an email address with mailto:
webpush.setVapidDetails('mailto:hello@yourdomain.com', publicVapidKey, privateVapidKey);

// In a real database, you'd store the push subscription objects mapped to the username/userId
// For this example, we keep an in-memory array (which resets on cold starts),
// so you will want to integrate this with a DB (like Postgres, Redis, or Vercel KV).
let subscriptions = []; 

export default async function handler(req, res) {
  if (req.method === 'POST' && req.url === '/api/push/subscribe') {
    // 1. Client Subscribes
    const subscription = req.body;
    subscriptions.push(subscription);
    
    res.status(201).json({ success: true });
    
  } else if (req.method === 'POST' && req.url === '/api/push/notify') {
    // 2. Nightly Cron Job / Dispatcher (e.g. called via Vercel Cron or webhook)
    const { title, body } = req.body;
    const payload = JSON.stringify({ title, body });

    // Send push to all stored subscriptions
    const promises = subscriptions.map(sub => 
      webpush.sendNotification(sub, payload).catch(err => {
        console.error("Push failed:", err);
        // remove dead subscriptions here
      })
    );
    
    await Promise.all(promises);
    res.status(200).json({ success: true, sent: promises.length });
    
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
