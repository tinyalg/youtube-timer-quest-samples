# Chrome拡張機能で学ぶ「エンジニアの思考法」 サンプルコード

Zennで公開中の技術書『**Chrome拡張機能で学ぶ「エンジニアの思考法」—— YouTubeタイマー「制作クエスト」**』の公式サンプルコードリポジトリです。

[![Zenn Book](https://img.shields.io/badge/Zenn-Read_Book-3EA8FF?style=for-the-badge&logo=zenn)](https://zenn.dev/lwgena/books/mv3-timer-quest)

## 📖 本書について
本書は、単なる「Chrome拡張機能の作り方」の解説にとどまりません。
Manifest V3の制約、OSごとのフォーカス判定の違い、Service Workerの寿命といった「システムのエッジケース」と戦いながら、堅牢なタイマーアプリ（よそ見を許さない厳格なタイマー）を錬成していく「エンジニアの思考プロセス」を体験できるチュートリアルです。

## 🚀 サンプルコードの動かし方

Chromeブラウザで、各章の完成状態の拡張機能を実際に動かして試すことができます。

1. Chromeで `chrome://extensions/` を開きます。
2. 右上の **「デベロッパー モード」** をオンにします。
3. 左上の **「パッケージ化されていない拡張機能を読み込む」** をクリックします。
4. 本リポジトリ内の動かしたい章のフォルダ（例: `02-manifest-v3-basic-timer`）を選択します。

> **💡 Tips:** > 複数の章のフォルダを同時に読み込んで、挙動の違いを見比べることも可能です！

## 📂 フォルダ構成（各章のコード）

各フォルダは、本編の該当チャプター終了時点でのソースコードを格納しています。
フォルダの先頭番号は、Zennの画面上で表示される章番号とリンクしています。

* `02-manifest-v3-basic-timer/` : 動くタイマーを3分で作る
* `03-popup-history-csv-export/` : 履歴の保存とCSVエクスポート
* `04-options-page-customization/` : オプションページの実装
* `05-delta-time-precision/` : 差分時間による高精度な計測
* `06-sleep-detection-logic/` : PCのスリープと復帰の検知
* `07-focus-audible-tracking/` : 厳密なフォーカス判定とAudible
* `08-service-worker-persistence/` : Service Workerの寿命対策
* `09-i18n-and-final-steps/` : 国際化（i18n）とパッケージング

## ⚖️ ライセンス (License)
本リポジトリのソースコードは [BSD 3-Clause License](LICENSE) のもとで公開しています。学習用途や、ご自身のプロジェクトへの組み込みなど、ご自由にお使いください。