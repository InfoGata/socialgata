import ThemeChangeSettings from '@/components/Settings/ThemeChangeSettings'
import CloudSyncSettings from '@/components/Settings/CloudSyncSettings'
import PluginSettings from '@/components/Settings/PluginSettings'
import NsfwSettings from '@/components/Settings/NsfwSettings'
import AnalyticsSettings from '@/components/Settings/AnalyticsSettings'
import { createFileRoute } from '@tanstack/react-router'

const Settings: React.FC  = () => {
  return (
    <div className="flex flex-col gap-4">
      <ThemeChangeSettings />
      <NsfwSettings />
      <PluginSettings />
      <CloudSyncSettings />
      <AnalyticsSettings />
    </div>
  )
}

export const Route = createFileRoute('/settings')({
  component: Settings
})