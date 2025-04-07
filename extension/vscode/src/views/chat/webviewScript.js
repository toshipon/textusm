console.log('Script starting...', { vscode });

let loadingMessageElement = null;
let currentDiffData = null;
let isApiKeyVisible = false;
let lastCompositionEndTime = 0;

// DOMの読み込み完了を待つ
window.addEventListener('load', () => {
    try {
        console.log('Window loaded, checking vscode object:', { vscode });
        
        // 要素の取得と検証を1つの関数にまとめる
        function getAndValidateElement(id) {
            const element = document.getElementById(id);
            if (!element) {
                console.error(`Element not found: ${id}`);
                throw new Error(`Required element not found: ${id}`);
            }
            console.log(`Found element: ${id}`, element);
            return element;
        }

        // 要素の取得
        const sendButton = getAndValidateElement('send-button');
        const messageInput = getAndValidateElement('message-input');
        const messagesDiv = getAndValidateElement('messages');
        const llmSelector = getAndValidateElement('llm-selector');
        const apiKeyInput = getAndValidateElement('api-key');
        const saveSettingsButton = getAndValidateElement('save-settings');
        const statusMessage = getAndValidateElement('status-message');
        const toggleApiKeyButton = getAndValidateElement('toggle-api-key');
        const chatContainer = getAndValidateElement('chat-container');
        const newFileButton = getAndValidateElement('new-file-button');
        const previewButton = getAndValidateElement('preview-button');

        // escapeHtml 関数を定義
        const escapeHtml = (unsafe) => {
            if (typeof unsafe !== 'string') {
                console.warn('escapeHtml received non-string input:', unsafe);
                return '';
            }
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        };

        // メッセージ送信関数
        function sendMessage() {
            console.log('Send message called');
            const message = messageInput.value;
            if (message && message.trim() !== '') {
                const trimmedMessage = message.trim();
                addMessage("You", trimmedMessage);
                vscode.postMessage({ command: 'sendMessage', text: trimmedMessage });
                messageInput.value = '';
                showLoadingMessage();
            }
        }

        // ドラッグ&ドロップの実装
        chatContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            chatContainer.classList.add('drag-over');
        });

        chatContainer.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            chatContainer.classList.remove('drag-over');
        });

        chatContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            chatContainer.classList.remove('drag-over');
            vscode.postMessage({
                command: 'fileDropped',
                uris: Array.from(e.dataTransfer.files).map((file) => file.path)
            });
        });

        // イベントリスナーの設定
        sendButton.addEventListener('click', () => {
            console.log('Send button clicked');
            sendMessage();
        });

        messageInput.addEventListener('compositionend', () => {
            lastCompositionEndTime = Date.now();
        });

        messageInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                const timeSinceCompositionEnd = Date.now() - lastCompositionEndTime;
                if (timeSinceCompositionEnd < 100) {
                    return;
                }
                if (!event.isComposing) {
                    event.preventDefault();
                    sendMessage();
                }
            }
        });

        newFileButton.addEventListener('click', () => {
            console.log('New file button clicked');
            vscode.postMessage({ command: 'createNewFile' });
        });

        previewButton.addEventListener('click', () => {
            console.log('Preview button clicked');
            vscode.postMessage({ command: 'previewCanvas' });
        });

        llmSelector.addEventListener('change', () => {
            vscode.postMessage({
                command: 'getLlmApiKey',
                llm: llmSelector.value
            });
        });

        saveSettingsButton.addEventListener('click', () => {
            const selectedLlm = llmSelector.value;
            const apiKey = apiKeyInput.value;
            vscode.postMessage({
                command: 'saveSettings',
                llm: selectedLlm,
                apiKey: apiKey
            });
        });

        toggleApiKeyButton.addEventListener('click', () => {
            isApiKeyVisible = !isApiKeyVisible;
            apiKeyInput.type = isApiKeyVisible ? 'text' : 'password';
            toggleApiKeyButton.textContent = isApiKeyVisible ? '🔒' : '👁';
        });

        function showLoadingMessage() {
            removeLoadingMessage();
            loadingMessageElement = document.createElement('p');
            loadingMessageElement.className = 'loading';
            loadingMessageElement.textContent = 'LLM is thinking...';
            messagesDiv.appendChild(loadingMessageElement);
            loadingMessageElement.scrollIntoView({
                behavior: "smooth",
                block: "end",
                inline: "nearest"
            });
        }

        function removeLoadingMessage() {
            if (loadingMessageElement) {
                messagesDiv.removeChild(loadingMessageElement);
                loadingMessageElement = null;
            }
        }

        function addMessage(sender, text, isLLMResponse = false) {
            removeLoadingMessage();
            const messageContainer = document.createElement('div');
            messageContainer.className = 'message-container';

            const p = document.createElement('p');
            const escapedText = escapeHtml(text);
            p.innerHTML = '<strong>' + sender + ':</strong> ' + escapedText;
            messageContainer.appendChild(p);

            messagesDiv.appendChild(messageContainer);
            messageContainer.scrollIntoView({
                behavior: "smooth",
                block: "end",
                inline: "nearest"
            });
        }

        function createDiffView(diffData) {
            const { originalText, newText } = diffData;
            const diffContainer = document.createElement('div');
            diffContainer.className = 'diff-view';

            const diffHeader = document.createElement('div');
            diffHeader.className = 'diff-header';
            diffHeader.textContent = 'Proposed Changes:';
            diffContainer.appendChild(diffHeader);

            const diffContent = document.createElement('div');
            diffContent.className = 'diff-content';

            const originalLines = originalText.split('\n');
            const newLines = newText.split('\n');

            let diffHtml = '';
            const maxLines = Math.max(originalLines.length, newLines.length);

            for (let i = 0; i < maxLines; i++) {
                const originalLine = originalLines[i];
                const newLine = newLines[i];

                if (i >= originalLines.length && newLine !== undefined) {
                    diffHtml += '<div class="diff-line-added">+ ' + escapeHtml(newLine) + '</div>';
                } else if (i >= newLines.length && originalLine !== undefined) {
                    diffHtml += '<div class="diff-line-removed">- ' + escapeHtml(originalLine) + '</div>';
                } else if (originalLine !== newLine && originalLine !== undefined && newLine !== undefined) {
                    diffHtml += '<div class="diff-line-removed">- ' + escapeHtml(originalLine) + '</div>';
                    diffHtml += '<div class="diff-line-added">+ ' + escapeHtml(newLine) + '</div>';
                } else if (originalLine !== undefined) {
                    diffHtml += '<div>  ' + escapeHtml(originalLine) + '</div>';
                }
            }

            diffContent.innerHTML = diffHtml;
            diffContainer.appendChild(diffContent);

            const applyButton = document.createElement('vscode-button');
            applyButton.textContent = 'Apply Changes';
            applyButton.appearance = 'secondary';
            applyButton.style.marginTop = '10px';
            applyButton.addEventListener('click', (event) => {
                const button = event.target;
                button.disabled = true;
                button.textContent = 'Applying...';

                vscode.postMessage({
                    command: 'applyDiff',
                    diffData: diffData
                });

                setTimeout(() => {
                    const currentButton = event.target;
                    if (currentButton.disabled) {
                        currentButton.disabled = false;
                        currentButton.textContent = 'Apply Changes';
                    }
                }, 3000);
            });
            diffContainer.appendChild(applyButton);

            return diffContainer;
        }

        function updateStatus(status, message) {
            statusMessage.textContent = message;
            statusMessage.className = status;
        }

        // メッセージハンドラーの設定
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateSyncStatus':
                    const syncFileElement = document.getElementById('sync-file');

                    if (message.syncedFile) {
                        const filename = message.syncedFile.split('/').pop();
                        if (syncFileElement) {
                            syncFileElement.textContent = '編集中のファイル: ' + filename;
                        }
                        if (newFileButton) {
                            newFileButton.style.display = message.isMarkdown ? 'none' : 'inline-flex';
                        }
                    } else {
                        if (syncFileElement) {
                            syncFileElement.textContent = 'ファイルが選択されていません';
                        }
                        if (newFileButton) {
                            newFileButton.style.display = 'none';
                        }
                    }
                    break;

                case 'showDiff':
                    currentDiffData = { originalText: message.originalText, newText: message.newText };
                    const diffView = createDiffView(currentDiffData);
                    const lastMessageContainer = messagesDiv.lastElementChild;
                    if (lastMessageContainer && lastMessageContainer.classList.contains('message-container')) {
                        const buttonContainer = lastMessageContainer.querySelector('.action-buttons');
                        if (buttonContainer) {
                            lastMessageContainer.insertBefore(diffView, buttonContainer);
                        } else {
                            lastMessageContainer.appendChild(diffView);
                        }
                    } else {
                        messagesDiv.appendChild(diffView);
                    }
                    diffView.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    break;

                case 'addMessage':
                    const isLLM = ["Gemini", "Claude", "OpenAI"].includes(message.sender);
                    addMessage(message.sender || "LLM", message.text, isLLM);
                    break;

                case 'showError':
                    removeLoadingMessage();
                    addMessage("System", 'Error: ' + message.text, false);
                    break;

                case 'updateStatus':
                    updateStatus(message.status, message.message);
                    break;

                case 'updateApiKey':
                    apiKeyInput.value = message.apiKey || '';
                    break;
            }
        });

        console.log('All event listeners initialized successfully');
    } catch (error) {
        console.error('Error initializing script:', error);
    }
});