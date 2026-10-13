<script setup lang="ts">
// 缺口填补 TRIZ 导航：五步状态机 + 事件埋点 + 第 4 步的 AI 反馈（回答者 + 检验者）。
// 流程文案、参数表、原理表来自 src/triz/；本文件只管流转、状态与调用。
import { computed, onMounted, ref, watch } from 'vue';
import { flush, getSessionId, initLog, log } from '../../lib/log';

const props = defineProps<{
  locale: 'ja' | 'en' | 'zh';
  courseMode: boolean;
}>();

const steps = {
  ja: ['問題と理想の最終結果', '矛盾の特定', '発明原理の候補', '自分の案と確信度', '方案書'],
  en: ['Problem & ideal final result', 'Identify the contradiction', 'Candidate principles', 'Your plan & confidence', 'Solution brief'],
  zh: ['问题与理想最终结果', '识别矛盾', '候选发明原理', '你的方案与信心', '方案书'],
} as const;

const labels = {
  ja: {
    next: '次へ', back: '戻る', placeholder: 'ここに入力', confidence: '確信度',
    ask: 'AIに問いを立ててもらう', asking: '考え中…', hint: 'ヒントを一段上げる',
    course: '授業モード：この画面の操作はイベントとして記録されます（入力内容は記録しません）。',
    needPlan: '先に自分の案を書いてください。AIはそれを読んでから問いを返します。',
    rewritten: '（検証器が回答を問いの形に書き直しました）', error: 'AIの呼び出しに失敗しました。',
    quota: '本日の利用枠に達しました。', export: '方案書をコピー',
  },
  en: {
    next: 'Next', back: 'Back', placeholder: 'Type here', confidence: 'Confidence',
    ask: 'Ask the AI for questions', asking: 'Thinking…', hint: 'Raise the hint level',
    course: 'Course mode: your actions on this screen are logged as events (your text is not).',
    needPlan: 'Write your own plan first. The AI reads it and answers with questions.',
    rewritten: '(the checker rewrote the answer into questions)', error: 'The AI call failed.',
    quota: 'The daily quota has been reached.', export: 'Copy the brief',
  },
  zh: {
    next: '下一步', back: '上一步', placeholder: '在此输入', confidence: '信心',
    ask: '让 AI 提问', asking: '思考中…', hint: '提升一级提示',
    course: '课程模式：本页操作会作为事件记录（不记录输入内容）。',
    needPlan: '请先写下你自己的方案。AI 读过之后才会用提问回应。',
    rewritten: '（检验者把回答改写成了提问）', error: 'AI 调用失败。',
    quota: '今日额度已用完。', export: '复制方案书',
  },
} as const;

const current = ref(0);
const answers = ref<string[]>(Array(5).fill(''));
const confidence = ref(50);
const hintLevel = ref(0);
const aiText = ref('');
const aiNote = ref('');
const busy = ref(false);
const history = ref<Array<{ role: 'user' | 'model'; text: string }>>([]);
let enteredAt = Date.now();

const stepNames = computed(() => steps[props.locale]);
const l = computed(() => labels[props.locale]);
const isLast = computed(() => current.value === stepNames.value.length - 1);

onMounted(() => {
  initLog({ locale: props.locale });
  log('step_enter', 0);
});

watch(current, (next, prev) => {
  log('step_leave', prev, { chars: answers.value[prev].length, seconds: Math.round((Date.now() - enteredAt) / 1000) });
  enteredAt = Date.now();
  log('step_enter', next);
  aiText.value = '';
  aiNote.value = '';
  hintLevel.value = 0;
});

function go(delta: number) {
  const next = current.value + delta;
  if (next < 0 || next >= stepNames.value.length) return;
  current.value = next;
}

function setConfidence() {
  log('confidence_set', current.value, { value: confidence.value });
}

function raiseHint() {
  if (hintLevel.value >= 3) return;
  hintLevel.value += 1;
  log('hint_escalate', current.value, { level: hintLevel.value as 1 | 2 | 3 });
}

