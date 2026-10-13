# -*- coding: utf-8 -*-
"""扫描仓库里残留的凭据与内网标识（公开仓库的守门人）。

复制并改编自书稿仓库的同名脚本；两边各自维护，不跨仓库引用。
**本文件自身不得包含任何真实值**，只匹配形状。

用法：
    python tools/check_secrets.py            # 扫全仓库文本
    python tools/check_secrets.py --staged   # 只扫 git 暂存区（提交前钩子）
"""
import os
import re
import subprocess
import sys

# 与特定机构相关的名称与域名不写在公开文件里：放在不入库的 tools/secrets.local.txt，每行一个正则。
LOCAL_PATTERNS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'secrets.local.txt')


def load_local_patterns():
    try:
        with open(LOCAL_PATTERNS_FILE, encoding='utf8') as fh:
            return [re.compile(l.strip(), re.I) for l in fh
                    if l.strip() and not l.lstrip().startswith('#')]
    except OSError:
        return []

PATTERNS = [
    ('SAP 账号形状（3 字母 + 5 数字）',
     re.compile(r'\b[A-Za-z]{3}\d{5}\b')),
    ('Windows 用户目录含真实用户名',
     re.compile(r'[Cc]:[\\/]Users[\\/](?!<)[A-Za-z0-9._-]{3,}')),
    ('AD 域名后缀',
     re.compile(r'\.[A-Z]{4,}DOM\b')),
    ('口令被赋了字面值',
     re.compile(r'(?i)(passwd|password|pwd)["\']?\s*[:=]\s*["\'](?!\s*$)'
                r'(?!<)(?!\*)(?!os\.getenv)(?!\$\{)[^"\']{3,}["\']')),
    ('SAP 安装号形状（10 位数字）',
     re.compile(r'\b00\d{8}\b')),
    ('私有网段 IP',
     re.compile(r'\b(?:10|192\.168|172\.(?:1[6-9]|2\d|3[01]))'
                r'(?:\.\d{1,3}){2,3}\b')),
    ('S/4HANA Cloud 租户主机名',
     re.compile(r'\bmy\d{6}(?:-api)?\.s4hana\.cloud\.sap\b', re.I)),
    # Google API 密钥形状（Gemini 密钥即此形状）
    ('Google API 密钥形状（旧式 AIza…）',
     re.compile(r'\bAIza[0-9A-Za-z_-]{35}\b')),
    ('Google API 密钥形状（新式 AQ.…）',
     re.compile(r'\bAQ\.[0-9A-Za-z_-]{30,}')),
    ('Cloudflare API Token 被赋了字面值',
     re.compile(r'(?i)CLOUDFLARE_API_TOKEN\s*[:=]\s*["\']?[A-Za-z0-9_-]{20,}')),
    ('GEMINI_API_KEY 被赋了字面值',
     re.compile(r'GEMINI_API_KEY\s*[:=]\s*["\']?[A-Za-z0-9_-]{8,}')),
    ('原始 Gmail 地址',
     re.compile(r'\b[A-Za-z0-9._%+-]+@gmail\.com\b')),
]

TEXT_EXT = {'.md', '.py', '.js', '.mjs', '.ts', '.vue', '.astro', '.json', '.jsonc',
            '.toml', '.yaml', '.yml', '.txt', '.sql', '.ps1', '.sh', '.css', '.html',
            '.example', '.gitignore', '.gitattributes', ''}

SKIP_DIRS = {'.git', 'node_modules', '__pycache__', 'dist', '.astro', '.wrangler'}

# 锁文件里的版本号（如 10.3.0）会误中私有网段 IP 的形状；锁文件由 npm 生成，不含手写内容
SKIP_FILES = {'package-lock.json', 'CLAUDE.local.md', 'dev.local.ps1', 'dev.local.sh', 'secrets.local.txt', '.dev.vars'}

# 合法出现、无需报警的形状
ALLOW = [
    re.compile(r'CC\d{6}'),          # 示例成本中心号
    re.compile(r'BAPI\d{7}'),        # BAPI 结构名
    re.compile(r'noreply@github\.com'),
]


def iter_files(staged):
    if staged:
        out = subprocess.run(['git', 'diff', '--cached', '--name-only',
                              '--diff-filter=ACM'],
                             capture_output=True, text=True).stdout
        for line in out.split('\n'):
            if line.strip() and os.path.isfile(line.strip()):
                yield line.strip()
        return
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in files:
            path = os.path.join(root, name)
            if os.path.splitext(name)[1].lower() in TEXT_EXT:
                yield path


def main():
    staged = '--staged' in sys.argv
    local_pats = load_local_patterns()

    hits = []
    for path in iter_files(staged):
        # 检查器自身不参与扫描（规则里本身就含有被查的形状）
        parts = os.path.normpath(path).split(os.sep)
        if 'tools' in parts or parts[-1] in SKIP_FILES:
            continue
        try:
            with open(path, encoding='utf8') as fh:
                lines = fh.read().split('\n')
        except (UnicodeDecodeError, OSError):
            continue
        for n, line in enumerate(lines, 1):
            for lp in local_pats:
                if lp.search(line):
                    hits.append((path, n, '本地禁止词', line.strip()[:60]))
            for label, pat in PATTERNS:
                for m in pat.finditer(line):
                    if any(a.search(m.group(0)) for a in ALLOW):
                        continue
                    hits.append((path, n, label, line.strip()[:60]))

    for path, n, label, ctx in hits:
        print('  %s:%d  [%s]' % (path.replace(os.sep, '/'), n, label))
        print('      %s' % ctx)
    scope = '暂存区' if staged else '全仓库'
    print('\n  %s扫描：%d 处可疑 %s'
          % (scope, len(hits), 'OK' if not hits else 'FAIL'))
    return 1 if hits else 0


if __name__ == '__main__':
    sys.exit(main())
