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
      const data = await usersAPI.getAll();
      setUsers(data);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error(err);
      }
      setMessage({ type: 'error', text: 'Erreur de chargement des utilisateurs' });
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
  formSection: { backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 2px 8px var(--shadow-color)' },
  tableSection: { backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px var(--shadow-color)' },
  form: { display: 'flex', gap: '10px', flexWrap: 'wrap' as const },
  input: { padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: '8px', flex: '1 1 200px', fontSize: '14px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' },
  inputDisabled: { padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-primary)', flex: '1 1 200px', fontSize: '14px', color: 'var(--text-muted)' },
  select: { padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: '8px', flex: '1 1 200px', fontSize: '14px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' },
  submitButton: { padding: '12px 24px', backgroundColor: 'var(--success-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  cancelButton: { padding: '12px 24px', backgroundColor: 'var(--text-muted)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginLeft: '10px', fontWeight: '500' },
  table: { width: '100%', borderCollapse: 'collapse' as const, borderRadius: '8px', overflow: 'hidden' },
  editButton: { padding: '8px 14px', backgroundColor: 'var(--info-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '8px', fontSize: '13px', marginBottom: '5px' },
  deleteButton: { padding: '8px 14px', backgroundColor: 'var(--danger-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', marginBottom: '5px' },
  toggleOnButton: { padding: '8px 14px', backgroundColor: 'var(--success-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '8px', fontSize: '13px', marginBottom: '5px' },
  toggleOffButton: { padding: '8px 14px', backgroundColor: 'var(--text-muted)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '8px', fontSize: '13px', marginBottom: '5px' },
  success: { padding: '14px', backgroundColor: 'var(--success-color)', color: 'white', borderRadius: '8px', marginBottom: '20px' },
  error: { padding: '14px', backgroundColor: 'var(--danger-color)', color: 'white', borderRadius: '8px', marginBottom: '20px' },
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
    paddingTop: '40px',
    overflowY: 'auto' as const,
    backdropFilter: 'blur(4px)'
  },
  modalContent: { 
    backgroundColor: 'var(--bg-card)', 
    padding: '20px', 
    borderRadius: '16px', 
    width: '95%', 
    maxWidth: '500px', 
    position: 'relative' as const,
    margin: '0 auto 40px auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    border: '1px solid var(--border-light)'
  },
  close: { position: 'absolute' as const, top: '15px', right: '20px', fontSize: '28px', cursor: 'pointer', color: 'var(--text-muted)' },
  formGroup: { flex: '1 1 200px' as const, minWidth: '150px', marginBottom: '16px' },
  formRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' as const },
  modalForm: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
  label: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' },
};

export default Users;
