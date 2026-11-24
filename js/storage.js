// Tavern Table · storage.js
// Where the saves live. Everything that reads or writes saved data goes through `store`, so the rest of the page
// never needs to know whether a save is in this browser or in an account.
//
//   store.load()               → { game, settings }   (game is null when there's no save yet)
//   store.save(game, settings) → writes both (and, when signed in, sends the game to the account a moment later)
//   store.account              → signing in and out (see the end of this file)
//
// There are two saves:
//   game data: party, combat, roll log. This is what goes to an account.
//   settings:  scene, dice skin, custom skin. These belong to this device and stay here.

const store = (() => {
  const GAME_KEY = "tavern-table-v1";            // the original save's name; changing it would lose everyone's saves
  const SETTINGS_KEY = "tavern-table-settings";
  const OWNER_KEY = "tavern-table-owner";        // which account the game save on this device belongs to (if any)

  // VERSION goes up by one whenever the saved shape changes, and migrate() upgrades older saves one step at a time.
  const VERSION = 2;
  function migrate(game, settings) {
    if (!game.version) game.version = 1;   // saves from before versioning: same shape, just mark them as version 1
    if (game.version === 1) {              // 1 → 2: the device settings move out of the game data into their own save
      for (const k of ["scene", "skin", "customSkin"]) {
        if (k in game) { if (!(k in settings)) settings[k] = game[k]; delete game[k]; }
      }
      game.version = 2;
    }
    // Next time the shape changes, add a step here: if (game.version === 2) { ...reshape game...; game.version = 3; }
  }

  // A missing or broken save just counts as "no save"; a full or blocked storage never stops the page
  const read = key => { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} };

  function save(game, settings) {
    game.savedAt = Date.now();             // lets a device tell whether its copy is newer than the account's
    write(GAME_KEY, game);
    write(SETTINGS_KEY, settings);
    if (user) schedulePush(game);
  }

  function load() {
    const raw = read(SETTINGS_KEY);
    const settings = { ...(raw && typeof raw === "object" ? raw : {}), version: VERSION };
    let game = read(GAME_KEY);
    if (!game || !Array.isArray(game.party)) game = null;
    else if (game.version !== VERSION) {
      migrate(game, settings);
      save(game, settings);   // write the upgraded shape straight away
    }
    return { game, settings };
  }

  /* ---------- Accounts (Supabase) ----------
     Only on a real web address (the sign-in email links back to the page, and a file on your computer can't be
     linked to), and only if the Supabase library loaded. Otherwise everything stays on this device, as before. */
  const available = location.protocol !== "file:" && !!window.supabase && typeof SUPABASE_URL === "string";
  const db = available ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
  let user = null;            // the signed-in account, or null
  let pushTimer = null, pending = null;

  // Sending to the account waits a second after the last change, so clicking Damage five times is one upload
  function schedulePush(game) {
    pending = game;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(flush, 1000);
  }
  async function flush() {
    clearTimeout(pushTimer);
    const game = pending; pending = null;
    if (!game || !user) return;
    const { error } = await db.from("saves").upsert({ user_id: user.id, game, updated_at: new Date().toISOString() });
    if (error) console.warn("Tavern Table: couldn't save to your account.", error.message);
  }

  // Someone just signed in (or came back already signed in). Works out which game to use:
  // returns the account's game (already saved on this device too), or null to keep this device's game.
  async function open(account, localGame, settings) {
    user = account;
    const { data, error } = await db.from("saves").select("game").eq("user_id", account.id).maybeSingle();
    if (error) { console.warn("Tavern Table: couldn't load your account's save.", error.message); return null; }
    const cloud = data && data.game;
    const ours = localStorage.getItem(OWNER_KEY) === account.id;   // this device's game came from this account
    localStorage.setItem(OWNER_KEY, account.id);
    if (!cloud || (ours && (localGame.savedAt || 0) > (cloud.savedAt || 0))) {
      pending = localGame; await flush();   // first sign-in, or changes made here that never got uploaded
      return null;
    }
    if (cloud.version !== VERSION) migrate(cloud, {});
    write(GAME_KEY, cloud);
    return cloud;
  }

  async function signOut() {
    if (pending) await flush();             // don't lose the last few seconds of changes
    await db.auth.signOut();
    user = null;
    localStorage.removeItem(OWNER_KEY);
    localStorage.removeItem(GAME_KEY);      // the account's game doesn't stay behind on a shared computer
  }

  const account = {
    available,
    // Emails a sign-in link that brings the player back to this page, signed in. No passwords anywhere.
    sendLink: email => db.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } }),
    open,
    signOut,
    // fn(user or null) runs on page load and whenever someone signs in or out
    onChange(fn) {
      if (!db) return fn(null);
      let lastId = "not yet";
      db.auth.onAuthStateChange((event, session) => {
        const u = session ? session.user : null, id = u ? u.id : null;
        if (id === lastId) return;          // token refreshes and repeat events: nothing new
        lastId = id;
        if (!u) user = null;                // signed out (here, in another tab, or the sign-in expired)
        setTimeout(() => fn(u), 0);         // Supabase asks that other calls wait until after this callback
      });
    },
  };

  return { VERSION, load, save, account };
})();
