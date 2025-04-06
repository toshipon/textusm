import * as vscode from "vscode";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export const CONFIG_SECTION = "hypothesisCanvas";
export const GEMINI_API_KEY_CONFIG = "geminiApiKey";
export const CLAUDE_API_KEY_CONFIG = "claudeApiKey";
export const OPENAI_API_KEY_CONFIG = "openaiApiKey";
export const SELECTED_LLM_CONFIG = "selectedLlm";

export const GEMINI_MODEL_NAME = "gemini-1.5-flash";
export const CLAUDE_MODEL_NAME = "claude-3-haiku-20240307";
export const OPENAI_MODEL_NAME = "gpt-4o-mini";

export type LlmType = "Gemini" | "Claude" | "OpenAI";

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

  public async generateResponse(prompt: string): Promise<string> {
    try {
      switch (this._selectedLlm) {
        case "Gemini":
          if (!this._genAI) {
            throw new Error("Gemini client not initialized");
          }
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
          const model = this._genAI.getGenerativeModel({
            model: GEMINI_MODEL_NAME,
            safetySettings,
          });
          const result = await model.generateContent(prompt);
          const text = result.response.text();
          // UTF-8でエンコード/デコードして日本語文字を適切に処理
          return Buffer.from(text).toString('utf-8');

        case "Claude":
          if (!this._anthropic) {
            throw new Error("Claude client not initialized");
          }
          const claudeResponse = await this._anthropic.messages.create({
            model: CLAUDE_MODEL_NAME,
            max_tokens: 1024,
            messages: [{ role: "user", content: prompt }],
          });
          if (
            claudeResponse.content &&
            claudeResponse.content.length > 0 &&
            claudeResponse.content[0].type === "text"
          ) {
            const text = claudeResponse.content[0].text;
            return Buffer.from(text).toString('utf-8');
          }
          throw new Error("Received unexpected response format from Claude");

        case "OpenAI":
          if (!this._openai) {
            throw new Error("OpenAI client not initialized");
          }
          const openaiResponse = await this._openai.chat.completions.create({
            model: OPENAI_MODEL_NAME,
            messages: [{ role: "user", content: prompt }],
          });
          const content = openaiResponse.choices[0]?.message?.content;
          if (!content) {
            throw new Error("Received empty response from OpenAI");
          }
          return Buffer.from(content).toString('utf-8');

        default:
          throw new Error(`Selected LLM (${this._selectedLlm}) is not supported`);
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
    return this.generateResponse(editPrompt);
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