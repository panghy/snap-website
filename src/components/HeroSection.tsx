import React, { useEffect, useRef } from 'react';
import './HeroSection.css';

const HeroSection: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      type: 'snap' | 'connection' | 'data';
      color: string;
      pulsePhase: number;
      connections: Node[];
      label?: string;

      constructor(x: number, y: number, type: 'snap' | 'connection' | 'data', label?: string) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.type = type;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.connections = [];
        this.label = label;
        
        if (type === 'snap') {
          this.radius = 8;
          this.color = '#667eea';
        } else if (type === 'connection') {
          this.radius = 4;
          this.color = '#764ba2';
        } else {
          this.radius = 2;
          this.color = '#f093fb';
        }
      }

      update(width: number, height: number) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < this.radius || this.x > width - this.radius) {
          this.vx *= -1;
        }
        if (this.y < this.radius || this.y > height - this.radius) {
          this.vy *= -1;
        }

        this.x = Math.max(this.radius, Math.min(width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(height - this.radius, this.y));
      }

      draw(ctx: CanvasRenderingContext2D, time: number) {
        const pulseFactor = 1 + Math.sin(time * 0.002 + this.pulsePhase) * 0.2;
        const actualRadius = this.radius * pulseFactor;

        ctx.beginPath();
        ctx.arc(this.x, this.y, actualRadius, 0, Math.PI * 2);
        
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, actualRadius);
        gradient.addColorStop(0, this.color + 'ff');
        gradient.addColorStop(0.5, this.color + '88');
        gradient.addColorStop(1, this.color + '00');
        
        ctx.fillStyle = gradient;
        ctx.fill();

        if (this.type === 'snap') {
          ctx.strokeStyle = this.color + '44';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          if (this.label) {
            ctx.font = '11px Inter, system-ui, sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.textAlign = 'center';
            ctx.fillText(this.label, this.x, this.y - actualRadius - 8);
          }
        }
      }
    }

    class Transaction {
      startNode: Node;
      endNode: Node;
      progress: number;
      speed: number;
      particles: Array<{x: number, y: number, age: number}>;

      constructor(start: Node, end: Node) {
        this.startNode = start;
        this.endNode = end;
        this.progress = 0;
        this.speed = 0.5 + Math.random() * 1.5;
        this.particles = [];
      }

      update() {
        this.progress += this.speed;
        
        if (this.progress % 10 < this.speed) {
          const t = (this.progress % 100) / 100;
          const x = this.startNode.x + (this.endNode.x - this.startNode.x) * t;
          const y = this.startNode.y + (this.endNode.y - this.startNode.y) * t;
          this.particles.push({ x, y, age: 0 });
        }

        this.particles = this.particles.filter(p => {
          p.age++;
          return p.age < 30;
        });

        if (this.progress > 100) {
          this.progress = 0;
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        const t = this.progress / 100;
        const x = this.startNode.x + (this.endNode.x - this.startNode.x) * t;
        const y = this.startNode.y + (this.endNode.y - this.startNode.y) * t;

        ctx.beginPath();
        ctx.moveTo(this.startNode.x, this.startNode.y);
        ctx.lineTo(this.endNode.x, this.endNode.y);
        
        const gradient = ctx.createLinearGradient(
          this.startNode.x, this.startNode.y,
          this.endNode.x, this.endNode.y
        );
        gradient.addColorStop(0, '#667eea11');
        gradient.addColorStop(0.5, '#764ba222');
        gradient.addColorStop(1, '#f093fb11');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1;
        ctx.stroke();

        this.particles.forEach(p => {
          const opacity = 1 - (p.age / 30);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(118, 75, 162, ${opacity})`;
          ctx.fill();
        });

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        
        const particleGradient = ctx.createRadialGradient(x, y, 0, x, y, 4);
        particleGradient.addColorStop(0, '#ffffffff');
        particleGradient.addColorStop(0.5, '#f093fb88');
        particleGradient.addColorStop(1, '#f093fb00');
        
        ctx.fillStyle = particleGradient;
        ctx.fill();
      }
    }

    const nodes: Node[] = [];
    const transactions: Transaction[] = [];

    const snapLabels = ['BlobStore', 'MessageQueue', 'PubSub', 'VectorSearchIndex', 'IdAssignment', 'RecordLayer'];
    for (let i = 0; i < snapLabels.length; i++) {
      nodes.push(new Node(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        'snap',
        snapLabels[i]
      ));
    }

    for (let i = 0; i < 10; i++) {
      nodes.push(new Node(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        'connection'
      ));
    }

    for (let i = 0; i < 20; i++) {
      nodes.push(new Node(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        'data'
      ));
    }

    const snapNodes = nodes.filter(n => n.type === 'snap');
    snapNodes.forEach((snap, i) => {
      const nextSnap = snapNodes[(i + 1) % snapNodes.length];
      transactions.push(new Transaction(snap, nextSnap));
      
      const connectionNode = nodes.find(n => n.type === 'connection');
      if (connectionNode && Math.random() > 0.5) {
        transactions.push(new Transaction(snap, connectionNode));
      }
    });

    let time = 0;

    const animate = () => {
      ctx.fillStyle = 'rgba(10, 10, 10, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      nodes.forEach(node => {
        node.update(canvas.width, canvas.height);
      });

      nodes.forEach((node, i) => {
        nodes.slice(i + 1).forEach(otherNode => {
          const dx = node.x - otherNode.x;
          const dy = node.y - otherNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            const opacity = (1 - distance / 150) * 0.2;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(otherNode.x, otherNode.y);
            ctx.strokeStyle = `rgba(102, 126, 234, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      transactions.forEach(transaction => {
        transaction.update();
        transaction.draw(ctx);
      });

      nodes.forEach(node => {
        node.draw(ctx, time);
      });

      time++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <section className="hero-section">
      <canvas ref={canvasRef} className="hero-canvas" />
      <div className="hero-content">
        <h1 className="hero-title">
          <span className="hero-title-line">Composable Building Blocks</span>
          <span className="hero-title-line gradient">for FoundationDB</span>
        </h1>
        <p className="hero-subtitle">
          SNAPs are the missing link between FoundationDB's raw power and production applications.
          <br />
          Pre-built, composable, atomic components that snap together in a single transaction.
        </p>
        <div className="hero-cta">
          <button className="cta-button primary">
            <span>Explore SNAPs</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
          <a href="https://www.foundationdb.org/" target="_blank" rel="noopener noreferrer" className="cta-button secondary">
            <span>Learn FoundationDB</span>
          </a>
        </div>
        <div className="hero-stats">
          <div className="stat">
            <div className="stat-number">100%</div>
            <div className="stat-label">Atomic Transactions</div>
          </div>
          <div className="stat">
            <div className="stat-number">∞</div>
            <div className="stat-label">Composability</div>
          </div>
          <div className="stat">
            <div className="stat-number">1</div>
            <div className="stat-label">Transaction to Rule Them All</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;