import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const root = { innerHTML: "" };
const toast = { textContent: "", classList: { add() {}, remove() {} } };
const context = vm.createContext({
  assert,
  console,
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
  const originalMe = JSON.stringify(people.me);
  const originalFriends = JSON.stringify([people.ming, people.hong, people.an]);
  const originalPalettes = JSON.stringify(state.identityColorsByCup);
  const originalRegistration = JSON.stringify([state.selectedCupId, state.selectedCupRegion, state.draftName]);
  const originalRelations = JSON.stringify(state.relations);
  const originalNotifications = JSON.stringify(state.notifications);
  assert.ok(profileTemplate().includes('data-action="edit-cup"'));
  assert.ok(profileTemplate().includes('aria-label="编辑我的杯子"'));

  for (const cup of cupTypes) {
    state.activeTab = "cup";
    act("edit-cup");
    assert.equal(state.page, "identity-edit");
    assert.equal(cupEditorState().selectedCupId, people.me.cupId);
    assert.notEqual(cupEditorState().identityColorsByCup, state.identityColorsByCup);
    assert.notEqual(cupEditorState().identityColorsByCup[people.me.cupId], people.me.colors);
    assert.ok(headerTemplate().includes("编辑杯子"));
    assert.ok(!identitySetupTemplate().includes('id="identity-name-input"'));
    assert.ok(identitySetupTemplate().includes("暂不支持修改"));
    assert.ok(identitySetupTemplate().includes('data-action="save-cup"'));
    assert.ok(!identitySetupTemplate().includes('data-action="confirm-identity"'));

    act("select-cup", { cupSelect: cup.id });
    cup.layers.forEach((layer, index) => {
      act("select-region", { regionSelect: layer.key });
      act("apply-color", { colorSelect: clearPalette[index].value });
      assert.equal(cupEditorState().identityColorsByCup[cup.id][layer.key], clearPalette[index].value);
      assert.ok(identitySetupTemplate().includes(layer.name));
    });
    const draftPalette = cupEditorState().identityColorsByCup[cup.id];
    assert.equal(new Set(cup.layers.map(layer => draftPalette[layer.key])).size, cup.layers.length);
    act("randomize-cup");
    for (const layer of cup.layers) {
      assert.ok(clearPalette.some(color => color.value === draftPalette[layer.key]));
    }
    assert.equal(new Set(cup.layers.map(layer => draftPalette[layer.key])).size, cup.layers.length);
    assert.equal(JSON.stringify(people.me), originalMe, "Preview must not change the saved cup");
    act("back");
    assert.equal(state.page, null);
    assert.equal(state.activeTab, "cup");
    assert.equal(state.cupEditDraft, null);
    assert.equal(state.pageHistory.length, 0);
    assert.equal(JSON.stringify(people.me), originalMe);
    assert.equal(JSON.stringify(state.identityColorsByCup), originalPalettes);
    assert.equal(JSON.stringify([state.selectedCupId, state.selectedCupRegion, state.draftName]), originalRegistration);
  }

  // Reopen from the saved cup, and keep both accessory colors independent.
  act("edit-cup");
  act("select-cup", { cupSelect: "cup-02" });
  act("select-region", { regionSelect: "lid" });
  act("select-cup", { cupSelect: "cup-01" });
  assert.equal(cupEditorState().selectedCupRegion, "body");
  act("previous-cup");
  assert.equal(cupEditorState().selectedCupId, "cup-06");
  act("next-cup");
  assert.equal(cupEditorState().selectedCupId, "cup-01");
  act("select-cup", { cupSelect: "cup-06" });
  act("select-region", { regionSelect: "lid" });
  act("apply-color", { colorSelect: "#A98BFF" });
  act("select-region", { regionSelect: "straw" });
  act("apply-color", { colorSelect: "#4FE1CE" });
  const savedDraft = JSON.stringify(cupEditorState().identityColorsByCup["cup-06"]);
  const fixedName = people.me.name;
  state.draftName = "不应生效的新名称";
  act("confirm-identity");
  assert.equal(people.me.name, fixedName);
  assert.equal(state.page, "identity-edit");
  act("save-cup");
  assert.equal(state.page, null);
  assert.equal(state.activeTab, "cup");
  assert.equal(state.pageHistory.length, 0);
  assert.equal(state.cupEditDraft, null);
  assert.equal(people.me.cupId, "cup-06");
  assert.equal(people.me.name, fixedName);
  assert.equal(JSON.stringify(people.me.colors), savedDraft);
  assert.equal(JSON.stringify(state.identityColorsByCup["cup-06"]), savedDraft);
  assert.equal(JSON.stringify([people.ming, people.hong, people.an]), originalFriends);
  assert.equal(JSON.stringify(state.relations), originalRelations);
  assert.equal(JSON.stringify(state.notifications), originalNotifications);
  for (const template of [profileTemplate, calmTemplate, sentTemplate, incomingTemplate, followedTemplate, respondedTemplate, relationsTemplate, relationDetailTemplate]) {
    assert.ok(template().includes(cupMarkup("me")), template.name + " must show the updated identity");
  }
  act("edit-cup");
  assert.equal(cupEditorState().selectedCupId, "cup-06");
  assert.equal(JSON.stringify(cupEditorState().identityColorsByCup["cup-06"]), savedDraft);
  assert.ok(identitySetupTemplate().includes(fixedName));
  assert.ok(!identitySetupTemplate().includes("不应生效的新名称"));
  act("randomize-cup");
  act("back");
  assert.equal(JSON.stringify(people.me.colors), savedDraft);
  act("save-cup");
  assert.equal(state.page, null);

  // Registration still accepts a name and continues to the original activation flow.
  state.page = "identity-setup";
  state.draftName = "新朋友";
  act("select-cup", { cupSelect: "cup-03" });
  assert.ok(identitySetupTemplate().includes('id="identity-name-input"'));
  act("confirm-identity");
  assert.equal(state.page, "activation-install");
  assert.equal(people.me.name, "新朋友");
  assert.equal(people.me.cupId, "cup-03");
`, context);
assert.equal(toast.textContent, "杯子已更新");
console.log("PASS 杯子编辑、六款分区配色、保存同步、取消还原与名称锁定检查");
