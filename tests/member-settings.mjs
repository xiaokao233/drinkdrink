import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const root = { innerHTML: "" };
const toast = { textContent: "", classList: { add() {}, remove() {} } };
const memberNote = { value: "" };
const context = vm.createContext({
  assert,
  console,
  setTimeout: () => 0,
  clearTimeout() {},
  navigator: {},
  document: {
    querySelector(selector) {
      return { "#app": root, "#toast": toast, "#member-note-input": memberNote }[selector] || null;
    },
    querySelectorAll() { return []; }
  }
});

vm.runInContext(fs.readFileSync(new URL("../app.js", import.meta.url), "utf8"), context);
vm.runInContext(`
  function act(action, data = {}) {
    handleAction({ currentTarget: { dataset: { action, ...data } } });
  }

  state.page = "relation-detail";
  state.pageHistory = [];
  state.selectedRelationId = "dorm";
  assert.ok(relationDetailTemplate().includes('data-member-id="ming"'));
  assert.ok(relationDetailTemplate().includes('data-member-id="hong"'));

  act("open-member", { memberId: "hong" });
  assert.equal(state.selectedMemberId, "hong");
  assert.equal(state.memberEditDraft.memberId, "hong");
  assert.ok(memberDetailTemplate().includes("小红"));
  assert.ok(memberDetailTemplate().includes(cupMarkup("hong")));
  assert.ok(!memberDetailTemplate().includes("明仔"));
`, context);

memberNote.value = "红红";
vm.runInContext('act("toggle-member-receive")', context);
memberNote.value = vm.runInContext("state.memberEditDraft.note", context);
vm.runInContext('act("toggle-member-send")', context);
memberNote.value = vm.runInContext("state.memberEditDraft.note", context);
vm.runInContext(`
  act("save-member-settings");
  assert.equal(state.page, "relation-detail");
  assert.equal(state.selectedMemberId, null);
  assert.equal(state.memberEditDraft, null);
  assert.deepEqual(state.memberSettings.hong, { note: "红红", receive: false, send: false });
  assert.deepEqual(state.memberSettings.ming, { note: "明仔", receive: true, send: true });
  assert.ok(relationDetailTemplate().includes("备注：红红"));
  assert.ok(!availableIncomingIds().includes("hong"));
  assert.ok(incomingTemplate().includes("2 人"));

  act("open-member", { memberId: "hong" });
  assert.ok(memberDetailTemplate().includes('value="红红"'));
  assert.ok(memberDetailTemplate().includes('aria-pressed="false"'));
  state.memberEditDraft.note = "不应保存";
  act("back");
  assert.equal(state.memberSettings.hong.note, "红红");

  state.memberSettings.ming.send = false;
  state.memberSettings.an.send = false;
  assert.equal(canShareDrink(), false);
  state.memberSettings.an.send = true;
  assert.equal(canShareDrink(), true);

  state.memberSettings.ming.receive = false;
  state.memberSettings.liang.receive = false;
  assert.deepEqual(availableIncomingIds(), []);
  state.homeMode = "incoming";
  assert.ok(incomingTemplate().includes("0 人"));
  assert.ok(incomingTemplate().includes('data-hold-follow disabled'));
`, context);

console.log("PASS 成员详情、私人备注与独立信号设置检查");
