<script setup lang="ts">
// 缺口填补 TRIZ 导航：五步状态机。
// 每步的输入栏与完成条件对应 src/triz/procedure.ja.md；参数表、原理表、矩阵由构建时解析后经 props 传入。
// 状态存浏览器 localStorage（刷新不丢）；只上报事件，不上报文本。
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { flush, getSessionId, initLog, log } from '../../lib/log';
import type { TrizData } from '../../lib/triz-data';
import { labels, stepNames, type Loc } from './labels';

const props = defineProps<{
  locale: Loc;
  courseMode: boolean;
  triz: TrizData;
}>();

const STORE_KEY = 'navigator.state.v1';
const MAX_SELECTED = 3;

interface State {
  step: number;
  s1: { trouble: string; current: string; standard: string; ifr: string; constraints: string };
  s2: { improve: string; worsen: string; sentence: string; secondary: string };
  s3: { selected: number[]; apply: Record<number, string>; discarded: string };
  s4: { plan: string; residual: string; confidence: number | null; basis: string };
  s5: { next: string; confirmed: boolean };
}

function emptyState(): State {
  return {
    step: 0,
    s1: { trouble: '', current: '', standard: '', ifr: '', constraints: '' },
    s2: { improve: '', worsen: '', sentence: '', secondary: '' },
    s3: { selected: [], apply: {}, discarded: '' },
    s4: { plan: '', residual: '', confidence: null, basis: '' },
    s5: { next: '', confirmed: false },
  };
}

const st = reactive<State>(emptyState());
const l = computed(() => labels[props.locale]);
const names = computed(() => stepNames[props.locale]);
const isLast = computed(() => st.step === 4);

// ---------- 数据查找 ----------
const paramById = computed(() => Object.fromEntries(props.triz.parameters.map((p) => [p.id, p])));
const principleByNo = computed(() => Object.fromEntries(props.triz.principles.map((p) => [p.no, p])));

const matrixHit = computed(() => {
  const { improve, worsen } = st.s2;
  if (!improve || !worsen || improve === worsen) return null;
  const cell = props.triz.matrix[`${improve}|${worsen}`];
  return cell?.length ? { list: cell, fallback: false } : { list: props.triz.fallback, fallback: true };
});

const candidates = computed(() => (matrixHit.value?.list ?? []).map((n) => principleByNo.value[n]).filter(Boolean));
const otherPrinciples = computed(() => props.triz.principles.filter((p) => !(matrixHit.value?.list ?? []).includes(p.no)));
const selectedPrinciples = computed(() => st.s3.selected.map((n) => principleByNo.value[n]).filter(Boolean));

function paramLabel(id: string): string {
  const p = paramById.value[id];
  return p ? `${p.id} ${p.name}` : id;
}

// ---------- 完成条件（procedure.ja.md の「完了条件」） ----------
const filled = (s: string) => s.trim().length > 0;

const missing = computed<string[]>(() => {
  const m: string[] = [];
  const L = l.value;
  switch (st.step) {
    case 0:
      if (!filled(st.s1.trouble)) m.push(L.m_trouble);
      if (!filled(st.s1.standard)) m.push(L.m_standard);
      if (!filled(st.s1.ifr)) m.push(L.m_ifr);
      break;
    case 1:
      if (!st.s2.improve || !st.s2.worsen || st.s2.improve === st.s2.worsen) m.push(L.m_params);
      if (!filled(st.s2.sentence)) m.push(L.m_sentence);
      break;
    case 2: {
      const n = st.s3.selected.length;
      if (n < 1 || n > MAX_SELECTED) m.push(L.m_select);
      if (st.s3.selected.some((no) => !filled(st.s3.apply[no] ?? ''))) m.push(L.m_apply);
      const cands = matrixHit.value?.list ?? [];
      if (n > 0 && !st.s3.selected.some((no) => cands.includes(no)) && !filled(st.s3.discarded)) m.push(L.m_discard);
      break;
    }
    case 3: {
      const lines = st.s4.plan.split(/\n/).filter((x) => x.trim()).length;
      if (lines < 3) m.push(L.m_plan3);
      const mentions = st.s3.selected.some((no) => new RegExp(`(^|[^0-9])${no}([^0-9]|$)`).test(st.s4.plan));
      if (!mentions) m.push(L.m_planNo);
      const r = st.s4.residual.trim();
      if (!r || /^(なし|無し|ない|none|no|没有|无)$/i.test(r)) m.push(L.m_residual);
      if (st.s4.confidence === null) m.push(L.m_conf);
      break;
    }
    case 4:
      if (!filled(st.s5.next)) m.push(L.m_next);
      if (!st.s5.confirmed) m.push(L.m_confirm);
      break;
  }
  return m;
});

// ---------- 步骤切换与事件 ----------
let enteredAt = Date.now();
let restoring = false;

function stepChars(step: number): number {
  const parts: Record<number, string[]> = {
    0: Object.values(st.s1),
    1: [st.s2.sentence, st.s2.secondary],
    2: [...Object.values(st.s3.apply), st.s3.discarded],
    3: [st.s4.plan, st.s4.residual, st.s4.basis],
    4: [st.s5.next],
  };
  return (parts[step] ?? []).join('').length;
}

function go(delta: number) {
  if (delta > 0 && missing.value.length) return;
  const next = st.step + delta;
  if (next < 0 || next > 4) return;
  st.step = next;
}

watch(() => st.step, (next, prev) => {
  if (restoring) return;
  log('step_leave', prev, { chars: stepChars(prev), seconds: Math.round((Date.now() - enteredAt) / 1000) });
  enteredAt = Date.now();
  log('step_enter', next);
  aiText.value = '';
  aiNote.value = '';
  hintLevel.value = 0;
  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ---------- ② 参数与示例 ----------
function pickExample(i: number) {
  const ex = props.triz.examples[i];
  if (!ex) return;
  st.s2.improve = ex.improve;
  st.s2.worsen = ex.worsen;
  if (!filled(st.s2.sentence)) st.s2.sentence = ex.sentence;
}

// ---------- ③ 原理选择 ----------
function togglePrinciple(no: number) {
  const i = st.s3.selected.indexOf(no);
  if (i >= 0) {
    st.s3.selected.splice(i, 1);
    return;
  }
  if (st.s3.selected.length >= MAX_SELECTED) return;
  st.s3.selected.push(no);
  log('principle_select', 2, { principle: no });
}

const addOther = ref('');
watch(addOther, (v) => {
  const no = Number(v);
  if (no && !st.s3.selected.includes(no)) togglePrinciple(no);
  addOther.value = '';
});

// 矩阵候选变了（改了参数），清掉已不在候选里且没写当てはめ的选择
watch(() => matrixHit.value?.list.join(','), () => {
  st.s3.selected = st.s3.selected.filter((no) => (matrixHit.value?.list ?? []).includes(no) || filled(st.s3.apply[no] ?? ''));
});

// ---------- ④ 信心 ----------
function onConfidence(e: Event) {
  st.s4.confidence = Number((e.target as HTMLInputElement).value);
  log('confidence_set', 3, { value: st.s4.confidence });
}

// ---------- AI ----------
const hintLevel = ref(0);
const aiText = ref('');
const aiNote = ref('');
const busy = ref(false);
const history = ref<Array<{ role: 'user' | 'model'; text: string }>>([]);

const canAsk = computed(() => st.step < 4 && !(st.step === 3 && st.s4.confidence === null));

function stepInputText(): string {
  const L = l.value;
  switch (st.step) {
    case 0:
      return [
        `${L.trouble}: ${st.s1.trouble}`, `${L.current}: ${st.s1.current}`, `${L.standard}: ${st.s1.standard}`,
        `${L.ifr}: ${st.s1.ifr}`, `${L.constraints}: ${st.s1.constraints}`,
      ].join('\n');
    case 1:
      return [
        `${L.improve}: ${paramLabel(st.s2.improve)}`, `${L.worsen}: ${paramLabel(st.s2.worsen)}`,
        `${L.sentence}: ${st.s2.sentence}`, st.s2.secondary ? `${L.secondary}: ${st.s2.secondary}` : '',
      ].filter(Boolean).join('\n');
    case 2:
      return [
        `${L.candidates}: ${(matrixHit.value?.list ?? []).join(', ')}`,
        ...selectedPrinciples.value.map((p) => `${p.no} ${p.name}: ${st.s3.apply[p.no] ?? ''}`),
        st.s3.discarded ? `${L.discarded}: ${st.s3.discarded}` : '',
      ].filter(Boolean).join('\n');
    case 3:
      return [`${L.plan}:\n${st.s4.plan}`, `${L.residual}: ${st.s4.residual}`, `${L.basis}: ${st.s4.basis}`].join('\n');
    default:
      return '';
  }
}

function raiseHint() {
  if (hintLevel.value >= 3) return;
  hintLevel.value += 1;
  log('hint_escalate', st.step, { level: hintLevel.value as 1 | 2 | 3 });
}

async function ask() {
  if (!canAsk.value) return;
  const input = stepInputText().trim();
  if (!input) return;
  busy.value = true;
  aiNote.value = '';
  await flush();
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sessionId: getSessionId(),
        locale: props.locale,
        step: st.step,
        stepName: names.value[st.step],
        userInput: hintLevel.value ? `${input}\n\n[hint level: ${hintLevel.value}]` : input,
        confidence: st.step === 3 ? st.s4.confidence : undefined,
        history: history.value,
      }),
    });
    if (res.status === 429) { aiNote.value = l.value.quota; return; }
    if (res.status === 503) { aiNote.value = l.value.busy; return; }
    const data = (await res.json()) as { ok: boolean; text?: string; verifier?: string };
    if (!data.ok || !data.text) { aiNote.value = l.value.error; return; }
    aiText.value = data.text;
    if (data.verifier === 'rewritten') aiNote.value = l.value.rewritten;
    history.value.push({ role: 'user', text: input }, { role: 'model', text: data.text });
    history.value = history.value.slice(-10);
  } catch {
    aiNote.value = l.value.error;
  } finally {
    busy.value = false;
  }
}

// ---------- ⑤ 方案书 ----------
const brief = computed(() => {
  const L = l.value;
  const lines: string[] = [`# ${L.briefTitle}`, ''];
  lines.push(`## ${L.b_problem}`, '', `- ${L.trouble}: ${st.s1.trouble}`, `- ${L.current}: ${st.s1.current || '-'}`,
    `- ${L.standard}: ${st.s1.standard}`, `- ${L.ifr}: ${st.s1.ifr}`, `- ${L.constraints}: ${st.s1.constraints || '-'}`, '');
  lines.push(`## ${L.b_contradiction}`, '', `- ${paramLabel(st.s2.improve)} × ${paramLabel(st.s2.worsen)}`, `- ${st.s2.sentence}`);
  if (st.s2.secondary) lines.push(`- ${L.secondary}: ${st.s2.secondary}`);
  lines.push('', `## ${L.b_principles}`, '');
  for (const p of selectedPrinciples.value) lines.push(`- **${p.no} ${p.name}**: ${st.s3.apply[p.no] ?? ''}`);
  if (st.s3.discarded) lines.push(`- ${L.discarded}: ${st.s3.discarded}`);
  lines.push('', `## ${L.b_plan}`, '', st.s4.plan, '', `- ${L.b_residual}: ${st.s4.residual}`,
    `- ${L.b_conf}: ${st.s4.confidence ?? '-'}（${st.s4.basis || '-'}）`, '');
  const chapters = [...new Set(selectedPrinciples.value.map((p) => p.chapters).filter((c) => c && c !== '—'))];
  lines.push(`## ${L.b_chapters}`, '', ...(chapters.length ? chapters.map((c) => `- ${c}`) : ['-']), '');
  lines.push(`## ${L.b_next}`, '', st.s5.next || '-', '');
  return lines.join('\n');
});

const copiedNote = ref('');
async function copyBrief() {
  try {
    await navigator.clipboard.writeText(brief.value);
    copiedNote.value = l.value.copied;
    setTimeout(() => (copiedNote.value = ''), 2000);
    log('brief_export', 4, { format: 'md' });
  } catch { /* clipboard unavailable */ }
}

function downloadBrief() {
  const blob = new Blob([brief.value], { type: 'text/markdown;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gap-brief.md';
  a.click();
  URL.revokeObjectURL(a.href);
  log('brief_export', 4, { format: 'md' });
}

// ---------- 持久化与重置 ----------
const resetArmed = ref(false);
function reset() {
  if (!resetArmed.value) {
    resetArmed.value = true;
    setTimeout(() => (resetArmed.value = false), 4000);
    return;
  }
  Object.assign(st, emptyState());
  history.value = [];
  aiText.value = '';
  resetArmed.value = false;
}

onMounted(() => {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved) {
      restoring = true;
      Object.assign(st, { ...emptyState(), ...JSON.parse(saved) });
    }
  } catch { /* ignore */ }
  // 让恢复引起的 step 变化在下一拍之后再解除静默
  setTimeout(() => { restoring = false; enteredAt = Date.now(); }, 0);
  initLog({ locale: props.locale });
  log('step_enter', st.step);
  watch(st, (v) => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(v)); } catch { /* ignore */ }
  }, { deep: true });
});
</script>

<template>
  <section class="navigator">
    <p v-if="courseMode" class="note">{{ l.course }}</p>
    <p v-if="l.dataJaOnly" class="note">{{ l.dataJaOnly }}</p>

    <ol class="steps">
      <li v-for="(name, i) in names" :key="i" :class="{ active: i === st.step, done: i < st.step }">
        <span class="num">{{ i + 1 }}</span><span>{{ name }}</span>
      </li>
    </ol>

    <div class="panel">
      <h2>{{ names[st.step] }}</h2>

      <!-- ① 問題と IFR -->
      <template v-if="st.step === 0">
        <label class="field"><span>{{ l.trouble }} *</span><textarea v-model="st.s1.trouble" rows="3"></textarea></label>
        <label class="field"><span>{{ l.current }}</span><textarea v-model="st.s1.current" rows="2"></textarea></label>
        <label class="field"><span>{{ l.standard }} *</span><textarea v-model="st.s1.standard" rows="2"></textarea></label>
        <label class="field"><span>{{ l.ifr }} *</span><textarea v-model="st.s1.ifr" rows="2"></textarea></label>
        <label class="field"><span>{{ l.constraints }}</span><textarea v-model="st.s1.constraints" rows="2"></textarea></label>
      </template>

      <!-- ② 矛盾 -->
      <template v-else-if="st.step === 1">
        <details class="examples" v-if="triz.examples.length">
          <summary>{{ l.examples }}</summary>
          <ul>
            <li v-for="(ex, i) in triz.examples" :key="i">
              <button type="button" class="link" @click="pickExample(i)">
                {{ paramLabel(ex.improve) }} × {{ paramLabel(ex.worsen) }} — {{ ex.sentence }}
              </button>
            </li>
          </ul>
        </details>
        <div class="pair">
          <label class="field">
            <span>{{ l.improve }} *</span>
            <select v-model="st.s2.improve">
              <option value="">{{ l.choose }}</option>
              <option v-for="p in triz.parameters" :key="p.id" :value="p.id" :disabled="p.id === st.s2.worsen">{{ p.id }} {{ p.name }}</option>
            </select>
            <small v-if="paramById[st.s2.improve]">{{ paramById[st.s2.improve].definition }}<br />{{ l.improveMeans }}: {{ paramById[st.s2.improve].improvement }}</small>
          </label>
          <label class="field">
            <span>{{ l.worsen }} *</span>
            <select v-model="st.s2.worsen">
              <option value="">{{ l.choose }}</option>
              <option v-for="p in triz.parameters" :key="p.id" :value="p.id" :disabled="p.id === st.s2.improve">{{ p.id }} {{ p.name }}</option>
            </select>
            <small v-if="paramById[st.s2.worsen]">{{ paramById[st.s2.worsen].definition }}<br />{{ l.measure }}: {{ paramById[st.s2.worsen].measure }}</small>
          </label>
        </div>
        <label class="field"><span>{{ l.sentence }} *</span><textarea v-model="st.s2.sentence" rows="2"></textarea></label>
        <label class="field"><span>{{ l.secondary }}</span><textarea v-model="st.s2.secondary" rows="2"></textarea></label>
      </template>

      <!-- ③ 原理 -->
      <template v-else-if="st.step === 2">
        <p class="contradiction">{{ paramLabel(st.s2.improve) }} × {{ paramLabel(st.s2.worsen) }}</p>
        <h3>{{ l.candidates }} <small>（{{ l.selectHint }}）</small></h3>
        <p v-if="matrixHit?.fallback" class="note">{{ l.fallbackNote }}</p>
        <div class="cards">
          <button v-for="p in candidates" :key="p.no" type="button" class="card"
            :class="{ selected: st.s3.selected.includes(p.no) }" @click="togglePrinciple(p.no)">
            <strong>{{ p.no }} {{ p.name }}</strong>
            <span class="meaning">{{ p.meaning }}</span>
            <span>{{ p.move }}</span>
            <span v-if="p.chapters && p.chapters !== '—'" class="chapters">{{ l.chapters }}: {{ p.chapters }}</span>
          </button>
        </div>
        <label class="field">
          <span>{{ l.otherPrinciple }}</span>
          <select v-model="addOther" :disabled="st.s3.selected.length >= 3">
            <option value="">{{ l.choose }}</option>
            <option v-for="p in otherPrinciples" :key="p.no" :value="String(p.no)">{{ p.no }} {{ p.name }}</option>
          </select>
        </label>
        <div v-for="p in selectedPrinciples" :key="'apply' + p.no" class="apply">
          <label class="field">
            <span><strong>{{ p.no }} {{ p.name }}</strong> — {{ l.apply }} *
              <button type="button" class="link" @click="togglePrinciple(p.no)">✕</button></span>
            <textarea v-model="st.s3.apply[p.no]" rows="2"></textarea>
          </label>
        </div>
        <label class="field"><span>{{ l.discarded }}</span><textarea v-model="st.s3.discarded" rows="2"></textarea></label>
      </template>

      <!-- ④ 自案と確信度 -->
      <template v-else-if="st.step === 3">
        <label class="field"><span>{{ l.plan }} *</span><textarea v-model="st.s4.plan" rows="5"></textarea></label>
        <label class="field"><span>{{ l.residual }} *</span><textarea v-model="st.s4.residual" rows="2"></textarea></label>
        <label class="field">
          <span>{{ l.confidence }} *: <strong>{{ st.s4.confidence ?? l.confidenceUnset }}</strong></span>
          <input type="range" min="0" max="100" step="5" :value="st.s4.confidence ?? 50" @change="onConfidence" />
        </label>
        <label class="field"><span>{{ l.basis }}</span><textarea v-model="st.s4.basis" rows="2"></textarea></label>
      </template>

      <!-- ⑤ 方案書 -->
      <template v-else>
        <pre class="brief">{{ brief }}</pre>
        <label class="field"><span>{{ l.nextResearch }} *</span><textarea v-model="st.s5.next" rows="2"></textarea></label>
        <label class="check"><input type="checkbox" v-model="st.s5.confirmed" /> {{ l.confirmed }}</label>
        <p class="ai-controls">
          <button type="button" class="primary" :disabled="missing.length > 0" @click="copyBrief">{{ l.copy }}</button>
          <button type="button" :disabled="missing.length > 0" @click="downloadBrief">{{ l.download }}</button>
          <span class="note">{{ copiedNote }}</span>
        </p>
      </template>

      <!-- AI -->
      <div v-if="st.step < 4" class="ai">
        <p class="ai-controls">
          <button type="button" class="primary" :disabled="busy || !canAsk" @click="ask">{{ busy ? l.asking : l.ask }}</button>
          <button type="button" :disabled="busy || hintLevel >= 3" @click="raiseHint">{{ l.hint }} ({{ hintLevel }}/3)</button>
        </p>
        <p v-if="st.step === 3 && st.s4.confidence === null" class="note">{{ l.askNeedsConfidence }}</p>
        <p v-if="aiNote" class="note">{{ aiNote }}</p>
        <blockquote v-if="aiText" class="ai-text">{{ aiText }}</blockquote>
      </div>
    </div>

    <div v-if="missing.length && !isLast" class="missing">
      <span>{{ l.missing }}</span>
      <ul><li v-for="m in missing" :key="m">{{ m }}</li></ul>
    </div>

    <p class="controls">
      <button type="button" @click="go(-1)" :disabled="st.step === 0">{{ l.back }}</button>
      <button type="button" class="primary" @click="go(1)" :disabled="isLast || missing.length > 0">{{ l.next }}</button>
      <span class="spacer"></span>
      <button type="button" class="link" @click="reset">{{ resetArmed ? l.resetConfirm : l.reset }}</button>
    </p>
  </section>
</template>

<style scoped>
  .navigator { margin-top: 2rem; }
  .note { font-size: 0.85rem; color: var(--muted); border-left: 3px solid var(--accent); padding-left: 0.75rem; }
  .steps { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: 0.5rem; margin: 1.5rem 0; }
  .steps li { display: flex; gap: 0.5rem; align-items: center; padding: 0.5rem 0.6rem; border: 1px solid var(--line); border-radius: 0.4rem; font-size: 0.9rem; color: var(--muted); }
  .steps li.active { border-color: var(--accent); color: var(--fg); }
  .steps li.done { color: var(--fg); }
  .num { display: inline-grid; place-items: center; width: 1.6rem; height: 1.6rem; border-radius: 50%; background: var(--line); font-size: 0.8rem; flex: none; }
  .active .num { background: var(--accent); color: #fff; }
  .field { display: block; margin: 1rem 0; }
  .field > span { display: block; font-size: 0.9rem; margin-bottom: 0.3rem; }
  .field small { display: block; color: var(--muted); margin-top: 0.4rem; font-size: 0.8rem; line-height: 1.5; }
  textarea, select { width: 100%; font: inherit; padding: 0.55rem; border: 1px solid var(--line); border-radius: 0.4rem; background: transparent; color: var(--fg); }
  select option { color: #000; }
  .pair { display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 1rem; }
  .examples summary { cursor: pointer; color: var(--accent); }
  .examples ul { padding-left: 1rem; }
  .contradiction { font-weight: 600; }
  h3 small { font-weight: normal; color: var(--muted); font-size: 0.8rem; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: 0.75rem; }
  .card { text-align: left; display: flex; flex-direction: column; gap: 0.35rem; padding: 0.8rem; border: 1px solid var(--line); border-radius: 0.5rem; background: transparent; color: var(--fg); cursor: pointer; font: inherit; font-size: 0.88rem; line-height: 1.55; }
  .card.selected { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent) inset; }
  .card .meaning { color: var(--muted); }
  .card .chapters { color: var(--muted); font-size: 0.8rem; }
  .apply { border-left: 3px solid var(--accent); padding-left: 0.75rem; }
  .brief { white-space: pre-wrap; background: color-mix(in srgb, var(--accent) 5%, transparent); border: 1px solid var(--line); border-radius: 0.4rem; padding: 1rem; font-size: 0.85rem; max-height: 28rem; overflow: auto; }
  .check { display: flex; gap: 0.5rem; align-items: center; margin: 0.75rem 0; }
  .ai { margin-top: 1.5rem; border-top: 1px dashed var(--line); padding-top: 0.5rem; }
  .ai-controls { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; margin-top: 1rem; }
  .ai-text { margin: 1rem 0; padding: 0.8rem 1rem; border-left: 3px solid var(--accent); background: color-mix(in srgb, var(--accent) 6%, transparent); white-space: pre-wrap; }
  .missing { margin-top: 1rem; font-size: 0.85rem; color: var(--muted); }
  .missing ul { margin: 0.25rem 0 0; padding-left: 1.2rem; }
  .controls { display: flex; gap: 0.75rem; margin-top: 1.5rem; align-items: center; }
  .spacer { flex: 1; }
  button { font: inherit; padding: 0.55rem 1.2rem; border-radius: 0.4rem; border: 1px solid var(--line); background: transparent; color: var(--fg); cursor: pointer; }
  button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
  button.link { border: none; padding: 0 0.25rem; color: var(--accent); text-decoration: underline; background: none; }
  button:disabled { opacity: 0.4; cursor: default; }
</style>
