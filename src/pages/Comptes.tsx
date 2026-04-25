import React, { useEffect, useState } from 'react';
import { comptesAPI, applicationsAPI } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

interface Application {
  id: number;
  nom: string;
}

interface Compte {
  id: number;
  username: string;
  role?: string;
  code?: string;
  applicationId: number;
  application?: { id: number; nom: string };
  commentaire?: string;
}

const Comptes: React.FC = () => {
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCompte, setEditingCompte] = useState<Compte | null>(null);
  const [viewingCompte, setViewingCompte] = useState<Compte | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({ applicationId: 0, username: '', code: '', role: '', commentaire: '' });
  const [editFormData, setEditFormData] = useState({ applicationId: 0, username: '', code: '', role: '', commentaire: '' });

  // Récupérer le rôle de l'utilisateur
  const userRole = localStorage.getItem('user_role');
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [comptesData, appsData] = await Promise.all([
        comptesAPI.getAll(),
        applicationsAPI.getAll(),
      ]);
      setComptes(comptesData);
      setApplications(appsData);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error(err);
      }
      setMessage({ type: 'error', text: 'Erreur de chargement des comptes' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await comptesAPI.create(formData);
      setMessage({ type: 'success', text: 'Compte ajouté avec succès!' });
      setFormData({ applicationId: 0, username: '', code: '', role: '', commentaire: '' });
      setShowCreateModal(false);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Erreur lors de l\'ajout' });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompte) return;
    
    try {
      const updateData: any = {
        applicationId: editFormData.applicationId,
        username: editFormData.username,
        role: editFormData.role,
        commentaire: editFormData.commentaire,
        code: editFormData.code,
      };
      
      await comptesAPI.update(editingCompte.id, updateData);
      setMessage({ type: 'success', text: 'Compte mis à jour avec succès!' });
      setShowModal(false);
      setEditingCompte(null);
      setEditFormData({ applicationId: 0, username: '', code: '', role: '', commentaire: '' });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Erreur lors de la mise à jour' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) return;
    
    try {
      await comptesAPI.delete(id);
      setMessage({ type: 'success', text: 'Compte supprimé avec succès!' });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Erreur lors de la suppression' });
    }
  };

  const openEditModal = (compte: Compte) => {
    setEditingCompte(compte);
    setEditFormData({
      applicationId: compte.applicationId,
      username: compte.username,
      code: compte.code || '',
      role: compte.role || '',
      commentaire: compte.commentaire || '',
    });
    setShowModal(true);
  };

  const getAppName = (appId: number) => {
    const app = applications.find(a => a.id === appId);
    return app ? app.nom : 'Application inconnue';
  };

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.pageTitle}>Gestion des comptes</h2>
            <p style={styles.pageSubtitle}>Suivez les accès par application et centralisez les identifiants sensibles.</p>
          </div>
          <button style={styles.primaryButton} onClick={() => setShowCreateModal(true)}>
            Nouveau compte
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
              <h3 style={styles.sectionTitle}>Liste des comptes</h3>
              <p style={styles.listSubtitle}>
                {comptes.length === 0
                  ? 'Aucun compte n’a encore été enregistré.'
                  : `${comptes.length} compte${comptes.length > 1 ? 's' : ''} géré${comptes.length > 1 ? 's' : ''} dans le référentiel.`}
              </p>
            </div>
          </div>
          {loading ? (
            <p>Chargement...</p>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="comptes-cards">
                {comptes.map((compte) => (
                  <div key={compte.id} style={styles.cardItem}>
                    <div style={styles.cardHeader}>
                      <span style={styles.cardId}>#{compte.id}</span>
                      <span style={styles.cardApp}>{getAppName(compte.applicationId)}</span>
                    </div>
                    <div style={styles.cardBody}>
                      <div style={styles.cardRow}>
                        <span style={styles.cardLabel}>Utilisateur:</span>
                        <span style={styles.cardValue}>{compte.username}</span>
                      </div>
                      <div style={styles.cardRow}>
                        <span style={styles.cardLabel}>Rôle:</span>
                        <span style={styles.cardValue}>{compte.role || 'Non défini'}</span>
                      </div>
                    </div>
                    <div style={styles.cardActions}>
                      <button style={{...styles.viewButton, padding: '8px 12px'}} onClick={() => { setViewingCompte(compte); setShowViewModal(true); }} title="Voir">
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button style={{...styles.editButton, padding: '8px 12px'}} onClick={() => openEditModal(compte)} title="Modifier">
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                      {isAdmin && (
                        <button style={{...styles.deleteButton, padding: '8px 12px'}} onClick={() => handleDelete(compte.id)} title="Supprimer">
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop Table View */}
              <div className="comptes-table table-container" style={{ overflowX: 'auto', margin: '0 -12px', padding: '0 12px' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Application</th>
                      <th>Nom d'utilisateur</th>
                      <th>Rôle</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comptes.map((compte) => (
                      <tr key={compte.id}>
                        <td>{compte.id}</td>
                        <td>{getAppName(compte.applicationId)}</td>
                        <td>{compte.username}</td>
                        <td>{compte.role || ''}</td>
                        <td style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button style={{...styles.viewButton, padding: '6px', backgroundColor: 'transparent', color: '#27ae60'}} onClick={() => { setViewingCompte(compte); setShowViewModal(true); }} title="Voir">
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          <button style={{...styles.editButton, padding: '6px', backgroundColor: 'transparent', color: '#3498db'}} onClick={() => openEditModal(compte)} title="Modifier">
                            <FontAwesomeIcon icon={faPen} />
                          </button>
                          {isAdmin && (
                            <button style={{...styles.deleteButton, padding: '6px', backgroundColor: 'transparent', color: '#ff6b6b'}} onClick={() => handleDelete(compte.id)} title="Supprimer">
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>

      {showCreateModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <span style={styles.close} onClick={() => setShowCreateModal(false)}>&times;</span>
            <div style={styles.modalHeader}>
              <h3 style={styles.sectionTitle}>Nouveau compte</h3>
              <p style={styles.modalSubtitle}>Ajoutez un compte et liez-le à une application.</p>
            </div>
            <form onSubmit={handleSubmit} style={styles.modalForm}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Application *</label>
                  <select
                    value={formData.applicationId || ''}
                    onChange={(e) => setFormData({ ...formData, applicationId: parseInt(e.target.value) })}
                    style={styles.select}
                    required
                  >
                    <option value="">Sélectionnez une application</option>
                    {applications.map(app => (
                      <option key={app.id} value={app.id}>{app.nom}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nom d'utilisateur *</label>
                  <input
                    type="text"
                    placeholder="Ex: jdupont"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Code / mot de passe *</label>
                  <input
                    type="text"
                    placeholder="Saisir le secret ou code d'accès"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Rôle</label>
                  <input
                    type="text"
                    placeholder="Ex: Administrateur, Lecture seule..."
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Commentaire</label>
                <textarea
                  placeholder="Contexte, remarques sur ce compte..."
                  value={formData.commentaire}
                  onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
                  style={styles.textarea}
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

      {/* View Modal */}
      {showViewModal && viewingCompte && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <span style={styles.close} onClick={() => setShowViewModal(false)}>&times;</span>
            <h3 style={styles.sectionTitle}>Détails du compte</h3>
            <div style={{ marginTop: '20px' }}>
              <p><strong>ID:</strong> {viewingCompte.id}</p>
              <p><strong>Application:</strong> {getAppName(viewingCompte.applicationId)}</p>
              <p><strong>Nom d'utilisateur:</strong> {viewingCompte.username}</p>
              <p>
                <strong>Code:</strong> {' '}
                <span style={{ fontFamily: 'monospace', backgroundColor: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>
                  {showPassword ? (viewingCompte.code || '---') : '********'}
                </span>
                <button 
                  onClick={() => setShowPassword(!showPassword)} 
                  style={{ ...styles.iconButton, marginLeft: '8px' }}
                  title={showPassword ? 'Masquer' : 'Afficher'}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </p>
              <p><strong>Rôle:</strong> {viewingCompte.role || 'Non défini'}</p>
              <p><strong>Commentaire:</strong> {viewingCompte.commentaire || 'Aucun'}</p>
            </div>
            <div style={styles.formActions}>
              <button type="button" style={styles.secondaryButton} onClick={() => setShowViewModal(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <span style={styles.close} onClick={() => setShowModal(false)}>&times;</span>
            <h3 style={styles.sectionTitle}>Modifier le compte</h3>
            <form onSubmit={handleEdit} style={styles.modalForm}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Application</label>
                  <select
                    value={editFormData.applicationId || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, applicationId: parseInt(e.target.value) })}
                    style={styles.select}
                    required
                  >
                    <option value="">Sélectionnez une application</option>
                    {applications.map(app => (
                      <option key={app.id} value={app.id}>{app.nom}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nom d'utilisateur</label>
                  <input
                    type="text"
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Code (mot de passe)</label>
                  <input
                    type="text"
                    value={editFormData.code}
                    onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Rôle</label>
                  <input
                    type="text"
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Commentaire</label>
                <textarea
                  value={editFormData.commentaire}
                  onChange={(e) => setEditFormData({ ...editFormData, commentaire: e.target.value })}
                  style={{ ...styles.textarea, minHeight: '70px' }}
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  pageTitle: { fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' },
  pageSubtitle: { fontSize: '14px', color: 'var(--text-secondary)' },
  formSection: { backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 2px 8px var(--shadow-color)', border: '1px solid var(--border-light)' },
  tableSection: { backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px var(--shadow-color)', border: '1px solid var(--border-light)' },
  sectionTitle: { fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '14px', maxWidth: '760px' },
  modalForm: { display: 'flex', flexDirection: 'column' as const, gap: '16px', padding: '10px 0' },
  formRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' as const },
  formGroup: { flex: '1 1 250px' as const, minWidth: '200px', marginBottom: '12px' },
  label: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' },
  input: { padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '14px', width: '100%', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' },
  textarea: { padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '14px', width: '100%', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', resize: 'vertical' as const, minHeight: '70px' },
  select: { padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '14px', width: '100%', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' },
  primaryButton: { padding: '10px 18px', backgroundColor: 'var(--success-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' },
  secondaryButton: { padding: '10px 16px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' },
  table: { width: '100%', borderCollapse: 'collapse' as const, borderRadius: '8px', overflow: 'hidden' },
  editButton: { padding: '8px 14px', backgroundColor: 'var(--info-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '8px', fontSize: '13px' },
  deleteButton: { padding: '8px 14px', backgroundColor: 'var(--danger-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  viewButton: { padding: '8px 14px', backgroundColor: 'var(--success-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '8px', fontSize: '13px' },
  iconButton: { padding: '6px', backgroundColor: 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  listSubtitle: { fontSize: '13px', color: 'var(--text-secondary)' },
  success: { padding: '14px', backgroundColor: 'var(--success-color)', color: 'white', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' },
  error: { padding: '14px', backgroundColor: 'var(--danger-color)', color: 'white', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' },
  modal: { position: 'fixed' as const, top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 1000, paddingTop: '40px', overflowY: 'auto' as const, backdropFilter: 'blur(4px)' },
  modalContent: { backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', width: '95%', maxWidth: '600px', position: 'relative' as const, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', marginBottom: '40px', border: '1px solid var(--border-light)' },
  close: { position: 'absolute' as const, top: '15px', right: '20px', fontSize: '28px', cursor: 'pointer', color: 'var(--text-muted)' },
  modalHeader: { marginBottom: '16px' },
  modalSubtitle: { fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' },
  cardItem: { backgroundColor: 'var(--bg-primary)', borderRadius: '8px', padding: '16px', marginBottom: '12px', border: '1px solid var(--border-light)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' },
  cardId: { fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' },
  cardApp: { fontSize: '14px', color: 'var(--info-color)', fontWeight: '600' },
  cardBody: { marginBottom: '12px' },
  cardRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' },
  cardLabel: { fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' },
  cardValue: { fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' },
  cardActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
};

export default Comptes;
