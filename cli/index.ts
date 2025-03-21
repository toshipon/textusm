#!/usr/bin/env node
import { OptionValues, createCommand } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as puppeteer from "puppeteer";
import { html, DiagramType, Settings } from "./html";
import { optimize } from "svgo";
import packageJson from "./package.json";

process.title = "textusm";

type DiagramSettings = {
  width: number;
  height: number;
  diagramType: DiagramType;
};

type DiagramKey =
  | "user_story_map"
  | "opportunity_canvas"
  | "business_model_canvas"
  | "4ls"
  | "start_stop_continue"
  | "kpt"
  | "userpersona"
  | "mind_map"
  | "empathy_map"
  | "table"
  | "site_map"
  | "gantt_chart"
  | "impact_map"
  | "er_diagram"
  | "kanban"
  | "sequence_diagram"
  | "use_case_diagram"
  | "keyboard_layout"
  | "free_form";

const diagramMap: { readonly [T in DiagramKey]: DiagramSettings } = {
  user_story_map: {
    width: 1024,
    height: 1024,
    diagramType: "UserStoryMap",
  },
  opportunity_canvas: {
    width: 1500,
    height: 940,
    diagramType: "OpportunityCanvas",
  },
  business_model_canvas: {
    width: 1500,
    height: 940,
    diagramType: "BusinessModelCanvas",
  },
  "4ls": {
    width: 1250,
    height: 1250,
    diagramType: "4Ls",
  },
  start_stop_continue: {
    width: 900,
    height: 350,
    diagramType: "StartStopContinue",
  },
  kpt: {
    width: 1200,
    height: 640,
    diagramType: "Kpt",
  },
  userpersona: {
    width: 1500,
    height: 640,
    diagramType: "UserPersona",
  },
  mind_map: {
    width: 1024,
    height: 1024,
    diagramType: "MindMap",
  },
  empathy_map: {
    width: 1200,
    height: 640,
    diagramType: "EmpathyMap",
  },
  table: {
    width: 1024,
    height: 1024,
    diagramType: "Table",
  },
  site_map: {
    width: 1024,
    height: 1024,
    diagramType: "SiteMap",
  },
  gantt_chart: {
    width: 1024,
    height: 1024,
    diagramType: "GanttChart",
  },
  impact_map: {
    width: 1024,
    height: 1024,
    diagramType: "ImpactMap",
  },
  er_diagram: {
    width: 1024,
    height: 1024,
    diagramType: "ERDiagram",
  },
  kanban: {
    width: 1024,
    height: 1024,
    diagramType: "Kanban",
  },
  sequence_diagram: {
    width: 1024,
    height: 1024,
    diagramType: "SequenceDiagram",
  },
  free_form: {
    width: 1024,
    height: 1024,
    diagramType: "Freeform",
  },
  use_case_diagram: {
    width: 1024,
    height: 1024,
    diagramType: "UseCaseDiagram",
  },
  keyboard_layout: {
    width: 1024,
    height: 1024,
    diagramType: "KeyboardLayout",
  },
};

const defaultSettings: Settings = {
  font: "Nunito Sans",
  scale: 1.0,
  size: {
    width: 140,
    height: 65,
  },
  backgroundColor: "#F5F5F6",
  color: {
    activity: {
      color: "#FFFFFF",
      backgroundColor: "#266B9A",
    },
    task: {
      color: "#FFFFFF",
      backgroundColor: "#3E9BCD",
    },
    story: {
      color: "#000000",
      backgroundColor: "#FFFFFF",
    },
    line: "#434343",
    label: "#8C9FAE",
    text: "#111111",
  },
  diagramType: "UserStoryMap",
};

const readConfigFile = (file: string | null): Settings => {
  if (!file) {
    return defaultSettings;
  }
  try {
    return JSON.parse(fs.readFileSync(file).toString());
  } catch {
    return defaultSettings;
  }
};

const readStdin = async (): Promise<string> => {
  process.stdin.setEncoding("utf8");
  let text = "";
  for await (const chunk of process.stdin) text += chunk;
  return text;
};

interface Options extends OptionValues {
  configFile: string | null;
  input: string | null;
  width: string | null;
  height: string | null;
  output: string;
  diagramType: DiagramKey | null;
  cdp: string | null;
}

