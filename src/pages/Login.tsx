import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log("Login: Attempting login with:", username);
      }
       const data = await authAPI.login(username, password);
       if (process.env.NODE_ENV === 'development') {
        console.log("Login: Login response:", data);
        console.log("Login: Storing token:", data.accessToken ? data.accessToken.substring(0, 20) + "..." : "NO TOKEN");
       }
       localStorage.setItem('access_token', data.accessToken);
       localStorage.setItem('token_type', data.tokenType);
       // Store user info for Layout component
       localStorage.setItem('user_role', data.userRole || '');
       localStorage.setItem('user_id', data.userId || '');
       localStorage.setItem('username', data.username || '');
       localStorage.setItem('email', data.email || '');
       if (process.env.NODE_ENV === 'development') {
        console.log("Login: Token stored in localStorage");
        console.log("Login: Navigating to dashboard");
       }
       navigate('/dashboard');
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Login: Erreur de connexion:', err);
      }
      const errorMessage = err.response?.data?.detail || err.response?.data?.accessToken || err.message || 'Erreur de connexion';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="login-card" style={styles.card}>
        <h1 className="login-title" style={styles.title}>IT Access Manager</h1>
        <h2 style={styles.subtitle}>Connexion</h2>
        
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nom d'utilisateur</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              
              required
            />
          </div>
          
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        

      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-primary)',
  },
  card: {
    backgroundColor: 'var(--bg-card)',
    padding: '48px',
    borderRadius: '16px',
    boxShadow: '0 20px 60px var(--shadow-strong)',
    width: '100%',
    maxWidth: '420px',
  },
  cardMobile: {
    padding: '24px 16px',
    margin: '16px',
    borderRadius: '12px',
  },
  title: {
    textAlign: 'center' as const,
    color: 'var(--text-primary)',
    marginBottom: '8px',
    fontSize: '28px',
    fontWeight: '700',
  },
  subtitle: {
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    marginBottom: '32px',
    fontSize: '16px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: 'var(--text-secondary)',
    fontWeight: '600' as const,
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '15px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text-primary)',
    transition: 'all 0.2s ease',
  },
  button: {
    width: '100%',
    padding: '14px',
    backgroundColor: 'var(--info-color)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  error: {
    color: 'var(--danger-color)',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    border: '1px solid var(--danger-color)',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
  },
};

export default Login;
