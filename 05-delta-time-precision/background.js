// --- 変数定義 ---

// 監視対象リスト
let targetDomains = ["youtube.com"];
// 累積時間（ミリ秒単位で管理する）
let accumulatedMs = 0;
// 前回チェックした時刻（初期値はnull）
let lastTick = null;
// 今日の日付文字列
let todayStr = new Date().toISOString().split('T')[0];

// --- 初期化処理 ---

// 1. 設定とデータを読み込む
chrome.storage.local.get(["targetDomains", todayStr], (result) => {
  if (result.targetDomains) {
    targetDomains = result.targetDomains;
  }
  // 保存されていた秒数をミリ秒に戻してセット
  if (result[todayStr]) {
    accumulatedMs = result[todayStr] * 1000;
  }
});

// 2. 設定変更を監視
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.targetDomains) {
    targetDomains = changes.targetDomains.newValue;
    console.log("監視リストが更新されました:", targetDomains);
  }
});

// 3. ブラウザ起動時などのイベント
chrome.runtime.onStartup.addListener(() => {
  console.log("Browser Started");
});

// タブを切り替えた時に実行される
chrome.tabs.onActivated.addListener(() => {
  console.log("Tab Switched");
});

// --- メインループ (心臓部) ---

setInterval(() => {
  // A. 現在時刻を取得
  const now = Date.now();

  // B. 初回実行時（lastTickがnull）は、現在の時刻をセットするだけで終了
  // これにより、起動直後の不安定な時間を計測対象から外す
  if (lastTick === null) {
    lastTick = now;
    return;
  }

  // 前回からの経過時間 (Delta Time) を計算
  const deltaTime = now - lastTick;
  
  // C. lastTick を更新 (次回の計算のため)
  lastTick = now;

  // D. アクティブなタブをチェック
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    
    // タブが一つもない、またはURLが取得できない場合は何もしない
    const currentTab = tabs[0];
    if (!currentTab || !currentTab.url) return;

    // 監視対象のサイトを見ているか？
    const isTarget = targetDomains.some(domain => currentTab.url.includes(domain));

    if (isTarget) {
      // ★ここが変更点！
      // 単に +1 するのではなく、経過時間(ms)を足し込む
      accumulatedMs += deltaTime;

      // 保存と表示を行う
      updateStorageAndBadge();
    }
  });
}, 1000);


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

  // 2. Storage保存
  // ※本来は頻繁な書き込みを避けるべきだが、今回はシンプルさを優先して毎回保存する
  chrome.storage.local.set({ [todayStr]: seconds });
}
