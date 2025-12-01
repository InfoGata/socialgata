import React from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { usePlugins } from "@/hooks/usePlugins";

interface PluginLoginProps {
  pluginId: string;
  isLoggedIn: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
}

function usePersistedState(
  key: string,
  defaultValue: string
): [string, React.Dispatch<React.SetStateAction<string>>] {
  const [state, setState] = React.useState(
    localStorage.getItem(key) || defaultValue
  );
  React.useEffect(() => {
    localStorage.setItem(key, state);
  }, [key, state]);
  return [state, setState];

}

const PluginLogin = (props: PluginLoginProps) => {
  const { pluginId, isLoggedIn, setIsLoggedIn } = props;
  const { plugins } = usePlugins();
  const plugin = plugins.find(p => p.id === pluginId);

  const [apiKey, setApiKey] = usePersistedState(`${pluginId}key`, "");
  const [apiSecret, setApiSecret] = usePersistedState(`${pluginId}secret`, "");

  const onChangeApiKey = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(event.currentTarget.value);
  };

  const onChangeApiSecret = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiSecret(event.currentTarget.value);
  };

  const login = async () => {
    if (plugin && await plugin.hasDefined.onLogin()) {
      await plugin.remote.onLogin({ apiKey: apiKey, apiSecret: apiSecret });
      if (await plugin.hasDefined.onIsLoggedIn()) {
        setIsLoggedIn(await plugin.remote.onIsLoggedIn());
      }
    }
  };

  const logout = async () => {
    if (plugin && await plugin.hasDefined.onLogout() && await plugin.hasDefined.onIsLoggedIn()) {
      await plugin.remote.onLogout();
      setIsLoggedIn(await plugin.remote.onIsLoggedIn());
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Input
        type="text"
        placeholder="API Key"
        value={apiKey}
        onChange={onChangeApiKey}
      />
      <Input
        type="text"
        placeholder="API Secret"
        value={apiSecret}
        onChange={onChangeApiSecret}
      />
      {isLoggedIn ? (
        <Button onClick={logout}>Logout</Button>
      ) : (
        <Button onClick={login}>Login to {plugin?.name}</Button>
      )}
    </div>
  );
}

export default PluginLogin;