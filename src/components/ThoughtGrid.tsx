import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, CloudRain, Star, BookOpen, ArrowRight } from 'lucide-react';

interface Thought {
  id: string;
  slug: string;
  type: 'positive' | 'negative' | 'poem';
  title: string;
  content: string;
  date: string;
}

interface Props {
  initialThoughts: Thought[];
}

export const ThoughtGrid = ({ initialThoughts }: Props) => {
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'poem'>('all');

  const filteredThoughts = filter === 'all' 
    ? initialThoughts 
    : initialThoughts.filter(t => t.type === filter);

  const getIcon = (type: string) => {
    switch (type) {
      case 'positive': return <Star size={20} />;
      case 'negative': return <CloudRain size={20} />;
      case 'poem': return <BookOpen size={20} />;
      default: return <Heart size={20} />;
    }
  };

  return (
    <section id="pensees" className="section-padding">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Mes Pensées</h2>
          <div className="filters">
            <button 
              onClick={() => setFilter('all')} 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            >
              Toutes
            </button>
            <button 
              onClick={() => setFilter('positive')} 
              className={`filter-btn ${filter === 'positive' ? 'active' : ''}`}
            >
              Positives
            </button>
            <button 
              onClick={() => setFilter('negative')} 
              className={`filter-btn ${filter === 'negative' ? 'active' : ''}`}
            >
              Négatives
            </button>
            <button 
              onClick={() => setFilter('poem')} 
              className={`filter-btn ${filter === 'poem' ? 'active' : ''}`}
            >
              Poèmes
            </button>
          </div>
        </div>

        <motion.div layout className="thought-grid">
          <AnimatePresence mode='popLayout'>
            {filteredThoughts.map((thought) => (
              <motion.div
                key={thought.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={`thought-card glass ${thought.type}`}
              >
                <div className="card-header">
                  <span className="date">{thought.date}</span>
                  <div className="type-icon">{getIcon(thought.type)}</div>
                </div>
                <h3 className="card-title">{thought.title}</h3>
                <div className="card-content">
                  <p>{thought.content.substring(0, 150)}...</p>
                </div>
                <div className="card-footer">
                  <a href={`/pensees/${thought.slug}`} className="read-more">
                    Ouvrir la lettre <ArrowRight size={16} />
                  </a>
                  <Heart className="heart-btn" size={18} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <style>{`
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4rem;
          flex-wrap: wrap;
          gap: 2rem;
        }

        .section-title {
          font-size: 3rem;
          color: var(--text-dark);
        }

        .filters {
          display: flex;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.5);
          padding: 0.5rem;
          border-radius: 50px;
          border: 1px solid var(--glass-border);
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          max-width: 100%;
        }

        .filters::-webkit-scrollbar {
          display: none;
        }

        .filter-btn {
          padding: 0.5rem 1rem;
          border-radius: 50px;
          border: none;
          background: transparent;
          font-family: var(--font-sans);
          font-weight: 500;
          color: var(--text-light);
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
          font-size: 0.8rem;
        }

        .filter-btn:hover {
          color: var(--primary);
        }

        .filter-btn.active {
          background: var(--primary);
          color: white;
          box-shadow: 0 4px 10px rgba(255, 143, 177, 0.3);
        }

        .thought-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 2.5rem;
        }

        .thought-card {
          padding: 2.5rem;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          height: 100%;
          transition: transform 0.3s ease;
        }

        .thought-card:hover {
          transform: translateY(-10px);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .date {
          font-size: 0.8rem;
          color: var(--text-light);
          opacity: 0.7;
        }

        .card-title {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: var(--text-dark);
        }

        .card-content {
          font-family: var(--font-serif);
          font-style: italic;
          color: var(--text-light);
          flex-grow: 1;
          line-height: 1.7;
        }

        .card-footer {
          margin-top: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .read-more {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--primary);
        }

        .heart-btn {
          color: var(--text-light);
          cursor: pointer;
          transition: color 0.3s ease;
        }

        .heart-btn:hover {
          color: var(--primary);
        }

        .type-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .positive .type-icon { background: #e8f7f0; color: #4ade80; }
        .negative .type-icon { background: #fff1f0; color: #f87171; }
        .poem .type-icon { background: #f5f3ff; color: #a78bfa; }

        @media (max-width: 768px) {
          .section-title { font-size: 2.5rem; }
          .thought-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
};
