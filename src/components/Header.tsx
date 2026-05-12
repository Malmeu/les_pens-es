import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, PenTool, Home, BookHeart, User } from 'lucide-react';

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  const navLinks = [
    { name: 'Accueil', href: '/#accueil', icon: <Home size={18} /> },
    { name: 'Mes Pensées', href: '/#pensees', icon: <BookHeart size={18} /> },
    { name: 'Écrire', href: '/write', icon: <PenTool size={18} />, special: true },
    { name: 'À Propos', href: '/#apropos', icon: <User size={18} /> },
  ];

  return (
    <>
      <header className={`header ${scrolled ? 'scrolled' : ''} glass`}>
        <div className="container header-content">
          <a href="/" className="logo">
            Les Pensées de <span className="text-gradient">Mina</span>
          </a>

          {/* Desktop Nav */}
          <nav className="nav-desktop">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href} 
                className={`nav-link ${link.special ? 'write-btn' : ''}`}
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Hamburger Icon */}
          <button 
            className={`hamburger ${isOpen ? 'active' : ''}`} 
            onClick={toggleMenu}
            aria-label="Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMenu}
              className="menu-backdrop"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="mobile-menu"
            >
              <div className="mobile-menu-header">
                <span className="logo">Mina</span>
                <button onClick={toggleMenu} className="close-btn"><X size={32} /></button>
              </div>
              <nav className="mobile-nav-links">
                {navLinks.map((link, i) => (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={toggleMenu}
                    className="mobile-nav-link"
                  >
                    <span className="link-icon">{link.icon}</span>
                    <span className="link-name">{link.name}</span>
                  </motion.a>
                ))}
              </nav>
              <div className="mobile-menu-footer">
                <p>Créé avec tendresse par Mina</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .header {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 1000;
          padding: 1.2rem 0;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .header.scrolled {
          padding: 0.8rem 0;
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          font-family: var(--font-serif);
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--text-dark);
          text-decoration: none;
        }

        .nav-desktop {
          display: flex;
          gap: 2.5rem;
          align-items: center;
        }

        .nav-link {
          font-family: var(--font-sans);
          font-weight: 600;
          color: var(--text-light);
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          text-decoration: none;
          transition: color 0.3s;
        }

        .nav-link:hover {
          color: var(--primary);
        }

        .write-btn {
          background: var(--primary);
          color: white !important;
          padding: 0.6rem 1.8rem;
          border-radius: 50px;
          box-shadow: 0 4px 15px rgba(255, 143, 177, 0.3);
        }

        /* Hamburger Styles */
        .hamburger {
          display: none;
          flex-direction: column;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          z-index: 1100;
          padding: 0.5rem;
        }

        .hamburger span {
          display: block;
          width: 28px;
          height: 2px;
          background: var(--primary);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 2px;
        }

        .hamburger.active span:nth-child(1) { transform: translateY(8px) rotate(45deg); }
        .hamburger.active span:nth-child(2) { opacity: 0; }
        .hamburger.active span:nth-child(3) { transform: translateY(-8px) rotate(-45deg); }

        /* Mobile Menu */
        .menu-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(45, 27, 46, 0.4);
          backdrop-filter: blur(4px);
          z-index: 1050;
        }

        .mobile-menu {
          position: fixed;
          top: 0;
          right: 0;
          width: 300px;
          height: 100%;
          background: white;
          z-index: 1060;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          box-shadow: -10px 0 40px rgba(0,0,0,0.1);
        }

        .mobile-menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4rem;
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--primary);
          cursor: pointer;
        }

        .mobile-nav-links {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .mobile-nav-link {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          text-decoration: none;
          color: var(--text-dark);
          font-family: var(--font-serif);
          font-size: 1.5rem;
          transition: transform 0.3s;
        }

        .mobile-nav-link:hover {
          transform: translateX(10px);
          color: var(--primary);
        }

        .link-icon {
          color: var(--primary);
          opacity: 0.7;
        }

        .mobile-menu-footer {
          margin-top: auto;
          text-align: center;
          font-size: 0.8rem;
          color: var(--text-light);
          font-family: var(--font-sans);
        }

        @media (max-width: 768px) {
          .nav-desktop { display: none; }
          .hamburger { display: flex; }
        }
      `}</style>
    </>
  );
};
