// MARK: full
// 視聴時間を記録する変数（秒）
let seconds = 0;

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

// 1秒（1000ミリ秒）ごとに実行するメインループ
setInterval(() => {
  
  // 今、アクティブなタブ（見ているタブ）をチェックする
  // (manifest.jsonで許可したYouTubeのタブだけが取得できる)
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    
    // タブが一つもない、またはYouTube以外（URLが取得できない）場合は何もしない
    const currentTab = tabs[0];
    if (!currentTab || !currentTab.url) {
        return;
    }

    // URLに "youtube.com" が含まれているかチェック
    if (currentTab.url.includes("youtube.com")) {
      
      // 含まれていたらカウントアップ！
      seconds++;
      
      // アイコンにバッジ（数字）を表示
      chrome.action.setBadgeText({ text: String(seconds) + "s" });
      chrome.action.setBadgeBackgroundColor({ color: "#FF0000" }); // 赤色
      
    }
  });

}, 1000);
// /MARK: full
