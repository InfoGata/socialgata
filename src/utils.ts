import semverGte from "semver/functions/gte";

export const hasExtension = () => {
  return typeof window.InfoGata !== "undefined";
};

export const hasAuthentication = async () => {
  const minVersion = "1.1.0";
  if (hasExtension() && window.InfoGata?.getVersion) {
    const version = await window.InfoGata.getVersion();
    return semverGte(version, minVersion);
  }
  return false;
};

export const isCorsDisabled = () => {
  return hasExtension();
}