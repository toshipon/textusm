/**
 * TextUSM format validator utility
 */

/**
 * Represents a TextUSM node structure
 */
interface TextUsmNode {
  indent: number;
  content: string;
  children?: TextUsmNode[];
}

/**
 * Validates if the given text follows TextUSM format rules
 * @param text Content to validate
 * @returns {boolean} True if valid TextUSM format, false otherwise
 */
export function isValidTextUsm(text: string): boolean {
  if (!text.trim()) {
    return false;
  }

  const lines = text.split('\n');
  let previousIndent = -1;

  try {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip empty lines
      if (!line.trim()) {
        continue;
      }

      // Calculate indentation level (number of spaces)
      const indent = line.search(/\S/);
      
      // Invalid if line starts with anything other than spaces or has odd number of spaces
      if (indent === -1 || indent % 2 !== 0) {
        return false;
      }

      // First non-empty line must start at indent level 0
      if (previousIndent === -1 && indent !== 0) {
        return false;
      }

      // Indentation can only increase by 2 spaces at a time
      if (previousIndent !== -1 && indent > previousIndent && indent - previousIndent !== 2) {
        return false;
      }

      previousIndent = indent;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Formats text to follow TextUSM rules
 * @param text Content to format
 * @returns {string} Formatted TextUSM content
 */
export function formatTextUsm(text: string): string {
  if (!text.trim()) {
    return '';
  }

  const lines = text.split('\n');
  const formattedLines: string[] = [];
  let currentIndent = 0;
  let isInsideMarkdown = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // マークダウンコードブロックの開始を検出
    if (trimmedLine.startsWith('```markdown')) {
      isInsideMarkdown = true;
      continue;
    }
    // マークダウンコードブロックの終了を検出
    else if (trimmedLine === '```') {
      isInsideMarkdown = false;
      continue;
    }

    // マークダウンブロック内のコンテンツのみを処理
    if (isInsideMarkdown) {
      // 空行の処理
      if (!trimmedLine) {
        formattedLines.push('');
        continue;
      }

      const spaces = ' '.repeat(currentIndent);
      formattedLines.push(`${spaces}${trimmedLine}`);
    }
  }

  return formattedLines.join('\n');
}