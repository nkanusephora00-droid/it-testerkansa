import React, { useEffect, useState, useCallback } from 'react';
import { testsAPI, applicationsAPI, testSessionsAPI, Application, Test, TestSession } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEye, faFilePdf, faPlus, faEdit, faTimes } from '@fortawesome/free-solid-svg-icons';
import { consolidateSessionsByUser, consolidateAllSessions, ConsolidatedSession } from '../utils/sessionConsolidation';

interface FormData {
  sessionId: number;
  applicationId: number;
  fonction: string;
  precondition: string;
  etapes: string;
  resultatAttendu: string;
  resultatObtenu: string;
  statut: string;
  commentaires: string;
  image: string;
}

interface SessionForm {
  nom: string;
  description: string;
  nom_document: string;
  applicationId: number;
  statut: string;
}

const Tests: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [allSessions, setAllSessions] = useState<TestSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });
  const [formData, setFormData] = useState<FormData>({
    sessionId: 0,
    applicationId: 0,
    fonction: '',
    precondition: '',
    etapes: '',
    resultatAttendu: '',
    resultatObtenu: '',
    statut: '',
    commentaires: '',
    image: ''
  });

  // Session form states
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [formDisplayMode, setFormDisplayMode] = useState<'modal' | 'inline'>('modal');
  const [sessionForm, setSessionForm] = useState<SessionForm>({
    nom: '',
    description: '',
    nom_document: '',
    applicationId: 0,
    statut: 'En cours'
  });

  // Edit test states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Admin states
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  // Consolidation states
  const [consolidationMode, setConsolidationMode] = useState<'none' | 'byUser' | 'global'>('none');
  const [consolidatedSessions, setConsolidatedSessions] = useState<ConsolidatedSession[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<number[]>([]);

  useEffect(() => {
    if (selectedSession) {
      const currentSession = sessions.find(s => s.id === selectedSession);
      if (currentSession) {
        setFormData(prev => ({
          ...prev,
          sessionId: selectedSession,
          applicationId: currentSession.applicationId || 0
        }));
      }
    }
  }, [selectedSession, sessions]);

  const fetchData = useCallback(async () => {
    try {
      const [testsData, appsData] = await Promise.all([
        testsAPI.getAll(),
        applicationsAPI.getAll()
      ]);
      setTests(testsData);
      setApplications(appsData);
      await fetchSessions();
    } catch (err) {
      if (process.env.NODE_ENV === 'development') { console.error(err); }
      setMessage({ type: 'error', text: 'Erreur de chargement' });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedUser !== null) {
      const filteredSessions = allSessions.filter(session => session.created_by === selectedUser);
      setSessions(filteredSessions);
    } else {
      setSessions(allSessions);
    }
  }, [selectedUser, allSessions]);

  async function fetchSessions() {
    try {
      const data = await testSessionsAPI.getAll();
      setAllSessions(data);
      setSessions(data);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching sessions:', err);
      }
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sessionData = {
        nom: sessionForm.nom,
        description: sessionForm.description,
        applicationId: sessionForm.applicationId || undefined,
        nom_document: sessionForm.nom_document || undefined,
        statut: sessionForm.statut
      };
      const newSession = await testSessionsAPI.create(sessionData);
      setMessage({ type: 'success', text: 'Session créée avec succès!' });
      setShowSessionModal(false);
      setShowInlineForm(false);
      setSessionForm({ nom: '', description: '', nom_document: '', applicationId: 0, statut: 'En cours' });
      fetchSessions();
      setSelectedSession(newSession.id);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string | unknown[] } } };
      const detail = error.response?.data?.detail;
      let errorText = 'Erreur lors de la création';
      if (typeof detail === 'string') {
        errorText = detail;
      } else if (Array.isArray(detail)) {
        errorText = (detail as unknown[]).map((e: unknown) => {
          const err = e as { msg?: string };
          return err.msg || JSON.stringify(e);
        }).join(', ');
      }
      setMessage({ type: 'error', text: errorText });
    }
  };

  const handleDeleteSession = async (id: number) => {
    const session = sessions.find(s => s.id === id);
    if (session && session.statut === 'Terminé') {
      setMessage({ type: 'error', text: 'Impossible de supprimer une session terminée!' });
      return;
    }
    if (!window.confirm('Voulez-vous vraiment supprimer cette session et tous ses tests?')) return;
    try {
      await testSessionsAPI.delete(id);
      setMessage({ type: 'success', text: 'Session supprimée!' });
      fetchSessions();
      if (selectedSession === id) {
        setSelectedSession(null);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const testData: Partial<Test> = {};
      
      if (formData.sessionId) testData.sessionId = formData.sessionId;
      if (formData.applicationId) testData.applicationId = formData.applicationId;
      if (formData.fonction) testData.fonction = formData.fonction;
      if (formData.precondition) testData.precondition = formData.precondition;
      if (formData.etapes) testData.etapes = formData.etapes;
      if (formData.resultatAttendu) testData.resultatAttendu = formData.resultatAttendu;
      if (formData.resultatObtenu) testData.resultatObtenu = formData.resultatObtenu;
      if (formData.statut) testData.statut = formData.statut;
      if (formData.commentaires) testData.commentaires = formData.commentaires;
      if (formData.image) testData.image = formData.image;
      
      await testsAPI.create(testData);
      setMessage({ type: 'success', text: 'Test ajouté avec succès!' });
      setFormData({
        sessionId: 0,
        applicationId: 0,
        fonction: '',
        precondition: '',
        etapes: '',
        resultatAttendu: '',
        resultatObtenu: '',
        statut: '',
        commentaires: '',
        image: ''
      });
      setImagePreview(null);
      fetchData();
      fetchSessions();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string | unknown[] } } };
      const detail = error.response?.data?.detail;
      let errorText = 'Erreur lors de l\'ajout';
      if (typeof detail === 'string') {
        errorText = detail;
      } else if (Array.isArray(detail)) {
        errorText = (detail as unknown[]).map((e: unknown) => {
          const err = e as { msg?: string };
          return err.msg || JSON.stringify(e);
        }).join(', ');
      }
      setMessage({ type: 'error', text: errorText });
    }
  };

  const handleDeleteTest = async (id: number) => {
    if (!window.confirm('Voulez-vous supprimer ce test?')) return;
    try {
      await testsAPI.delete(id);
      setMessage({ type: 'success', text: 'Test supprimé!' });
      fetchData();
      fetchSessions();
    } catch (err: unknown) {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
    }
  };

  const handleUpdateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTest) return;
    try {
      await testsAPI.update(editingTest.id, formData);
      setMessage({ type: 'success', text: 'Test mis à jour!' });
      setShowEditModal(false);
      setEditingTest(null);
      fetchData();
      fetchSessions();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string | unknown[] } } };
      const detail = error.response?.data?.detail;
      let errorText = 'Erreur lors de la mise à jour';
      if (typeof detail === 'string') {
        errorText = detail;
      } else if (Array.isArray(detail)) {
        errorText = (detail as unknown[]).map((e: unknown) => {
          const err = e as { msg?: string };
          return err.msg || JSON.stringify(e);
        }).join(', ');
      }
      setMessage({ type: 'error', text: errorText });
    }
  };

  const handleEditTest = (test: Test) => {
    setEditingTest(test);
    setFormData({
      sessionId: test.sessionId || 0,
      applicationId: test.applicationId || 0,
      fonction: test.fonction || '',
      precondition: test.precondition || '',
      etapes: test.etapes || '',
      resultatAttendu: test.resultatAttendu || '',
      resultatObtenu: test.resultatObtenu || '',
      statut: test.statut || '',
      commentaires: test.commentaires || '',
      image: test.image || ''
    });
    setImagePreview(test.image || null);
    setShowEditModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderSessionForm = () => (
    <>
      <div style={styles.formRow}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Nom de la session *</label>
          <input
            type="text"
            value={sessionForm.nom}
            onChange={(e) => setSessionForm({ ...sessionForm, nom: e.target.value })}
            style={styles.input}
            required
            placeholder="Ex: Test Release v1.0"
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Application</label>
          <select
            value={sessionForm.applicationId || ''}
            onChange={(e) => setSessionForm({ ...sessionForm, applicationId: parseInt(e.target.value) })}
            style={styles.select}
          >
            <option value="">Sélectionnez une application</option>
            {applications.map(app => (
              <option key={app.id} value={app.id}>{app.nom}</option>
            ))}
          </select>
        </div>
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Description</label>
        <textarea
          value={sessionForm.description}
          onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
          style={styles.textarea}
          placeholder="Description de la session..."
          rows={3}
        />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Nom du document</label>
        <input
          type="text"
          value={sessionForm.nom_document}
          onChange={(e) => setSessionForm({ ...sessionForm, nom_document: e.target.value })}
          style={styles.input}
          placeholder="Ex: Test_Document.pdf"
        />
      </div>
      <div style={styles.formActions}>
        <button
          type="button"
          onClick={() => {
            setShowSessionModal(false);
            setShowInlineForm(false);
          }}
          style={styles.secondaryButton}
        >
          Annuler
        </button>
        <button
          type="submit"
          style={styles.primaryButton}
          disabled={sessionForm.nom === ''}
        >
          Créer la session
        </button>
      </div>
    </>
  );

  const renderTestForm = () => (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.formRow}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Fonction *</label>
          <input
            type="text"
            placeholder="Fonction"
            value={formData.fonction}
            onChange={(e) => setFormData({ ...formData, fonction: e.target.value })}
            style={styles.input}
            required
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Statut *</label>
          <select
            value={formData.statut}
            onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
            style={styles.select}
            required
          >
            <option value="">Sélectionner...</option>
            <option value="OK">OK</option>
            <option value="BUG">BUG</option>
            <option value="EN COURS">EN COURS</option>
            <option value="BLOQUE">BLOQUE</option>
          </select>
        </div>
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Précondition</label>
        <textarea
          placeholder="Précondition"
          value={formData.precondition}
          onChange={(e) => setFormData({ ...formData, precondition: e.target.value })}
          style={styles.textarea}
        />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Étapes</label>
        <textarea
          placeholder="Étapes"
          value={formData.etapes}
          onChange={(e) => setFormData({ ...formData, etapes: e.target.value })}
          style={styles.textarea}
        />
      </div>
      <div style={styles.formRow}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Résultat attendu</label>
          <textarea
            placeholder="Résultat Attendu"
            value={formData.resultatAttendu}
            onChange={(e) => setFormData({ ...formData, resultatAttendu: e.target.value })}
            style={styles.textarea}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Résultat obtenu</label>
          <textarea
            placeholder="Résultat Obtenu"
            value={formData.resultatObtenu}
            onChange={(e) => setFormData({ ...formData, resultatObtenu: e.target.value })}
            style={styles.textarea}
          />
        </div>
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Commentaires</label>
        <textarea
          placeholder="Commentaires"
          value={formData.commentaires}
          onChange={(e) => setFormData({ ...formData, commentaires: e.target.value })}
          style={styles.textarea}
        />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Image (capture d'écran)</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={styles.fileInput}
        />
        {imagePreview && (
          <div style={styles.imagePreview}>
            <img src={imagePreview} alt="Preview" style={styles.previewImg} />
            <button 
              type="button" 
              onClick={() => { 
                setFormData({ ...formData, image: '' }); 
                setImagePreview(null); 
              }}
              style={styles.removeImageBtn}
            >
              ×
            </button>
          </div>
        )}
      </div>
      <div style={styles.formActions}>
        <button type="submit" style={styles.primaryButton}>
          Ajouter
        </button>
      </div>
    </form>
  );

  return (
    <div style={styles.container}>
      <div style={styles.main}>
        <h1 style={styles.pageTitle}>
          <FontAwesomeIcon icon={faFilePdf} /> Tests
        </h1>
        <p style={styles.pageSubtitle}>
          Gérez vos cas de test et sessions de test
        </p>

        {message.text && (
          <div style={message.type === 'success' ? styles.success : styles.error}>
            {message.text}
          </div>
        )}

        {/* Sessions Section */}
        <div style={styles.formSection}>
          <h2 style={styles.sectionTitle}>Sessions de Test</h2>
          
          <div style={styles.sessionControls}>
            <div style={styles.headerLeft}>
              <button style={styles.newSessionButton} onClick={() => { 
                if (formDisplayMode === 'modal') {
                  setShowSessionModal(true);
                } else {
                  setShowInlineForm(!showInlineForm);
                }
              }}>
                <FontAwesomeIcon icon={faPlus} /> Nouvelle Session
              </button>
              <button 
                style={styles.toggleModeButton}
                onClick={() => {
                  setFormDisplayMode(formDisplayMode === 'modal' ? 'inline' : 'modal');
                  setShowSessionModal(false);
                  setShowInlineForm(false);
                }}
              >
                {formDisplayMode === 'modal' ? '📋' : '🗂️'}
              </button>
            </div>
          </div>

          {/* Modal for session creation */}
          {showSessionModal && (
            <div style={styles.modal}>
              <div style={styles.modalContent}>
                <span style={styles.close} onClick={() => setShowSessionModal(false)}>&times;</span>
                <h3 style={styles.modalTitle}>Nouvelle session de test</h3>
                <form onSubmit={handleCreateSession}>
                  {renderSessionForm()}
                </form>
              </div>
            </div>
          )}

          {/* Inline form for session creation */}
          {showInlineForm && (
            <div style={styles.inlineFormContainer}>
              <div style={styles.inlineFormHeader}>
                <h3 style={styles.inlineFormTitle}>Nouvelle session de test</h3>
                <button style={styles.inlineCloseButton} onClick={() => setShowInlineForm(false)}>
                  ×
                </button>
              </div>
              <form onSubmit={handleCreateSession} style={styles.inlineForm}>
                {renderSessionForm()}
              </form>
            </div>
          )}

          {/* Sessions List */}
          <div style={styles.sessionsGrid}>
            {sessions.map(session => (
              <div key={session.id} style={styles.sessionCard}>
                <div style={styles.sessionHeader}>
                  <h3 style={styles.sessionTitle}>{session.nom}</h3>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: session.statut === 'Terminé' ? '#28a745' : '#ffc107'
                  }}>
                    {session.statut}
                  </span>
                </div>
                <p style={styles.sessionDesc}>{session.description}</p>
                <div style={styles.sessionStats}>
                  <span>Total: {session.total_tests}</span>
                  <span>OK: {session.tests_ok}</span>
                  <span>BUG: {session.tests_bug}</span>
                </div>
                <div style={styles.sessionActions}>
                  <button
                    style={styles.viewButton}
                    onClick={() => setSelectedSession(session.id)}
                  >
                    <FontAwesomeIcon icon={faEye} /> Voir
                  </button>
                  <button
                    style={styles.exportButton}
                    onClick={() => window.print()}
                  >
                    <FontAwesomeIcon icon={faFilePdf} /> Exporter
                  </button>
                  <button
                    style={styles.deleteButton}
                    onClick={() => handleDeleteSession(session.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tests Section */}
        {selectedSession && (
          <div style={styles.formSection}>
            <h2 style={styles.sectionTitle}>
              Tests de la session
              <button
                style={styles.backButton}
                onClick={() => setSelectedSession(null)}
              >
                <FontAwesomeIcon icon={faTimes} /> Retour
              </button>
            </h2>
            
            {renderTestForm()}

            {/* Tests List */}
            <div style={styles.tableSection}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Fonction</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tests
                    .filter(test => test.sessionId === selectedSession)
                    .map(test => (
                      <tr key={test.id}>
                        <td>{test.fonction}</td>
                        <td>
                          <span style={{
                            ...styles.statutOk,
                            backgroundColor: test.statut === 'OK' ? '#28a745' :
                                           test.statut === 'BUG' ? '#dc3545' :
                                           test.statut === 'EN COURS' ? '#ffc107' : '#6c757d'
                          }}>
                            {test.statut}
                          </span>
                        </td>
                        <td>
                          <button
                            style={styles.secondaryButton}
                            onClick={() => handleEditTest(test)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            style={styles.deleteButton}
                            onClick={() => handleDeleteTest(test.id)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Test Modal */}
        {showEditModal && editingTest && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <span style={styles.close} onClick={() => {
                setShowEditModal(false);
                setEditingTest(null);
              }}>&times;</span>
              <h3 style={styles.modalTitle}>Modifier le test</h3>
              <form onSubmit={handleUpdateTest}>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Fonction *</label>
                    <input
                      type="text"
                      placeholder="Fonction"
                      value={formData.fonction}
                      onChange={(e) => setFormData({ ...formData, fonction: e.target.value })}
                      style={styles.input}
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Statut *</label>
                    <select
                      value={formData.statut}
                      onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                      style={styles.select}
                      required
                    >
                      <option value="">Sélectionner...</option>
                      <option value="OK">OK</option>
                      <option value="BUG">BUG</option>
                      <option value="EN COURS">EN COURS</option>
                      <option value="BLOQUE">BLOQUE</option>
                    </select>
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Précondition</label>
                  <textarea
                    placeholder="Précondition"
                    value={formData.precondition}
                    onChange={(e) => setFormData({ ...formData, precondition: e.target.value })}
                    style={styles.textarea}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Étapes</label>
                  <textarea
                    placeholder="Étapes"
                    value={formData.etapes}
                    onChange={(e) => setFormData({ ...formData, etapes: e.target.value })}
                    style={styles.textarea}
                  />
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Résultat attendu</label>
                    <textarea
                      placeholder="Résultat Attendu"
                      value={formData.resultatAttendu}
                      onChange={(e) => setFormData({ ...formData, resultatAttendu: e.target.value })}
                      style={styles.textarea}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Résultat obtenu</label>
                    <textarea
                      placeholder="Résultat Obtenu"
                      value={formData.resultatObtenu}
                      onChange={(e) => setFormData({ ...formData, resultatObtenu: e.target.value })}
                      style={styles.textarea}
                    />
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Commentaires</label>
                  <textarea
                    placeholder="Commentaires"
                    value={formData.commentaires}
                    onChange={(e) => setFormData({ ...formData, commentaires: e.target.value })}
                    style={styles.textarea}
                  />
                </div>
                <div style={styles.formActions}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingTest(null);
                    }}
                    style={styles.secondaryButton}
                  >
                    Annuler
                  </button>
                  <button type="submit" style={styles.primaryButton}>
                    Mettre à jour
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { backgroundColor: 'var(--bg-primary)', minHeight: '100vh' },
  main: { padding: '20px', maxWidth: '1400px', margin: '0 auto', minHeight: 'calc(100vh - 70px)' },
  pageTitle: { fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' },
  pageSubtitle: { fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', fontWeight: '400' },
  formSection: { backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: '10px', marginBottom: '16px', boxShadow: '0 2px 8px var(--shadow-color)', border: '1px solid var(--border-light)' },
  tableSection: { backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: '10px', boxShadow: '0 2px 8px var(--shadow-color)', border: '1px solid var(--border-light)' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '2px solid var(--border-light)' },
  modalTitle: { fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 16px 0' },
  form: { display: 'flex', gap: '12px', flexWrap: 'wrap' as const },
  input: { padding: '4px 6px', border: '1px solid var(--border-color)', borderRadius: '3px', flex: '1 1 100px', fontSize: '11px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', maxWidth: '100%', transition: 'border-color 0.2s, box-shadow 0.2s' },
  textarea: { padding: '4px 6px', border: '1px solid var(--border-color)', borderRadius: '3px', flex: '1 1 100px', fontSize: '11px', minHeight: '35px', maxHeight: '50px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', resize: 'vertical' as const, width: '100%', overflow: 'auto', transition: 'border-color 0.2s, box-shadow 0.2s' },
  select: { padding: '4px 6px', border: '1px solid var(--border-color)', borderRadius: '3px', flex: '1 1 100px', fontSize: '11px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', cursor: 'pointer', transition: 'border-color 0.2s' },
  label: { display: 'block', marginBottom: '2px', fontSize: '10px', fontWeight: '600', color: 'var(--text-secondary)' },
  fileInput: { padding: '4px', border: '1px solid var(--border-color)', borderRadius: '3px', width: '100%', fontSize: '11px', backgroundColor: 'var(--bg-card)' },
  imagePreview: { position: 'relative', marginTop: '10px', display: 'inline-block' },
  previewImg: { maxWidth: '150px', maxHeight: '100px', borderRadius: '6px', border: '2px solid var(--info-color)' },
  removeImageBtn: { position: 'absolute', top: '-8px', right: '-8px', backgroundColor: 'var(--danger-color)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '14px', lineHeight: '1' },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' },
  primaryButton: { padding: '8px 16px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s ease' },
  secondaryButton: { padding: '8px 16px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s ease' },
  deleteButton: { padding: '8px 14px', backgroundColor: 'var(--danger-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', transition: 'opacity 0.2s' },
  table: { width: '100%', borderCollapse: 'collapse' as const, borderRadius: '8px', overflow: 'hidden' },
  success: { padding: '14px', backgroundColor: 'var(--success-color)', color: 'white', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' },
  error: { padding: '14px', backgroundColor: 'var(--danger-color)', color: 'white', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' },
  statutOk: { padding: '6px 12px', backgroundColor: 'var(--success-color)', color: 'white', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  statutBug: { padding: '6px 12px', backgroundColor: 'var(--danger-color)', color: 'white', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  statutEnCours: { padding: '6px 12px', backgroundColor: 'var(--warning-color)', color: 'white', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  statutBloque: { padding: '6px 12px', backgroundColor: 'var(--text-muted)', color: 'white', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  modal: { position: 'fixed' as const, top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, overflowY: 'auto' as const, backdropFilter: 'blur(8px)' },
  modalContent: { backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '16px', width: '95%', maxWidth: '600px', position: 'relative' as const, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '2px solid var(--primary-color)' },
  close: { position: 'absolute' as const, top: '6px', right: '10px', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 0.2s', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' },
  formGroup: { marginBottom: '12px', flex: '1 1 100%' as const, minWidth: '100%' },
  formRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' as const, width: '100%' },
  sessionControls: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' as const },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1 },
  newSessionButton: { padding: '12px 20px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(52, 152, 219, 0.3)' },
  toggleModeButton: { padding: '8px 12px', backgroundColor: 'var(--hover-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', transition: 'all 0.2s ease', marginLeft: '8px' },
  inlineFormContainer: { backgroundColor: 'var(--bg-card)', border: '2px solid var(--primary-color)', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 8px 24px rgba(52, 152, 219, 0.15)', animation: 'slideDown 0.3s ease' },
  inlineFormHeader: { padding: '16px 20px', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '10px 10px 0 0' },
  inlineFormTitle: { margin: 0, fontSize: '16px', fontWeight: '600' },
  inlineCloseButton: { width: '28px', height: '28px', borderRadius: '6px', border: 'none', backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' },
  inlineForm: { padding: '20px' },
  sessionsGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(3, 1fr)', 
    gap: '16px',
    padding: '0 20px',
    width: '100%'
  },
  sessionCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '24px',
    border: '1px solid #e1e5e9',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.3s ease',
    position: 'relative' as const,
    minHeight: '280px',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer'
  },
  sessionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '8px' },
  sessionTitle: { margin: 0, color: '#1a1a1a', fontSize: '18px', fontWeight: '700', flex: 1, lineHeight: '1.3' },
  statusBadge: { padding: '6px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', color: 'white', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  sessionDesc: { color: '#6b7280', fontSize: '14px', marginBottom: '16px', lineHeight: '1.5', minHeight: '40px', flex: 1 },
  sessionStats: { display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '16px', fontSize: '13px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' },
  sessionActions: { display: 'flex', gap: '8px', marginTop: 'auto' },
  viewButton: { padding: '10px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', flex: 1, fontWeight: '600', fontSize: '13px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)' },
  exportButton: { padding: '10px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)' },
  backButton: { padding: '10px 16px', backgroundColor: 'var(--text-muted)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', transition: 'opacity 0.2s' },
};

export default Tests;
