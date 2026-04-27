import React, { useEffect, useState } from 'react';
import { applicationsAPI, Application } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';

const Applications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({ nom: '', description: '', version: '', environnement: '' });
  const [editFormData, setEditFormData] = useState({ nom: '', description: '', version: '', environnement: '' });

  // Récupérer le rôle de l'utilisateur
  const userRole = localStorage.getItem('user_role');
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const data: any = await applicationsAPI.getAll();
      // Gérer à la fois les réponses tableau direct et PageResponse
      if (Array.isArray(data)) {
        setApplications(data);
      } else if (data && data.content && Array.isArray(data.content)) {
        setApplications(data.content);
      } else {
        setApplications([]);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error(err);
      }
      setMessage({ type: 'error', text: 'Erreur de chargement des applications' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await applicationsAPI.create(formData);
      setMessage({ type: 'success', text: 'Application ajoutée avec succès!' });
      setFormData({ nom: '', description: '', version: '', environnement: '' });
      setShowCreateModal(false);
      fetchApplications();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Erreur lors de l\'ajout' });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;
    
    try {
      await applicationsAPI.update(editingApp.id, editFormData);
      setMessage({ type: 'success', text: 'Application mise à jour avec succès!' });
      setShowModal(false);
      setEditingApp(null);
      setEditFormData({ nom: '', description: '', version: '', environnement: '' });
      fetchApplications();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Erreur lors de la mise à jour' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette application ?')) return;
    
    try {
      await applicationsAPI.delete(id);
      setMessage({ type: 'success', text: 'Application supprimée avec succès!' });
      fetchApplications();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Erreur lors de la suppression' });
    }
  };

  const openEditModal = (app: Application) => {
    setEditingApp(app);
    setEditFormData({
      nom: app.nom,
      description: app.description || '',
      version: app.version || '',
      environnement: app.environnement || ''
    });
    setShowModal(true);
  };

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.pageTitle}>Gestion des applications</h2>
            <p style={styles.pageSubtitle}>Centralisez vos applications, leurs versions et environnements.</p>
          </div>
          <button style={styles.primaryButton} onClick={() => setShowCreateModal(true)}>
            Nouvelle application
          </button>
        </div>
        
        {message.text && (
          <div style={message.type === 'success' ? styles.success : styles.error}>
            {message.text}
          </div>
        )}

        <div style={styles.tableSection}>
          <div style={styles.listHeader}>
            <div>
              <h3 style={styles.sectionTitle}>Liste des applications</h3>
              <p style={styles.listSubtitle}>
                {applications.length === 0
                  ? 'Aucune application enregistrée pour le moment.'
                  : `${applications.length} application${applications.length > 1 ? 's' : ''} configurée${applications.length > 1 ? 's' : ''}.`}
              </p>
            </div>
          </div>
          {loading ? (
            <p>Chargement...</p>
          ) : (
            <div className="table-container" style={{ overflowX: 'auto', margin: '0 -12px', padding: '0 12px' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nom</th>
                    <th>Version</th>
                    <th>Environnement</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td>{app.id}</td>
                      <td><strong>{app.nom}</strong></td>
                      <td>{app.version || '-'}</td>
                      <td>{app.environnement || '-'}</td>
                      <td>{app.description || ''}</td>
                      <td style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button style={{...styles.editButton, padding: '6px', backgroundColor: 'transparent', color: '#3498db'}} onClick={() => openEditModal(app)} title="Modifier">
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        {isAdmin && (
                          <button style={{...styles.deleteButton, padding: '6px', backgroundColor: 'transparent', color: '#ff6b6b'}} onClick={() => handleDelete(app.id)} title="Supprimer">
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showCreateModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <span style={styles.close} onClick={() => setShowCreateModal(false)}>&times;</span>
            <div style={styles.modalHeader}>
              <h3 style={styles.sectionTitle}>Nouvelle application</h3>
              <p style={styles.modalSubtitle}>Ajoutez une application et précisez sa version/environnement si nécessaire.</p>
            </div>
            <form onSubmit={handleSubmit} style={styles.modalForm}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nom de l'application *</label>
                  <input
                    type="text"
                    placeholder="Ex: Portail RH"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Version</label>
                  <input
                    type="text"
                    placeholder="Ex: 1.0.0"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Environnement</label>
                  <input
                    type="text"
                    placeholder="Ex: Production, Recette, Mobile"
                    value={formData.environnement}
                    onChange={(e) => setFormData({ ...formData, environnement: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formGroup} >
                <label style={styles.label}>Description</label>
                <textarea
                  placeholder="Description fonctionnelle de l'application..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ ...styles.textarea, minHeight: '80px' }}
                />
              </div>
              <div style={styles.formActions}>
                <button type="button" style={styles.secondaryButton} onClick={() => setShowCreateModal(false)}>Annuler</button>
                <button type="submit" style={styles.primaryButton}>Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <span style={styles.close} onClick={() => setShowModal(false)}>&times;</span>
            <h3 style={styles.sectionTitle}>Modifier l'application</h3>
            <form onSubmit={handleEdit} style={styles.modalForm}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nom</label>
                  <input
                    type="text"
                    value={editFormData.nom}
                    onChange={(e) => setEditFormData({ ...editFormData, nom: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Version</label>
                  <input
                    type="text"
                    value={editFormData.version}
                    onChange={(e) => setEditFormData({ ...editFormData, version: e.target.value })}
                    style={styles.input}
                    placeholder="ex: 1.0"
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Environnement</label>
                  <input
                    type="text"
                    value={editFormData.environnement}
                    onChange={(e) => setEditFormData({ ...editFormData, environnement: e.target.value })}
                    style={styles.input}
                    placeholder="ex: Mobile, Production"
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  style={{ ...styles.textarea, minHeight: '80px' }}
                />
              </div>
              <div style={styles.formActions}>
                <button type="button" style={styles.secondaryButton} onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" style={styles.primaryButton}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: any = {
  container: { backgroundColor: 'var(--bg-primary)', minHeight: '100vh' },
  main: { padding: '30px', maxWidth: '1400px', margin: '0 auto', minHeight: 'calc(100vh - 70px)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' as const, gap: '16px' },
  pageTitle: { fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', letterSpacing: '-0.5px' },
  pageSubtitle: { fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 400 },
  tableSection: { backgroundColor: 'var(--bg-card)', padding: '28px', borderRadius: '16px', boxShadow: '0 4px 24px var(--shadow-color)', border: '1px solid var(--border-light)' },
  sectionTitle: { fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', letterSpacing: '-0.3px' },
  modalForm: { display: 'flex', flexDirection: 'column' as const, gap: '20px', padding: '8px 0' },
  formRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' as const },
  formGroup: { flex: '1 1 280px' as const, minWidth: '240px', marginBottom: '0' },
  label: { display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.3px', textTransform: 'uppercase' as const },
  input: { 
    padding: '14px 16px', 
    border: '2px solid var(--border-color)', 
    borderRadius: '12px', 
    fontSize: '15px', 
    width: '100%', 
    backgroundColor: 'var(--input-bg)', 
    color: 'var(--text-primary)',
    transition: 'all 0.2s ease',
    outline: 'none',
    fontWeight: 400
  },
  textarea: { 
    padding: '14px 16px', 
    border: '2px solid var(--border-color)', 
    borderRadius: '12px', 
    fontSize: '15px', 
    width: '100%', 
    backgroundColor: 'var(--input-bg)', 
    color: 'var(--text-primary)', 
    resize: 'vertical' as const, 
    minHeight: '100px',
    transition: 'all 0.2s ease',
    outline: 'none',
    fontWeight: 400,
    fontFamily: 'inherit'
  },
  select: { 
    padding: '14px 16px', 
    border: '2px solid var(--border-color)', 
    borderRadius: '12px', 
    fontSize: '15px', 
    width: '100%', 
    backgroundColor: 'var(--input-bg)', 
    color: 'var(--text-primary)',
    transition: 'all 0.2s ease',
    outline: 'none',
    cursor: 'pointer',
    fontWeight: 400
  },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', paddingTop: '8px' },
  primaryButton: { 
    padding: '14px 28px', 
    backgroundColor: 'var(--success-color)', 
    color: 'white', 
    border: 'none', 
    borderRadius: '12px', 
    cursor: 'pointer', 
    fontWeight: 600, 
    fontSize: '14px',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(39, 174, 96, 0.3)',
    letterSpacing: '0.3px'
  },
  secondaryButton: { 
    padding: '14px 24px', 
    backgroundColor: 'transparent', 
    color: 'var(--text-secondary)', 
    border: '2px solid var(--border-color)', 
    borderRadius: '12px', 
    cursor: 'pointer', 
    fontWeight: 600, 
    fontSize: '14px',
    transition: 'all 0.2s ease',
    letterSpacing: '0.3px'
  },
  table: { width: '100%', borderCollapse: 'collapse' as const, borderRadius: '12px', overflow: 'hidden' },
  deleteButton: { 
    padding: '10px 16px', 
    backgroundColor: 'var(--danger-color)', 
    color: 'white', 
    border: 'none', 
    borderRadius: '10px', 
    cursor: 'pointer', 
    fontSize: '13px',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)'
  },
  editButton: { 
    padding: '10px 16px', 
    backgroundColor: 'var(--info-color)', 
    color: 'white', 
    border: 'none', 
    borderRadius: '10px', 
    cursor: 'pointer', 
    fontSize: '13px',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)'
  },
  listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' as const, gap: '12px' },
  listSubtitle: { fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 400 },
  success: { 
    padding: '16px 20px', 
    backgroundColor: 'var(--success-color)', 
    color: 'white', 
    borderRadius: '12px', 
    marginBottom: '24px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px',
    fontWeight: 500,
    boxShadow: '0 4px 12px rgba(39, 174, 96, 0.2)'
  },
  error: { 
    padding: '16px 20px', 
    backgroundColor: 'var(--danger-color)', 
    color: 'white', 
    borderRadius: '12px', 
    marginBottom: '24px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px',
    fontWeight: 500,
    boxShadow: '0 4px 12px rgba(255, 107, 107, 0.2)'
  },
  modal: { 
    position: 'fixed' as const, 
    top: 0, 
    left: 0, 
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
    boxShadow: '0 24px 80px rgba(0,0,0,0.4)', 
    marginBottom: '40px', 
    border: '1px solid var(--border-light)' 
  },
  close: { 
    position: 'absolute' as const, 
    top: '20px', 
    right: '24px', 
    fontSize: '32px', 
    cursor: 'pointer', 
    color: 'var(--text-muted)',
    transition: 'all 0.2s ease',
    lineHeight: 1
  },
  modalHeader: { marginBottom: '24px' },
  modalSubtitle: { fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: 400 },
};

export default Applications;
