// 在构建时把 src/triz/ 下作者审定的 Markdown 表格与矩阵 JSON 解析成结构化数据。
// 唯一的真源是那几份文件：作者改文件，界面自动跟着变，不需要改代码。

import matrixJson from '../triz/matrix.json';

const raw = import.meta.glob('../triz/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

function file(name: string): string {
  const key = Object.keys(raw).find((k) => k.endsWith('/' + name));
  return key ? raw[key] : '';
}

/** 取某个二级标题下的第一张 Markdown 表格，返回去掉表头与分隔行后的单元格数组 */
function tableUnder(md: string, heading: string): string[][] {
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === `## ${heading}`);
  if (start < 0) return [];
  const rows: string[][] = [];
  let inTable = false;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('## ')) break;
    if (!line.startsWith('|')) {
      if (inTable) break;
      continue;
    }
    inTable = true;
    const cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
    rows.push(cells);
  }
  // 第一行是表头，第二行是 --- 分隔
  return rows.slice(2);
}

export interface Parameter {
  id: string; // P01
  name: string;
  definition: string;
  improvement: string;
  measure: string;
}

export interface Principle {
  no: number;
  name: string;
  meaning: string;
  move: string; // 套装系统里的打法
  chapters: string;
}

export interface ExampleContradiction {
  improve: string; // P01
  worsen: string;
  sentence: string;
}

export interface TrizData {
  parameters: Parameter[];
  principles: Principle[];
  examples: ExampleContradiction[];
  matrix: Record<string, number[]>;
  fallback: number[];
  matrixNote: string;
}

function paramId(cell: string): string {
  return (cell.match(/P\d{2}/) ?? [''])[0];
}

export function loadTrizData(): TrizData {
  const pmd = file('parameters.ja.md');
  const parameters: Parameter[] = tableUnder(pmd, '表')
    .filter((r) => /^P\d{2}$/.test(r[0]))
    .map((r) => ({ id: r[0], name: r[1], definition: r[2], improvement: r[3], measure: r[4] ?? '' }));

  const examples: ExampleContradiction[] = tableUnder(pmd, '典型的な矛盾の例')
    .map((r) => ({ improve: paramId(r[0]), worsen: paramId(r[1]), sentence: r[2] ?? '' }))
    .filter((e) => e.improve && e.worsen);

  const principles: Principle[] = tableUnder(file('principles.ja.md'), '表')
    .filter((r) => /^\d+$/.test(r[0]))
    .map((r) => ({ no: Number(r[0]), name: r[1], meaning: r[2], move: r[3], chapters: r[4] ?? '' }));

  const m = matrixJson as { cells?: Record<string, number[]>; fallback?: number[]; _note?: string };
  return {
    parameters,
    principles,
    examples,
    matrix: m.cells ?? {},
    fallback: m.fallback ?? [1, 2, 24, 10, 35],
    matrixNote: m._note ?? '',
  };
}
