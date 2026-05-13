import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { title, content, type } = data;
    
    if (!title || !content) {
      return new Response(JSON.stringify({ error: 'Titre et contenu requis' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const date = new Date().toISOString().split('T')[0];
    const slug = title.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');
    
    const fileName = `${slug || 'pensee-' + Date.now()}.md`;
    const filePath = path.join(process.cwd(), 'src/content/thoughts', fileName);
    
    const fileContent = `---
title: "${title}"
date: "${date}"
type: "${type}"
description: "${title}"
---
${content}`;

    // Note: This only works in local development or environments with persistent storage.
    // On Vercel, this will not persist across deployments or restarts.
    try {
      await fs.writeFile(filePath, fileContent, 'utf-8');
    } catch (e: any) {
      return new Response(JSON.stringify({ 
        error: "Impossible d'écrire sur le disque. Si vous êtes sur Vercel, c'est normal car le système de fichiers est en lecture seule.",
        details: e.message 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      message: 'Pensée publiée avec succès !', 
      slug 
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
