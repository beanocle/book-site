// 站点级的语言定义与界面文案。正文内容走 content collections，这里只放导航、按钮等短语。
// 术语以书稿的术语表为准，不在这里另造译法。

export const locales = ['ja', 'en', 'zh'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ja';

export const localeNames: Record<Locale, string> = {
  ja: '日本語',
  en: 'English',
  zh: '中文',
};

// <html lang> 与 hreflang 用的标准标签
export const localeTags: Record<Locale, string> = {
  ja: 'ja',
  en: 'en',
  zh: 'zh-Hans',
};

export const ui = {
  ja: {
    'site.title': '（書名未定）',
    'site.tagline': 'パッケージシステムの隙間を、AI時代の新しい経路で埋める',
    'nav.home': 'ホーム',
    'nav.book': '本書について',
    'nav.read': '試し読み',
    'nav.app': 'ギャップ補完ナビ',
    'nav.author': '著者',
    'nav.news': 'お知らせ',
    'nav.support': 'サポート',
    'home.buy': '購入する',
    'home.comingSoon': '近日発売',
    'home.tryApp': 'ナビを使ってみる',
    'app.title': 'ギャップ補完 TRIZ ナビ',
    'app.lead': 'パッケージの標準機能と業務要件の隙間を、矛盾として捉え、発明原理から埋め方を導く。AIは設計された手順に従う部品です。',
    'footer.privacy': 'プライバシーポリシー',
  },
  en: {
    'site.title': '(title to be decided)',
    'site.tagline': 'Filling the gaps of packaged systems through the new channels of the AI era',
    'nav.home': 'Home',
    'nav.book': 'About the book',
    'nav.read': 'Sample chapters',
    'nav.app': 'Gap-filling navigator',
    'nav.author': 'Author',
    'nav.news': 'News',
    'nav.support': 'Support',
    'home.buy': 'Buy',
    'home.comingSoon': 'Coming soon',
    'home.tryApp': 'Try the navigator',
    'app.title': 'Gap-filling TRIZ Navigator',
    'app.lead': 'Treat the gap between a packaged system and a business requirement as a contradiction, and derive how to fill it from the inventive principles. The AI is a component that follows a designed procedure.',
    'footer.privacy': 'Privacy policy',
  },
  zh: {
    'site.title': '（书名未定）',
    'site.tagline': '用 AI 时代的新通道，填补套装系统的缺口',
    'nav.home': '首页',
    'nav.book': '关于本书',
    'nav.read': '试读',
    'nav.app': '缺口填补导航',
    'nav.author': '作者',
    'nav.news': '动态',
    'nav.support': '支持',
    'home.buy': '购买',
    'home.comingSoon': '即将出版',
    'home.tryApp': '试用导航',
    'app.title': '缺口填补 TRIZ 导航',
    'app.lead': '把套装系统标准功能与业务需求之间的缺口当作矛盾，从发明原理推导填补方式。AI 是按设计好的流程运转的零件。',
    'footer.privacy': '隐私政策',
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type UiKey = keyof (typeof ui)['ja'];

export function t(locale: Locale, key: UiKey): string {
  return ui[locale][key] ?? ui[defaultLocale][key];
}

export function isLocale(value: string | undefined): value is Locale {
  return (locales as readonly string[]).includes(value ?? '');
}
