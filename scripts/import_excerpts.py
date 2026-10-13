# -*- coding: utf-8 -*-
"""从书稿仓库导入试读章节（白名单 + 清洗 + 扫描）。

稿件仓库是私有的，这里是唯一允许的流入路径。规则：
- 只导入 EXCERPTS 里列出的文件；第 11 章只取到 `cut_before` 标题之前（不含演示环境一节）。
- 去掉所有 HTML 注释（稿件头部记录着翻译与审校过程，不公开）。
- 指向其他章节文件的链接改成纯文本（网站上没有那些页面）。
- 拒绝任何图片引用，除非在 FIGURE_ALLOWLIST 里。
- 写入前用 tools/check_secrets.py 的规则（含本地禁止词）扫一遍，有命中就整体中止，不写任何文件。

用法：
    MANUSCRIPT_DIR=<书稿目录，即含 manuscript-ja/ 的那一层> python scripts/import_excerpts.py
书稿目录的位置放在本地的 dev.local.* 里，不写进仓库。
"""
import datetime
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import check_secrets  # noqa: E402

EXCERPTS = [
    # slug, lang, 源文件（相对书稿目录）, 截断于该标题之前（None = 全文）, 页面标题
    ('preface', 'ja', 'manuscript-ja/0-front-matter/00c-book-introduction.md', None, '序章'),
    ('ch11', 'ja', 'manuscript-ja/1-foundations/11-core-and-ways-in.md', '## デモ環境', 'コアと、そこへ至る道'),
    ('preface', 'en', 'manuscript-en/0-front-matter/00c-book-introduction.md', None, 'Book Introduction'),
    ('ch11', 'en', 'manuscript-en/1-foundations/11-core-and-ways-in.md', '## The Demonstration Environment', 'The Core and the Ways In'),
]

FIGURE_ALLOWLIST = {'fig-01', 'fig-02', 'fig-04', 'fig-06', 'fig-07', 'fig-10', 'fig-11', 'fig-12'}

OUT_DIR = os.path.join(ROOT, 'src', 'content', 'excerpts')


def clean(text, cut_before):
    text = re.sub(r'<!--.*?-->', '', text, flags=re.S)
    if cut_before:
        idx = text.find('\n' + cut_before)
        if idx < 0:
            raise SystemExit('cut point not found: %r' % cut_before)
        text = text[:idx]
    # 去掉第一个一级标题（页面自己渲染标题）
    text = re.sub(r'^\s*#\s+[^\n]+\n', '', text, count=1)
    # 图片：只放行白名单
    for m in re.finditer(r'!\[[^\]]*\]\(([^)]+)\)', text):
        name = os.path.splitext(os.path.basename(m.group(1)))[0]
        if not any(name.startswith(f) for f in FIGURE_ALLOWLIST):
            raise SystemExit('figure not allowed in excerpts: %s' % m.group(1))
    # 指向 .md 的相对链接改成纯文本
    text = re.sub(r'\[([^\]]+)\]\((?!https?://)[^)]*\.md(?:#[^)]*)?\)', r'\1', text)
    return text.strip() + '\n'


def main():
    src_root = os.environ.get('MANUSCRIPT_DIR')
    if not src_root or not os.path.isdir(src_root):
        raise SystemExit('set MANUSCRIPT_DIR to the manuscript directory (see dev.local.*)')

    local_pats = check_secrets.load_local_patterns()
    staged = []
    hits = []
    for slug, lang, rel, cut, title in EXCERPTS:
        with open(os.path.join(src_root, rel), encoding='utf-8') as fh:
            body = clean(fh.read(), cut)
        for n, line in enumerate(body.split('\n'), 1):
            for label, pat in check_secrets.PATTERNS:
                if pat.search(line):
                    hits.append('%s/%s:%d [%s]' % (lang, slug, n, label))
            for lp in local_pats:
                if lp.search(line):
                    hits.append('%s/%s:%d [local]' % (lang, slug, n))
        today = datetime.date.today().isoformat()
        front = ('---\n'
                 'title: "%s"\n'
                 'lang: %s\n'
                 'slug: %s\n'
                 'status: draft\n'
                 'excerpt: %s\n'
                 'imported: %s\n'
                 '---\n\n') % (title, lang, slug, 'true' if cut else 'false', today)
        staged.append((os.path.join(OUT_DIR, lang, slug + '.md'), front + body))

    if hits:
        print('scan failed, nothing written:')
        for h in hits:
            print('  ' + h)
        return 1

    for path, content in staged:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w', encoding='utf-8', newline='\n') as fh:
            fh.write(content)
        print('wrote %s (%d chars)' % (os.path.relpath(path, ROOT), len(content)))
    return 0


if __name__ == '__main__':
    sys.exit(main())
