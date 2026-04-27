import React, { useEffect, useState } from 'react';
import { usersAPI, User } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'user',
    password: '',
  });

  const [editFormData, setEditFormData] = useState({
    email: '',
    role: 'user',
    isActive: true,
    password: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data: any = await usersAPI.getAll();
      // Gérer à la fois les réponses tableau direct et PageResponse
      if (Array.isArray(data)) {
        setUsers(data);
      } else if (data && data.content) {
        setUsers(data.content);
      } else {
        setUsers([]);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching users:', err);
      }
      setMessage({ type: 'error', text: 'Erreur de chargement des utilisateurs' });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await usersAPI.create(formData);
      setMessage({ type: 'success', text: 'Utilisateur ajouté avec succès!' });
      setFormData({ username: '', email: '', role: 'user', password: '' });
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Erreur lors de l\'ajout' });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      const updateData: any = {
        email: editFormData.email,
        role: editFormData.role,
        isActive: editFormData.isActive,
      };
      if (editFormData.password) {
        updateData.password = editFormData.password;
      }
      
      await usersAPI.update(editingUser.id, updateData);
      setMessage({ type: 'success', text: 'Utilisateur mis à jour avec succès!' });
      setShowModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Erreur lors de la mise à jour' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    
    try {
      await usersAPI.delete(id);
      setMessage({ type: 'success', text: 'Utilisateur supprimé avec succès!' });
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Erreur lors de la suppression' });
    }
  };

  const handleToggleUser = async (user: User) => {
    try {
      await usersAPI.update(user.id, { isActive: !user.isActive });
      setMessage({ type: 'success', text: user.isActive ? 'Utilisateur désactivé!' : 'Utilisateur activé!' });
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Erreur lors de la mise à jour' });
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      email: user.email,
      role: user.role,
      isActive: user.isActive ?? true,
      password: '',
    });
    setShowModal(true);
  };

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <h2>Gestion des Utilisateurs</h2>
        
        {message.text && (
          <div style={message.type === 'success' ? styles.success : styles.error}>
            {message.text}
          </div>
        )}

        <div style={styles.formSection}>
          <h3>Ajouter un nouvel utilisateur</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="text"
              placeholder="Nom d'utilisateur"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              style={styles.input}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={styles.input}
              required
            />
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              style={styles.select}
            >
              <option value="user">Utilisateur</option>
              <option value="admin">Administrateur</option>
            </select>
            <input
              type="password"
              placeholder="Mot de passe"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={styles.input}
              required
            />
            <button type="submit" style={styles.submitButton}>Ajouter l'utilisateur</button>
          </form>
        </div>

        <div style={styles.tableSection}>
          <h3>Liste des utilisateurs</h3>
          {loading ? (
            <p>Chargement...</p>
          ) : (
            <div className="table-container" style={{ overflowX: 'auto', margin: '0 -12px', padding: '0 12px' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nom d'utilisateur</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Actif</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</td>
                      <td>{user.isActive ? 'Oui' : 'Non'}</td>
                      <td style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button style={user.isActive ? {...styles.toggleOnButton, padding: '8px 12px', backgroundColor: 'transparent', color: '#27ae60'} : {...styles.toggleOffButton, padding: '8px 12px', backgroundColor: 'transparent', color: '#95a5a6'}} onClick={() => handleToggleUser(user)} title={user.isActive ? 'Désactiver' : 'Activer'}>
                          <FontAwesomeIcon icon={user.isActive ? faToggleOn : faToggleOff} />
                        </button>
                        <button style={{...styles.editButton, padding: '8px 12px', backgroundColor: 'transparent', color: '#3498db'}} onClick={() => openEditModal(user)} title="Modifier">
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button style={{...styles.deleteButton, padding: '8px 12px', backgroundColor: 'transparent', color: '#ff6b6b'}} onClick={() => handleDelete(user.id)} title="Supprimer">
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <span style={styles.close} onClick={() => setShowModal(false)}>&times;</span>
            <h3>Modifier l'utilisateur</h3>
            <form onSubmit={handleEdit} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom d'utilisateur</label>
                <input type="text" value={editingUser?.username} disabled style={styles.inputDisabled} />
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Rôle</label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    style={styles.select}
                  >
                    <option value="user">Utilisateur</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Actif</label>
                  <select
                    value={editFormData.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.value === 'true' })}
                    style={styles.select}
                  >
                    <option value="true">Oui</option>
                    <option value="false">Non</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nouveau mot de passe</label>
                  <input
                    type="password"
                    placeholder="Laisser vide pour garder l'actuel"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formActions}>
                <button type="button" style={styles.cancelButton} onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" style={styles.submitButton}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { backgroundColor: 'var(--bg-primary)', minHeight: '100vh' },
  main: { padding: '30px', maxWidth: '1400px', margin: '0 auto', minHeight: 'calc(100vh - 70px)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' as const, gap: '16px' },
  pageTitle: { fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', letterSpacing: '-0.5px' },
  pageSubtitle: { fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 400 },
  formSection: { backgroundColor: 'var(--bg-card)', padding: '28px', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 4px 24px var(--shadow-color)', border: '1px solid var(--border-light)' },
  tableSection: { backgroundColor: 'var(--bg-card)', padding: '28px', borderRadius: '16px', boxShadow: '0 4px 24px var(--shadow-color)', border: '1px solid var(--border-light)' },
  sectionTitle: { fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', letterSpacing: '-0.3px' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '18px', maxWidth: '760px' },
  modalForm: { display: 'flex', flexDirection: 'column' as const, gap: '20px', padding: '8px 0' },
  formRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' as const },
  formGroup: { flex: '1 1 280px' as const, minWidth: '240px', marginBottom: '0' },
  label: { display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.3px', textTransform: 'uppercase' as const },
  input: { padding: '14px 16px', border: '2px solid var(--border-color)', borderRadius: '12px', flex: '1 1 200px', fontSize: '15px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', transition: 'all 0.2s ease', outline: 'none', fontWeight: 400 },
  inputDisabled: { padding: '14px 16px', border: '2px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'var(--bg-primary)', flex: '1 1 200px', fontSize: '15px', color: 'var(--text-muted)', outline: 'none' },
  select: { padding: '14px 16px', border: '2px solid var(--border-color)', borderRadius: '12px', flex: '1 1 200px', fontSize: '15px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', transition: 'all 0.2s ease', outline: 'none', cursor: 'pointer', fontWeight: 400 },
  submitButton: { padding: '14px 28px', backgroundColor: 'var(--success-color)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(39, 174, 96, 0.3)', letterSpacing: '0.3px' },
  cancelButton: { padding: '14px 24px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '2px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', transition: 'all 0.2s ease', letterSpacing: '0.3px' },
  table: { width: '100%', borderCollapse: 'collapse' as const, borderRadius: '12px', overflow: 'hidden' },
  editButton: { padding: '10px 16px', backgroundColor: 'var(--info-color)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', marginRight: '8px', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)' },
  deleteButton: { padding: '10px 16px', backgroundColor: 'var(--danger-color)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)' },
  toggleOnButton: { padding: '10px 16px', backgroundColor: 'var(--success-color)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', marginRight: '8px', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(39, 174, 96, 0.3)' },
  toggleOffButton: { padding: '10px 16px', backgroundColor: 'var(--text-muted)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', marginRight: '8px', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s ease' },
  success: { padding: '16px 20px', backgroundColor: 'var(--success-color)', color: 'white', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 500, boxShadow: '0 4px 12px rgba(39, 174, 96, 0.2)' },
  error: { padding: '16px 20px', backgroundColor: 'var(--danger-color)', color: 'white', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 500, boxShadow: '0 4px 12px rgba(255, 107, 107, 0.2)' },
  modal: { 
    position: 'fixed' as const, 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    width: '100%', 
    height: '100%', 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'flex-start', 
    zIndex: 1000,
    paddingTop: '60px',
    overflowY: 'auto' as const,
    backdropFilter: 'blur(4px)',
    padding: '20px'
  },
  modalContent: { 
    backgroundColor: 'var(--bg-card)', 
    padding: '32px', 
    borderRadius: '20px', 
    width: '95%', 
    maxWidth: '640px', 
    position: 'relative' as const,
    margin: '0 auto 40px auto',
    boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
    border: '1px solid var(--border-light)'
  },
  close: { position: 'absolute' as const, top: '20px', right: '24px', fontSize: '32px', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s ease', lineHeight: 1 },
  formGroup: { flex: '1 1 280px' as const, minWidth: '240px', marginBottom: '0' },
  formRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' as const },
  modalForm: { display: 'flex', flexDirection: 'column' as const, gap: '20px', padding: '8px 0' },
  label: { display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.3px', textTransform: 'uppercase' as const },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', paddingTop: '8px' },
};

export default Users;
