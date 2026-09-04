const clearPalette = [
  { name: "水光蓝", value: "#55D8FF" },
  { name: "薄荷汽水", value: "#4FE1CE" },
  { name: "西柚泡泡", value: "#FF8D70" },
  { name: "柠檬糖", value: "#FFE45C" },
  { name: "葡萄冰", value: "#A98BFF" },
  { name: "莓果粉", value: "#FF78AD" },
  { name: "青苹果", value: "#8EEB68" },
  { name: "深海字", value: "#27657A" }
];

const cupTypes = [
  {
    id: "cup-01", name: "带把手茶杯",
    layers: [
      { key: "handle", name: "把手", asset: "/assets/cups/cup-01-handle.png", z: 1 },
      { key: "body", name: "杯身", asset: "/assets/cups/cup-01-body.png", z: 2 },
      { key: "label", name: "姓名标签", asset: "/assets/cups/cup-01-label.png", z: 3 }
    ],
    label: { x: 43.7, y: 52.7, rotate: -15, width: 38 },
    defaults: { body: "#4FE1CE", label: "#FF8D70", handle: "#FFE45C" }
  },
  {
    id: "cup-02", name: "随身保温杯",
    layers: [
      { key: "top", name: "顶部配件", asset: "/assets/cups/cup-02-top.png", z: 1 },
      { key: "body", name: "杯身", asset: "/assets/cups/cup-02-body.png", z: 2 },
      { key: "label", name: "姓名标签", asset: "/assets/cups/cup-02-label.png", z: 3 },
      { key: "lid", name: "杯盖", asset: "/assets/cups/cup-02-lid.png", z: 4 }
    ],
    label: { x: 47.8, y: 53.3, rotate: -18, width: 30 },
    defaults: { body: "#55D8FF", label: "#FF78AD", lid: "#FFE45C", top: "#A98BFF" }
  },
  {
    id: "cup-03", name: "圆口马克杯",
    layers: [
      { key: "handle", name: "把手", asset: "/assets/cups/cup-03-handle.png", z: 1 },
      { key: "body", name: "杯身", asset: "/assets/cups/cup-03-body.png", z: 2 },
      { key: "label", name: "姓名标签", asset: "/assets/cups/cup-03-label.png", z: 3 }
    ],
    label: { x: 40.5, y: 48, rotate: -15, width: 34 },
    defaults: { body: "#FF8D70", label: "#55D8FF", handle: "#4FE1CE" }
  },
  {
    id: "cup-04", name: "背带水壶",
    layers: [
      { key: "strap", name: "背带", asset: "/assets/cups/cup-04-strap.png", z: 1 },
      { key: "body", name: "杯身", asset: "/assets/cups/cup-04-body.png", z: 2 },
      { key: "label", name: "姓名标签", asset: "/assets/cups/cup-04-label.png", z: 3 },
      { key: "lid", name: "杯盖", asset: "/assets/cups/cup-04-lid.png", z: 4 }
    ],
    label: { x: 48.6, y: 52.6, rotate: -17, width: 31 },
    defaults: { body: "#A98BFF", label: "#FFE45C", lid: "#4FE1CE", strap: "#FF78AD" }
  },
  {
    id: "cup-05", name: "矮圆陶杯",
    layers: [
      { key: "handle", name: "把手", asset: "/assets/cups/cup-05-handle.png", z: 1 },
      { key: "body", name: "杯身", asset: "/assets/cups/cup-05-body.png", z: 2 },
      { key: "label", name: "姓名标签", asset: "/assets/cups/cup-05-label.png", z: 3 }
    ],
    label: { x: 44.1, y: 42.4, rotate: -19, width: 35 },
    defaults: { body: "#8EEB68", label: "#55D8FF", handle: "#FF8D70" }
  },
  {
    id: "cup-06", name: "吸管随行杯",
    layers: [
      { key: "straw", name: "吸管", asset: "/assets/cups/cup-06-straw.png", z: 1 },
      { key: "body", name: "杯身", asset: "/assets/cups/cup-06-body.png", z: 2 },
      { key: "label", name: "姓名标签", asset: "/assets/cups/cup-06-label.png", z: 3 },
      { key: "lid", name: "杯盖", asset: "/assets/cups/cup-06-lid.png", z: 4 }
    ],
    label: { x: 47.3, y: 57.5, rotate: -16, width: 30 },
    defaults: { body: "#55D8FF", label: "#FFE45C", lid: "#FF8D70", straw: "#4FE1CE" }
  }
];

const cupById = Object.fromEntries(cupTypes.map(cup => [cup.id, cup]));
const identityColorsByCup = Object.fromEntries(cupTypes.map(cup => [cup.id, { ...cup.defaults }]));

const people = {
  me: { id: "me", name: "小满", relation: "我", cupId: "cup-01", colors: { ...cupById["cup-01"].defaults } },
  ming: { id: "ming", name: "小明", relation: "宿舍这边", cupId: "cup-02", colors: { ...cupById["cup-02"].defaults }, time: "2 分钟前" },
  hong: { id: "hong", name: "小红", relation: "宿舍这边", cupId: "cup-03", colors: { ...cupById["cup-03"].defaults }, time: "7 分钟前" },
  liang: { id: "liang", name: "小亮", relation: "晚课搭子", cupId: "cup-04", colors: { ...cupById["cup-04"].defaults }, time: "10 分钟前" },
  an: { id: "an", name: "阿安", relation: "远程喝水搭子", cupId: "cup-05", colors: { ...cupById["cup-05"].defaults } }
};

let incomingIds = ["liang", "hong", "ming"];

// Prototype data only. New registrations start without these sample relations.
function demoRelations() {
  return [
    { id: "dorm", note: "宿舍这边", status: "active", memberIds: ["me", "ming", "hong"], receive: true, send: true },
    { id: "remote", note: "远程喝水搭子", status: "active", memberIds: ["me", "an"], receive: true, send: true },
    { id: "evening", note: "晚课之后", status: "pending", memberIds: ["me"], inviteCode: "M7Q2", receive: true, send: true }
  ];
}

function defaultMemberSettings() {
  return Object.fromEntries(Object.keys(people)
    .filter(id => id !== "me")
    .map(id => [id, { note: id === "ming" ? "明仔" : "", receive: true, send: true }]));
}

let state = {
  activeTab: "drink",
  page: null,
  pageHistory: [],
  homeMode: "calm",
  selectorOpen: false,
  selectedIds: [...incomingIds],
  followedIds: [],
  responseIds: ["ming", "hong"],
  demoPanel: false,
  relations: demoRelations(),
  selectedRelationId: "dorm",
  nextInvitationNumber: 1,
  lastDrinkShared: true,
  drinkFeedbackActive: false,
  selectedMemberId: null,
  memberEditDraft: null,
  memberSettings: defaultMemberSettings(),
  notifications: {
    drink: true,
    response: true,
    relation: true
  },
  installState: "browser",
  authEmail: "",
  authCode: "",
  authCodeSent: false,
  authBusy: "",
  authError: "",
  authDevCode: "",
  authChallenge: "",
  authCooldownUntil: 0,
  draftRelationNote: "",
  draftInviteCode: "",
  invitePreview: null,
  incomingEvents: {},
  draftCandidate: "",
  draftName: "小满",
  entryIntent: "create",
  selectedCupId: "cup-01",
  selectedCupRegion: "body",
  cupEditDraft: null,
  identityColorsByCup
};

const persistenceKey = "genyikou-demo-data-v1";
const persistenceVersion = 1;
const authSessionKey = "genyikou-auth-session-v2";
const responseAcknowledgementKey = "genyikou-response-ack-v1";
let authToken = "";
let authAccount = null;
let authNeedsOnboarding = false;
let cloudDataAvailable = false;
let pushState = {
  supported: supportsPushNotifications(),
  permission: notificationPermission(),
  configured: false,
  subscribed: false,
  busy: false,
  error: ""
};
let authCooldownTimer;
let serverSyncTimer;
let currentResponseSignature = "";
const initialInviteCode = typeof location !== "undefined"
  ? (location.pathname.match(/^\/join\/([A-Z0-9]{4,10})\/?$/i)?.[1] || "").toUpperCase()
  : "";
const persistenceActions = new Set([
  "save-cup",
  "confirm-identity",
  "activation-installed",
  "activation-browser",
  "activation-allow",
  "activation-later",
  "finish-create-relation",
  "simulate-invitation-accepted",
  "accept-invite",
  "save-relation-note",
  "cancel-waiting-relation",
  "toggle-relation-receive",
  "toggle-relation-send",
  "save-member-settings",
  "confirm-leave-relation",
  "simulate-installed",
  "toggle-notification-drink",
  "toggle-notification-response",
  "toggle-notification-relation",
  "finish-delete"
]);

function sanitizeCupColors(cupId, colors) {
  const cup = cupById[cupId];
  if (!cup) return null;
  const source = colors && typeof colors === "object" ? colors : {};
  return Object.fromEntries(cup.layers.map(layer => [
    layer.key,
    typeof source[layer.key] === "string" && source[layer.key].trim()
      ? source[layer.key]
      : cup.defaults[layer.key]
  ]));
}

function persistentStorageKey() {
  return authAccount?.id ? `${persistenceKey}:${authAccount.id}` : persistenceKey;
}

function persistentSnapshot() {
  return {
    version: persistenceVersion,
    profile: {
      name: people.me.name,
      cupId: people.me.cupId,
      colors: sanitizeCupColors(people.me.cupId, people.me.colors)
    },
    identityColorsByCup: Object.fromEntries(cupTypes.map(cup => [
      cup.id,
      sanitizeCupColors(cup.id, state.identityColorsByCup[cup.id])
    ])),
    relations: state.relations.map(relation => ({
      id: relation.id,
      note: relation.note,
      status: relation.status,
      memberIds: [...relation.memberIds],
      ...(relation.inviteCode ? { inviteCode: relation.inviteCode } : {}),
      receive: relation.receive,
      send: relation.send
    })),
    memberSettings: Object.fromEntries(Object.entries(state.memberSettings).map(([id, settings]) => [id, {
      note: settings.note,
      receive: settings.receive,
      send: settings.send
    }])),
    notifications: { ...state.notifications },
    installState: state.installState,
    nextInvitationNumber: state.nextInvitationNumber
  };
}

function persistAppData() {
  if (typeof localStorage === "undefined") return false;
  try {
    localStorage.setItem(persistentStorageKey(), JSON.stringify(persistentSnapshot()));
    return true;
  } catch {
    return false;
  }
}

function restorePersistentData() {
  if (typeof localStorage === "undefined") return false;
  try {
    const raw = localStorage.getItem(persistentStorageKey());
    if (!raw) return false;
    const saved = JSON.parse(raw);
    if (!saved || saved.version !== persistenceVersion || typeof saved !== "object") return false;

    if (saved.identityColorsByCup && typeof saved.identityColorsByCup === "object") {
      for (const cup of cupTypes) {
        state.identityColorsByCup[cup.id] = sanitizeCupColors(cup.id, saved.identityColorsByCup[cup.id]);
      }
    }

    if (saved.profile && cupById[saved.profile.cupId]) {
      const name = typeof saved.profile.name === "string" ? saved.profile.name.trim().slice(0, 12) : "";
      people.me.name = name || people.me.name;
      people.me.cupId = saved.profile.cupId;
      people.me.colors = sanitizeCupColors(saved.profile.cupId, saved.profile.colors);
      state.identityColorsByCup[people.me.cupId] = { ...people.me.colors };
    }

    if (Array.isArray(saved.relations)) {
      state.relations = saved.relations.flatMap(relation => {
        if (!relation || typeof relation !== "object") return [];
        const id = typeof relation.id === "string" ? relation.id.trim().slice(0, 40) : "";
        const note = typeof relation.note === "string" ? relation.note.trim().slice(0, 24) : "";
        if (!id || !note) return [];
        const memberIds = Array.isArray(relation.memberIds)
          ? [...new Set(relation.memberIds.filter(memberId => people[memberId]))]
          : [];
        if (!memberIds.includes("me")) memberIds.unshift("me");
        const inviteCode = typeof relation.inviteCode === "string" ? relation.inviteCode.trim().slice(0, 12) : "";
        return [{
          id,
          note,
          status: relation.status === "pending" ? "pending" : "active",
          memberIds,
          ...(inviteCode ? { inviteCode } : {}),
          receive: relation.receive !== false,
          send: relation.send !== false
        }];
      });
    }

    const memberSettings = defaultMemberSettings();
    if (saved.memberSettings && typeof saved.memberSettings === "object") {
      for (const id of Object.keys(memberSettings)) {
        const settings = saved.memberSettings[id];
        if (!settings || typeof settings !== "object") continue;
        memberSettings[id] = {
          note: typeof settings.note === "string" ? settings.note.trim().slice(0, 12) : "",
          receive: settings.receive !== false,
          send: settings.send !== false
        };
      }
    }
    state.memberSettings = memberSettings;

    if (saved.notifications && typeof saved.notifications === "object") {
      for (const key of ["drink", "response", "relation"]) {
        if (typeof saved.notifications[key] === "boolean") state.notifications[key] = saved.notifications[key];
      }
    }
    if (["browser", "installed"].includes(saved.installState)) state.installState = saved.installState;
    if (Number.isInteger(saved.nextInvitationNumber) && saved.nextInvitationNumber > 0) {
      state.nextInvitationNumber = saved.nextInvitationNumber;
    }

    state.selectedCupId = people.me.cupId;
    state.selectedCupRegion = cupById[people.me.cupId].layers.some(layer => layer.key === "body")
      ? "body"
      : cupById[people.me.cupId].layers[0].key;
    state.draftName = people.me.name;
    state.selectedRelationId = state.relations.find(relation => relation.id === "dorm")?.id
      || state.relations[0]?.id
      || null;
    return true;
  } catch {
    return false;
  }
}

