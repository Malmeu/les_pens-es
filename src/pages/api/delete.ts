import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { slug } = data;
    
    if (!slug) {
      return new Response(JSON.stringify({ error: 'ID de la pensée requis' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const fileName = `${slug}.md`;
    const filePath = path.join(process.cwd(), 'src/content/thoughts', fileName);
    
    try {
      await fs.unlink(filePath);
    } catch (e: any) {
      return new Response(JSON.stringify({ 
        error: "Impossible de supprimer le fichier. Il se peut qu'il n'existe pas ou que le système soit en lecture seule.",
        details: e.message 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      message: 'Pensée supprimée avec succès !'
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
