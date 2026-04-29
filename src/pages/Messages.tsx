import React, { useEffect, useState } from 'react';
import { usersAPI, User } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faPaperPlane, faCircle } from '@fortawesome/free-solid-svg-icons';
import Chat from '../components/Chat';

const Messages: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
  const [showChat, setShowChat] = useState(false);

  const currentUserId = parseInt(localStorage.getItem('user_id') || '0');

  useEffect(() => {
    loadUsers();
    loadCurrentUser();
    loadUnreadCounts();
    // Poll for unread counts every 10 seconds
    const interval = setInterval(loadUnreadCounts, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadUsers = async () => {
    try {
      const data: any = await usersAPI.getAll();
      const userList = Array.isArray(data) ? data : (data?.content || []);
      // Filter out current user
      setUsers(userList.filter((u: User) => u.id !== currentUserId));
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const data = await usersAPI.getById(currentUserId);
      setCurrentUser(data);
    } catch (err) {
      console.error('Error loading current user:', err);
    }
  };

  const loadUnreadCounts = async () => {
    try {
      // For now, we'll simulate unread counts since the API might not be implemented yet
      // In production, this would call messagesAPI.getUnreadCount() for each conversation
      const counts: Record<number, number> = {};
      users.forEach(user => {
        counts[user.id] = Math.floor(Math.random() * 3); // Simulated for demo
      });
      setUnreadCounts(counts);
    } catch (err) {
      console.error('Error loading unread counts:', err);
    }
  };

  const handleStartChat = (user: User) => {
    setSelectedUser(user);
    setShowChat(true);
    // Clear unread count for this user
    setUnreadCounts(prev => ({ ...prev, [user.id]: 0 }));
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedUser(null);
  };

  if (showChat && selectedUser && currentUser) {
    return (
      <div style={styles.container}>
        <main style={styles.main}>
          <Chat
            currentUser={currentUser}
            selectedUser={selectedUser}
            onClose={handleCloseChat}
          />
        </main>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.pageTitle}>
              <FontAwesomeIcon icon={faComments} /> Messages
            </h2>
            <p style={styles.pageSubtitle}>
              Communiquez avec les autres utilisateurs et l'administrateur
            </p>
          </div>
        </div>

        <div style={styles.usersSection}>
          <h3 style={styles.sectionTitle}>Utilisateurs</h3>
          {loading ? (
            <div style={styles.loading}>Chargement...</div>
          ) : users.length === 0 ? (
            <div style={styles.emptyState}>
              <FontAwesomeIcon icon={faComments} style={styles.emptyIcon as any} />
              <p>Aucun autre utilisateur disponible</p>
            </div>
          ) : (
            <div style={styles.usersList}>
              {users.map((user) => (
                <div
                  key={user.id}
                  style={styles.userCard as any}
                  onClick={() => handleStartChat(user)}
                >
                  <div style={styles.userInfo}>
                    <div style={styles.userAvatar as any}>
                      <FontAwesomeIcon icon={user.role === 'admin' ? faComments : faPaperPlane} />
                    </div>
                    <div style={styles.userDetails}>
                      <div style={styles.userName}>
                        {user.username}
                        {unreadCounts[user.id] > 0 && (
                          <span style={styles.unreadBadge}>{unreadCounts[user.id]}</span>
                        )}
                      </div>
                      <div style={styles.userEmail}>{user.email}</div>
                      <div style={styles.userRole}>
                        {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                      </div>
                    </div>
                  </div>
                  <div style={styles.userStatus}>
                    {user.isActive !== false ? (
                      <FontAwesomeIcon icon={faCircle} style={styles.onlineIndicator as any} />
                    ) : (
                      <FontAwesomeIcon icon={faCircle} style={styles.offlineIndicator as any} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: 'var(--bg-primary)',
    minHeight: '100vh',
  },
  main: {
    padding: '30px',
    maxWidth: '1200px',
    margin: '0 auto',
    minHeight: 'calc(100vh - 70px)',
  },
  header: {
    marginBottom: '32px',
  },
  pageTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  pageSubtitle: {
    margin: '4px 0 0',
    color: 'var(--text-secondary)',
    fontSize: '14px',
  },
  usersSection: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid var(--border-color)',
    boxShadow: '0 2px 8px var(--shadow-color)',
  },
  sectionTitle: {
    margin: '0 0 20px',
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  loading: {
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    padding: '40px',
  },
  emptyState: {
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    padding: '60px 20px',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.5,
  } as React.CSSProperties,
  usersList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  userCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: 'var(--bg-primary)',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: 'var(--info-color)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
  } as React.CSSProperties,
  userDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  userName: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  unreadBadge: {
    backgroundColor: 'var(--danger-color)',
    color: 'white',
    fontSize: '12px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '12px',
  },
  userEmail: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  userRole: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  userStatus: {
    display: 'flex',
    alignItems: 'center',
  },
  onlineIndicator: {
    fontSize: '10px',
    color: 'var(--success-color)',
  } as React.CSSProperties,
  offlineIndicator: {
    fontSize: '10px',
    color: 'var(--text-muted)',
  } as React.CSSProperties,
};

export default Messages;
