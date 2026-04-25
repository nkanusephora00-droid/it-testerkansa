import React, { useEffect, useState } from 'react';
import { api, testsAPI, testSessionsAPI, applicationsAPI, comptesAPI, usersAPI, todosAPI } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faChartPie, faCheckCircle, faTimesCircle, faClock, faUsers, faDatabase, faTasks } from '@fortawesome/free-solid-svg-icons';

interface Stats {
  totalTests: number;
  testsOK: number;
  testsBug: number;
  testsEnCours: number;
  tauxReussite: number;
  totalApps: number;
  totalComptes: number;
  totalUsers: number;
  usersActifs: number;
  pendingTodos: number;
  completedTodos: number;
}

interface TestTrend {
  date: string;
  ok: number;
  bug: number;
}

const Reports: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      const [apps, comptes, tests, sessions, users, todos] = await Promise.all([
        applicationsAPI.getAll(),
        comptesAPI.getAll(),
        testsAPI.getAll(),
        testSessionsAPI.getAll(),
        usersAPI.getAll(),
        todosAPI.getAll()
      ]);

      const testsOK = tests.filter((t: any) => t.statut === 'OK').length;
      const testsBug = tests.filter((t: any) => t.statut === 'BUG').length;
      const testsEnCours = tests.filter((t: any) => t.statut === 'EN COURS').length;
      const totalTests = tests.length;
      const tauxReussite = totalTests > 0 ? Math.round((testsOK / totalTests) * 100) : 0;

      const usersActifs = users.filter((u: any) => u.isActive).length;
      const pendingTodos = todos.filter((t: any) => !t.completed).length;
      const completedTodos = todos.filter((t: any) => t.completed).length;

      setStats({
        totalTests,
        testsOK,
        testsBug,
        testsEnCours,
        tauxReussite,
        totalApps: apps.length,
        totalComptes: comptes.length,
        totalUsers: users.length,
        usersActifs,
        pendingTodos,
        completedTodos
      });
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching stats:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return <div style={styles.loading}>Chargement des statistiques...</div>;
  }

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.pageTitle}>
              <FontAwesomeIcon icon={faChartBar} /> Rapports & Statistiques
            </h2>
            <p style={styles.pageSubtitle}>Vue d'ensemble des performances</p>
          </div>
          <div style={styles.periodSelector}>
            <button
              style={{ ...styles.periodButton, ...(period === 'week' ? styles.periodButtonActive : {}) }}
              onClick={() => setPeriod('week')}
            >
              7 jours
            </button>
            <button
              style={{ ...styles.periodButton, ...(period === 'month' ? styles.periodButtonActive : {}) }}
              onClick={() => setPeriod('month')}
            >
              30 jours
            </button>
            <button
              style={{ ...styles.periodButton, ...(period === 'year' ? styles.periodButtonActive : {}) }}
              onClick={() => setPeriod('year')}
            >
              Année
            </button>
          </div>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIconBlue}>
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <div style={styles.statContent}>
              <h3 style={styles.statLabel}>Tests Réussis</h3>
              <p style={styles.statValue}>{stats.testsOK}</p>
              <span style={styles.statPercent}>({stats.tauxReussite}%)</span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIconRed}>
              <FontAwesomeIcon icon={faTimesCircle} />
            </div>
            <div style={styles.statContent}>
              <h3 style={styles.statLabel}>Tests Échoués (BUG)</h3>
              <p style={styles.statValue}>{stats.testsBug}</p>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIconYellow}>
              <FontAwesomeIcon icon={faClock} />
            </div>
            <div style={styles.statContent}>
              <h3 style={styles.statLabel}>Tests En Cours</h3>
              <p style={styles.statValue}>{stats.testsEnCours}</p>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIconPurple}>
              <FontAwesomeIcon icon={faChartPie} />
            </div>
            <div style={styles.statContent}>
              <h3 style={styles.statLabel}>Total Tests</h3>
              <p style={styles.statValue}>{stats.totalTests}</p>
            </div>
          </div>
        </div>

        <div style={styles.chartsSection}>
          <h3 style={styles.sectionTitle}>Répartition</h3>
          <div style={styles.chartsGrid}>
            <div style={styles.chartCard}>
              <h4 style={styles.chartTitle}>Statut des Tests</h4>
              <div style={styles.pieChart}>
                <div style={styles.pieLegend}>
                  <div style={styles.legendItem}>
                    <span style={{ ...styles.legendColor, backgroundColor: '#27ae60' }}></span>
                    <span>OK ({stats.testsOK})</span>
                  </div>
                  <div style={styles.legendItem}>
                    <span style={{ ...styles.legendColor, backgroundColor: '#e74c3c' }}></span>
                    <span>BUG ({stats.testsBug})</span>
                  </div>
                  <div style={styles.legendItem}>
                    <span style={{ ...styles.legendColor, backgroundColor: '#f39c12' }}></span>
                    <span>En Cours ({stats.testsEnCours})</span>
                  </div>
                </div>
                <div style={styles.pieVisual}>
                  {stats.totalTests > 0 && (
                    <div style={styles.pieSegments}>
                      <div style={{
                        ...styles.pieSegment,
                        width: `${(stats.testsOK / stats.totalTests) * 100}%`,
                        backgroundColor: '#27ae60'
                      }}></div>
                      <div style={{
                        ...styles.pieSegment,
                        width: `${(stats.testsBug / stats.totalTests) * 100}%`,
                        backgroundColor: '#e74c3c'
                      }}></div>
                      <div style={{
                        ...styles.pieSegment,
                        width: `${(stats.testsEnCours / stats.totalTests) * 100}%`,
                        backgroundColor: '#f39c12'
                      }}></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={styles.chartCard}>
              <h4 style={styles.chartTitle}>État des Ressources</h4>
              <div style={styles.resourceGrid}>
                <div style={styles.resourceItem}>
                  <span style={styles.resourceIcon}><FontAwesomeIcon icon={faDatabase} /></span>
                  <span style={styles.resourceValue}>{stats.totalApps}</span>
                  <span style={styles.resourceLabel}>Applications</span>
                </div>
                <div style={styles.resourceItem}>
                  <span style={styles.resourceIcon}><FontAwesomeIcon icon={faUsers} /></span>
                  <span style={styles.resourceValue}>{stats.totalComptes}</span>
                  <span style={styles.resourceLabel}>Comptes</span>
                </div>
                <div style={styles.resourceItem}>
                  <span style={styles.resourceIcon}><FontAwesomeIcon icon={faUsers} /></span>
                  <span style={styles.resourceValue}>{stats.totalUsers}</span>
                  <span style={styles.resourceLabel}>Utilisateurs</span>
                </div>
                <div style={styles.resourceItem}>
                  <span style={styles.resourceIcon}><FontAwesomeIcon icon={faTasks} /></span>
                  <span style={styles.resourceValue}>{stats.pendingTodos}</span>
                  <span style={styles.resourceLabel}>Tâches</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.tableSection}>
          <h3 style={styles.sectionTitle}>Utilisateurs Actifs</h3>
          <div style={styles.userStats}>
            <div style={styles.userStatItem}>
              <span style={styles.userStatValue}>{stats.usersActifs}</span>
              <span style={styles.userStatLabel}>Actifs</span>
            </div>
            <div style={styles.userStatItem}>
              <span style={styles.userStatValue}>{stats.totalUsers - stats.usersActifs}</span>
              <span style={styles.userStatLabel}>Inactifs</span>
            </div>
            <div style={styles.userProgressContainer}>
              <div style={styles.userProgressBar}>
                <div style={{
                  ...styles.userProgressFill,
                  width: stats.totalUsers > 0 ? `${(stats.usersActifs / stats.totalUsers) * 100}%` : '0%'
                }}></div>
              </div>
              <span style={styles.userProgressPercent}>
                {stats.totalUsers > 0 ? Math.round((stats.usersActifs / stats.totalUsers) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const styles: any = {
  container: { backgroundColor: 'var(--bg-primary)', minHeight: '100vh' },
  main: { padding: '30px', maxWidth: '1400px', margin: '0 auto', width: '100%', minHeight: 'calc(100vh - 70px)' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--text-secondary)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '16px' },
  pageTitle: { margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' },
  pageSubtitle: { margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' },
  periodSelector: { display: 'flex', gap: '8px' },
  periodButton: { padding: '8px 16px', backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' },
  periodButtonActive: { backgroundColor: 'var(--info-color)', color: 'white', borderColor: 'var(--info-color)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' },
  statCard: { display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px var(--shadow-color)' },
  statIconBlue: { width: '50px', height: '50px', borderRadius: '12px', backgroundColor: 'rgba(52, 152, 219, 0.15)', color: '#3498db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },
  statIconRed: { width: '50px', height: '50px', borderRadius: '12px', backgroundColor: 'rgba(231, 76, 60, 0.15)', color: '#e74c3c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },
  statIconYellow: { width: '50px', height: '50px', borderRadius: '12px', backgroundColor: 'rgba(243, 156, 18, 0.15)', color: '#f39c12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },
  statIconPurple: { width: '50px', height: '50px', borderRadius: '12px', backgroundColor: 'rgba(155, 89, 182, 0.15)', color: '#9b59b6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },
  statContent: { flex: 1 },
  statLabel: { margin: 0, fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statValue: { margin: '8px 0 4px', fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' },
  statPercent: { fontSize: '14px', color: 'var(--success-color)', fontWeight: '600' },
  chartsSection: { marginBottom: '30px' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' },
  chartsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' },
  chartCard: { padding: '24px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px var(--shadow-color)' },
  chartTitle: { margin: '0 0 20px', fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' },
  pieChart: { display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' },
  pieLegend: { display: 'flex', flexDirection: 'column', gap: '12px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-primary)' },
  legendColor: { width: '16px', height: '16px', borderRadius: '4px' },
  pieVisual: { flex: 1, minWidth: '150px' },
  pieSegments: { display: 'flex', height: '30px', borderRadius: '8px', overflow: 'hidden' },
  pieSegment: { height: '100%' },
  resourceGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' },
  resourceItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', backgroundColor: 'var(--bg-primary)', borderRadius: '10px' },
  resourceIcon: { fontSize: '20px', color: 'var(--info-color)', marginBottom: '8px' },
  resourceValue: { fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' },
  resourceLabel: { fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' },
  tableSection: { backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' },
  userStats: { display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' },
  userStatItem: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  userStatValue: { fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' },
  userStatLabel: { fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' },
  userProgressContainer: { flex: 1, display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px' },
  userProgressBar: { flex: 1, height: '10px', backgroundColor: 'var(--bg-primary)', borderRadius: '5px', overflow: 'hidden' },
  userProgressFill: { height: '100%', backgroundColor: 'var(--success-color)', borderRadius: '5px' },
  userProgressPercent: { fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }
};

export default Reports;