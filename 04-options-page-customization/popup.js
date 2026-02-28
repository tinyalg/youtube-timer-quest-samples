document.addEventListener("DOMContentLoaded", () => {
  loadHistory();
  document.getElementById("download-btn").addEventListener("click", downloadCSV);
});

// 1. 履歴を表示する関数
function loadHistory() {
  chrome.storage.local.get(null, (items) => {
    const tbody = document.querySelector("#history-table tbody");
    
    // データ（キー:日付, 値:秒数）を日付順に並べ替え
    const sortedKeys = Object.keys(items).sort().reverse();

    // MARK: filter
    // どちらの関数も、この行の直後に挿入する
    sortedKeys.forEach((date) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    // /MARK: filter

      const seconds = items[date];
      
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${date}</td>
        <td>${seconds}s</td>
      `;
      tbody.appendChild(tr);
    });
  });
}

// 2. CSVダウンロードを実行する関数
function downloadCSV() {
  chrome.storage.local.get(null, (items) => {
    // CSVのヘッダー
    let csvContent = "Date,Seconds\n";

    // データをCSV形式の文字列にする
    const sortedKeys = Object.keys(items).sort().reverse();
    sortedKeys.forEach((date) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;

      csvContent += `${date},${items[date]}\n`;
    });

    // Blobオブジェクトを作成 (テキストデータをファイルのように扱う技術)
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    // 仮想のリンクを作ってクリックさせる
    const a = document.createElement("a");
    a.href = url;
    a.download = "youtube_history.csv";
    a.click();
  });
}
