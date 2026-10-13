// 导航界面的三语文案。字段名与完成条件对应 src/triz/procedure.ja.md。

export type Loc = 'ja' | 'en' | 'zh';

export const stepNames: Record<Loc, string[]> = {
  ja: ['問題と理想の最終結果', '矛盾の特定', '発明原理の候補', '自分の案と確信度', '方案書'],
  en: ['Problem & ideal final result', 'Identify the contradiction', 'Candidate principles', 'Your plan & confidence', 'Solution brief'],
  zh: ['问题与理想最终结果', '识别矛盾', '候选发明原理', '你的方案与信心', '方案书'],
};

const ja = {
  next: '次へ', back: '戻る', reset: '最初からやり直す', resetConfirm: 'もう一度押すと入力をすべて消します',
  ask: 'AIに問いを立ててもらう', asking: '考え中…', hint: 'ヒントを一段上げる',
  course: '授業モード：この画面の操作はイベントとして記録されます（入力内容は記録しません）。',
  rewritten: '（検証器が回答を問いの形に書き直しました）', error: 'AIの呼び出しに失敗しました。',
  quota: '本日の利用枠に達しました。', busy: 'AI が混み合っています。少し時間をおいてもう一度試してください。',
  missing: '次へ進む前に：', dataJaOnly: '',
  // ①
  trouble: '困りごと（誰が、どの業務で、何に困っているか）', current: '現状の対処',
  standard: '標準機能の到達点', ifr: '理想の最終結果（「何も追加せずに、〜している」）', constraints: '制約（変えられないもの）',
  // ②
  improve: '改善したいパラメーター', worsen: 'それで悪化するパラメーター', choose: '選んでください',
  sentence: '矛盾文（「〜を良くするために〜すると、〜が悪くなる」）', secondary: '副矛盾（任意）',
  examples: '本書の典型的な矛盾から選ぶ', improveMeans: '改善とは', measure: '測り方',
  // ③
  candidates: '矛盾矩阵の候補', fallbackNote: '矩阵に該当なし：汎用候補を表示しています',
  otherPrinciple: '候補外の原理を加える', apply: 'この問題に使うなら、何を何に分ける／出す／挟むのか',
  discarded: '採らなかった候補とその理由', chapters: '本の該当章', selectHint: '1〜3 個選んでください',
  // ④
  plan: '自案（3 行以上。どの原理を使い、何をどう変えるか、誰が運用するか）', residual: '残る悪化（どの程度残り、どう受け入れるか）',
  confidence: '確信度（この案が実務で通ると思う度合い）', confidenceUnset: '未入力', basis: '確信度の根拠',
  askNeedsConfidence: '確信度を入力すると AI の対照が使えます',
  // ⑤
  nextResearch: '次に調べること', confirmed: '自動で埋まった欄を確認しました', copy: 'コピー', download: 'Markdown で保存',
  copied: 'コピーしました',
  // 完成条件
  m_trouble: '困りごとを書く', m_standard: '標準機能の到達点を書く', m_ifr: '理想の最終結果を書く',
  m_params: '改善と悪化のパラメーターを別々に選ぶ', m_sentence: '矛盾文を書く',
  m_select: '原理を 1〜3 個選ぶ', m_apply: '選んだ原理ごとに当てはめを書く', m_discard: '候補を全部捨てた理由を書く',
  m_plan3: '自案を 3 行以上書く', m_planNo: '自案に使う原理の番号を書く', m_residual: '残る悪化を書く（「なし」は不可）', m_conf: '確信度を入力する',
  m_next: '次に調べることを書く', m_confirm: '確認済みにチェックする',
  // 方案书
  briefTitle: 'ギャップ補完方案書', b_problem: '問題と理想の最終結果', b_contradiction: '主矛盾', b_principles: '使った原理と当てはめ',
  b_plan: '自案', b_residual: '残る悪化', b_conf: '確信度', b_chapters: '本の該当章', b_next: '次に調べること',
};

type Labels = typeof ja;

