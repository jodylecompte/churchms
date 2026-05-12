import { seedInitialAdmin } from '@/db/seed'

let initialized = false

export async function runStartup(): Promise<void> {
  if (initialized) return
  initialized = true

  try {
    await seedInitialAdmin()
  } catch (err) {
    console.error('[startup] Error during initialization:', err)
  }
}
