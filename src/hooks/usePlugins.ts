import { useContext } from "react";
import { PluginsContext } from "@/contexts/PluginsContext";

export const usePlugins = () => {
  const context = useContext(PluginsContext);
  if (!context) {
    throw new Error("usePlugins must be used within a PluginsProvider");
  }
  return context;
};
