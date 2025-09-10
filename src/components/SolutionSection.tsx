import React, { useEffect, useRef, useState } from 'react';
import './SolutionSection.css';

const SolutionSection: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const observerRef = useRef<IntersectionObserver | undefined>(undefined);

  useEffect(() => {
    const elements = document.querySelectorAll('.solution-card, .solution-title, .companies-grid');
    
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    elements.forEach(el => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  // Removed auto-rotation to prevent cards from disappearing

  const features = [
    {
      title: 'True ACID Transactions',
      description: 'Not eventual consistency. Real, multi-key transactions with serializable isolation.',
      icon: '🔒'
    },
    {
      title: 'Ordered Keys',
      description: 'Natural data locality and efficient range operations built into the core.',
      icon: '📊'
    },
    {
      title: 'Automatic Scaling',
      description: 'Sharding & rebalancing just works. No manual intervention required.',
      icon: '🚀'
    },
    {
      title: 'Battle-Tested',
      description: 'Powers Apple, Snowflake, VMware, Epic Games, and many others at planet scale.',
      icon: '⚔️'
    },
    {
      title: 'Deterministic Testing',
      description: 'Tested against millions of failure scenarios using simulation testing.',
      icon: '🧪'
    }
  ];

  const companies = [
    { name: 'Apple', usage: 'CloudKit & iCloud', scale: 'Billions of databases' },
    { name: 'Snowflake', usage: 'Metadata Layer', scale: 'Petabytes of data' },
    { name: 'VMware', usage: 'Wavefront', scale: '18M writes/second' },
    { name: 'Epic Games', usage: 'Gaming Infrastructure', scale: 'Global scale systems' },
    { name: 'And many others...', usage: 'Building the future', scale: 'Join the revolution', isOthers: true }
  ];

  return (
    <section className="solution-section">
      <div className="solution-container">
        <h2 className="solution-title">
          <span className="solution-title-main">Enter FoundationDB</span>
          <span className="solution-subtitle">The Planet-Scale I/O Layer</span>
        </h2>

        <p className="solution-intro">
          FoundationDB isn't just another database. It's a breakthrough in distributed systems—a transactional, 
          ordered key-value store that scales to planet-size while maintaining <strong>strict ACID guarantees</strong>.
        </p>

        <div className="features-showcase">
          <div className="features-visual">
            <div className="fdb-core">
              <img src="/foundationdb-icon.svg" alt="FoundationDB" className="fdb-logo" width="60" height="60" />
              <div className="pulse-ring"></div>
              <div className="pulse-ring delay-1"></div>
              <div className="pulse-ring delay-2"></div>
            </div>
            {features.map((feature, index) => (
              <div
                key={index}
                className={`feature-orbit feature-${index} ${activeFeature === index ? 'active' : ''}`}
              >
                <span className="feature-icon">{feature.icon}</span>
              </div>
            ))}
          </div>
          
          <div className="features-list">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`solution-card visible ${activeFeature === index ? 'active' : ''}`}
                onMouseEnter={() => setActiveFeature(index)}
                onMouseLeave={() => setActiveFeature(null)}
              >
                <div className="card-icon">{feature.icon}</div>
                <div className="card-content">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
                <div className="card-indicator"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="companies-section">
          <h3>Who's Already Building on This Foundation</h3>
          <div className="foundation-showcase">
            <div className="foundation-visualization">
              <svg className="foundation-svg" viewBox="0 0 450 320">
                <defs>
                  <linearGradient id="foundationGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#667eea" stopOpacity="0.2" />
                    <stop offset="50%" stopColor="#764ba2" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#f093fb" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                
                {/* Foundation base */}
                <rect x="75" y="220" width="300" height="75" fill="url(#foundationGradient)" rx="10" />
                <text x="225" y="250" textAnchor="middle" className="foundation-label">
                  FoundationDB
                </text>
                <text x="225" y="275" textAnchor="middle" className="foundation-sublabel">
                  Distributed • Ordered • Transactional
                </text>
                
                {/* Building blocks on top */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <rect
                    key={i}
                    x={90 + i * 58}
                    y={140}
                    width="54"
                    height="65"
                    fill="#667eea"
                    fillOpacity="0.3"
                    stroke="#667eea"
                    strokeWidth="1"
                    rx="5"
                    className="building-block"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </svg>
            </div>
            <div className="companies-grid">
              {companies.map((company, index) => (
                <div key={index} className={`company-card ${company.isOthers ? 'company-card-others' : ''}`} style={{ animationDelay: `${index * 0.1}s` }}>
                  <h4>{company.name}</h4>
                  <p className="company-usage">{company.usage}</p>
                  <p className="company-scale">{company.scale}</p>
                  <div className="company-glow"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;