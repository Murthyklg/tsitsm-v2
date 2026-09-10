import React, { useState, useEffect } from 'react';
import type { AppUser } from '../hooks/useAuth';
import type { Asset } from '../types/asset';
import { apiRequest } from '../api';
import './AssetForm.css';
import { useAuth } from '../hooks/useAuth';

interface PrinterFormProps {
  user: AppUser;
  onSuccess: () => void;
  onCancel: () => void;
  asset?: Asset;
}

const initialState = {
  manufacturerBrand: '',
  model: '',
  department: '',
  ipAddress: '',
  macAddress: '',
  serialNumber: '',
  notes: '',
};

const PRINTER_BRANDS = ['HP', 'Canon', 'Xerox', 'Brother', 'Epson', 'Ricoh', 'Konica Minolta', 'Lexmark'];

const DEPARTMENTS = ['IT', 'Accounts', 'Admin', 'Planning and Inventory', 'CIC', 'Sales and Marketing', 'Human Resources', 'Purchase', 'Production', 'Quality', 'Maintenance'];

type PrinterFormState = typeof initialState;

export const PrinterForm: React.FC<PrinterFormProps> = ({ user, onSuccess, onCancel, asset }) => {
  const [values, setValues] = useState<PrinterFormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAuth();
  const isEditMode = !!asset;

  // Populate form with asset data when editing
  useEffect(() => {
    if (asset) {
      setValues({
        manufacturerBrand: asset.manufacturer || '',
        model: asset.model || '',
        department: asset.department || '',
        ipAddress: asset.notes?.match(/IP:\s*([^\n,]+)/)?.[1] || '',
        macAddress: asset.macAddress || '',
        serialNumber: asset.serialNumber || '',
        notes: asset.notes?.replace(/IP:\s*[^\n,]+,?\s*/g, '') || '',
      });
    }
  }, [asset]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!isAdmin) {
      setError('Only admin users can create or update assets.');
      setSubmitting(false);
      return;
    }

    try {
      const notesWithIP = values.ipAddress
        ? `IP: ${values.ipAddress}, ${values.notes}`
        : values.notes;
      const printerDisplayName = [values.manufacturerBrand, values.model].filter(Boolean).join(' ').trim();

      const rawPayload = {
        employeeId: '',
        employeeName: printerDisplayName || 'Printer',
        userEmail: '',
        department: values.department,
        location: 'TS Interseats India Pvt Ltd',
        owner: user.uid,
        category: 'printer',
        serialNumber: values.serialNumber,
        manufacturer: values.manufacturerBrand,
        ownership: 'company',
        model: values.model,
        purchaseDate: new Date(),
        warrantyExpiration: new Date(),
        purchasePrice: 0,
        condition: 'good',
        status: 'active',
        cpuManufacturer: '',
        cpuModel: '',
        cpuGeneration: '',
        ramType: '',
        ramSizeGb: 0,
        storageType: 'other',
        storageCapacityGb: 0,
        os: '',
        operatingSystemVersion: '',
        macAddress: values.macAddress,
        purchaseOrderNumber: '',
        notes: notesWithIP,
        tags: ['printer'],
        imageUrl: '',
        updatedAt: new Date(),
      };

      const payload = Object.fromEntries(
        Object.entries(rawPayload).filter(([, value]) => value !== undefined && value !== '')
      );

      if (isEditMode && asset?.id) {
        // Update existing printer
        await apiRequest(`/assets/${asset.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        // Create new printer
        await apiRequest('/assets', { method: 'POST', body: JSON.stringify(payload) });
      }

      setValues(initialState);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save printer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="asset-form-card">
      <div className="asset-form-header">
        <h2>{isEditMode ? 'Edit Printer' : 'Add New Printer'}</h2>
        <button type="button" className="asset-form-close" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <form className="asset-form" onSubmit={handleSubmit}>
        <div className="grid-two-columns">
          <label>
            Printer Brand
            <select name="manufacturerBrand" value={values.manufacturerBrand} onChange={handleChange} required>
              <option value="">Select Brand</option>
              {PRINTER_BRANDS.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </label>
          <label>
            Model
            <input name="model" value={values.model} onChange={handleChange} required />
          </label>
          <label>
            Department
            <select name="department" value={values.department} onChange={handleChange} required>
              <option value="">Select Department</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </label>
          <label>
            Serial Number
            <input name="serialNumber" value={values.serialNumber} onChange={handleChange} />
          </label>
          <label>
            IP Address
            <input
              name="ipAddress"
              type="text"
              value={values.ipAddress}
              onChange={handleChange}
              placeholder="e.g., 192.168.1.100"
              required
            />
          </label>
          <label>
            MAC Address
            <input
              name="macAddress"
              type="text"
              value={values.macAddress}
              onChange={handleChange}
              placeholder="e.g., 00:1A:2B:3C:4D:5E"
              required
            />
          </label>
          <label className="wide-field">
            Notes
            <textarea name="notes" value={values.notes} onChange={handleChange} rows={4} />
          </label>
        </div>

        {error && <div className="asset-form-error">{error}</div>}

        <div className="asset-form-actions">
          <button type="button" className="cancel-btn" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? 'Saving...' : isEditMode ? 'Update Printer' : 'Save Printer'}
          </button>
        </div>
      </form>
    </div>
  );
};
