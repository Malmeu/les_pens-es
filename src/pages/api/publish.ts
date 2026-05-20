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
    const fileContent = `---
title: "${title}"
date: "${date}"
type: "${type}"
description: "${title}"
---
${content}`;

    const githubToken = process.env.GITHUB_TOKEN || process.env.MINA_GITHUB_TOKEN;

    if (githubToken) {
      // Version Production (Vercel) avec l'API GitHub
      const owner = 'Malmeu';
      const repo = 'les_pens-es';
      const fileGitPath = `src/content/thoughts/${fileName}`;
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${fileGitPath}`;
      
      const base64Content = Buffer.from(fileContent).toString('base64');
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
          'User-Agent': 'Les-Pensees-de-Mina-App'
        },
        body: JSON.stringify({
          message: `chore: ajouter la pensée "${title}"`,
          content: base64Content,
          branch: 'main'
        })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        return new Response(JSON.stringify({ 
          error: "Erreur lors de l'écriture sur GitHub.",
          details: errData.message || response.statusText
        }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else {
      // Version Locale (Développement)
      const filePath = path.join(process.cwd(), 'src/content/thoughts', fileName);
      try {
        await fs.writeFile(filePath, fileContent, 'utf-8');
      } catch (e: any) {
        return new Response(JSON.stringify({ 
          error: "Impossible d'écrire sur le disque local en mode développement.",
          details: e.message 
        }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ 
      message: githubToken 
        ? 'Pensée enregistrée avec succès sur GitHub ! Le site est en cours de reconstruction sur Vercel et sera à jour d\'ici 1 à 2 minutes.' 
        : 'Pensée publiée avec succès !', 
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
