// 书的介绍内容（三语）。日文、英文的章名取自书稿术语表的「章名対照」；中文章名为网站暂定译名，书稿定稿后同步。
// 文案尽量取自序章原文；书名未定，营销关键词「SAP運用最前線」先作为眉标使用。

import type { Locale } from '../i18n/ui';

type T = Record<Locale, string>;

export const kicker: T = {
  ja: 'SAP運用最前線',
  en: 'The front line of SAP in practice',
  zh: 'SAP 运用最前沿',
};

export const headline: T = {
  ja: '正本はコアにある。\nAIで、入口は増える。',
  en: 'The truth lives in the core.\nAI multiplies the ways in.',
  zh: '正本在核心。\nAI 让入口越来越多。',
};

export const lead: T = {
  ja: 'フォームに入力する人も、バッチも、普通の言葉で質問を受けたエージェントも。どの入口から来た意図も、最後はコアの同じ検証にたどり着かなければならない。AI時代にSAP S/4HANAの上で作り、つなぎ、動かすための実践書。',
  en: 'A person at a form, a batch file, an agent asked a question in plain words: wherever an intent comes from, it must end at the same validation in the core. A practical book on building on, connecting to and automating SAP S/4HANA in the age of AI.',
  zh: '无论是填表的人、批处理，还是被人用日常语言提问的智能体，任何入口来的意图，最后都必须走到核心的同一道校验。一本讲 AI 时代如何在 SAP S/4HANA 之上开发、连接与自动化的实践书。',
};

export const flow: T = {
  ja: '意図 → 検証 → コアの正本',
  en: 'Intent → Validation → The core’s record of truth',
  zh: '意图 → 校验 → 核心中的正本',
};

export const ridge: T = {
  ja: '片側には青い海と空、もう片側には赤い煉瓦と古い城壁。尾根に立てば、両側の景色が同時に見える。新しいチャネルと、変わらない原則。その両方を一度に見て、どうつながるかを語る本です。',
  en: 'On one side, blue sea and sky; on the other, red brick and old walls. From the ridge you see both at once. New channels and the principles that do not change: this book looks at both together and says how they connect.',
  zh: '一侧是蓝色的海和天，另一侧是红砖与老城墙。站在山脊上，两边的风景同时看得见。新的通道，不变的原则——这本书同时看着两边，讲清楚它们如何相连。',
};

export const questions: Record<Locale, Array<{ title: string; body: string }>> = {
  ja: [
    { title: 'AIは、製品がすでに持つ機能の使われ方をどう変えるのか', body: '機能そのものは変わらない。変わるのは、誰が操作するか。熟練者の使い方は、AIがたどれる手順に蒸留できる。' },
    { title: '製品が足りないとき、その隙間をどう埋めるべきか', body: '標準の採用から、設定、拡張、隣のアプリケーション、統合、画面の自動化まで。埋められるかではなく、どの段で埋めるべきか。' },
  ],
  en: [
    { title: 'How does AI change the way existing product features are used?', body: 'The features stay the same; who operates them changes. How experienced staff use the system can be distilled into procedures an AI can follow.' },
    { title: 'When the product falls short, how should the gap be filled?', body: 'From adopting the standard, through configuration, extensions, side-by-side apps and integration, to screen automation. The question is no longer whether, but at which rung.' },
  ],
  zh: [
    { title: 'AI 如何改变产品现有功能的用法？', body: '功能本身不变，变的是谁来操作。老员工怎么用系统，可以蒸馏成 AI 能照着做的步骤。' },
    { title: '产品不够用时，缺口该怎么填？', body: '从采用标准流程，到配置、扩展、旁挂应用、集成，再到画面自动化。问题不再是能不能填，而是该在哪一级填。' },
  ],
};

export const channels: Record<Locale, string[]> = {
  ja: ['製品本来のUI', 'リリース済みインターフェース', 'イベント・データ・ファイル', 'ベンダーのエージェント', 'MCPツール', 'スキル', 'ブラウザ／GUIエージェント'],
  en: ['The product’s own UI', 'Released interfaces', 'Events, data, files', 'Vendor agents', 'MCP tools', 'Skills', 'Browser / GUI agents'],
  zh: ['产品原生界面', '已发布接口', '事件、数据、文件', '厂商智能体', 'MCP 工具', '技能（Skills）', '浏览器／GUI 智能体'],
};

export interface Chapter { no: string; title: T; built: boolean; slug?: string }
export interface Volume { title: T; summary: T }
export interface Part { volume: 1 | 2; title: T; summary: T; chapters: Chapter[] }

const ch = (no: string, ja: string, en: string, zh: string, built = true, slug?: string): Chapter => ({ no, title: { ja, en, zh }, built, slug });

// 章号为书稿的文件号（2026-10-14 起的上下两卷结构），读者章号在排版时另定。
export const intro: Chapter = ch('00', '序章', 'Book Introduction', '序章', true, 'preface');

