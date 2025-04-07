import * as vscode from "vscode";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  Content, // Content型をインポート
} from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export const CONFIG_SECTION = "hypothesisCanvas";
export const GEMINI_API_KEY_CONFIG = "geminiApiKey";
export const CLAUDE_API_KEY_CONFIG = "claudeApiKey";
export const OPENAI_API_KEY_CONFIG = "openaiApiKey";
export const SELECTED_LLM_CONFIG = "selectedLlm";

export const GEMINI_MODEL_NAME = "gemini-2.5-pro-exp-03-25";
export const CLAUDE_MODEL_NAME = "claude-3.7-sonnet";
export const OPENAI_MODEL_NAME = "gpt-4.5-preview";

export type LlmType = "Gemini" | "Claude" | "OpenAI";

// メッセージ履歴の型定義を追加
export interface ChatMessagePart {
  text: string;
}
export interface ChatMessage {
  role: "user" | "model"; // Gemini/Claude/OpenAIで共通化できるロール
  parts: ChatMessagePart[]; // Gemini形式に合わせる (Claude/OpenAIは変換が必要)
}

export interface LlmClientStatus {
  initialized: boolean;
  errorMessage?: string;
}

export class LlmService {
  private _genAI: GoogleGenerativeAI | undefined;
  private _anthropic: Anthropic | undefined;
  private _openai: OpenAI | undefined;
  private _selectedLlm: LlmType = "Gemini";

  constructor() {
    this.initializeLlmClients();
  }

  public get selectedLlm(): LlmType {
    return this._selectedLlm;
  }

  public initializeLlmClients(): LlmClientStatus {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    this._selectedLlm = config.get<LlmType>(SELECTED_LLM_CONFIG) || "Gemini";

    this._genAI = undefined;
    this._anthropic = undefined;
    this._openai = undefined;

    let apiKey: string | undefined;
    let clientInitialized = false;
    let errorMessage: string | undefined;

    try {
      switch (this._selectedLlm) {
        case "Gemini":
          apiKey = config.get<string>(GEMINI_API_KEY_CONFIG);
          if (apiKey) {
            this._genAI = new GoogleGenerativeAI(apiKey);
            console.log("Gemini client initialized.");
            clientInitialized = true;
          } else {
            errorMessage = "Gemini API Key not configured.";
          }
          break;
        case "Claude":
          apiKey = config.get<string>(CLAUDE_API_KEY_CONFIG);
          if (apiKey) {
            this._anthropic = new Anthropic({ apiKey });
            console.log("Claude client initialized.");
            clientInitialized = true;
          } else {
            errorMessage = "Claude API Key not configured.";
          }
          break;
        case "OpenAI":
          apiKey = config.get<string>(OPENAI_API_KEY_CONFIG);
          if (apiKey) {
            this._openai = new OpenAI({ apiKey });
            console.log("OpenAI client initialized.");
            clientInitialized = true;
          } else {
            errorMessage = "OpenAI API Key not configured.";
          }
          break;
        default:
          errorMessage = `Unsupported LLM selected: ${this._selectedLlm}`;
          console.warn(errorMessage);
      }
    } catch (error: any) {
      errorMessage = `Error initializing ${this._selectedLlm} client: ${error.message}`;
      console.error(errorMessage, error);
    }

    return {
      initialized: clientInitialized,
      errorMessage: !clientInitialized ? errorMessage : undefined,
    };
  }

