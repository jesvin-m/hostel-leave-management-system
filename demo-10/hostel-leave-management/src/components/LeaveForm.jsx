import { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import { format, parseISO, isValid } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from 'react-router-dom';

function LeaveForm() {
  const [formData, setFormData] = useState({
    studentName: '',
    rollNumber: '',
    registerNumber: '',
    department: '',
    roomNumber: '',
    contact: '',
    fromDate: '',
    toDate: '',
    reason: ''
  });
  const [hasInappropriateContent, setHasInappropriateContent] = useState(false);
  const navigate = useNavigate();

  const parseDateOrNull = (value) => {
    if (!value) return null;
    const date = typeof value === 'string' ? parseISO(value) : value;
    return isValid(date) ? date : null;
  };

  const toIsoDateString = (date) => {
    if (!date || !isValid(date)) return '';
    return format(date, 'yyyy-MM-dd');
  };

  // List of inappropriate words to filter
  const inappropriateWords = [
    'bad', 'stupid', 'idiot', 'dumb', 'hate', 'angry', 'mad', 'crazy',
    'insult', 'abuse', 'rude', 'offensive', 'inappropriate', 'vulgar',
    'profanity', 'curse', 'swear', 'damn', 'hell', 'crap', 'suck',
    'terrible', 'awful', 'horrible', 'disgusting', 'annoying', 'irritating',
    'fuck', 'shit', 'pussy', 'cock', 'dick', 'ass', 'bitch', 'faggot', 'nigger',
    'nigga', 'otha', 'punda', 'thevidiya', 'baadu','sunni','suthu','kundi'

  ];

  useEffect(() => {
    const authRaw = localStorage.getItem('auth');
    if (!authRaw) return;
    try {
      const auth = JSON.parse(authRaw);
      if (auth?.role === 'student' && auth?.username) {
        fetch(`/api/students/${encodeURIComponent(auth.username)}`)
          .then(r => r.ok ? r.json() : null)
          .then(profile => {
            if (!profile) return;
            const studentName = profile.studentName || profile.full_name || profile.name || '';
            const rollNumber = profile.rollNumber || profile.roll_number || '';
            const registerNumber = profile.registerNumber || profile.register_number || '';
            const department = profile.department || profile.department_name || profile.dept || '';
            const roomNumber = profile.roomNumber || profile.room_number || profile.room || '';
            const contact = profile.phone || profile.mobile || profile.contact || profile.contact_number || '';

            setFormData(prev => ({
              ...prev,
              studentName,
              rollNumber,
              registerNumber,
              department,
              roomNumber,
              contact
            }));
          })
          .catch(() => {});
      }
    } catch {}
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Determine current student and use a per-student storage key
    const auth = JSON.parse(localStorage.getItem('auth') || 'null');
    const username = auth?.username || 'unknown';
    const storageKey = `leaveApplications:${username}`;
    // Get existing applications for this student or initialize empty array
    const existingApplications = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Create new application with status and submitted timestamp
    const newApplication = {
      ...formData,
      username,
      status: 'pending',
      submittedDate: new Date().toISOString()
    };
    
    // Add new application to array
    existingApplications.push(newApplication);
    
    // Save back to localStorage under the student's namespace
    localStorage.setItem(storageKey, JSON.stringify(existingApplications));
    
    // Navigate back to dashboard
    navigate('/student-dashboard');
  };

  // Function to check for inappropriate content
  const checkInappropriateContent = (text) => {
    const lowerText = text.toLowerCase();
    return inappropriateWords.some(word => lowerText.includes(word.toLowerCase()));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Check for inappropriate content in reason field
    if (name === 'reason') {
      const hasInappropriate = checkInappropriateContent(value);
      setHasInappropriateContent(hasInappropriate);
    }
    
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleFromDateChange = (date) => {
    const iso = toIsoDateString(date);
    setFormData(prev => ({
      ...prev,
      fromDate: iso,
      // Ensure toDate is not before fromDate
      toDate: prev.toDate && parseDateOrNull(prev.toDate) < date ? iso : prev.toDate
    }));
  };

  const handleToDateChange = (date) => {
    const iso = toIsoDateString(date);
    setFormData(prev => ({
      ...prev,
      toDate: iso
    }));
  };

  return (
    <div className="container">
      <div className="dashboard-container">
        <div className="d-flex align-items-center mb-4">
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
          <h2 className="mb-0" style={{ 
            color: '#1e293b',
            fontSize: '1.75rem',
            fontWeight: '600',
            letterSpacing: '-0.02em'
          }}>
            Student Details
          </h2>
        </div>
        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <div><strong>Name:</strong> {formData.studentName || '-'}</div>
              </div>
              <div className="col-md-6">
                <div><strong>Department:</strong> {formData.department || '-'}</div>
              </div>
              <div className="col-md-6">
                <div><strong>Roll Number:</strong> {formData.rollNumber || '-'}</div>
              </div>
              <div className="col-md-6">
                <div><strong>Registration Number:</strong> {formData.registerNumber || '-'}</div>
              </div>
              <div className="col-md-6">
                <div><strong>Room Number:</strong> {formData.roomNumber || '-'}</div>
              </div>
              <div className="col-md-6">
                <div><strong>Contact:</strong> {formData.contact || '-'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center mb-4">
          <div className="me-3" style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="mb-0" style={{ 
            color: '#1e293b',
            fontSize: '1.75rem',
            fontWeight: '600',
            letterSpacing: '-0.02em'
          }}>
            Create Leave Request
          </h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="fromDate" className="form-label">From</label>
            <DatePicker
              id="fromDate"
              selected={parseDateOrNull(formData.fromDate)}
              onChange={handleFromDateChange}
              selectsStart
              startDate={parseDateOrNull(formData.fromDate)}
              endDate={parseDateOrNull(formData.toDate)}
              className="form-control"
              placeholderText="Select start date"
              dateFormat="yyyy-MM-dd"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="toDate" className="form-label">To</label>
            <DatePicker
              id="toDate"
              selected={parseDateOrNull(formData.toDate)}
              onChange={handleToDateChange}
              selectsEnd
              startDate={parseDateOrNull(formData.fromDate)}
              endDate={parseDateOrNull(formData.toDate)}
              minDate={parseDateOrNull(formData.fromDate)}
              className="form-control"
              placeholderText="Select end date"
              dateFormat="yyyy-MM-dd"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="reason" className="form-label">Reason</label>
            <textarea
              className={`form-control ${hasInappropriateContent ? 'is-invalid' : ''}`}
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              rows="3"
              required
            ></textarea>
            {hasInappropriateContent && (
              <div className="invalid-feedback d-block">
                <div className="d-flex align-items-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="me-2 text-danger">
                    <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Please use appropriate language in your reason. Inappropriate words are not allowed.
                </div>
              </div>
            )}
          </div>
          <div className="d-flex justify-content-between">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/student-dashboard')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="me-2">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={hasInappropriateContent}
              title={hasInappropriateContent ? "Please remove inappropriate language to submit" : ""}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="me-2">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LeaveForm;