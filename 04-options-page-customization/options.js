document.addEventListener("DOMContentLoaded", () => {
  // 画面が読み込まれたら、保存されたリストを表示する
  loadSites();
  document.getElementById("add-btn").addEventListener("click", addSite);
});

// 1. 保存されているリストを表示（Read）
function loadSites() {
  chrome.storage.local.get(["targetDomains"], (result) => {
    // データがなければデフォルトでYouTubeを入れる
    const domains = result.targetDomains || ["youtube.com"];
    
    const list = document.getElementById("site-list");
    list.innerHTML = ""; // 描画前に一旦クリア

    domains.forEach((domain) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${domain}</span>
        <button class="delete-btn" data-domain="${domain}">削除</button>
      `;
      list.appendChild(li);
    });

    // 削除ボタンにイベントを設定
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", deleteSite);
    });
  });
}

// 2. 新しいサイトを追加（Create/Update）
function addSite() {
  const input = document.getElementById("site-input");
  const newDomain = input.value.trim();

  if (!newDomain) return;

  chrome.storage.local.get(["targetDomains"], (result) => {
    const domains = result.targetDomains || ["youtube.com"];
    
    // 重複チェック（既にあったら追加しない）
    if (!domains.includes(newDomain)) {
      domains.push(newDomain);
      
      // 保存完了後にリストを再描画
      chrome.storage.local.set({ targetDomains: domains }, () => {
        input.value = ""; // 入力欄を空に
        loadSites();
      });
    }
  });
}

// 3. サイトを削除（Delete）
function deleteSite(e) {
  const targetDomain = e.target.getAttribute("data-domain");
  
  chrome.storage.local.get(["targetDomains"], (result) => {
    let domains = result.targetDomains || [];
    
    // 削除対象以外を残す（フィルタリング）
    domains = domains.filter(d => d !== targetDomain);
    
    chrome.storage.local.set({ targetDomains: domains }, () => {
      loadSites();
    });
  });
}
