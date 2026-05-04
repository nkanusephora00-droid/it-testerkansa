import React, { useEffect, useState, useCallback } from 'react';
import { testsAPI, applicationsAPI, api, testSessionsAPI, Application, Test, TestSession } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEye, faFilePdf, faCheck, faTimes, faPlus, faEdit, faCompress, faExpand, faWindowMaximize, faLayerGroup, faMobileAlt } from '@fortawesome/free-solid-svg-icons';
import { consolidateSessionsByUser, consolidateAllSessions, ConsolidatedSession } from '../utils/sessionConsolidation';
import SlideInPanel from '../components/SlideInPanel';
import InlineForm from '../components/InlineForm';
import BottomSheet from '../components/BottomSheet';
import './SlideInPanel.css';
import './BottomSheet.css';
import './InlineForm.css';

const Tests: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [allSessions, setAllSessions] = useState<TestSession[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [view, setView] = useState<'sessions' | 'tests'>('sessions');
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [consolidationMode, setConsolidationMode] = useState<'none' | 'byUser' | 'global'>('none');
  const [consolidatedSessions, setConsolidatedSessions] = useState<ConsolidatedSession[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<number[]>([]);
  const [selectionMode, setSelectionMode] = useState<boolean>(false);
  
  // Récupérer le rôle de l'utilisateur
  const userRole = localStorage.getItem('user_role');
  const isAdmin = userRole === 'admin';
  console.log('User role:', userRole, 'Is admin:', isAdmin);

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'Terminé':
        return '#28a745';
      case 'BUG':
        return '#dc3545';
      case 'En cours':
      default:
        return '#ffc107';
    }
  };
  
  // Session form state
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [formDisplayMode, setFormDisplayMode] = useState<'modal' | 'inline'>('modal');
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [sessionForm, setSessionForm] = useState({ 
    nom: '', 
    description: '', 
    nom_document: '',
    applicationId: 0,
    statut: 'En cours' 
  });
  
  // Test form state
  const [formData, setFormData] = useState({
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

  // Image preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Edit test states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);

  // Pré-remplir le formulaire avec les valeurs de la session sélectionnée
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
      if (isAdmin) {
        await fetchUsers();
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') { console.error(err); }
      setMessage({ type: 'error', text: 'Erreur de chargement' });
    }
  }, [isAdmin]);

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

  async function fetchUsers() {
    try {
      console.log('Fetching users...');
      const response = await api.get('/users');
      console.log('Users API response:', response.data);
      setUsers(Array.isArray(response.data) ? response.data : []);
      console.log('Users set:', Array.isArray(response.data) ? response.data.length : 'not an array');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching users:', err);
      }
      setUsers([]);
    }
  };

  const handleConsolidateByUser = () => {
    const sessionsToConsolidate = selectedSessions.length > 0 
      ? allSessions.filter(s => selectedSessions.includes(s.id))
      : allSessions;
    
    if (sessionsToConsolidate.length === 0) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner au moins une session à consolider' });
      return;
    }
    
    const consolidated = consolidateSessionsByUser(sessionsToConsolidate);
    setConsolidatedSessions(consolidated);
    setConsolidationMode('byUser');
    setSelectionMode(false);
    setSelectedSessions([]);
    setMessage({ type: 'success', text: `Consolidation par utilisateur: ${consolidated.length} session(s) créée(s) à partir de ${sessionsToConsolidate.length} session(s) sélectionnée(s)` });
  };

  const handleConsolidateGlobal = () => {
    const sessionsToConsolidate = selectedSessions.length > 0 
      ? allSessions.filter(s => selectedSessions.includes(s.id))
      : allSessions;
    
    if (sessionsToConsolidate.length === 0) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner au moins une session à consolider' });
      return;
    }
    
    const globalSession = consolidateAllSessions(sessionsToConsolidate);
    setConsolidatedSessions([globalSession]);
    setConsolidationMode('global');
    setSelectionMode(false);
    setSelectedSessions([]);
    setMessage({ type: 'success', text: `Consolidation globale: 1 session créée avec ${globalSession.total_tests} tests à partir de ${sessionsToConsolidate.length} session(s) sélectionnée(s)` });
  };

  const handleResetConsolidation = () => {
    setConsolidationMode('none');
    setConsolidatedSessions([]);
    setSessions(allSessions);
    setMessage({ type: 'info', text: 'Affichage des sessions normales réactivé' });
  };

  const handleToggleSessionSelection = (sessionId: number) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const handleSelectAllSessions = () => {
    setSelectedSessions(allSessions.map(s => s.id));
  };

  const handleClearSelection = () => {
    setSelectedSessions([]);
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedSessions([]);
  };

  const handleViewConsolidatedSession = (consolidated: ConsolidatedSession) => {
    // Créer une session temporaire pour les tests consolidés
    const tempSession: TestSession = {
      id: consolidated.id,
      nom: consolidated.nom,
      description: consolidated.description,
      date_creation: consolidated.date_creation,
      statut: consolidated.statut,
      created_by: consolidated.userId,
      createdByUsername: consolidated.username,
      tests: consolidated.consolidatedTests,
      total_tests: consolidated.total_tests,
      tests_ok: consolidated.tests_ok,
      tests_bug: consolidated.tests_bug,
      tests_en_cours: consolidated.tests_en_cours
    };
    
    setSelectedSession(consolidated.id);
    setView('tests');
    
    // Stocker temporairement les données consolidées pour l'affichage
    (window as any).tempConsolidatedSession = tempSession;
  };

  const handleExportConsolidatedPDF = (consolidated: ConsolidatedSession) => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('fr-FR', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${consolidated.nom}</title>
        <style>
          @page { 
            size: A4 landscape;
            margin: 15mm; 
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { height: auto; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #333; font-size: 14px; line-height: 1.4; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #2c3e50; padding-bottom: 12px; page-break-after: avoid; }
          .header h1 { font-size: 22px; color: #2c3e50; margin-bottom: 8px; }
          .session-name { font-size: 14px; color: #7f8c8d; margin-top: 4px; font-style: italic; }
          .session-info { display: flex; justify-content: center; gap: 25px; margin: 12px 0; flex-wrap: wrap; }
          .info-item { text-align: center; }
          .info-label { font-size: 10px; color: #7f8c8d; text-transform: uppercase; font-weight: 600; }
          .info-value { font-size: 13px; font-weight: 600; color: #2c3e50; }
          .stats { display: flex; justify-content: center; gap: 12px; margin-bottom: 15px; flex-wrap: wrap; }
          .stat-box { padding: 8px 15px; border-radius: 6px; text-align: center; }
          .stat-total { background: #3498db; color: white; }
          .stat-ok { background: #27ae60; color: white; }
          .stat-bug { background: #e74c3c; color: white; }
          .stat-encours { background: #f39c12; color: white; }
          .consolidation-info { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; margin: 15px 0; }
          .consolidation-title { font-weight: 600; color: #495057; margin-bottom: 8px; }
          .original-sessions { font-size: 12px; color: #6c757d; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
          th { background-color: #f8f9fa; font-weight: 600; }
          tr:nth-child(even) { background-color: #f8f9fa; }
          .statut-ok { color: #27ae60; font-weight: 600; }
          .statut-bug { color: #e74c3c; font-weight: 600; }
          .statut-encours { color: #f39c12; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Rapport de Tests Consolidés</h1>
          <div class="session-name">${consolidated.nom}</div>
        </div>
        
        <div class="session-info">
          <div class="info-item">
            <div class="info-label">Utilisateur</div>
            <div class="info-value">${consolidated.username}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Date</div>
            <div class="info-value">${new Date(consolidated.date_creation).toLocaleDateString('fr-FR')}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Statut</div>
            <div class="info-value">${consolidated.statut}</div>
          </div>
        </div>

        <div class="stats">
          <div class="stat-box stat-total">
            <div>Total: ${consolidated.total_tests}</div>
          </div>
          <div class="stat-box stat-ok">
            <div>OK: ${consolidated.tests_ok}</div>
          </div>
          <div class="stat-box stat-bug">
            <div>BUG: ${consolidated.tests_bug}</div>
          </div>
          <div class="stat-box stat-encours">
            <div>En cours: ${consolidated.tests_en_cours}</div>
          </div>
        </div>

        <div class="consolidation-info">
          <div class="consolidation-title">Information de Consolidation</div>
          <div>Cette session consolidée fusionne ${consolidated.originalSessions.length} session(s) originale(s)</div>
          <div class="original-sessions">
            Sessions originales: ${consolidated.originalSessions.map(s => s.nom).join(', ')}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Fonction</th>
              <th>Précondition</th>
              <th>Étapes</th>
              <th>Résultat Attendu</th>
              <th>Résultat Obtenu</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            ${consolidated.consolidatedTests.map((test: Test) => `
              <tr>
                <td>${test.fonction || ''}</td>
                <td>${test.precondition || ''}</td>
                <td>${test.etapes || ''}</td>
                <td>${test.resultatAttendu || ''}</td>
                <td>${test.resultatObtenu || ''}</td>
                <td class="statut-${test.statut?.toLowerCase().replace(' ', '')}">${test.statut || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 20px; text-align: center; color: #7f8c8d; font-size: 12px;">
          Généré le ${formattedDate} - Session consolidée de ${consolidated.username}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
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
      setSessionForm({ nom: '', description: '', nom_document: '', applicationId: 0, statut: 'En cours' });
      fetchSessions();
      // Automatically select the newly created session
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
        setView('sessions');
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
    }
  };

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Filter out 0/empty values for optional fields and prepare data
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
      // Réinitialiser tous les champs du formulaire après la soumission
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
      setShowTestForm(false);
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
      const error = err as { response?: { data?: { detail?: string | unknown[] } } };
      const detail = error.response?.data?.detail;
      let errorText = 'Erreur';
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
      fonction: test.fonction,
      precondition: test.precondition,
      etapes: test.etapes,
      resultatAttendu: test.resultatAttendu,
      resultatObtenu: test.resultatObtenu,
      statut: test.statut,
      commentaires: test.commentaires,
      image: test.image || ''
    });
    setImagePreview(test.image || null);
    setShowEditModal(true);
  };

  const handleUpdateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTest) return;
    
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
      
      await testsAPI.update(editingTest.id, testData);
      setMessage({ type: 'success', text: 'Test modifié avec succès!' });
      setShowEditModal(false);
      setEditingTest(null);
      setImagePreview(null);
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
      fetchData();
      fetchSessions();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string | unknown[] } } };
      const detail = error.response?.data?.detail;
      let errorText = 'Erreur lors de la modification';
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

  const getSessionTests = (sessionId: number) => {
    // Vérifier si c'est une session consolidée
    const tempConsolidated = (window as any).tempConsolidatedSession;
    if (tempConsolidated && tempConsolidated.id === sessionId) {
      return tempConsolidated.tests || [];
    }
    
    // Sinon, retourner les tests normaux
    return tests.filter(t => t.sessionId === sessionId);
  };

  const getStatutClass = (statut: string) => {
    switch(statut) {
      case 'OK': return styles.statutOk;
      case 'BUG': return styles.statutBug;
      case 'EN COURS': return styles.statutEnCours;
      case 'BLOQUE': return styles.statutBloque;
      default: return {};
    }
  };

  const handleExportSessionPDF = (session: TestSession) => {
    const sessionTests = getSessionTests(session.id);
    const today = new Date();
    const formattedDate = today.toLocaleDateString('fr-FR', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${session.applicationNom || session.nom}</title>
        <style>
          @page { 
            size: A4 landscape;
            margin: 15mm; 
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { height: auto; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #333; font-size: 14px; line-height: 1.4; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #2c3e50; padding-bottom: 12px; page-break-after: avoid; }
          .header h1 { font-size: 22px; color: #2c3e50; margin-bottom: 8px; }
          .session-name { font-size: 14px; color: #7f8c8d; margin-top: 4px; font-style: italic; }
          .session-info { display: flex; justify-content: center; gap: 25px; margin: 12px 0; flex-wrap: wrap; }
          .info-item { text-align: center; }
          .info-label { font-size: 10px; color: #7f8c8d; text-transform: uppercase; font-weight: 600; }
          .info-value { font-size: 13px; font-weight: 600; color: #2c3e50; }
          .stats { display: flex; justify-content: center; gap: 12px; margin-bottom: 15px; flex-wrap: wrap; }
          .stat-box { padding: 8px 15px; border-radius: 6px; text-align: center; }
          .stat-total { background: #3498db; color: white; }
          .stat-ok { background: #27ae60; color: white; }
          .stat-bug { background: #e74c3c; color: white; }
          .stat-en-cours { background: #f39c12; color: white; }
          table { width: 100%; border-collapse: collapse; font-size: 14px; page-break-inside: auto; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          th { background: #2c3e50; color: white; padding: 8px 6px; text-align: left; font-size: 12px; }
          td { padding: 8px 6px; border-bottom: 1px solid #ddd; vertical-align: top; font-size: 11px; }
          tr:nth-child(even) { background: #f8f9fa; }
          .statut-ok { background: #27ae60; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; }
          .statut-bug { background: #e74c3c; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; }
          .statut-en-cours { background: #f39c12; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; }
          .statut-bloque { background: #6c757d; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; }
          .footer { margin-top: 15px; text-align: center; color: #7f8c8d; font-size: 10px; border-top: 1px solid #ddd; padding-top: 8px; page-break-before: avoid; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${session.applicationNom || session.nom}</h1>
          ${session.nom ? `<div class="session-name">Session: ${session.nom}</div>` : ''}
          <div class="session-info">
            <div class="info-item">
              <div class="info-label">Date</div>
              <div class="info-value">${formattedDate}</div>
            </div>
            ${session.environnement ? `<div class="info-item"><div class="info-label">Environnement</div><div class="info-value">${session.environnement}</div></div>` : ''}
            ${session.version ? `<div class="info-item"><div class="info-label">Version</div><div class="info-value">${session.version}</div></div>` : ''}
            <div class="info-item">
              <div class="info-label">Statut</div>
              <div class="info-value">${session.statut}</div>
            </div>
          </div>
        </div>
        <div class="stats">
          <div class="stat-box stat-total"><strong>${sessionTests.length}</strong><br/>Total</div>
          <div class="stat-box stat-ok"><strong>${sessionTests.filter((t: Test) => t.statut === 'OK').length}</strong><br/>OK</div>
          <div class="stat-box stat-bug"><strong>${sessionTests.filter((t: Test) => t.statut === 'BUG').length}</strong><br/>BUG</div>
          <div class="stat-box stat-en-cours"><strong>${sessionTests.filter((t: Test) => t.statut === 'EN COURS').length}</strong><br/>En Cours</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Fonction</th>
              <th>Précondition</th>
              <th>Étapes</th>
              <th>Résultat Attendu</th>
              <th>Résultat Obtenu</th>
              <th>Statut</th>
              <th>Commentaires</th>
            </tr>
          </thead>
          <tbody>
            ${sessionTests.map((test: Test) => `
              <tr>
                <td>${test.id}</td>
                <td>${test.fonction || '-'}</td>
                <td>${test.precondition || '-'}</td>
                <td>${test.etapes || '-'}</td>
                <td>${test.resultatAttendu || '-'}</td>
                <td>${test.resultatObtenu || '-'}</td>
                <td><span class="statut-${test.statut.toLowerCase().replace(' ', '-')}">${test.statut}</span></td>
                <td>${test.commentaires || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">IT Access Manager - Document de test</div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    }
  };

  // Render Sessions List
  const renderSessions = () => (
    <div>
      <div style={styles.sessionsHeader}>
        <div style={styles.headerLeft}>
          {isAdmin && (
            <div style={styles.userFilter}>
              <label style={styles.filterLabel}>Filtrer par utilisateur:</label>
              <select 
                value={selectedUser || ''} 
                onChange={(e) => setSelectedUser(e.target.value ? Number(e.target.value) : null)}
                style={styles.filterSelect}
              >
                <option value="">Tous les utilisateurs</option>
                {(() => {
                  console.log('Rendering users filter, users:', users);
                  console.log('Users length:', users?.length);
                  console.log('Is users array?', Array.isArray(users));
                  
                  // Test avec des données factices si le tableau est vide
                  const usersToRender = Array.isArray(users) && users.length > 0 ? users : [
                    { id: 1, username: 'Test User 1' },
                    { id: 2, username: 'Test User 2' }
                  ];
                  
                  return usersToRender.map(user => (
                    <option key={user.id} value={user.id}>{user.username}</option>
                  ));
                })()}
              </select>
            </div>
          )}
          {isAdmin && (
            <div style={styles.consolidationButtons}>
              {consolidationMode === 'none' ? (
                <>
                  <button 
                    style={{...styles.consolidationButton, backgroundColor: selectionMode ? '#dc3545' : '#6c757d'}} 
                    onClick={handleToggleSelectionMode}
                    title={selectionMode ? "Arrêter la sélection" : "Sélectionner des sessions"}
                  >
                    <FontAwesomeIcon icon={faCompress} /> {selectionMode ? 'Sélection active' : 'Sélectionner'}
                  </button>
                  {selectionMode && (
                    <>
                      <button 
                        style={styles.consolidationButton} 
                        onClick={handleSelectAllSessions}
                        title="Tout sélectionner"
                      >
                        Tout
                      </button>
                      <button 
                        style={styles.consolidationButton} 
                        onClick={handleClearSelection}
                        title="Effacer la sélection"
                      >
                        Effacer
                      </button>
                      <span style={styles.selectionInfo}>
                        {selectedSessions.length} session(s) sélectionnée(s)
                      </span>
                    </>
                  )}
                  <button 
                    style={styles.consolidationButton} 
                    onClick={handleConsolidateByUser}
                    title="Consolider par utilisateur"
                    disabled={selectionMode && selectedSessions.length === 0}
                  >
                    <FontAwesomeIcon icon={faCompress} /> Par utilisateur
                  </button>
                  <button 
                    style={styles.consolidationButton} 
                    onClick={handleConsolidateGlobal}
                    title="Consolider globalement"
                    disabled={selectionMode && selectedSessions.length === 0}
                  >
                    <FontAwesomeIcon icon={faCompress} /> Global
                  </button>
                </>
              ) : (
                <button 
                  style={styles.resetButton} 
                  onClick={handleResetConsolidation}
                  title="Réinitialiser la consolidation"
                >
                  <FontAwesomeIcon icon={faExpand} /> Réinitialiser
                </button>
              )}
            </div>
          )}
        </div>
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
          title={formDisplayMode === 'modal' ? 'Passer en mode intégré' : 'Passer en mode modal'}
        >
          {formDisplayMode === 'modal' ? '📋' : '🖼️'}
        </button>
      </div>
      <div style={styles.sessionsGrid}>
        {consolidationMode !== 'none' ? (
          consolidatedSessions.map(consolidated => (
            <div key={consolidated.id} style={{...styles.sessionCard, border: '2px solid #007bff', backgroundColor: '#f8f9ff'}}>
              <div style={styles.sessionHeader}>
                <h3 style={styles.sessionTitle}>{consolidated.nom}</h3>
                <span style={{...styles.statusBadge, backgroundColor: getStatusColor(consolidated.statut)}}>
                  {consolidated.statut}
                </span>
              </div>
              <p style={styles.sessionDescription}>{consolidated.description}</p>
              <div style={styles.sessionMeta}>
                <span><strong>Utilisateur:</strong> {consolidated.username}</span>
                <span><strong>Tests:</strong> {consolidated.total_tests}</span>
                <span><strong>OK:</strong> {consolidated.tests_ok}</span>
                <span><strong>BUG:</strong> {consolidated.tests_bug}</span>
                <span><strong>En cours:</strong> {consolidated.tests_en_cours}</span>
              </div>
              <div style={styles.sessionMeta}>
                <span><strong>Sessions originales:</strong> {consolidated.originalSessions.length}</span>
                <span><strong>Créé le:</strong> {new Date(consolidated.date_creation).toLocaleDateString()}</span>
              </div>
              <div style={styles.sessionActions}>
                <button 
                  style={styles.viewButton}
                  onClick={() => handleViewConsolidatedSession(consolidated)}
                  title="Voir les détails"
                >
                  <FontAwesomeIcon icon={faEye} /> Voir les tests
                </button>
                <button 
                  style={styles.exportButton}
                  onClick={() => handleExportConsolidatedPDF(consolidated)}
                  title="Exporter en PDF"
                >
                  <FontAwesomeIcon icon={faFilePdf} /> PDF
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={styles.sessionsGrid}>
            {sessions.map((session) => (
            <div key={session.id} style={{
              ...styles.sessionCard, 
              ...(selectionMode && selectedSessions.includes(session.id) ? { border: '2px solid #007bff', backgroundColor: '#f8f9ff' } : {}),
              ...(selectionMode ? { cursor: 'pointer' } : {})
            }}>
              {selectionMode && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  zIndex: 10,
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  padding: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '2px solid #e1e5e9'
                }}>
                  <input 
                    type="checkbox"
                    checked={selectedSessions.includes(session.id)}
                    onChange={() => handleToggleSessionSelection(session.id)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      accentColor: '#3b82f6',
                      margin: '0'
                    }}
                  />
                </div>
              )}
              <div style={styles.sessionHeader}>
                <h3 style={styles.sessionTitle}>{session.nom}</h3>
                <span style={{...styles.statusBadge, backgroundColor: getStatusColor(session.statut)}}>
                  {session.statut}
                </span>
              </div>
              {session.createdByUsername && (
                <p style={styles.sessionOwner}><i className="fas fa-user"></i> Créé par: {session.createdByUsername}</p>
              )}
              <p style={styles.sessionDesc}>{session.description || 'Aucune description'}</p>
              {session.nom_document && (
                <p style={styles.sessionInfo}><i className="fas fa-file"></i> Document: {session.nom_document}</p>
              )}
              <div style={styles.sessionStats}>
                <span>Total: {getSessionTests(session.id).length}</span>
                <span style={styles.statOk}><FontAwesomeIcon icon={faCheck} /> {getSessionTests(session.id).filter((t: Test) => t.statut === 'OK').length}</span>
                <span style={styles.statBug}><FontAwesomeIcon icon={faTimes} /> {getSessionTests(session.id).filter((t: Test) => t.statut === 'BUG').length}</span>
              </div>
              <div style={styles.sessionActions}>
                <button 
                  style={styles.viewButton} 
                  onClick={() => {
                    setSelectedSession(session.id);
                    setView('tests');
                  }}
                >
                  <FontAwesomeIcon icon={faEye} /> Voir les tests
                </button>
                <button 
                  style={styles.exportButton} 
                  onClick={() => {
                    handleExportSessionPDF(session);
                  }}
                >
                  <FontAwesomeIcon icon={faFilePdf} /> PDF
                </button>
                {session.statut !== 'Terminé' && (
                  <button 
                    style={{...styles.deleteButton, padding: '8px 12px', backgroundColor: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b'}} 
                    onClick={() => {
                      handleDeleteSession(session.id);
                    }} 
                    title="Supprimer"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );

  // Render Tests for selected session
  const renderTests = () => {
    const sessionTests = selectedSession ? getSessionTests(selectedSession) : tests;
    const currentSession = sessions.find(s => s.id === selectedSession);
    
    return (
      <div>
        <button style={styles.backButton} onClick={() => { setSelectedSession(null); setView('sessions'); }}>
          <i className="fas fa-arrow-left"></i> Retour aux sessions
        </button>
        
        {currentSession && (
          <div style={styles.currentSessionInfo}>
            <h3><i className="fas fa-file-alt"></i> {currentSession.nom}</h3>
            <p>{currentSession.description}</p>
            {currentSession.nom_document && <p style={styles.sessionInfo}><i className="fas fa-file"></i> Document: {currentSession.nom_document}</p>}
          </div>
        )}

        <div style={styles.formSection}>
          <button 
            style={styles.addTestButton} 
            onClick={() => {
              // Pré-remplir le formulaire avec les infos de la session
              const currentSession = sessions.find(s => s.id === selectedSession);
              if (currentSession) {
                setFormData({
                  sessionId: selectedSession || 0,
                  applicationId: currentSession.applicationId || 0,
                  fonction: '',
                  precondition: '',
                  etapes: '',
                  resultatAttendu: '',
                  resultatObtenu: '',
                  statut: '',
                  commentaires: '',
                  image: ''
                });
              }
              setShowTestForm(true);
            }}
          >
            <FontAwesomeIcon icon={faPlus} /> Ajouter un test
          </button>
        </div>

        <div style={styles.tableSection}>
          <div style={styles.testsHeader}>
            <div>
              <h3 style={styles.sectionTitle}>Tests de la session</h3>
              <p style={styles.testsSubtitle}>
                {sessionTests.length === 0
                  ? 'Aucun test enregistré pour cette session.'
                  : `${sessionTests.length} test${sessionTests.length > 1 ? 's' : ''} au total.`}
              </p>
            </div>
          </div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Fonction</th>
                <th>Précondition</th>
                <th>Étapes</th>
                <th>Résultat Attendu</th>
                <th>Résultat Obtenu</th>
                <th>Statut</th>
                <th>Commentaires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessionTests.map((test: Test) => (
                <tr key={test.id}>
                  <td>{test.id}</td>
                  <td>{test.fonction}</td>
                  <td>{test.precondition || '-'}</td>
                  <td>{test.etapes || '-'}</td>
                  <td>{test.resultatAttendu || '-'}</td>
                  <td>{test.resultatObtenu || '-'}</td>
                  <td><span style={getStatutClass(test.statut)}>{test.statut}</span></td>
                  <td>{test.commentaires || '-'}</td>
                  <td style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button style={{...styles.editButton, padding: '6px', backgroundColor: 'transparent', color: '#4a90e2'}} onClick={() => handleEditTest(test)} title="Modifier">
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button style={{...styles.deleteButton, padding: '6px', backgroundColor: 'transparent', color: '#ff6b6b'}} onClick={() => handleDeleteTest(test.id)} title="Supprimer">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <div style={styles.sessionsHeader}>
          <div>
            <h2 style={styles.pageTitle}><i className="fas fa-vial"></i> {isAdmin ? 'Gestion des Tests' : 'Mes Sessions de Test'}</h2>
            <p style={styles.pageSubtitle}>{isAdmin ? 'Documents de Test - Planification et suivi des tests' : 'Vos sessions de test personnelles'}</p>
          </div>
        </div>
        
        {message.text && (
          <div style={message.type === 'success' ? styles.success : styles.error}>
            <i className={message.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'}></i>
            {message.text}
          </div>
        )}

        {view === 'sessions' ? renderSessions() : renderTests()}
      </main>

      {/* Formulaire selon le mode sélectionné */}
      {showSessionModal && formDisplayMode === 'modal' && (
        <div style={styles.modal}>
          <div style={{ ...styles.modalContent, ...styles.sessionModalContent }}>
            <span style={styles.close} onClick={() => setShowSessionModal(false)}>&times;</span>
            <div style={styles.modalHeader}>
              <h3 style={styles.sectionTitle}>Nouvelle session de test</h3>
              <p style={styles.modalSubtitle}>
                Créez une session pour regrouper vos cas de test et générer un export PDF.
              </p>
            </div>
            <form onSubmit={handleCreateSession} style={styles.sessionForm}>
              {renderSessionForm()}
            </form>
          </div>
        </div>
      )}

      {showSessionModal && formDisplayMode === 'slidein' && (
        <SlideInPanel
          isOpen={showSessionModal}
          onClose={() => setShowSessionModal(false)}
          title="Nouvelle session de test"
          subtitle="Créez une session pour regrouper vos cas de test et générer un export PDF."
        >
          <form onSubmit={handleCreateSession} style={styles.sessionForm}>
            {renderSessionForm()}
          </form>
        </SlideInPanel>
      )}

      {showSessionModal && formDisplayMode === 'inline' && (
        <InlineForm
          isVisible={showSessionModal}
          onClose={() => setShowSessionModal(false)}
          title="Nouvelle session de test"
        >
          <form onSubmit={handleCreateSession}>
            {renderSessionForm()}
          </form>
        </InlineForm>
      )}

      {showSessionModal && formDisplayMode === 'bottom' && (
        <BottomSheet
          isOpen={showSessionModal}
          onClose={() => setShowSessionModal(false)}
          title="Nouvelle session de test"
        >
          <form onSubmit={handleCreateSession} style={styles.sessionForm}>
            {renderSessionForm()}
          </form>
        </BottomSheet>
      )}

      {/* Formulaire intégré */}
      {showInlineForm && (
        <div style={styles.inlineFormContainer}>
          <div style={styles.inlineFormHeader}>
            <h3 style={styles.inlineFormTitle}>Nouvelle session de test</h3>
            <button style={styles.inlineCloseButton} onClick={() => setShowInlineForm(false)}>
              ×
            </button>
          </div>
          <form onSubmit={handleCreateSession} style={styles.inlineForm}>
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
                onClick={() => setShowInlineForm(false)}
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
          </form>
        </div>
      )}
      
      {/* Modal pour les tests */}
      {showSessionModal && (
        <div style={styles.modal}>
          <div style={{ ...styles.modalContent, ...styles.sessionModalContent }}>
            <span style={styles.close} onClick={() => setShowSessionModal(false)}>&times;</span>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Nouvelle session de test</h2>
            </div>
            <form onSubmit={handleCreateSession} style={styles.sessionForm}>
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
                  onClick={() => setShowSessionModal(false)}
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
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

