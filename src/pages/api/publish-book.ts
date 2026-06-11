import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { title, content, bookId, bookTitle, bookDescription, coverColor, chapterNumber } = data;
    
    if (!title || !content || !bookId || !bookTitle || !coverColor || chapterNumber === undefined) {
      return new Response(JSON.stringify({ error: 'Tous les champs obligatoires doivent être renseignés.' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const slug = title.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');
    
    const fileName = `${chapterNumber}-${slug || 'page'}.md`;
    
    const fileContent = `---
title: "${title}"
bookId: "${bookId}"
bookTitle: "${bookTitle}"
bookDescription: "${bookDescription || ''}"
coverColor: "${coverColor}"
chapterNumber: ${Number(chapterNumber)}
date: "${new Date().toISOString().split('T')[0]}"
---
${content}`;

    const githubToken = process.env.GITHUB_TOKEN || process.env.MINA_GITHUB_TOKEN;

    if (githubToken) {
      // Production (Vercel) via l'API GitHub
      const owner = 'Malmeu';
      const repo = 'les_pens-es';
      const fileGitPath = `src/content/books/${bookId}/${fileName}`;
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${fileGitPath}`;
      
      const base64Content = Buffer.from(fileContent).toString('base64');
      
      // On va d'abord vérifier si le fichier existe déjà pour faire une mise à jour (obtenir son sha)
      let sha: string | undefined = undefined;
      const checkResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'Les-Pensees-de-Mina-App'
        }
      });
      
      if (checkResponse.ok) {
        const fileData = await checkResponse.json();
        sha = fileData.sha;
      }
      
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
          message: `chore: publier le chapitre ${chapterNumber} de "${bookTitle}"`,
          content: base64Content,
          sha,
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
      // Développement local
      const folderPath = path.join(process.cwd(), 'src/content/books', bookId);
      const filePath = path.join(folderPath, fileName);
      
      try {
        await fs.mkdir(folderPath, { recursive: true });
        await fs.writeFile(filePath, fileContent, 'utf-8');
      } catch (e: any) {
        return new Response(JSON.stringify({ 
          error: "Impossible d'écrire sur le disque local.",
          details: e.message 
        }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ 
      message: githubToken 
        ? 'Chapitre enregistré avec succès sur GitHub ! Le site est en cours de reconstruction sur Vercel et sera à jour d\'ici 1 à 2 minutes.' 
        : 'Chapitre publié avec succès en local !', 
      slug: `${bookId}/${chapterNumber}-${slug}` 
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
