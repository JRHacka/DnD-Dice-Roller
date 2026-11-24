// Tavern Table · account.js
// The Sign in button and its box. The real work (talking to Supabase, deciding which save to use) is in js/storage.js.

(() => {
  const acc = store.account;
  if (!acc.available) return;   // opened straight from a file, or the Supabase library didn't load: no accounts here
  const btn = $("accountBtn"), menu = $("accountMenu"), msg = $("accountMsg");
  btn.hidden = false;
  btn.onclick = () => { msg.textContent = ""; menu.showModal(); };
  $("accountDone").onclick = () => menu.close();

  $("signInForm").addEventListener("submit", async e => {
    e.preventDefault();
    const email = $("signInEmail").value.trim(), send = $("signInSend");
    send.disabled = true; msg.textContent = "Sending…";
    const { error } = await acc.sendLink(email);
    send.disabled = false;
    msg.textContent = error ? `Couldn't send the link: ${error.message}`
                            : `Check ${email} for a sign-in link. It opens this page, signed in.`;
  });

  $("signOutBtn").onclick = async () => {
    await acc.signOut();
    state = exampleGame(); save();          // a fresh table: the account's party doesn't stay on this computer
    renderParty(); renderLog();
    msg.textContent = "Signed out. Your party is safe in your account for next time.";
  };

  function show(user) {                     // textContent, never innerHTML: an email address is text from outside
    btn.textContent = user ? "👤 " + (user.email || "Account").split("@")[0] : "👤 Sign in";
    $("signInForm").hidden = !!user;
    $("signedIn").hidden = !user;
    $("signedInEmail").textContent = user ? user.email : "";
  }

  // On page load, and whenever someone signs in or out
  acc.onChange(async user => {
    show(user);
    if (!user) return;
    const game = await acc.open(user, state, settings);   // the account's game, or null to keep this device's
    if (game) { state = game; renderParty(); renderLog(); }
  });
})();
