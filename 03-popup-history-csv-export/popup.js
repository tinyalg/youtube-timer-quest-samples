// MARK: full
document.addEventListener("DOMContentLoaded", () => {
  loadHistory();
  document.getElementById("download-btn").addEventListener("click", downloadCSV);
});

// 1. 履歴を表示する関数
function loadHistory() {
  chrome.storage.local.get(null, (items) => {
    const tbody = document.querySelector("#history-table tbody");
    
    // データ（キー:日付, 値:秒数）を日付の新しい順に並べ替え（ソート）
    const sortedKeys = Object.keys(items).sort().reverse();

    sortedKeys.forEach((date) => {
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
    // CSVのヘッダー行
    let csvContent = "Date,Seconds\n";

    // データをCSV形式の文字列に変換
    const sortedKeys = Object.keys(items).sort().reverse();
    sortedKeys.forEach((date) => {
      csvContent += `${date},${items[date]}\n`;
    });

    // Blobオブジェクトを作成（テキストデータをファイルのように扱う技術）
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    // 仮想のリンクを作ってクリックさせる（ダウンロード発火）
    const a = document.createElement("a");
    a.href = url;
    a.download = "youtube_history.csv";
    a.click();
  });
}
// /MARK: full
