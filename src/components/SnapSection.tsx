import React, { useEffect, useRef, useState } from 'react';
import './SnapSection.css';

const SnapSection: React.FC = () => {
  const [currentLine, setCurrentLine] = useState(0);
  const observerRef = useRef<IntersectionObserver | undefined>(undefined);
  const codeLines = useRef<NodeListOf<HTMLElement> | undefined>(undefined);

  useEffect(() => {
    const elements = document.querySelectorAll('.snap-title, .snap-principle, .code-example');
    
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

  useEffect(() => {
    codeLines.current = document.querySelectorAll('.code-line');
    const interval = setInterval(() => {
      setCurrentLine((prev) => (prev + 1) % 10);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    codeLines.current?.forEach((line, index) => {
      if (index === currentLine) {
        line.classList.add('highlight');
      } else {
        line.classList.remove('highlight');
      }
    });
  }, [currentLine]);

  const principles = [
    {
      icon: '📁',
      title: 'Directories, Not Keys',
      description: 'SNAPs work with FoundationDB\'s Directory layer, never touching raw keys directly.',
      color: '#667eea'
    },
    {
      icon: '📦',
      title: 'Minimal Dependencies',
      description: 'Only essential APIs - logging, telemetry, serialization. No framework lock-in.',
      color: '#764ba2'
    },
    {
      icon: '🔗',
      title: 'Transaction Composability',
      description: 'Combine multiple SNAPs in a single atomic transaction. Implementations may choose to implement batch-and-swap operations to respect the 5s rule.',
      color: '#f093fb'
    },
    {
      icon: '🌍',
      title: 'Concurrent-Access by Design',
      description: 'Multiple instances and versions are expected to access their subspace simultaneously.',
      color: '#667eea'
    },
    {
      icon: '🛠️',
      title: 'Language-Native',
      description: 'Implementations are idiomatic to each language. Java feels like Java, Rust feels like Rust.',
      color: '#764ba2'
    },
    {
      icon: '📋',
      title: 'Well-Defined Spec',
      description: 'Each SNAP provides its own specification, enabling developers to create compatible implementations in any language.',
      color: '#f093fb'
    }
  ];

  return (
    <section className="snap-section">
      <div className="snap-container">
        <h2 className="snap-title">
          <span className="snap-title-main">What are SNAPs?</span>
          <span className="snap-subtitle">Composable Building Blocks That Snap Together</span>
        </h2>

        <div className="snap-demo">
          <div className="code-example">
            <div className="code-header">
              <span className="code-file">UserSignup.java</span>
              <div className="code-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <pre className="code-content">
              <code>
                <span className="code-line" data-line="1">
                  <span className="comment">// One transaction, multiple SNAPs, complete atomicity</span>
                </span>
                <span className="code-line" data-line="2">
                  <span className="keyword">db</span>.<span className="method">run</span>(<span className="param">tx</span> <span className="arrow">{`=>`}</span> {`{`}
                </span>
                <span className="code-line" data-line="3">
                  {'    '}<span className="comment">// Create a user account</span>
                </span>
                <span className="code-line" data-line="4">
                  {'    '}<span className="type">User</span> user = <span className="object">userSnap</span>.<span className="method">create</span>(tx, userData);
                </span>
                <span className="code-line" data-line="5">
                  {'    '}<span className="comment">// Store their profile image</span>
                </span>
                <span className="code-line" data-line="6">
                  {'    '}<span className="object">blobSnap</span>.<span className="method">store</span>(tx, user.id, profileImage);
                </span>
                <span className="code-line" data-line="7">
                  {'    '}<span className="comment">// Queue welcome email</span>
                </span>
                <span className="code-line" data-line="8">
                  {'    '}<span className="object">queueSnap</span>.<span className="method">enqueue</span>(tx, <span className="keyword">new</span> <span className="type">WelcomeEmail</span>(user));
                </span>
                <span className="code-line" data-line="9">
                  {'    '}<span className="comment">// Index for search</span>
                </span>
                <span className="code-line" data-line="10">
                  {'    '}<span className="object">searchSnap</span>.<span className="method">index</span>(tx, user);
                </span>
                <span className="code-line" data-line="11">
                  {'    '}<span className="keyword">return</span> user;
                </span>
                <span className="code-line" data-line="12">
                  {`}`});
                </span>
              </code>
            </pre>
            <div className="code-footer">
              <span className="execution-status">
                ✅ Either ALL of this succeeds, or NONE of it does
              </span>
            </div>
          </div>

          <div className="transaction-flow">
            <div className="flow-title">Transaction Flow</div>
            <div className="flow-visualization">
              <div className="transaction-box">
                <div className="transaction-label">BEGIN TRANSACTION</div>
                <div className="snap-operations">
                  <div className={`snap-op ${currentLine >= 3 && currentLine <= 4 ? 'active' : ''}`}>
                    <span className="op-icon">👤</span>
                    <span className="op-name">UserSnap</span>
                  </div>
                  <div className={`snap-op ${currentLine >= 5 && currentLine <= 6 ? 'active' : ''}`}>
                    <span className="op-icon">🖼️</span>
                    <span className="op-name">BlobSnap</span>
                  </div>
                  <div className={`snap-op ${currentLine >= 7 && currentLine <= 8 ? 'active' : ''}`}>
                    <span className="op-icon">📧</span>
                    <span className="op-name">QueueSnap</span>
                  </div>
                  <div className={`snap-op ${currentLine >= 9 && currentLine <= 10 ? 'active' : ''}`}>
                    <span className="op-icon">🔍</span>
                    <span className="op-name">SearchSnap</span>
                  </div>
                </div>
                <div className="transaction-label">COMMIT - ALL OR NOTHING</div>
              </div>
            </div>
          </div>
        </div>

        <div className="principles-grid">
          <h3>The SNAPs Specification</h3>
          <p className="spec-intro">
            SNAPs are similar to FoundationDB "layers" but adhere to a stricter specification. 
            While any code built on FoundationDB can be called a layer, SNAPs follow specific 
            standards for directory usage, transaction handling, and API design to ensure 
            true composability across different implementations and languages.
          </p>
          <div className="principles-list">
            {principles.map((principle, index) => (
              <div 
                key={index} 
                className="snap-principle"
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  borderColor: principle.color + '33'
                }}
              >
                <div className="principle-icon" style={{ color: principle.color }}>
                  {principle.icon}
                </div>
                <div className="principle-content">
                  <h4>{principle.title}</h4>
                  <p>{principle.description}</p>
                </div>
                <div className="principle-glow" style={{ background: principle.color + '11' }}></div>
              </div>
            ))}
          </div>
        </div>

        <div className="snap-benefits">
          <div className="benefit">
            <div className="benefit-icon">🚫</div>
            <h4>No Partial States</h4>
            <p>Transactions are atomic across all SNAPs</p>
          </div>
          <div className="benefit">
            <div className="benefit-icon">🧹</div>
            <h4>No Cleanup Code</h4>
            <p>Failed transactions leave no trace</p>
          </div>
          <div className="benefit">
            <div className="benefit-icon">🎭</div>
            <h4>No Saga Patterns</h4>
            <p>Simple, linear code that just works</p>
          </div>
          <div className="benefit">
            <div className="benefit-icon">🔍</div>
            <h4>No Complex Debugging</h4>
            <p>One transaction, one outcome</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SnapSection;