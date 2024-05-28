import LogginedIn from "@/components/LoggedIn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAccessToken } from "@/store/reducers/authSlice";
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
  const [redditApiKey, setRedditApiKey] = usePersistedState("redditkey", "");
  const [redditApiSecret, setRedditApiSecret] = usePersistedState(
    "redditsecret",
    ""
  );
  const token = useAppSelector((state) => state.auth.accessToken);
  const dispatch = useAppDispatch();

  const setApiKey = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRedditApiKey(event.currentTarget.value);
  };

  const setApiSecret = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRedditApiSecret(event.currentTarget.value);
  };

  const loginReddit = async () => {
    const tokenUrl = "https://www.reddit.com/api/v1/access_token";
    const redirectUri = "http://localhost:3000/login_popup.html";
    const authUrl = "https://www.reddit.com/api/v1/authorize";
    const responseType = "code";
    const state = "12345";
    const scope = "read history";
    const duration = "permanent";
    const url = new URL(authUrl);
    url.searchParams.append("redirect_uri", redirectUri);
    url.searchParams.append("client_id", redditApiKey);
    url.searchParams.append("state", state);
    url.searchParams.append("response_type", responseType);
    url.searchParams.append("duration", duration);
    url.searchParams.append("scope", scope);
    const newWindow = window.open(url);

    const onMessage = async (returnUrl: string) => {
      const codeUrl = new URL(returnUrl);
      const code = codeUrl.searchParams.get("code");
      if (code) {
        const auth = btoa(`${redditApiKey}:${redditApiSecret}`);
        const params = new URLSearchParams();
        params.append("code", code);
        params.append("grant_type", "authorization_code");
        params.append("redirect_uri", redirectUri);
        const response = await fetch(tokenUrl, {
          method: "POST",
          body: params.toString(),
          headers: {
            "Content-type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${auth}`,
          },
        });
        const json = await response.json();
        dispatch(setAccessToken(json.access_token));
      }
      if (newWindow) {
        newWindow.close();
      }
    };

    window.onmessage = (event: MessageEvent) => {
      if (event.source == newWindow) {
        onMessage(event.data.url);
      }
    };
  };

  const logoutReddit = async () => {
    dispatch(setAccessToken(""));
    useAppDispatch;
  };

  return (
    <div>
      <Input
        type="text"
        placeholder="Reddit Api Key"
        value={redditApiKey}
        onChange={setApiKey}
      />
      <Input
        type="text"
        placeholder="Reddit Api Secret"
        value={redditApiSecret}
        onChange={setApiSecret}
      />
      <Button onClick={loginReddit}>Get Token</Button>
      {token && (
        <div>
          <Button onClick={logoutReddit}>Logout</Button>
          <div>{token}</div>
          <LogginedIn accessToken={token} />
        </div>
      )}
    </div>
  );
};

export const Route = createFileRoute("/")({
  component: Index,
});
