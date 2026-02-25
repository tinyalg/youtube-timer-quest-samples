// MARK: part
// 監視対象リスト（初期値）
let targetDomains = ["youtube.com"];

// 起動時にリストを読み込む
chrome.storage.local.get(["targetDomains"], (result) => {
  if (result.targetDomains) {
    targetDomains = result.targetDomains;
  }
});

// 設定が変更されたら、リアルタイムでリストを更新する
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.targetDomains) {
    targetDomains = changes.targetDomains.newValue;
    console.log("監視リストが更新されました:", targetDomains);
  }
});

// MARK: onStartup
// ブラウザが起動した時に実行される
chrome.runtime.onStartup.addListener(() => {
  console.log("Browser Started");
});
// /MARK: onStartup

// MARK: onActivated
// タブを切り替えた時に実行される
chrome.tabs.onActivated.addListener(() => {
  console.log("Tab Switched");
});
// /MARK: onActivated

// 以前のリスナー（onStartupなど）はそのまま...

// 1秒ごとのループ
setInterval(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    
    // permissions: ["tabs"] があるので、どんなサイトでも url が取れる
    if (!currentTab || !currentTab.url) return;

    // ★ここが変わった！: リスト内のドメインが含まれているかチェック
    // Array.some() は「どれか一つでも条件を満たせば true」を返す便利なメソッド
    const isTarget = targetDomains.some(domain => currentTab.url.includes(domain));

    if (isTarget) {
      updateTime();
    }
  });
}, 1000);

// updateTime関数などは変更なし
// /MARK: part

// 時間を保存する関数
function updateTime() {
  // 1. 今日の日付を取得 (例: "2023-10-27")
  const today = new Date().toISOString().split('T')[0];

  // 2. Storageから今日のデータを取得
  chrome.storage.local.get([today], (result) => {
    let currentSeconds = result[today] || 0; // データがなければ0

    // 3. 1秒増やす
    currentSeconds++;

    // 4. Storageに保存し直す
    chrome.storage.local.set({ [today]: currentSeconds });
      
    // 5. バッジを更新
    chrome.action.setBadgeText({ text: String(currentSeconds) + "s" });
    chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
  });
}
