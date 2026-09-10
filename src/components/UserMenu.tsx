import React, { useState, useRef, useEffect } from 'react';
import './UserMenu.css';

interface UserMenuProps {
  userEmail: string | undefined;
  isAdmin: boolean;
  onShowLogs: () => void;
  onLogout: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  userEmail,
  isAdmin,
  onShowLogs,
  onLogout,
  
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleMenuItemClick = (callback: () => void) => {
    callback();
    setIsOpen(false);
  };

  return (
    <div className="user-menu-container" ref={menuRef}>
      <button 
        className="user-menu-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
      >
        
        <span className="user-menu-email">{userEmail}</span>
        <span className={`user-menu-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="user-menu-header">
            <span className="user-menu-email-full">{userEmail}</span>
          </div>
          
          {isAdmin && (
            <>
              <button 
                className="user-menu-item"
                onClick={() => handleMenuItemClick(onShowLogs)}
              >
                📋 View Logs
              </button>
              <div className="user-menu-divider"></div>
            </>
          )}

          <button 
            className="user-menu-item user-menu-logout"
            onClick={() => handleMenuItemClick(onLogout)}
          >
            🚪 Logout
          </button>
        </div>
      )}
    </div>
  );
};
