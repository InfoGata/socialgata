import ThemeChangeSettings from '@/components/Settings/ThemeChangeSettings'
import { createFileRoute } from '@tanstack/react-router'

const Settings: React.FC  = () => {
  return (
    <div className="flex flex-col gap-4">
      <ThemeChangeSettings />
    </div>
  )
}

export const Route = createFileRoute('/settings')({
  component: Settings
})