const en: Labels = {
  ...ja,
  next: 'Next', back: 'Back', reset: 'Start over', resetConfirm: 'Press again to clear everything',
  ask: 'Ask the AI for questions', asking: 'Thinking…', hint: 'Raise the hint level',
  course: 'Course mode: your actions on this screen are logged as events (your text is not).',
  rewritten: '(the checker rewrote the answer into questions)', error: 'The AI call failed.',
  quota: 'The daily quota has been reached.', busy: 'The AI is busy right now. Please try again in a moment.',
  missing: 'Before moving on:', dataJaOnly: 'The parameter and principle tables are in Japanese for now.',
  trouble: 'The trouble (who, in which process, struggles with what)', current: 'How it is handled today',
  standard: 'What the standard features already do', ifr: 'Ideal final result ("without adding anything, … is happening")', constraints: 'Constraints (what cannot change)',
  improve: 'Parameter to improve', worsen: 'Parameter that gets worse', choose: 'Choose',
  sentence: 'Contradiction ("to improve …, doing … makes … worse")', secondary: 'Secondary contradiction (optional)',
  examples: 'Pick a typical contradiction from the book', improveMeans: 'Improving means', measure: 'How to measure',
  candidates: 'Candidates from the contradiction matrix', fallbackNote: 'No matrix entry: showing general-purpose candidates',
  otherPrinciple: 'Add a principle outside the candidates', apply: 'Applied to your problem: what do you split / extract / put in between?',
  discarded: 'Candidates you did not take, and why', chapters: 'Chapters in the book', selectHint: 'Choose 1 to 3',
  plan: 'Your plan (3+ lines: which principle, what changes, who runs it)', residual: 'What stays worse (how much, how you accept it)',
  confidence: 'Confidence (how likely this works in practice)', confidenceUnset: 'not set', basis: 'Why this confidence',
  askNeedsConfidence: 'Set your confidence to unlock the AI comparison',
  nextResearch: 'What to look into next', confirmed: 'I have checked the auto-filled fields', copy: 'Copy', download: 'Save as Markdown', copied: 'Copied',
  m_trouble: 'describe the trouble', m_standard: 'describe what the standard features do', m_ifr: 'write the ideal final result',
  m_params: 'choose two different parameters', m_sentence: 'write the contradiction',
  m_select: 'choose 1–3 principles', m_apply: 'apply each chosen principle', m_discard: 'say why you dropped all candidates',
  m_plan3: 'write at least 3 lines', m_planNo: 'mention the principle number you use', m_residual: 'say what stays worse ("none" is not allowed)', m_conf: 'set your confidence',
  m_next: 'write what to look into next', m_confirm: 'tick the confirmation box',
  briefTitle: 'Gap-filling brief', b_problem: 'Problem and ideal final result', b_contradiction: 'Main contradiction', b_principles: 'Principles applied',
  b_plan: 'Plan', b_residual: 'What stays worse', b_conf: 'Confidence', b_chapters: 'Chapters in the book', b_next: 'Next to look into',
};

const zh: Labels = {
  ...ja,
  next: '下一步', back: '上一步', reset: '重新开始', resetConfirm: '再按一次会清空全部输入',
  ask: '让 AI 提问', asking: '思考中…', hint: '提升一级提示',
  course: '课程模式：本页操作会作为事件记录（不记录输入内容）。',
  rewritten: '（检验者把回答改写成了提问）', error: 'AI 调用失败。',
  quota: '今日额度已用完。', busy: 'AI 当前繁忙，请稍后再试。',
  missing: '进入下一步之前：', dataJaOnly: '参数表与原理表目前只有日文。',
  trouble: '困扰（谁、在哪个业务里、被什么困住）', current: '现在怎么应付',
  standard: '标准功能能做到哪里', ifr: '理想最终结果（「什么都不加，就已经……」）', constraints: '约束（不能改变的东西）',
  improve: '要改善的参数', worsen: '随之变差的参数', choose: '请选择',
  sentence: '矛盾句（「为了改善……而……，结果……变差」）', secondary: '次要矛盾（可选）',
  examples: '从书中的典型矛盾里选', improveMeans: '改善是指', measure: '衡量方式',
  candidates: '矛盾矩阵给出的候选', fallbackNote: '矩阵中没有这一格：显示通用候选',
  otherPrinciple: '加入候选以外的原理', apply: '用在你的问题上：把什么分开／取出／隔开？',
  discarded: '没采用的候选及理由', chapters: '书中对应章节', selectHint: '选 1～3 个',
  plan: '你的方案（3 行以上：用哪条原理、改什么、谁来运营）', residual: '仍会变差的部分（到什么程度、怎么接受）',
  confidence: '信心（你认为这个方案在实务中行得通的程度）', confidenceUnset: '未填', basis: '信心的理由',
  askNeedsConfidence: '填好信心后才能让 AI 对照',
  nextResearch: '接下来要查的事', confirmed: '已确认自动填入的各栏', copy: '复制', download: '保存为 Markdown', copied: '已复制',
  m_trouble: '写下困扰', m_standard: '写下标准功能能做到哪里', m_ifr: '写下理想最终结果',
  m_params: '分别选择改善与变差的参数', m_sentence: '写下矛盾句',
  m_select: '选 1～3 条原理', m_apply: '为每条原理写出应用', m_discard: '写下全部舍弃候选的理由',
  m_plan3: '方案至少写 3 行', m_planNo: '在方案里写出所用原理的编号', m_residual: '写下仍会变差的部分（不能写「没有」）', m_conf: '填写信心',
  m_next: '写下接下来要查的事', m_confirm: '勾选确认',
  briefTitle: '缺口填补方案书', b_problem: '问题与理想最终结果', b_contradiction: '主要矛盾', b_principles: '所用原理及应用',
  b_plan: '方案', b_residual: '仍会变差的部分', b_conf: '信心', b_chapters: '书中对应章节', b_next: '接下来要查的事',
};

export const labels: Record<Loc, Labels> = { ja, en, zh };
export type { Labels };
