import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import { ChevronLeft, ChevronRight, BookMarked } from 'lucide-react';

export interface ChapterData {
  title: string;
  content: string;
  chapterNumber: number;
}

interface FlipBookProps {
  bookTitle: string;
  bookDescription?: string;
  coverColor: 'pink' | 'purple' | 'blue' | 'green' | 'cream';
  chapters: ChapterData[];
}

export const FlipBook = ({ bookTitle, bookDescription, coverColor, chapters }: FlipBookProps) => {
  const [currentPage, setCurrentPage] = useState(0); // Index de la feuille active (0 = couverture fermée)
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);

  // Construire la liste des pages à afficher
  const pages: { type: 'cover' | 'blank' | 'content'; title?: string; content?: string; number?: number }[] = [];

  // 1. Couverture
  pages.push({ type: 'cover', title: bookTitle, content: bookDescription });
  // 2. Dédicace / Page d'accueil du livre
  pages.push({ type: 'blank', title: bookTitle, content: "Écrit par Mina.\n\nPrenez place, tournez la page, et laissez-vous emporter..." });
  
  // 3. Contenu des chapitres
  chapters.forEach(ch => {
    pages.push({
      type: 'content',
      title: ch.title,
      content: ch.content,
      number: ch.chapterNumber
    });
  });

  // 4. Fin du livre et quatrième de couverture
  if (pages.length % 2 !== 0) {
    pages.push({ type: 'blank', content: "Fin de ce voyage poétique..." });
  }
  pages.push({ type: 'cover', title: "Les Pensées de Mina" });

  const totalPages = pages.length;
  const totalSheets = Math.ceil(totalPages / 2);

  const nextPage = () => {
    if (currentPage < totalSheets - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Rendu HTML du markdown pour une page
  const renderMarkdown = (content: string) => {
    try {
      return { __html: marked.parseSync(content) };
    } catch (e) {
      return { __html: content };
    }
  };

  // Gestion du Swipe Tactile (Geste de balayage)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    // Détecter un balayage horizontal prédominant d'au moins 40px
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX > 0) {
        nextPage();
      } else {
        prevPage();
      }
    }
  };

  // Thèmes de couleurs des couvertures
  const themes = {
    pink: {
      gradient: 'linear-gradient(135deg, #ffb7b2 0%, #ffc6ff 100%)',
      accent: '#6b4e71',
    },
    purple: {
      gradient: 'linear-gradient(135deg, #c7ceea 0%, #e2b4f8 100%)',
      accent: '#3f37c9',
    },
    blue: {
      gradient: 'linear-gradient(135deg, #b3d4f0 0%, #a2d2ff 100%)',
      accent: '#023047',
    },
    green: {
      gradient: 'linear-gradient(135deg, #b5ead7 0%, #c7f9cc 100%)',
      accent: '#1b4332',
    },
    cream: {
      gradient: 'linear-gradient(135deg, #fdfaf3 0%, #f5efe6 100%)',
      accent: '#4a3f35',
    }
  };

  const theme = themes[coverColor] || themes.pink;

  return (
    <div className="flipbook-container-styled">
      <div 
        className="flipbook-outer"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Bouton Précédent */}
        <button 
          onClick={prevPage} 
          className="nav-btn prev-btn glass"
          disabled={currentPage === 0}
          title="Page précédente"
        >
          <ChevronLeft size={28} />
        </button>

        {/* Livre 3D */}
        <div className="book-3d-wrapper">
          <div className={`book-3d ${currentPage > 0 ? 'is-open' : ''}`}>
            {/* Les Feuilles (Sheets) */}
            {Array.from({ length: totalSheets }).map((_, sheetIdx) => {
              const isFlipped = currentPage > sheetIdx;
              
              // indices des pages gauche et droite pour ce feuillet
              const frontPageIdx = sheetIdx * 2;
              const backPageIdx = sheetIdx * 2 + 1;
              
              const frontPage = pages[frontPageIdx];
              const backPage = pages[backPageIdx];
              
              const zIndex = isFlipped ? sheetIdx : totalSheets - sheetIdx;

              return (
                <div 
                  key={sheetIdx} 
                  className={`sheet ${isFlipped ? 'flipped' : ''}`}
                  style={{ 
                    zIndex,
                    transform: isFlipped ? 'rotateY(-180deg)' : 'rotateY(0deg)'
                  }}
                >
                  {/* Face Avant (Right Page when unflipped) */}
                  <div className={`page-side page-front ${frontPage.type}`}>
                    {frontPage.type === 'cover' ? (
                      <div className="cover-inner" style={{ background: theme.gradient }}>
                        <div className="cover-emboss">
                          <BookMarked size={48} className="cover-seal" style={{ color: theme.accent }} />
                          <h2 className="cover-title-3d" style={{ color: theme.accent }}>{frontPage.title}</h2>
                          {frontPage.content && <p className="cover-desc-3d" style={{ color: theme.accent }}>{frontPage.content}</p>}
                          <div className="cover-footer-3d" style={{ color: theme.accent }}>Mina</div>
                        </div>
                      </div>
                    ) : frontPage.type === 'blank' ? (
                      <div className="blank-inner">
                        <h3>{frontPage.title}</h3>
                        <p>{frontPage.content}</p>
                        <span className="flourish">✿</span>
                      </div>
                    ) : (
                      <div className="content-inner">
                        <div className="page-header">
                          <span className="ch-num">Chapitre {frontPage.number}</span>
                          <h3 className="ch-title">{frontPage.title}</h3>
                        </div>
                        <div className="page-body markdown-rendered" dangerouslySetInnerHTML={renderMarkdown(frontPage.content || '')} />
                        <div className="page-footer-num">p. {frontPageIdx}</div>
                      </div>
                    )}
                    <div className="page-shadow-right"></div>
                  </div>

                  {/* Face Arrière (Left Page when flipped) */}
                  <div className={`page-side page-back ${backPage?.type || 'blank'}`}>
                    {backPage ? (
                      backPage.type === 'cover' ? (
                        <div className="cover-inner back-cover" style={{ background: theme.gradient }}>
                          <div className="cover-emboss">
                            <h4 style={{ color: theme.accent }}>Fin de l'ouvrage</h4>
                            <div className="mini-spine-dec" style={{ backgroundColor: theme.accent }}></div>
                            <p style={{ color: theme.accent }} className="back-cover-note">Les Pensées de Mina © 2026</p>
                          </div>
                        </div>
                      ) : backPage.type === 'blank' ? (
                        <div className="blank-inner">
                          <p>{backPage.content}</p>
                          <span className="flourish">✿</span>
                        </div>
                      ) : (
                        <div className="content-inner">
                          <div className="page-header">
                            <span className="ch-num">Chapitre {backPage.number}</span>
                            <h3 className="ch-title">{backPage.title}</h3>
                          </div>
                          <div className="page-body markdown-rendered" dangerouslySetInnerHTML={renderMarkdown(backPage.content || '')} />
                          <div className="page-footer-num">p. {backPageIdx}</div>
                        </div>
                      )
                    ) : (
                      <div className="blank-inner"></div>
                    )}
                    <div className="page-shadow-left"></div>
                  </div>
                </div>
              );
            })}
            
            {/* Tranche centrale du livre */}
            <div className="book-spine"></div>
          </div>
        </div>

        {/* Bouton Suivant */}
        <button 
          onClick={nextPage} 
          className="nav-btn next-btn glass"
          disabled={currentPage === totalSheets - 1}
          title="Page suivante"
        >
          <ChevronRight size={28} />
        </button>
      </div>

      {/* Barre de contrôle pour Mobile (visible uniquement sous 992px) */}
      <div className="mobile-controls-bar">
        <button 
          onClick={prevPage} 
          disabled={currentPage === 0} 
          className="mobile-nav-btn glass"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="mobile-page-indicator">
          {currentPage === 0 ? 'Couverture' : currentPage === totalSheets - 1 ? 'Fin' : `Page ${currentPage * 2} / ${totalPages - 2}`}
        </span>
        <button 
          onClick={nextPage} 
          disabled={currentPage === totalSheets - 1} 
          className="mobile-nav-btn glass"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <style>{`
        .flipbook-container-styled {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          gap: 2rem;
        }

        .flipbook-outer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
        }

        .nav-btn {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 1px solid var(--glass-border);
          background: var(--glass);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s;
          z-index: 10;
        }

        .nav-btn:hover:not(:disabled) {
          transform: scale(1.1);
          background: white;
          color: var(--text-dark);
          box-shadow: var(--shadow);
        }

        .nav-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .book-3d-wrapper {
          flex-grow: 1;
          max-width: 1000px;
          height: 650px;
          perspective: 1800px;
          width: 100%;
        }

        .book-3d {
          position: relative;
          width: 50%;
          height: 100%;
          left: 25%;
          transform-style: preserve-3d;
          transition: transform 1s ease-in-out;
        }

        .book-3d.is-open {
          transform: translateX(50%); /* Repositionner au centre */
        }

        .sheet {
          position: absolute;
          width: 100%;
          height: 100%;
          right: 0;
          top: 0;
          transform-origin: left center;
          transform-style: preserve-3d;
          transition: transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1);
        }

        .page-side {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          background: #faf7f2;
          box-shadow: inset 3px 0 20px rgba(0,0,0,0.02);
          overflow: hidden;
          border-radius: 0 10px 10px 0;
          border: 1px solid rgba(0,0,0,0.06);
        }

        .page-front {
          z-index: 2;
        }

        .page-back {
          transform: rotateY(180deg);
          border-radius: 10px 0 0 10px;
          z-index: 1;
        }

        /* Styles spécifiques des pages */
        .cover-inner {
          width: 100%;
          height: 100%;
          padding: 3rem;
          display: flex;
          flex-direction: column;
          box-shadow: inset 0 0 50px rgba(0,0,0,0.1), 10px 0 20px rgba(0,0,0,0.1);
        }

        .back-cover {
          box-shadow: inset 0 0 50px rgba(0,0,0,0.1), -10px 0 20px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .cover-emboss {
          border: 3px double rgba(255, 255, 255, 0.6);
          border-radius: 12px;
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2rem;
          background: rgba(255,255,255,0.05);
        }

        .cover-seal {
          margin-bottom: 2rem;
          opacity: 0.8;
        }

        .cover-title-3d {
          font-family: var(--font-serif);
          font-size: 2.5rem;
          line-height: 1.2;
          margin-bottom: 1.5rem;
        }

        .cover-desc-3d {
          font-family: var(--font-sans);
          font-size: 1rem;
          font-style: italic;
          opacity: 0.8;
          max-width: 250px;
          line-height: 1.6;
        }

        .cover-footer-3d {
          font-family: var(--font-script);
          font-size: 2.2rem;
          margin-top: auto;
        }

        .back-cover-note {
          font-size: 0.8rem;
          opacity: 0.6;
          margin-top: 1rem;
        }

        .mini-spine-dec {
          width: 40px;
          height: 2px;
          margin: 1.5rem 0;
          opacity: 0.5;
        }

        .blank-inner {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          height: 100%;
          padding: 4rem;
        }

        .blank-inner h3 {
          font-family: var(--font-serif);
          font-size: 2rem;
          color: var(--text-dark);
          margin-bottom: 2rem;
        }

        .blank-inner p {
          font-family: var(--font-sans);
          font-size: 1.15rem;
          line-height: 1.8;
          color: var(--text-light);
          white-space: pre-line;
        }

        .flourish {
          font-size: 2rem;
          color: var(--primary);
          margin-top: 2rem;
          opacity: 0.5;
        }

        .content-inner {
          height: 100%;
          padding: 3.5rem;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .page-header {
          border-bottom: 1px solid rgba(0,0,0,0.05);
          padding-bottom: 1rem;
          margin-bottom: 2rem;
        }

        .ch-num {
          font-family: var(--font-sans);
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 1.5px;
          display: block;
          margin-bottom: 0.5rem;
        }

        .ch-title {
          font-family: var(--font-serif);
          font-size: 1.8rem;
          color: var(--text-dark);
        }

        .page-body {
          font-family: var(--font-serif);
          font-size: 1.05rem;
          line-height: 1.8;
          color: #3f3f3f;
          flex-grow: 1;
        }

        .page-footer-num {
          text-align: center;
          font-size: 0.8rem;
          color: var(--text-light);
          opacity: 0.5;
          margin-top: 1.5rem;
          font-family: var(--font-sans);
        }

        /* Ombres pour le relief 3D */
        .page-shadow-right {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          width: 20px;
          background: linear-gradient(to right, rgba(0,0,0,0.05), rgba(0,0,0,0));
          pointer-events: none;
        }

        .page-shadow-left {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 20px;
          background: linear-gradient(to left, rgba(0,0,0,0.05), rgba(0,0,0,0));
          pointer-events: none;
        }

        /* Effet de pliure / tranche centrale */
        .book-spine {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 20px;
          background: linear-gradient(to right, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 100%);
          z-index: 100;
          transform: translateX(-50%);
          pointer-events: none;
        }

        /* Mobile Controls Bar */
        .mobile-controls-bar {
          display: none;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 400px;
          padding: 0 1rem;
        }

        .mobile-nav-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid var(--glass-border);
          background: var(--glass);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .mobile-nav-btn:disabled {
          opacity: 0.3;
        }

        .mobile-page-indicator {
          font-family: var(--font-sans);
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-light);
        }

        /* RESPONSIVE DESIGN - UNIFIED 3D BOOK */
        @media (max-width: 992px) {
          .flipbook-outer {
            gap: 0;
          }
          .nav-btn {
            display: none; /* Masquer les boutons latéraux sur tablette/mobile */
          }
          .mobile-controls-bar {
            display: flex; /* Afficher la barre de contrôle en bas */
          }
          .book-3d-wrapper {
            height: 520px;
          }
          .content-inner {
            padding: 2.2rem;
          }
          .cover-inner {
            padding: 2rem;
          }
          .cover-title-3d {
            font-size: 2rem;
          }
        }

        @media (max-width: 768px) {
          .book-3d-wrapper {
            height: 450px;
          }
          .content-inner {
            padding: 1.5rem 1.2rem;
          }
          .ch-title {
            font-size: 1.2rem;
          }
          .ch-num {
            font-size: 0.7rem;
            margin-bottom: 0.2rem;
          }
          .page-body {
            font-size: 0.88rem;
            line-height: 1.6;
          }
          .cover-inner {
            padding: 1.5rem;
          }
          .cover-title-3d {
            font-size: 1.4rem;
          }
          .cover-desc-3d {
            font-size: 0.8rem;
            margin-bottom: 1rem;
          }
          .cover-author {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};
