import ThemeChangeSettings from '@/components/Settings/ThemeChangeSettings'
import CloudSyncSettings from '@/components/Settings/CloudSyncSettings'
import PluginSettings from '@/components/Settings/PluginSettings'
import { createFileRoute } from '@tanstack/react-router'

const Settings: React.FC  = () => {
  return (
    <div className="flex flex-col gap-4">
      <ThemeChangeSettings />
      <PluginSettings />
      <CloudSyncSettings />
    </div>
  )
}

export const Route = createFileRoute('/settings')({
  component: Settings
})