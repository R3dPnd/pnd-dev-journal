import { Session } from './types';

const store = new Map<string, Session>();

export function createSession(session: Session): void {
  store.set(session.id, session);
}

export function getSession(id: string): Session | undefined {
  return store.get(id);
}

export function updateSession(id: string, patch: Partial<Session>): void {
  const session = store.get(id);
  if (session) store.set(id, { ...session, ...patch });
}
