import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const values = new Map();
let writes = 0;
const localStorage = {
  getItem(key) { return values.get(key) ?? null; },
  setItem(key, value) { values.set(key, String(value)); writes += 1; },
  removeItem(key) { values.delete(key); },
  get writes() { return writes; }
};
const root = { innerHTML: "" };
const toast = { textContent: "", classList: { add() {}, remove() {} } };
const context = vm.createContext({
  assert,
  console,
  localStorage,
  setTimeout: () => 0,
  clearTimeout() {},
  document: {
    querySelector(selector) { return { "#app": root, "#toast": toast }[selector] || null; },
    querySelectorAll() { return []; }
  }
});

vm.runInContext(fs.readFileSync(new URL("../client.js", import.meta.url), "utf8"), context);
vm.runInContext(`
  function act(action, data = {}) {
    handleAction({ currentTarget: { dataset: { action, ...data } } });
  }

  people.me.name = "水汽";
  people.me.cupId = "cup-03";
  people.me.colors = { body: "#112233", label: "#445566", handle: "#778899" };
  state.identityColorsByCup["cup-03"] = { ...people.me.colors };
  state.relations[0].note = "窗边喝水";
  state.memberSettings.hong = { note: "红红", receive: false, send: true };
  state.notifications.response = false;
  state.installState = "installed";
  state.nextInvitationNumber = 8;
  state.page = "member-detail";
  state.homeMode = "responded";
  state.draftRelationNote = "还没保存";
  assert.equal(persistAppData(), true);
`, context);

const saved = JSON.parse(values.get("genyikou-demo-data-v1"));
assert.equal(saved.version, 1);
assert.equal(saved.profile.name, "水汽");
assert.equal(saved.relations[0].note, "窗边喝水");
assert.equal(saved.memberSettings.hong.note, "红红");
assert.ok(!("page" in saved));
assert.ok(!("homeMode" in saved));
assert.ok(!("draftRelationNote" in saved));

vm.runInContext(`
  people.me.name = "被覆盖";
  people.me.cupId = "cup-01";
  state.relations = [];
  state.memberSettings = defaultMemberSettings();
  state.notifications.response = true;
  state.installState = "browser";
  state.nextInvitationNumber = 1;
  assert.equal(restorePersistentData(), true);
  assert.equal(people.me.name, "水汽");
  assert.equal(people.me.cupId, "cup-03");
  assert.deepEqual(people.me.colors, { body: "#112233", label: "#445566", handle: "#778899" });
  assert.equal(state.relations[0].note, "窗边喝水");
  assert.deepEqual(state.memberSettings.hong, { note: "红红", receive: false, send: true });
  assert.equal(state.notifications.response, false);
  assert.equal(state.installState, "installed");
  assert.equal(state.nextInvitationNumber, 8);

  const writesBeforeTransientAction = localStorage.writes;
  act("toggle-demo");
  assert.equal(localStorage.writes, writesBeforeTransientAction);
  act("toggle-notification-drink");
  assert.equal(localStorage.writes, writesBeforeTransientAction + 1);
`, context);

values.set("genyikou-demo-data-v1", "{broken-json");
assert.doesNotThrow(() => vm.runInContext("restorePersistentData()", context));
assert.equal(vm.runInContext("restorePersistentData()", context), false);

console.log("PASS 本地数据保存、恢复、过滤与提交时机检查");
