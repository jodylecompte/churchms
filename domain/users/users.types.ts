export type SystemRole = 'super_admin' | 'admin' | 'staff' | 'member'
export type AccountStatus = 'active' | 'invited' | 'suspended'

export type PublicUser = {
  id: string
  email: string
  systemRole: SystemRole
  accountStatus: AccountStatus
  personId: string | null
  lastLoginAt: Date | null
}
