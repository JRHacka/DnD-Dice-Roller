// Tavern Table · storage.js
// Where the saves live. Everything that reads or writes saved data goes through `store`, so moving the saves
// from this browser to a server later means changing this one file.
//
//   store.load()               → { game, settings }   (game is null when there's no save yet)
//   store.save(game, settings) → writes both
//
// There are two saves:
//   game data: party, combat, roll log. This is what accounts or shared parties would sync later.
//   settings:  scene, dice skin, custom skin. These belong to this device and stay here.

const store = (() => {
  const GAME_KEY = "tavern-table-v1";            // the original save's name; changing it would lose everyone's saves
  const SETTINGS_KEY = "tavern-table-settings";

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
    write(GAME_KEY, game);
    write(SETTINGS_KEY, settings);
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

  return { VERSION, load, save };
})();
