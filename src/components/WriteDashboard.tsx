import React, { useState } from 'react';
import { Editor, type Thought } from './Editor';
import { BookEditor, type BookChapter } from './BookEditor';
import { PenTool, BookOpen } from 'lucide-react';

interface Props {
  initialThoughts: Thought[];
  initialChapters: BookChapter[];
}

export const WriteDashboard = ({ initialThoughts, initialChapters }: Props) => {
  const [activeTab, setActiveTab] = useState<'thoughts' | 'books'>('thoughts');

  return (
    <div>
      <div className="write-tabs">
        <button
          onClick={() => setActiveTab('thoughts')}
          className={`tab-btn ${activeTab === 'thoughts' ? 'active' : ''}`}
        >
          <PenTool size={18} />
          Écrire une Pensée
        </button>
        <button
          onClick={() => setActiveTab('books')}
          className={`tab-btn ${activeTab === 'books' ? 'active' : ''}`}
        >
          <BookOpen size={18} />
          Écrire un Livre
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'thoughts' ? (
          <Editor initialThoughts={initialThoughts} />
        ) : (
          <BookEditor initialChapters={initialChapters} />
        )}
      </div>

      <style>{`
        .write-tabs {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .tab-btn {
          background: white;
          border: 1px solid var(--glass-border);
          padding: 0.8rem 2rem;
          border-radius: 50px;
          font-family: var(--font-sans);
          font-weight: 600;
          color: var(--text-light);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 10px rgba(0,0,0,0.02);
        }

        .tab-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow);
          color: var(--primary);
        }

        .tab-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
          box-shadow: 0 4px 15px rgba(126, 182, 226, 0.3);
        }
      `}</style>
    </div>
  );
};
