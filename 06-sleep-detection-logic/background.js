// 監視対象リスト（初期値）
let targetDomains = ["youtube.com"];
// 累積時間（ミリ秒単位で管理するようになります）
let accumulatedMs = 0;
// 前回チェックした時刻（初期値はnull）
let lastTick = null;
// 今日の日付文字列
let todayStr = new Date().toISOString().split('T')[0];

// MARK: part
// ... (変数定義などはそのまま)

// ★追加: 許容する最大のズレ（5秒 = 5000ミリ秒）
// これを「しきい値（Threshold）」と呼ぶ
const MAX_ALLOWED_GAP = 5000;

// MARK: listeners
// --- 初期化処理 ---

// 設定とデータを読み込む
chrome.storage.local.get(["targetDomains", todayStr], (result) => {
  if (result.targetDomains) {
    targetDomains = result.targetDomains;
  }
  // 保存されていた秒数をミリ秒に戻してセット
  if (result[todayStr]) {
    accumulatedMs = result[todayStr] * 1000;
  }
});

// 設定が変更されたら、リアルタイムでリストを更新する
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.targetDomains) {
    targetDomains = changes.targetDomains.newValue;
    console.log("監視リストが更新されました:", targetDomains);
  }
});

// ブラウザが起動した時に実行される
chrome.runtime.onStartup.addListener(() => {
  console.log("Browser Started");
});

// タブを切り替えた時に実行される
chrome.tabs.onActivated.addListener(() => {
  console.log("Tab Switched");
});
// /MARK: listeners

setInterval(() => {
  const now = Date.now();

  // 初回ガード
  if (lastTick === null) {
    lastTick = now;
    return;
  }

  const deltaTime = now - lastTick;
  lastTick = now; // 次回のために更新

  // ★ここが新機能: スリープ検知ガード
  // 経過時間が 5秒 を超えていたら、異常値とみなして無視する
  if (deltaTime > MAX_ALLOWED_GAP) {
    console.log(`Sleep detected! Ignored ${deltaTime}ms jump.`);
    // ここで return することで、accumulatedMs への加算を防ぐ
    return; 
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // ... (以下、変更なし)
    // 監視対象なら accumulatedMs += deltaTime;
    // MARK: query
    // タブが一つもない、またはURLが取得できない場合は何もしない
    const currentTab = tabs[0];
    if (!currentTab || !currentTab.url) {
        return;
    }

    // リスト内のドメインが含まれているかチェック
    // Array.some() は「どれか一つでも条件を満たせば true」
    const isTarget = targetDomains.some(domain => currentTab.url.includes(domain));

    if (isTarget) {
      // 単に +1 するのではなく、経過時間(ms)を足し込む
      accumulatedMs += deltaTime;

      // 保存と表示を行う
      updateStorageAndBadge();
    }
    // /MARK: query
  });

}, 1000);
// /MARK: part

// --- 保存と表示の関数 ---

function updateStorageAndBadge() {
  // 日付が変わったかチェック
  const currentTodayStr = new Date().toISOString().split('T')[0];
  if (currentTodayStr !== todayStr) {
    // 日付が変わったらリセット
    todayStr = currentTodayStr;
    accumulatedMs = 0;
  }

  // ミリ秒 -> 秒 に変換 (切り捨て)
  const seconds = Math.floor(accumulatedMs / 1000);
      
  // 1. バッジ更新
  chrome.action.setBadgeText({ text: String(seconds) + "s" });
  chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });

  // 2. Storage保存 (頻繁な書き込みを避けるため、秒が変わった時だけでも良いが、今回は毎回保存)
  // ※実運用では数秒に1回にするなどの最適化も考えられます
  chrome.storage.local.set({ [todayStr]: seconds });
}
