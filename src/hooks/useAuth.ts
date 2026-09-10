import { useEffect, useState } from 'react';
import type { AccountInfo } from '@azure/msal-browser';
import { apiRequest, getAccount, initializeAuth, msal } from '../api';
import type { UserProfile } from '../types/asset';
import { logActivityEvent } from '../utils/activityLogs';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber: string | null;
  emailVerified: boolean;
}

const ADMIN_EMAIL = 'itadmin@thaisummit.ind.in';
const accountToUser = (account: AccountInfo): AppUser => ({
  uid: account.localAccountId || account.homeAccountId,
  email: account.username,
  displayName: account.name || account.username,
  phoneNumber: null,
  emailVerified: true,
});

export const useAuth = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    initializeAuth().then(async () => {
      const account = getAccount();
      if (!account) return;
      const nextUser = accountToUser(account);
      setUser(nextUser);
      setIsAdmin(nextUser.email.toLowerCase() === ADMIN_EMAIL);
      try {
        const me = await apiRequest<{ isAdmin?: boolean; name?: string }>('/me');
        setIsAdmin(Boolean(me.isAdmin));
        if (me.name) setUser((current) => current ? { ...current, displayName: me.name! } : current);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load account');
      }
    }).catch((authError) => {
      setError(authError instanceof Error ? authError.message : 'Microsoft authentication failed');
    }).finally(() => setLoading(false));
  }, []);

  const loginWithMicrosoft = async (): Promise<boolean> => {
    try {
      setError(null);
      if (!msal) throw new Error('Microsoft authentication is not configured');
      await initializeAuth();
      await msal.loginRedirect({ scopes: [import.meta.env.VITE_API_SCOPE || `api://${import.meta.env.VITE_MICROSOFT_CLIENT_ID}/access_as_user`] });
      return false;
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Microsoft sign-in failed');
      return false;
    }
  };

  const logout = async () => {
    setError(null);
    await logActivityEvent({ module: 'auth', action: 'logout', description: 'Signed out of the system', performedBy: user?.displayName || 'User', performedByEmail: user?.email || '' });
    await msal?.logoutRedirect({ account: getAccount() });
  };

  const createUserProfile = async (profile: Omit<UserProfile, 'uid' | 'createdAt'>): Promise<boolean> => {
    try {
      setError(null);
      await apiRequest('/profile', { method: 'PUT', body: JSON.stringify(profile) });
      return true;
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : 'Failed to create profile');
      return false;
    }
  };

  const completePasswordReset = async (_oobCode?: string, _newPassword?: string): Promise<boolean> => {
    setError('Password reset is managed by Microsoft Entra ID.');
    return false;
  };

  return { user, loading, error, loginWithMicrosoft, logout, createUserProfile, completePasswordReset, isAdmin };
};
