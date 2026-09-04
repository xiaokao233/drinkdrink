import fs from "node:fs";
import vm from "node:vm";

const root = { innerHTML: "" };
const context = vm.createContext({
  console,
  setTimeout,
  clearTimeout,
  navigator: {},
  document: {
    querySelector(selector) {
      return selector === "#app" ? root : null;
    },
    querySelectorAll() {
      return [];
    }
  }
});

const pages = [
  "entry", "identity-setup", "identity-edit", "activation-install", "activation-notification",
  "create-relation", "join-relation", "invite-preview", "waiting-member",
  "relation-detail", "edit-relation-note", "add-member", "proposal-pending",
  "proposal-confirm", "invite-ready", "member-detail", "leave-relation",
  "install-guide", "notification-settings", "data-info", "delete-intro",
  "delete-confirm", "delete-final", "delete-complete"
];

const source = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const assertions = `
  for (const page of ${JSON.stringify(pages)}) {
    state.page = page;
    render();
    if (!document.querySelector("#app").innerHTML.includes("flow-page")) {
      throw new Error(page + " 页面没有完成渲染");
    }
    if (document.querySelector("#app").innerHTML.includes(">undefined<")) {
      throw new Error(page + " 页面出现未定义文案");
    }
  }
  for (const cup of cupTypes) {
    state.selectedCupId = cup.id;
    const identity = identitySetupTemplate();
    const controls = identity.split('<div class="cup-carousel__meta">')[1]?.split('</div>')[0];
    if (!controls || controls.includes(cup.name)) {
      throw new Error(cup.id + " 杯型名称不应显示在选择器下方");
    }
    const artwork = cupPreviewMarkup(cup.id, cup.defaults, "小明");
    if (!artwork.includes('class="cup-art"') || !artwork.includes('--name-rotate:' + cup.label.rotate + 'deg')) {
      throw new Error(cup.id + " 姓名与素材的坐标规则缺失");
    }
  }
  for (const mode of ["calm", "sent", "incoming", "followed", "responded"]) {
    state.homeMode = mode;
    const home = homeTemplate();
    if (!home.includes("<h1") || home.includes(">undefined<")) {
      throw new Error(mode + " 首页应有清晰标题且文案完整");
    }
    if (home.includes("待回应</span>") || home.includes("等下一次信号") || home.includes("回应完成")) {
      throw new Error(mode + " 首页不应重复催促或解释回应");
    }
  }
  state.selectorOpen = true;
  state.selectedIds = ["ming", "hong"];
  const selector = incomingTemplate();
  if (!selector.includes("这次跟谁？") || !selector.includes("点左侧「跟一口」") || !selector.includes("data-hold-follow")) {
    throw new Error("选人后应继续用原来的跟一口按钮确认");
  }
  state.selectorOpen = false;
  if (!loginTemplate().includes("发送验证码") || !loginTemplate().includes("登录 / 注册") || !identitySetupTemplate().includes("名称保存后暂不支持修改")) {
    throw new Error("精简文案不能移除原型身份说明与名称限制");
  }
  if (!addMemberTemplate().includes("现有成员都同意后") || !deleteFinalTemplate().includes("注销后无法找回")) {
    throw new Error("精简文案不能移除邀请共识和注销风险说明");
  }
  const bubbles = bubbleFieldMarkup();
  state.page = null;
  state.activeTab = "drink";
  state.homeMode = "sent";
  const sentScreen = screenMarkup();
  if (!sentScreen.includes("screen--sent") || !sentScreen.includes('class="sent-title">喝过了。</h1>') || sentScreen.includes("等杯子碰回来") || sentScreen.includes("等回应")) {
    throw new Error("已发送页面应使用通底背景与精简后的文案");
  }
  state.activeTab = "connect";
  if (screenMarkup().includes("screen--sent")) {
    throw new Error("通底背景不应影响关系页");
  }
  state.activeTab = "drink";
  state.page = "identity-setup";
  if (screenMarkup().includes("screen--sent")) {
    throw new Error("通底背景不应影响身份设置页");
  }
  if ((bubbles.match(/class="water-bubble"/g) || []).length !== 9 || bubbles.includes("NaN")) {
    throw new Error("气泡背景应包含 9 个有效独立轮廓");
  }
  if (!bubbles.includes('aria-hidden="true"') || !bubbles.includes('repeatCount="indefinite"')) {
    throw new Error("气泡应为持续播放且不干扰阅读的装饰");
  }
  for (const phase of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    const outline = bubbleContour(phase);
    if ((outline.match(/ C /g) || []).length !== 12 || !outline.endsWith(" Z")) {
      throw new Error("水泡轮廓的关键帧必须保持闭合与相同的曲线结构");
    }
  }
`;

vm.runInContext(source + assertions, context, { filename: "app.js" });
console.log(`PASS ${pages.length} 个页面运行时渲染检查`);

let prefersReducedMotion = false;
const motionProbe = { paused: false, cssPaused: false, time: 10 };
context.matchMedia = () => ({ matches: prefersReducedMotion });
context.document.querySelectorAll = selector => {
  if (selector === ".signal-bubbles") return [{ toggleAttribute: (_, value) => { motionProbe.cssPaused = value; } }];
  if (selector === ".signal-bubbles svg") return [{
    pauseAnimations: () => { motionProbe.paused = true; },
    unpauseAnimations: () => { motionProbe.paused = false; },
    setCurrentTime: value => { motionProbe.time = value; }
  }];
  return [];
};
for (const [reduced, hidden, expected] of [[false, false, false], [true, false, true], [false, true, true], [false, false, false]]) {
  prefersReducedMotion = reduced;
  context.document.hidden = hidden;
  vm.runInContext("syncBubbleMotion()", context);
  if (motionProbe.paused !== expected || motionProbe.cssPaused !== expected || (reduced && motionProbe.time !== 0)) {
    throw new Error("气泡暂停、恢复或减少动态效果的行为不正确");
  }
}
console.log("PASS 气泡变形结构、减少动态效果与后台暂停检查");
