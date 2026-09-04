const baseUrl = "http://127.0.0.1:4173";

const [pageResponse, scriptResponse, workerResponse, stylesResponse, manifestResponse, fontResponse, cupAssetResponse, navAssetResponse, appIconResponse, appleIconResponse] = await Promise.all([
  fetch(`${baseUrl}/`),
  fetch(`${baseUrl}/client.js`),
  fetch(`${baseUrl}/sw.js`),
  fetch(`${baseUrl}/styles.css`),
  fetch(`${baseUrl}/manifest.webmanifest`),
  fetch(`${baseUrl}/assets/fonts/MaokenAssortedSans.ttf`),
  fetch(`${baseUrl}/assets/cups/cup-01-body.png`),
  fetch(`${baseUrl}/assets/nav/drink.png`),
  fetch(`${baseUrl}/assets/app-icons/app-icon-512.png`),
  fetch(`${baseUrl}/assets/app-icons/apple-touch-icon.png`)
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(pageResponse.ok, `首页加载失败：${pageResponse.status}`);
assert(scriptResponse.ok, `交互脚本加载失败：${scriptResponse.status}`);
assert(workerResponse.ok, `通知服务脚本加载失败：${workerResponse.status}`);
assert(stylesResponse.ok, `样式加载失败：${stylesResponse.status}`);
assert(manifestResponse.ok, `应用清单加载失败：${manifestResponse.status}`);
assert(fontResponse.ok, `猫啃什锦黑加载失败：${fontResponse.status}`);
assert(fontResponse.headers.get("content-type")?.includes("font/ttf"), "字体 MIME 类型不正确");
assert(cupAssetResponse.ok && cupAssetResponse.headers.get("content-type")?.includes("image/png"), "杯型分层素材加载失败");
assert(navAssetResponse.ok && navAssetResponse.headers.get("content-type")?.includes("image/png"), "底部导航素材加载失败");
assert(appIconResponse.ok && appIconResponse.headers.get("content-type")?.includes("image/png"), "App 安装图标加载失败");
assert(appleIconResponse.ok && appleIconResponse.headers.get("content-type")?.includes("image/png"), "Apple 桌面图标加载失败");

const [html, script, worker, styles, manifestText] = await Promise.all([
  pageResponse.text(),
  scriptResponse.text(),
  workerResponse.text(),
  stylesResponse.text(),
  manifestResponse.text()
]);

assert(html.includes('id="app"'), "页面缺少应用入口");
assert(html.includes('rel="apple-touch-icon"') && html.includes('favicon-32.png'), "网页缺少 App 图标声明");
assert(html.includes('apple-mobile-web-app-status-bar-style') && html.includes('black-translucent'), "iPhone 沉浸式状态栏配置缺失");
const manifest = JSON.parse(manifestText);
assert(manifest.icons?.some(icon => icon.sizes === "192x192") && manifest.icons?.some(icon => icon.sizes === "512x512" && icon.purpose === "maskable"), "应用清单缺少标准与可裁切图标");
assert(script.includes("data-hold-follow"), "长按“跟一口”入口缺失");
assert(script.includes("incoming-strip"), "待回应滑动条缺失");
assert(script.includes("我喝了") && script.includes("跟一口"), "两种核心信号缺失");
assert(script.includes('label: "喝"') && script.includes('label: "碰"') && script.includes('label: "杯"'), "底部分区缺失");
assert(styles.includes("bubble-field-arrive") && styles.includes("bubble-drift") && script.includes('attributeName="d"'), "气泡入场与持续晃动反馈缺失");
assert(script.includes("syncBubbleMotion") && styles.includes("prefers-reduced-motion"), "气泡减少动态效果适配缺失");
assert(styles.includes("calm-cup-idle") && styles.includes("calm-shadow-breathe"), "首页杯子的轻微持续动效缺失");
assert(styles.includes("sent-cup-idle") && styles.includes(".hero-cup--sending .cup-art"), "喝过了页面的主体杯持续动效缺失");
assert(styles.includes("clink-cup-idle") && styles.includes("clink-blob-breathe") && styles.includes("ray-afterglow"), "朋友回应后的持续动效缺失");
assert(script.includes("--idle-duration") && script.includes("--idle-delay"), "多杯待机动效没有错开节奏");
assert(styles.includes("Maoken Assorted Sans"), "猫啃什锦黑没有接入页面");
assert(script.includes('"relation-detail"') && script.includes('"member-detail"'), "关系与成员详情流程缺失");
assert(script.includes('"proposal-confirm"') && script.includes('"invite-ready"'), "新增成员确认流程缺失");
assert(script.includes('"notification-settings"') && script.includes('"delete-final"'), "设置与注销流程缺失");
assert(script.includes('"entry"') && script.includes('"activation-notification"'), "首次进入、身份与通知引导流程缺失");
assert(script.includes('data-action="entry-create"') && script.includes('data-action="entry-join"'), "首次进入的双入口缺失");
assert(script.includes("cup-object--real") && script.includes("cup-layer"), "真实杯型分层素材没有接入");
assert(script.includes("data-region-select") && script.includes("随机配色"), "杯子分区配色流程缺失");
assert(script.includes('"login"') && script.includes("send-login-code") && script.includes("verify-login-code"), "邮箱验证码登录入口缺失");
assert(script.includes("restoreAuthSession") && script.includes("validateAuthSession"), "登录状态恢复与校验缺失");
assert(script.includes("pushManager.subscribe") && script.includes("/api/push-subscription"), "系统推送订阅流程缺失");
assert(script.includes("handleForegroundPush") && script.includes('message.category === "drink"'), "前台收到推送后没有立即进入待回应状态");
assert(script.includes("serverSyncIntervalMs = 5_000") && script.includes('window.addEventListener?.("focus"'), "前台状态同步仍然不够及时");
assert(script.includes('data-action="return-home"') && script.includes("acknowledgeDisplayedResponse"), "回应页缺少主动回到首页并确认已读的操作");
assert(worker.includes("postMessage") && worker.includes("genyikou-push"), "Service Worker 没有把推送即时通知给已打开的页面");
assert(script.includes("nav-sketch-icon"), "底部手绘图标没有接入");
assert(styles.includes("#55d8ff") && styles.includes("#4fe1ce"), "清透色卡没有接入页面");
assert(styles.includes("--safe-top") && styles.includes("safe-area-inset-top") && styles.includes("height: 100dvh") && !styles.includes("min-height: 610px"), "移动端全屏高度与安全区适配缺失");
assert(!script.includes("stats-grid") && !script.includes("history-card"), "Demo 中不应出现饮水统计或历史压力");

const functionIcons = ["back", "next", "create", "join", "edit", "bell", "install", "copy", "close", "leave", "delete", "check", "email", "data"];
await Promise.all(functionIcons.map(async name => {
  const response = await fetch(`${baseUrl}/assets/icons/${name}.png`);
  assert(response.ok && response.headers.get("content-type")?.includes("image/png"), `功能图标加载失败：${name}`);
}));
assert(script.includes('class="cup-art"') && styles.includes("100cqh"), "杯子与姓名没有共享等比例画布");
assert(script.includes("sketchIconAssets") && styles.includes(".ui-sketch-icon"), "功能手绘图标没有接入");
assert(styles.includes("drop-shadow(0 -.8px 0 #1f3540)"), "手绘小图标线条没有统一加深");
assert(styles.includes(".screen-content:has(> .flow-page)") && styles.includes(".screen-content:has(> .subpage)") && styles.includes("margin-block: auto"), "内容较少的内页应居中，长页面保持可滚动");
assert(/\.danger-link \.ui-sketch-icon--leave\s*\{[^}]*width:\s*36px;[^}]*height:\s*36px;/.test(styles), "退出关系的 bye 图标应使用独立的大尺寸");

console.log("PASS 页面资源与核心交互结构检查");
