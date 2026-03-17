document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('employeeForm');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const submitBtn = form.querySelector('.submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    const successMessage = document.getElementById('successMessage');

    // 必須フィールドのリスト
    const requiredFields = ['name', 'bankName', 'branchName', 'accountType', 'accountNumber', 'accountHolder', 'homeStation', 'homeFare'];

    // プログレスバーを更新する関数
    function updateProgress() {
        const totalFields = requiredFields.length;
        let filledFields = 0;

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field.value.trim() !== '') {
                filledFields++;
            }
        });

        const progress = Math.round((filledFields / totalFields) * 100);
        progressFill.style.width = progress + '%';
        progressText.textContent = progress + '% 完了';

        // フォームの送信ボタンの状態を更新
        if (progress === 100) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
        } else {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.6';
        }
    }

    // 各入力フィールドにイベントリスナーを追加
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        field.addEventListener('input', updateProgress);
        field.addEventListener('blur', updateProgress);
    });

    // 初期状態でプログレスを更新
    updateProgress();

    // フォーム送信処理
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // バリデーション
        let isValid = true;
        const formData = new FormData(form);
        const data = {};

        // 必須フィールドのチェック
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const value = field.value.trim();

            if (value === '') {
                isValid = false;
                field.style.borderColor = '#e74c3c';
                field.focus();
            } else {
                field.style.borderColor = '#28a745';
                data[fieldId] = value;
            }
        });

        // 任意フィールドの値を取得
        const optionalFields = ['clientCompany', 'clientStation', 'clientFare'];
        optionalFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const value = field.value.trim();
            if (value !== '') {
                data[fieldId] = value;
            }
        });

        if (!isValid) {
            alert('必須項目を全て入力してください。');
            return;
        }

        // 送信状態に切り替え
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';

        // Google Apps ScriptのWebアプリURLに送信
        const gasUrl = 'https://script.google.com/macros/s/AKfycby0vH6DjmY-LacYEjjf_kkcgHDBA4daSLyRKENLVCsDmqfHPLiFMyGjOHJIvNtZOv0X/exec';

        console.log('送信開始 - データ:', data);
        console.log('送信先URL:', gasUrl);

        // iframe を使った送信方法（より確実）
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.name = 'hiddenFrame';
        document.body.appendChild(iframe);

        const hiddenForm = document.createElement('form');
        hiddenForm.method = 'POST';
        hiddenForm.action = gasUrl;
        hiddenForm.target = 'hiddenFrame';

        Object.keys(data).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = data[key];
            hiddenForm.appendChild(input);
        });

        document.body.appendChild(hiddenForm);

        // 送信完了を検知するためのタイマー
        let submitted = false;
        const submitTimer = setTimeout(() => {
            if (!submitted) {
                submitted = true;
                console.log('送信完了（タイムアウト）');

                // 成功メッセージを表示
                document.getElementById('employeeForm').style.display = 'none';
                successMessage.style.display = 'block';

                // ページをトップにスクロール
                window.scrollTo({ top: 0, behavior: 'smooth' });

                // 下書きを削除
                localStorage.removeItem(autoSaveKey);

                // クリーンアップ
                document.body.removeChild(hiddenForm);
                document.body.removeChild(iframe);
            }
        }, 3000); // 3秒後に成功とみなす

        iframe.onload = function() {
            if (!submitted) {
                submitted = true;
                clearTimeout(submitTimer);
                console.log('送信完了（iframe onload）');

                // 成功メッセージを表示
                document.getElementById('employeeForm').style.display = 'none';
                successMessage.style.display = 'block';

                // ページをトップにスクロール
                window.scrollTo({ top: 0, behavior: 'smooth' });

                // 下書きを削除
                localStorage.removeItem(autoSaveKey);

                // クリーンアップ
                document.body.removeChild(hiddenForm);
                document.body.removeChild(iframe);
            }
        };

        // フォームを送信
        hiddenForm.submit();
    });

    // 入力フィールドのリアルタイムバリデーション
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.hasAttribute('required') && this.value.trim() !== '') {
                this.style.borderColor = '#28a745';
            } else if (this.hasAttribute('required') && this.value.trim() === '') {
                this.style.borderColor = '#ffc107';
            }
        });

        // フォーカス時の処理
        input.addEventListener('focus', function() {
            if (this.hasAttribute('required')) {
                this.style.borderColor = '#667eea';
            }
        });

        // フォーカス解除時の処理
        input.addEventListener('blur', function() {
            if (this.hasAttribute('required')) {
                if (this.value.trim() !== '') {
                    this.style.borderColor = '#28a745';
                } else {
                    this.style.borderColor = '#e74c3c';
                }
            }
        });
    });

    // 数値入力フィールドの制限
    const numberInputs = form.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        input.addEventListener('input', function() {
            // 負の値を防ぐ
            if (this.value < 0) {
                this.value = 0;
            }
            // 最大値の制限（交通費の上限を考慮）
            if (this.value > 10000) {
                this.value = 10000;
            }
        });
    });

    // キーボードショートカット
    document.addEventListener('keydown', function(e) {
        // Ctrl + Enter でフォーム送信
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            if (!submitBtn.disabled) {
                form.dispatchEvent(new Event('submit'));
            }
        }
    });

    // フォームの自動保存機能（ローカルストレージ）
    const autoSaveKey = 'employeeFormDraft';

    // 自動保存
    function autoSave() {
        const formData = {};
        const allInputs = form.querySelectorAll('input, textarea, select');

        allInputs.forEach(input => {
            if (input.value.trim() !== '') {
                formData[input.name] = input.value;
            }
        });

        if (Object.keys(formData).length > 0) {
            localStorage.setItem(autoSaveKey, JSON.stringify(formData));
        }
    }

    // 自動復元
    function autoRestore() {
        const savedData = localStorage.getItem(autoSaveKey);
        if (savedData) {
            try {
                const formData = JSON.parse(savedData);
                Object.keys(formData).forEach(key => {
                    const input = form.querySelector(`[name="${key}"]`);
                    if (input) {
                        input.value = formData[key];
                    }
                });
                updateProgress();
            } catch (e) {
                console.error('自動復元エラー:', e);
            }
        }
    }

    // 自動保存のイベントリスナー
    const allInputs = form.querySelectorAll('input, textarea, select');
    allInputs.forEach(input => {
        input.addEventListener('input', debounce(autoSave, 1000));
    });

    // デバウンス関数
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // フォーム送信成功時に下書きを削除
    form.addEventListener('submit', function() {
        setTimeout(() => {
            localStorage.removeItem(autoSaveKey);
        }, 3000);
    });

    // ページ読み込み時に自動復元
    autoRestore();
});
