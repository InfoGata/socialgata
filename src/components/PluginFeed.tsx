import { getService } from "@/services/selector-service";
import React from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

type Props = {
  pluginId: string;
};

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

const PluginFeed: React.FC<Props> = (props) => {
  const { pluginId } = props;
  const [apiKey, setApiKey] = usePersistedState(`${pluginId}key`, "");
  const [apiSecret, setApiSecret] = usePersistedState(`${pluginId}secret`, "");
  const [hasLogin, setHasLogin] = React.useState(false);
  const [showGetFeed, setShowGetFeed] = React.useState(false);

  const onApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(event.currentTarget.value);
  };

  const onApiSecretChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiSecret(event.currentTarget.value);
  };

  React.useEffect(() => {
    const service = getService(pluginId);
    setHasLogin(!!service?.login);
  }, [pluginId]);

  const onLogin = async () => {
    const service = getService(pluginId);
    if (service?.login) {
      await service.login(apiKey, apiSecret);
    }
  };

  const onLogout = async () => {
    const service = getService(pluginId);
    if (service?.logout) {
      await service.logout();
    }
  }

  const onGetFeed = async () => {
    const service = getService(pluginId);
  }

  return (
    <div>
      <Input
        type="text"
        placeholder="Reddit Api Key"
        value={apiKey}
        onChange={onApiKeyChange}
      />
      <Input
        type="text"
        placeholder="Reddit Api Secret"
        value={apiSecret}
        onChange={onApiSecretChange}
      />
      {hasLogin && <Button onClick={onLogin}>Get Token</Button>}
      {showGetFeed && }
    </div>
  );
};

export default PluginFeed;
