import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

let renders = 0;
let markup = "";
let reducedMotion = false;
let clock = 0;
let nextTimer = 1;
const timers = new Map();
const returnButton = { disabled: true };
const root = {
  get innerHTML() { return markup; },
  set innerHTML(value) { renders++; markup = value; }
};
const context = vm.createContext({
  assert,
  console,
  matchMedia: () => ({ matches: reducedMotion, addEventListener() {} }),
  setTimeout(callback, delay) {
    const id = nextTimer++;
    timers.set(id, { callback, at: clock + delay });
    return id;
  },
  clearTimeout(id) { timers.delete(id); },
  document: {
    querySelector(selector) { return selector === "#app" ? root : null; },
    querySelectorAll(selector) { return selector === "[data-drink-return]" ? [returnButton] : []; }
  }
});
function run(code) { return vm.runInContext(code, context); }
function advance(ms) {
  clock += ms;
  for (const [id, timer] of [...timers]) {
    if (timer.at <= clock && timers.has(id)) {
      timers.delete(id);
      timer.callback();
    }
  }
}
vm.runInContext(fs.readFileSync(new URL("../app.js", import.meta.url), "utf8"), context);
run(`
  function drink() { handleAction({ currentTarget: { dataset: { action: "drink" } } }); }
  state.relations = [];
  drink();
  assert.equal(state.homeMode, "sent");
  assert.equal(state.drinkFeedbackActive, true);
  assert.equal(state.lastDrinkShared, false);
  assert.ok(sentTemplate().includes('data-drink-return disabled'));
  assert.ok(sentTemplate().includes("这一口，仅自己可见"));
`);
const firstRenderCount = renders;
run("drink()");
assert.equal(renders, firstRenderCount, "Rapid taps must not restart the feedback");
assert.equal(timers.size, 1);
advance(999);
assert.equal(run("state.drinkFeedbackActive"), true);
advance(1);
assert.equal(run("state.drinkFeedbackActive"), false);
assert.equal(returnButton.disabled, false);
assert.equal(renders, firstRenderCount, "Restoring the action must keep existing cup and bubble DOM");
assert.ok(!run("sentTemplate()").includes("data-drink-return disabled"));

// No reply is needed to drink again. Each round replays the arrival feedback.
returnButton.disabled = true;
run("drink()");
assert.equal(renders, firstRenderCount + 1);
assert.equal(run("state.drinkFeedbackActive"), true);
advance(1000);
run(`
  state.relations = demoRelations();
  drink();
  assert.equal(state.lastDrinkShared, true);
  assert.ok(!sentTemplate().includes("这一口，仅自己可见"));
  assert.ok(sentTemplate().includes('data-action="drink"'));
  state.activeTab = "connect";
  render();
`);
const awayRenderCount = renders;
advance(1000);
assert.equal(run("state.activeTab"), "connect", "Feedback completion must not navigate the user back");
assert.equal(renders, awayRenderCount);
run(`
  state.activeTab = "drink";
  render();
  assert.ok(!sentTemplate().includes("data-drink-return disabled"));
`);

// Reduced-motion users can immediately start another round, even if changed mid-feedback.
reducedMotion = true;
run("drink()");
assert.equal(run("state.drinkFeedbackActive"), false);
assert.equal(timers.size, 0);
reducedMotion = false;
run("drink()");
assert.equal(run("state.drinkFeedbackActive"), true);
reducedMotion = true;
run("syncBubbleMotion()");
assert.equal(run("state.drinkFeedbackActive"), false);
assert.equal(timers.size, 0);
console.log("PASS 我喝了入口恢复、重复喝水、防误触与减少动态效果检查");
