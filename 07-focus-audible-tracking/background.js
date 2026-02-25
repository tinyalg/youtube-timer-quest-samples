// 監視対象リスト（初期値）
let targetDomains = ["youtube.com"];
// 累積時間（ミリ秒単位で管理するようになります）
let accumulatedMs = 0;
// 前回チェックした時刻（初期値はnull）
let lastTick = null;
// 今日の日付文字列
let todayStr = new Date().toISOString().split('T')[0];

// ★追加: 許容する最大のズレ（5秒 = 5000ミリ秒）
const MAX_ALLOWED_GAP = 5000;

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


// MARK: outer
// ... (前章までの変数定義、スリープ対策などはそのまま) ...

setInterval(() => {
  const now = Date.now();
  // MARK: inner
  // B. 初回実行時（lastTickがnull）は、現在の時刻をセットするだけで終了
  // これにより、起動直後の不安定な時間を計測対象から外します
  if (lastTick === null) {
    lastTick = now;
    return;
  }

  // 前回からの経過時間 (Delta Time) を計算
  const deltaTime = now - lastTick;
  
  // C. lastTick を更新 (次回の計算のため)
  lastTick = now;

  // スリープ検知ガード
  // 経過時間が 5秒 を超えていたら、スリープ復帰とみなして無視する
  if (deltaTime > MAX_ALLOWED_GAP) {
    console.log(`Sleep detected! Ignored ${deltaTime}ms jump.`);
    // ここで return することで、accumulatedMs への加算を防ぎます
    return; 
  }
  // /MARK: inner
  // ... (初回ガードやスリープガードはそのまま) ...

  // --- 新ロジック ---

  // 1. 【聴覚判定】音が鳴っているタブがあるか？ (全ウィンドウ対象)
  // audible: true で「音が鳴っているタブ」だけを抽出できる便利な機能だ
  chrome.tabs.query({ audible: true }, (audibleTabs) => {
    
    // その中に、監視対象(YouTubeなど)が含まれているかチェック
    const isTargetAudible = audibleTabs.some(tab => 
      tab.url && targetDomains.some(domain => tab.url.includes(domain))
    );

    if (isTargetAudible) {
      // 音が鳴っていれば、裏にいようが別アプリにいようがカウント！
      accumulatedMs += deltaTime;
      updateStorageAndBadge();
      return; // ここで終了（二重カウント防止）
    }

    // 2. 【視覚判定】音はない。じゃあ、ちゃんと目で見ているのか？
    
    // chrome.windows.getLastFocused: 「今、OSでフォーカスが当たっているウィンドウ」を取得
    chrome.windows.getLastFocused({ populate: true }, (window) => {
      
      // エラーハンドリング (DevTools操作時などの対策)
      if (chrome.runtime.lastError) {
        return; // エラー（ウィンドウが見つからない等）は無視して終了
      }

      // window.focused が false なら、ユーザーは別のアプリ(Excel等)を使っている
      if (!window || !window.focused) {
        return; // カウントしない（停止）
      }

      // ウィンドウはアクティブだ。では、その中のアクティブなタブを探す
      // populate: true にしたので、window.tabs の中にタブ情報が入っている
      const activeTab = window.tabs.find(t => t.active);
      if (!activeTab || !activeTab.url) return;

      // URLチェック
      const isTarget = targetDomains.some(domain => activeTab.url.includes(domain));
      if (isTarget) {
        accumulatedMs += deltaTime;
        updateStorageAndBadge();
      }
    });
  });

}, 1000);

// ... (updateStorageAndBadge 関数などはそのまま) ...
// /MARK: outer

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
