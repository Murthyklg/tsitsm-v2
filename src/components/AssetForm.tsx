import React, { useState, useEffect } from 'react';
import type { AppUser } from '../hooks/useAuth';
import type { Asset } from '../types/asset';
import { apiRequest } from '../api';
import './AssetForm.css';
import { useAuth } from '../hooks/useAuth';
import { logActivityEvent } from '../utils/activityLogs';

interface AssetFormProps {
  user: AppUser;
  onSuccess: () => void;
  onCancel: () => void;
  asset?: Asset;
}

const initialState = {
  employeeId: '',
  employeeName: '',
  userEmail: '',
  mobileNumber: '',
  department: '',
  location: 'TS Interseats India Pvt Ltd',
  category: '',
  serialNumber: '',
  manufacturer: '',
  ownership: 'company',
  vendorName: '',
  model: '',
  purchaseDate: '',
  warrantyExpiration: '',
  purchasePrice: '',
  condition: 'good',
  status: 'active',
  cpuManufacturer: '',
  cpuModel: '',
  cpuGeneration: '',
  ramType: '',
  ramSizeGb: '',
  storageType: 'SSD',
  storageCapacityGb: '',
  os: '',
  operatingSystemVersion: '',
  macAddress: '',
  purchaseOrderNumber: '',
  notes: '',
  tags: '',
  ipAddress: '',
};