async function ask() {
  const input = answers.value[current.value].trim();
  if (!input) { aiNote.value = l.value.needPlan; return; }
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
        step: current.value,
        stepName: stepNames.value[current.value],
        userInput: hintLevel.value ? `${input}\n\n[hint level: ${hintLevel.value}]` : input,
        confidence: current.value === 3 ? confidence.value : undefined,
        history: history.value,
      }),
    });
    const data = (await res.json()) as { ok: boolean; text?: string; verifier?: string; error?: string };
    if (res.status === 429) { aiNote.value = l.value.quota; return; }
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

async function copyBrief() {
  const lines = stepNames.value.map((name, i) => `## ${name}\n\n${answers.value[i] || '-'}\n`);
  lines.push(`\n${l.value.confidence}: ${confidence.value}`);
  try {
    await navigator.clipboard.writeText(lines.join('\n'));
    log('brief_export', 4, { format: 'md' });
  } catch { /* clipboard unavailable */ }
}
</script>

<template>
  <section class="navigator">
    <p v-if="courseMode" class="course-note">{{ l.course }}</p>

    <ol class="steps">
      <li v-for="(name, i) in stepNames" :key="i" :class="{ active: i === current, done: i < current }">
        <span class="num">{{ i + 1 }}</span>
        <span>{{ name }}</span>
      </li>
    </ol>

    <div class="panel">
      <h2>{{ stepNames[current] }}</h2>
      <textarea v-model="answers[current]" :placeholder="l.placeholder" rows="6"></textarea>
      <label v-if="current === 3" class="confidence">
        {{ l.confidence }}: <strong>{{ confidence }}</strong>
        <input v-model.number="confidence" type="range" min="0" max="100" @change="setConfidence" />
      </label>

      <p class="ai-controls" v-if="!isLast">
        <button type="button" class="primary" :disabled="busy" @click="ask">{{ busy ? l.asking : l.ask }}</button>
        <button type="button" :disabled="busy || hintLevel >= 3" @click="raiseHint">{{ l.hint }} ({{ hintLevel }}/3)</button>
      </p>
      <p v-if="aiNote" class="ai-note">{{ aiNote }}</p>
      <blockquote v-if="aiText" class="ai-text">{{ aiText }}</blockquote>

      <p v-if="isLast" class="ai-controls">
        <button type="button" class="primary" @click="copyBrief">{{ l.export }}</button>
      </p>
    </div>

    <p class="controls">
      <button type="button" @click="go(-1)" :disabled="current === 0">{{ l.back }}</button>
      <button type="button" class="primary" @click="go(1)" :disabled="isLast">{{ l.next }}</button>
    </p>
  </section>
</template>

<style scoped>
  .navigator { margin-top: 2rem; }
  .course-note { font-size: 0.85rem; color: var(--muted); border-left: 3px solid var(--accent); padding-left: 0.75rem; }
  .steps { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: 0.5rem; margin: 1.5rem 0; }
  .steps li { display: flex; gap: 0.5rem; align-items: center; padding: 0.5rem 0.6rem; border: 1px solid var(--line); border-radius: 0.4rem; font-size: 0.9rem; color: var(--muted); }
  .steps li.active { border-color: var(--accent); color: var(--fg); }
  .steps li.done { color: var(--fg); }
  .num { display: inline-grid; place-items: center; width: 1.6rem; height: 1.6rem; border-radius: 50%; background: var(--line); font-size: 0.8rem; }
  .active .num { background: var(--accent); color: #fff; }
  .panel textarea { width: 100%; font: inherit; padding: 0.6rem; border: 1px solid var(--line); border-radius: 0.4rem; background: transparent; color: var(--fg); }
  .confidence { display: block; margin-top: 1rem; }
  .confidence input { width: 100%; }
  .ai-controls { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1rem; }
  .ai-note { font-size: 0.85rem; color: var(--muted); }
  .ai-text { margin: 1rem 0; padding: 0.8rem 1rem; border-left: 3px solid var(--accent); background: color-mix(in srgb, var(--accent) 6%, transparent); white-space: pre-wrap; }
  .controls { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
  button { font: inherit; padding: 0.55rem 1.2rem; border-radius: 0.4rem; border: 1px solid var(--line); background: transparent; color: var(--fg); cursor: pointer; }
  button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
  button:disabled { opacity: 0.4; cursor: default; }
</style>
