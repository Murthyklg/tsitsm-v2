import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useAuth } from '../hooks/useAuth';
import { useAssets } from '../hooks/useAssets';
import { useAssetRequests } from '../hooks/useAssetRequests';
import { AssetList } from '../components/AssetList';
import { AssetForm } from '../components/AssetForm';
import { AssetRequestForm } from '../components/AssetRequestForm';
import { RequestManagement } from '../components/RequestManagement';
import { AssetCounter } from '../components/AssetCounter';
import { ActivityLogsPanel } from '../components/ActivityLogsPanel';
import { UserMenu } from '../components/UserMenu';
import type { Asset } from '../types/asset';
import { logActivityEvent } from '../utils/activityLogs';
import { apiRequest } from '../api';
import logo from '../assets/companyLogo.png';
import './Dashboard.css';

type TabType = 'assets' | 'requests' | 'manage-requests';
type FilterType = 'all' | 'laptop' | 'desktop' | 'printer' | 'projector';

interface DashboardProps {
  onPortalSwitch?: (portal: 'assets' | 'incidents') => void;
  selectedPortal?: 'assets' | 'incidents';
}

export const Dashboard: React.FC<DashboardProps> = ({ onPortalSwitch }) => {
  const { user, logout, isAdmin } = useAuth();
  const { assets, loading, refetch } = useAssets(user?.uid, isAdmin, user?.email);
  const { requests, refetch: refetchRequests } = useAssetRequests(user?.uid, isAdmin);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('assets');
  const [selectedAssetFilter, setSelectedAssetFilter] = useState<FilterType>('all');
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const canManageAssets = Boolean(isAdmin);

  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen((open) => !open);

  const getAssetDisplayName = (asset: Asset): string => {
    if (asset.category === 'printer') {
      const printerName = [asset.manufacturer, asset.model].filter(Boolean).join(' ').trim();
      return printerName || asset.employeeName || 'Printer';
    }

    if (asset.category === 'projector') {
      const projectorName = [asset.manufacturer, asset.model].filter(Boolean).join(' ').trim();
      return projectorName || asset.employeeName || 'Projector';
    }

    return asset.employeeName || 'Asset';
  };

  const handleFilterChange = (filter: FilterType) => {
    setSelectedAssetFilter(filter);
  };

  const getFilteredAssets = () => {
    let filteredAssets = assets;
    
    if (selectedAssetFilter !== 'all') {
      filteredAssets = assets.filter((asset) => asset.category === selectedAssetFilter);
    }
    
    return filteredAssets.sort((a, b) => {
      return a.employeeName.localeCompare(b.employeeName);
    });
  };

  const handleEdit = (asset: Asset) => {
    if (!canManageAssets) {
      window.alert('Only itadmin@thaisummit.ind.in can edit assets.');
      return;
    }

    setSelectedAsset(null);
    setEditingAsset(asset);
    setShowForm(true);
  };

  const handleSelect = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  const handleCloseDetails = () => {
    setSelectedAsset(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAsset(null);
    refetch();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAsset(null);
  };

  const handleToggleAssetForm = () => {
    if (!canManageAssets) {
      window.alert('Only itadmin@thaisummit.ind.in can add assets.');
      return;
    }

    setEditingAsset(null);
    setShowForm((open) => !open);
  };

  const handleDelete = async (assetId: string) => {
    if (!isAdmin) {
      window.alert('Only admin users can delete assets.');
      return;
    }

    if (!assetId) {
      window.alert('Unable to delete asset: missing ID.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        const assetToDelete = assets.find((asset) => asset.id === assetId);
        await apiRequest(`/assets/${assetId}`, { method: 'DELETE' });
        await logActivityEvent({
          module: 'asset',
          action: 'deleted',
          description: `Deleted asset ${assetToDelete?.employeeName || assetId}`,
          performedBy: user?.displayName || user?.email || 'Admin',
          performedByEmail: user?.email || '',
          targetName: assetToDelete?.employeeName || assetToDelete?.serialNumber || assetId,
          targetId: assetId,
        });
        refetch();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : 'Failed to delete asset');
      }
    }
  };

  const formatDate = (date: Date | undefined): string => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  const getOwnershipLabel = (asset: Asset): string => {
    return asset.ownership === 'vendor' && asset.vendorName
      ? `${asset.ownership} — ${asset.vendorName}`
      : asset.ownership;
  };

  const assetDetailStyles = `
    body {
      font-family: Arial, sans-serif;
      margin: 10px 12px;
      line-height: 1.1;
      color: #222;
      background-color: #ffffff;
      font-size: 20px;
    }
    .print-header {
      border: 1px solid #1f2937;
      border-radius: 4px;
      padding: 10px 12px;
      margin-bottom: 10px;
      background: linear-gradient(90deg, #f8fafc 0%, #eef2ff 100%);
    }
    .print-header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    .print-company {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .print-company h1 {
      margin: 0;
      color: #0f172a;
      font-size: 20px;
    }
    .print-company p {
      margin: 2px 0 0;
      font-size: 9px;
      color: #475569;
    }
    .print-meta {
      text-align: right;
      font-size: 9px;
      color: #334155;
    }
    .print-title {
      text-align: center;
      font-size: 20px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
      margin: 4px 0 6px;
    }
    .print-subtitle {
      text-align: center;
      font-size: 9px;
      color: #475569;
      margin: 0;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 8px;
    }
    .details-section {
      margin-bottom: 6px;
      border: 1px solid #e2e8f0;
      border-radius: 3px;
      padding: 6px;
      background: #fcfdff;
    }
    .details-section h3 {
      background-color: #e2e8f0;
      padding: 4px 6px;
      margin: 0 0 4px 0;
      border-left: 3px solid #2563eb;
      font-size: 20px;
      text-transform: uppercase;
    }
    .detail-row {
      display: grid;
      grid-template-columns: 100px 1fr;
      padding: 2px 0;
      border-bottom: 1px dotted #e2e8f0;
      font-size: 15px;
      gap: 4px;
    }
    .detail-label {
      font-weight: bold;
      color: #0f172a;
    }
    .detail-value {
      color: #334155;
      word-break: break-word;
    }
    .signature-block {
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px solid #cbd5e1;
    }
    .signature-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 15px;
    }
    .signature-table th,
    .signature-table td {
      border: 1px solid #334155;
      padding: 3px;
      vertical-align: top;
      text-align: left;
    }
    .signature-box {
      min-height: 26px;
      border: 1px solid #94a3b8;
      border-radius: 2px;
      background: #fafafa;
    }
    .signature-table td[colspan="3"] .signature-box {
      min-height: 78px;
    }
    @media print {
      body {
        margin: 0;
      }
      button {
        display: none;
      }
    }
  `;

  const getAssetDetailHtmlContent = (asset: Asset): string => {
    return `
      <div class="print-header">
        <div class="print-header-top">
          <div class="print-company">
            <img src="${logo}" alt="Company Logo" style="max-height: 56px;" />
            <div>
              <h1>TS Interseats India Pvt Ltd</h1>
              <p>IT Asset Allocation & Return Form</p>
            </div>
          </div>
          <div class="print-meta">
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
            <div><strong>${asset.category === 'printer' ? 'Printer' : 'Employee'}:</strong> ${getAssetDisplayName(asset)}${asset.employeeId ? ` (${asset.employeeId})` : ''}</div>
          </div>
        </div>
        <div class="print-title">Asset Details</div>
        <p class="print-subtitle">Please retain this document for official records and asset handover reference.</p>
      </div>

      <div class="details-grid">
        <div class="details-section">
          <h3>Personal & Assignment</h3>
          <div class="detail-row">
            <span class="detail-label">Employee Name:</span>
            <span class="detail-value">${asset.employeeName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Employee ID:</span>
            <span class="detail-value">${asset.employeeId}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${asset.userEmail}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Mobile Number:</span>
            <span class="detail-value">${asset.mobileNumber || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Department:</span>
            <span class="detail-value">${asset.department}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Location:</span>
            <span class="detail-value">${asset.location}</span>
          </div>
        </div>

        <div class="details-section">
          <h3>Asset Information</h3>
          <div class="detail-row">
            <span class="detail-label">Category:</span>
            <span class="detail-value">${asset.category.charAt(0).toUpperCase() + asset.category.slice(1)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Model:</span>
            <span class="detail-value">${asset.model}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Serial Number:</span>
            <span class="detail-value">${asset.serialNumber}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Manufacturer:</span>
            <span class="detail-value">${asset.manufacturer}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Ownership:</span>
            <span class="detail-value">${getOwnershipLabel(asset)}</span>
          </div>
        </div>
      </div>

      <div class="details-grid">
        <div class="details-section">
          <h3>Purchase & Warranty</h3>
          <div class="detail-row">
            <span class="detail-label">Purchase Date:</span>
            <span class="detail-value">${formatDate(asset.purchaseDate)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Purchase Price:</span>
            <span class="detail-value">₹${asset.purchasePrice}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Warranty Expiration:</span>
            <span class="detail-value">${formatDate(asset.warrantyExpiration)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">PO Number:</span>
            <span class="detail-value">${asset.purchaseOrderNumber}</span>
          </div>
        </div>

        <div class="details-section">
          <h3>Condition & Status</h3>
          <div class="detail-row">
            <span class="detail-label">Condition:</span>
            <span class="detail-value">${asset.condition}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value">${asset.status}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">CPU:</span>
            <span class="detail-value">${asset.cpuManufacturer} ${asset.cpuModel} (${asset.cpuGeneration})</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">RAM:</span>
            <span class="detail-value">${asset.ramType} ${asset.ramSizeGb} GB</span>
          </div>
        </div>
      </div>

      <div class="details-grid">
        <div class="details-section">
          <h3>Technical Specs</h3>
          <div class="detail-row">
            <span class="detail-label">Storage:</span>
            <span class="detail-value">${asset.storageType} ${asset.storageCapacityGb} GB</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">OS:</span>
            <span class="detail-value">${asset.os} ${asset.operatingSystemVersion}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">MAC Address:</span>
            <span class="detail-value">${asset.macAddress}</span>
          </div>
        </div>

        <div class="details-section">
          <h3>Additional Information</h3>
          <div class="detail-row">
            <span class="detail-label">Tags:</span>
            <span class="detail-value">${asset.tags?.join(', ') || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Notes:</span>
            <span class="detail-value">${asset.notes}</span>
          </div>
        </div>
      </div>

      <div class="signature-block">
        <table class="signature-table">
          <tr>
            <th>Signature(Employee)</th>
            <th>Issue Date</th>
            <th>Signature(IT Admin)</th>
            <tr>
              <td colspan="1"><div class="signature-box"></div></td>
              <td colspan="1"><div class="signature-box"></div></td>
              <td colspan="1"><div class="signature-box"></div></td>
            </tr>
          </tr>
         
          <tr>
            <th colspan="3"  >Comments</th>
          </tr>
          <tr>
            <td colspan="3" >
              <div  class="signature-box"></div>
            </td>
          </tr>
          <tr>
            <th>Last Working Date</th>
            <th>Signature (IT Admin)</th>
            <th>Signature (GM)</th>
          </tr>
          <tr>
            <td><div class="signature-box"></div></td>
            <td><div class="signature-box"></div></td>
            <td><div class="signature-box"></div></td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #cbd5e1; text-align: center; font-size: 8.5px; color: #64748b;">
        <p style="margin: 0;">This document was automatically generated by ThaiSummit ITSM</p>
      </div>
    `;
  };

  const handleDownloadAllAssets = () => {
    const rows = [
      ['Employee Name', 'Employee ID', 'Email', 'Department', 'Location', 'Category', 'Model', 'Serial Number', 'Manufacturer', 'Ownership', 'Vendor Name', 'Purchase Date', 'Purchase Price', 'Warranty Expiration', 'Purchase Order Number', 'Condition', 'Status', 'CPU', 'RAM', 'Storage', 'OS', 'MAC Address', 'Tags', 'Notes', 'Created At', 'Updated At'],
    ];

    const formatValue = (value: unknown): string => {
      if (value === null || value === undefined) return '';
      if (value instanceof Date) return value.toLocaleDateString();
      if (Array.isArray(value)) return value.join(', ');
      return String(value);
    };

    const exportAssets = getFilteredAssets();

    exportAssets.forEach((asset) => {
      rows.push([
        formatValue(asset.employeeName),
        formatValue(asset.employeeId),
        formatValue(asset.userEmail),
        formatValue(asset.department),
        formatValue(asset.location),
        formatValue(asset.category?.charAt(0).toUpperCase() + asset.category?.slice(1)),
        formatValue(asset.model),
        formatValue(asset.serialNumber),
        formatValue(asset.manufacturer),
        formatValue(asset.ownership),
        formatValue(asset.vendorName),
        formatValue(asset.purchaseDate),
        formatValue(asset.purchasePrice),
        formatValue(asset.warrantyExpiration),
        formatValue(asset.purchaseOrderNumber),
        formatValue(asset.condition),
        formatValue(asset.status),
        formatValue(`${asset.cpuManufacturer} ${asset.cpuModel} ${asset.cpuGeneration}`.trim()),
        formatValue(`${asset.ramType} ${asset.ramSizeGb} GB`.trim()),
        formatValue(`${asset.storageType} ${asset.storageCapacityGb} GB`.trim()),
        formatValue(`${asset.os} ${asset.operatingSystemVersion}`.trim()),
        formatValue(asset.macAddress),
        formatValue(asset.tags),
        formatValue(asset.notes),
        formatValue(asset.createdAt),
        formatValue(asset.updatedAt),
      ]);
    });

    const csvContent = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'all-assets.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadAsset = async (asset: Asset) => {
    if (!asset) return;

    const element = document.createElement('div');
    element.style.backgroundColor = 'white';
    element.style.padding = '20px';
    element.style.maxWidth = '800px';
    element.innerHTML = `<style>${assetDetailStyles}</style>${getAssetDetailHtmlContent(asset)}`;

    document.body.appendChild(element);

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 180;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= 277;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= 277;
      }

      pdf.save(`asset-${asset.serialNumber || asset.employeeId}-${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      document.body.removeChild(element);
    }
  };

  const handlePrintAsset = (asset: Asset) => {
    if (!asset) return;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Asset Details - ${getAssetDisplayName(asset)}</title>
        <style>${assetDetailStyles}</style>
      </head>
      <body>
        ${getAssetDetailHtmlContent(asset)}
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header-brand">
          <img src={logo} alt="Company logo" className="header-logo" />
        </div>

        <div className="mobile-topbar-left">
          <button className="sidebar-toggle-btn" onClick={toggleSidebar} aria-label="Toggle sidebar">
            ☰
          </button>
          <div className="mobile-topbar-brand">
            <img src={logo} alt="Company logo" className="header-logo" />
          </div>
        </div>

        <UserMenu
          userEmail={user?.email ?? undefined}
          isAdmin={isAdmin}
          onShowLogs={() => setShowLogsModal(true)}
          onLogout={logout}
        />
      </header>

      <main className="dashboard-content">
        <div className={`dashboard-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
          {isSidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar} />}
          <aside className={`dashboard-sidebar ${isSidebarOpen ? 'sidebar-visible' : ''}`}>
            <div className="sidebar-topbar">
              <div className="sidebar-brand-row">
                <img src={logo} alt="App app logo" className="sidebar-logo" />
                <div>
                  <h1>ThaiSummit ITSM</h1>
                </div>
              </div>
              
            </div>
            <button className={`sidebar-link ${activeTab === 'assets' ? 'active' : ''}`} onClick={() => { setActiveTab('assets'); closeSidebar(); }}>
              Assets
            </button>
            <button className={`sidebar-link ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => { setActiveTab('requests'); closeSidebar(); }}>
              My Requests ({requests.length})
            </button>
            {isAdmin && (
              <button className={`sidebar-link ${activeTab === 'manage-requests' ? 'active' : ''}`} onClick={() => { setActiveTab('manage-requests'); closeSidebar(); }}>
                Manage Requests
              </button>
            )}
            <button className="sidebar-link " onClick={() => { onPortalSwitch?.('incidents'); closeSidebar(); }}>
              Incident Management
            </button>

            <div className="sidebar-footer">
              <p>Copyright © 2026</p>
              <p>
                Powered by{' '}
                <a href="https://www.topin.co.in" target="_blank" rel="noreferrer">
                  Topin Technologies
                </a>
              </p>
              <a href="https://www.topin.co.in" target="_blank" rel="noreferrer" className="sidebar-footer-link">
                www.topin.co.in
              </a>
            </div>
          </aside>

          <section className="dashboard-main">
            {/* Assets Tab */}
        {activeTab === 'assets' && (
          <>
            {showForm && user && canManageAssets && (
              <div className="asset-modal-overlay" onClick={handleFormCancel}>
                <div className="asset-modal" onClick={(event) => event.stopPropagation()}>
                  <AssetForm
                    user={user}
                    asset={editingAsset || undefined}
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                  />
                </div>
              </div>
            )}

            <section className="assets-section">
              <div className="section-header">
                <h2>Your Assets</h2>
                <div className="section-actions">
                  {canManageAssets && (
                    <button className="add-asset-btn" onClick={handleDownloadAllAssets}>
                      Download  Database
                    </button>
                  )}
                  {canManageAssets && (
                    <button className="add-asset-btn" onClick={handleToggleAssetForm}>
                      {showForm && !editingAsset ? 'Hide Form' : '+ Add New Asset'}
                    </button>
                  )}
                </div>
              </div>
              <AssetCounter 
                assets={assets} 
                loading={loading}
                selectedFilter={selectedAssetFilter}
                onFilterChange={handleFilterChange}
              />
              <AssetList
                assets={getFilteredAssets()}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSelect={handleSelect}
                isAdmin={canManageAssets}
              />
            </section>
          </>
        )}

        {/* My Requests Tab */}
        {activeTab === 'requests' && (
          <>
            {showRequestForm && user && (
              <section className="request-form-section">
                <AssetRequestForm
                  user={user}
                  onSuccess={() => {
                    setShowRequestForm(false);
                    refetchRequests();
                  }}
                  onCancel={() => setShowRequestForm(false)}
                />
              </section>
            )}

            <section className="requests-section">
              <div className="section-header">
                <h2>Asset Requests</h2>
                <button
  className={`add-request-btn ${showRequestForm ? "hide-btn" : ""}`}
  onClick={() => setShowRequestForm(open => !open)}
>
  {showRequestForm ? "Hide Form" : "+ Request New Asset"}
</button>
              </div>

              {requests.length === 0 ? (
                <div className="empty-requests">
                  <p>No asset requests yet. Click "Request New Asset" to create one.</p>
                </div>
              ) : (
                <div className="requests-grid">
                  {requests.map((req) => (
                    <div key={req.id} className="request-card">
                      <div className="request-card-header">
                        <h3>{req.category.charAt(0).toUpperCase() + req.category.slice(1)}</h3>
                        <span className={`status-badge status-${req.status}`}>{req.status}</span>
                      </div>
                      <div className="request-card-body">
                        <p>
                          <strong>Requested:</strong> {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                        <p>
                          <strong>Priority:</strong> <span className={`priority-${req.priority}`}>{req.priority}</span>
                        </p>
                        {req.manufacturer && <p><strong>Manufacturer:</strong> {req.manufacturer}</p>}
                        <p><strong>Status:</strong> {req.status}</p>
                        {req.adminNotes && (
                          <div className="admin-response">
                            <strong>Admin Response:</strong>
                            <p>{req.adminNotes}</p>
                          </div>
                        )}
                        <div className="request-comments">
                          <strong>Comments: {req.comments?.length || 0}</strong>
                          {req.comments && req.comments.length > 0 && (
                            <div className="comments-preview">
                              {req.comments.slice(-2).map((comment, idx) => (
                                <div key={idx} className="comment-preview">
                                  <small><strong>{comment.authorName}:</strong> {comment.text.substring(0, 100)}...</small>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* Manage Requests Tab (Admin Only) */}
        {activeTab === 'manage-requests' && isAdmin && <RequestManagement />}

        {isAdmin && showLogsModal && (
          <div className="logs-modal-overlay" onClick={() => setShowLogsModal(false)}>
            <div className="logs-modal" onClick={(event) => event.stopPropagation()}>
              <div className="logs-modal-header">
                <div>
                  <h2>Asset Management Logs</h2>
                  <p>Login, logout, asset changes, and related activities</p>
                </div>
                <button className="close-modal-btn" onClick={() => setShowLogsModal(false)}>&times;</button>
              </div>
              <div className="logs-modal-content">
                <ActivityLogsPanel moduleFilter="asset" extraModules={['auth']} title="Asset Management Activity Log" />
              </div>
            </div>
          </div>
        )}

        {/* Asset Details Modal */}
          </section>
        </div>
        {selectedAsset && (
          <div className="asset-modal-overlay" onClick={handleCloseDetails}>
            <div className="asset-modal" onClick={(event) => event.stopPropagation()}>
              <div className="asset-modal-header">
                <div>
                  <h2>{getAssetDisplayName(selectedAsset)}</h2>
                  <p className="asset-user-name">{selectedAsset.employeeId}</p>
                </div>
                <div className="modal-action-buttons">
                  <button className="modal-action-btn print-btn" onClick={() => handlePrintAsset(selectedAsset)} title="Print Asset Details">
                    🖨️ Print
                  </button>
                  <button className="modal-action-btn download-btn" onClick={() => handleDownloadAsset(selectedAsset)} title="Download Asset Details as CSV">
                    ⬇️ Download
                  </button>
                  <button className="close-modal-btn" onClick={handleCloseDetails}>&times;</button>
                </div>
              </div>
              <div className="asset-modal-content">
                <div className="asset-detail-row"><strong>Department:</strong> {selectedAsset.department}</div>
                <div className="asset-detail-row"><strong>Location:</strong> {selectedAsset.location}</div>
                <div className="asset-detail-row"><strong>Category:</strong> {selectedAsset.category.charAt(0).toUpperCase() + selectedAsset.category.slice(1)}</div>
                <div className="asset-detail-row"><strong>Model:</strong> {selectedAsset.model}</div>
                <div className="asset-detail-row"><strong>Serial Number:</strong> {selectedAsset.serialNumber}</div>
                <div className="asset-detail-row"><strong>Manufacturer:</strong> {selectedAsset.manufacturer}</div>
                <div className="asset-detail-row"><strong>Ownership:</strong> {selectedAsset.ownership}{selectedAsset.ownership === 'vendor' && selectedAsset.vendorName ? ` — ${selectedAsset.vendorName}` : ''}</div>
                <div className="asset-detail-row"><strong>Purchase Date:</strong> {selectedAsset.purchaseDate?.toString()}</div>
                <div className="asset-detail-row"><strong>Purchase Price:</strong> ₹{selectedAsset.purchasePrice}</div>
                <div className="asset-detail-row"><strong>Warranty Expiration:</strong> {selectedAsset.warrantyExpiration?.toString()}</div>
                <div className="asset-detail-row"><strong>Condition:</strong> {selectedAsset.condition}</div>
                <div className="asset-detail-row"><strong>Status:</strong> {selectedAsset.status}</div>
                <div className="asset-detail-row"><strong>CPU:</strong> {selectedAsset.cpuManufacturer} {selectedAsset.cpuModel} {selectedAsset.cpuGeneration}</div>
                <div className="asset-detail-row"><strong>RAM:</strong> {selectedAsset.ramType} {selectedAsset.ramSizeGb} GB</div>
                <div className="asset-detail-row"><strong>Storage:</strong> {selectedAsset.storageType} {selectedAsset.storageCapacityGb} GB</div>
                <div className="asset-detail-row"><strong>OS:</strong> {selectedAsset.os} {selectedAsset.operatingSystemVersion}</div>
                <div className="asset-detail-row"><strong>MAC Address:</strong> {selectedAsset.macAddress}</div>
                <div className="asset-detail-row"><strong>Purchase Order #:</strong> {selectedAsset.purchaseOrderNumber}</div>
                <div className="asset-detail-row"><strong>Tags:</strong> {selectedAsset.tags?.join(', ')}</div>
                <div className="asset-detail-row asset-notes"><strong>Notes:</strong> {selectedAsset.notes}</div>
                <div className="asset-detail-row"><strong>Created At:</strong> {selectedAsset.createdAt?.toString()}</div>
                <div className="asset-detail-row"><strong>Updated At:</strong> {selectedAsset.updatedAt?.toString()}</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
