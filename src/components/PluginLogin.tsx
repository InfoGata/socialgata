import React from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { getService } from "@/services/selector-service";

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

  const [apiKey, setApiKey] = usePersistedState(`${pluginId}key`, "");
  const [apiSecret, setApiSecret] = usePersistedState(`${pluginId}secret`, "");

  const onChangeApiKey = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(event.currentTarget.value);
  };

  const onChangeApiSecret = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiSecret(event.currentTarget.value);
  };

  const login = async () => {
    const service = getService(pluginId);
    if (service && service.login) {
      await service.login({ apiKey: apiKey, apiSecret: apiSecret });
    }
  };

  const logout = async () => {
    const service = getService(pluginId);
    if (service && service.logout && service.isLoggedIn) {
      await service.logout();
      setIsLoggedIn(await service.isLoggedIn());
    }
  };

  return <div>
      <Input type="text" value={apiKey} onChange={onChangeApiKey} />
      <Input type="text" value={apiSecret} onChange={onChangeApiSecret} />
      {isLoggedIn ? <Button onClick={logout}>Logout</Button> : <Button onClick={login}>Login</Button>}
    </div>
}

export default PluginLogin;