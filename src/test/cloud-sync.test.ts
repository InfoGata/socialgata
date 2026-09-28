import * as A from '@automerge/automerge';
import { Repo } from '@automerge/automerge-repo';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CloudSyncManager, type SyncConfig } from '@/sync/cloud/CloudSyncManager';
import type { CloudSyncProvider } from '@/sync/cloud/CloudSyncProvider';
import {
  GENESIS_HEADS,
  copyFavorites,
  genesisBytes,
  getOrCreateFavoritesHandle,
  isFavoritesDoc,
  toggleFavorite,
  type FavoritesDoc,
} from '@/sync/favorites-repo';

class MemoryProvider implements CloudSyncProvider {
  files = new Map<string, Uint8Array>();
  uploads = 0;
  async upload(docUrl: string, data: Uint8Array) {
    this.uploads++;
    this.files.set(docUrl, data);
  }
  async download(docUrl: string) {
    return this.files.get(docUrl) ?? null;
  }
}

const managers: CloudSyncManager<FavoritesDoc>[] = [];

const device = (
  provider: CloudSyncProvider,
  options: {
    autoSync?: boolean;
    onNoRemote?: SyncConfig<FavoritesDoc>['onNoRemote'];
  } = {}
) => {
  const repo = new Repo({ network: [] });
  const handle = repo.import<FavoritesDoc>(genesisBytes());
  const manager = new CloudSyncManager<FavoritesDoc>();
  managers.push(manager);
  manager.configure({
    provider,
    repo,
    handle,
    docUrl: 'socialgata-favorites-v2',
    isValidRemote: isFavoritesDoc,
    onNoRemote: options.onNoRemote,
    autoSync: options.autoSync ?? false,
    intervalMs: 60_000,
    lockName: 'test',
  });
  return { repo, handle, manager };
};

const post = (id: string) => ({ id, pluginId: 'p', body: `post ${id}` }) as never;

afterEach(() => {
  managers.forEach((m) => m.configure(null));
  managers.length = 0;
  vi.useRealTimers();
});

describe('favorites genesis', () => {
  it('has the heads the app was built with', () => {
    expect(A.getHeads(A.load(genesisBytes()))).toEqual(GENESIS_HEADS);
  });
});

describe('cloud sync', () => {
  it('syncs every collection between devices, users included', async () => {
    const provider = new MemoryProvider();
    const a = device(provider);
    const b = device(provider);

    toggleFavorite(a.handle, 'users', 'p:u1', post('u1'));
    toggleFavorite(b.handle, 'posts', 'p:1', post('1'));
    await a.manager.syncNow();
    await b.manager.syncNow();
    await a.manager.syncNow();

    for (const { handle } of [a, b]) {
      expect(Object.keys(handle.doc().users)).toEqual(['p:u1']);
      expect(Object.keys(handle.doc().posts)).toEqual(['p:1']);
    }
  });

  it("doesn't bring back a favorite removed on another device", async () => {
    const provider = new MemoryProvider();
    const a = device(provider);
    const b = device(provider);

    toggleFavorite(a.handle, 'posts', 'p:1', post('1'));
    await a.manager.syncNow();
    await b.manager.syncNow();
    toggleFavorite(b.handle, 'posts', 'p:1');
    await b.manager.syncNow();
    await a.manager.syncNow();

    expect(a.handle.doc().posts).toEqual({});
    expect(b.handle.doc().posts).toEqual({});
  });

  it('brings in the old cloud file on the first sync to the new one', async () => {
    const provider = new MemoryProvider();
    const legacy = A.from<FavoritesDoc>({
      instances: {},
      posts: { 'p:old': post('old') },
      comments: {},
      communities: {},
      users: {},
    });
    provider.files.set('socialgata-favorites', A.save(legacy));

    const a = device(provider, {
      onNoRemote: async (p) => {
        const bytes = await p.download('socialgata-favorites');
        if (bytes) {
          const from = A.load<FavoritesDoc>(bytes);
          a.handle.change((doc) => copyFavorites(doc, from));
        }
      },
    });
    await a.manager.syncNow();

    expect(Object.keys(a.handle.doc().posts)).toEqual(['p:old']);
    const uploaded = A.load<FavoritesDoc>(provider.files.get('socialgata-favorites-v2')!);
    expect(isFavoritesDoc(uploaded)).toBe(true);
    expect(Object.keys(uploaded.posts)).toEqual(['p:old']);
  });

  it('stops syncing once turned off', async () => {
    vi.useFakeTimers();
    const provider = new MemoryProvider();
    const a = device(provider, { autoSync: true });
    await vi.advanceTimersByTimeAsync(0);
    a.manager.configure(null);
    const before = provider.uploads;

    toggleFavorite(a.handle, 'posts', 'p:1', post('1'));
    await vi.advanceTimersByTimeAsync(10 * 60_000);
    expect(provider.uploads).toBe(before);
  });
});

describe('local favorites document', () => {
  beforeEach(() => localStorage.clear());

  it('moves favorites from a document with its own history onto the genesis', async () => {
    const repo = new Repo({ network: [] });
    const old = repo.create<FavoritesDoc>();
    old.change((doc) => {
      doc.instances = {};
      doc.posts = {};
      doc.comments = {};
      doc.communities = {};
      doc.users = { 'p:u': post('u') };
    });
    localStorage.setItem('socialgata-favorites-doc-url', old.url);

    const handle = await getOrCreateFavoritesHandle(repo);

    expect(handle.url).not.toBe(old.url);
    expect(isFavoritesDoc(handle.doc())).toBe(true);
    expect(Object.keys(handle.doc().users)).toEqual(['p:u']);
    expect(localStorage.getItem('socialgata-favorites-doc-url')).toBe(handle.url);
    // Opened again, it is the same document rather than another copy.
    expect((await getOrCreateFavoritesHandle(repo)).url).toBe(handle.url);
  });
});
