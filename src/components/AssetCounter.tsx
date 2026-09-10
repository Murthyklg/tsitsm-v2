import React from 'react';
import type { Asset } from '../types/asset';
import './AssetCounter.css';

type FilterType = 'all' | 'laptop' | 'desktop' | 'printer' | 'projector';

interface AssetCounterProps {
  assets: Asset[];
  loading: boolean;
  selectedFilter?: FilterType;
  onFilterChange?: (filter: FilterType) => void;
}

export const AssetCounter: React.FC<AssetCounterProps> = ({ 
  assets, 
  loading, 
  selectedFilter = 'all',
  onFilterChange 
}) => {
  const totalAssets = assets.length;
  const laptopCount = assets.filter((asset) => asset.category === 'laptop').length;
  const laptopCompanyCount = assets.filter((asset) => asset.category === 'laptop' && asset.ownership === 'company').length;
  const laptopRentalCount = assets.filter((asset) => asset.category === 'laptop' && asset.ownership === 'vendor').length;
  const desktopCount = assets.filter((asset) => asset.category === 'desktop').length;
  const desktopCompanyCount = assets.filter((asset) => asset.category === 'desktop' && asset.ownership === 'company').length;
  const desktopRentalCount = assets.filter((asset) => asset.category === 'desktop' && asset.ownership === 'vendor').length;
  const printerCount = assets.filter((asset) => asset.category === 'printer').length;
  const projectorCount = assets.filter((asset) => asset.category === 'projector').length;

  if (loading) {
    return <div className="asset-counter-loading">Loading asset statistics...</div>;
  }

  return (
    <div className="asset-counter">
      <div 
        className={`counter-card total ${selectedFilter === 'all' ? 'active' : ''}`}
        onClick={() => onFilterChange?.('all')}
        role="button"
        tabIndex={0}
      >
        <div className="counter-icon">📊</div>
        <div className="counter-content">
          <span className="counter-label">Total Assets</span>
          <span className="counter-value">{totalAssets}</span>
        </div>
      </div>
      <div 
        className={`counter-card laptop ${selectedFilter === 'laptop' ? 'active' : ''}`}
        onClick={() => onFilterChange?.('laptop')}
        role="button"
        tabIndex={0}
      >
        <div className="counter-icon">💻</div>
        <div className="counter-content">
          <span className="counter-label">Laptops</span>
          <span className="counter-value">{laptopCount}</span>
          <span className="counter-subtext">Company: {laptopCompanyCount} · Rental: {laptopRentalCount}</span>
        </div>
      </div>
      <div 
        className={`counter-card desktop ${selectedFilter === 'desktop' ? 'active' : ''}`}
        onClick={() => onFilterChange?.('desktop')}
        role="button"
        tabIndex={0}
      >
        <div className="counter-icon">🖥️</div>
        <div className="counter-content">
          <span className="counter-label">Desktops</span>
          <span className="counter-value">{desktopCount}</span>
          <span className="counter-subtext">Company: {desktopCompanyCount} · Rental: {desktopRentalCount}</span>
        </div>
      </div>
      <div 
        className={`counter-card printer ${selectedFilter === 'printer' ? 'active' : ''}`}
        onClick={() => onFilterChange?.('printer')}
        role="button"
        tabIndex={0}
      >
        <div className="counter-icon">🖨️</div>
        <div className="counter-content">
          <span className="counter-label">Printers</span>
          <span className="counter-value">{printerCount}</span>
        </div>
      </div>
      <div 
        className={`counter-card projector ${selectedFilter === 'projector' ? 'active' : ''}`}
        onClick={() => onFilterChange?.('projector')}
        role="button"
        tabIndex={0}
      >
        <div className="counter-icon">📽️</div>
        <div className="counter-content">
          <span className="counter-label">Projectors</span>
          <span className="counter-value">{projectorCount}</span>
        </div>
      </div>
    </div>
  );
};
