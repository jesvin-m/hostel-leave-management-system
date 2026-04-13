import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeCanvas } from "qrcode.react";  // ✅ use QRCodeCanvas for v3+

function StudentDashboard() {
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [approvedLeave, setApprovedLeave] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const auth = JSON.parse(localStorage.getItem('auth') || 'null');
      const username = auth?.username || 'unknown';
      const storageKey = `leaveApplications:${username}`;
      const savedApplications = JSON.parse(localStorage.getItem(storageKey) || '[]');
      setLeaveApplications(savedApplications);
    } catch {
      setLeaveApplications([]);
    }
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const auth = JSON.parse(localStorage.getItem('auth') || 'null');
        if (auth?.role === 'student' && auth?.username) {
          const response = await fetch(`/api/students/${encodeURIComponent(auth.username)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            // Add timeout to prevent hanging
            signal: AbortSignal.timeout(5000)
          });
          
          if (response.ok) {
            const data = await response.json();
            setProfile(data);
          } else {
            console.warn('Failed to load profile data');
            // Set default profile to prevent UI issues
            setProfile({
              studentName: auth.username,
              rollNumber: '-',
              registerNumber: '-',
              department: '-'
            });
          }
        }
      } catch (error) {
        console.warn('Error loading profile:', error);
        // Set default profile on error
        const auth = JSON.parse(localStorage.getItem('auth') || 'null');
        setProfile({
          studentName: auth?.username || 'Student',
          rollNumber: '-',
          registerNumber: '-',
          department: '-'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="container">
        <div className="dashboard-container">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="text-center">
              <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <h4 style={{ 
                color: '#1e293b',
                fontWeight: '600'
              }}>
                Loading Dashboard...
              </h4>
              <p className="text-muted">Please wait while we load your information</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard-container">
        <div className="d-flex justify-content-between align-items-center mb-5">
          <div>
            <h2 style={{ 
              color: '#1e293b',
              fontSize: '2rem',
              fontWeight: '600',
              marginBottom: '8px',
              letterSpacing: '-0.02em'
            }}>
              Student Dashboard
            </h2>
            <p className="text-muted mb-0" style={{ 
              fontSize: '1rem',
              color: '#64748b',
              fontWeight: '400'
            }}>
              Manage your leave requests and track approvals
            </p>
          </div>
          <div>
            <Link to="/leave-form" className="btn btn-primary me-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="me-2">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Create Leave Request
            </Link>
            <Link to="/" className="btn btn-secondary" onClick={() => { try { localStorage.removeItem('auth'); } catch {} }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="me-2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Sign Out
            </Link>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex align-items-center mb-3">
              <div className="me-3" style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h4 className="mb-0" style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600',
                color: '#1e293b'
              }}>Your Details</h4>
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <div className="d-flex align-items-center p-3" style={{ 
                  background: 'linear-gradient(135deg, #f8fafc, #ffffff)',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="me-3" style={{ color: '#3b82f6' }}>
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a' }}>{profile?.full_name || profile?.studentName || '-'}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex align-items-center p-3" style={{ 
                  background: 'linear-gradient(135deg, #f8fafc, #ffffff)',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="me-3" style={{ color: '#8b5cf6' }}>
                    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a' }}>{profile?.department || '-'}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex align-items-center p-3" style={{ 
                  background: 'linear-gradient(135deg, #f8fafc, #ffffff)',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="me-3" style={{ color: '#06b6d4' }}>
                    <path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Roll Number</div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a' }}>{profile?.rollNumber || profile?.roll_number || '-'}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex align-items-center p-3" style={{ 
                  background: 'linear-gradient(135deg, #f8fafc, #ffffff)',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="me-3" style={{ color: '#10b981' }}>
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Registration Number</div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a' }}>{profile?.registerNumber || profile?.register_number || '-'}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex align-items-center p-3" style={{ 
                  background: 'linear-gradient(135deg, #f8fafc, #ffffff)',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="me-3" style={{ color: '#2563eb' }}>
                    <path d="M3 7l9-4 9 4-9 4-9-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 12l9 4 9-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 17l9 4 9-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Room Number</div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a' }}>{profile?.roomNumber || profile?.room_number || profile?.room || '-'}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex align-items-center p-3" style={{ 
                  background: 'linear-gradient(135deg, #f8fafc, #ffffff)',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="me-3" style={{ color: '#0ea5e9' }}>
                    <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 16l10 6 10-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 4l10 6 10-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact</div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a' }}>{profile?.phone || profile?.mobile || profile?.contact || profile?.contact_number || '-'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h4>Your Leave Requests</h4>
          {leaveApplications.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Roll No.</th>
                    <th>Reg. No.</th>
                    <th>Department</th>
                    <th>Room No.</th>
                    <th>Contact</th>
                    <th>From Date</th>
                    <th>To Date</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveApplications.map(application => (
                    <tr key={application.submittedDate}>
                      <td>{application.studentName}</td>
                      <td>{application.rollNumber}</td>
                      <td>{application.registerNumber}</td>
                      <td>{application.department}</td>
                      <td>{application.roomNumber || '-'}</td>
                      <td>{application.contact || '-'}</td>
                      <td>{application.fromDate}</td>
                      <td>{application.toDate}</td>
                      <td>{application.reason}</td>
                      <td>
                        <span className={`status-${application.status}`}>
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          disabled={application.status !== 'approved'}
                          onClick={() => {
                            if (approvedLeave && approvedLeave.submittedDate === application.submittedDate) {
                              setApprovedLeave(null);
                            } else {
                              setApprovedLeave(application);
                            }
                          }}
                        >
                          {approvedLeave && approvedLeave.submittedDate === application.submittedDate ? 'Hide QR' : 'Show QR'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center p-4 bg-light rounded">
              <p className="mb-0">No requests yet. Click "Create Leave Request" to start.</p>
            </div>
          )}
        </div>

        {approvedLeave && approvedLeave.status === 'approved' && (
          <div className="approved-section text-center p-4 bg-success bg-opacity-10 rounded">
            <h4>✅ Leave Approved</h4>
            <p><strong>Name:</strong> {approvedLeave.studentName}</p>
            <p><strong>Roll No:</strong> {approvedLeave.rollNumber}</p>
            <p><strong>Reg. No.:</strong> {approvedLeave.registerNumber}</p>
            <p><strong>Department:</strong> {approvedLeave.department}</p>
            <p><strong>From:</strong> {approvedLeave.fromDate}</p>
            <p><strong>To:</strong> {approvedLeave.toDate}</p>
            <p><strong>Reason:</strong> {approvedLeave.reason}</p>

            <div className="d-flex justify-content-center mt-3">
            <QRCodeCanvas
            value={`${approvedLeave.studentName}
${approvedLeave.rollNumber}
${approvedLeave.fromDate} to ${approvedLeave.toDate}
approved`}
            size={200}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
            />

              </div>
            <p className="mt-2">Present this QR code at the gate</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;
