import React, { useState } from 'react';
import type { AppUser } from '../hooks/useAuth';
import { useAssetRequests } from '../hooks/useAssetRequests';
import './AssetRequestForm.css';

interface AssetRequestFormProps {
  user: AppUser;
  onSuccess: () => void;
  onCancel: () => void;
}

const CATEGORIES = ['laptop', 'desktop', 'monitor', 'printer', 'network', 'peripheral', 'other'] as const;
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

const initialState = {
  employeeId: '',
  employeeName: '',
  mobile: '',
  category: 'laptop' as const,
  manufacturer: '',
  model: '',
  specifications: '',
  justification: '',
  priority: 'medium' as const,
};

export const AssetRequestForm: React.FC<AssetRequestFormProps> = ({ user, onSuccess, onCancel }) => {
  const [values, setValues] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createRequest } = useAssetRequests();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await createRequest({
        requesterId: user.uid,
        requesterEmail: user.email || '',
        requesterName: user.displayName || 'Unknown',
        requesterDepartment: '', // Can be fetched from user profile
        employeeId: values.employeeId,
        employeeName: values.employeeName,
        mobile: values.mobile,
        category: values.category,
        manufacturer: values.manufacturer,
        model: values.model,
        specifications: values.specifications,
        justification: values.justification,
        priority: values.priority,
        status: 'pending',
        comments: [],
      });
      setValues(initialState);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="request-form-card">
      <div className="request-form-header">
        <h2>Request New Asset</h2>
        
      </div>

      {error && <div className="error-message">{error}</div>}

      <form className="request-form" onSubmit={handleSubmit}>
        <div className="grid-two-columns">
          <label>
            Employee ID
            <input
              name="employeeId"
              value={values.employeeId}
              onChange={handleChange}
              required
              placeholder="e.g., S00001"
            />
          </label>

          <label>
            Employee Name
            <input
              name="employeeName"
              value={values.employeeName}
              onChange={handleChange}
              required
              placeholder="Full name"
            />
          </label>

          <label>
            Mobile Number
            <input
              name="mobile"
              value={values.mobile}
              onChange={handleChange}
              required
              placeholder="e.g., 9876543210"
            />
          </label>

          <label>
            Asset Category
            <select name="category" value={values.category} onChange={handleChange} required>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Priority
            <select name="priority" value={values.priority} onChange={handleChange} required>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Preferred Manufacturer
            <input
              name="manufacturer"
              value={values.manufacturer}
              onChange={handleChange}
              placeholder="e.g., Dell, HP, Lenovo"
            />
          </label>

          <label>
            Preferred Model
            <input
              name="model"
              value={values.model}
              onChange={handleChange}
              placeholder="e.g., XPS 13, ThinkPad E15"
            />
          </label>
        </div>

        <label className="full-width">
          Technical Specifications
          <textarea
            name="specifications"
            value={values.specifications}
            onChange={handleChange}
            placeholder="Describe required specifications (CPU, RAM, Storage, OS, etc.)"
            rows={4}
          />
        </label>

        <label className="full-width">
          Justification / Business Reason
          <textarea
            name="justification"
            value={values.justification}
            onChange={handleChange}
            required
            placeholder="Explain why this asset is needed"
            rows={4}
          />
        </label>

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
          
        </div>
      </form>
    </div>
  );
};
