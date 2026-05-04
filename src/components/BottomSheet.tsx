import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  return (
    <>
      {isOpen && (
        <div style={styles.overlay} onClick={onClose}>
          <div 
            style={styles.sheet}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.handle}>
              <div style={styles.handleBar}></div>
            </div>
            <div style={styles.header}>
              <h3 style={styles.title}>{title}</h3>
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
    justifyContent: 'center',
    alignItems: 'flex-end',
    animation: 'fadeIn 0.3s ease'
  },
  sheet: {
    width: '100%',
    maxWidth: '600px',
    maxHeight: '80vh',
    backgroundColor: 'var(--bg-card)',
    borderRadius: '20px 20px 0 0',
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column' as const,
    animation: 'slideUp 0.3s ease',
    overflow: 'hidden'
  },
  handle: {
    padding: '12px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  handleBar: {
    width: '40px',
    height: '4px',
    backgroundColor: 'var(--border-color)',
    borderRadius: '2px'
  },
  header: {
    padding: '0 20px 16px 20px',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--text-primary)'
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
    transition: 'all 0.2s ease'
  },
  content: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto'
  }
};

export default BottomSheet;
