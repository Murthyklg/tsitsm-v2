import { PublicClientApplication, type AccountInfo } from '@azure/msal-browser';

const tenantId = import.meta.env.VITE_MICROSOFT_TENANT_ID || 'f1dad057-a1be-4bcd-b374-50cba74582fd';
const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
const apiScope = import.meta.env.VITE_API_SCOPE || `api://${clientId}/access_as_user`;
const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

export const msal = clientId ? new PublicClientApplication({
  auth: { clientId, authority: `https://login.microsoftonline.com/${tenantId}`, redirectUri: window.location.origin },
  cache: { cacheLocation: 'sessionStorage' },
}) : null;

let initialized: Promise<void> | undefined;
export const initializeAuth = async () => {
  if (!msal) throw new Error('VITE_MICROSOFT_CLIENT_ID is not configured');
  initialized ??= msal.initialize();
  await initialized;
  const response = await msal.handleRedirectPromise();
  if (response?.account) msal.setActiveAccount(response.account);
};

export const getAccount = (): AccountInfo | null => msal?.getActiveAccount() || msal?.getAllAccounts()[0] || null;

export const getAccessToken = async () => {
  await initializeAuth();
  const account = getAccount();
  if (!account || !msal) throw new Error('Microsoft sign-in is required');
  try {
    const result = await msal.acquireTokenSilent({ account, scopes: [apiScope] });
    return result.accessToken;
  } catch {
    await msal.acquireTokenRedirect({ account, scopes: [apiScope] });
    throw new Error('Redirecting to Microsoft sign-in');
  }
};

export const apiRequest = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = await getAccessToken();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `API request failed (${response.status})`);
  }
  return response.status === 204 ? undefined as T : response.json();
};
