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
    const githubToken = process.env.GITHUB_TOKEN || process.env.MINA_GITHUB_TOKEN;

    if (githubToken) {
      // Version Production (Vercel) avec l'API GitHub
      const owner = 'Malmeu';
      const repo = 'les_pens-es';
      const fileGitPath = `src/content/thoughts/${fileName}`;
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${fileGitPath}`;
      
      // 1. Récupérer le SHA du fichier pour pouvoir le supprimer
      const getResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'Les-Pensees-de-Mina-App'
        }
      });

      if (!getResponse.ok) {
        const errData = await getResponse.json();
        return new Response(JSON.stringify({ 
          error: "Impossible de localiser la pensée sur GitHub pour la supprimer.",
          details: errData.message || getResponse.statusText
        }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const fileData = await getResponse.json();
      const sha = fileData.sha;

      // 2. Supprimer le fichier
      const deleteResponse = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
          'User-Agent': 'Les-Pensees-de-Mina-App'
        },
        body: JSON.stringify({
          message: `chore: supprimer la pensée "${slug}"`,
          sha,
          branch: 'main'
        })
      });

      if (!deleteResponse.ok) {
        const errData = await deleteResponse.json();
        return new Response(JSON.stringify({ 
          error: "Erreur lors de la suppression sur GitHub.",
          details: errData.message || deleteResponse.statusText
        }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else {
      // Version Locale (Développement)
      const filePath = path.join(process.cwd(), 'src/content/thoughts', fileName);
      try {
        await fs.unlink(filePath);
      } catch (e: any) {
        return new Response(JSON.stringify({ 
          error: "Impossible de supprimer le fichier en local en mode développement.",
          details: e.message 
        }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ 
      message: githubToken 
        ? 'Pensée supprimée avec succès sur GitHub ! Le site est en cours de reconstruction sur Vercel et sera à jour d\'ici 1 à 2 minutes.' 
        : 'Pensée supprimée avec succès !'
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
