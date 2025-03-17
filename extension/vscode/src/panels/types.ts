import * as vscode from "vscode";
import { DiagramType } from "../types/DiagramType";

export interface WebviewMessage {
  command: string;
  text?: string;
  timestamp?: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
}

export interface DiagramConfig {
  fontName: string;
  backgroundColor: string;
  activityColor: string;
  activityBackground: string;
  taskColor: string;
  taskBackground: string;
  storyColor: string;
  storyBackground: string;
  labelColor: string;
  textColor: string;
  lineColor: string;
  cardWidth: number;
  cardHeight: number;
  toolbar: boolean;
  showGrid: boolean;
}