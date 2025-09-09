import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
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
              <li><a href="#browse">Browse SNAPs</a></li>
              <li><a href="#contribute">Contribute</a></li>
              <li><a href="https://www.foundationdb.org" target="_blank" rel="noopener noreferrer">FoundationDB</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Community</h4>
            <ul className="footer-links">
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a></li>
              <li><a href="https://discord.gg/acfgTbdErv" target="_blank" rel="noopener noreferrer">Discord</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Languages</h4>
            <ul className="footer-links">
              <li><a href="#java">Java</a></li>
              <li><a href="#python">Python</a></li>
              <li><a href="#go">Go</a></li>
              <li><a href="#rust">Rust</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-legal">
            <p>FoundationDB is a registered trademark of Apple Inc.</p>
            <p>Edit this page by filing a PR on <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>.</p>
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