function restoreAuthSession() {
  if (typeof localStorage === "undefined") return false;
  try {
    const saved = JSON.parse(localStorage.getItem(authSessionKey) || "null");
    if ((!saved?.token && saved?.cookieSession !== true) || !saved?.user?.id || !saved?.user?.email) return false;
    authToken = String(saved.token || "");
    authAccount = {
      id: String(saved.user.id),
      email: String(saved.user.email),
      createdAt: String(saved.user.createdAt || "")
    };
    authNeedsOnboarding = saved.needsOnboarding === true;
    return true;
  } catch {
    return false;
  }
}

function saveAuthSession(token, user, needsOnboarding = authNeedsOnboarding) {
  authToken = String(token || "");
  authAccount = { id: String(user.id), email: String(user.email), createdAt: String(user.createdAt || "") };
  authNeedsOnboarding = needsOnboarding;
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(authSessionKey, JSON.stringify({ token: authToken, cookieSession: true, user: authAccount, needsOnboarding: authNeedsOnboarding }));
}

function clearAuthSession() {
  authToken = "";
  authAccount = null;
  authNeedsOnboarding = false;
  cloudDataAvailable = false;
  if (typeof localStorage !== "undefined") localStorage.removeItem(authSessionKey);
}

function resetAccountData() {
  const freshPalettes = Object.fromEntries(cupTypes.map(cup => [cup.id, { ...cup.defaults }]));
  people.me.name = "小满";
  people.me.cupId = "cup-01";
  people.me.colors = { ...cupById["cup-01"].defaults };
  state.relations = [];
  incomingIds = [];
  state.incomingEvents = {};
  state.responseIds = [];
  state.invitePreview = null;
  state.selectedRelationId = null;
  state.memberSettings = defaultMemberSettings();
  state.notifications = { drink: true, response: true, relation: true };
  state.installState = "browser";
  state.identityColorsByCup = freshPalettes;
  state.selectedCupId = "cup-01";
  state.selectedCupRegion = "body";
  state.draftName = "小满";
  state.draftRelationNote = "";
  state.draftInviteCode = "";
  state.nextInvitationNumber = 1;
  state.homeMode = "calm";
  state.selectorOpen = false;
  state.selectedMemberId = null;
  state.memberEditDraft = null;
  state.cupEditDraft = null;
}

function maskedEmail(email = authAccount?.email) {
  const [name, domain] = String(email || "").split("@");
  if (!name || !domain) return "";
  const visible = name.length <= 2 ? name.slice(0, 1) : name.slice(0, 2);
  return `${visible}${"*".repeat(Math.min(4, Math.max(2, name.length - visible.length)))}@${domain}`;
}

async function authRequest(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {})
    }
  });
  const result = await response.json().catch(() => ({ ok: false, message: "服务暂时不可用" }));
  if (!response.ok) throw new Error(result.message || "请求没有完成");
  return result;
}

function supportsPushNotifications() {
  return typeof navigator !== "undefined"
    && "serviceWorker" in navigator
    && typeof PushManager !== "undefined"
    && typeof Notification !== "undefined";
}

function notificationPermission() {
  return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
}

function pushSettingsPayload() {
  return {
    drink: state.notifications.drink !== false,
    response: state.notifications.response !== false,
    relation: state.notifications.relation !== false
  };
}

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

async function pushRegistration() {
  if (!supportsPushNotifications()) throw new Error("当前浏览器暂不支持系统通知");
  return navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
}

async function savePushSubscription(subscription) {
  return authRequest("/api/push-subscription", {
    method: "POST",
    body: JSON.stringify({ subscription: subscription.toJSON(), settings: pushSettingsPayload() })
  });
}

async function refreshPushState({ syncExisting = false } = {}) {
  pushState.supported = supportsPushNotifications();
  pushState.permission = notificationPermission();
  pushState.error = "";
  if (!pushState.supported || !authAccount || !cloudDataAvailable) {
    pushState.subscribed = false;
    return false;
  }
  try {
    const [registration, status] = await Promise.all([
      pushRegistration(),
      authRequest("/api/push-subscription")
    ]);
    pushState.configured = status.configured === true && Boolean(status.publicKey);
    const subscription = await registration.pushManager.getSubscription();
    pushState.subscribed = Boolean(subscription);
    if (syncExisting && subscription && pushState.configured) await savePushSubscription(subscription);
    return pushState.subscribed;
  } catch (error) {
    pushState.error = error.message || "通知状态暂时无法读取";
    return false;
  }
}

async function enablePushNotifications() {
  if (pushState.busy) return false;
  pushState.supported = supportsPushNotifications();
  if (!pushState.supported) {
    pushState.error = "当前浏览器暂不支持；iPhone 请先添加到主屏幕";
    render();
    return false;
  }
  if (!authAccount || !cloudDataAvailable) {
    pushState.error = "登录后才能开启系统通知";
    render();
    return false;
  }
  pushState.busy = true;
  pushState.error = "";
  render();
  try {
    const permission = await Notification.requestPermission();
    pushState.permission = permission;
    if (permission !== "granted") throw new Error(permission === "denied" ? "通知已被浏览器阻止，请到系统设置中允许" : "还没有允许通知");
    const status = await authRequest("/api/push-subscription");
    pushState.configured = status.configured === true && Boolean(status.publicKey);
    if (!pushState.configured) throw new Error("推送服务还没有配置好");
    const registration = await pushRegistration();
    let subscription = await registration.pushManager.getSubscription();
    subscription ||= await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(status.publicKey)
    });
    state.notifications = { drink: true, response: true, relation: true };
    await savePushSubscription(subscription);
    pushState.subscribed = true;
    persistAppData();
    showToast("系统通知已开启");
    return true;
  } catch (error) {
    pushState.error = error.message || "系统通知没有开启";
    showToast(pushState.error);
    return false;
  } finally {
    pushState.busy = false;
    render();
  }
}

async function syncPushPreferences() {
  if (!pushState.subscribed || !authAccount || !cloudDataAvailable) return false;
  const registration = await pushRegistration();
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    pushState.subscribed = false;
    return false;
  }
  await savePushSubscription(subscription);
  return true;
}

async function disablePushNotifications({ removeFromServer = true } = {}) {
  if (!pushState.supported) return;
  try {
    const registration = await pushRegistration();
    const subscription = await registration.pushManager.getSubscription();
    if (subscription && removeFromServer && authAccount && cloudDataAvailable) {
      await authRequest("/api/push-subscription", {
        method: "DELETE",
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });
    }
    await subscription?.unsubscribe();
  } catch {
    // Local sign-out and account deletion should still finish if push cleanup fails.
  }
  pushState.subscribed = false;
}

function pushStatusDetails() {
  if (!pushState.supported) return { title: "当前不可用", note: "iPhone 请先添加到主屏幕" };
  if (pushState.permission === "denied") return { title: "已被阻止", note: "请到浏览器或系统设置中允许" };
  if (pushState.busy) return { title: "正在开启", note: "请留意系统弹窗" };
  if (pushState.subscribed) {
    return Object.values(state.notifications).some(Boolean)
      ? { title: "已允许", note: "这台设备会收到通知" }
      : { title: "已暂停", note: "可以单独打开一种提醒" };
  }
  return { title: "尚未开启", note: pushState.error || "点击下方按钮开启" };
}

function profilePayload() {
  return {
    name: people.me.name,
    cupId: people.me.cupId,
    colors: sanitizeCupColors(people.me.cupId, people.me.colors)
  };
}

function responseAcknowledgementStorageKey() {
  return `${responseAcknowledgementKey}:${authAccount?.id || "local"}`;
}

function acknowledgedResponseSignature() {
  if (typeof localStorage === "undefined") return "";
  try {
    return localStorage.getItem(responseAcknowledgementStorageKey()) || "";
  } catch {
    return "";
  }
}

function acknowledgeDisplayedResponse() {
  if (!currentResponseSignature || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(responseAcknowledgementStorageKey(), currentResponseSignature);
  } catch {
    // Returning home should still work when browser storage is unavailable.
  }
}

function applyServerState(result, { chooseHomeMode = false } = {}) {
  if (!result?.ok) return false;
  if (result.profile && cupById[result.profile.cupId]) {
    people.me.name = String(result.profile.name || people.me.name);
    people.me.cupId = result.profile.cupId;
    people.me.colors = sanitizeCupColors(result.profile.cupId, result.profile.colors);
    state.identityColorsByCup[people.me.cupId] = { ...people.me.colors };
    state.selectedCupId = people.me.cupId;
    state.draftName = people.me.name;
  }
  for (const person of result.people || []) {
    if (!person?.id || person.id === "me" || !cupById[person.cupId]) continue;
    people[person.id] = {
      ...person,
      colors: sanitizeCupColors(person.cupId, person.colors),
      relation: person.relation || "一起喝"
    };
    state.memberSettings[person.id] ||= { note: "", receive: true, send: true };
  }
  state.relations = Array.isArray(result.relations) ? result.relations : [];
  incomingIds = Array.isArray(result.incomingIds) ? result.incomingIds.filter(id => people[id]) : [];
  state.incomingEvents = result.incomingEvents && typeof result.incomingEvents === "object" ? result.incomingEvents : {};
  const serverResponseIds = Array.isArray(result.responseIds) ? result.responseIds.filter(id => people[id]) : [];
  const serverResponseSignature = String(result.responseSignature || [...serverResponseIds].sort().join(","));
  // Keep the visible response snapshot until the user explicitly leaves it.
  if (serverResponseIds.length || state.homeMode !== "responded") {
    state.responseIds = serverResponseIds;
    currentResponseSignature = serverResponseSignature;
  }
  state.selectedIds = [...incomingIds];
  if (!state.relations.some(relation => relation.id === state.selectedRelationId)) {
    state.selectedRelationId = state.relations[0]?.id || null;
  }
  if (chooseHomeMode && !state.page && state.activeTab === "drink") {
    if (serverResponseSignature && serverResponseSignature !== acknowledgedResponseSignature()) state.homeMode = "responded";
    else if (incomingIds.length) state.homeMode = "incoming";
    else if (state.homeMode === "incoming") state.homeMode = "calm";
  }
  return Boolean(result.profile);
}

async function appRequest(action, payload = {}) {
  return authRequest("/api/app-state", {
    method: "POST",
    body: JSON.stringify({ action, ...payload })
  });
}

async function syncServerState(options = {}) {
  if (!authAccount || !cloudDataAvailable || typeof fetch !== "function") return false;
  const result = await authRequest("/api/app-state");
  return applyServerState(result, options);
}

async function saveProfileRemote() {
  if (!authAccount || !cloudDataAvailable) return false;
  const result = await appRequest("saveProfile", profilePayload());
  applyServerState(result);
  authNeedsOnboarding = false;
  saveAuthSession(authToken, authAccount, false);
  return true;
}

function startServerSync() {
  if (serverSyncTimer || !authAccount || !cloudDataAvailable || typeof setInterval !== "function") return;
  serverSyncTimer = setInterval(async () => {
    if (typeof document !== "undefined" && document.hidden) return;
    try {
      await syncServerState({ chooseHomeMode: true });
      render();
    } catch {
      // Keep the last known state when the network is temporarily unavailable.
    }
  }, 30_000);
}

async function openInviteFromUrl() {
  if (!initialInviteCode || !authAccount || !cloudDataAvailable || authNeedsOnboarding) return;
  state.draftInviteCode = initialInviteCode;
  await previewInviteRemote();
}

async function sendLoginCode() {
  const email = String(state.authEmail).trim().toLowerCase().slice(0, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || state.authBusy) return;
  state.authEmail = email;
  state.authBusy = "sending";
  state.authError = "";
  render();
  try {
    const result = await authRequest("/api/auth/send-email-code", {
      method: "POST",
      body: JSON.stringify({ email })
    });
    state.authCodeSent = true;
    state.authDevCode = result.devCode || "";
    state.authChallenge = result.challenge || "";
    state.authCooldownUntil = Date.now() + Number(result.cooldownSeconds || 60) * 1000;
    clearTimeout(authCooldownTimer);
    authCooldownTimer = setTimeout(() => {
      if (state.page === "login") render();
    }, Number(result.cooldownSeconds || 60) * 1000 + 50);
  } catch (error) {
    state.authError = error.message || "验证码没有发出去";
  } finally {
    state.authBusy = "";
    render();
  }
}

