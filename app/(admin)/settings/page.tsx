import { getSettings } from '@/domain/settings/settings.service'
import { SettingsForm } from '@/components/features/shared/settings-form'

export default async function SettingsPage() {
  const settings = await getSettings()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your church information.</p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  )
}
