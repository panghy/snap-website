import React from 'react';
import './Footer.css';

interface FooterProps {
  onNavigate?: (page: 'catalogue', filter?: { language?: string }) => void;
  isLightTheme?: boolean;
}

const Footer: React.FC<FooterProps> = ({ onNavigate, isLightTheme }) => {
  return (
    <footer className={`footer ${isLightTheme ? 'footer-light' : ''}`}>
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">SNAPs</h3>
            <p className="footer-description">
              Subspace-Native Atomic Pieces - The missing link between FoundationDB's raw power and production applications.
            </p>
          </div>
          
          <div className="footer-section">
            <h4>Resources</h4>
            <ul className="footer-links">
              <li><a href="#docs">Documentation</a></li>
              <li>
                <a
                  href="#browse"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate?.('catalogue');
                  }}
                >
                  Browse SNAPs
                </a>
              </li>
              <li><a href="https://github.com/panghy/snap-website" target="_blank" rel="noopener noreferrer">Contribute</a></li>
              <li><a href="https://www.foundationdb.org" target="_blank" rel="noopener noreferrer">FoundationDB</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Community</h4>
            <ul className="footer-links">
              <li><a href="https://github.com/panghy/snap-website" target="_blank" rel="noopener noreferrer">GitHub</a></li>
              <li><a href="https://discord.gg/acfgTbdErv" target="_blank" rel="noopener noreferrer">Discord</a></li>
            </ul>
          </div>

          {!isLightTheme && (
            <div className="footer-section">
              <h4>Languages</h4>
              <ul className="footer-links">
                <li>
                  <a
                    href="#java"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate?.('catalogue', { language: 'Java' });
                    }}
                  >
                    Java
                  </a>
                </li>
                <li>
                  <a
                    href="#python"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate?.('catalogue', { language: 'Python' });
                    }}
                  >
                    Python
                  </a>
                </li>
                <li>
                  <a
                    href="#go"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate?.('catalogue', { language: 'Go' });
                    }}
                  >
                    Go
                  </a>
                </li>
                <li>
                  <a
                    href="#rust"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate?.('catalogue', { language: 'Rust' });
                    }}
                  >
                    Rust
                  </a>
                </li>
              </ul>
            </div>
          )}
        </div>
        
        <div className="footer-bottom">
          <div className="footer-legal">
            <p>FoundationDB is a registered trademark of Apple Inc.</p>
            <p>Edit this page by filing a PR on <a href="https://github.com/panghy/snap-website" target="_blank" rel="noopener noreferrer">GitHub</a>.</p>
          </div>
          <div className="footer-copyright">
            <p>&copy; 2025 SNAPs Project. Built with FoundationDB.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