async function verifyLoginCode() {
  const email = String(state.authEmail).trim().toLowerCase().slice(0, 254);
  const code = String(state.authCode).replace(/\D/g, "").slice(0, 6);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || code.length !== 6 || state.authBusy) return;
  state.authBusy = "verifying";
  state.authError = "";
  render();
  try {
    const result = await authRequest("/api/auth/verify-email-code", {
      method: "POST",
      body: JSON.stringify({ email, code, challenge: state.authChallenge })
    });
    cloudDataAvailable = result.cloudDataAvailable === true;
    saveAuthSession(result.token, result.user, result.isNewUser);
    const restored = restorePersistentData();
    let serverReady = false;
    if (result.isNewUser && restored) {
      try { serverReady = await saveProfileRemote(); } catch { serverReady = false; }
    } else if (!result.isNewUser) {
      try { serverReady = await syncServerState(); } catch { serverReady = false; }
    }
    if (serverReady || (!result.isNewUser && restored)) {
      authNeedsOnboarding = false;
      saveAuthSession(result.token, result.user, false);
      enterHome();
      startServerSync();
      await refreshPushState({ syncExisting: true });
      await openInviteFromUrl();
      showToast(`欢迎回来，${people.me.name}`);
    } else {
      resetAccountData();
      if (initialInviteCode) {
        state.entryIntent = "join";
        state.draftInviteCode = initialInviteCode;
      }
      saveAuthSession(result.token, result.user, true);
      state.pageHistory = [];
      state.page = "entry";
      state.demoPanel = false;
      showToast("邮箱已确认");
    }
    state.authCode = "";
    state.authDevCode = "";
    state.authChallenge = "";
  } catch (error) {
    state.authError = error.message || "登录没有完成";
  } finally {
    state.authBusy = "";
    render();
  }
}

async function validateAuthSession({ discoverCookie = false } = {}) {
  const discovering = !authToken && !authAccount;
  if ((discovering && !discoverCookie) || typeof fetch !== "function") return;
  try {
    const result = await authRequest("/api/auth/session");
    authAccount = result.user;
    cloudDataAvailable = result.cloudDataAvailable === true;
    authNeedsOnboarding = result.isNewUser === true;
    let serverReady = false;
    try {
      serverReady = await syncServerState({ chooseHomeMode: true });
      if (!serverReady && !authNeedsOnboarding && restorePersistentData()) {
        serverReady = await saveProfileRemote();
      }
    } catch {
      // The cached profile remains usable while the database or network recovers.
    }
    if (serverReady) {
      authNeedsOnboarding = false;
      saveAuthSession(authToken, authAccount, false);
      if (discovering || state.page === "login") enterHome();
      startServerSync();
      await refreshPushState({ syncExisting: true });
      await openInviteFromUrl();
      render();
    } else if (authNeedsOnboarding || result.isNewUser === true) {
      saveAuthSession(authToken, authAccount, true);
      state.page = "entry";
      state.pageHistory = [];
      render();
    }
  } catch (error) {
    if (/失效/.test(error.message || "")) {
      if (discovering) return;
      clearAuthSession();
      resetAccountData();
      state.page = "login";
      state.pageHistory = [];
      render();
      showToast("登录已失效，请重新验证");
    }
  }
}

async function signOutAccount() {
  persistAppData();
  await disablePushNotifications();
  try {
    if (authToken || authAccount) await authRequest("/api/auth/logout", { method: "POST", body: "{}" });
  } catch {
    // 即使网络暂不可用，也先退出这台设备上的账号。
  }
  clearAuthSession();
  cloudDataAvailable = false;
  clearInterval(serverSyncTimer);
  serverSyncTimer = undefined;
  resetAccountData();
  state.authEmail = "";
  state.authCode = "";
  state.authCodeSent = false;
  state.authDevCode = "";
  state.authError = "";
  state.authBusy = "";
  state.authCooldownUntil = 0;
  clearTimeout(authCooldownTimer);
  state.page = "login";
  state.pageHistory = [];
  render();
  showToast("已退出登录");
}

let toastTimer;
let drinkFeedbackTimer;
const drinkFeedbackDuration = 1000;

function beginDrinkFeedback() {
  clearTimeout(drinkFeedbackTimer);
  const reduceMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  state.drinkFeedbackActive = !reduceMotion;
  if (state.drinkFeedbackActive) {
    drinkFeedbackTimer = setTimeout(finishDrinkFeedback, drinkFeedbackDuration);
  }
}

function finishDrinkFeedback() {
  clearTimeout(drinkFeedbackTimer);
  state.drinkFeedbackActive = false;
  // Restore the existing button without remounting the cup or restarting bubbles.
  document.querySelectorAll("[data-drink-return]").forEach(button => {
    button.disabled = false;
  });
}

function currentRelation() {
  return state.relations.find(relation => relation.id === state.selectedRelationId);
}

function memberSettingsFor(id) {
  return state.memberSettings[id] || { note: "", receive: true, send: true };
}

function availableIncomingIds() {
  return incomingIds.filter(id => memberSettingsFor(id).receive);
}

function hasConnectedFriends() {
  return state.relations.some(relation => relation.status === "active" && relation.memberIds.length > 1);
}

function canShareDrink() {
  return state.relations.some(relation => relation.status === "active"
    && relation.send
    && relation.memberIds.some(id => id !== "me" && memberSettingsFor(id).send));
}

function enterHome() {
  state.page = null;
  state.pageHistory = [];
  state.activeTab = "drink";
  state.homeMode = "calm";
  state.selectorOpen = false;
  state.demoPanel = false;
}

async function copyDemoInvitation() {
  const code = state.page === "invite-ready" ? "P8L4" : currentRelation()?.inviteCode;
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code);
    showToast(cloudDataAvailable ? "邀请码已复制" : "演示邀请码已复制");
  } catch {
    showToast("未能复制，可以手动选中邀请码");
  }
}

async function handleForegroundPush(message) {
  if (message?.type !== "genyikou-push" || !authAccount || !cloudDataAvailable) return false;
  try {
    await syncServerState({ chooseHomeMode: true });
    if (message.category === "drink" && incomingIds.length) {
      state.page = null;
      state.pageHistory = [];
      state.activeTab = "drink";
      state.homeMode = "incoming";
      state.selectorOpen = false;
      state.demoPanel = false;
      state.selectedIds = [...incomingIds];
    } else if (message.category === "response" && state.responseIds.length) {
      state.page = null;
      state.pageHistory = [];
      state.activeTab = "drink";
      state.homeMode = "responded";
      state.selectorOpen = false;
      state.demoPanel = false;
    }
    render();
    return true;
  } catch {
    // The 30-second sync remains as a fallback for a momentary network failure.
    return false;
  }
}

async function previewInviteRemote() {
  const code = String(state.draftInviteCode || "").trim().toUpperCase();
  if (!code) return false;
  try {
    const result = await appRequest("previewInvite", { code });
    state.invitePreview = result.preview;
    for (const person of result.preview?.members || []) {
      if (!person?.id || !cupById[person.cupId]) continue;
      people[person.id] = { ...person, relation: "邀请你一起喝", colors: sanitizeCupColors(person.cupId, person.colors) };
    }
    navigateTo("invite-preview");
    return true;
  } catch (error) {
    showToast(error.message || "这个邀请码不可用");
    return false;
  }
}

async function acceptInviteRemote() {
  const code = state.invitePreview?.inviteCode || state.draftInviteCode;
  const result = await appRequest("acceptInvite", { code });
  applyServerState(result);
  state.selectedRelationId = result.relationId || state.selectedRelationId;
  state.invitePreview = null;
  state.page = null;
  state.pageHistory = [];
  state.activeTab = "connect";
}

async function updateCurrentRelationRemote() {
  const relation = currentRelation();
  if (!relation || !authAccount || !cloudDataAvailable) return;
  const result = await appRequest("updateRelation", {
    relationId: relation.id,
    note: relation.note,
    receive: relation.receive,
    send: relation.send
  });
  applyServerState(result);
}

function render() {
  const app = document.querySelector("#app");
  app.innerHTML = screenMarkup();
  bindEvents();
  syncBubbleMotion();
}

function screenMarkup() {
  const isSentScreen = !state.page && state.activeTab === "drink" && state.homeMode === "sent";
  return `${svgDefs()}
    <section class="screen ${state.page ? "screen--nested" : ""} ${state.page === "login" ? "screen--login" : ""} ${isSentScreen ? "screen--sent" : ""}">
      ${state.page === "login" ? "" : headerTemplate()}
      <main class="screen-content">
        ${state.page ? routedPageTemplate() : basePageTemplate()}
      </main>
      ${state.page ? "" : bottomNavTemplate()}
      ${state.demoPanel ? demoPanelTemplate() : ""}
    </section>`;
}

function renderFigmaBoard() {
  const board = document.querySelector("#figma-board");
  if (!board) return;

  const originalState = JSON.parse(JSON.stringify(state));
  const scenarios = [
    { id: "home-calm", label: "01 · 首页／平静", activeTab: "drink", homeMode: "calm" },
    { id: "home-sent", label: "02 · 首页／我喝了", activeTab: "drink", homeMode: "sent" },
    { id: "home-incoming", label: "03 · 首页／待回应", activeTab: "drink", homeMode: "incoming" },
    { id: "home-followed", label: "04 · 首页／跟一口完成", activeTab: "drink", homeMode: "followed", followedIds: ["ming", "hong"] },
    { id: "relations", label: "05 · 关系", activeTab: "connect", homeMode: "calm" },
    { id: "profile", label: "06 · 个人", activeTab: "cup", homeMode: "calm" }
  ];

  for (const scenario of scenarios) {
    state = {
      ...JSON.parse(JSON.stringify(originalState)),
      ...scenario,
      page: null,
      pageHistory: [],
      selectorOpen: false,
      demoPanel: false
    };
    const slot = board.querySelector(`[data-figma-screen="${scenario.id}"]`);
    if (!slot) continue;
    slot.innerHTML = `<p class="figma-screen-label">${scenario.label}</p><div class="figma-phone">${screenMarkup()}</div>`;
  }

  state = originalState;
}

function basePageTemplate() {
  if (state.activeTab === "drink") return homeTemplate();
  if (state.activeTab === "connect") return relationsTemplate();
  return profileTemplate();
}

function routedPageTemplate() {
  const pages = {
    "login": loginTemplate,
    "entry": entryTemplate,
    "identity-setup": identitySetupTemplate,
    "identity-edit": identitySetupTemplate,
    "activation-install": activationInstallTemplate,
    "activation-notification": activationNotificationTemplate,
    "create-relation": createRelationTemplate,
    "join-relation": joinRelationTemplate,
    "invite-preview": invitePreviewTemplate,
    "waiting-member": waitingMemberTemplate,
    "relation-detail": relationDetailTemplate,
    "edit-relation-note": editRelationNoteTemplate,
    "add-member": addMemberTemplate,
    "proposal-pending": proposalPendingTemplate,
    "proposal-confirm": proposalConfirmTemplate,
    "invite-ready": inviteReadyTemplate,
    "member-detail": memberDetailTemplate,
    "leave-relation": leaveRelationTemplate,
    "install-guide": installGuideTemplate,
    "notification-settings": notificationSettingsTemplate,
    "data-info": dataInfoTemplate,
    "delete-intro": deleteIntroTemplate,
    "delete-confirm": deleteConfirmTemplate,
    "delete-final": deleteFinalTemplate,
    "delete-complete": deleteCompleteTemplate
  };
  return pages[state.page]?.() || `<section class="flow-page"><p>这个页面还没有接好。</p></section>`;
}

function svgDefs() {
  return "";
}

function headerTemplate() {
  const titles = { drink: "跟一口", connect: "关系", cup: "个人" };
  if (state.page) {
    const pageTitles = {
      "login": "登录", "entry": "开始", "identity-setup": "我的杯子", "activation-install": "添加到桌面",
      "identity-edit": "编辑杯子",
      "activation-notification": "开启通知",
      "create-relation": "创建关系", "join-relation": "输入邀请码", "invite-preview": "关系邀请",
      "waiting-member": "等待加入", "relation-detail": "关系详情", "edit-relation-note": "修改备注",
      "add-member": "邀请朋友", "proposal-pending": "等待确认", "proposal-confirm": "确认邀请",
      "invite-ready": "邀请已准备好", "member-detail": "成员详情", "leave-relation": "退出关系",
      "install-guide": "安装到桌面", "notification-settings": "通知", "data-info": "数据说明",
      "delete-intro": "注销账户", "delete-confirm": "再次确认", "delete-final": "最后确认",
      "delete-complete": "已注销"
    };
    return `<header class="app-header app-header--subpage">
      ${state.page === "delete-complete" ? `<span class="header-spacer" aria-hidden="true"></span>` : `<button class="back-button" data-action="back" aria-label="返回">${sketchIcon("back")}</button>`}
      <div class="app-title">${pageTitles[state.page] || "跟一口"}</div>
      <span class="header-spacer" aria-hidden="true"></span>
    </header>`;
  }
  return `<header class="app-header">
    <div class="app-title ${state.activeTab === "drink" ? "app-title--brand" : ""}"><span class="app-title__dot"></span>${titles[state.activeTab]}</div>
    <button class="demo-trigger" data-action="toggle-demo" aria-label="打开演示场景">演示</button>
  </header>`;
}

