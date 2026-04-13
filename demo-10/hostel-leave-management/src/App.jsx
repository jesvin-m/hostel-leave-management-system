import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Import components
import StudentLogin from './components/StudentLogin';
import WardenLogin from './components/WardenLogin';
import StudentDashboard from './components/StudentDashboard';
import WardenDashboard from './components/WardenDashboard';
import LeaveForm from './components/LeaveForm';

// Import logo
import logo from './assets/logo.jpg'; // place your image inside src/assets/logo.jpg

function Layout({ children }) {
  const location = useLocation();

  // Show header only on home page "/"
  const showHeader = location.pathname === "/";

  return (
    <>
      {showHeader && (
        <header className="header d-flex justify-content-center align-items-center p-3 shadow-sm bg-white">
          <img src={logo} alt="Institute Logo" className="header-logo" />
        </header>
      )}
      {children}
    </>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={
              <div className="container home-layout">
                {/* Left side - Gate Image */}
                <div className="home-image">
                  <img src="/src/assets/gate.jpg" alt="Campus Gate" />
                </div>

                {/* Right side - Role selection */}
                <div className="login-container">
                  <div className="text-center mb-5">
                    <h2 className="mb-3" style={{ 
                      color: '#1e293b',
                      fontSize: '2rem',
                      fontWeight: '600',
                      letterSpacing: '-0.02em'
                    }}>
                      Hostel Leave Management
                    </h2>
                    <p className="text-muted mb-0" style={{ 
                      fontSize: '1rem',
                      fontWeight: '400',
                      color: '#64748b'
                    }}>
                      Streamlined leave management system for students and wardens
                    </p>
                  </div>
                  <div className="role-cards">
                    <Link to="/student-login" className="role-card">
                      <div className="role-icon role-student" aria-hidden="true">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" fill="#3b82f6"/>
                          <path d="M7 12.5v3.2c0 .4.24.76.62.92A14.9 14.9 0 0012 18c1.53 0 3.01-.24 4.38-.68.38-.16.62-.52.62-.92v-3.2l-5 2.73-5-2.73z" fill="#93c5fd"/>
                        </svg>
                      </div>
                      <div className="role-content">
                        <h5 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '4px', color: '#1e293b' }}>Student Portal</h5>
                        <p className="text-muted mb-0" style={{ fontSize: '0.9rem', color: '#64748b' }}>Create and track leave requests</p>
                      </div>
                    </Link>
                    <Link to="/warden-login" className="role-card">
                      <div className="role-icon role-warden" aria-hidden="true">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2a5 5 0 015 5v1h1a3 3 0 013 3v2a7 7 0 01-7 7h-4a7 7 0 01-7-7V11a3 3 0 013-3h1V7a5 5 0 015-5z" fill="#0f172a"/>
                          <path d="M8 11a4 4 0 118 0v1H8v-1z" fill="#94a3b8"/>
                        </svg>
                      </div>
                      <div className="role-content">
                        <h5 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '4px', color: '#1e293b' }}>Warden Portal</h5>
                        <p className="text-muted mb-0" style={{ fontSize: '0.9rem', color: '#64748b' }}>Review and approve requests</p>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            }
          />
          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/warden-login" element={<WardenLogin />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/warden-dashboard" element={<WardenDashboard />} />
          <Route path="/leave-form" element={<LeaveForm />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
