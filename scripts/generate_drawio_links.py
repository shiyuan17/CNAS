#!/usr/bin/env python3
"""
Generate draw.io URLs from Mermaid blocks in the analysis markdown.

This script intentionally mirrors the URL generation used by @drawio/mcp
open_drawio_mermaid in version 1.4.0:
https://github.com/jgraph/drawio-mcp
"""

from __future__ import annotations

import argparse
import base64
import json
import re
import urllib.parse
import zlib
from pathlib import Path

DRAWIO_BASE_URL = "https://app.diagrams.net/"
HEADING_RE = re.compile(r"^##\s+(G\d{2})\s+(.+)$", re.MULTILINE)
MERMAID_RE = re.compile(r"```mermaid\s*\n(.*?)\n```", re.DOTALL)


def compress_data(data: str) -> str:
    encoded = urllib.parse.quote(data, safe="~()*!.'")
    compressor = zlib.compressobj(level=9, wbits=-15)
    compressed = compressor.compress(encoded.encode("utf-8")) + compressor.flush()
    return base64.b64encode(compressed).decode("ascii")


def generate_drawio_url(mermaid: str) -> str:
    create_obj = {
        "type": "mermaid",
        "compressed": True,
        "data": compress_data(mermaid),
    }
    params = urllib.parse.urlencode(
        {
            "grid": "0",
            "pv": "0",
            "border": "10",
            "edit": "_blank",
        }
    )
    create_hash = "#create=" + urllib.parse.quote(
        json.dumps(create_obj, ensure_ascii=False), safe=""
    )
    return f"{DRAWIO_BASE_URL}?{params}{create_hash}"


def extract_diagrams(markdown: str) -> list[tuple[str, str, str]]:
    diagrams: list[tuple[str, str, str]] = []
    headings = list(HEADING_RE.finditer(markdown))

    for index, match in enumerate(headings):
        code = match.group(1)
        title = match.group(2).strip()
        start = match.end()
        end = headings[index + 1].start() if index + 1 < len(headings) else len(markdown)
        section = markdown[start:end]
        mermaid_match = MERMAID_RE.search(section)
        if mermaid_match:
            mermaid = mermaid_match.group(1).strip()
            diagrams.append((code, title, mermaid))

    return diagrams


def render_output(diagrams: list[tuple[str, str, str]]) -> str:
    lines = [
        "# CNAS/ISO15189 图谱 draw.io 打开链接",
        "",
        "以下链接由与 `@drawio/mcp` 1.4.0 兼容的 Mermaid URL 生成逻辑批量生成，可直接在浏览器中打开并进入 draw.io 编辑器。",
        "",
        "| 图编号 | 图名称 | draw.io 链接 |",
        "| --- | --- | --- |",
    ]

    for code, title, mermaid in diagrams:
        url = generate_drawio_url(mermaid)
        lines.append(f"| {code} | {title} | [打开]({url}) |")

    lines.extend(
        [
            "",
            "## 说明",
            "",
            "- 本链接清单服务于快速查看与二次编辑，不替代源分析文档。",
            "- 当前工作区已补充 `.vscode/mcp.json`，后续可在支持 MCP 的编辑器中直接挂载 `drawio-mcp`。",
        ]
    )
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", help="Analysis markdown path")
    parser.add_argument("output", help="Output markdown path")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    markdown = input_path.read_text(encoding="utf-8")
    diagrams = extract_diagrams(markdown)

    if len(diagrams) != 15:
        raise SystemExit(f"Expected 15 diagrams, found {len(diagrams)}")

    output_path.write_text(render_output(diagrams), encoding="utf-8")
    print(f"Generated {len(diagrams)} draw.io links -> {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
