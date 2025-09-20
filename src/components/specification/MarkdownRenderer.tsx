import React, { useMemo } from 'react';
import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { SpecificationDocument } from '../../types/specification';
import styles from './MarkdownRenderer.module.css';

interface MarkdownRendererProps {
  document: SpecificationDocument;
  onHeadingClick: (headingId: string) => void;
  currentHeadingId: string | null;
}

// Type definitions for ReactMarkdown component props
interface HeadingProps {
  children?: ReactNode;
  node?: any;
  [key: string]: any;
}

interface CodeProps {
  children?: ReactNode;
  inline?: boolean;
  className?: string;
  node?: any;
  [key: string]: any;
}

interface LinkProps {
  children?: ReactNode;
  href?: string;
  [key: string]: any;
}

interface ImageProps {
  src?: string;
  alt?: string;
  [key: string]: any;
}

interface GenericProps {
  children?: ReactNode;
  [key: string]: any;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  document,
  onHeadingClick,
  currentHeadingId,
}) => {
  // Custom syntax highlighter style for pseudocode
  const pseudocodeStyle = useMemo(() => ({
    ...oneLight,
    'pre[class*="language-"]': {
      ...oneLight['pre[class*="language-"]'],
      background: '#f8f9fa',
      border: '1px solid #e2e8f0',
      fontFamily: '"Fira Code", "JetBrains Mono", "SF Mono", Consolas, monospace',
    },
    'code[class*="language-"]': {
      ...oneLight['code[class*="language-"]'],
      fontFamily: '"Fira Code", "JetBrains Mono", "SF Mono", Consolas, monospace',
    },
  }), []);

  const components = useMemo(() => ({
    // Custom heading renderer with click handlers
    h1: ({ children, ...props }: HeadingProps) => {
      const headingText = typeof children === 'string' ? children : children?.toString() || '';
      const headingId = headingText.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      return (
        <h1
          {...props}
          id={headingId}
          className={`${styles.heading} ${styles.h1} ${
            currentHeadingId === headingId ? styles.active : ''
          }`}
          onClick={() => onHeadingClick(headingId)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onHeadingClick(headingId);
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`Navigate to ${headingText}`}
        >
          {children}
        </h1>
      );
    },

    h2: ({ children, ...props }: HeadingProps) => {
      const headingText = typeof children === 'string' ? children : children?.toString() || '';
      const headingId = headingText.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      return (
        <h2
          {...props}
          id={headingId}
          className={`${styles.heading} ${styles.h2} ${
            currentHeadingId === headingId ? styles.active : ''
          }`}
          onClick={() => onHeadingClick(headingId)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onHeadingClick(headingId);
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`Navigate to ${headingText}`}
        >
          {children}
        </h2>
      );
    },

    h3: ({ children, ...props }: HeadingProps) => {
      const headingText = typeof children === 'string' ? children : children?.toString() || '';
      const headingId = headingText.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      return (
        <h3
          {...props}
          id={headingId}
          className={`${styles.heading} ${styles.h3} ${
            currentHeadingId === headingId ? styles.active : ''
          }`}
          onClick={() => onHeadingClick(headingId)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onHeadingClick(headingId);
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`Navigate to ${headingText}`}
        >
          {children}
        </h3>
      );
    },

    h4: ({ children, ...props }: HeadingProps) => {
      const headingText = typeof children === 'string' ? children : children?.toString() || '';
      const headingId = headingText.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      return (
        <h4
          {...props}
          id={headingId}
          className={`${styles.heading} ${styles.h4} ${
            currentHeadingId === headingId ? styles.active : ''
          }`}
          onClick={() => onHeadingClick(headingId)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onHeadingClick(headingId);
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`Navigate to ${headingText}`}
        >
          {children}
        </h4>
      );
    },

    h5: ({ children, ...props }: HeadingProps) => {
      const headingText = typeof children === 'string' ? children : children?.toString() || '';
      const headingId = headingText.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      return (
        <h5
          {...props}
          id={headingId}
          className={`${styles.heading} ${styles.h5} ${
            currentHeadingId === headingId ? styles.active : ''
          }`}
          onClick={() => onHeadingClick(headingId)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onHeadingClick(headingId);
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`Navigate to ${headingText}`}
        >
          {children}
        </h5>
      );
    },

    h6: ({ children, ...props }: HeadingProps) => {
      const headingText = typeof children === 'string' ? children : children?.toString() || '';
      const headingId = headingText.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      return (
        <h6
          {...props}
          id={headingId}
          className={`${styles.heading} ${styles.h6} ${
            currentHeadingId === headingId ? styles.active : ''
          }`}
          onClick={() => onHeadingClick(headingId)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onHeadingClick(headingId);
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`Navigate to ${headingText}`}
        >
          {children}
        </h6>
      );
    },

    // Custom code block renderer with syntax highlighting
    code: ({ inline, className, children, ...props }: CodeProps) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';

      if (!inline && language) {
        return (
          <div className={styles.codeBlock}>
            <div className={styles.codeHeader}>
              <span className={styles.codeLanguage}>{language}</span>
            </div>
            <SyntaxHighlighter
              style={language === 'pseudocode' ? pseudocodeStyle : oneLight}
              language={language === 'pseudocode' ? 'text' : language}
              PreTag="div"
              className={`language-${language}`}
              customStyle={{
                margin: 0,
                borderRadius: '0 0 8px 8px',
                fontSize: '0.9rem',
                lineHeight: '1.5',
              }}
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          </div>
        );
      }

      return (
        <code className={styles.inlineCode} {...props}>
          {children}
        </code>
      );
    },

    // Custom table renderer
    table: ({ children, ...props }: GenericProps) => (
      <div className={styles.tableContainer}>
        <table className={styles.table} {...props}>
          {children}
        </table>
      </div>
    ),

    // Custom blockquote renderer
    blockquote: ({ children, ...props }: GenericProps) => (
      <blockquote className={styles.blockquote} {...props}>
        {children}
      </blockquote>
    ),

    // Custom link renderer
    a: ({ children, href, ...props }: LinkProps) => {
      const isExternal = href && (href.startsWith('http') || href.startsWith('mailto:'));
      const isHash = href && href.startsWith('#');

      const handleClick = (e: React.MouseEvent) => {
        if (isHash) {
          e.preventDefault();
          // Update the URL hash
          window.location.hash = href;
          // Trigger hashchange event
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        }
      };

      return (
        <a
          className={styles.link}
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          onClick={isHash ? handleClick : undefined}
          {...props}
        >
          {children}
          {isExternal && (
            <span className={styles.externalIcon} aria-label="Opens in new tab">
              ↗
            </span>
          )}
        </a>
      );
    },

    // Custom image renderer
    img: ({ src, alt, ...props }: ImageProps) => (
      <div className={styles.imageContainer}>
        <img
          className={styles.image}
          src={src}
          alt={alt}
          loading="lazy"
          {...props}
        />
        {alt && <figcaption className={styles.imageCaption}>{alt}</figcaption>}
      </div>
    ),

    // Custom horizontal rule renderer
    hr: ({ ...props }: GenericProps) => (
      <hr className={styles.hr} role="separator" {...props} />
    ),

    // Custom list renderers
    ul: ({ children, ...props }: GenericProps) => (
      <ul className={styles.unorderedList} {...props}>
        {children}
      </ul>
    ),

    ol: ({ children, ...props }: GenericProps) => (
      <ol className={styles.orderedList} {...props}>
        {children}
      </ol>
    ),

    li: ({ children, ...props }: GenericProps) => (
      <li className={styles.listItem} {...props}>
        {children}
      </li>
    ),

    // Custom paragraph renderer
    p: ({ children, ...props }: GenericProps) => (
      <p className={styles.paragraph} {...props}>
        {children}
      </p>
    ),
  }), [currentHeadingId, onHeadingClick, pseudocodeStyle]);

  if (!document.content) {
    return (
      <div data-testid="markdown-content" className={`${styles.markdownContent} ${styles.empty}`}>
        <p className={styles.emptyMessage}>No content available for this document.</p>
      </div>
    );
  }

  return (
    <article
      data-testid="markdown-content"
      className={styles.markdownContent}
      role="main"
      aria-label={`Content for ${document.title}`}
    >
      <div className={styles.content}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={components}
          skipHtml={false}
        >
          {document.content}
        </ReactMarkdown>
      </div>
    </article>
  );
};