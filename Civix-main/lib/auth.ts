export type AuthStatus = {
  authenticated: boolean;
  user?: { id: string; name: string };
};

export function getAuthStatus(): AuthStatus {
  return {
    authenticated: false
  };
}