export const volumes: Record<1 | 2, Volume> = {
  1: {
    title: { ja: '上巻', en: 'Volume One', zh: '上卷' },
    summary: {
      ja: 'AIが仕事の経済性を変える前に、私たちがコアの周りでどう作っていたかの記録。原則は、この手順の中から生まれた。',
      en: 'How we built around the core before AI changed the economics of the work. The principles came out of these steps.',
      zh: '在 AI 改变工作的经济性之前，我们如何围绕核心构建的记录。原则正是从这些步骤里长出来的。',
    },
  },
  2: {
    title: { ja: '下巻', en: 'Volume Two', zh: '下卷' },
    summary: {
      ja: 'AIが来てから何が変わり、何が変わらなかったかの記録。変わったのは道具の側で、コアが差し出す契約は変わっていない。',
      en: 'What changed after AI arrived, and what did not. The tools changed; the contract the core offers did not.',
      zh: 'AI 到来之后，什么变了、什么没变的记录。变的是工具，核心给出的契约没有变。',
    },
  },
};

export const parts: Part[] = [
  {
    volume: 1,
    title: { ja: '第一部 基礎：コアを理解する', en: 'Part One — Foundations: Understanding the Core', zh: '第一部 基础：理解核心' },
    summary: {
      ja: 'コアの性質と原則を押さえる。入口の種類、主事例「原価センタ」、全書を貫く原則。',
      en: 'The nature of the core and its principles: the ways in, the main case of cost centers, and the principle that runs through the book.',
      zh: '把握核心的性质与原则：入口的种类、主案例「成本中心」、贯穿全书的原则。',
    },
    chapters: [
      ch('12', 'コアと、そこへ至る道', 'The Core and the Ways In', '核心，以及通往它的路', true, 'core-and-ways-in'),
      ch('13', 'コアとともに生きる', 'Living With the Core', '与核心共处'),
      ch('14', '主事例：原価センタ', 'The Main Case: Cost Centers', '主案例：成本中心'),
      ch('15', '原則：正本はコアにある', 'Principles: Truth Lives in the Core', '原则：正本在核心'),
    ],
  },
  {
    volume: 1,
    title: { ja: '第二部 主チャネルを一歩ずつ', en: 'Part Two — The Main Channel, Step by Step', zh: '第二部 一步一步走通主通道' },
    summary: {
      ja: '主事例を完全な形で組み立てる。各章は、動くものができあがったところで終わる。',
      en: 'The main case, built in full. Each chapter ends when something works.',
      zh: '把主案例完整地搭出来。每一章都在做出能跑的东西时结束。',
    },
    chapters: [
      ch('21', 'インターフェースの発見', 'Discovering the Interfaces', '发现接口'),
      ch('22', '環境の構築', 'Setting Up the Environment', '搭建环境'),
      ch('23', '最初の読み取り：スモークテストからスキーマまで', 'First Read: From Smoke Test to Schema', '第一次读取：从冒烟测试到模式'),
      ch('24', '最初の書き込み：意図、チェック、コミット', 'First Write: Intent, Check, Commit', '第一次写入：意图、校验、提交'),
      ch('25', 'アプリケーション：フロントエンド、バックエンド、Excel', 'The Application: Frontend, Backend, and Excel', '应用：前端、后端与 Excel'),
      ch('26', '証跡、監査、そして原価センタの先へ', 'Evidence, Audit, and Beyond Cost Centers', '证据、审计，以及成本中心之外'),
    ],
  },
  {
    volume: 2,
    title: { ja: '第三部 AI時代の新しいチャネル', en: 'Part Three — New Channels in the Age of AI', zh: '第三部 AI 时代的新通道' },
    summary: {
      ja: 'エージェントの前提から、インターフェースに乗るチャネル、画面に向かうチャネル、ノウハウを渡すスキル、非同期のチャネルへ。',
      en: 'From what agents assume, through channels on interfaces and at the screen, to skills that carry know-how and the asynchronous channels.',
      zh: '从智能体的前提出发，经过走接口的通道、面向屏幕的通道、传递诀窍的技能，到异步通道。',
    },
    chapters: [
      ch('32', 'エージェントがコアに触れる前に', 'Before Agents Touch the Core', '在智能体触碰核心之前'),
      ch('33', 'MCP：コアをエージェントのツールとして公開する', 'MCP: Exposing the Core as Tools for Agents', 'MCP：把核心作为工具开放给智能体'),
      ch('34', '画面の前のエージェント', 'Agents at the Screen: Browser and GUI Automation', '屏幕前的智能体'),
      ch('35', 'スキル：コアシステムのノウハウをエージェントに渡す', 'Skills: Packaging Core-System Know-How for Agents', '技能：把核心系统的诀窍交给智能体', false),
      ch('36', 'イベント、データ、その他のネットワークチャネル', 'Events, Data, and the Rest of the Network', '事件、数据与其他网络通道', false),
    ],
  },
  {
    volume: 2,
    title: { ja: '第四部 技術と経営の境界：ガバナンスとマネジメント', en: 'Part Four — Technology and Management: Governance and Management', zh: '第四部 技术与经营的边界：治理与管理' },
    summary: {
      ja: '誰が決めるのか。誰が責任を負うのか。エージェントは承認できるのか。どのチャネルをたどっても、最後に行き着く問い。',
      en: 'Who decides, who is accountable, can an agent approve? Every channel ends at these questions.',
      zh: '谁来决定？谁来负责？智能体能不能审批？无论走哪条通道，最后都会走到这些问题。',
    },
    chapters: [
      ch('41', 'オーナーシップ、承認、職務分掌', 'Ownership, Approvals, and Segregation of Duties', '所有权、审批与职责分离'),
      ch('42', 'スコープ、ルール、変更管理', 'Scope, Rules, and Change Control', '范围、规则与变更管理'),
      ch('43', '行動する主体がエージェントであるとき', 'When the Actor Is an Agent', '当行动者是智能体时'),
      ch('44', '自分で作っていない製品の要件管理', 'Managing Requirements for a Product You Did Not Build', '管理一个不是你造的产品的需求', false),
      ch('45', '人とAIで進めるプロジェクト', 'Running a Project With People and AI', '人与 AI 一起推进的项目'),
      ch('46', '人とAI、ひとつのチーム', 'Humans and AI on One Team', '人与 AI，同一个团队'),
      ch('47', 'AIとともに作り、動かすための基盤', 'The Platform for Building and Running With AI', '与 AI 一起开发与运行的平台'),
    ],
  },
];