function homeTemplate() {
  const templates = {
    calm: calmTemplate,
    sent: sentTemplate,
    incoming: incomingTemplate,
    followed: followedTemplate,
    responded: respondedTemplate
  };
  return `<div class="home-view home-view--${state.homeMode}">${templates[state.homeMode]()}</div>`;
}

function calmTemplate() {
  return `<section class="home-scene home-scene--calm" aria-label="平静状态">
    <p class="scene-kicker">按自己的节奏</p>
    <h1 class="campaign-copy campaign-copy--calm">喝水，也一起。</h1>
    <button class="paper-action paper-action--hero" data-action="drink">
      <span>我喝了</span>
    </button>
    <div class="hero-cup hero-cup--calm">${cupMarkup("me")}</div>
    <p class="scene-footnote">${hasConnectedFriends() ? "你喝的时候，喊我一声。" : "想起来，就喝一口。"}</p>
  </section>`;
}

function sentTemplate() {
  return `<section class="home-scene home-scene--sent" aria-label="${state.lastDrinkShared ? "我喝了已发出" : "我喝了，仅自己可见"}">
    ${bubbleFieldMarkup()}
    <h1 class="sent-title">喝过了。</h1>
    <div class="hero-cup hero-cup--sending">${cupMarkup("me")}</div>
    <div class="sent-actions">
      ${state.lastDrinkShared ? "" : `<p class="personal-drink-note">这一口，仅自己可见</p>`}
      <button class="paper-action paper-action--hero paper-action--next-drink" data-action="drink" data-drink-return ${state.drinkFeedbackActive ? "disabled" : ""}><span>我喝了</span></button>
    </div>
  </section>`;
}

