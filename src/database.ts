import Dexie from "dexie";
import { PluginInfo } from "./plugintypes";
import { PluginAuthentication } from "./types";
import { aliasFromName, assignAlias } from "./lib/plugin-alias";

class SocialGataDatabase extends Dexie {
  plugins: Dexie.Table<PluginInfo, string>;
  pluginAuths: Dexie.Table<PluginAuthentication, string>;

  constructor() {
    super("SocialGataDatabase");
    this.version(1).stores({
      plugins: "id",
      pluginAuths: "pluginId",
    });
    // Aliases are indexed but not unique: they're optional, and uniqueness is
    // enforced when one is assigned (see lib/plugin-alias).
    this.version(2)
      .stores({
        plugins: "id, alias",
        pluginAuths: "pluginId",
      })
      .upgrade(async (tx) => {
        const table = tx.table<PluginInfo, string>("plugins");
        const plugins = await table.toArray();
        // Give plugins installed before aliases existed one now, deduped the
        // same way a fresh install would be.
        const assigned: PluginInfo[] = [];
        for (const plugin of plugins) {
          plugin.alias = assignAlias(
            plugin.manifest?.alias ?? aliasFromName(plugin.name),
            assigned,
            plugin.id
          );
          assigned.push(plugin);
          await table.put(plugin);
        }
      });
    this.plugins = this.table("plugins");
    this.pluginAuths = this.table("pluginAuths");
  }
}

export const db = new SocialGataDatabase();
