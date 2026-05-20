import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { Save, Eye, Edit3, Bold, Italic, List, Link as LinkIcon, Quote, Type, Image as ImageIcon, Columns, Trash2, RotateCcw } from 'lucide-react';

export interface Thought {
  id: string;
  title: string;
  content: string;
  type: 'positive' | 'negative' | 'poem';
  date: string | Date;
}

interface EditorProps {
  initialThoughts: Thought[];
}

export const Editor = ({ initialThoughts }: EditorProps) => {
  const [thoughts, setThoughts] = useState<Thought[]>(initialThoughts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'positive' | 'negative' | 'poem'>('positive');
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const [html, setHtml] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const parseMarkdown = async () => {
      const result = await marked.parse(content);
      setHtml(result);
    };
    parseMarkdown();
  }, [content]);

  const insertText = (before: string, after: string = '') => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = textareaRef.current.value;
    const originalSelection = text.substring(start, end);
    const selection = originalSelection.trim();
    
    // Si on a sélectionné du texte avec des espaces autour, on garde les espaces à l'extérieur des tags
    const leadSpace = originalSelection.match(/^\s*/)?.[0] || '';
    const trailSpace = originalSelection.match(/\s*$/)?.[0] || '';
    
    const newText = text.substring(0, start) + leadSpace + before + selection + after + trailSpace + text.substring(end);
    setContent(newText);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const cursorPosition = selection.length > 0 
          ? start + leadSpace.length + before.length + selection.length + after.length
          : start + before.length;
        textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  };

  const handleSave = () => {
    const date = new Date().toISOString().split('T')[0];
    const md = `---
title: "${title}"
date: "${date}"
type: "${type}"
description: "${title}"
---
${content}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    a.download = `${slug || 'nouvelle-pensee'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePublish = async () => {
    if (!title || !content) {
      setPublishStatus({ type: 'error', message: 'Veuillez remplir le titre et le contenu.' });
      return;
    }

    setIsPublishing(true);
    setPublishStatus(null);

    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, type }),
      });

      const data = await response.json();

      if (response.ok) {
        setPublishStatus({ type: 'success', message: 'Votre pensée a été publiée avec succès !' });
        // Optionnel: Rediriger ou vider le formulaire
        setTimeout(() => {
          window.location.href = `/pensees/${data.slug}`;
        }, 1500);
      } else {
        setPublishStatus({ type: 'error', message: data.error || 'Une erreur est survenue.' });
      }
    } catch (error) {
      setPublishStatus({ type: 'error', message: 'Erreur de connexion au serveur.' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleEdit = (thought: Thought) => {
    setTitle(thought.title);
    setContent(thought.content);
    setType(thought.type);
    setEditingId(thought.id);
    setPublishStatus(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette pensée ?')) return;

    try {
      const response = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });

      if (response.ok) {
        setThoughts(thoughts.filter(t => t.id !== slug));
        if (editingId === slug) {
          handleReset();
        }
      } else {
        alert('Erreur lors de la suppression.');
      }
    } catch (error) {
      alert('Erreur de connexion.');
    }
  };

  const handleReset = () => {
    setTitle('');
    setContent('');
    setType('positive');
    setEditingId(null);
    setPublishStatus(null);
  };

  return (
    <div className={`editor-container glass ${viewMode === 'split' ? 'split-view' : ''}`}>
      <div className="editor-header">
        <div className="input-group">
          <input 
            type="text" 
            placeholder="Titre de votre pensée..." 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="title-input"
          />
        </div>
        <div className="controls">
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value as any)}
            className="type-select"
          >
            <option value="positive">Positive ✨</option>
            <option value="negative">Négative 🌧️</option>
            <option value="poem">Poème 📜</option>
          </select>
          <div className="view-modes">
            <button 
              onClick={() => setViewMode('edit')} 
              className={`mode-btn ${viewMode === 'edit' ? 'active' : ''}`}
              title="Édition"
            >
              <Edit3 size={18} />
            </button>
            <button 
              onClick={() => setViewMode('split')} 
              className={`mode-btn ${viewMode === 'split' ? 'active' : ''}`}
              title="Vue côte à côte"
            >
              <Columns size={18} />
            </button>
            <button 
              onClick={() => setViewMode('preview')} 
              className={`mode-btn ${viewMode === 'preview' ? 'active' : ''}`}
              title="Aperçu final"
            >
              <Eye size={18} />
            </button>
          </div>
        </div>
      </div>

      {viewMode !== 'preview' && (
        <div className="markdown-toolbar">
          <button onClick={() => insertText('**', '**')} title="Gras"><Bold size={16} /></button>
          <button onClick={() => insertText('*', '*')} title="Italique"><Italic size={16} /></button>
          <button onClick={() => insertText('# ', '')} title="Titre"><Type size={16} /></button>
          <button onClick={() => insertText('> ', '')} title="Citation"><Quote size={16} /></button>
          <button onClick={() => insertText('- ', '')} title="Liste"><List size={16} /></button>
          <button onClick={() => insertText('[', '](url)')} title="Lien"><LinkIcon size={16} /></button>
          <button onClick={() => insertText('![alt](', ')') } title="Image"><ImageIcon size={16} /></button>
        </div>
      )}

      <div className="editor-body">
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className="editor-pane">
            <textarea 
              ref={textareaRef}
              placeholder="Écrivez ici..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="content-area"
            />
          </div>
        )}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`preview-pane ${viewMode === 'preview' ? 'letter-content' : 'simple-preview'}`}>
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        )}
      </div>

      <div className="editor-footer">
        <div className="footer-left">
          <p className="hint">Mode: {viewMode === 'edit' ? 'Édition' : viewMode === 'split' ? 'Côte à côte' : 'Aperçu'}</p>
          {publishStatus && (
            <span className={`status-msg ${publishStatus.type}`}>
              {publishStatus.message}
            </span>
          )}
        </div>
        <div className="footer-actions">
          <button onClick={handleReset} className="download-btn" title="Nouveau / Réinitialiser">
            <RotateCcw size={18} />
          </button>
          <button onClick={handleSave} className="download-btn" title="Télécharger le fichier Markdown">
            <Save size={18} /> .md
          </button>
          <button 
            onClick={handlePublish} 
            className={`publish-btn ${isPublishing ? 'loading' : ''}`}
            disabled={isPublishing}
          >
            {isPublishing ? 'Publication...' : editingId ? 'Mettre à jour' : 'Publier la pensée'}
          </button>
        </div>
      </div>

      <div className="thoughts-management">
        <h2 className="management-title">Mes dernières pensées</h2>
        <div className="thoughts-list">
          {thoughts.length === 0 ? (
            <p className="no-thoughts">Aucune pensée enregistrée pour le moment.</p>
          ) : (
            thoughts.map(thought => (
              <div key={thought.id} className={`thought-item glass ${thought.type}`}>
                <div className="item-info">
                  <span className="item-date">
                    {new Date(thought.date).toLocaleDateString('fr-FR')}
                  </span>
                  <h4 className="item-title">{thought.title}</h4>
                </div>
                <div className="item-actions">
                  <button onClick={() => handleEdit(thought)} className="action-btn edit" title="Modifier">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDelete(thought.id)} className="action-btn delete" title="Supprimer">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .editor-container {
          max-width: 1100px;
          margin: 2rem auto;
          border-radius: 24px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-height: 700px;
          box-shadow: var(--shadow);
          transition: max-width 0.3s ease;
        }

        .editor-container.split-view {
          max-width: 1300px;
        }

        .editor-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid var(--glass-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.4);
        }

        .title-input {
          background: transparent;
          border: none;
          font-family: var(--font-serif);
          font-size: 1.8rem;
          color: var(--text-dark);
          width: 100%;
          outline: none;
        }

        .controls {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }

        .view-modes {
          display: flex;
          background: rgba(255, 255, 255, 0.5);
          padding: 0.3rem;
          border-radius: 12px;
          border: 1px solid var(--glass-border);
        }

        .mode-btn {
          background: transparent;
          border: none;
          padding: 0.5rem 0.8rem;
          border-radius: 8px;
          color: var(--text-light);
          cursor: pointer;
          transition: all 0.2s;
        }

        .mode-btn.active {
          background: white;
          color: var(--primary);
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .type-select {
          padding: 0.5rem 1rem;
          border-radius: 10px;
          border: 1px solid var(--glass-border);
          background: white;
          font-family: var(--font-sans);
          outline: none;
        }

        .markdown-toolbar {
          display: flex;
          gap: 0.5rem;
          padding: 0.8rem 1.5rem;
          background: rgba(255, 255, 255, 0.2);
          border-bottom: 1px solid var(--glass-border);
          overflow-x: auto;
          scrollbar-width: none;
        }

        .markdown-toolbar::-webkit-scrollbar {
          display: none;
        }

        .markdown-toolbar button {
          flex-shrink: 0;
          background: white;
          border: 1px solid var(--glass-border);
          color: var(--text-light);
          padding: 0.4rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .markdown-toolbar button:hover {
          background: var(--primary-light);
          color: white;
          transform: translateY(-1px);
        }

        .editor-body {
          flex-grow: 1;
          display: flex;
          background: rgba(255, 255, 255, 0.5);
          min-height: 500px;
        }

        .editor-pane, .preview-pane {
          flex: 1;
          padding: 2.5rem;
          overflow-y: auto;
        }

        .editor-pane {
          border-right: 1px solid var(--glass-border);
        }

        .content-area {
          width: 100%;
          height: 100%;
          background: transparent;
          border: none;
          outline: none;
          font-family: var(--font-sans);
          font-size: 1.1rem;
          line-height: 1.8;
          resize: none;
          color: var(--text-dark);
        }

        .simple-preview {
          font-family: var(--font-sans);
          line-height: 1.6;
          color: var(--text-light);
        }

        .simple-preview h1, .simple-preview h2 {
          font-family: var(--font-serif);
          color: var(--text-dark);
          margin: 1.5rem 0 1rem;
        }

        .editor-footer {
          padding: 1rem 2rem;
          background: rgba(255, 255, 255, 0.4);
          border-top: 1px solid var(--glass-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-left {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .status-msg {
          font-size: 0.9rem;
          padding: 0.4rem 1rem;
          border-radius: 20px;
          animation: fadeIn 0.3s ease;
        }

        .status-msg.success {
          background: #e8f7f0;
          color: #10b981;
        }

        .status-msg.error {
          background: #fff1f0;
          color: #f87171;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .footer-actions {
          display: flex;
          gap: 1rem;
        }

        .download-btn {
          background: white;
          color: var(--text-light);
          border: 1px solid var(--glass-border);
          padding: 0.7rem 1.2rem;
          border-radius: 50px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }

        .download-btn:hover {
          background: var(--bg);
          border-color: var(--primary);
          color: var(--primary);
        }

        .publish-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.7rem 1.8rem;
          border-radius: 50px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(126, 182, 226, 0.2);
        }

        .publish-btn:hover:not(:disabled) {
          background: #6a9fd1;
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(126, 182, 226, 0.3);
        }

        .publish-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .publish-btn.loading {
          background: var(--text-light);
        }

        .thoughts-management {
          margin-top: 4rem;
          padding: 0 1rem;
        }

        .management-title {
          font-size: 1.8rem;
          margin-bottom: 2rem;
          color: var(--text-dark);
        }

        .thoughts-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .thought-item {
          padding: 1.5rem;
          border-radius: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
        }

        .thought-item:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow);
        }

        .item-info {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .item-date {
          font-size: 0.75rem;
          color: var(--text-light);
          opacity: 0.7;
        }

        .item-title {
          font-size: 1.1rem;
          color: var(--text-dark);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 180px;
        }

        .item-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid var(--glass-border);
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn.edit { color: var(--primary); }
        .action-btn.delete { color: #f87171; }

        .action-btn:hover {
          transform: scale(1.1);
        }

        .action-btn.edit:hover { background: var(--bg); }
        .action-btn.delete:hover { background: #fff1f0; }

        .no-thoughts {
          color: var(--text-light);
          font-style: italic;
          grid-column: 1 / -1;
          text-align: center;
          padding: 3rem;
        }

        @media (max-width: 900px) {
          .editor-container.split-view {
            flex-direction: column;
          }
          .editor-pane {
            border-right: none;
            border-bottom: 1px solid var(--glass-border);
          }
        }
      `}</style>
    </div>
  );
};
