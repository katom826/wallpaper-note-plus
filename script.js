const memoArea = document.getElementById('memoArea');
const memoContainer = document.getElementById('memoContainer');
const settingsBtn = document.getElementById('settingsBtn');
const resetBtn = document.getElementById('resetBtn');
const saveBtn = document.getElementById('saveBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const resultView = document.getElementById('resultView');
const resultImage = document.getElementById('resultImage');
const closeResult = document.getElementById('closeResult');

// 設定項目
const bgColorInput = document.getElementById('bgColor');
const textColorInput = document.getElementById('textColor');
const fontFamilySelect = document.getElementById('fontFamily');
const fontSizeInput = document.getElementById('fontSize');

// 色コード表示用スパン
const bgColorValue = document.getElementById('bgColorValue');
const textColorValue = document.getElementById('textColorValue');

// ストレージキーのプレフィックス
const STORAGE_PREFIX = 'wallpaper-note-plus-';
const SETTINGS_KEY = STORAGE_PREFIX + 'settings';
const MEMO_KEY = STORAGE_PREFIX + 'memo';

// 解像度
const WIDTH = 1206;
const HEIGHT = 2622;
const CANVAS_PADDING = 80; // 画像生成時の左右余白

// 設定の読み込み
function loadSettings() {
    // 設定の復元
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    if (saved.bgColor) bgColorInput.value = saved.bgColor;
    if (saved.textColor) textColorInput.value = saved.textColor;
    if (saved.fontFamily) fontFamilySelect.value = saved.fontFamily;
    if (saved.fontSize) fontSizeInput.value = saved.fontSize;
    applyStyles();
}

// 設定の保存
function saveSettings() {
    const settings = {
        bgColor: bgColorInput.value,
        textColor: textColorInput.value,
        fontFamily: fontFamilySelect.value,
        fontSize: fontSizeInput.value
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    applyStyles();
}

// エディタへのスタイル適用（プレビュー用）
function applyStyles() {
    const fontSize = parseInt(fontSizeInput.value);
    
    // 画面幅に基づいたスケール計算 (画像の1206pxに対して現在の表示幅がどれくらいか)
    const containerWidth = memoContainer.clientWidth || window.innerWidth;
    const scale = containerWidth / WIDTH;

    // 比率を維持したパディングとフォントサイズの設定
    const horizontalPadding = CANVAS_PADDING * scale;
    memoArea.style.padding = `0 ${horizontalPadding}px`;
    memoArea.style.fontSize = (fontSize * scale) + 'px';
    
    memoContainer.style.backgroundColor = bgColorInput.value;
    memoArea.style.color = textColorInput.value;
    memoArea.style.fontFamily = fontFamilySelect.value;

    // 色コードテキストの更新
    if (bgColorValue) bgColorValue.textContent = bgColorInput.value.toUpperCase();
    if (textColorValue) textColorValue.textContent = textColorInput.value.toUpperCase();

    adjustHeight();
}

// 設定変更時に即座に保存・反映させる
[bgColorInput, textColorInput, fontFamilySelect, fontSizeInput].forEach(input => {
    input.addEventListener('input', saveSettings);
});


// textareaの高さを内容に合わせて調整
function adjustHeight() {
    memoArea.style.height = 'auto';
    memoArea.style.height = memoArea.scrollHeight + 'px';
}

// メモ内容の保存と復元
memoArea.addEventListener('input', () => {
    localStorage.setItem(MEMO_KEY, memoArea.value);
    adjustHeight();
});

function loadMemo() {
    const savedMemo = localStorage.getItem(MEMO_KEY);
    if (savedMemo !== null) memoArea.value = savedMemo;
    adjustHeight();
}

// モーダル制御
settingsBtn.onclick = () => settingsModal.style.display = 'flex';
closeSettings.onclick = () => {
    settingsModal.style.display = 'none';
    saveSettings();
};

// リセットボタン
resetBtn.onclick = () => {
    if (confirm('メモの内容をすべて消去しますか？')) {
        memoArea.value = '';
        localStorage.setItem(MEMO_KEY, '');
        adjustHeight();
    }
};

// 画像生成ロジック
function generateImage() {
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d');

    // 背景塗りつぶし
    ctx.fillStyle = bgColorInput.value;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 文字設定
    const fontSize = parseInt(fontSizeInput.value);
    ctx.fillStyle = textColorInput.value;
    ctx.font = `${fontSize}px ${fontFamilySelect.value}`;
    ctx.textBaseline = 'top';

    // テキスト描画 (自動折り返し) - CANVAS_PADDINGを使用
    const maxWidth = WIDTH - (CANVAS_PADDING * 2);
    const rawLines = memoArea.value.split('\n');
    const wrappedLines = [];
    const lineHeight = fontSize * 1.5;

    // 描画前にすべての行を計算（垂直中央寄せのため）
    rawLines.forEach(line => {
        if (line === '') {
            wrappedLines.push('');
            return;
        }
        const words = line.split('');
        let currentLine = '';

        for (let n = 0; n < words.length; n++) {
            let testLine = currentLine + words[n];
            let metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                wrappedLines.push(currentLine);
                currentLine = words[n];
            } else {
                currentLine = testLine;
            }
        }
        wrappedLines.push(currentLine);
    });

    // 垂直方向の開始位置計算
    const totalTextHeight = wrappedLines.length * lineHeight;
    let y = (HEIGHT - totalTextHeight) / 2;

    // 描画実行
    wrappedLines.forEach(line => {
        ctx.fillText(line, CANVAS_PADDING, y);
        y += lineHeight;
    });

    // 表示
    resultImage.src = canvas.toDataURL('image/png');
    resultView.style.display = 'block';
}

saveBtn.onclick = generateImage;
closeResult.onclick = () => resultView.style.display = 'none';

// 初期化
window.onload = () => {
    loadSettings();
    loadMemo();
};

// 画面リサイズ（回転など）時にスタイルを再適用
window.onresize = applyStyles;