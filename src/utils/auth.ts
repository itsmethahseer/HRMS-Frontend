/**
 * useCurrentUser — reads the logged-in user context from localStorage.
 * Populated at login time from the JWT response.
 */
export interface CurrentUser {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  schemaName: string;
  companyName: string;
}

export function getCurrentUser(): CurrentUser | null {
  const userId = localStorage.getItem('user_id');
  const email = localStorage.getItem('user_email');
  if (!userId || !email) return null;

  return {
    userId: parseInt(userId),
    email,
    firstName: localStorage.getItem('first_name') ?? '',
    lastName: localStorage.getItem('last_name') ?? '',
    isAdmin: localStorage.getItem('is_admin') === 'true',
    schemaName: localStorage.getItem('schema_name') ?? '',
    companyName: localStorage.getItem('company_name') ?? '',
  };
}

export function saveCurrentUser(data: {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_superuser: boolean;
  schema_name: string;
  company_name: string;
  access_token: string;
}) {
  localStorage.setItem('token', data.access_token);
  localStorage.setItem('user_id', String(data.user_id));
  localStorage.setItem('user_email', data.email);
  localStorage.setItem('first_name', data.first_name);
  localStorage.setItem('last_name', data.last_name);
  localStorage.setItem('is_admin', String(data.is_superuser));
  localStorage.setItem('schema_name', data.schema_name);
  localStorage.setItem('company_name', data.company_name);
}

export function clearCurrentUser() {
  ['token', 'user_id', 'user_email', 'first_name', 'last_name', 'is_admin', 'schema_name', 'company_name'].forEach(k =>
    localStorage.removeItem(k)
  );
}