// Dropdown options
const MANUFACTURER_OPTIONS = {
  laptop: ['Dell', 'HP', 'Lenovo', 'Apple', 'ASUS', 'Acer', 'MSI', 'Samsung'],
  desktop: ['Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'Apple', 'MSI', 'Corsair', 'Alienware'],
  printer: ['HP', 'Canon', 'Xerox', 'Brother', 'Epson', 'Ricoh', 'Konica Minolta', 'Lexmark'],
  network: ['Cisco', 'Netgear', 'TP-Link', 'Fortinet', 'Juniper', 'Arista', 'Dell', 'Huawei'],
  projector: ['Epson', 'BenQ', 'Sony', 'Optoma', 'Panasonic', 'ViewSonic', 'NEC', 'Acer'],
};

const CPU_MANUFACTURERS = ['Intel', 'AMD', 'Apple', 'Snapdragon'];

const CPU_MODELS: Record<string, string[]> = {
  Intel: ['Core i3', 'Core i5', 'Core i7', 'Core i9', 'Xeon', 'Pentium', 'Celeron'],
  AMD: ['Ryzen 3', 'Ryzen 5', 'Ryzen 7', 'Ryzen 9', 'Athlon', 'EPYC'],
  Apple: ['M1', 'M2', 'M3', 'M4', 'M1 Pro', 'M1 Max', 'M2 Pro', 'M2 Max'],
  Snapdragon: ['X Elite', 'X Plus', '8cx Gen 3', '7c Gen 2'],
};

const CPU_GENERATIONS: Record<string, string[]> = {
  Intel: ['3rd Gen','4th Gen','5th Gen','6th Gen','7th Gen','8th Gen', '9th Gen', '10th Gen', '11th Gen', '12th Gen', '13th Gen', '14th Gen'],
  AMD: ['3000 Series', '4000 Series', '5000 Series', '7000 Series', '8000 Series'],
  Apple: ['M1', 'M2', 'M3', 'M4','M5' ,'M1 Pro', 'M1 Max', 'M2 Pro', 'M2 Max','M3 Pro', 'M3 Max', 'M4 Pro', 'M4 Max', 'M5 Pro', 'M5 Max'],
  Snapdragon: ['Gen 1', 'Gen 2', 'Gen 3'],
};

const RAM_TYPES = ['DDR3', 'DDR3L', 'DDR4', 'DDR5', 'LPDDR3', 'LPDDR4', 'LPDDR4X', 'LPDDR5', 'LPDDR5X', 'DDR5X', 'DDR2'];

const RAM_SIZES = ['2GB', '4GB', '6GB', '8GB', '12GB', '16GB', '24GB', '32GB', '64GB', '128GB'];

const STORAGE_CAPACITIES = ['256GB', '512GB', '1TB', '2TB', '4TB', '6TB', '8TB'];

const OPERATING_SYSTEMS = ['Windows', 'Ubuntu', 'CentOS', 'RHEL', 'macOS'];

const DEPARTMENTS = ['IT', 'Accounts','Admin', 'Planning and Inventory', 'CIC', 'Sales and Marketing', 'Human Resources', 'Purchase', 'Production', 'Quality', 'Maintenance'];

type AssetFormState = typeof initialState;

const syncUserProfileFromAsset = async (user: AppUser, assetValues: AssetFormState) => {
  const isAdminUser = user.email?.toLowerCase() === 'itadmin@thaisummit.ind.in';

  if (isAdminUser) {
    return;
  }

  try {
    await apiRequest('/profile', { method: 'PUT', body: JSON.stringify({
        uid: user.uid,
        email: user.email || assetValues.userEmail || '',
        displayName: assetValues.employeeName || user.displayName || '',
        employeeName: assetValues.employeeName || user.displayName || '',
        employeeId: assetValues.employeeId || '',
        mobile: assetValues.mobileNumber || '',
        department: assetValues.department || '',
        emailVerified: user.emailVerified ?? false,
    }) });
  } catch (err) {
    console.warn('Failed to sync user profile from asset', err);
  }
};

export const AssetForm: React.FC<AssetFormProps> = ({ user, onSuccess, onCancel, asset }) => {
  const [values, setValues] = useState<AssetFormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useAuth();
  const isEditMode = !!asset;

  // Populate form with asset data when editing
  useEffect(() => {
    if (asset) {
      const formatDateForInput = (date: Date | undefined): string => {
        if (!date) return '';
        try {
          if (!(date instanceof Date)) {
            date = new Date(date);
          }
          return date.toISOString().split('T')[0];
        } catch {
          return '';
        }
      };

      // Extract IP address from notes if it's a printer
      const extractIPFromNotes = (notes: string): string => {
        const match = notes?.match(/IP:\s*([^\n,]+)/);
        return match ? match[1].trim() : '';
      };

      const cleanNotes = (notes: string): string => {
        return notes?.replace(/IP:\s*[^\n,]+,?\s*/g, '').trim() || '';
      };

      const ipAddress = asset.category === 'printer' ? extractIPFromNotes(asset.notes || '') : '';
      const cleanedNotes = asset.category === 'printer' ? cleanNotes(asset.notes || '') : (asset.notes || '');

      setValues({
        employeeId: asset.employeeId || '',
        employeeName: asset.employeeName || '',
        userEmail: asset.userEmail || '',
        mobileNumber: (asset as Asset & { mobileNumber?: string }).mobileNumber || '',
        department: asset.department || '',
        location: asset.location || '',
        category: asset.category || '',
        serialNumber: asset.serialNumber || '',
        manufacturer: asset.manufacturer || '',
        ownership: asset.ownership || 'company',
        vendorName: asset.vendorName || '',
        model: asset.model || '',
        purchaseDate: formatDateForInput(asset.purchaseDate as any),
        warrantyExpiration: formatDateForInput(asset.warrantyExpiration as any),
        purchasePrice: asset.purchasePrice?.toString() || '',
        condition: asset.condition || 'good',
        status: asset.status || 'active',
        cpuManufacturer: asset.cpuManufacturer || '',
        cpuModel: asset.cpuModel || '',
        cpuGeneration: asset.cpuGeneration || '',
        ramType: asset.ramType || '',
        ramSizeGb: asset.ramSizeGb ? `${asset.ramSizeGb}GB` : '',
        storageType: asset.storageType || 'SSD',
        storageCapacityGb: asset.storageCapacityGb ? (asset.storageCapacityGb >= 1024 ? `${asset.storageCapacityGb / 1024}TB` : `${asset.storageCapacityGb}GB`) : '',
        os: asset.os || '',
        operatingSystemVersion: asset.operatingSystemVersion || '',
        macAddress: asset.macAddress || '',
        purchaseOrderNumber: asset.purchaseOrderNumber || '',
        notes: cleanedNotes,
        tags: asset.tags?.join(', ') || '',
        ipAddress: ipAddress,
      });
    }
  }, [asset]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;

    if (name === 'ownership' && value === 'company') {
      setValues((prev) => ({ ...prev, ownership: value as 'company' | 'vendor', vendorName: '' }));
      return;
    }

    if (name === 'cpuManufacturer') {
      setValues((prev) => ({
        ...prev,
        cpuManufacturer: value,
        cpuModel: '',
        cpuGeneration: '',
      }));
      return;
    }

    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const isAuthorizedAdmin = user.email?.toLowerCase() === 'itadmin@thaisummit.ind.in';

    if (!user.emailVerified) {
      setError('Please verify your email before adding assets.');
      setSubmitting(false);
      return;
    }

    if (!isAuthorizedAdmin) {
      setError('Only itadmin@thaisummit.ind.in can add or edit assets.');
      setSubmitting(false);
      return;
    }

    try {
      // For printer, use simplified submission
      if (values.category === 'printer') {
        const notesWithIP = values.ipAddress
          ? `IP: ${values.ipAddress}, ${values.notes}`
          : values.notes;
        const printerDisplayName = [values.manufacturer, values.model].filter(Boolean).join(' ').trim();

        const printerPayload = {
          employeeId: '',
          employeeName: printerDisplayName || 'Printer',
          userEmail: '',
          mobileNumber: values.mobileNumber,
          department: values.department,
          location: 'TS Interseats India Pvt Ltd',
          owner: user.uid,
          category: 'printer',
          serialNumber: values.serialNumber || '',
          manufacturer: values.manufacturer,
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

        if (isEditMode && asset?.id) {
          await apiRequest(`/assets/${asset.id}`, { method: 'PUT', body: JSON.stringify(printerPayload) });
          await logActivityEvent({
            module: 'asset',
            action: 'updated',
            description: `Updated printer asset ${values.serialNumber || values.model}`,
            performedBy: user.displayName || user.email || 'Admin',
            performedByEmail: user.email || '',
            targetName: values.serialNumber || values.model || 'Printer asset',
            targetId: asset.id,
          });
        } else {
          const newAsset = await apiRequest<{ id: string }>('/assets', { method: 'POST', body: JSON.stringify(printerPayload) });
          await logActivityEvent({
            module: 'asset',
            action: 'created',
            description: `Created printer asset ${values.serialNumber || values.model}`,
            performedBy: user.displayName || user.email || 'Admin',
            performedByEmail: user.email || '',
            targetName: values.serialNumber || values.model || 'Printer asset',
            targetId: newAsset.id,
          });
        }
      } else if (values.category === 'projector') {
        const projectorDisplayName = [values.manufacturer, values.model].filter(Boolean).join(' ').trim();

        const projectorPayload = {
          employeeId: '',
          employeeName: projectorDisplayName || 'Projector',
          userEmail: '',
          mobileNumber: '',
          department: '',
          location: values.location || 'TS Interseats India Pvt Ltd',
          owner: user.uid,
          category: 'projector',
          serialNumber: values.serialNumber || '',
          manufacturer: values.manufacturer,
          ownership: 'company',
          model: values.model,
          purchaseDate: values.purchaseDate ? new Date(values.purchaseDate) : new Date(),
          warrantyExpiration: values.warrantyExpiration ? new Date(values.warrantyExpiration) : new Date(),
          purchasePrice: values.purchasePrice ? Number(values.purchasePrice) : 0,
          condition: values.condition,
          status: values.status,
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
          notes: values.notes,
          tags: ['projector'],
          imageUrl: '',
          updatedAt: new Date(),
        };

        if (isEditMode && asset?.id) {
          await apiRequest(`/assets/${asset.id}`, { method: 'PUT', body: JSON.stringify(projectorPayload) });
          await logActivityEvent({
            module: 'asset',
            action: 'updated',
            description: `Updated projector asset ${values.serialNumber || values.model}`,
            performedBy: user.displayName || user.email || 'Admin',
            performedByEmail: user.email || '',
            targetName: values.serialNumber || values.model || 'Projector asset',
            targetId: asset.id,
          });
        } else {
          const newAsset = await apiRequest<{ id: string }>('/assets', { method: 'POST', body: JSON.stringify(projectorPayload) });
          await logActivityEvent({
            module: 'asset',
            action: 'created',
            description: `Created projector asset ${values.serialNumber || values.model}`,
            performedBy: user.displayName || user.email || 'Admin',
            performedByEmail: user.email || '',
            targetName: values.serialNumber || values.model || 'Projector asset',
            targetId: newAsset.id,
          });
        }
      } else {
        // Regular laptop/desktop submission
        const tags = values.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);

        const parseRAMSize = (ramStr: string): number => {
          const match = ramStr.match(/(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        };

        const parseStorageCapacity = (storageStr: string): number => {
          if (storageStr.includes('TB')) {
            const match = storageStr.match(/(\d+)/);
            return match ? parseInt(match[1], 10) * 1024 : 0;
          }
          const match = storageStr.match(/(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        };

        const rawPayload = {
          employeeId: values.employeeId,
          employeeName: values.employeeName,
          userEmail: values.userEmail,
          mobileNumber: values.mobileNumber,
          department: values.department,
          location: values.location,
          owner: user.uid,
          category: values.category,
          serialNumber: values.serialNumber,
          manufacturer: values.manufacturer,
          ownership: values.ownership,
          vendorName: values.ownership === 'vendor' ? values.vendorName : undefined,
          model: values.model,
          purchaseDate: values.purchaseDate ? new Date(values.purchaseDate) : null,
          warrantyExpiration: values.warrantyExpiration ? new Date(values.warrantyExpiration) : null,
          purchasePrice: values.purchasePrice ? Number(values.purchasePrice) : 0,
          condition: values.condition,
          status: values.status,
          cpuManufacturer: values.cpuManufacturer,
          cpuModel: values.cpuModel,
          cpuGeneration: values.cpuGeneration,
          ramType: values.ramType,
          ramSizeGb: values.ramSizeGb ? parseRAMSize(values.ramSizeGb) : undefined,
          storageType: values.storageType,
          storageCapacityGb: values.storageCapacityGb ? parseStorageCapacity(values.storageCapacityGb) : undefined,
          os: values.os,
          operatingSystemVersion: values.operatingSystemVersion,
          macAddress: values.macAddress,
          purchaseOrderNumber: values.purchaseOrderNumber,
          notes: values.notes,
          tags,
          imageUrl: '',
          updatedAt: new Date(),
        };

        const payload = Object.fromEntries(
          Object.entries(rawPayload).filter(([, value]) => value !== undefined)
        );

        if (isEditMode && asset?.id) {
          await apiRequest(`/assets/${asset.id}`, { method: 'PUT', body: JSON.stringify(payload) });
          await logActivityEvent({
            module: 'asset',
            action: 'updated',
            description: `Updated asset ${values.employeeName || values.serialNumber}`,
            performedBy: user.displayName || user.email || 'Admin',
            performedByEmail: user.email || '',
            targetName: values.employeeName || values.serialNumber || 'Asset',
            targetId: asset.id,
          });
        } else {
          const newAsset = await apiRequest<{ id: string }>('/assets', { method: 'POST', body: JSON.stringify(payload) });
          await logActivityEvent({
            module: 'asset',
            action: 'created',
            description: `Created asset ${values.employeeName || values.serialNumber}`,
            performedBy: user.displayName || user.email || 'Admin',
            performedByEmail: user.email || '',
            targetName: values.employeeName || values.serialNumber || 'Asset',
            targetId: newAsset.id,
          });
        }
      }

      await syncUserProfileFromAsset(user, values);
      setValues(initialState);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save asset');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="asset-form-card">
      <div className="asset-form-header">
        <h2>{isEditMode ? 'Edit Asset' : 'Add New Asset'}</h2>
        <button type="button" className="asset-form-close" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <form className="asset-form" onSubmit={handleSubmit}>
        <div className="grid-two-columns">
          {/* Category Selection - Always visible */}
          <label>
            Category
            <select name="category" value={values.category} onChange={handleChange} required>
              <option value="">Select Category</option>
              <option value="laptop">Laptop</option>
              <option value="desktop">Desktop</option>
              <option value="printer">Printer</option>
              <option value="projector">Projector</option>
              <option value="monitor">Monitor</option>
              <option value="network">Network</option>
              <option value="peripheral">Peripheral</option>
              <option value="other">Other</option>
            </select>
          </label>

          {/* PRINTER FORM */}
          {values.category === 'printer' && (
            <>
              <label>
                Printer Brand
                <select name="manufacturer" value={values.manufacturer} onChange={handleChange} required>
                  <option value="">Select Brand</option>
                  {MANUFACTURER_OPTIONS.printer.map((brand) => (
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
                  value={values.ipAddress || ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, ipAddress: e.target.value }))}
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
            </>
          )}

          {values.category === 'projector' && (
            <>
              <label>
                Projector Brand
                <select name="manufacturer" value={values.manufacturer} onChange={handleChange} required>
                  <option value="">Select Brand</option>
                  {MANUFACTURER_OPTIONS.projector.map((brand) => (
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
                Serial Number
                <input name="serialNumber" value={values.serialNumber} onChange={handleChange} required />
              </label>
              <label>
                Location
                <select name="location" value={values.location} onChange={handleChange} required>
                  <option value="">Select Location</option>
                  <option value="TS Interseats India Pvt Ltd">TS Interseats India Pvt Ltd</option>
                  <option value="Head Office">Head Office</option>
                  <option value="Training Room">Training Room</option>
                  <option value="Conference Room">Conference Room</option>
                </select>
              </label>
              <label className="wide-field">
                Notes
                <textarea name="notes" value={values.notes} onChange={handleChange} rows={4} />
              </label>
            </>
          )}

          {/* LAPTOP/DESKTOP FORM */}
          {(values.category === 'laptop' || values.category === 'desktop') && (
            <>
              <label>
                Employee ID
                <input name="employeeId" value={values.employeeId} onChange={handleChange} required />
              </label>
              <label>
                Employee Name
                <input name="employeeName" value={values.employeeName} onChange={handleChange} required />
              </label>
              <label>
                User Email
                <input name="userEmail" type="email" value={values.userEmail} onChange={handleChange} required />
              </label>
              <label>
                Mobile Number
                <input name="mobileNumber" value={values.mobileNumber} onChange={handleChange} placeholder="e.g., 9876543210" />
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
                Location
                <select name="location" value={values.location} onChange={handleChange} required>
                  <option value="TS Interseats India Pvt Ltd">TS Interseats India Pvt Ltd</option>
                </select>
              </label>
              <label>
                Serial Number
                <input name="serialNumber" value={values.serialNumber} onChange={handleChange} />
              </label>
              <label>
                Manufacturer
                <select name="manufacturer" value={values.manufacturer} onChange={handleChange} required>
                  <option value="">Select Manufacturer</option>
                  {values.category && MANUFACTURER_OPTIONS[values.category as keyof typeof MANUFACTURER_OPTIONS]
                    ? MANUFACTURER_OPTIONS[values.category as keyof typeof MANUFACTURER_OPTIONS].map((mfg) => (
                        <option key={mfg} value={mfg}>
                          {mfg}
                        </option>
                      ))
                    : null}
                </select>
              </label>
              <label>
                Ownership
                <select name="ownership" value={values.ownership} onChange={handleChange} required>
                  <option value="company">Company Asset</option>
                  <option value="vendor">Vendor Asset</option>
                </select>
              </label>
              {values.ownership === 'vendor' && (
                <label>
                  Vendor Name
                  <input
                    name="vendorName"
                    value={values.vendorName}
                    onChange={handleChange}
                    required={values.ownership === 'vendor'}
                  />
                </label>
              )}
              <label>
                Model
                <input name="model" value={values.model} onChange={handleChange} required />
              </label>
              <label>
                Purchase Date
                <input type="date" name="purchaseDate" value={values.purchaseDate} onChange={handleChange} required />
              </label>
              <label>
                Warranty Expiration
                <input type="date" name="warrantyExpiration" value={values.warrantyExpiration} onChange={handleChange} required />
              </label>
              <label>
                Purchase Price
                <input type="number" name="purchasePrice" value={values.purchasePrice} onChange={handleChange} min="0" required />
              </label>
              
              <label>
                Condition
                <select name="condition" value={values.condition} onChange={handleChange}>
                  <option value="new">New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                  <option value="retired">Retired</option>
                </select>
              </label>
              <label>
                Status
                <select name="status" value={values.status} onChange={handleChange}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </label>
              <label>
                CPU Manufacturer
                <select name="cpuManufacturer" value={values.cpuManufacturer} onChange={handleChange} required>
                  <option value="">Select CPU Manufacturer</option>
                  {CPU_MANUFACTURERS.map((cpu) => (
                    <option key={cpu} value={cpu}>
                      {cpu}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                CPU Model
                <select name="cpuModel" value={values.cpuModel} onChange={handleChange} required disabled={!values.cpuManufacturer}>
                  <option value="">Select CPU Model</option>
                  {(CPU_MODELS[values.cpuManufacturer] || []).map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                CPU Generation
                <select name="cpuGeneration" value={values.cpuGeneration} onChange={handleChange} required disabled={!values.cpuManufacturer}>
                  <option value="">Select CPU Generation</option>
                  {(CPU_GENERATIONS[values.cpuManufacturer] || []).map((generation) => (
                    <option key={generation} value={generation}>
                      {generation}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                RAM Type
                <select name="ramType" value={values.ramType} onChange={handleChange} required>
                  <option value="">Select RAM Type</option>
                  {RAM_TYPES.map((ramType) => (
                    <option key={ramType} value={ramType}>
                      {ramType}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                RAM Size (GB)
                <select name="ramSizeGb" value={values.ramSizeGb} onChange={handleChange} required>
                  <option value="">Select RAM Size</option>
                  {RAM_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Storage Type
                <select name="storageType" value={values.storageType} onChange={handleChange}>
                  <option value="HDD">HDD</option>
                  <option value="SSD">SSD</option>
                  <option value="NVMe">NVMe</option>
                  <option value="eMMC">eMMC</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                Storage Capacity (GB)
                <select name="storageCapacityGb" value={values.storageCapacityGb} onChange={handleChange} required>
                  <option value="">Select Storage Capacity</option>
                  {STORAGE_CAPACITIES.map((capacity) => (
                    <option key={capacity} value={capacity}>
                      {capacity}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Operating System
                <select name="os" value={values.os} onChange={handleChange} required>
                  <option value="">Select Operating System</option>
                  {OPERATING_SYSTEMS.map((os) => (
                    <option key={os} value={os}>
                      {os}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                OS Version
                <input name="operatingSystemVersion" value={values.operatingSystemVersion} onChange={handleChange} required />
              </label>
              <label>
                MAC Address
                <input name="macAddress" value={values.macAddress} onChange={handleChange} required />
              </label>
              <label>
                Purchase Order #
                <input name="purchaseOrderNumber" value={values.purchaseOrderNumber} onChange={handleChange} required />
              </label>
              <label className="wide-field">
                Tags (comma-separated)
                <input name="tags" value={values.tags} onChange={handleChange} placeholder="engineering, laptop" required />
              </label>
              <label className="wide-field">
                Notes
                <textarea name="notes" value={values.notes} onChange={handleChange} rows={4} required />
              </label>
            </>
          )}
        </div>

        {error && <div className="asset-form-error">{error}</div>}

        <div className="asset-form-actions">
          <button type="button" className="cancel-btn" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? 'Saving...' : isEditMode ? 'Update Asset' : 'Save Asset'}
          </button>
        </div>
      </form>
    </div>
  );
};
