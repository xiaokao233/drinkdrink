import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const root = { innerHTML: "" };
const toast = { textContent: "", classList: { add() {}, remove() {} } };
const editNote = { value: "" };
let copiedText = "";
const context = vm.createContext({
  assert,
  console,
  setTimeout: () => 0,
  clearTimeout() {},
  navigator: { clipboard: { async writeText(value) { copiedText = value; } } },
  document: {
    querySelector(selector) {
      return { "#app": root, "#toast": toast, "#edit-relation-note-input": editNote }[selector] || null;
    },
    querySelectorAll() { return []; }
  }
});
vm.runInContext(fs.readFileSync(new URL("../client.js", import.meta.url), "utf8"), context);
vm.runInContext(`
  function act(action, data = {}) {
    handleAction({ currentTarget: { dataset: { action, ...data } } });
    // This suite tests relationships; feedback timing has its own fake-clock suite.
    if (action === "drink") finishDrinkFeedback();
  }
  const dormNote = currentRelation().note;
  act("create-relation");
  state.draftRelationNote = "咖啡店搭子";
  act("finish-create-relation");
  const firstInvitationId = state.selectedRelationId;
  const firstInvitationCode = currentRelation().inviteCode;
  assert.equal(currentRelation().status, "pending");
  assert.equal(state.relations.find(r => r.id === "dorm").note, dormNote);
  assert.ok(waitingMemberTemplate().includes("邀请已准备好"));
  assert.ok(!waitingMemberTemplate().includes("关系已创建"));
  assert.ok(waitingMemberTemplate().includes('data-action="complete-invitation"'));
  assert.ok(!waitingMemberTemplate().includes('data-action="complete-invitation" disabled'));

  // Finishing doesn't require copying or create an active connection.
  act("complete-invitation");
  assert.equal(state.page, null);
  assert.equal(state.pageHistory.length, 0);
  assert.equal(state.activeTab, "drink");
  assert.equal(state.homeMode, "calm");
  assert.equal(state.relations.find(r => r.id === firstInvitationId).status, "pending");
  assert.ok(relationsTemplate().includes("咖啡店搭子"));
  act("open-waiting-member", { relationId: firstInvitationId });
  assert.ok(waitingMemberTemplate().includes(firstInvitationCode));
  act("edit-relation-note");
`, context);
editNote.value = "楼下咖啡";
vm.runInContext(`
  act("save-relation-note");
  assert.equal(state.page, "waiting-member");
  assert.equal(currentRelation().note, "楼下咖啡");
  assert.equal(state.relations.find(r => r.id === "dorm").note, dormNote);
  assert.equal(currentRelation().inviteCode, firstInvitationCode);
  act("complete-invitation");
  act("create-relation");
  state.draftRelationNote = "另一份邀请";
  act("finish-create-relation");
  assert.notEqual(currentRelation().inviteCode, firstInvitationCode);
  const secondInvitationId = state.selectedRelationId;
  act("cancel-waiting-relation");
  assert.ok(!state.relations.some(r => r.id === secondInvitationId));
  assert.ok(state.relations.some(r => r.id === firstInvitationId));
  assert.equal(state.pageHistory.length, 0);

  // A brand-new identity must not inherit the demo friends or invites.
  act("start-entry-demo");
  act("login-register");
  assert.equal(state.relations.length, 0);
  assert.equal(hasConnectedFriends(), false);
  assert.ok(!relationsTemplate().includes("宿舍这边"));
  act("entry-create");
  act("confirm-identity");
  act("activation-browser");
  act("activation-later");
  assert.equal(state.page, "create-relation");
  state.draftRelationNote = "新朋友";
  act("finish-create-relation");
  const newId = state.selectedRelationId;
  const newCode = currentRelation().inviteCode;
  assert.equal(currentRelation().memberIds.length, 1);
  act("complete-invitation");
  act("drink");
  assert.equal(state.lastDrinkShared, false);
  assert.ok(sentTemplate().includes("这一口，仅自己可见"));
  assert.ok(!sentTemplate().includes("我喝了已发出"));

  // Entering one's own invite must not pretend another person accepted it.
  act("join-relation");
  state.draftInviteCode = newCode;
  act("preview-invite");
  assert.equal(state.page, "join-relation");
  assert.equal(hasConnectedFriends(), false);

  // A clearly labelled simulation is the only automatic-looking transition.
  act("simulate-invitation-accepted", { relationId: newId });
  assert.equal(state.activeTab, "connect");
  assert.equal(currentRelation().status, "active");
  assert.equal(currentRelation().memberIds.join(","), "me,ming");
  assert.equal(hasConnectedFriends(), true);
  assert.ok(!relationsTemplate().includes("等待加入"));
  assert.ok(relationsTemplate().includes("2 人"));
  // Accepting later must not retroactively send the earlier personal drink.
  assert.equal(state.lastDrinkShared, false);
  act("simulate-invitation-accepted", { relationId: newId });
  assert.equal(state.relations.length, 1);
  act("open-relation", { relationId: newId });
  assert.ok(relationDetailTemplate().includes("2 人"));
  assert.ok(!relationDetailTemplate().includes("小红"));
  act("complete-invitation");
  act("drink");
  assert.equal(state.lastDrinkShared, true);
  assert.ok(sentTemplate().includes("我喝了已发出"));

  act("open-relation", { relationId: newId });
  act("toggle-relation-send");
  act("complete-invitation");
  act("drink");
  assert.equal(state.lastDrinkShared, false);
  act("create-relation");
  state.draftRelationNote = "复制测试";
  act("finish-create-relation");
`, context);
context.navigator.clipboard.writeText = async value => { copiedText = value; };
await vm.runInContext("copyDemoInvitation()", context);
assert.match(copiedText, /^G\d+$/);
assert.equal(toast.textContent, "演示邀请码已复制");
context.navigator.clipboard.writeText = async () => { throw new Error("Clipboard unavailable"); };
await vm.runInContext("copyDemoInvitation()", context);
assert.equal(toast.textContent, "未能复制，可以手动选中邀请码");
vm.runInContext(`
  act("cancel-waiting-relation");
  assert.equal(state.relations.length, 1);
  act("open-relation", { relationId: newId });
  act("confirm-leave-relation");
  assert.equal(state.relations.length, 0);
  assert.equal(hasConnectedFriends(), false);
  act("join-relation");
  state.draftInviteCode = "K2M8Q";
  act("preview-invite");
  act("accept-invite");
  assert.equal(hasConnectedFriends(), true);
  assert.equal(state.relations.length, 1);

  // Active relationships use a real all-member confirmation state before
  // exposing the new person's one-time invite code.
  state.page = "relation-detail";
  state.draftCandidate = "小亮";
  act("submit-proposal");
  assert.equal(currentProposal().status, "pending");
  assert.equal(currentProposal().candidateLabel, "小亮");
  assert.ok(proposalPendingTemplate().includes("全员同意后生成邀请"));
  assert.ok(!proposalPendingTemplate().includes("genyikou.click/join/"));
  act("simulate-proposal-ready");
  assert.equal(currentProposal().status, "approved");
  assert.equal(state.page, "invite-ready");
  assert.ok(inviteReadyTemplate().includes("genyikou.click/join/P8L4"));
`, context);
context.navigator.clipboard.writeText = async value => { copiedText = value; };
await vm.runInContext("copyDemoInvitation()", context);
assert.equal(copiedText, "P8L4");
vm.runInContext(`
  act("finish-invite-ready");
  assert.equal(state.page, "relation-detail");

  const relation = currentRelation();
  state.proposals.unshift({
    id: "proposal-incoming",
    relationId: relation.id,
    proposerId: "ming",
    proposerName: "小明",
    candidateLabel: "阿安",
    status: "pending",
    inviteCode: "",
    userVote: null,
    approvalCount: 1,
    memberCount: relation.memberIds.length,
    createdAt: new Date().toISOString()
  });
  assert.ok(relationsTemplate().includes("小明想叫上阿安"));
  act("open-proposal-confirm", { proposalId: "proposal-incoming" });
  assert.ok(proposalConfirmTemplate().includes("小明想邀请阿安"));
  act("approve-proposal");
  assert.equal(state.activeTab, "connect");
  assert.equal(state.proposals.find(item => item.id === "proposal-incoming").userVote, true);
`, context);
console.log("PASS 邀请完成、保留与取消、新身份、模拟加入及个人喝水状态检查");
