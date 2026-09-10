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

export const getAccessToken = async (forceRefresh = false) => {
  await initializeAuth();
  const account = getAccount();
  if (!account || !msal) throw new Error('Microsoft sign-in is required');
  try {
    const result = await msal.acquireTokenSilent({ account, scopes: [apiScope], forceRefresh });
    return result.accessToken;
  } catch {
    await msal.acquireTokenRedirect({ account, scopes: [apiScope] });
    throw new Error('Redirecting to Microsoft sign-in');
  }
};

export const getMicrosoftProfile = async () => {
  await initializeAuth();
  const account = getAccount();
  if (!account || !msal) throw new Error('Microsoft sign-in is required');

  let result;
  try {
    result = await msal.acquireTokenSilent({ account, scopes: ['User.Read'] });
  } catch {
    await msal.acquireTokenRedirect({ account, scopes: ['User.Read'] });
    throw new Error('Redirecting to Microsoft profile consent');
  }

  const response = await fetch('https://graph.microsoft.com/v1.0/me?$select=displayName,department,onPremisesDepartment,mobilePhone,mail,userPrincipalName', {
    headers: { Authorization: `Bearer ${result.accessToken}` },
  });
  if (!response.ok) throw new Error(`Microsoft profile request failed (${response.status})`);
  return response.json() as Promise<{
    displayName?: string;
    department?: string;
    onPremisesDepartment?: string;
    mobilePhone?: string;
    mail?: string;
    userPrincipalName?: string;
  }>;
};

export const apiRequest = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = await getAccessToken();
  const request = (accessToken: string) => fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`, ...options.headers },
  });
  let response: Response;
  try {
    response = await request(token);
  } catch (error) {
    if (apiBaseUrl === '/api' && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      throw new Error('API is not configured for this deployment. Set VITE_API_URL to the public API URL, then redeploy the frontend.');
    }
    throw error;
  }
  if (response.status === 401) {
    try {
      response = await request(await getAccessToken(true));
    } catch (error) {
      throw error;
    }
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `API request failed (${response.status})`);
  }
  return response.status === 204 ? undefined as T : response.json();
};
