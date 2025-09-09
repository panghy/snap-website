import React, { useEffect, useRef, useState } from 'react';
import './ProblemSection.css';

interface Connection {
  from: number;
  to: number;
  protocol: 'HTTP' | 'gRPC' | 'MQ' | 'S3' | 'SQL';
  status: 'pending' | 'success' | 'failed';
  label?: string;
}

const ProblemSection: React.FC = () => {
  const observerRef = useRef<IntersectionObserver | undefined>(undefined);
  const sectionRef = useRef<HTMLElement>(null);
  const animationRef = useRef<HTMLDivElement>(null);
  const [animationStep, setAnimationStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [backgroundError, setBackgroundError] = useState(false);
  const [subtitle, setSubtitle] = useState('Customer clicks "Buy Now" → Frontend sends order request...');
  const [prevSubtitle, setPrevSubtitle] = useState('');
  const [subtitleKey, setSubtitleKey] = useState(0);

  useEffect(() => {
    const elements = document.querySelectorAll('.problem-card, .problem-title, .problem-intro');
    
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

  // Separate observer for animation that requires full visibility
  useEffect(() => {
    if (!animationRef.current) return;

    const animationObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.95 && !hasStarted) {
            // Start with step 0 showing (HTTP active) but not playing yet
            setAnimationStep(0);
            setIsPlaying(true);
            setHasStarted(true);
          }
        });
      },
      { threshold: 0.95 }
    );

    animationObserver.observe(animationRef.current);

    return () => animationObserver.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!isPlaying || isPaused) return;
    
    const interval = setInterval(() => {
      setAnimationStep((prev) => {
        if (prev >= 10) {
          setIsPlaying(false);
          setIsPaused(false);
          return 10; // Keep at final step instead of resetting to 0
        }
        return prev + 1;
      });
    }, 2500);
    
    return () => clearInterval(interval);
  }, [isPlaying, isPaused]);

  useEffect(() => {
    // Update subtitle based on animation step
    const subtitles = [
      'Customer clicks "Buy Now" → Frontend sends order request...',
      'API Gateway forwards to Order Service...',
      'Order Service creates order in database ✓',
      'Payment Service processes credit card...',
      'Payment authorized successfully ✓',
      'Trying to reserve inventory items...',
      'Inventory Service TIMEOUT! Connection failed ✗',
      'Order confirmed but items not reserved! ⚠️',
      'Publishing order event to message queue...',
      'Message Queue is DOWN! Connection refused ✗',
      'Customer charged, no items, no notification! 💥'
    ];
    const newSubtitle = subtitles[animationStep] || subtitles[0];
    if (newSubtitle !== subtitle) {
      setPrevSubtitle(subtitle);
      setSubtitle(newSubtitle);
      setSubtitleKey(prev => prev + 1);
    }
    
    // Set background error state
    setBackgroundError(animationStep >= 7);
  }, [animationStep]);

  const handleReplay = () => {
    setAnimationStep(0);
    setIsPlaying(true);
    setIsPaused(false);
    setHasStarted(true);
    setBackgroundError(false);
  };

  const handlePausePlay = () => {
    if (animationStep >= 10) {
      // If at the end, replay
      handleReplay();
    } else if (isPaused) {
      // Resume
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      // Pause
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const problems = [
    {
      icon: '🔥',
      title: 'Partial Failures Everywhere',
      description: 'REST/gRPC endpoints fail independently, leaving your system in inconsistent states',
      animation: 'shake'
    },
    {
      icon: '🎭',
      title: 'Eventual Consistency Theater',
      description: 'Message queues process out of order, duplicate work, or simply lose messages',
      animation: 'pulse'
    },
    {
      icon: '🕸️',
      title: 'Distributed Transaction Hell',
      description: 'Saga patterns, compensating transactions, and distributed locks that still don\'t guarantee consistency',
      animation: 'rotate'
    },
    {
      icon: '🔍',
      title: 'Debugging Nightmares',
      description: 'A single operation spans dozens of services and thousands of log entries',
      animation: 'fade'
    },
    {
      icon: '⚡',
      title: 'Race Conditions',
      description: 'Problems that only appear under load, in production, always at 3 AM',
      animation: 'bounce'
    },
    {
      icon: '💔',
      title: 'Normalized Failure',
      description: 'We\'ve accepted that "distributed" means "eventually consistent" means "sometimes broken"',
      animation: 'shake'
    }
  ];

  const services = [
    { name: 'BROWSER', x: 100, y: 150, width: 80, height: 35, tier: 'client' },
    { name: 'API GATEWAY', x: 250, y: 150, width: 95, height: 35, tier: 'gateway' },
    { name: 'ORDER SERVICE', x: 450, y: 150, width: 105, height: 35, tier: 'service' },
    { name: 'ORDER DB', x: 650, y: 80, width: 80, height: 35, tier: 'data' },
    { name: 'PAYMENT SVC', x: 450, y: 50, width: 100, height: 35, tier: 'service' },
    { name: 'INVENTORY SVC', x: 450, y: 250, width: 105, height: 35, tier: 'service' },
    { name: 'MESSAGE QUEUE', x: 650, y: 230, width: 110, height: 35, tier: 'data' },
    { name: 'EMAIL SERVICE', x: 800, y: 150, width: 100, height: 35, tier: 'external' },
    { name: 'SMS SERVICE', x: 800, y: 250, width: 95, height: 35, tier: 'external' }
  ];

  const connections: Connection[] = [
    { from: 0, to: 1, protocol: 'HTTP', status: 'pending', label: 'POST /order' },
    { from: 1, to: 2, protocol: 'gRPC', status: 'pending', label: 'CreateOrder' },
    { from: 2, to: 3, protocol: 'SQL', status: 'pending', label: 'INSERT order' },
    { from: 2, to: 4, protocol: 'gRPC', status: 'pending', label: 'Process $99' },
    { from: 4, to: 3, protocol: 'SQL', status: 'pending', label: 'UPDATE payment' },
    { from: 2, to: 5, protocol: 'gRPC', status: 'pending', label: 'Reserve items' },
    { from: 5, to: 3, protocol: 'SQL', status: 'pending', label: 'UPDATE stock' },
    { from: 2, to: 6, protocol: 'MQ', status: 'pending', label: 'Publish event' },
    { from: 6, to: 7, protocol: 'MQ', status: 'pending', label: 'Send email' },
    { from: 6, to: 8, protocol: 'MQ', status: 'pending', label: 'Send SMS' }
  ];

  const getConnectionStatus = (connIndex: number): 'pending' | 'success' | 'failed' | 'active' => {
    // Step 0: Customer clicks buy + Frontend sends request (HTTP active)
    if (animationStep === 0 && connIndex === 0) return 'active';
    // Step 1: API Gateway to Order Service
    if (animationStep === 1 && connIndex === 1) return 'active';
    // Step 2: Create order in DB
    if (animationStep === 2 && connIndex === 2) return 'active';
    // Step 3: Process payment
    if (animationStep === 3 && connIndex === 3) return 'active';
    // Step 4: Payment success, update DB
    if (animationStep === 4 && connIndex === 4) return 'active';
    // Step 5: Try to update inventory
    if (animationStep === 5 && connIndex === 5) return 'active';
    // Step 6: Inventory service fails!
    if (animationStep === 6 && connIndex === 5) return 'failed';
    if (animationStep === 6 && connIndex === 6) return 'failed';
    // Step 7: Order still marked as confirmed despite inventory failure
    if (animationStep === 7 && connIndex === 2) return 'success';
    // Step 8: Try to publish to MQ
    if (animationStep === 8 && connIndex === 7) return 'active';
    // Step 9: MQ is down!
    if (animationStep === 9 && connIndex === 7) return 'failed';
    // Step 10: Can't reach email/SMS services
    if (animationStep === 10) {
      if (connIndex === 8 || connIndex === 9) return 'failed';
    }
    
    // Persistent states
    if (animationStep > 0 && connIndex === 0) return 'success';
    if (animationStep > 1 && connIndex === 1) return 'success';
    if (animationStep > 2 && connIndex === 2) return 'success';
    if (animationStep > 3 && connIndex === 3) return 'success';
    if (animationStep > 4 && connIndex === 4) return 'success';
    if (animationStep > 6 && connIndex === 5) return 'failed';
    if (animationStep > 6 && connIndex === 6) return 'failed';
    if (animationStep > 9) {
      if (connIndex === 7) return 'failed';
      if (connIndex === 8 || connIndex === 9) return 'failed';
    }
    
    return 'pending';
  };

  const getProtocolColor = (protocol: string) => {
    switch(protocol) {
      case 'HTTP': return '#a8b9ff';  // Soft blue
      case 'gRPC': return '#c9a7ff';  // Soft purple
      case 'MQ': return '#ffb3d9';     // Soft pink
      case 'S3': return '#b3e5ff';     // Soft cyan
      case 'SQL': return '#d4b3ff';    // Soft lavender
      default: return '#b8c4ff';      // Default soft periwinkle
    }
  };

  const getTierColors = (tier: string) => {
    switch(tier) {
      case 'client':
        return { fill: 'rgba(240, 147, 251, 1)', stroke: '#f093fb' }; // Pink - matches hero
      case 'gateway':
        return { fill: 'rgba(102, 126, 234, 1)', stroke: '#667eea' }; // Blue-purple
      case 'service':
        return { fill: 'rgba(118, 75, 162, 1)', stroke: '#764ba2' };  // Deep purple
      case 'data':
        return { fill: 'rgba(156, 39, 176, 1)', stroke: '#9C27B0' };  // Darker purple
      case 'external':
        return { fill: 'rgba(103, 58, 183, 1)', stroke: '#673AB7' };  // Indigo-purple
      default:
        return { fill: 'rgba(118, 75, 162, 1)', stroke: '#764ba2' };
    }
  };

  return (
    <section ref={sectionRef} className="problem-section">
      <div className="problem-container">
        <h2 className="problem-title">
          <span className="problem-title-main">The Problem with Modern Architecture</span>
          <span className="problem-subtitle">We've Built a House of Cards</span>
        </h2>
        
        <p className="problem-intro">
          Today's microservices architecture has become a Rube Goldberg machine of complexity.
          We've normalized failure and accepted inconsistency as the price of scale.
        </p>

        <div ref={animationRef} className={`complexity-visualization ${backgroundError ? 'error-state' : ''}`}>
          <svg className="complexity-svg" viewBox="0 0 900 350">
            <defs>
              <linearGradient id="errorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e74c3c" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#c0392b" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="shimmerGradient">
                <stop offset="0%" stopColor="white" stopOpacity="0" />
                <stop offset="40%" stopColor="white" stopOpacity="0.9" />
                <stop offset="60%" stopColor="white" stopOpacity="0.9" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            
            {/* Animated background grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(102, 126, 234, 0.05)" strokeWidth="1">
                  <animate attributeName="stroke-opacity" values="0.05;0.1;0.05" dur="4s" repeatCount="indefinite" />
                </path>
              </pattern>
            </defs>
            <rect width="900" height="350" fill="url(#grid)" />
            
            {/* Connections with protocol labels - drawn first so they appear behind nodes */}
            {connections.map((conn, i) => {
              const from = services[conn.from];
              const to = services[conn.to];
              const status = getConnectionStatus(i);
              const midX = (from.x + to.x) / 2;
              const midY = (from.y + to.y) / 2;
              const color = getProtocolColor(conn.protocol);
              
              const pathData = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
              
              return (
                <g key={i}>
                  <path
                    d={pathData}
                    stroke={status === 'failed' ? '#ff9999' : 
                           status === 'success' ? '#99ccaa' :
                           color}
                    strokeWidth={status === 'active' ? '3' : '2'}
                    fill="none"
                    className={`connection-path ${status === 'active' ? 'shimmer-line' : ''}`}
                    opacity={status === 'pending' ? 0.1 : 
                            status === 'active' ? 0.6 : 
                            status === 'success' ? 0.4 : 
                            status === 'failed' ? 0.8 : 0.1}
                  />
                  
                  {/* Base glow effect - always rendered but opacity controlled */}
                  <path
                    d={pathData}
                    stroke={color}
                    strokeWidth="4"
                    fill="none"
                    className="connection-glow"
                    opacity={status === 'active' ? 0.3 : 0}
                    filter="url(#glow)"
                  />
                  
                  {/* Shimmering overlay - always rendered but opacity controlled */}
                  <path
                    d={pathData}
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="15 10"
                    className="shimmer-overlay"
                    opacity={status === 'active' ? 0.6 : 0}
                  >
                    <animate 
                      attributeName="stroke-dashoffset" 
                      from="0" 
                      to="-25" 
                      dur="0.8s" 
                      repeatCount="indefinite" 
                    />
                  </path>
                  
                  {/* Protocol label */}
                  <rect
                    x={midX - 15}
                    y={midY - 7}
                    width="30"
                    height="14"
                    fill='rgba(0, 0, 0, 0.6)'
                    rx="7"
                    opacity={status === 'pending' ? 0.2 : 0.6}
                  />
                  <text
                    x={midX}
                    y={midY + 3}
                    textAnchor="middle"
                    className="protocol-label"
                    fill="white"
                    opacity={status === 'pending' ? 0.5 : 1}
                  >
                    {conn.protocol}
                  </text>
                  
                  {/* Connection label */}
                  {conn.label && status === 'active' && (
                    <text
                      x={midX}
                      y={midY - 15}
                      textAnchor="middle"
                      className="connection-label"
                      fill={color}
                    >
                      {conn.label}
                    </text>
                  )}
                  
                </g>
              );
            })}
            
            {/* Service nodes - drawn after connections so they appear on top */}
            {services.map((service, i) => {
              const colors = getTierColors(service.tier);
              return (
                <g key={i}>
                  <rect
                    x={service.x - (service.width || 45) / 2}
                    y={service.y - (service.height || 30) / 2}
                    width={service.width || 90}
                    height={service.height || 30}
                    fill={colors.fill}
                    stroke={colors.stroke}
                    strokeWidth="1.5"
                    rx="8"
                  />
                  <text x={service.x} y={service.y + 3} textAnchor="middle" className="service-label-small">
                    {service.name}
                  </text>
                </g>
              );
            })}
            
          </svg>
          
          {/* Controls bar with subtitle and button */}
          <div style={{ position: 'absolute', bottom: '15px', left: '15px', right: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              className="replay-button" 
              onClick={animationStep >= 10 ? handleReplay : handlePausePlay} 
              aria-label={animationStep >= 10 ? 'Replay' : (isPaused ? 'Play' : 'Pause')} 
              style={{ position: 'static' }}
            >
              {animationStep >= 10 ? '↻' : (isPaused ? '▶' : '⏸')}
            </button>
            <div style={{ flex: 1, background: 'rgba(40,40,40,0.4)', borderRadius: '15px', padding: '8px 15px', overflow: 'hidden', position: 'relative', height: '30px' }}>
              {/* Previous subtitle fading out and up */}
              {prevSubtitle && (
                <div key={`prev-${subtitleKey}`} className="subtitle-text subtitle-exit" style={{ margin: 0, padding: 0, position: 'absolute', left: '15px', right: '15px' }}>
                  {prevSubtitle}
                </div>
              )}
              {/* Current subtitle fading in from below */}
              <div key={`curr-${subtitleKey}`} className="subtitle-text subtitle-enter" style={{ margin: 0, padding: 0, position: 'absolute', left: '15px', right: '15px' }}>
                {subtitle}
              </div>
            </div>
          </div>
        </div>

        <div className="problems-grid">
          {problems.map((problem, index) => (
            <div key={index} className={`problem-card ${problem.animation}`} style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="problem-icon">{problem.icon}</div>
              <h3>{problem.title}</h3>
              <p>{problem.description}</p>
              <div className="problem-glitch"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;