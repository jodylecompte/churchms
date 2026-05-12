import type { SessionData } from './session'

type SystemRole = SessionData['systemRole']

const roleRank: Record<SystemRole, number> = {
  super_admin: 4,
  admin: 3,
  staff: 2,
  member: 1,
}

export function hasRole(userRole: SystemRole, required: SystemRole): boolean {
  return roleRank[userRole] >= roleRank[required]
}

export function requireRole(session: SessionData | null, required: SystemRole): void {
  if (!session) throw new Error('Unauthenticated')
  if (!hasRole(session.systemRole, required)) {
    throw new Error('Forbidden')
  }
}
