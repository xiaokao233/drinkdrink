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

vm.runInContext(fs.readFileSync(new URL("../client.js", import.meta.url), "utf8"), context);
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

await vm.runInContext(`
  (async () => {
    authAccount = { id: "user-me", email: "me@example.com" };
    cloudDataAvailable = true;
    state.relations = demoRelations();
    state.selectedRelationId = "dorm";
    state.page = "member-detail";
    state.pageHistory = ["relation-detail"];
    state.selectedMemberId = "ming";
    state.memberEditDraft = { memberId: "ming", note: "明仔", receive: false, send: true };
    document.querySelector("#member-note-input").value = "云端明";
    let submitted = null;
    appRequest = async (action, payload) => {
      submitted = { action, payload };
      return {
        ok: true,
        profile: { name: "小满", cupId: "cup-01", colors: cupById["cup-01"].defaults },
        people: [], relations: state.relations,
        memberSettings: [{ id: "ming", note: "云端明", receive: false, send: true }],
        proposals: [], incomingIds: [], incomingEvents: {},
        incomingLatestAt: "", responseIds: [], responseLatestAt: "", responseSignature: ""
      };
    };
    await handleAction({ currentTarget: { dataset: { action: "save-member-settings" } } });
    assert.equal(submitted.action, "updateMemberSettings");
    assert.deepEqual(submitted.payload, { memberId: "ming", note: "云端明", receive: false, send: true });
    assert.deepEqual(state.memberSettings.ming, { note: "云端明", receive: false, send: true });
    assert.equal(state.page, "relation-detail");
  })()
`, context);

console.log("PASS 关系总开关、成员个人屏蔽与云端保存检查");
