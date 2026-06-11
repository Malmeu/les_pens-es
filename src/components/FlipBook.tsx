import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import { ChevronLeft, ChevronRight, BookOpen, BookMarked } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(0); // Index de la feuille active (0 = couverture fermée)
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextPage();
    } else if (isRightSwipe) {
      prevPage();
    }
  };

  // Détecter si l'écran est mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Construire la liste des pages à afficher
  // Page 0: Couverture avant
  // Page 1: Page blanche / Dédicace
  // Page 2..N: Chapitres
  // Page N+1: Page blanche / Remerciements
  // Page N+2: Couverture arrière
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
  // En mode double page, le nombre de feuilles (sheets) est la moitié des pages
  const totalSheets = Math.ceil(totalPages / 2);

  const nextPage = () => {
    if (isMobile) {
      if (currentPage < totalPages - 1) {
        setCurrentPage(currentPage + 1);
      }
    } else {
      if (currentPage < totalSheets - 1) {
        setCurrentPage(currentPage + 1);
      }
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

  // Thèmes de couleurs des couvertures
  const themes = {
    pink: {
      gradient: 'linear-gradient(135deg, #ffb7b2 0%, #ffc6ff 100%)',
      accent: '#6b4e71',
      border: 'rgba(255, 117, 143, 0.3)',
      shadow: 'rgba(255, 183, 178, 0.4)'
    },
    purple: {
      gradient: 'linear-gradient(135deg, #c7ceea 0%, #e2b4f8 100%)',
      accent: '#3f37c9',
      border: 'rgba(199, 206, 234, 0.3)',
      shadow: 'rgba(199, 206, 234, 0.4)'
    },
    blue: {
      gradient: 'linear-gradient(135deg, #b3d4f0 0%, #a2d2ff 100%)',
      accent: '#023047',
      border: 'rgba(126, 182, 226, 0.3)',
      shadow: 'rgba(126, 182, 226, 0.4)'
    },
    green: {
      gradient: 'linear-gradient(135deg, #b5ead7 0%, #c7f9cc 100%)',
      accent: '#1b4332',
      border: 'rgba(181, 234, 215, 0.3)',
      shadow: 'rgba(181, 234, 215, 0.4)'
    },
    cream: {
      gradient: 'linear-gradient(135deg, #fdfaf3 0%, #f5efe6 100%)',
      accent: '#4a3f35',
      border: 'rgba(200, 180, 150, 0.3)',
      shadow: 'rgba(220, 210, 190, 0.4)'
    }
  };

  const theme = themes[coverColor] || themes.pink;

  // --- RENDER MOBILE ---
  if (isMobile) {
    const activePage = pages[currentPage];
    
    return (
      <div className="mobile-book-container">
        <div className="mobile-nav-bar">
          <button onClick={prevPage} disabled={currentPage === 0} className="nav-icon-btn">
            <ChevronLeft size={24} />
          </button>
          <span className="page-indicator">Page {currentPage + 1} / {totalPages}</span>
          <button onClick={nextPage} disabled={currentPage === totalPages - 1} className="nav-icon-btn">
            <ChevronRight size={24} />
          </button>
        </div>

        <div 
          className="mobile-card-wrapper"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className={`mobile-page-card ${activePage.type}`}
              style={activePage.type === 'cover' ? { background: theme.gradient, color: theme.accent } : {}}
            >
              {activePage.type === 'cover' ? (
                <div className="mobile-cover-content">
                  <div className="gold-frame">
                    <span className="cover-icon">📖</span>
                    <h2 className="cover-title">{activePage.title}</h2>
                    {activePage.content && <p className="cover-desc">{activePage.content}</p>}
                    <span className="cover-author">Mina</span>
                  </div>
                </div>
              ) : activePage.type === 'blank' ? (
                <div className="mobile-blank-content">
                  <h3 className="blank-title">{activePage.title}</h3>
                  <p className="blank-text">{activePage.content}</p>
                  <div className="sparkle-decoration">✨ 🌸 ✨</div>
                </div>
              ) : (
                <div className="mobile-content-layout">
                  <div className="mobile-chapter-header">
                    <span className="mobile-chapter-num">Page {activePage.number}</span>
                    <h3 className="mobile-chapter-title">{activePage.title}</h3>
                  </div>
                  <div className="mobile-chapter-body markdown-rendered" dangerouslySetInnerHTML={renderMarkdown(activePage.content || '')} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <style>{`
          .mobile-book-container {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            max-width: 500px;
            width: 100%;
            margin: 0 auto;
            padding: 1rem;
          }

          .mobile-nav-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: white;
            padding: 0.8rem 1.5rem;
            border-radius: 50px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          }

          .nav-icon-btn {
            background: none;
            border: none;
            color: var(--primary);
            cursor: pointer;
            display: flex;
            align-items: center;
          }

          .nav-icon-btn:disabled {
            color: #ddd;
            cursor: not-allowed;
          }

          .page-indicator {
            font-family: var(--font-sans);
            font-weight: 600;
            font-size: 0.9rem;
            color: var(--text-light);
          }

          .mobile-page-card {
            background: white;
            border-radius: 20px;
            min-height: 520px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
            padding: 2.5rem;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
          }

          .mobile-cover-content {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
          }

          .gold-frame {
            border: 2px solid rgba(255,255,255,0.6);
            border-radius: 12px;
            padding: 2.5rem 1.5rem;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(5px);
          }

          .cover-icon {
            font-size: 3rem;
            margin-bottom: 1.5rem;
          }

          .cover-title {
            font-family: var(--font-serif);
            font-size: 2.2rem;
            margin-bottom: 1rem;
            line-height: 1.2;
          }

          .cover-desc {
            font-size: 0.95rem;
            opacity: 0.8;
            margin-bottom: 2rem;
            font-style: italic;
          }

          .cover-author {
            font-family: var(--font-script);
            font-size: 2rem;
            margin-top: auto;
          }

          .mobile-blank-content {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            flex-grow: 1;
          }

          .blank-title {
            font-family: var(--font-serif);
            font-size: 1.8rem;
            color: var(--text-dark);
            margin-bottom: 1.5rem;
          }

          .blank-text {
            font-family: var(--font-sans);
            font-size: 1.1rem;
            line-height: 1.8;
            color: var(--text-light);
            white-space: pre-line;
            margin-bottom: 2rem;
          }

          .sparkle-decoration {
            font-size: 1.5rem;
            opacity: 0.6;
          }

          .mobile-content-layout {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }

          .mobile-chapter-header {
            border-bottom: 1px solid #f0f0f0;
            padding-bottom: 1rem;
          }

          .mobile-chapter-num {
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--primary);
            text-transform: uppercase;
            letter-spacing: 1px;
            display: block;
            margin-bottom: 0.3rem;
          }

          .mobile-chapter-title {
            font-family: var(--font-serif);
            font-size: 1.8rem;
            color: var(--text-dark);
          }

          .mobile-chapter-body {
            font-family: var(--font-serif);
            font-size: 1.1rem;
            line-height: 1.8;
            color: #444;
          }

          .markdown-rendered p {
            margin-bottom: 1.2rem;
          }
          .markdown-rendered blockquote {
            border-left: 3px solid var(--primary-light);
            padding-left: 1rem;
            margin: 1.5rem 0;
            font-style: italic;
            color: var(--text-light);
          }

          @media (max-width: 480px) {
            .mobile-page-card {
              padding: 1.5rem;
              min-height: 460px;
            }
            .cover-title {
              font-size: 1.8rem;
            }
            .gold-frame {
              padding: 1.5rem 1rem;
            }
          }
        `}</style>
      </div>
    );
  }

  // --- RENDER DESKTOP 3D FLIPBOOK ---
  return (
    <div className="flipbook-outer">
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
            
            // Calculer les indices des pages gauche et droite pour ce feuillet
            const frontPageIdx = sheetIdx * 2;
            const backPageIdx = sheetIdx * 2 + 1;
            
            const frontPage = pages[frontPageIdx];
            const backPage = pages[backPageIdx];
            
            // Gestion du Z-Index pour l'empilement 3D réaliste
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
          
          {/* Tranche centrale du livre (Spine effect) */}
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

      <style>{`
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
        }

        .book-3d {
          position: relative;
          width: 50%; /* La moitié de la largeur car chaque feuille se déploie à droite */
          height: 100%;
          left: 25%; /* Centrer le livre */
          transform-style: preserve-3d;
          transition: transform 1s ease-in-out;
        }

        .book-3d.is-open {
          transform: translateX(50%); /* Repositionner au centre quand il s'ouvre */
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
      `}</style>
    </div>
  );
};
