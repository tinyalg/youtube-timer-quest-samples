// 視聴時間を記録する変数（秒）
let seconds = 0;

// ブラウザが起動した時に実行される
chrome.runtime.onStartup.addListener(() => {
  console.log("Browser Started");
});

// タブを切り替えた時に実行される
chrome.tabs.onActivated.addListener(() => {
  console.log("Tab Switched");
});

// MARK: part
// 以前のリスナー（onStartupなど）はそのまま残す

// 1秒ごとのループ
setInterval(() => {
  
  // 今、アクティブなタブ（見ているタブ）をチェックする
  // (manifest.jsonで許可したYouTubeのタブだけが取得できる)
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    
    // タブが一つもない、またはYouTube以外（URLが取得できない）場合は何もしない
    const currentTab = tabs[0];
    if (!currentTab || !currentTab.url) return;

    // URLに "youtube.com" が含まれているかチェック
    if (currentTab.url.includes("youtube.com")) {
      updateTime(); // カウントアップ処理を関数に切り出した
    }
  });
}, 1000);

// 時間を保存する関数
function updateTime() {
  // 1. 今日の日付を取得 (例: "2023-10-27")
  const today = new Date().toISOString().split('T')[0];

  // 2. Storageから今日のデータを取得
  chrome.storage.local.get([today], (result) => {
    let currentSeconds = result[today] || 0; // データがなければ0からスタート

    // 3. 1秒増やす
    currentSeconds++;

    // 4. Storageに保存し直す
    chrome.storage.local.set({ [today]: currentSeconds });
      
    // 5. バッジを更新
    chrome.action.setBadgeText({ text: String(currentSeconds) + "s" });
    chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
  });
}
// /MARK: part
