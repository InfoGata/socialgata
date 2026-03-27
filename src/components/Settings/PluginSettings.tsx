import { useDispatch, useSelector } from 'react-redux';
import { Puzzle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { setDisableAutoUpdatePlugins } from '@/store/reducers/uiSlice';
import type { RootState } from '@/store/store';

const PluginSettings: React.FC = () => {
  const dispatch = useDispatch();
  const disableAutoUpdatePlugins = useSelector(
    (state: RootState) => state.ui.disableAutoUpdatePlugins
  );

  const handleToggle = () => {
    dispatch(setDisableAutoUpdatePlugins(!disableAutoUpdatePlugins));
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Puzzle className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Plugins</h2>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Auto-Update Plugins</p>
          <p className="text-sm text-muted-foreground">
            Automatically update plugins when newer versions are available
          </p>
        </div>
        <Button
          variant={disableAutoUpdatePlugins ? 'outline' : 'default'}
          size="sm"
          onClick={handleToggle}
        >
          {disableAutoUpdatePlugins ? 'Disabled' : 'Enabled'}
        </Button>
      </div>
    </div>
  );
};

export default PluginSettings;
