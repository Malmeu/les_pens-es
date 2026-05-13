import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { Save, Eye, Edit3, Bold, Italic, List, Link as LinkIcon, Quote, Type, Image as ImageIcon, Columns } from 'lucide-react';

export const Editor = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'positive' | 'negative' | 'poem'>('positive');
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const [html, setHtml] = useState('');
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
    const selection = text.substring(start, end);
    const newText = text.substring(0, start) + before + selection + after + text.substring(end);
    setContent(newText);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const cursorPosition = start + before.length + selection.length + after.length;
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
        <p className="hint">Mode: {viewMode === 'edit' ? 'Édition' : viewMode === 'split' ? 'Côte à côte' : 'Aperçu'}</p>
        <button onClick={handleSave} className="save-btn">
          <Save size={18} /> Télécharger .md
        </button>
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

        .save-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.7rem 1.4rem;
          border-radius: 50px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .save-btn:hover {
          background: #6a9fd1;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(126, 182, 226, 0.3);
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
