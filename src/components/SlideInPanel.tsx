import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

interface SlideInPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const SlideInPanel: React.FC<SlideInPanelProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children
}) => {
  return (
    <>
      {isOpen && (
        <div style={styles.overlay} onClick={onClose}>
          <div 
            style={styles.panel}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.header}>
              <div style={styles.headerContent}>
                <h3 style={styles.title}>{title}</h3>
                {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
              </div>
              <button style={styles.closeButton} onClick={onClose}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div style={styles.content}>
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'flex-end',
    animation: 'fadeIn 0.3s ease'
  },
  panel: {
    width: '400px',
    height: '100vh',
    backgroundColor: 'var(--bg-card)',
    boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column' as const,
    animation: 'slideIn 0.3s ease',
    overflowY: 'auto'
  },
  header: {
    padding: '24px',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px'
  },
  headerContent: {
    flex: 1
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  subtitle: {
    margin: '4px 0 0 0',
    fontSize: '14px',
    color: 'var(--text-secondary)'
  },
  closeButton: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'var(--hover-bg)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    flexShrink: 0
  },
  content: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto'
  }
};

export default SlideInPanel;
