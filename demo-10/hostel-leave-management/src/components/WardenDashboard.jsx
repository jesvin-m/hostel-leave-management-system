import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function WardenDashboard() {
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [studentProfiles, setStudentProfiles] = useState({}); // username -> profile
  const [stats, setStats] = useState({
    totalStudentsOnLeave: 0,
    byDepartment: {},
    byMonth: []
  });
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    // Load applications from all student namespaces plus legacy key
    const collectAllApplications = () => {
      const all = [];
      try {
        // Legacy global key support
        const legacy = JSON.parse(localStorage.getItem('leaveApplications') || '[]');
        if (Array.isArray(legacy)) {
          all.push(...legacy);
        }
      } catch {}

      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key) continue;
          if (key.startsWith('leaveApplications:')) {
            const list = JSON.parse(localStorage.getItem(key) || '[]');
            const username = key.split(':')[1] || undefined;
            if (Array.isArray(list)) {
              for (const app of list) {
                // Ensure username is present for mapping to live profile
                if (!app.username && username) {
                  app.username = username;
                }
                all.push(app);
              }
            }
          }
        }
      } catch {}

      // Sort by submittedDate desc for convenience
      all.sort((a, b) => (b.submittedDate || '').localeCompare(a.submittedDate || ''));
      return all;
    };

    setLeaveApplications(collectAllApplications());
  }, []);

  // Load student profiles for usernames present in applications to ensure accurate department display
  useEffect(() => {
    const uniqueUsernames = Array.from(
      new Set(
        (leaveApplications || [])
          .map(a => a && a.username)
          .filter(Boolean)
      )
    );
    if (uniqueUsernames.length === 0) return;

    let isCancelled = false;
    Promise.all(
      uniqueUsernames.map(async (username) => {
        try {
          const res = await fetch(`/api/students/${encodeURIComponent(username)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(5000)
          });
          if (!res.ok) return [username, null];
          const data = await res.json();
          return [username, data];
        } catch {
          return [username, null];
        }
      })
    ).then(entries => {
      if (isCancelled) return;
      const next = {};
      for (const [username, data] of entries) {
        if (username) next[username] = data || null;
      }
      setStudentProfiles(next);
    });

    return () => { isCancelled = true; };
  }, [leaveApplications]);

  // Compute aggregated statistics once we have applications and any fetched profiles
  useEffect(() => {
    if (!leaveApplications) return;

    const getDept = (app) => {
      const profile = app.username ? studentProfiles[app.username] : undefined;
      return (
        (profile && (profile.department || profile.department_name || profile.dept)) ||
        app.department || app.department_name || app.dept || 'Unknown'
      );
    };

    // Unique students who have submitted any leave (pending/approved/rejected)
    const uniqueStudents = new Set(
      leaveApplications
        .map(a => a && (a.username || a.studentName || a.registerNumber || a.rollNumber))
        .filter(Boolean)
    );

    // Counts by department (based on effective department)
    const byDept = {};
    for (const app of leaveApplications) {
      const dept = getDept(app);
      byDept[dept] = (byDept[dept] || 0) + 1;
    }

    // Monthly counts based on the span from fromDate to toDate (inclusive by month)
    const byMonthArray = Array.from({ length: 12 }, () => 0);
    for (const app of leaveApplications) {
      const from = app && app.fromDate ? new Date(app.fromDate) : null;
      const to = app && app.toDate ? new Date(app.toDate) : null;
      if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) continue;

      let start = from;
      let end = to;
      if (start > end) {
        const tmp = start; start = end; end = tmp;
      }

      // Normalize to first day of their months to iterate by month
      const iter = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
      const endMarker = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
      while (iter <= endMarker) {
        const monthIndex = iter.getUTCMonth();
        byMonthArray[monthIndex] += 1;
        // advance by 1 month
        iter.setUTCMonth(iter.getUTCMonth() + 1);
      }
    }

    setStats({
      totalStudentsOnLeave: uniqueStudents.size,
      byDepartment: byDept,
      byMonth: byMonthArray
    });
  }, [leaveApplications, studentProfiles]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const auth = JSON.parse(localStorage.getItem('auth') || 'null');
        if (auth?.role === 'warden' && auth?.username) {
          const response = await fetch(`/api/wardens/${encodeURIComponent(auth.username)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(5000)
          });
          
          if (response.ok) {
            const data = await response.json();
            setProfile(data);
          } else {
            console.warn('Failed to load profile data');
            setProfile({
              username: auth.username,
              id: '-'
            });
          }
        }
      } catch (error) {
        console.warn('Error loading profile:', error);
        const auth = JSON.parse(localStorage.getItem('auth') || 'null');
        setProfile({
          username: auth?.username || 'Warden',
          id: '-'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleStatusUpdate = (submittedDate, newStatus) => {
    const reviewer = profile?.username || 'Warden';

    // Helper: update in a given storage key
    const updateInKey = (key) => {
      try {
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        let changed = false;
        const updated = list.map(app => {
          if (app.submittedDate === submittedDate) {
            changed = true;
            return {
              ...app,
              status: newStatus,
              reviewedAt: new Date().toISOString(),
              reviewedBy: reviewer
            };
          }
          return app;
        });
        if (changed) {
          localStorage.setItem(key, JSON.stringify(updated));
          return true;
        }
      } catch {}
      return false;
    };

    // Try namespaced key first for each user; fallback to legacy key
    let updatedAny = false;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith('leaveApplications:')) {
          if (updateInKey(key)) {
            updatedAny = true;
            break;
          }
        }
      }
    } catch {}

    if (!updatedAny) {
      updateInKey('leaveApplications');
    }

    // Refresh view by re-collecting all applications
    try {
      const all = [];
      const legacy = JSON.parse(localStorage.getItem('leaveApplications') || '[]');
      if (Array.isArray(legacy)) all.push(...legacy);
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('leaveApplications:')) {
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(list)) all.push(...list);
        }
      }
      all.sort((a, b) => (b.submittedDate || '').localeCompare(a.submittedDate || ''));
      setLeaveApplications(all);
    } catch {}
  };

  const handleMarkReturned = (submittedDate) => {
    if (!submittedDate) return;
    if (!window.confirm('Mark this student as returned? This will disable their QR.')) return;
    handleStatusUpdate(submittedDate, 'returned');
  };

  const handleRevoke = (submittedDate) => {
    if (window.confirm('Are you sure you want to revoke this decision? The application will return to pending status.')) {
      handleStatusUpdate(submittedDate, 'pending');
    }
  };

  

  // Remove blocking loading screen to avoid any spinner UI during actions like "Mark Returned"

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
              Warden Dashboard
            </h2>
            <p className="text-muted mb-0" style={{ 
              fontSize: '1rem',
              color: '#64748b',
              fontWeight: '400'
            }}>
              Review and manage student leave requests
            </p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-primary" onClick={() => setShowHistory(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="me-2">
                <path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12a9 9 0 11-9-9 9 9 0 019 9zM3 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              History
            </button>
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
                background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2a5 5 0 015 5v1h1a3 3 0 013 3v2a7 7 0 01-7 7h-4a7 7 0 01-7-7V11a3 3 0 013-3h1V7a5 5 0 015-5z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Username</div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a' }}>{profile?.username || '-'}</div>
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
                    <path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ID</div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a' }}>{profile?.id || '-'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-4">
          <h4>Leave Requests</h4>
          {leaveApplications.some(app => app && app.status !== 'returned') ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Roll No.</th>
                    <th>Reg. No.</th>
                    <th>Department</th>
                    <th>Room No.</th>
                    <th>Contact</th>
                    <th>From Date</th>
                    <th>To Date</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Student Returned</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveApplications.filter(a => a && a.status !== 'returned').map(application => (
                    <tr key={application.submittedDate}>
                      <td>{application.studentName}</td>
                      <td>{application.rollNumber}</td>
                      <td>{application.registerNumber}</td>
                      <td>{
                        (studentProfiles[application.username]?.department ||
                         studentProfiles[application.username]?.department_name ||
                         studentProfiles[application.username]?.dept) ||
                        application.department ||
                        application.department_name ||
                        application.dept ||
                        '-'
                      }</td>
                      <td>{
                        application.roomNumber ||
                        studentProfiles[application.username]?.room_number ||
                        studentProfiles[application.username]?.roomNumber ||
                        studentProfiles[application.username]?.room ||
                        '-'
                      }</td>
                      <td>{
                        application.contact ||
                        studentProfiles[application.username]?.contact ||
                        studentProfiles[application.username]?.contact_number ||
                        studentProfiles[application.username]?.phone ||
                        studentProfiles[application.username]?.mobile ||
                        '-'
                      }</td>
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
                          onClick={() => handleMarkReturned(application.submittedDate)}
                          className="btn btn-sm btn-outline-secondary"
                          disabled={application.status !== 'approved'}
                          title={application.status === 'approved' ? 'Mark student as returned' : 'Available only for approved requests'}
                        >
                          Mark Returned
                        </button>
                      </td>
                      <td>
                        {application.status === 'pending' ? (
                          <div className="btn-group">
                            <button
                              onClick={() => handleStatusUpdate(application.submittedDate, 'approved')}
                              className="btn btn-sm btn-success"
                              title="Approve this leave request"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="me-1">
                                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(application.submittedDate, 'rejected')}
                              className="btn btn-sm btn-danger"
                              title="Reject this leave request"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="me-1">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="btn-group">
                            <button
                              onClick={() => handleRevoke(application.submittedDate)}
                              className="btn btn-sm btn-warning"
                              title="Revoke decision and return to pending"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="me-1">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M3 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Revoke
                            </button>
                            {application.status === 'approved' && (
                              <button
                                onClick={() => handleStatusUpdate(application.submittedDate, 'rejected')}
                                className="btn btn-sm btn-outline-danger"
                                title="Change to rejected"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="me-1">
                                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Reject
                              </button>
                            )}
                            {application.status === 'rejected' && (
                              <button
                                onClick={() => handleStatusUpdate(application.submittedDate, 'approved')}
                                className="btn btn-sm btn-outline-success"
                                title="Change to approved"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="me-1">
                                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Approve
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center p-4 bg-light rounded">
              <p className="mb-0">No leave applications to review at this time.</p>
            </div>
          )}
        </div>

        {/* Overview Stats (moved below the table) */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <div className="p-3" style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Students Taking Leave</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>{stats.totalStudentsOnLeave}</div>
                </div>
              </div>
              <div className="col-md-8">
                <div className="p-3" style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b' }}>By Department</div>
                  </div>
                  <div className="d-flex flex-wrap" style={{ gap: '8px' }}>
                    {Object.keys(stats.byDepartment).length === 0 ? (
                      <span className="text-muted">No data</span>
                    ) : (
                      Object.entries(stats.byDepartment).map(([dept, count]) => (
                        <span key={dept} className="badge" style={{
                          background: '#eef2ff',
                          color: '#3730a3',
                          borderRadius: '999px',
                          padding: '8px 12px',
                          border: '1px solid #c7d2fe',
                          fontWeight: 600
                        }}>{dept}: {count}</span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Bar Chart (moved below the table) */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex align-items-center mb-3">
              <div className="me-3" style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M3 3v18h18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 15l3-4 3 5 4-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h4 className="mb-0" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Leave Requests by Month</h4>
            </div>

            {/* Simple SVG bar chart to avoid new dependencies */}
            <div style={{ width: '100%', overflowX: 'auto' }}>
              {(() => {
                const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                const values = stats.byMonth || [];
                const max = Math.max(1, ...(values.length ? values : [0]));
                const barWidth = 40;
                const gap = 16;
                const chartHeight = 180;
                const chartWidth = values.length * (barWidth + gap) + gap;
                return (
                  <svg width={chartWidth} height={chartHeight + 40} role="img" aria-label="Monthly leave requests">
                    {/* axes */}
                    <line x1={gap} y1={chartHeight} x2={chartWidth - gap} y2={chartHeight} stroke="#e5e7eb"/>
                    <line x1={gap} y1={16} x2={gap} y2={chartHeight} stroke="#e5e7eb"/>
                    {values.map((v, i) => {
                      const h = Math.round((v / max) * (chartHeight - 24));
                      const x = gap + i * (barWidth + gap) + gap;
                      const y = chartHeight - h;
                      return (
                        <g key={i}>
                          <rect x={x} y={y} width={barWidth} height={h} rx={6} fill="#3b82f6" opacity={0.85} />
                          <text x={x + barWidth / 2} y={chartHeight + 16} textAnchor="middle" fontSize="10" fill="#64748b">{labels[i]}</text>
                          <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="10" fill="#0f172a" fontWeight="600">{v}</text>
                        </g>
                      );
                    })}
                  </svg>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Returned History Modal */}
        {showHistory && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl modal-dialog-centered">
              <div className="modal-content" style={{ borderRadius: '16px', border: 'none' }}>
                <div className="modal-header" style={{ background: '#0ea5e9', color: 'white', borderRadius: '16px 16px 0 0' }}>
                  <h5 className="modal-title d-flex align-items-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="me-2">
                      <path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 12a9 9 0 11-9-9 9 9 0 019 9zM3 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Returned Students History
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowHistory(false)} style={{ filter: 'brightness(0) invert(1)' }}></button>
                </div>
                <div className="modal-body">
                  {(() => {
                    const returned = (leaveApplications || []).filter(a => a && a.status === 'returned');
                    return returned.length === 0 ? (
                      <div className="text-center p-4 bg-light rounded">No returned records.</div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle">
                          <thead>
                            <tr>
                              <th>Student Name</th>
                              <th>Roll No.</th>
                              <th>Reg. No.</th>
                              <th>Department</th>
                              <th>From</th>
                              <th>To</th>
                              <th>Returned At</th>
                            </tr>
                          </thead>
                          <tbody>
                            {returned.map(app => {
                              const prof = app.username ? studentProfiles[app.username] : undefined;
                              const dept = (prof && (prof.department || prof.department_name || prof.dept)) || app.department || app.department_name || app.dept || '-';
                              const returnedAt = app.reviewedAt ? new Date(app.reviewedAt).toLocaleString() : '-';
                              return (
                                <tr key={app.submittedDate}>
                                  <td>{app.studentName}</td>
                                  <td>{app.rollNumber}</td>
                                  <td>{app.registerNumber}</td>
                                  <td>{dept}</td>
                                  <td>{app.fromDate}</td>
                                  <td>{app.toDate}</td>
                                  <td>{returnedAt}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
                <div className="modal-footer" style={{ borderTop: '1px solid #e5e7eb' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowHistory(false)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        
      </div>
    </div>
  );
}

export default WardenDashboard;