const program = createCommand();
// @ts-ignore
const options = program
  // @ts-ignore
  .version(packageJson.version)
  .option("-c, --configFile [configFile]", "Config file.")
  .option("-i, --input <input>", "Input text file.")
  .option("-w, --width <width>", "Width of the page. Optional. Default: 1024.")
  .option(
    "-p, --cdp <chromeUrl>",
    "connect to running chrome instance. Optional."
  )
  .option(
    "-H, --height <height>",
    "Height of the page. Optional. Default: 1024."
  )
  .option(
    "-o, --output [output]",
    "Output file. It should be svg, png, pdf or html. If not specified, output to stdout."
  )
  .option(
    "-d, --diagramType [diagramType]",
    `Diagram type. It should be one of ${Object.keys(diagramMap).join(", ")}`
  )
  .parse()
  .opts();

const { configFile, input, width, height, output, diagramType, cdp } =
  options as Options;

if (diagramType && Object.keys(diagramMap).indexOf(diagramType) === -1) {
  console.error(`Output file must be ${Object.keys(diagramMap).join(", ")}`);
  process.exit(1);
}

if (input && !fs.existsSync(input)) {
  console.error(`${input} is not exists.  -i <input>`);
  process.exit(1);
}

if (output && !/\.(?:svg|png|pdf|html)$/.test(output)) {
  console.error(`Output file must be svg, png, html or pdf.`);
  process.exit(1);
}

const writeResult = (output: string | null, result: string): void => {
  if (output) {
    fs.writeFileSync(output, result);
  } else {
    process.stdout.write(result);
  }
};

(async () => {
  const browser = cdp
    ? await puppeteer.connect({ browserURL: cdp })
    : await puppeteer.launch({ headless: true });
  const config = readConfigFile(configFile);
  const text = input ? fs.readFileSync(input, "utf-8") : await readStdin();
  const js = fs.readFileSync(
    path.join(
      path.resolve(__dirname),
      path.sep,
      "..",
      path.sep,
      "js",
      path.sep,
      "textusm.js"
    ),
    "utf-8"
  );

  if (text === "") {
    console.error(`${input} is empty file.`);
    process.exit(1);
  }

  try {
    const page = await browser.newPage();
    const svgWidth = width
      ? parseInt(width)
      : diagramType
      ? diagramMap[diagramType].width
      : 1024;
    const svgHeight = height
      ? parseInt(height)
      : diagramType
      ? diagramMap[diagramType].height
      : 1024;
    await page.setViewport({
      width: svgWidth,
      height: svgHeight,
    });
    config.diagramType = diagramType
      ? diagramMap[diagramType].diagramType
      : "UserStoryMap";
    await page.addScriptTag({ content: js });
    await page.setContent(html(text, svgWidth, svgHeight, config), {
      waitUntil: "load",
    });

    if (!output || output.endsWith(".svg")) {
      const svg =
        (await page.evaluate(
          () => document.querySelector("#usm")?.outerHTML
        )) || "";

      const optimizedSvg = optimize(
        svg
          .replaceAll("<div></div>", "")
          .replaceAll(
            "<svg",
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
          )
          .replaceAll("<div", '<div xmlns="http://www.w3.org/1999/xhtml"')
          .replaceAll("<img", '<img xmlns="http://www.w3.org/1999/xhtml"'),
        {
          plugins: [
            {
              name: "preset-default",
              params: {
                overrides: {
                  convertShapeToPath: {
                    convertArcs: true,
                  },
                  convertPathData: false,
                },
              },
            },
          ],
        }
      );

      writeResult(output, optimizedSvg.data.split("&quot;").join("'"));
    } else if (output.endsWith(".png")) {
      const clip = await page.$eval("#usm", (svg) => {
        const rect = svg.getBoundingClientRect();
        return {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        };
      });
      await page.screenshot({
        path: output,
        clip,
        omitBackground: true,
      });
    } else if (output.endsWith(".pdf")) {
      await page.pdf({
        path: output,
        landscape: true,
        printBackground: false,
      });
    } else if (output.endsWith(".html")) {
      const html = await page.evaluate(() => {
        const doc = document.documentElement;
        doc.querySelectorAll("script").forEach((e) => {
          e.remove();
        });
        doc.querySelectorAll("link").forEach((e) => {
          e.remove();
        });
        return `<html>${doc.innerHTML}</html>`;
      });
      fs.writeFileSync(output, html);
    }
    await page.close();

    if (cdp) {
      browser.disconnect();
    } else {
      browser.close();
    }
  } catch (e) {
    console.log(e);
    console.error("Internal error.");
    browser.close();
  }
})().catch((e) => {
  console.log(e);
  console.error("Internal error.");
});
