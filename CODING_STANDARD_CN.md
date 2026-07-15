# 中文网页编码保护规范 (Coding Standard for CJK Web Content)

## 核心原则

**在 Windows + PowerShell 环境下，绝对不要通过 PowerShell heredoc/字符串管道向文件写入中文内容。**
PowerShell 的 `@''@` 和 `@""@` heredoc 以及管道 `| Out-File` 在特定编码配置下会悄无声息地
将中文字符损坏为 `?`，且不会报错。

## 强制规则

### 1. 写入包含中文的文件 → 必须用 Python 脚本
当需要创建/修改包含中文字符的 `.html`、`.js`、`.json`、`.css` 等文件时：

```
正确做法：
1. 用 Python 脚本文件（UTF-8 编码），通过 Out-File -Encoding UTF8 写入 .py 文件
2. Python 文件内用 u'''...''' 或普通字符串包含中文
3. Python 内用 open(path, 'w', encoding='utf-8') 写入目标文件
4. 写入后用 open(path, 'r', encoding='utf-8') 读取验证中文完整性

错误做法：
- 直接在 PowerShell heredoc (@''@) 中包含中文并写入文件
- 通过管道 (| Out-File) 传递含中文的字符串
- 用 Set-Content 写入含中文的内容（需确认 -Encoding UTF8）
```

### 2. 模板化 HTML → JS 动态生成优先
对于 SPA（单页应用），将用户可见的中文字符串放在 `.js` 文件中动态渲染，
HTML 文件只保留结构骨架。JS 文件通过 DOM API 设置 `textContent` 不会出现编码问题。

```
推荐架构：
index.html     → 骨架 + CSS（中文仅限 meta/og 标签）
render.js      → 表格列标题、按钮文字、提示信息
detail.js      → 弹窗标签、复制模板
init.js        → 状态提示文字
```

### 3. 写入后必须验证
每次写入包含中文的文件后，必须用以下两种方式之一验证：

```powershell
# 方式A：PowerShell 检查
$c = Get-Content "path/to/file" -Encoding UTF8 -Raw
$hasCn = $c -match '[一-鿿]'
Write-Host "Has Chinese: $hasCn"

# 方式B：Python 检查
import re
with open("path/to/file", "r", encoding="utf-8") as f:
    content = f.read()
has_cn = bool(re.search(r'[一-鿿]', content))
print(f"Has Chinese: {has_cn}")
```

如果文件应该包含中文但检查结果为 False，说明编码已损坏，必须重写。

### 4. CSV/JSON 数据文件特殊处理
- CSV 源数据文件：确保以 UTF-8 with BOM 或 UTF-8 without BOM 保存
- JSON 数据文件：Python 的 `json.dump(ensure_ascii=False)` 保留原始中文
- 避免用 Excel 直接编辑 UTF-8 CSV（Excel 会用系统编码保存）

### 5. PowerShell Get-Content / Set-Content 安全用法
```powershell
# 读取：始终指定 -Encoding UTF8
Get-Content "file.ext" -Encoding UTF8

# 写入：不要用于含中文的文件，改用 Python
# 如果必须用：
Set-Content "file.ext" -Encoding UTF8 -Value $content
```

## 检查清单

- [ ] 所有含中文的文件用 Python open(encoding='utf-8') 写入
- [ ] 写入后立即验证中文完整性
- [ ] HTML 骨架尽量减少内联中文
- [ ] JS 中用户可见文字通过 textContent 设置
- [ ] JSON 用 json.dump(ensure_ascii=False)

---

*本规范基于 Codex CLI 在 Windows PowerShell 环境下多次中文编码损坏的实战经验制定。*
*最后更新：2026-07-15*
