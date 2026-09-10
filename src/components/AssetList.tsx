import React, { useState } from 'react';
import type { Asset } from '../types/asset';
import './AssetList.css';

interface AssetListProps {
  assets: Asset[];
  loading: boolean;
  onEdit: (asset: Asset) => void;
  onDelete: (assetId: string) => void;
  onSelect: (asset: Asset) => void;
  isAdmin?: boolean;
}

const getAssetDisplayName = (asset: Asset): string => {
  if (asset.category === 'printer') {
    const printerName = [asset.manufacturer, asset.model].filter(Boolean).join(' ').trim();
    return printerName || asset.employeeName || 'Printer';
  }

  return asset.employeeName || 'Asset';
};

export const AssetList: React.FC<AssetListProps> = ({ 
  assets, 
  loading, 
  onEdit, 
  onDelete,
  onSelect,
  isAdmin = false,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (loading) {
    return <div className="loading">Loading assets...</div>;
  }

  if (assets.length === 0) {
    return <div className="no-assets">No assets found</div>;
  }

  const toggleViewMode = () => setViewMode((mode) => (mode === 'grid' ? 'list' : 'grid'));

  return (
    <div className="asset-list">
      <div className="asset-list-controls">
        <button
          type="button"
          className="view-toggle-btn"
          onClick={toggleViewMode}
          aria-label={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
        >
          <span className="view-icon">{viewMode === 'grid' ? '≡' : '▦'}</span>
          <span className="sr-only">Switch to {viewMode === 'grid' ? 'list' : 'grid'} view</span>
        </button>
      </div>

      {viewMode === 'grid' ? (
        <div className="asset-card-grid">
          {assets.map((asset) => (
            <div key={asset.id} className="asset-card">
              <button type="button" className="asset-card-main" onClick={() => onSelect(asset)}>
                <div className="asset-card-header">
                  <div>
                    <h3>{getAssetDisplayName(asset)}</h3>
                    <p className="asset-user-name">{asset.category === 'printer' ? asset.department : asset.model}</p>
                  </div>
                  <span className={`status-badge status-${asset.status}`}>{asset.status}</span>
                </div>
                <div className="asset-card-body">
                  <p><strong>Category:</strong> {asset.category.charAt(0).toUpperCase() + asset.category.slice(1)}</p>
                  <p><strong>Serial:</strong> {asset.serialNumber}</p>
                  <p><strong>Ownership:</strong> {asset.ownership}{asset.ownership === 'vendor' && asset.vendorName ? ` — ${asset.vendorName}` : ''}</p>
                </div>
              </button>
              <div className="asset-card-actions">
                {isAdmin ? (
                  <>
                    <button className="action-btn" onClick={() => onEdit(asset)}>Edit</button>
                    <button className="action-btn delete-btn" onClick={() => onDelete(asset.id ?? '')}>Delete</button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="asset-list-table">
          <div className="asset-table-header">
            <span>Asset</span>
            <span>Category</span>
            <span>Status</span>
            <span>Serial</span>
            <span>Ownership</span>
            {isAdmin ? <span>Actions</span> : <span />}
          </div>

          {assets.map((asset) => (
            <div key={asset.id} className="asset-table-row">
              <button type="button" className="asset-table-cell asset-title-cell" onClick={() => onSelect(asset)}>
                <div>
                  <strong>{getAssetDisplayName(asset)}</strong>
                  <div className="asset-table-meta">{asset.category === 'printer' ? asset.department : asset.model}</div>
                </div>
              </button>
              <div className="asset-table-cell">{asset.category.charAt(0).toUpperCase() + asset.category.slice(1)}</div>
              <div className="asset-table-cell">
                <span className={`status-badge status-${asset.status}`}>{asset.status}</span>
              </div>
              <div className="asset-table-cell">{asset.serialNumber}</div>
              <div className="asset-table-cell">{asset.ownership}{asset.ownership === 'vendor' && asset.vendorName ? ` — ${asset.vendorName}` : ''}</div>
              {isAdmin ? (
                <div className="asset-table-cell asset-table-actions">
                  <button className="action-btn" onClick={() => onEdit(asset)}>Edit</button>
                  <button className="action-btn delete-btn" onClick={() => onDelete(asset.id ?? '')}>Delete</button>
                </div>
              ) : (
                <div className="asset-table-cell" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
