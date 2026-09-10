import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import './CompleteProfile.css';

export const CompleteProfile: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { user, createUserProfile, error } = useAuth() as any;
  const [displayName, setDisplayName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [mobile, setMobile] = useState('');
  const [department, setDepartment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const savePendingProfile = (values: { displayName: string; employeeId: string; mobile: string; department: string }) => {
    try {
      window.localStorage.setItem('pendingProfile', JSON.stringify(values));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    try {
      const pending = window.localStorage.getItem('pendingProfile');
      if (pending) {
        const parsed = JSON.parse(pending);
        setDisplayName(parsed.displayName || '');
        setEmployeeId(parsed.employeeId || '');
        setMobile(parsed.mobile || '');
        setDepartment(parsed.department || '');
      }
    } catch {
      // ignore
    }
  }, []);

  const handleComplete = async () => {
    setSubmitting(true);
    setMessage('');
    const values = { displayName, employeeId, mobile, department };
    savePendingProfile(values);
    const ok = await createUserProfile(values);
    setSubmitting(false);
    if (ok) {
      try { window.localStorage.removeItem('pendingProfile'); } catch { /* optional cleanup */ }
      onComplete();
      setTimeout(() => {
        onComplete();
      }, 0);
    } else {
      setMessage(error || 'Failed to create profile');
    }
  };

  return (
    <div className="complete-profile-container">
      <div className="complete-profile-card">
        <h2>Complete your profile</h2>
        <p>Please complete your profile to finish signup for {user?.email}</p>

        <div className="complete-profile-form">
          <div className="form-group">
            <label>Full name</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Enter your full name" />
          </div>

          <div className="form-group">
            <label>Employee ID</label>
            <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="Enter employee ID" />
          </div>

          <div className="form-group">
            <label>Department</label>
            <select value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">Select Department</option>
              <option value="IT">IT</option>
              <option value="Accounts">Accounts</option>
              <option value="Admin">Admin</option>
              <option value="Planning and Inventory">Planning and Inventory</option>
              <option value="CIC">CIC</option>
              <option value="Sales and Marketing">Sales and Marketing</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Purchase">Purchase</option>
              <option value="Production">Production</option>
              <option value="Quality">Quality</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          <div className="form-group">
            <label>Mobile</label>
            <input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Enter mobile number" />
          </div>

          {message && <div className="complete-profile-message error">{message}</div>}

          <button onClick={handleComplete} disabled={submitting}>
            {submitting ? 'Saving...' : 'Complete Signup'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