export const readers: Record<Locale, Array<{ who: string; why: string }>> = {
  ja: [
    { who: 'SAPのコンサルタントと開発者', why: 'コアの知識を活かしたまま、AIがコアの使われ方をどう変えるのかを理解したい人' },
    { who: '統合開発者とフルスタック開発者', why: 'MCPサーバー、スキル、ブラウザエージェントが価値を加えるときと、加えないときを判断したい人' },
    { who: 'AIとエージェントの開発者', why: '「エージェントをSAPにつないで」と頼まれ、コアが何を受け入れ、何を受け入れないかを知る必要がある人' },
    { who: 'アーキテクトとガバナンスの責任者', why: 'これらのチャネルを承認し、監査の場で説明責任を負う人' },
  ],
  en: [
    { who: 'SAP consultants and developers', why: 'who want to understand how AI changes the way the core is used, without losing what they know about master data, transactions and controls' },
    { who: 'Integration and full-stack developers', why: 'who want to judge when MCP servers, skills and browser agents add value, and when they do not' },
    { who: 'AI and agent developers', why: 'asked to “connect an agent to SAP”, who need to know what the core will and will not accept' },
    { who: 'Architects and governance leads', why: 'who approve these channels and answer for them in an audit' },
  ],
  zh: [
    { who: 'SAP 顾问与开发者', why: '想在不丢掉核心知识的前提下，理解 AI 如何改变核心的用法' },
    { who: '集成开发者与全栈开发者', why: '想判断 MCP 服务器、技能、浏览器智能体什么时候有价值、什么时候没有' },
    { who: 'AI 与智能体开发者', why: '被要求「把智能体接到 SAP 上」，需要知道核心接受什么、不接受什么' },
    { who: '架构师与治理负责人', why: '负责批准这些通道，并在审计时承担说明责任' },
  ],
};

export const builds: Record<Locale, string[]> = {
  ja: [
    'CSV、XLSX、Webフォームで依頼を受け付ける',
    'ルールカタログとSAPでのドライランに照らして依頼を検証する',
    '職務分掌を尊重した承認フローに依頼を回す',
    'リリース済みインターフェースを通じて、コミットとロールバックを明示しながらコアに書き込む',
    '行ごと、バッチごと、オブジェクトごとに証跡を記録する',
  ],
  en: [
    'Accept requests as CSV, XLSX or a web form',
    'Validate them against a rule catalog and a dry run in SAP',
    'Route them through an approval flow that respects segregation of duties',
    'Write to the core through released interfaces, with explicit commit and rollback',
    'Record evidence per row, per batch and per object',
  ],
  zh: [
    '用 CSV、XLSX 或网页表单接收申请',
    '对照规则目录和 SAP 中的试运行校验申请',
    '让申请走一条尊重职责分离的审批流',
    '通过已发布接口写入核心，提交与回滚都显式进行',
    '按行、按批次、按对象记录证据',
  ],
};

export const buildsNote: T = {
  ja: 'プロトタイプではありません。本番で使える設計図です。',
  en: 'Not a prototype: a production-grade blueprint.',
  zh: '不是原型，而是能用于生产的设计图。',
};
