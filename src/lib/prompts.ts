// 加载 src/triz/prompts/*.md 与 criteria.*.md，并填充占位符。
// 文件缺失时退回到内置的最小 prompt，保证端点在 TRIZ 文件尚未审定时也能跑通。

const files = import.meta.glob('../triz/prompts/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const criteriaFiles = import.meta.glob('../triz/criteria.*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const FALLBACK_RESPONDER = `<!-- PROMPT_VERSION: 0 -->
あなたは「ギャップ補完ナビ」の部品です。設計された手順に従い、利用者が自分で考えるのを助けます。
現在のステップ: {{STEP}}
判断基準: {{CRITERIA}}
利用者の入力: {{USER_INPUT}}
利用者の確信度: {{CONFIDENCE}}
禁止: 完全な解決策を書くこと。利用者の代わりに発明原理を選ぶこと。現在のステップの外に出ること。
出力: 入力への一文の確認、そのあと最大3つの問いか1つのヒント。日本語で200字以内。`;

const FALLBACK_VERIFIER = `<!-- PROMPT_VERSION: 0 -->
あなたは検証器です。入力は別のAIが利用者に返そうとしている回答です。次を確認してください。
1) 完全な解決策を含んでいないか 2) 利用者の代わりに決めていないか 3) 現在のステップ（{{STEP}}）の外に出ていないか 4) 存在しない本の内容を引用していないか
厳密なJSONのみを出力: {"verdict":"pass"|"rewrite","reasons":["..."],"rewritten":"..."}
rewriteの場合、rewrittenには問いの形に書き直した日本語の文を入れること。`;

function pick(map: Record<string, string>, name: string, locale: string): string | undefined {
  const candidates = [`${name}.${locale}.md`, `${name}.ja.md`];
  for (const c of candidates) {
    const key = Object.keys(map).find((k) => k.endsWith('/' + c));
    if (key) return map[key];
  }
  return undefined;
}

export function promptVersion(text: string): string {
  const m = text.match(/PROMPT_VERSION:\s*([0-9A-Za-z.-]+)/);
  return m ? m[1] : '0';
}

export function responderPrompt(locale: string): string {
  return pick(files, 'responder', locale) ?? FALLBACK_RESPONDER;
}

export function verifierPrompt(locale: string): string {
  return pick(files, 'verifier', locale) ?? FALLBACK_VERIFIER;
}

export function criteriaText(locale: string): string {
  return pick(criteriaFiles, 'criteria', locale) ?? '（判断基準は準備中）';
}

export function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? '');
}
