#!/usr/bin/env python3

import json
from pathlib import Path

plugin_root = Path(__file__).resolve().parents[1]
manifest = json.loads(
    (plugin_root / ".codex-plugin" / "plugin.json").read_text(encoding="utf-8")
)
mcp = json.loads((plugin_root / ".mcp.json").read_text(encoding="utf-8"))

assert manifest["name"] == plugin_root.name
assert manifest["mcpServers"] == "./.mcp.json"
assert manifest["skills"] == "./skills/"
assert mcp["mcpServers"]["instruments"]["command"] == "bash"
assert (plugin_root / "skills" / "design-instruments" / "SKILL.md").is_file()

print("CanWeSynth plugin manifest is structurally valid")
