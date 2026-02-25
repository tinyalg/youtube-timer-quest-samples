document.addEventListener("DOMContentLoaded", () => {
  // 画面が読み込まれたら、保存されたリストを表示する
  loadSites();
  document.getElementById("add-btn").addEventListener("click", addSite);
});

// 1. 保存されているリストを表示
function loadSites() {
  chrome.storage.local.get(["targetDomains"], (result) => {
    const domains = result.targetDomains || ["youtube.com"]; // デフォルトはYouTube
    const list = document.getElementById("site-list");
    
    // リストをリセット
    list.innerHTML = "";

    domains.forEach((domain) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${domain}</span>
        <button class="delete-btn" data-domain="${domain}">削除</button>
      `;
      list.appendChild(li);
    });

    // 削除ボタンにイベントを設定
    // (非同期処理の中なので、ここで設定するのがポイント)
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", deleteSite);
    });
  });
} // ★ ← ここ！この閉じカッコを忘れるとエラーになります！

// 2. 新しいサイトを追加
function addSite() {
  const input = document.getElementById("site-input");
  const newDomain = input.value.trim();

  if (!newDomain) return;

  chrome.storage.local.get(["targetDomains"], (result) => {
    const domains = result.targetDomains || ["youtube.com"];
    
    // 重複していなければ追加
    if (!domains.includes(newDomain)) {
      domains.push(newDomain);
      chrome.storage.local.set({ targetDomains: domains }, () => {
        input.value = ""; // 入力欄を空にする
        loadSites(); // リストを再描画
      });
    }
  });
}

// 3. サイトを削除
function deleteSite(e) {
  const targetDomain = e.target.getAttribute("data-domain");
  
  chrome.storage.local.get(["targetDomains"], (result) => {
    let domains = result.targetDomains || [];
    // 削除対象以外を残す（フィルタリング）
    domains = domains.filter(d => d !== targetDomain);
    
    chrome.storage.local.set({ targetDomains: domains }, () => {
      loadSites(); // リストを再描画
    });
  });
}
