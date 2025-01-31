// file: src/routes/api/essay/+server.ts

import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent) {
  const data = await request.json();
  
  console.log(data)
  // Process the data as needed
  
  return new Response(JSON.stringify({ success: true }), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}