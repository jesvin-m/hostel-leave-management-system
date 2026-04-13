import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function StudentLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: 'student' }),
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000)
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error === 'invalid_credentials' ? 'Invalid credentials' : 'Login failed');
        return;
      }
      
      const data = await res.json();
      try {
        localStorage.setItem('auth', JSON.stringify({ role: 'student', username: data.username, userId: data.userId }));
      } catch {}
      
      // Navigate immediately after successful login
      navigate('/student-dashboard');
    } catch (err) {
      if (err.name === 'TimeoutError') {
        setError('Login timeout. Please try again.');
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const [cursorPos, setCursorPos] = useState({ x: -9999, y: -9999 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      className="login-page"
      onMouseMove={handleMouseMove}
      style={{ '--x': `${cursorPos.x}px`, '--y': `${cursorPos.y}px` }}
    >
      <div className="login-container">
        <h2 className="text-center mb-4">Student Sign In</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="registerNumber" className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="d-grid">
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StudentLogin;