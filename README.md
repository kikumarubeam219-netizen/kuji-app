# 🎰 くじ引きアプリ

オンラインでくじ引きを楽しむためのWebアプリケーションです。

## 機能

- **Googleアカウントでログイン**
- **くじの作成**: あたり枚数、全体枚数、あたり内容を設定
- **くじ引き**: 一番くじONLINE風のカードめくりアニメーション
- **結果表示**: 当選時は紙吹雪エフェクト付き

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Firebase設定

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成
2. **Authentication** > **Sign-in method** で「Google」を有効化
3. **Firestore Database** を作成（テストモードで開始）
4. **プロジェクトの設定** > **全般** からWebアプリを追加し、設定情報を取得

### 3. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、Firebase設定を入力:

```bash
cp .env.example .env
```

`.env` ファイルを編集:
```
VITE_FIREBASE_API_KEY=あなたのAPIキー
VITE_FIREBASE_AUTH_DOMAIN=あなたのプロジェクト.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=あなたのプロジェクトID
VITE_FIREBASE_STORAGE_BUCKET=あなたのプロジェクト.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=あなたのSenderID
VITE_FIREBASE_APP_ID=あなたのAppID
```

### 4. Firestoreルール設定

Firebase Console > Firestore Database > ルール で以下を設定:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // くじコレクション
    match /lotteries/{lotteryId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      
      // 引いた記録サブコレクション
      match /draws/{drawId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
      }
    }
  }
}
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:5173 を開きます。

## 使い方

1. 「Googleでログイン」ボタンでログイン
2. 「くじを作成する」ボタンでくじを作成
3. 作成したくじのURLを参加者に共有
4. 参加者はログイン後、ニックネームを入力してくじを引く

## 技術スタック

- React + Vite
- Firebase Authentication
- Cloud Firestore
- Vanilla CSS
