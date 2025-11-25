import Dexie from "dexie";
import { PluginInfo } from "./plugintypes";
import { PluginAuthentication } from "./types";

class SocialGataDatabase extends Dexie {
  plugins: Dexie.Table<PluginInfo, string>;
  pluginAuths: Dexie.Table<PluginAuthentication, string>;

  constructor() {
    super("SocialGataDatabase");
    this.version(1).stores({
      plugins: "id",
      pluginAuths: "pluginId",
    });
    this.plugins = this.table("plugins");
    this.pluginAuths = this.table("pluginAuths");
  }
}

export const db = new SocialGataDatabase();
