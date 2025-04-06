import * as vscode from "vscode";
import { CONFIG_SECTION, SELECTED_LLM_CONFIG, LlmService } from "../../services/LlmService";

export class SettingsManager {
  constructor(private readonly _llmService: LlmService) {}

  public async handleSaveSettings(
    message: any,
    webview: vscode.Webview
  ): Promise<void> {
    try {
      const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
      
      // ローカルの設定として保存を試みる
      let target = vscode.ConfigurationTarget.Workspace;
      
      // すべての設定更新を1つの配列にまとめる
      const updates = [
        config.update(
          SELECTED_LLM_CONFIG,
          message.llm,
          target
        ),
        config.update(
          `${message.llm.toLowerCase()}ApiKey`,
          message.apiKey,
          target
        )
      ];

      try {
        // すべての設定を同時に更新
        await Promise.all(updates);
      } catch (updateError) {
        console.error("Workspace configuration update failed:", updateError);
        
        // ワークスペース設定が失敗した場合は、ユーザー設定として保存を試みる
        target = vscode.ConfigurationTarget.Global;
        const userUpdates = [
          config.update(
            SELECTED_LLM_CONFIG,
            message.llm,
            target
          ),
          config.update(
            `${message.llm.toLowerCase()}ApiKey`,
            message.apiKey,
            target
          )
        ];
        
        await Promise.all(userUpdates);
      }

      // LLMクライアントの初期化
      const status = await this._llmService.initializeLlmClients();
      if (!status.initialized) {
        throw new Error(status.errorMessage || "LLMクライアントの初期化に失敗しました");
      }

      const settingLocation = target === vscode.ConfigurationTarget.Workspace ? "ワークスペース" : "ユーザー";
      webview.postMessage({
        command: "updateStatus",
        status: "success",
        message: `設定を${settingLocation}設定として保存しました。${message.llm}を使用します。`
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      webview.postMessage({
        command: "updateStatus",
        status: "error",
        message: error instanceof Error 
          ? `設定の保存に失敗しました: ${error.message}`
          : "設定の保存に失敗しました。もう一度お試しください。"
      });
    }
  }

  public handleGetLlmApiKey(message: any, webview: vscode.Webview): void {
    const apiKey = vscode.workspace.getConfiguration(CONFIG_SECTION).get<string>(
      `${message.llm.toLowerCase()}ApiKey`
    );
    webview.postMessage({
      command: "updateApiKey",
      apiKey: apiKey || "",
    });
  }
}