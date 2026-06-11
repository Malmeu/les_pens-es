import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { Save, Eye, Edit3, Bold, Italic, List, Link as LinkIcon, Quote, Type, Image as ImageIcon, Columns, Trash2, RotateCcw, BookOpen, ArrowRight } from 'lucide-react';

export interface BookChapter {
  id: string; // "book-id/chapter-slug"
  title: string;
  content: string;
  bookId: string;
  bookTitle: string;
  bookDescription?: string;
  coverColor: 'pink' | 'purple' | 'blue' | 'green' | 'cream';
  chapterNumber: number;
  date: string | Date;
}

interface BookEditorProps {
  initialChapters: BookChapter[];
}

export const BookEditor = ({ initialChapters }: BookEditorProps) => {
  const [chapters, setChapters] = useState<BookChapter[]>(initialChapters);
  
  // Book selection & creation state
  const [selectedBookId, setSelectedBookId] = useState<string>('new');
  const [bookTitle, setBookTitle] = useState('');
  const [bookDescription, setBookDescription] = useState('');
  const [coverColor, setCoverColor] = useState<'pink' | 'purple' | 'blue' | 'green' | 'cream'>('pink');
  
  // Chapter state
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterContent, setChapterContent] = useState('');
  const [chapterNumber, setChapterNumber] = useState<number>(1);
  
  // View states
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const [html, setHtml] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Group chapters by bookId to get unique books list
  const booksMap = React.useMemo(() => {
    const map = new Map<string, { bookTitle: string; bookDescription?: string; coverColor: any; chaptersCount: number }>();
    chapters.forEach(ch => {
      if (!map.has(ch.bookId)) {
        map.set(ch.bookId, {
          bookTitle: ch.bookTitle,
          bookDescription: ch.bookDescription,
          coverColor: ch.coverColor,
          chaptersCount: 0
        });
      }
      const data = map.get(ch.bookId)!;
      data.chaptersCount += 1;
    });
    return map;
  }, [chapters]);

  const uniqueBooks = Array.from(booksMap.entries()).map(([id, info]) => ({
    id,
    ...info
  }));

  // Parse markdown for preview
  useEffect(() => {
    const parseMarkdown = async () => {
      const result = await marked.parse(chapterContent);
      setHtml(result);
    };
    parseMarkdown();
  }, [chapterContent]);

  // Sync details when selectedBookId changes
  useEffect(() => {
    if (selectedBookId === 'new') {
      setBookTitle('');
      setBookDescription('');
      setCoverColor('pink');
      setChapterNumber(1);
      setChapterTitle('');
      setChapterContent('');
      setEditingChapterId(null);
    } else {
      const bookData = booksMap.get(selectedBookId);
      if (bookData) {
        setBookTitle(bookData.bookTitle);
        setBookDescription(bookData.bookDescription || '');
        setCoverColor(bookData.coverColor);
        
        // Auto-increment chapter number
        const bookChapters = chapters.filter(c => c.bookId === selectedBookId);
        const maxNum = bookChapters.reduce((max, c) => c.chapterNumber > max ? c.chapterNumber : max, 0);
        
        if (!editingChapterId) {
          setChapterNumber(maxNum + 1);
          setChapterTitle(`Page ${maxNum + 1}`);
          setChapterContent('');
        }
      }
    }
  }, [selectedBookId, chapters, booksMap, editingChapterId]);

  const insertText = (before: string, after: string = '') => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = textareaRef.current.value;
    const originalSelection = text.substring(start, end);
    const selection = originalSelection.trim();
    
    const leadSpace = originalSelection.match(/^\s*/)?.[0] || '';
    const trailSpace = originalSelection.match(/\s*$/)?.[0] || '';
    
    const newText = text.substring(0, start) + leadSpace + before + selection + after + trailSpace + text.substring(end);
    setChapterContent(newText);
    
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

  const handleReset = () => {
    setSelectedBookId('new');
    setBookTitle('');
    setBookDescription('');
    setCoverColor('pink');
    setChapterTitle('');
    setChapterContent('');
    setChapterNumber(1);
    setEditingChapterId(null);
    setPublishStatus(null);
  };

  const handleSaveMd = () => {
    const date = new Date().toISOString().split('T')[0];
    const md = `---
title: "${chapterTitle}"
bookId: "${selectedBookId === 'new' ? 'nouveau-livre' : selectedBookId}"
bookTitle: "${bookTitle}"
bookDescription: "${bookDescription}"
coverColor: "${coverColor}"
chapterNumber: ${chapterNumber}
date: "${date}"
---
${chapterContent}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const bookSlug = selectedBookId === 'new' ? 'livre' : selectedBookId;
    a.download = `chapitre-${chapterNumber}-${bookSlug}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePublish = async () => {
    if (!bookTitle || !chapterTitle || !chapterContent) {
      setPublishStatus({ type: 'error', message: 'Veuillez remplir le titre du livre, le titre de la page et son contenu.' });
      return;
    }

    setIsPublishing(true);
    setPublishStatus(null);

    // Generate bookId if creating a new book
    const computedBookId = selectedBookId === 'new'
      ? bookTitle.toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/ /g, '-')
          .replace(/[^\w-]+/g, '')
      : selectedBookId;

    try {
      const response = await fetch('/api/publish-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: chapterTitle,
          content: chapterContent,
          bookId: computedBookId,
          bookTitle,
          bookDescription,
          coverColor,
          chapterNumber
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPublishStatus({ type: 'success', message: 'Chapitre enregistré avec succès !' });
        
        // Update local state
        const updatedChapter: BookChapter = {
          id: editingChapterId || `${computedBookId}/${chapterNumber}-${chapterTitle.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')}`,
          title: chapterTitle,
          content: chapterContent,
          bookId: computedBookId,
          bookTitle,
          bookDescription,
          coverColor,
          chapterNumber,
          date: new Date()
        };

        if (editingChapterId) {
          setChapters(chapters.map(c => c.id === editingChapterId ? updatedChapter : c));
        } else {
          setChapters([...chapters, updatedChapter]);
        }

        setTimeout(() => {
          window.location.href = `/books/${computedBookId}`;
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

  const handleEditChapter = (ch: BookChapter) => {
    setSelectedBookId(ch.bookId);
    setBookTitle(ch.bookTitle);
    setBookDescription(ch.bookDescription || '');
    setCoverColor(ch.coverColor);
    
    setEditingChapterId(ch.id);
    setChapterTitle(ch.title);
    setChapterContent(ch.content);
    setChapterNumber(ch.chapterNumber);
    setPublishStatus(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteChapter = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce chapitre ?')) return;

    try {
      const response = await fetch('/api/delete-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setChapters(chapters.filter(c => c.id !== id));
        if (editingChapterId === id) {
          handleReset();
        }
      } else {
        alert('Erreur lors de la suppression.');
      }
    } catch (error) {
      alert('Erreur de connexion.');
    }
  };

  // Predefined colors styling
  const colorsMap = {
    pink: { hex: '#ffb7b2', label: 'Rose Guimauve' },
    purple: { hex: '#c7ceea', label: 'Violet Doux' },
    blue: { hex: '#b3d4f0', label: 'Bleu Ciel' },
    green: { hex: '#b5ead7', label: 'Menthe' },
    cream: { hex: '#fdfaf3', label: 'Ivoire' }
  };

  return (
    <div className={`editor-container glass ${viewMode === 'split' ? 'split-view' : ''}`}>
      {/* Book Metadata & Configuration */}
      <div className="book-config-section">
        <div className="config-row">
          <div className="form-group flex-1">
            <label className="label">Livre cible</label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="type-select w-full"
              disabled={!!editingChapterId}
            >
              <option value="new">✨ Créer un nouveau livre...</option>
              {uniqueBooks.map(b => (
                <option key={b.id} value={b.id}>📖 {b.bookTitle} ({b.chaptersCount} page{b.chaptersCount > 1 ? 's' : ''})</option>
              ))}
            </select>
          </div>
          
          <div className="form-group flex-1">
            <label className="label">Titre du livre</label>
            <input
              type="text"
              placeholder="Ex: Mes Rêves Secrètes..."
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              className="title-input-styled"
              disabled={selectedBookId !== 'new'}
            />
          </div>
        </div>

        {selectedBookId === 'new' && (
          <div className="config-row mt-4">
            <div className="form-group flex-2">
              <label className="label">Résumé ou description du livre</label>
              <input
                type="text"
                placeholder="Un court résumé qui sera affiché sur la couverture..."
                value={bookDescription}
                onChange={(e) => setBookDescription(e.target.value)}
                className="description-input-styled"
              />
            </div>
            
            <div className="form-group flex-1">
              <label className="label">Style de couverture</label>
              <div className="color-picker">
                {(Object.keys(colorsMap) as Array<keyof typeof colorsMap>).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCoverColor(c)}
                    className={`color-bubble ${c} ${coverColor === c ? 'active' : ''}`}
                    title={colorsMap[c].label}
                    style={{ backgroundColor: colorsMap[c].hex }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chapter Title & View Modes */}
      <div className="editor-header">
        <div className="input-group flex-2">
          <div className="chapter-badge">Page {chapterNumber}</div>
          <input 
            type="text" 
            placeholder="Titre de cette page / chapitre..." 
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
            className="title-input"
          />
        </div>
        <div className="controls">
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

      {/* Markdown Toolbar */}
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

      {/* Editor Body */}
      <div className="editor-body">
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className="editor-pane">
            <textarea 
              ref={textareaRef}
              placeholder="Écrivez le contenu de votre page ici en Markdown..."
              value={chapterContent}
              onChange={(e) => setChapterContent(e.target.value)}
              className="content-area"
            />
          </div>
        )}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`preview-pane ${viewMode === 'preview' ? 'letter-content' : 'simple-preview'}`}>
            <div className="book-preview-spine"></div>
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        )}
      </div>

      {/* Editor Footer */}
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
          <button onClick={handleSaveMd} className="download-btn" title="Télécharger en Markdown">
            <Save size={18} /> .md
          </button>
          <button 
            onClick={handlePublish} 
            className={`publish-btn ${isPublishing ? 'loading' : ''}`}
            disabled={isPublishing}
          >
            {isPublishing ? 'Enregistrement...' : editingChapterId ? 'Mettre à jour la page' : 'Publier la page'}
          </button>
        </div>
      </div>

      {/* Books and Chapters Management */}
      <div className="thoughts-management">
        <h2 className="management-title">Mes Livres & Chapitres</h2>
        <div className="books-list">
          {uniqueBooks.length === 0 ? (
            <p className="no-thoughts">Aucun livre enregistré pour le moment. Créez-en un ci-dessus !</p>
          ) : (
            uniqueBooks.map(book => {
              const bookChapters = chapters
                .filter(c => c.bookId === book.id)
                .sort((a, b) => a.chapterNumber - b.chapterNumber);
                
              return (
                <div key={book.id} className="book-manage-card glass">
                  <div className="book-manage-header" style={{ borderLeft: `5px solid ${colorsMap[book.coverColor as keyof typeof colorsMap]?.hex || '#ffb7b2'}` }}>
                    <div className="book-title-container">
                      <BookOpen className="book-icon-inline" size={20} />
                      <h3>{book.bookTitle}</h3>
                    </div>
                    <a href={`/books/${book.id}`} target="_blank" className="view-book-link">
                      Consulter <ArrowRight size={14} />
                    </a>
                  </div>
                  
                  <div className="chapters-inline-list">
                    {bookChapters.map(ch => (
                      <div key={ch.id} className="chapter-inline-item">
                        <div className="chapter-number">p.{ch.chapterNumber}</div>
                        <div className="chapter-title">{ch.title}</div>
                        <div className="chapter-actions">
                          <button onClick={() => handleEditChapter(ch)} className="action-btn edit" title="Modifier">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => handleDeleteChapter(ch.id)} className="action-btn delete" title="Supprimer">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        /* Styles de l'éditeur général (Partagés) */
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

        .input-group {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-grow: 1;
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
          display: flex;
          align-items: center;
          justify-content: center;
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
          display: flex;
          align-items: center;
          justify-content: center;
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

        /* Styles de Configuration des Livres spécifiques */
        .book-config-section {
          padding: 2rem;
          background: rgba(255, 255, 255, 0.3);
          border-bottom: 1px solid var(--glass-border);
        }

        .config-row {
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
        }

        .mt-4 { margin-top: 1rem; }

        .flex-1 { flex: 1; }
        .flex-2 { flex: 2; }
        .w-full { width: 100%; }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .label {
          font-family: var(--font-sans);
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-light);
        }

        .title-input-styled, .description-input-styled {
          background: white;
          border: 1px solid var(--glass-border);
          border-radius: 10px;
          padding: 0.6rem 1rem;
          font-family: var(--font-sans);
          font-size: 0.95rem;
          color: var(--text-dark);
          outline: none;
          transition: border-color 0.2s;
        }

        .title-input-styled:focus, .description-input-styled:focus {
          border-color: var(--primary);
        }

        .title-input-styled:disabled, .description-input-styled:disabled {
          background: rgba(255, 255, 255, 0.4);
          color: var(--text-light);
          cursor: not-allowed;
          border: 1px solid var(--glass-border);
          opacity: 0.8;
        }

        .color-picker {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          height: 38px;
        }

        .color-bubble {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: transform 0.2s, border-color 0.2s;
        }

        .color-bubble:hover {
          transform: scale(1.15);
        }

        .color-bubble.active {
          border-color: var(--text-dark);
          transform: scale(1.1);
        }

        .chapter-badge {
          background: var(--primary-light);
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.4rem 1rem;
          border-radius: 50px;
          align-self: center;
          text-transform: uppercase;
          white-space: nowrap;
          box-shadow: 0 2px 10px rgba(126, 182, 226, 0.2);
        }

        .book-preview-spine {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 15px;
          background: linear-gradient(to right, rgba(0,0,0,0.1), rgba(0,0,0,0) 80%, rgba(255,255,255,0.1) 100%);
          border-right: 1px solid rgba(0,0,0,0.05);
        }

        .preview-pane {
          position: relative;
        }

        .books-list {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .book-manage-card {
          border-radius: 16px;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.4);
          overflow: hidden;
        }

        .book-manage-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1rem;
          border-bottom: 1px dashed var(--glass-border);
          margin-bottom: 1rem;
          padding-left: 0.8rem;
        }

        .book-title-container {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        .book-title-container h3 {
          font-size: 1.3rem;
          color: var(--text-dark);
        }

        .book-icon-inline {
          color: var(--primary);
        }

        .view-book-link {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--primary);
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .view-book-link:hover {
          color: var(--text-dark);
        }

        .chapters-inline-list {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .chapter-inline-item {
          display: flex;
          align-items: center;
          background: white;
          padding: 0.6rem 1rem;
          border-radius: 10px;
          border: 1px solid rgba(0,0,0,0.02);
        }

        .chapter-number {
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--primary);
          width: 50px;
        }

        .chapter-title {
          font-size: 0.95rem;
          color: var(--text-dark);
          flex-grow: 1;
        }

        .chapter-actions {
          display: flex;
          gap: 0.4rem;
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

        @media (max-width: 768px) {
          .config-row {
            flex-direction: column;
            gap: 1rem;
          }
          .flex-1, .flex-2 {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
