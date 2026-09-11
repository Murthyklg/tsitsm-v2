import { useEffect, useState } from 'react';
import type { AccountInfo } from '@azure/msal-browser';
import { apiRequest, getAccount, getMicrosoftProfile, initializeAuth, msal } from '../api';
import type { UserProfile } from '../types/asset';
import { logActivityEvent } from '../utils/activityLogs';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber: string | null;
  emailVerified: boolean;
  department?: string;
}

const ADMIN_EMAIL = 'itadmin@thaisummit.ind.in';
const currentUserNameFallback = (account: AccountInfo): string => account.name || account.username || 'User';

const accountToUser = (account: AccountInfo, phoneNumber?: string | null, department?: string): AppUser => ({
  uid: account.localAccountId || account.homeAccountId,
  email: account.username,
  displayName: account.name || account.username,
  phoneNumber: phoneNumber || null,
  emailVerified: true,
  department: department || '',
});

const PROFILE_STORAGE_KEY = 'tsitsm-user-profile';
const saveStoredProfile = (profile: Partial<UserProfile> & { displayName?: string; mobile?: string; department?: string }) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // ignore storage write errors
  }
};

const readStoredProfile = (): Partial<UserProfile> | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

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

        const storedProfile = readStoredProfile();
        const backendProfile = await apiRequest<UserProfile | null>('/profile');
        const serverProfile = backendProfile || storedProfile;

        if (serverProfile) {
          const nextDepartment = serverProfile.department || storedProfile?.department || '';
          const nextMobile = serverProfile.mobile || storedProfile?.mobile || '';
          const nextDisplayName = serverProfile.displayName || serverProfile.employeeName || storedProfile?.displayName || currentUserNameFallback(account);
          setUser((current) => current ? {
            ...current,
            displayName: nextDisplayName || current.displayName,
            phoneNumber: nextMobile || current.phoneNumber,
            department: nextDepartment || current.department || '',
          } : current);
          saveStoredProfile({
            ...serverProfile,
            displayName: nextDisplayName,
            mobile: nextMobile,
            department: nextDepartment,
          });
        }

        if (me.name) {
          setUser((current) => current ? { ...current, displayName: me.name! } : current);
        }

        const entraProfile = await getMicrosoftProfile();
        const displayName = entraProfile.displayName?.trim();
        const department = (entraProfile.department || entraProfile.onPremisesDepartment)?.trim();
        const mobile = entraProfile.mobilePhone?.trim();

        await apiRequest('/profile/sync', {
          method: 'PUT',
          body: JSON.stringify({ displayName, department, mobile }),
        });

        const refreshedProfile = await apiRequest<UserProfile | null>('/profile');
        const updatedDepartment = refreshedProfile?.department || department || serverProfile?.department || '';
        const updatedMobile = refreshedProfile?.mobile || mobile || serverProfile?.mobile || '';
        const updatedDisplayName = refreshedProfile?.displayName || refreshedProfile?.employeeName || displayName || me.name || account.name || 'User';

        saveStoredProfile({
          ...refreshedProfile,
          displayName: updatedDisplayName,
          mobile: updatedMobile,
          department: updatedDepartment,
        });

        setUser((current) => current ? {
          ...current,
          displayName: updatedDisplayName,
          phoneNumber: updatedMobile || current.phoneNumber,
          department: updatedDepartment || current.department || '',
        } : current);
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
