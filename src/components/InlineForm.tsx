import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faChevronUp } from '@fortawesome/free-solid-svg-icons';

interface InlineFormProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const InlineForm: React.FC<InlineFormProps> = ({
  isVisible,
  onClose,
  title,
  children
}) => {
  if (!isVisible) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.iconContainer}>
            <FontAwesomeIcon icon={faChevronUp} style={styles.icon} />
          </div>
          <h3 style={styles.title}>{title}</h3>
        </div>
        <button style={styles.closeButton} onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      <div style={styles.content}>
        {children}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: 'var(--bg-card)',
    border: '2px solid var(--primary-color)',
    borderRadius: '12px',
    marginBottom: '24px',
    boxShadow: '0 8px 24px rgba(52, 152, 219, 0.15)',
    animation: 'slideDown 0.3s ease',
    overflow: 'hidden'
  },
  header: {
    padding: '16px 20px',
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  iconContainer: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: {
    fontSize: '14px' as any,
    color: 'white'
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600'
  },
  closeButton: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  content: {
    padding: '20px'
  }
};

export default InlineForm;
