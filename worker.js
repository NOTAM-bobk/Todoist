// Cloudflare Worker for Neo Tasks, Notes, and Reminders

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateToken(username) {
  return `${username}-${Date.now()}-${Math.random().toString(36).substr(2)}`;
}

export default {
  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // --- AUTHENTICATION ---
      if (path === '/api/auth/register' && request.method === 'POST') {
        const { username, password } = await request.json();
        if (!username || !password) return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: corsHeaders });

        const existingUser = await env.NEO_TASKS_KV.get(`user:${username}`);
        if (existingUser) return new Response(JSON.stringify({ error: "Username taken" }), { status: 409, headers: corsHeaders });

        const hashedPassword = await hashPassword(password);
        await env.NEO_TASKS_KV.put(`user:${username}`, JSON.stringify({ password: hashedPassword }));
        
        const token = generateToken(username);
        await env.NEO_TASKS_KV.put(`token:${token}`, username, { expirationTtl: 86400 }); // 24 hour token

        return new Response(JSON.stringify({ success: true, token }), { headers: corsHeaders });
      }

      if (path === '/api/auth/login' && request.method === 'POST') {
        const { username, password } = await request.json();
        const userDataString = await env.NEO_TASKS_KV.get(`user:${username}`);
        if (!userDataString) return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: corsHeaders });

        const userData = JSON.parse(userDataString);
        const hashedPassword = await hashPassword(password);

        if (userData.password !== hashedPassword) return new Response(JSON.stringify({ error: "Invalid password" }), { status: 401, headers: corsHeaders });

        const token = generateToken(username);
        await env.NEO_TASKS_KV.put(`token:${token}`, username, { expirationTtl: 86400 });

        return new Response(JSON.stringify({ success: true, token }), { headers: corsHeaders });
      }

      // --- TASKS SYNC ---
      if (path === '/api/sync' && request.method === 'GET') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
        
        const token = authHeader.split(' ')[1];
        const username = await env.NEO_TASKS_KV.get(`token:${token}`);
        if (!username) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });

        const dataStr = await env.NEO_TASKS_KV.get(`data:${username}`);
        const serverData = dataStr ? JSON.parse(dataStr) : null;

        return new Response(JSON.stringify({ success: true, serverData }), { headers: corsHeaders });
      }

      if (path === '/api/sync' && request.method === 'POST') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
        
        const token = authHeader.split(' ')[1];
        const username = await env.NEO_TASKS_KV.get(`token:${token}`);
        if (!username) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });

        const payload = await request.json();
        
        await env.NEO_TASKS_KV.put(`data:${username}`, JSON.stringify({
            lists: payload.lists,
            tasks: payload.tasks,
            settings: payload.settings,
            stats: payload.stats,
            lastSynced: Date.now()
        }));

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // --- NOTES SYNC ---
      if (path === '/api/notes-sync' && request.method === 'GET') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
        
        const token = authHeader.split(' ')[1];
        const username = await env.NEO_TASKS_KV.get(`token:${token}`);
        if (!username) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });

        const dataStr = await env.NEO_TASKS_KV.get(`notes:${username}`);
        const serverData = dataStr ? JSON.parse(dataStr) : { notes: [] };

        return new Response(JSON.stringify({ success: true, serverData }), { headers: corsHeaders });
      }

      if (path === '/api/notes-sync' && request.method === 'POST') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
        
        const token = authHeader.split(' ')[1];
        const username = await env.NEO_TASKS_KV.get(`token:${token}`);
        if (!username) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });

        const payload = await request.json();
        
        await env.NEO_TASKS_KV.put(`notes:${username}`, JSON.stringify({
            notes: payload.notes,
            lastSynced: Date.now()
        }));

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // --- REMINDERS SYNC ---
      if (path === '/api/reminders-sync' && request.method === 'GET') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
        
        const token = authHeader.split(' ')[1];
        const username = await env.NEO_TASKS_KV.get(`token:${token}`);
        if (!username) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });

        const dataStr = await env.NEO_TASKS_KV.get(`reminders:${username}`);
        const serverData = dataStr ? JSON.parse(dataStr) : { reminders: [] };

        return new Response(JSON.stringify({ success: true, serverData }), { headers: corsHeaders });
      }

      if (path === '/api/reminders-sync' && request.method === 'POST') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
        
        const token = authHeader.split(' ')[1];
        const username = await env.NEO_TASKS_KV.get(`token:${token}`);
        if (!username) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });

        const payload = await request.json();
        
        await env.NEO_TASKS_KV.put(`reminders:${username}`, JSON.stringify({
            reminders: payload.reminders,
            lastSynced: Date.now()
        }));

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // --- VOICE MEMOS SYNC ---
      if (path === '/api/voice-memos-sync' && request.method === 'GET') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
        
        const token = authHeader.split(' ')[1];
        const username = await env.NEO_TASKS_KV.get(`token:${token}`);
        if (!username) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });

        const dataStr = await env.NEO_TASKS_KV.get(`voice:${username}`);
        const serverData = dataStr ? JSON.parse(dataStr) : { memos: [] };

        return new Response(JSON.stringify({ success: true, serverData }), { headers: corsHeaders });
      }

      if (path === '/api/voice-memos-sync' && request.method === 'POST') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
        
        const token = authHeader.split(' ')[1];
        const username = await env.NEO_TASKS_KV.get(`token:${token}`);
        if (!username) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });

        const payload = await request.json();
        
        await env.NEO_TASKS_KV.put(`voice:${username}`, JSON.stringify({
            memos: payload.memos,
            lastSynced: Date.now()
        }));

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: corsHeaders });

    } catch (err) {
      return new Response(JSON.stringify({ error: "Server Error", details: err.message }), { status: 500, headers: corsHeaders });
    }
  }
};
