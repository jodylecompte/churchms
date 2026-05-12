import { db } from './client'
import { users } from './schema'
import { createUser, countUsers } from '@/domain/users/users.service'

export async function seedInitialAdmin(): Promise<void> {
  const email = process.env.INITIAL_ADMIN_EMAIL
  const password = process.env.INITIAL_ADMIN_PASSWORD

  if (!email || !password) return

  const count = await countUsers()
  if (count > 0) return

  console.log(`[seed] Creating initial super_admin: ${email}`)
  await createUser({
    email,
    password,
    systemRole: 'super_admin',
    accountStatus: 'active',
  })
}
