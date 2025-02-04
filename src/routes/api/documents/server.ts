// File: src/routes/api/documents/server.ts
export async function POST({ request }: { request: Request }) {
    const data = await request.json();
    
    // Process the received data
    const response = {
      received: data,
      message: "Message received successfully!",
      timestamp: new Date().toISOString()
    };
  
    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }