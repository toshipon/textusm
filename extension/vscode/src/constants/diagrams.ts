import { DiagramType } from "../types/DiagramType";

export const diagrams: ReadonlyArray<{ label: string; value: DiagramType }> = [
  { label: "User Story Map", value: "usm" },
  { label: "Table", value: "table" },
  { label: "Empathy Map", value: "emm" },
  { label: "Impact Map", value: "imm" },
  { label: "Mind Map", value: "mmp" },
  { label: "Site Map", value: "smp" },
  { label: "Business Model Canvas", value: "bmc" },
  { label: "Opportunity Canvas", value: "opc" },
  { label: "Hypothesis Canvas", value: "hpc" },
  { label: "User Persona", value: "persona" },
  { label: "Gantt Chart", value: "gct" },
  { label: "ER Diagram", value: "erd" },
  { label: "Sequence Diagram", value: "sed" },
  { label: "Use Case Diagram", value: "ucd" },
  { label: "Kanban", value: "kanban" },
  { label: "KPT Retrospective", value: "kpt" },
  { label: "Start, Stop, Continue Retrospective", value: "ssc" },
  { label: "4Ls Retrospective", value: "4ls" },
  { label: "Freeform", value: "free" },
  { label: "Keyboard Layout", value: "kbd" },
];

export const ENABLED_LANG_DIAGRAM_TYPE: { [v in DiagramType]: DiagramType } = {
  usm: "usm",
  mmp: "usm",
  imm: "usm",
  smp: "usm",
  bmc: "bmc", // "usm" から "bmc" に変更
  sed: "usm",
  free: "usm",
  ucd: "usm",
  erd: "usm",
  gct: "usm",
  opc: "opc", // "usm" から "opc" に変更
  hpc: "hpc", // "usm" から "hpc" に変更
  "4ls": "4ls", // "usm" から "4ls" に変更
  ssc: "usm",
  kpt: "usm",
  persona: "usm",
  emm: "emm", // "usm" から "emm" に変更
  kanban: "usm",
  table: "table", // "usm" から "table" に変更
  kbd: "usm",
};

export const DIAGRAM_TYPE_TO_ELM_TYPE: { [key in DiagramType]: string } = {
  usm: "UserStoryMap",
  mmp: "MindMap",
  imm: "ImpactMap",
  smp: "SiteMap",
  bmc: "BusinessModelCanvas",
  sed: "SequenceDiagram",
  free: "Freeform",
  ucd: "UseCaseDiagram",
  erd: "ER",
  gct: "GanttChart",
  opc: "OpportunityCanvas",
  hpc: "HypothesisCanvas", // ここが重要! "hpc" → "HypothesisCanvas"
  "4ls": "4Ls",
  ssc: "StartStopContinue",
  kpt: "Kpt",
  persona: "UserPersona",
  emm: "EmpathyMap",
  kanban: "Kanban",
  table: "Table",
  kbd: "KeyboardLayout",
};
