import Feed from "@/components/Feed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getService } from "@/services/selector-service";
import { createFileRoute } from "@tanstack/react-router";
import React from "react";

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

export const Index: React.FC = () => {
  const [pluginId, setPluginId] = React.useState("reddit");
  const [apiKey, setApiKey] = usePersistedState("redditkey", "");
  const [apiSecret, setApiSecret] = usePersistedState("redditsecret", "");
  const [hasLogin, setHasLogin] = React.useState(false);
  const [isLoggedin, setIsLoggedIn] = React.useState(false);
  const showFeed = !hasLogin || isLoggedin;

  React.useEffect(() => {
    const getLoginStatus = async () => {
      const service = getService(pluginId);
      if (service) {
        setHasLogin(!!service.login);
        if (service.isLoggedIn) {
          setIsLoggedIn(await service.isLoggedIn());
        }
      } else {
        setHasLogin(false);
        setIsLoggedIn(false);
      }
    };
    getLoginStatus();
  }, [pluginId]);

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

  const onPluginChange = (value: string) => {
    setPluginId(value);
  };

  return (
    <div>
      <Select value={pluginId} onValueChange={onPluginChange}>
        <SelectTrigger>
          <SelectValue placeholder="Plugin" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="reddit">Reddit</SelectItem>
          <SelectItem value="mastodon">Mastodon</SelectItem>
          <SelectItem value="lemmy">Lemmy</SelectItem>
        </SelectContent>
      </Select>
      {hasLogin && (
        <div>
          <Input
            type="text"
            placeholder="Reddit Api Key"
            value={apiKey}
            onChange={onChangeApiKey}
          />
          <Input
            type="text"
            placeholder="Reddit Api Secret"
            value={apiSecret}
            onChange={onChangeApiSecret}
          />
          {isLoggedin ? (
            <Button onClick={logout}>Logout</Button>
          ) : (
            <Button onClick={login}>Login</Button>
          )}
        </div>
      )}
      {showFeed && <Feed pluginId={pluginId} />}
    </div>
  );
};

export const Route = createFileRoute("/")({
  component: Index,
});