  public async generateResponse(messages: ChatMessage[]): Promise<string> {
    if (messages.length === 0) {
      throw new Error("Cannot generate response with empty messages");
    }
    // 最後のメッセージを現在のプロンプトとして扱う (互換性のため & 各APIへの送信)
    const currentMessage = messages[messages.length - 1];
    // 履歴を各LLMの形式に変換するために準備
    const history = messages.slice(0, -1); // 最後のメッセージ（現在のプロンプト）を除く
    try {
      switch (this._selectedLlm) {
        case "Gemini":
          if (!this._genAI) {
            throw new Error("Gemini client not initialized");
          }
          // Geminiの履歴形式に変換 (Content[])
          const geminiHistory: Content[] = history.map(msg => ({
            role: msg.role,
            // parts を明示的に { text: string }[] にマッピング (SDKのPart[]と互換性があることを期待)
            parts: msg.parts.map(p => ({ text: p.text }))
          }));
          const safetySettings = [
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
          ];
          const chat = this._genAI.getGenerativeModel({
            model: GEMINI_MODEL_NAME,
            safetySettings,
          }).startChat({ history: geminiHistory }); // history を渡す
          // 現在のメッセージを Part[] 形式で送信
          const currentParts = currentMessage.parts.map(p => ({ text: p.text }));
          const result = await chat.sendMessage(currentParts);
          const text = result.response.text();
          // UTF-8でエンコード/デコードして日本語文字を適切に処理
          return Buffer.from(text).toString("utf-8");

        case "Claude":
          if (!this._anthropic) {
            throw new Error("Claude client not initialized");
          }
          // Claudeのメッセージ形式 (MessageParam[]) に変換
          const claudeMessages: Anthropic.MessageParam[] = messages.map(msg => ({
            role: msg.role === 'model' ? 'assistant' : 'user', // 'model' を 'assistant' にマッピング
            // Claudeは content: string | ContentBlock[] を期待するが、ここでは単純なテキストのみ対応
            content: msg.parts.map(p => p.text).join('\n')
          }));
          const claudeResponse = await this._anthropic.messages.create({
            model: CLAUDE_MODEL_NAME,
            max_tokens: 1024, // 必要に応じて調整
            messages: claudeMessages, // 完全なメッセージ履歴を渡す
          });
          if (
            claudeResponse.content &&
            claudeResponse.content.length > 0 &&
            claudeResponse.content[0].type === "text"
          ) {
            const text = claudeResponse.content[0].text;
            return Buffer.from(text).toString("utf-8");
          }
          throw new Error("Received unexpected response format from Claude");

        case "OpenAI":
          if (!this._openai) {
            throw new Error("OpenAI client not initialized");
          }
          // OpenAIのメッセージ形式 (ChatCompletionMessageParam[]) に変換
          const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = messages.map(msg => ({
            role: msg.role === 'model' ? 'assistant' : 'user', // 'model' を 'assistant' にマッピング
            content: msg.parts.map(p => p.text).join('\n')
          }));
          const openaiResponse = await this._openai.chat.completions.create({
            model: OPENAI_MODEL_NAME,
            messages: openaiMessages, // 完全なメッセージ履歴を渡す
          });
          const content = openaiResponse.choices[0]?.message?.content;
          if (!content) {
            throw new Error("Received empty response from OpenAI");
          }
          return Buffer.from(content).toString("utf-8");

        default:
          throw new Error(
            `Selected LLM (${this._selectedLlm}) is not supported`
          );
      }
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  public async editMarkdownText(
    currentText: string,
    userIntent: string
  ): Promise<string> {
    const editPrompt = `以下のMarkdownテキストを編集してください。ユーザーの意図: ${userIntent}\n\n${currentText}`;
    // editMarkdownText は単一のユーザープロンプトとして扱うため、ChatMessage形式に変換
    const editMessages: ChatMessage[] = [
      { role: "user", parts: [{ text: editPrompt }] }
    ];
    return this.generateResponse(editMessages);
  }

  private handleError(error: any): Error {
    console.error(`Error in LLM service:`, error);
    let message = `An error occurred with ${this._selectedLlm}`;
    if (error instanceof Error) {
      message += `: ${error.message}`;
    }
    if (error.message?.includes("API key") || error.status === 401) {
      message = `Invalid ${this._selectedLlm} API Key. Please check your settings.`;
    }
    return new Error(message);
  }
}
