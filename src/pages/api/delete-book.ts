import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { id } = data; // ex: "mon-journal-intime/1-mon-premier-chapitre"
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID du chapitre requis' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Normaliser le chemin du fichier (ajouter l'extension si elle n'y est pas)
    const normalizedId = id.endsWith('.md') ? id : `${id}.md`;
    
    const githubToken = process.env.GITHUB_TOKEN || process.env.MINA_GITHUB_TOKEN;

    if (githubToken) {
      // Production (Vercel) via l'API GitHub
      const owner = 'Malmeu';
      const repo = 'les_pens-es';
      const fileGitPath = `src/content/books/${normalizedId}`;
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
          error: "Impossible de localiser le chapitre sur GitHub pour le supprimer.",
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
          message: `chore: supprimer le chapitre "${normalizedId}"`,
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
      // Développement local
      const filePath = path.join(process.cwd(), 'src/content/books', normalizedId);
      try {
        await fs.unlink(filePath);
        
        // Optionnel : si le dossier du livre est vide après suppression, on peut le supprimer
        const folderPath = path.dirname(filePath);
        const files = await fs.readdir(folderPath);
        if (files.length === 0) {
          await fs.rmdir(folderPath);
        }
      } catch (e: any) {
        return new Response(JSON.stringify({ 
          error: "Impossible de supprimer le fichier en local.",
          details: e.message 
        }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ 
      message: githubToken 
        ? 'Chapitre supprimé avec succès sur GitHub ! Le site est en cours de reconstruction sur Vercel et sera à jour d\'ici 1 à 2 minutes.' 
        : 'Chapitre supprimé avec succès en local !'
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
