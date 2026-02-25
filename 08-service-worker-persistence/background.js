// 監視対象リスト（初期値）
let targetDomains = ["youtube.com"];
// 累積時間（ミリ秒単位で管理するようになります）
let accumulatedMs = 0;
// 前回チェックした時刻（初期値はnull）
let lastTick = null;
// 今日の日付文字列
let todayStr = new Date().toISOString().split('T')[0];

// MARK: allowedGap
// 変更前
// const MAX_ALLOWED_GAP = 5000;

// 変更後: しきい値を「2分」に設定
// 理由: アラーム間隔(1分) + 再起動のラグを考慮しても、2分以上空くことは通常ない。
// 逆に2分以上空いたら、それは本当にPCがスリープしていたと判断する。
const MAX_ALLOWED_GAP = 2 * 60 * 1000; // 2分

// MARK: allowedGapE1
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
// /MARK: allowedGapE1
// MARK: part
// ... (変数定義などはそのまま)

// ==========================================
// Service Worker Keep Alive (寿命対策)
// ==========================================

const ALARM_NAME = "keepAlive";

// アラームを作成する関数
const createAlarm = () => {
  chrome.alarms.get(ALARM_NAME, (alarm) => {
    if (!alarm) {
      // 1分ごとにイベントを発火させる (これが設定できる最短間隔)
      chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
    }
  });
};

// 拡張機能がインストール/起動された時にアラームをセット
chrome.runtime.onInstalled.addListener(createAlarm);
chrome.runtime.onStartup.addListener(createAlarm);

// アラームが鳴った時の処理
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    // ここで何か重い処理をする必要はない。
    // 「イベントリスナーが呼ばれた」という事実だけで、
    // Chromeは Service Worker の寿命を延長してくれる。
    console.log("Alarm fired: Stayin' Alive!");
  }
});

// ==========================================
// メインループ
// ==========================================

// ... (以下、setInterval コードへ) ...
// /MARK: part
// MARK: allowedGapE2
// 1秒（1000ミリ秒）ごとに実行するメインループ
setInterval(() => {
  // A. 現在時刻を取得
  const now = Date.now();

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
  // /MARK: allowedGapE2
  // ... (setInterval内の判定処理はそのまま) ...
  if (deltaTime > MAX_ALLOWED_GAP) {
    // console.log(`Sleep detected! Ignored ${deltaTime}ms jump.`);
    return; 
  }
  // /MARK: allowedGap

  // 1. 【聴覚判定】音が鳴っているタブがあるか？ (全ウィンドウ対象)
  // audible: true で「音が鳴っているタブ」だけを抽出
  chrome.tabs.query({ audible: true }, (audibleTabs) => {
    
    // 監視対象かチェックする
    const isAudible = audibleTabs.some(tab => 
      tab.url && targetDomains.some(domain => tab.url.includes(domain))
    );

    if (isAudible) {
      // 音が鳴っていれば、裏にいようが別アプリにいようがカウント！
      accumulatedMs += deltaTime;

      // 保存と表示を行う
      updateStorageAndBadge();
      return; // ここで終了（二重カウント防止）
    }

    // 2. 【視覚判定】音はない。じゃあ、ちゃんと目で見ているのか？
    
    // chrome.windows.getLastFocused: 「今、OSでフォーカスが当たっているウィンドウ」を取得
    chrome.windows.getLastFocused({ populate: true }, (window) => {
      
      // エラーハンドリング (DevTools操作時などの対策)
      if (chrome.runtime.lastError) {
        // エラー（ウィンドウが見つからない等）は無視して終了
        return;
      }

      // window.focused が false なら、ユーザーは別のアプリ(Excel等)を使っている
      if (!window || !window.focused) {
        return; // カウントしない（停止）
      }

      // ウィンドウはアクティブだ。では、その中のアクティブなタブは監視対象か？
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