// Closed, softly uneven contours. Matching cubic segments let the SVG gently
// morph its edges without a per-frame JavaScript loop or a raster filter.
function bubbleContour(phase) {
  const points = Array.from({ length: 12 }, (_, index) => {
    const angle = index * Math.PI / 6;
    const radius = 41 + 2.1 * Math.sin(3 * angle + phase) + 1.4 * Math.cos(5 * angle - phase);
    return { x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius };
  });
  const xy = point => `${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  let path = `M ${xy(points[0])}`;
  points.forEach((point, index) => {
    const previous = points[(index + 11) % 12];
    const next = points[(index + 1) % 12];
    const after = points[(index + 2) % 12];
    const firstControl = { x: point.x + (next.x - previous.x) / 6, y: point.y + (next.y - previous.y) / 6 };
    const secondControl = { x: next.x - (after.x - point.x) / 6, y: next.y - (after.y - point.y) / 6 };
    path += ` C ${xy(firstControl)} ${xy(secondControl)} ${xy(next)}`;
  });
  return `${path} Z`;
}

function bubbleFieldMarkup() {
  const contours = [0, Math.PI / 2, Math.PI, Math.PI * 1.5, 0].map(bubbleContour);
  // Deliberately off-centre: bubbles float across the white canvas, rather
  // than reading as a loading indicator or a target behind the cup.
  const bubbles = [
    { x: 51, y: 48, size: 110, duration: 5.6, delay: 0, alpha: .8 },
    { x: 3, y: 21, size: 49, duration: 4.7, delay: -1.5, alpha: .7 },
    { x: 94, y: 21, size: 38, duration: 6.1, delay: -3.4, alpha: .85 },
    { x: 19, y: 79, size: 35, duration: 5.3, delay: -2.2, alpha: .75 },
    { x: 99, y: 80, size: 56, duration: 6.7, delay: -4.8, alpha: .72 },
    { x: 53, y: 99, size: 37, duration: 4.9, delay: -1.2, alpha: .68 },
    { x: 57, y: 24, size: 17, duration: 4.3, delay: -2.7, alpha: .8 },
    { x: 4, y: 51, size: 20, duration: 5.9, delay: -3.9, alpha: .65 },
    { x: 69, y: 83, size: 14, duration: 4.6, delay: -.8, alpha: .85 }
  ];
  return `<div class="signal-field signal-bubbles" aria-hidden="true">
    ${bubbles.map((bubble, index) => `<div class="water-bubble" style="--bubble-x:${bubble.x}%;--bubble-y:${bubble.y}%;--bubble-size:${bubble.size}%;--bubble-alpha:${bubble.alpha};--drift-duration:${bubble.duration * 1.8}s;--bubble-delay:${bubble.delay}s;--bubble-turn:${index % 2 ? -1 : 1}">
      <svg viewBox="0 0 100 100" focusable="false">
        <path class="water-bubble__rim" d="${contours[0]}">
          <animate attributeName="d" values="${contours.join(";")}" dur="${bubble.duration}s" begin="${bubble.delay}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.25;.5;.75;1" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1;.45 0 .55 1" />
        </path>
        <path class="water-bubble__glint" d="M 26 34 Q 30 23 41 22" />
      </svg>
    </div>`).join("")}
  </div>`;
}

function syncBubbleMotion() {
  const reduceMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion && state.drinkFeedbackActive) finishDrinkFeedback();
  document.querySelectorAll(".signal-bubbles").forEach(field => {
    field.toggleAttribute("data-motion-paused", Boolean(reduceMotion || document.hidden));
  });
  document.querySelectorAll(".signal-bubbles svg").forEach(svg => {
    if (reduceMotion || document.hidden) {
      svg.pauseAnimations?.();
      if (reduceMotion) svg.setCurrentTime?.(0);
    } else svg.unpauseAnimations?.();
  });
}

function incomingTemplate() {
  const visibleIds = availableIncomingIds();
  const selectedCount = state.selectedIds.filter(id => visibleIds.includes(id)).length;
  return `<section class="home-scene home-scene--incoming" aria-label="收到他人的我喝了信号">
    <div class="incoming-heading">
      <h1 class="scene-kicker">他们刚喝了</h1>
      <span>${visibleIds.length} 人</span>
    </div>
    <div class="incoming-strip" role="list" aria-label="待回应成员，可横向滑动" tabindex="0">
      ${visibleIds.map(id => incomingPersonTemplate(id)).join("")}
    </div>
    ${state.selectorOpen
      ? `<div class="choice-zone">
          <button class="paper-action paper-action--follow paper-action--confirm" data-hold-follow ${selectedCount ? "" : "disabled"}>
            <span>跟一口</span>
          </button>
          ${selectionPanelTemplate()}
        </div>
        <button class="quiet-exit" data-action="close-selector">取消选择</button>`
      : `<div class="dual-actions">
          <button class="paper-action paper-action--follow" data-hold-follow ${visibleIds.length ? "" : "disabled"}><span>跟一口</span></button>
          <button class="paper-action paper-action--drink" data-action="drink"><span>我喝了</span></button>
        </div>
        <p class="hold-hint">轻点跟所有人 · 长按选人</p>`}
    <div class="hero-cup hero-cup--incoming">${cupMarkup("me")}</div>
  </section>`;
}

function incomingPersonTemplate(id) {
  const person = people[id];
  return `<article class="incoming-person" role="listitem">
    <div class="incoming-person__cup">${cupMarkup(id, { label: true })}</div>
    <strong>${person.name}</strong>
    <span>${person.time}</span>
  </article>`;
}

function selectionPanelTemplate() {
  return `<section class="selection-panel" aria-label="选择跟一口的对象">
    <div class="selection-panel__heading">
      <strong>这次跟谁？</strong>
      <small>选好，点左侧「跟一口」</small>
    </div>
    <div class="selection-list">
      ${availableIncomingIds().map(id => {
        const person = people[id];
        const selected = state.selectedIds.includes(id);
        return `<button class="selection-person ${selected ? "is-selected" : ""}" data-person-select="${id}" aria-pressed="${selected}">
          <span class="selection-person__cup">${cupMarkup(id, { label: false })}</span>
          <span class="selection-person__name">${person.name}<small>${person.relation}</small></span>
          <i aria-hidden="true">${selected ? "✓" : ""}</i>
        </button>`;
      }).join("")}
    </div>
  </section>`;
}

function followedTemplate() {
  const ids = state.followedIds.length ? state.followedIds : availableIncomingIds();
  const names = ids.map(id => people[id].name).join("、");
  return `<section class="home-scene home-scene--clink" aria-label="跟一口成功">
    <h1 class="scene-kicker scene-kicker--loud">一起喝了。</h1>
    ${clinkScene(ids)}
    <div class="secondary-caption">
      <p>你跟了 <strong>${names}</strong> 一口</p>
    </div>
    <button class="paper-action paper-action--hero paper-action--after" data-action="drink"><span>我喝了</span></button>
  </section>`;
}

function respondedTemplate() {
  const ids = state.responseIds;
  const names = ids.map(id => people[id].name).join("、");
  return `<section class="home-scene home-scene--clink" aria-label="他人回应了我喝了">
    <h1 class="scene-kicker scene-kicker--loud">这一口，有人跟。</h1>
    ${clinkScene(ids)}
    <div class="secondary-caption">
      <p><strong>${names}</strong> 跟了你一口</p>
    </div>
    <div class="responded-actions">
      <button class="paper-action paper-action--hero paper-action--after" data-action="drink"><span>我喝了</span></button>
      <button class="response-home-action" data-action="return-home">回到首页</button>
    </div>
  </section>`;
}

function clinkScene(otherIds) {
  const ids = ["me", ...otherIds];
  const positions = clinkPositions(ids.length);
  return `<div class="clink-scene clink-scene--${Math.min(ids.length, 5)}" aria-label="${ids.map(id => people[id].name).join("、")}碰杯">
    <div class="clink-rays" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    ${ids.map((id, index) => {
      const position = positions[index];
      const idleDuration = 5.2 + (index % 3) * .65;
      const idleDelay = -index * 1.05;
      const idleX = index % 2 ? "4px" : "-4px";
      const idleRotateStart = index % 2 ? "-.8deg" : ".75deg";
      const idleRotateEnd = index % 2 ? "1.25deg" : "-1.35deg";
      return `<div class="clink-cup ${id === "me" ? "clink-cup--me" : ""}" style="--x:${position.x}%;--y:${position.y}%;--r:${position.r}deg;--delay:${index * 70}ms;--idle-duration:${idleDuration}s;--idle-delay:${idleDelay}s;--idle-x:${idleX};--idle-rotate-start:${idleRotateStart};--idle-rotate-end:${idleRotateEnd}">${cupMarkup(id)}</div>`;
    }).join("")}
  </div>`;
}

function clinkPositions(count) {
  if (count === 2) return [
    { x: 33, y: 50, r: -12 }, { x: 61, y: 43, r: 12 }
  ];
  if (count === 3) return [
    { x: 50, y: 60, r: 0 }, { x: 27, y: 42, r: -13 }, { x: 72, y: 40, r: 13 }
  ];
  if (count === 4) return [
    { x: 50, y: 62, r: 0 }, { x: 23, y: 44, r: -15 }, { x: 76, y: 43, r: 15 }, { x: 51, y: 27, r: 3 }
  ];
  return [
    { x: 50, y: 62, r: 0 }, { x: 19, y: 47, r: -17 }, { x: 80, y: 47, r: 17 }, { x: 34, y: 25, r: -7 }, { x: 66, y: 24, r: 7 }
  ];
}

function relationsTemplate() {
  return `<section class="subpage relations-page">
    <div class="subpage-heading">
      <h1>一起喝的人</h1>
    </div>
    ${state.relations.some(relation => relation.id === "dorm" && relation.status === "active") ? `<button class="flow-alert" data-action="open-proposal-confirm">
      <span><small>新邀请</small><strong>小明想叫上小亮</strong></span><i>→</i>
    </button>` : ""}
    ${state.relations.map((relation, index) => relationCardTemplate(relation, index)).join("")}
    ${state.relations.length ? "" : `<p class="relation-empty">还没有连接朋友<br><span>可以先发一份邀请。</span></p>`}
    <div class="relation-actions">
      <button class="with-icon" data-action="create-relation">${sketchIcon("create")}创建关系</button>
      <button class="with-icon" data-action="join-relation">${sketchIcon("join")}加入关系</button>
    </div>
  </section>`;
}

function relationCardTemplate(relation, index) {
  const pending = relation.status === "pending";
  return `<button class="relation-card relation-card--${pending ? "waiting" : index % 2 ? "blue" : "coral"}" data-action="${pending ? "open-waiting-member" : "open-relation"}" data-relation-id="${escapeHtml(relation.id)}">
    <div class="relation-card__top"><div><strong>${escapeHtml(relation.note)}</strong><span>${pending ? "等待加入" : `${relation.memberIds.length} 人`}</span></div><i aria-hidden="true">${sketchIcon("next")}</i></div>
    ${pending ? "" : `<div class="relation-cups ${relation.memberIds.length === 2 ? "relation-cups--pair" : ""}">${relation.memberIds.map(id => `<div>${cupMarkup(id)}</div>`).join("")}</div>`}
  </button>`;
}

function profileTemplate() {
  const notificationStatus = pushStatusDetails();
  return `<section class="subpage profile-page">
    <div class="subpage-heading">
      <h1>我的杯子</h1>
    </div>
    <button class="profile-cup-card" data-action="edit-cup" aria-label="编辑我的杯子">
      <div class="profile-cup-art">${cupMarkup("me")}</div>
      <div class="profile-cup-card__details"><strong>${escapeHtml(people.me.name)}</strong></div>
      <i class="profile-cup-card__edit" aria-hidden="true">${sketchIcon("edit")}</i>
    </button>
    <div class="settings-list">
      ${authAccount ? `<button class="account-row has-leading-icon" data-action="sign-out">${sketchIcon("email")}<span>邮箱</span><i>${maskedEmail()} · 退出</i></button>` : ""}
      <button class="has-leading-icon" data-action="install">${sketchIcon("install")}<span>放到桌面</span><i>${state.installState === "installed" ? "已安装" : "推荐"}</i></button>
      <button class="has-leading-icon" data-action="notifications">${sketchIcon("bell")}<span>通知</span><i>${notificationStatus.title}</i></button>
      <button class="has-leading-icon" data-action="data-note">${sketchIcon("data")}<span>数据使用</span><i>›</i></button>
    </div>
    <button class="sign-out with-icon" data-action="delete-account">${sketchIcon("delete")}注销账户</button>
  </section>`;
}

function loginTemplate() {
  const email = String(state.authEmail).trim().toLowerCase().slice(0, 254);
  const code = String(state.authCode).replace(/\D/g, "").slice(0, 6);
  const cooldown = Math.max(0, Math.ceil((state.authCooldownUntil - Date.now()) / 1000));
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  const canSend = validEmail && !state.authBusy && cooldown === 0;
  const canVerify = validEmail && code.length === 6 && !state.authBusy;
  return `<section class="login-page">
    <div class="login-stripes" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <div class="login-brand">
      <div class="login-clink" aria-hidden="true">
        <div>${cupMarkup("me", { label: false })}</div>
        <div>${cupMarkup("ming", { label: false })}</div>
        <svg class="login-clink__rays login-clink__rays--left" viewBox="0 0 44 52" aria-hidden="true" focusable="false">
          <path d="M31 17 Q27 11 25 5 M23 27 Q16 22 9 20 M19 39 Q12 37 5 39" />
        </svg>
        <svg class="login-clink__rays login-clink__rays--right" viewBox="0 0 44 52" aria-hidden="true" focusable="false">
          <path d="M13 17 Q17 11 18 5 M21 27 Q29 22 35 19 M25 39 Q32 37 39 38" />
        </svg>
      </div>
      <small>跟一口</small>
      <h1>你喝的时候，<br>喊我一声。</h1>
    </div>
    <div class="login-card">
      <label class="field-block"><span>邮箱</span><input id="login-email-input" inputmode="email" autocomplete="email" maxlength="254" value="${escapeHtml(email)}" placeholder="name@example.com"></label>
      <div class="login-code-row">
        <label class="field-block"><span>验证码</span><input id="login-code-input" inputmode="numeric" autocomplete="one-time-code" maxlength="6" value="${escapeHtml(code)}" placeholder="6 位验证码"></label>
        <button class="login-send-code" data-action="send-login-code" ${canSend ? "" : "disabled"}>${state.authBusy === "sending" ? "发送中" : cooldown ? `${cooldown} 秒` : state.authCodeSent ? "重新发送" : "发送验证码"}</button>
      </div>
      <button class="flow-primary" data-action="verify-login-code" ${canVerify ? "" : "disabled"}>${state.authBusy === "verifying" ? "正在进入…" : "登录 / 注册"}</button>
      <div class="login-auth-status" aria-live="polite">
        ${state.authError ? `<p class="is-error">${escapeHtml(state.authError)}</p>` : state.authDevCode ? `<p>本地测试验证码 <strong>${escapeHtml(state.authDevCode)}</strong></p>` : state.authCodeSent ? `<p>验证码已发送，去邮箱看一眼</p>` : `<p>未注册的邮箱会自动创建账号</p>`}
      </div>
    </div>
    <p class="login-demo-note">验证后再选一只代表你的杯子</p>
  </section>`;
}

function entryTemplate() {
  return `<section class="flow-page flow-page--entry">
    <div class="entry-brand">
      <small>跟一口</small>
      <h1>你喝的时候，<br>喊我一声。</h1>
      <p>和熟悉的人，分享喝水的片刻。</p>
    </div>
    <div class="entry-choice-grid">
      <button data-action="entry-create"><small>我先开始</small><strong>邀请朋友</strong></button>
      <button data-action="entry-join"><small>收到邀请了</small><strong>加入关系</strong></button>
    </div>
    <button class="text-action" data-action="entry-current">先逛逛演示版</button>
  </section>`;
}

function identitySetupTemplate() {
  const editing = state.page === "identity-edit";
  const editor = cupEditorState();
  const cup = cupById[editor.selectedCupId];
  const cupIndex = cupTypes.findIndex(item => item.id === cup.id);
  const previousCup = cupTypes[(cupIndex - 1 + cupTypes.length) % cupTypes.length];
  const nextCup = cupTypes[(cupIndex + 1) % cupTypes.length];
  const colors = editor.identityColorsByCup[cup.id];
  return `<section class="flow-page flow-page--identity${editing ? " flow-page--identity-edit" : ""}">
    ${flowLead("选一只，代表你", "选个部位，换个颜色。")}
    <div class="cup-carousel" aria-label="选择杯型">
      <button class="cup-carousel__side cup-carousel__side--left" data-action="select-cup" data-cup-select="${previousCup.id}" aria-label="上一个杯型">${cupPreviewMarkup(previousCup.id)}</button>
      <div class="identity-preview">${cupPreviewMarkup(cup.id, colors, cupEditorName())}</div>
      <button class="cup-carousel__side cup-carousel__side--right" data-action="select-cup" data-cup-select="${nextCup.id}" aria-label="下一个杯型">${cupPreviewMarkup(nextCup.id)}</button>
    </div>
    <div class="cup-carousel__meta"><button data-action="previous-cup" aria-label="上一个杯型">${sketchIcon("back")}</button><span aria-label="第 ${cupIndex + 1} 款，共 ${cupTypes.length} 款" aria-live="polite">${cupIndex + 1} / ${cupTypes.length}</span><button data-action="next-cup" aria-label="下一个杯型">${sketchIcon("next")}</button></div>
    <div class="identity-editor">
      <div class="region-tabs" aria-label="选择要调整的区域">
        ${cup.layers.map(layer => `<button class="${editor.selectedCupRegion === layer.key ? "is-active" : ""}" data-action="select-region" data-region-select="${layer.key}"><i style="--chip-color:${colors[layer.key]}"></i>${layer.name}</button>`).join("")}
      </div>
      <div class="color-palette" aria-label="选择颜色">
        ${clearPalette.map(color => `<button class="${colors[editor.selectedCupRegion] === color.value ? "is-active" : ""}" style="--swatch:${color.value}" data-action="apply-color" data-color-select="${color.value}" aria-label="${color.name}" title="${color.name}"></button>`).join("")}
      </div>
      <button class="random-palette" data-action="randomize-cup"><span>✦</span> 随机配色</button>
    </div>
    ${editing
      ? `<div class="identity-fixed-name"><span>名称</span><strong>${escapeHtml(people.me.name)}</strong><small>暂不支持修改</small></div>
         <button class="flow-primary with-icon" data-action="save-cup">${sketchIcon("check")}保存</button>`
      : `<label class="field-block"><span>名称</span><input id="identity-name-input" maxlength="10" value="${escapeHtml(state.draftName)}" placeholder="例如：小满"></label>
         <p class="field-note">名称保存后暂不支持修改</p>
         <button class="flow-primary with-icon" data-action="confirm-identity" ${state.draftName.trim() ? "" : "disabled"}>${sketchIcon("check")}保存</button>`}
  </section>`;
}

function activationInstallTemplate() {
  return `<section class="flow-page">
    ${flowLead("放到桌面，随手打开", "推荐安装，也可以继续用网页。")}
    <div class="comparison-list">
      <div><strong>安装</strong><span>通知更及时</span></div>
      <div><strong>继续使用网页</strong><span>随时回来查看</span></div>
    </div>
    <button class="flow-primary" data-action="activation-installed">已安装</button>
    <button class="flow-secondary activation-secondary" data-action="activation-browser">稍后</button>
  </section>`;
}

function activationNotificationTemplate() {
  const status = pushStatusDetails();
  return `<section class="flow-page">
    ${flowLead("有动静，告诉你", "开启通知，接收朋友的喝水与回应。")}
    <div class="activation-notices">
      <div><strong>有人喝了</strong><span>可以回应</span></div>
      <div><strong>有人跟了你</strong><span>收到回应</span></div>
      <div><strong>关系有变化</strong><span>成员确认</span></div>
    </div>
    ${pushState.error ? `<p class="push-error" role="alert">${escapeHtml(pushState.error)}</p>` : ""}
    <button class="flow-primary" data-action="activation-allow" ${pushState.busy ? "disabled" : ""}>${pushState.busy ? "正在开启…" : status.title === "已允许" ? "通知已开启" : "开启通知"}</button>
    <button class="text-action" data-action="activation-later">稍后</button>
  </section>`;
}

function createRelationTemplate() {
  return `<section class="flow-page">
    ${flowLead("你们，叫什么？", "写个关系备注，仅自己可见。")}
    <label class="field-block"><span>关系备注</span><input id="relation-note-input" maxlength="16" value="${escapeHtml(state.draftRelationNote)}" placeholder="例如：宿舍这边"></label>
    <button class="flow-primary" data-action="finish-create-relation" ${state.draftRelationNote.trim() ? "" : "disabled"}>创建关系</button>
  </section>`;
}

function joinRelationTemplate() {
  return `<section class="flow-page">
    ${flowLead("输入邀请码")}
    <label class="field-block field-block--code"><span>邀请码</span><input id="invite-code-input" maxlength="8" value="${escapeHtml(state.draftInviteCode)}" placeholder="例如：K2M8Q"></label>
    <button class="flow-primary" data-action="preview-invite" ${state.draftInviteCode.trim() ? "" : "disabled"}>查看邀请</button>
    <button class="text-action" data-action="simulate-invalid-code">演示无效邀请码</button>
  </section>`;
}

function invitePreviewTemplate() {
  const previewMembers = state.invitePreview?.members || [];
  const memberIds = previewMembers.length ? previewMembers.map(member => member.id) : ["ming", "hong"];
  const leadName = people[memberIds[0]]?.name || "朋友";
  return `<section class="flow-page">
    ${flowLead(`和${escapeHtml(leadName)}一起喝水？`, `加入后，将与这里的 ${memberIds.length} 位成员互相接收喝水信号。`)}
    <div class="people-preview">
      ${memberIds.map(id => memberPreview(id)).join("")}
    </div>
    <div class="notice-box"><strong>大家都一样</strong><p>没有群主，信号怎么收发由自己决定。</p></div>
    <div class="flow-actions"><button class="flow-secondary" data-action="decline-invite">暂不加入</button><button class="flow-primary" data-action="accept-invite">接受邀请</button></div>
  </section>`;
}

function waitingMemberTemplate() {
  const relation = currentRelation();
  const code = escapeHtml(relation?.inviteCode || "M7Q2");
  return `<section class="flow-page flow-page--invitation">
    ${flowLead("邀请已准备好", "不用在这里等，朋友加入后会出现在「碰」里。")}
    <div class="invite-ticket"><small>${escapeHtml(relation?.note || "邀请朋友")}</small><strong>genyikou.click/join/${code}</strong><span>备用邀请码 · ${code}</span></div>
    ${cloudDataAvailable ? "" : `<p class="field-note">演示邀请，暂不能用于真实加入</p>`}
    <button class="flow-secondary with-icon invitation-copy" data-action="copy-invite">${sketchIcon("copy")}复制邀请码</button>
    <button class="flow-primary" data-action="complete-invitation">完成，进入首页</button>
    <div class="flow-list">
      <button data-action="edit-relation-note"><span class="with-icon">${sketchIcon("edit")}修改备注</span><i>›</i></button>
      <button data-action="cancel-waiting-relation"><span>取消邀请</span><i>›</i></button>
    </div>
  </section>`;
}

function relationDetailTemplate() {
  const relation = currentRelation();
  const memberIds = relation?.memberIds || ["me"];
  const paused = !relation?.receive && !relation?.send;
  return `<section class="flow-page flow-page--detail">
    <div class="detail-hero"><small>我的备注</small><h1>${escapeHtml(relation?.note || "新关系")}</h1><button class="with-icon" data-action="edit-relation-note">${sketchIcon("edit")}修改</button></div>
    <section class="detail-section">
      <div class="section-heading"><h2>成员</h2><span>${memberIds.length} 人</span></div>
      <div class="member-list">
        ${memberIds.map(id => memberRow(id, id !== "me")).join("")}
      </div>
      <button class="inline-add with-icon" data-action="add-member">${sketchIcon("create")}邀请朋友</button>
    </section>
    <section class="detail-section">
      <div class="section-heading"><h2>信号</h2><span>${paused ? "已暂停" : ""}</span></div>
      ${toggleRow("toggle-relation-receive", "接收这里的信号", "关闭后，不再通过这段关系接收", Boolean(relation?.receive))}
      ${toggleRow("toggle-relation-send", "分享我的这一口", "关闭后，不再向这段关系发送", Boolean(relation?.send))}
    </section>
    <button class="danger-link with-icon" data-action="leave-relation">${sketchIcon("leave")}退出这段关系</button>
  </section>`;
}

function editRelationNoteTemplate() {
  return `<section class="flow-page">
    ${flowLead("修改备注", "只有你能看到。")}
    <label class="field-block"><span>关系备注</span><input id="edit-relation-note-input" maxlength="16" value="${escapeHtml(currentRelation()?.note || "")}"></label>
    <button class="flow-primary" data-action="save-relation-note">保存备注</button>
  </section>`;
}

function addMemberTemplate() {
  return `<section class="flow-page">
    ${flowLead("还想叫上谁？", "现有成员都同意后，再发出邀请。")}
    <label class="field-block"><span>临时称呼</span><input id="candidate-input" maxlength="12" value="${escapeHtml(state.draftCandidate)}" placeholder="例如：小亮"></label>
    <button class="flow-primary" data-action="submit-proposal" ${state.draftCandidate.trim() ? "" : "disabled"}>请大家确认</button>
  </section>`;
}

function proposalPendingTemplate() {
  const candidate = state.draftCandidate || "小亮";
  return `<section class="flow-page">
    ${flowLead(`等待大家确认`, `邀请对象：${escapeHtml(candidate)}`)}
    <div class="status-mark"><strong>确认中</strong><span>不会显示谁还没确认</span></div>
    <div class="notice-box"><p>全员同意后生成邀请。</p></div>
    <button class="flow-secondary" data-action="simulate-proposal-ready">演示：全员同意</button>
    <button class="danger-link" data-action="withdraw-proposal">撤回邀请</button>
  </section>`;
}

function proposalConfirmTemplate() {
  return `<section class="flow-page">
    ${flowLead("小明想邀请小亮", "加入后，每个人权利相同。")}
    <div class="people-preview">${["me", "ming", "hong"].map(id => memberPreview(id)).join("")}</div>
    <div class="notice-box"><p>不会公开谁拒绝。</p></div>
    <div class="flow-actions"><button class="flow-secondary" data-action="reject-proposal">不同意</button><button class="flow-primary" data-action="approve-proposal">同意</button></div>
  </section>`;
}

function inviteReadyTemplate() {
  const candidate = state.draftCandidate || "小亮";
  return `<section class="flow-page">
    ${flowLead(`可以邀请${escapeHtml(candidate)}了`)}
    <div class="invite-ticket"><small>${escapeHtml(candidate)}的邀请链接</small><strong>genyikou.click/join/P8L4</strong><span>备用邀请码 · P8L4</span></div>
    <button class="flow-primary with-icon" data-action="copy-invite">${sketchIcon("copy")}复制邀请码</button>
    <button class="text-action" data-action="finish-invite-ready">稍后</button>
  </section>`;
}

function memberDetailTemplate() {
  const relation = currentRelation();
  const fallbackId = relation?.memberIds.find(id => id !== "me") || "ming";
  const memberId = people[state.selectedMemberId] && state.selectedMemberId !== "me" ? state.selectedMemberId : fallbackId;
  const person = people[memberId];
  const savedSettings = memberSettingsFor(memberId);
  const settings = state.memberEditDraft?.memberId === memberId ? state.memberEditDraft : savedSettings;
  return `<section class="flow-page flow-page--detail">
    <div class="member-hero">${cupMarkup(memberId)}<div><h1>${escapeHtml(person.name)}</h1></div></div>
    <label class="field-block"><span>私人备注</span><input id="member-note-input" maxlength="12" value="${escapeHtml(settings.note)}" placeholder="添加备注"></label>
    <section class="detail-section">
      <div class="section-heading"><h2>我们之间的信号</h2><span>所有共同关系</span></div>
      ${toggleRow("toggle-member-receive", "看 TA 的信号", "关闭后，TA 不会知道", settings.receive)}
      ${toggleRow("toggle-member-send", "让 TA 看我的信号", "与上一个开关相互独立", settings.send)}
    </section>
    <button class="flow-primary" data-action="save-member-settings">保存</button>
  </section>`;
}

function leaveRelationTemplate() {
  return `<section class="flow-page">
    ${flowLead("退出这段关系？")}
    <div class="notice-box notice-box--warning"><p>将停止收发这段关系的信号。</p></div>
    <button class="flow-primary flow-primary--danger" data-action="confirm-leave-relation">退出</button>
    <button class="text-action" data-action="back">取消</button>
  </section>`;
}

function installGuideTemplate() {
  const installed = state.installState === "installed";
  return `<section class="flow-page">
    ${flowLead(installed ? "已放到桌面" : "安装到桌面", installed ? "" : "更方便打开，也能及时收到通知。")}
    <ol class="step-list"><li><span>1</span>用 Safari 打开这个网页</li><li><span>2</span>点底部分享按钮</li><li><span>3</span>选择“添加到主屏幕”</li></ol>
    <button class="flow-primary" data-action="simulate-installed">${installed ? "已完成" : "完成"}</button>
  </section>`;
}

function notificationSettingsTemplate() {
  const status = pushStatusDetails();
  const togglesDisabled = !pushState.subscribed || pushState.busy;
  return `<section class="flow-page flow-page--detail">
    ${flowLead("通知")}
    <div class="permission-card"><span><small>系统权限</small><strong>${escapeHtml(status.title)}</strong></span><i>${escapeHtml(status.note)}</i></div>
    ${pushState.subscribed
      ? `<button class="text-action notification-device-action" data-action="disable-system-notifications">关闭这台设备的通知</button>`
      : `<button class="flow-primary notification-enable" data-action="enable-system-notifications" ${pushState.busy ? "disabled" : ""}>${pushState.busy ? "正在开启…" : "开启系统通知"}</button>`}
    ${pushState.error && !status.note.includes(pushState.error) ? `<p class="push-error" role="alert">${escapeHtml(pushState.error)}</p>` : ""}
    <section class="detail-section">
      ${toggleRow("toggle-notification-drink", "喝水信号", "有人喝了", state.notifications.drink, togglesDisabled)}
      ${toggleRow("toggle-notification-response", "跟随回应", "有人回应", state.notifications.response, togglesDisabled)}
      ${toggleRow("toggle-notification-relation", "关系变化", "邀请与加入", state.notifications.relation, togglesDisabled)}
    </section>
  </section>`;
}

function dataInfoTemplate() {
  return `<section class="flow-page">
    ${flowLead("数据使用", "只用于改善产品。")}
    <div class="data-block"><strong>会记录</strong><p>匿名身份、关系、信号与通知结果。</p></div>
    <div class="data-block"><strong>不会记录</strong><p>喝水量、位置、通讯录或聊天内容。</p></div>
    <p class="page-note">仅用于 V0.2 调整。</p>
  </section>`;
}

function deleteIntroTemplate() {
  return `<section class="flow-page">
    ${flowLead("注销账户？", "将删除当前身份并退出全部关系。")}
    <div class="notice-box"><p>如果只想退出一段关系，可以前往关系页单独退出。</p></div>
    <button class="flow-primary flow-primary--danger" data-action="continue-delete">继续</button>
  </section>`;
}

function deleteConfirmTemplate() {
  return `<section class="flow-page">${flowLead("退出全部关系并清除身份？", "其他成员只会看到关系变化。")}
    <button class="flow-primary flow-primary--danger" data-action="continue-delete-final">继续</button><button class="text-action" data-action="back">取消</button></section>`;
}

function deleteFinalTemplate() {
  return `<section class="flow-page">${flowLead("最后确认", "注销后无法找回。")}
    <label class="confirm-check"><input id="delete-understood" type="checkbox"><span>我知道无法找回</span></label>
    <button class="flow-primary flow-primary--danger" data-action="finish-delete" disabled>注销</button><button class="text-action" data-action="back">取消</button></section>`;
}

function deleteCompleteTemplate() {
  return `<section class="flow-page flow-page--center"><div class="status-mark status-mark--complete"><strong>已注销</strong><span>身份已清除</span></div><button class="flow-primary" data-action="restart-demo">重新开始</button></section>`;
}

function flowLead(title, note) {
  return `<div class="flow-lead"><h1>${title}</h1>${note ? `<p>${note}</p>` : ""}</div>`;
}

function memberPreview(id) {
  return `<div class="member-preview">${cupMarkup(id)}<strong>${escapeHtml(people[id].name)}</strong></div>`;
}

function memberRow(id, clickable) {
  const privateNote = clickable ? memberSettingsFor(id).note : "";
  const note = privateNote ? `备注：${escapeHtml(privateNote)}` : clickable ? "添加备注" : "";
  return `<button class="member-row" ${clickable ? `data-action="open-member" data-member-id="${escapeHtml(id)}"` : "disabled"}>${cupMarkup(id)}<span><strong>${escapeHtml(people[id].name)}</strong><small>${note}</small></span>${clickable ? "<i>›</i>" : "<i>我</i>"}</button>`;
}

function toggleRow(action, title, note, checked, disabled = false) {
  return `<button class="toggle-row" data-action="${action}" aria-pressed="${checked}" ${disabled ? "disabled aria-disabled=\"true\"" : ""}><span><strong>${title}</strong><small>${note}</small></span><i class="switch ${checked ? "is-on" : ""}"><b></b></i></button>`;
}

function bottomNavTemplate() {
  const items = [
    { id: "drink", label: "喝", icon: sketchNavIcon("drink") },
    { id: "connect", label: "碰", icon: sketchNavIcon("connect") },
    { id: "cup", label: "杯", icon: sketchNavIcon("cup") }
  ];
  return `<nav class="bottom-nav" aria-label="主要分区">
    ${items.map(item => `<button class="nav-item ${state.activeTab === item.id ? "active" : ""}" data-tab="${item.id}" aria-label="${item.label}" aria-current="${state.activeTab === item.id ? "page" : "false"}">
      <span class="nav-item__icon">${item.icon}</span>
    </button>`).join("")}
  </nav>`;
}

function sketchNavIcon(type) {
  const paths = { drink: "/assets/nav/drink.png", connect: "/assets/nav/connect.png", cup: "/assets/nav/cup.png" };
  return `<img class="nav-sketch-icon" src="${paths[type]}" alt="" aria-hidden="true">`;
}

// Keep the original PNG strokes; viewBox only removes surrounding empty canvas.
const sketchIconAssets = {
  back: ["next", "664 464 720 672"],
  next: ["next", "664 464 720 672"],
  create: ["create", "584 440 864 872"],
  join: ["join", "640 560 808 536"],
  edit: ["edit", "624 320 832 928"],
  bell: ["bell", "536 456 880 776"],
  install: ["install", "696 464 768 872"],
  copy: ["copy", "744 584 600 704"],
  close: ["close", "592 400 768 832"],
  leave: ["leave", "728 536 600 584"],
  delete: ["delete", "752 536 640 800"],
  check: ["check", "688 488 800 632"],
  email: ["email", "420 360 1100 950"],
  data: ["data", "460 400 1060 1080"]
};

function sketchIcon(type) {
  const [asset, viewBox] = sketchIconAssets[type];
  return `<svg class="ui-sketch-icon ui-sketch-icon--${type}" viewBox="${viewBox}" aria-hidden="true" focusable="false"><image href="/assets/icons/${asset}.png" width="2048" height="2048" /></svg>`;
}

function demoPanelTemplate() {
  const pendingInvitations = state.relations.filter(relation => relation.status === "pending");
  const options = [
    { mode: "calm", title: "平静状态", note: "只有自己的杯子" },
    { mode: "sent", title: "我喝了", note: "明显出现，再轻轻持续" },
    { mode: "responded", title: "朋友跟了我", note: "双杯／多杯回应" },
    { mode: "incoming", title: "有人刚喝了", note: "滑动、点按或长按" }
  ];
  return `<div class="panel-backdrop" data-action="close-demo"></div>
    <section class="demo-panel" role="dialog" aria-modal="true" aria-label="切换演示场景">
      <div class="panel-grip"></div>
      <div class="demo-panel__heading"><div><small>仅用于原型测试</small><h2>切换首页场景</h2></div><button data-action="close-demo" aria-label="关闭">${sketchIcon("close")}</button></div>
      <div class="demo-options">
        ${options.map(option => `<button class="${state.homeMode === option.mode ? "is-current" : ""}" data-demo-mode="${option.mode}"><span>${option.title}<small>${option.note}</small></span><i>→</i></button>`).join("")}
      </div>
      ${pendingInvitations.length ? `<div class="demo-invitations"><p>邀请演示 · 不会通知真实朋友</p>${pendingInvitations.map(relation => `<button data-action="simulate-invitation-accepted" data-relation-id="${escapeHtml(relation.id)}"><span>模拟朋友加入<small>${escapeHtml(relation.note)}</small></span><i>→</i></button>`).join("")}</div>` : ""}
      <button class="demo-entry-link" data-action="start-entry-demo"><span>从登录与注册开始体验</span><i>→</i></button>
    </section>`;
}

function cupMarkup(id, options = {}) {
  const person = people[id];
  return cupPreviewMarkup(options.cupId || person.cupId, options.colors || person.colors, person.name, options.label !== false, id);
}

function cupPreviewMarkup(cupId, colors = null, name = cupEditorName(), label = true, personId = "preview") {
  const cup = cupById[cupId];
  const appliedColors = colors || cupEditorState().identityColorsByCup[cupId] || cup.defaults;
  const labelStyle = `--name-x:${cup.label.x}%;--name-y:${cup.label.y}%;--name-rotate:${cup.label.rotate}deg;--name-width:${cup.label.width}%`;
  const layers = cup.layers
    .map(layer => `<span class="cup-layer cup-layer--${layer.key}" style="--layer-color:${appliedColors[layer.key] || clearPalette[0].value};--layer-mask:url('${layer.asset}');--layer-z:${layer.z}"></span>`)
    .join("");
  return `<div class="cup-object cup-object--real cup-object--${cup.id}" style="${labelStyle}" data-cup="${personId}" data-cup-type="${cup.id}" role="img" aria-label="${escapeHtml(name)}的${cup.name}">
    <div class="cup-art">
      ${layers}
      ${label ? `<span class="cup-name-overlay">${escapeHtml(name)}</span>` : ""}
    </div>
  </div>`;
}

function cupEditorState() {
  return state.page === "identity-edit" && state.cupEditDraft ? state.cupEditDraft : state;
}

function cupEditorName() {
  return state.page === "identity-edit" ? people.me.name : state.draftName;
}

function openCupEditor() {
  // Work on independent colors, including both accessories on four-layer cups.
  const colors = Object.fromEntries(Object.entries(state.identityColorsByCup).map(([id, palette]) => [id, { ...palette }]));
  colors[people.me.cupId] = { ...people.me.colors };
  state.cupEditDraft = {
    selectedCupId: people.me.cupId,
    selectedCupRegion: "body",
    identityColorsByCup: colors
  };
  navigateTo("identity-edit");
}

function closeCupEditor() {
  state.cupEditDraft = null;
  state.page = null;
  state.pageHistory = [];
  state.activeTab = "cup";
  state.demoPanel = false;
}

function selectCup(cupId) {
  if (!cupById[cupId]) return;
  const editor = cupEditorState();
  editor.selectedCupId = cupId;
  const keys = cupById[cupId].layers.map(layer => layer.key);
  if (!keys.includes(editor.selectedCupRegion)) editor.selectedCupRegion = keys.includes("body") ? "body" : keys[0];
}

function cycleCup(direction) {
  const index = cupTypes.findIndex(cup => cup.id === cupEditorState().selectedCupId);
  selectCup(cupTypes[(index + direction + cupTypes.length) % cupTypes.length].id);
}

function randomizeCupColors() {
  const editor = cupEditorState();
  const cup = cupById[editor.selectedCupId];
  const available = [...clearPalette];
  for (let index = available.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [available[index], available[swapIndex]] = [available[swapIndex], available[index]];
  }
  cup.layers.forEach((layer, index) => {
    editor.identityColorsByCup[cup.id][layer.key] = available[index % available.length].value;
  });
}

function bindEvents() {
  document.querySelectorAll("[data-action]").forEach(element => {
    element.addEventListener("click", handleAction);
  });

  document.querySelectorAll("[data-tab]").forEach(button => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;
      state.page = null;
      state.pageHistory = [];
      state.demoPanel = false;
      render();
    });
  });

  document.querySelectorAll("[data-demo-mode]").forEach(button => {
    button.addEventListener("click", () => {
      state.homeMode = button.dataset.demoMode;
      if (state.homeMode === "sent") {
        state.lastDrinkShared = canShareDrink();
        beginDrinkFeedback();
      }
      state.activeTab = "drink";
      state.demoPanel = false;
      state.selectorOpen = false;
      state.selectedIds = [...incomingIds];
      render();
    });
  });

  document.querySelectorAll("[data-person-select]").forEach(button => {
    button.addEventListener("click", () => toggleSelectedPerson(button.dataset.personSelect));
  });

  const liveFields = [
    ["#identity-name-input", "draftName", "confirm-identity"],
    ["#relation-note-input", "draftRelationNote", "finish-create-relation"],
    ["#invite-code-input", "draftInviteCode", "preview-invite"],
    ["#candidate-input", "draftCandidate", "submit-proposal"]
  ];
  liveFields.forEach(([selector, key, action]) => {
    const input = document.querySelector(selector);
    if (!input) return;
    input.addEventListener("input", () => {
      state[key] = input.value;
      if (key === "draftName") {
        document.querySelectorAll(".identity-preview .cup-name-overlay").forEach(label => {
          label.textContent = input.value || "你的名字";
        });
      }
      const submit = document.querySelector(`[data-action="${action}"]`);
      if (submit) submit.disabled = !input.value.trim();
    });
  });

  const loginEmailInput = document.querySelector("#login-email-input");
  loginEmailInput?.addEventListener("input", () => {
    state.authEmail = loginEmailInput.value.trim().toLowerCase().slice(0, 254);
    state.authError = "";
    const send = document.querySelector('[data-action="send-login-code"]');
    if (send) send.disabled = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(state.authEmail)
      || Boolean(state.authBusy)
      || state.authCooldownUntil > Date.now();
  });

  const loginCodeInput = document.querySelector("#login-code-input");
  loginCodeInput?.addEventListener("input", () => {
    state.authCode = loginCodeInput.value.replace(/\D/g, "").slice(0, 6);
    loginCodeInput.value = state.authCode;
    state.authError = "";
    const verify = document.querySelector('[data-action="verify-login-code"]');
    if (verify) verify.disabled = state.authCode.length !== 6 || Boolean(state.authBusy);
  });

  const understood = document.querySelector("#delete-understood");
  understood?.addEventListener("change", () => {
    const submit = document.querySelector('[data-action="finish-delete"]');
    if (submit) submit.disabled = !understood.checked;
  });

  bindFollowHold();
}

function bindFollowHold() {
  const button = document.querySelector("[data-hold-follow]");
  if (!button || button.disabled) return;

  let holdTimer;
  let longPressFired = false;

  const clearHold = () => clearTimeout(holdTimer);
  button.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    longPressFired = false;
    button.classList.add("is-pressing");
    holdTimer = setTimeout(() => {
      longPressFired = true;
      navigator.vibrate?.(12);
      openSelector();
    }, 480);
  });
  button.addEventListener("pointerup", () => {
    clearHold();
    button.classList.remove("is-pressing");
    if (!longPressFired) confirmFollow();
  });
  button.addEventListener("pointercancel", clearHold);
  button.addEventListener("pointerleave", () => {
    clearHold();
    button.classList.remove("is-pressing");
  });
  button.addEventListener("contextmenu", event => {
    event.preventDefault();
    openSelector();
  });
  button.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    confirmFollow();
  });
}

async function handleAction(event) {
  const action = event.currentTarget.dataset.action;
  if (state.page === "login") {
    const emailInput = document.querySelector("#login-email-input");
    const codeInput = document.querySelector("#login-code-input");
    if (emailInput) state.authEmail = emailInput.value.trim().toLowerCase().slice(0, 254);
    if (codeInput) state.authCode = codeInput.value.replace(/\D/g, "").slice(0, 6);
  }
  if (state.page === "member-detail" && state.memberEditDraft) {
    const memberNoteInput = document.querySelector("#member-note-input");
    if (memberNoteInput) state.memberEditDraft.note = memberNoteInput.value;
  }
  if (action === "toggle-demo") state.demoPanel = !state.demoPanel;
  else if (action === "close-demo") state.demoPanel = false;
  else if (action === "back") goBack();
  else if (action === "start-entry-demo") {
    state.pageHistory = [];
    state.page = "login";
    state.demoPanel = false;
  }
  else if (action === "send-login-code") {
    await sendLoginCode();
    return;
  }
  else if (action === "verify-login-code") {
    await verifyLoginCode();
    return;
  }
  else if (action === "login-existing") {
    state.relations = demoRelations();
    state.selectedRelationId = "dorm";
    enterHome();
    showToast(`欢迎回来，${people.me.name}`);
  }
  else if (action === "login-register") {
    state.relations = [];
    state.selectedRelationId = null;
    state.draftRelationNote = "";
    state.lastDrinkShared = false;
    state.homeMode = "calm";
    state.selectorOpen = false;
    navigateTo("entry");
  }
  else if (action === "entry-create") {
    state.entryIntent = "create";
    navigateTo("identity-setup");
  }
  else if (action === "entry-join") {
    state.entryIntent = "join";
    navigateTo("identity-setup");
  }
  else if (action === "entry-current") {
    state.relations = demoRelations();
    state.selectedRelationId = "dorm";
    enterHome();
  }
  else if (action === "edit-cup") openCupEditor();
  else if (action === "save-cup") {
    if (state.page !== "identity-edit" || !state.cupEditDraft) return;
    const editor = state.cupEditDraft;
    people.me.cupId = editor.selectedCupId;
    people.me.colors = { ...editor.identityColorsByCup[editor.selectedCupId] };
    state.identityColorsByCup[people.me.cupId] = { ...people.me.colors };
    if (cloudDataAvailable) {
      try { await saveProfileRemote(); }
      catch (error) { showToast(error.message || "杯子暂时没有同步"); }
    }
    closeCupEditor();
    showToast("杯子已更新");
  }
  else if (action === "confirm-identity") {
    if (state.page !== "identity-setup") return;
    const name = state.draftName.trim();
    if (name) people.me.name = name;
    people.me.cupId = state.selectedCupId;
    people.me.colors = { ...state.identityColorsByCup[state.selectedCupId] };
    if (cloudDataAvailable) {
      try { await saveProfileRemote(); }
      catch (error) {
        showToast(error.message || "身份暂时没有保存");
        render();
        return;
      }
    }
    if (authAccount) saveAuthSession(authToken, authAccount, false);
    navigateTo("activation-install");
  }
  else if (action === "select-cup") selectCup(event.currentTarget.dataset.cupSelect);
  else if (action === "previous-cup") cycleCup(-1);
  else if (action === "next-cup") cycleCup(1);
  else if (action === "select-region") cupEditorState().selectedCupRegion = event.currentTarget.dataset.regionSelect;
  else if (action === "apply-color") {
    const editor = cupEditorState();
    editor.identityColorsByCup[editor.selectedCupId][editor.selectedCupRegion] = event.currentTarget.dataset.colorSelect;
  }
  else if (action === "randomize-cup") randomizeCupColors();
  else if (action === "activation-installed") {
    state.installState = "installed";
    navigateTo("activation-notification");
  }
  else if (action === "activation-browser") {
    state.installState = "browser";
    navigateTo("activation-notification");
  }
  else if (action === "activation-allow") {
    const enabled = await enablePushNotifications();
    if (!enabled) return;
    startServerSync();
    navigateTo(state.entryIntent === "join" ? "join-relation" : "create-relation");
  }
  else if (action === "activation-later") {
    state.notifications.drink = false;
    state.notifications.response = false;
    state.notifications.relation = false;
    startServerSync();
    navigateTo(state.entryIntent === "join" ? "join-relation" : "create-relation");
  }
  else if (action === "return-home") {
    acknowledgeDisplayedResponse();
    state.page = null;
    state.pageHistory = [];
    state.activeTab = "drink";
    state.homeMode = "calm";
    state.selectorOpen = false;
    state.demoPanel = false;
  }
  else if (action === "drink") {
    // Merge accidental taps during the brief feedback, not later drinking rounds.
    if (state.drinkFeedbackActive) return;
    if (state.homeMode === "responded") acknowledgeDisplayedResponse();
    state.activeTab = "drink";
    state.lastDrinkShared = canShareDrink();
    state.homeMode = "sent";
    state.selectorOpen = false;
    state.demoPanel = false;
    beginDrinkFeedback();
    if (cloudDataAvailable) {
      try {
        const result = await appRequest("sendDrink");
        state.lastDrinkShared = result.shared === true;
      } catch (error) {
        state.lastDrinkShared = false;
        showToast(error.message || "这一口暂时没有发出去");
      }
    }
  }
  else if (action === "close-selector") {
    state.selectorOpen = false;
    state.selectedIds = [...incomingIds];
  }
  else if (action === "create-relation") {
    state.draftRelationNote = "";
    navigateTo("create-relation");
  }
  else if (action === "join-relation") navigateTo("join-relation");
  else if (action === "open-relation" || action === "open-waiting-member") {
    const relation = state.relations.find(item => item.id === event.currentTarget.dataset.relationId);
    if (!relation) return;
    state.selectedRelationId = relation.id;
    navigateTo(relation.status === "pending" ? "waiting-member" : "relation-detail");
  }
  else if (action === "open-proposal-confirm") {
    state.selectedRelationId = "dorm";
    navigateTo("proposal-confirm");
  }
  else if (action === "finish-create-relation") {
    const note = state.draftRelationNote.trim();
    if (!note || state.page !== "create-relation") return;
    if (cloudDataAvailable) {
      try {
        const result = await appRequest("createRelation", { note });
        applyServerState(result);
        state.selectedRelationId = result.relationId;
      } catch (error) {
        showToast(error.message || "邀请暂时没有创建");
        render();
        return;
      }
    } else {
      const number = state.nextInvitationNumber++;
      const id = `invitation-${number}`;
      state.relations.push({ id, note, status: "pending", memberIds: ["me"], inviteCode: `G${String(number).padStart(4, "0")}`, receive: true, send: true });
      state.selectedRelationId = id;
    }
    replacePage("waiting-member");
  }
  else if (action === "complete-invitation") enterHome();
  else if (action === "simulate-invitation-accepted") {
    const relation = state.relations.find(item => item.id === event.currentTarget.dataset.relationId);
    if (!relation || relation.status !== "pending") return;
    relation.status = "active";
    relation.memberIds = ["me", "ming"];
    state.selectedRelationId = relation.id;
    state.page = null;
    state.pageHistory = [];
    state.demoPanel = false;
    state.activeTab = "connect";
    showToast("演示：小明已加入");
  }
  else if (action === "preview-invite") {
    if (cloudDataAvailable) await previewInviteRemote();
    else {
      const isOwnInvite = state.relations.some(relation => relation.inviteCode === state.draftInviteCode.trim().toUpperCase());
      if (isOwnInvite) showToast("这是你自己的邀请，发给朋友就好");
      else navigateTo("invite-preview");
    }
  }
  else if (action === "simulate-invalid-code") showToast("这个邀请码不可用");
  else if (action === "accept-invite") {
    if (cloudDataAvailable) {
      try {
        await acceptInviteRemote();
        showToast("已加入");
      } catch (error) {
        showToast(error.message || "暂时没有加入");
      }
    } else {
      let relation = state.relations.find(item => item.id === "inbound-demo");
      if (!relation) {
        relation = { id: "inbound-demo", note: "小明、小红", status: "active", memberIds: ["me", "ming", "hong"], receive: true, send: true };
        state.relations.push(relation);
      }
      state.selectedRelationId = relation.id;
      state.page = null;
      state.pageHistory = [];
      state.activeTab = "connect";
      showToast("已加入");
    }
  }
  else if (action === "decline-invite") {
    goBack();
    showToast("已婉拒邀请");
  }
  else if (action === "copy-invite") copyDemoInvitation();
  else if (action === "edit-relation-note") navigateTo("edit-relation-note");
  else if (action === "save-relation-note") {
    const input = document.querySelector("#edit-relation-note-input");
    const relation = currentRelation();
    if (input?.value.trim() && relation) relation.note = input.value.trim();
    if (cloudDataAvailable) {
      try { await updateCurrentRelationRemote(); }
      catch (error) { showToast(error.message || "备注暂时没有同步"); }
    }
    goBack();
    showToast("备注已保存，仅自己可见");
  }
  else if (action === "cancel-waiting-relation") {
    const relation = currentRelation();
    if (!relation || relation.status !== "pending") return;
    if (cloudDataAvailable) {
      try {
        const result = await appRequest("removeRelation", { relationId: relation.id });
        applyServerState(result);
      } catch (error) {
        showToast(error.message || "邀请暂时没有取消");
        render();
        return;
      }
    } else state.relations = state.relations.filter(item => item.id !== relation.id);
    state.selectedRelationId = null;
    state.page = null;
    state.pageHistory = [];
    state.activeTab = "connect";
    showToast("邀请已取消");
  }
  else if (action === "add-member") navigateTo("add-member");
  else if (action === "submit-proposal") replacePage("proposal-pending");
  else if (action === "simulate-proposal-ready") replacePage("invite-ready");
  else if (action === "withdraw-proposal") {
    returnToRelationDetail();
    showToast("已撤回，对方不会收到通知");
  }
  else if (action === "approve-proposal") {
    state.page = null;
    state.pageHistory = [];
    state.activeTab = "connect";
    showToast("已同意，等大家确认");
  }
  else if (action === "reject-proposal") {
    state.page = null;
    state.pageHistory = [];
    state.activeTab = "connect";
    showToast("邀请未通过，不会公开你的选择");
  }
  else if (action === "finish-invite-ready") returnToRelationDetail();
  else if (action === "open-member") {
    const memberId = event.currentTarget.dataset.memberId;
    if (!people[memberId] || memberId === "me") return;
    const settings = memberSettingsFor(memberId);
    state.selectedMemberId = memberId;
    state.memberEditDraft = { memberId, note: settings.note, receive: settings.receive, send: settings.send };
    navigateTo("member-detail");
  }
  else if (action === "toggle-relation-receive" && currentRelation()) {
    currentRelation().receive = !currentRelation().receive;
    if (cloudDataAvailable) {
      try { await updateCurrentRelationRemote(); }
      catch (error) { showToast(error.message || "设置暂时没有同步"); }
    }
  }
  else if (action === "toggle-relation-send" && currentRelation()) {
    currentRelation().send = !currentRelation().send;
    if (cloudDataAvailable) {
      try { await updateCurrentRelationRemote(); }
      catch (error) { showToast(error.message || "设置暂时没有同步"); }
    }
  }
  else if (action === "toggle-member-receive" && state.memberEditDraft) state.memberEditDraft.receive = !state.memberEditDraft.receive;
  else if (action === "toggle-member-send" && state.memberEditDraft) state.memberEditDraft.send = !state.memberEditDraft.send;
  else if (action === "save-member-settings") {
    const draft = state.memberEditDraft;
    if (!draft || draft.memberId !== state.selectedMemberId) return;
    state.memberSettings[draft.memberId] = {
      note: String(draft.note).trim().slice(0, 12),
      receive: draft.receive,
      send: draft.send
    };
    goBack();
    showToast("备注和信号设置已保存");
  }
  else if (action === "leave-relation") navigateTo("leave-relation");
  else if (action === "confirm-leave-relation") {
    if (cloudDataAvailable) {
      try {
        const result = await appRequest("removeRelation", { relationId: state.selectedRelationId });
        applyServerState(result);
      } catch (error) {
        showToast(error.message || "暂时没有退出");
        render();
        return;
      }
    } else state.relations = state.relations.filter(relation => relation.id !== state.selectedRelationId);
    state.selectedRelationId = null;
    state.page = null;
    state.pageHistory = [];
    state.activeTab = "connect";
    showToast("已退出这段关系");
  }
  else if (action === "install") navigateTo("install-guide");
  else if (action === "notifications") {
    navigateTo("notification-settings");
    refreshPushState({ syncExisting: true }).then(() => render());
  }
  else if (action === "data-note") navigateTo("data-info");
  else if (action === "sign-out") {
    await signOutAccount();
    return;
  }
  else if (action === "simulate-installed") {
    state.installState = "installed";
    showToast("已模拟安装完成");
  }
  else if (action === "enable-system-notifications") {
    await enablePushNotifications();
    return;
  }
  else if (action === "disable-system-notifications") {
    pushState.busy = true;
    render();
    await disablePushNotifications();
    pushState.busy = false;
    showToast("这台设备的通知已关闭");
    render();
    return;
  }
  else if (["toggle-notification-drink", "toggle-notification-response", "toggle-notification-relation"].includes(action)) {
    const key = action.replace("toggle-notification-", "");
    state.notifications[key] = !state.notifications[key];
    persistAppData();
    render();
    try { await syncPushPreferences(); }
    catch (error) { showToast(error.message || "通知偏好暂时没有保存"); }
    render();
    return;
  }
  else if (action === "delete-account") navigateTo("delete-intro");
  else if (action === "continue-delete") navigateTo("delete-confirm");
  else if (action === "continue-delete-final") navigateTo("delete-final");
  else if (action === "finish-delete") {
    if (cloudDataAvailable) {
      try { await appRequest("deleteAccount"); }
      catch (error) {
        showToast(error.message || "账户暂时没有注销");
        render();
        return;
      }
      await disablePushNotifications({ removeFromServer: false });
      clearAuthSession();
      clearInterval(serverSyncTimer);
      serverSyncTimer = undefined;
    }
    state.relations = [];
    state.selectedRelationId = null;
    replacePage("delete-complete");
  }
  else if (action === "restart-demo") {
    state.page = "login";
    state.pageHistory = [];
    state.homeMode = "calm";
    showToast("演示已重置");
  }
  if (persistenceActions.has(action)) persistAppData();
  render();
}

function navigateTo(page) {
  state.pageHistory.push(state.page);
  state.page = page;
  state.demoPanel = false;
}

function replacePage(page) {
  state.page = page;
  state.demoPanel = false;
}

function returnToRelationDetail() {
  if (state.pageHistory.at(-1) === "relation-detail") state.pageHistory.pop();
  state.page = "relation-detail";
  state.demoPanel = false;
}

function goBack() {
  if (state.page === "identity-edit") {
    closeCupEditor();
    return;
  }
  if (state.page === "member-detail") {
    state.memberEditDraft = null;
    state.selectedMemberId = null;
  }
  state.page = state.pageHistory.length ? state.pageHistory.pop() : null;
  state.demoPanel = false;
}

function openSelector() {
  if (state.selectorOpen) return;
  state.selectorOpen = true;
  state.selectedIds = [...availableIncomingIds()];
  render();
  showToast("选好，再点「跟一口」");
}

function toggleSelectedPerson(id) {
  state.selectedIds = state.selectedIds.includes(id)
    ? state.selectedIds.filter(selectedId => selectedId !== id)
    : [...state.selectedIds, id];
  render();
}

async function confirmFollow() {
  const availableIds = availableIncomingIds();
  const ids = state.selectorOpen ? state.selectedIds.filter(id => availableIds.includes(id)) : availableIds;
  if (!ids.length) return;
  state.followedIds = ids;
  state.homeMode = "followed";
  state.selectorOpen = false;
  render();
  if (cloudDataAvailable) {
    try {
      const result = await appRequest("respondDrink", { senderIds: ids });
      applyServerState(result);
      state.followedIds = ids;
      state.homeMode = "followed";
      render();
    } catch (error) {
      showToast(error.message || "这一口暂时没有回应出去");
      return;
    }
  }
  showToast("已跟一口");
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

const figmaBoard = document.querySelector("#figma-board");
const hasStoredAuthSession = restoreAuthSession();
if (hasStoredAuthSession) {
  const restoredAccountData = !authNeedsOnboarding && restorePersistentData();
  if (!restoredAccountData) {
    resetAccountData();
    authNeedsOnboarding = true;
    saveAuthSession(authToken, authAccount, true);
    state.page = "entry";
    state.pageHistory = [];
  }
} else {
  restorePersistentData();
  if (!figmaBoard && typeof localStorage !== "undefined") {
    state.page = "login";
    state.pageHistory = [];
  }
}
if (figmaBoard) renderFigmaBoard();
else {
  render();
  validateAuthSession({ discoverCookie: !hasStoredAuthSession });
}

document.addEventListener?.("visibilitychange", syncBubbleMotion);
if (typeof navigator !== "undefined") {
  navigator.serviceWorker?.addEventListener("message", event => handleForegroundPush(event.data));
}
document.addEventListener?.("visibilitychange", async () => {
  if (document.hidden || !authAccount || !cloudDataAvailable) return;
  try {
    await syncServerState({ chooseHomeMode: true });
    render();
  } catch {
    // Keep cached UI visible until the next successful sync.
  }
});
if (typeof matchMedia === "function") {
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", syncBubbleMotion);
}
syncBubbleMotion();
