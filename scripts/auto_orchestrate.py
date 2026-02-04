#!/usr/bin/env python3
"""Run a multi-role Codex workflow by chaining handoff prompts.

Usage:
  python3 scripts/auto_orchestrate.py --brief brief.md
  python3 scripts/auto_orchestrate.py --brief brief.md --sequence webapp-orchestrator,webapp-researcher,webapp-architect-directive,webapp-uiux-designer,webapp-implementer
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

DEFAULT_SEQUENCE = [
    "webapp-orchestrator",
    "webapp-researcher",
    "webapp-architect-directive",
    "webapp-uiux-designer",
    "webapp-implementer",
]

PROMPT_HEADER = """以下の依頼に対して、指示書と引き継ぎを作成してください。\n\n"""
DEFAULT_AVOID_TIMEOUT_SECONDS = 180
LOG_TAIL_CHARS = 4000
REVIEWER_SKILL = "webapp-reviewer"
REVIEWER_LITE_SKILL = "webapp-reviewer-lite"


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")

def write_text(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")


def append_event_log(path: Path, payload: dict) -> None:
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False) + "\n")


def normalize_text(text: str | bytes | None) -> str | None:
    if text is None:
        return None
    if isinstance(text, bytes):
        return text.decode("utf-8", errors="replace")
    return text


def tail_text(text: str | bytes | None, max_chars: int = LOG_TAIL_CHARS) -> str | None:
    normalized = normalize_text(text)
    if not normalized:
        return None
    if len(normalized) <= max_chars:
        return normalized
    return normalized[-max_chars:]


def append_resume_marker(path: Path) -> None:
    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with path.open("a", encoding="utf-8") as f:
        f.write("\n".join(["", "## Resume", f"- Resumed: {now}", ""]))


def enforce_skill_tag(prompt: str, skill: str) -> bool:
    return prompt.strip().startswith(f"[{skill}]")


def ensure_researcher_web_instruction(prompt: str) -> str:
    if not prompt.strip().startswith("[webapp-researcher]"):
        return prompt
    lines = prompt.splitlines()
    header = lines[0]
    rest = "\n".join(lines[1:]).lstrip()
    instruction = "必ずWeb検索を実行し、出典と日付を明記してください。Web検索できない場合は理由を明記し、それでも引き継ぎパケットと次の入力プロンプトを必ず出してください。"
    return "\n".join([header, instruction, rest]).strip() + "\n"

def apply_timebox_instruction(prompt: str, *, skill: str) -> str:
    if skill != "webapp-implementer":
        return prompt
    lines = prompt.splitlines()
    if not lines:
        return prompt
    instruction = (
        "【タイムボックス】長時間コマンド（依存導入・ビルド・重いテスト）は実行しない。"
        "最小の変更で動作の骨子を作り、未完了は TODO として記録して終了する。"
    )
    return "\n".join([lines[0], instruction] + lines[1:]).strip() + "\n"


def summarize_brief(text: str, max_chars: int) -> str:
    if len(text) <= max_chars:
        return text
    in_code = False
    cleaned_lines: list[str] = []
    for line in text.splitlines():
        if line.strip().startswith("```"):
            in_code = not in_code
            continue
        if in_code:
            continue
        cleaned_lines.append(line)
        if sum(len(l) for l in cleaned_lines) + len(cleaned_lines) > max_chars:
            break
    summary = "\n".join(cleaned_lines).strip()
    if len(summary) > max_chars:
        summary = summary[:max_chars].rstrip()
    return summary + "\n...（以下省略）"


def parse_sequence_from_orchestrator(output: str) -> list[str]:
    skills: list[str] = []
    pattern = re.compile(r"次の担当:\s*`?([A-Za-z0-9_-]+)`?")
    for match in pattern.finditer(output):
        skill = match.group(1).strip()
        if skill and skill not in skills:
            skills.append(skill)
    return skills


def has_handoff_markers(text: str) -> bool:
    return "次の担当:" in text or "引き継ぎパケット" in text


def select_output_content(out_file: Path, response_file: Path) -> tuple[str, Path | None]:
    out_text = read_text(out_file) if out_file.exists() else ""
    resp_text = read_text(response_file) if response_file.exists() else ""
    if out_text and has_handoff_markers(out_text):
        return out_text, out_file
    if resp_text and has_handoff_markers(resp_text):
        return resp_text, response_file
    if out_text:
        return out_text, out_file
    if resp_text:
        return resp_text, response_file
    return "", None


def extract_prompt(content: str, target_skill: str) -> str | None:
    # Find the block for the target skill, then extract the fenced prompt.
    section_pattern = re.compile(
        rf"次の担当:\s*`?{re.escape(target_skill)}`?(?P<section>.*?)(?:\n#|\n##|\n\Z)",
        re.DOTALL,
    )
    match = section_pattern.search(content)
    if not match:
        return None
    section = match.group("section")

    fenced = re.search(r"次の入力プロンプト（コピペ用）:\s*```(?:text)?\n(.*?)```", section, re.DOTALL)
    if fenced:
        prompt = fenced.group(1).strip()
        return prompt if prompt else None

    # Fallback: capture lines after the label until a blank line.
    fallback = re.search(r"次の入力プロンプト（コピペ用）:\s*(.+)", section)
    if fallback:
        return fallback.group(1).strip() or None
    return None


def find_prompt(outputs: list[str], target_skill: str) -> str | None:
    for content in reversed(outputs):
        prompt = extract_prompt(content, target_skill)
        if prompt:
            return prompt
    return None


def build_initial_prompt(skill: str, brief: str) -> str:
    return f"[{skill}]\n{PROMPT_HEADER}# プロジェクト概要\n{brief.strip()}\n"

def build_orchestrator_prompt(brief: str, sequence: list[str]) -> str:
    roles = [s for s in sequence if s != "webapp-orchestrator"]
    packets: list[str] = []
    for idx, role in enumerate(roles, 1):
        packets.append(
            "\n".join(
                [
                    f"### {idx}) {role}",
                    "- 目的:",
                    "- 決定事項:",
                    "- 未決事項:",
                    "- 依頼内容:",
                    "- 参照情報:",
                    f"- 次の担当: {role}",
                    "- 次の入力プロンプト（コピペ用）:",
                    "  ```text",
                    f"  [{role}]",
                    "  ...",
                    "  ```",
                ]
            )
        )
    template = "\n\n".join(
        [
            "# 作業分担計画",
            "",
            "## 目的",
            "- ...",
            "",
            "## 進行順序（役割と依存関係）",
            "1. ...",
            "",
            "## 引き継ぎパケット（次担当へ）",
            "",
            "\n\n".join(packets) if packets else "",
        ]
    ).strip()
    return (
        "[webapp-orchestrator]\n"
        f"{PROMPT_HEADER}# プロジェクト概要\n{brief.strip()}\n\n"
        "# 出力テンプレ（厳守）\n"
        f"{template}\n"
    )

def append_orchestrator_requirements(prompt: str, sequence: list[str]) -> str:
    if not prompt.strip().startswith("[webapp-orchestrator]"):
        return prompt
    requirements = []
    if "webapp-researcher" in sequence:
        requirements.append("- Researcher を必ず含めてください。")
    if REVIEWER_SKILL in sequence:
        requirements.append("- Reviewer を必ず含め、実装後にレビュー担当を配置してください。")
    if REVIEWER_LITE_SKILL in sequence:
        requirements.append("- UI/UX後に軽いレビュー担当を配置してください。")
    requirements.append(
        "- 出力テンプレを厳守し、各担当に「次の担当: <skill>」と「次の入力プロンプト（コピペ用）: ```text ... ```」を必ず含めてください。次の入力プロンプトは必ず [skill] から始めてください。"
    )
    if not requirements:
        return prompt
    return prompt.rstrip() + "\n\n# 追加要件\n" + "\n".join(requirements) + "\n"


def build_fallback_prompt(skill: str, brief: str, last_output: str | None) -> str:
    parts = [f"[{skill}]", PROMPT_HEADER, "# プロジェクト概要", brief.strip()]
    if last_output:
        parts.append("\n# 直前の成果物\n" + last_output.strip())
    return "\n".join(parts) + "\n"

def apply_auto_reviewer(sequence: list[str], auto_reviewer: bool) -> list[str]:
    if not auto_reviewer:
        return sequence
    updated = list(sequence)
    if REVIEWER_LITE_SKILL not in updated:
        if "webapp-uiux-designer" in updated:
            idx = updated.index("webapp-uiux-designer") + 1
            updated = updated[:idx] + [REVIEWER_LITE_SKILL] + updated[idx:]
        else:
            updated.append(REVIEWER_LITE_SKILL)
    if REVIEWER_SKILL not in updated:
        if "webapp-implementer" in updated:
            idx = updated.index("webapp-implementer") + 1
            updated = updated[:idx] + [REVIEWER_SKILL] + updated[idx:]
        else:
            updated.append(REVIEWER_SKILL)
    return updated


def run_codex(
    prompt: str,
    out_file: Path,
    model: str | None,
    sandbox: str | None,
    full_auto: bool,
    cd: Path,
    timeout_seconds: int | None,
    config_overrides: list[str] | None,
) -> subprocess.CompletedProcess[str]:
    cmd = ["codex", "exec", "-C", str(cd), "--output-last-message", str(out_file)]
    if config_overrides:
        for item in config_overrides:
            cmd += ["-c", item]
    if model:
        cmd += ["-m", model]
    if sandbox:
        cmd += ["-s", sandbox]
    if full_auto:
        cmd.append("--full-auto")

    return subprocess.run(
        cmd,
        input=prompt,
        text=True,
        capture_output=True,
        timeout=timeout_seconds,
    )

def init_run_log(
    path: Path,
    *,
    sequence: list[str],
    model: str | None,
    sandbox: str | None,
    full_auto: bool,
    cd: Path,
    brief_path: Path,
    timeout_seconds: int | None,
    short_prompt: bool,
    short_prompt_chars: int,
    avoid_timeout: bool,
    stop_after: int | None,
    auto_reviewer: bool,
) -> None:
    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    lines = [
        "# Run Log",
        "",
        f"- Started: {now}",
        f"- Sequence: {', '.join(sequence)}",
        f"- Model: {model or '(default)'}",
        f"- Sandbox: {sandbox or '(default)'}",
        f"- Full-auto: {'yes' if full_auto else 'no'}",
        f"- Working dir: {cd}",
        f"- Brief: {brief_path}",
        f"- Per-step timeout: {timeout_seconds if timeout_seconds is not None else '(none)'}",
        f"- Short prompt: {'yes' if short_prompt else 'no'}",
        f"- Short prompt chars: {short_prompt_chars}",
        f"- Avoid timeout mode: {'yes' if avoid_timeout else 'no'}",
        f"- Auto reviewer: {'yes' if auto_reviewer else 'no'}",
        f"- Stop after: {stop_after if stop_after is not None else '(none)'}",
        "",
        "## Steps",
        "",
    ]
    write_text(path, "\n".join(lines))

def append_run_log(
    path: Path,
    *,
    idx: int,
    skill: str,
    prompt_file: Path,
    output_file: Path | None,
    status: str,
    note: str | None = None,
    error_file: Path | None = None,
    elapsed: float | None = None,
    timeout_seconds: int | None = None,
) -> None:
    lines = [
        f"### {idx:02d}. {skill}",
        f"- Status: {status}",
        f"- Prompt: {prompt_file}",
    ]
    if output_file:
        lines.append(f"- Output: {output_file}")
    if error_file:
        lines.append(f"- Error log: {error_file}")
    if elapsed is not None:
        lines.append(f"- Elapsed: {elapsed:.1f}s")
    if timeout_seconds is not None:
        lines.append(f"- Timeout: {timeout_seconds}s")
    if note:
        lines.append(f"- Note: {note}")
    lines.append("")
    with path.open("a", encoding="utf-8") as f:
        f.write("\n".join(lines))

def write_error_log(out_dir: Path, step_no: int, skill: str, stdout: str | bytes | None, stderr: str | bytes | None) -> Path | None:
    stdout_tail = tail_text(stdout)
    stderr_tail = tail_text(stderr)
    if not stdout_tail and not stderr_tail:
        return None
    error_file = out_dir / f"{step_no:02d}-{skill}.error.log"
    parts: list[str] = []
    if stdout_tail:
        parts.append("## stdout\n" + stdout_tail)
    if stderr_tail:
        parts.append("## stderr\n" + stderr_tail)
    write_text(error_file, "\n\n".join(parts) + "\n")
    return error_file

def synthesize_orchestrator_handoff(content: str, brief: str, sequence: list[str]) -> str:
    roles = [s for s in sequence if s != "webapp-orchestrator"]
    packets: list[str] = []
    for idx, role in enumerate(roles, 1):
        prompt = build_fallback_prompt(role, brief, content).strip()
        packets.append(
            "\n".join(
                [
                    f"### {idx}) {role}",
                    "- 目的:",
                    "- 決定事項:",
                    "- 未決事項:",
                    "- 依頼内容:",
                    "- 参照情報:",
                    f"- 次の担当: {role}",
                    "- 次の入力プロンプト（コピペ用）:",
                    "  ```text",
                    prompt,
                    "  ```",
                ]
            )
        )
    if not packets:
        return content
    appendix = "\n\n".join(
        [
            "",
            "# 引き継ぎパケット（自動生成）",
            "",
            "\n\n".join(packets),
            "",
        ]
    )
    return content.rstrip() + appendix


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--brief", required=True, help="Path to a brief Markdown file")
    parser.add_argument(
        "--sequence",
        default=",".join(DEFAULT_SEQUENCE),
        help="Comma-separated skill sequence",
    )
    parser.add_argument(
        "--skills-dir",
        default=None,
        help="Directory that contains installed skills (default: $CODEX_HOME/skills or ~/.codex/skills)",
    )
    parser.add_argument("--model", default=None, help="Codex model to use")
    parser.add_argument(
        "--codex-config",
        action="append",
        default=None,
        help="Override Codex config values (repeatable, e.g. model_reasoning_effort=low)",
    )
    parser.add_argument("--sandbox", default=None, help="Codex sandbox mode")
    parser.add_argument("--full-auto", action="store_true", help="Enable --full-auto for codex exec")
    parser.add_argument("--out", default=None, help="Output directory (default: runs/<timestamp>)")
    parser.add_argument("--dry-run", action="store_true", help="Print prompts without running codex")
    parser.add_argument("--cd", default=str(Path.cwd()), help="Working directory for codex")
    parser.add_argument("--timeout-seconds", type=int, default=None, help="Per-step timeout in seconds")
    parser.add_argument(
        "--avoid-timeout",
        action=argparse.BooleanOptionalAction,
        default=False,
        help="Apply conservative settings to reduce timeouts (short prompt, stop-after=1, timeout<=180s)",
    )
    parser.add_argument("--resume", default=None, help="Resume using an existing runs/<timestamp> directory")
    parser.add_argument("--start-at", type=int, default=1, help="Start from step N (1-based)")
    parser.add_argument("--stop-after", type=int, default=None, help="Stop after N executed steps")
    parser.add_argument(
        "--short-prompt",
        action=argparse.BooleanOptionalAction,
        default=False,
        help="Use shortened brief in prompts to reduce token size",
    )
    parser.add_argument("--short-prompt-chars", type=int, default=2000, help="Max chars for short prompt")
    parser.add_argument(
        "--sequence-from-output",
        action=argparse.BooleanOptionalAction,
        default=False,
        help="Derive sequence from orchestrator output",
    )
    parser.add_argument(
        "--force",
        action=argparse.BooleanOptionalAction,
        default=False,
        help="Re-run steps even if output files already exist",
    )
    parser.add_argument(
        "--require-handoff",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Require next-step handoff prompt with exact skill tag",
    )
    parser.add_argument(
        "--researcher-web-required",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Force researcher prompts to require web search and citations",
    )
    parser.add_argument(
        "--auto-handoff",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Auto-generate handoff prompts when missing (stability over strictness)",
    )
    parser.add_argument(
        "--auto-reviewer",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Auto insert reviewer role after implementer if missing",
    )

    args = parser.parse_args()
    timeout_provided = args.timeout_seconds is not None
    if not timeout_provided:
        args.timeout_seconds = 300

    if not shutil.which("codex"):
        print("codex CLI not found in PATH", file=sys.stderr)
        return 1

    brief_path = Path(args.brief)
    if not brief_path.exists():
        print(f"brief file not found: {brief_path}", file=sys.stderr)
        return 1

    if args.avoid_timeout:
        if args.stop_after is None:
            args.stop_after = 1
        if not args.short_prompt:
            args.short_prompt = True
        if not timeout_provided and args.timeout_seconds > DEFAULT_AVOID_TIMEOUT_SECONDS:
            args.timeout_seconds = DEFAULT_AVOID_TIMEOUT_SECONDS

    brief = read_text(brief_path)
    brief_for_prompt = summarize_brief(brief, args.short_prompt_chars) if args.short_prompt else brief
    requested_sequence = [s.strip() for s in args.sequence.split(",") if s.strip()]
    sequence = apply_auto_reviewer(list(requested_sequence), args.auto_reviewer)
    if args.sequence_from_output:
        if "webapp-orchestrator" not in sequence:
            print("sequence-from-output requires webapp-orchestrator in sequence", file=sys.stderr)
            return 1
        sequence = ["webapp-orchestrator"]

    if args.skills_dir:
        skills_dir = Path(args.skills_dir)
    else:
        codex_home = Path(os.environ.get("CODEX_HOME", Path.home() / ".codex"))
        skills_dir = codex_home / "skills"
    if skills_dir.exists():
        for skill in sequence:
            if not (skills_dir / skill).exists():
                print(f"warning: skill not found in {skills_dir}: {skill}", file=sys.stderr)
    else:
        print(f"warning: skills directory not found: {skills_dir}", file=sys.stderr)

    if args.resume:
        out_dir = Path(args.resume)
        if not out_dir.exists():
            print(f"resume directory not found: {out_dir}", file=sys.stderr)
            return 1
    else:
        out_dir = Path(args.out) if args.out else Path("runs") / dt.datetime.now().strftime("%Y%m%d-%H%M%S")
        out_dir.mkdir(parents=True, exist_ok=True)

    run_log = out_dir / "runlog.md"
    events_log = out_dir / "events.jsonl"
    if not args.dry_run:
        if args.resume and run_log.exists():
            append_resume_marker(run_log)
        else:
            init_run_log(
                run_log,
                sequence=sequence,
                model=args.model,
                sandbox=args.sandbox,
                full_auto=args.full_auto,
                cd=Path(args.cd),
                brief_path=brief_path,
                timeout_seconds=args.timeout_seconds,
                short_prompt=args.short_prompt,
                short_prompt_chars=args.short_prompt_chars,
                avoid_timeout=args.avoid_timeout,
                stop_after=args.stop_after,
                auto_reviewer=args.auto_reviewer,
            )
        # Keep a copy of the brief for traceability.
        brief_copy = out_dir / "brief.md"
        if not brief_copy.exists():
            write_text(brief_copy, brief)

    if args.start_at < 1:
        print("start-at must be >= 1", file=sys.stderr)
        return 1

    outputs: list[str] = []
    executed = 0
    idx = 0
    while idx < len(sequence):
        step_no = idx + 1
        skill = sequence[idx]
        prompt_file = out_dir / f"{step_no:02d}-{skill}.prompt.md"
        out_file = out_dir / f"{step_no:02d}-{skill}.md"
        response_file = out_dir / f"{step_no:02d}-{skill}.response.md"

        if step_no < args.start_at:
            if out_file.exists() or response_file.exists():
                content, _ = select_output_content(out_file, response_file)
                if content:
                    outputs.append(content)
                if not out_file.exists() and response_file.exists():
                    write_text(out_file, read_text(response_file))
                if args.sequence_from_output and skill == "webapp-orchestrator":
                    derived = parse_sequence_from_orchestrator(outputs[-1] if outputs else "")
                    derived = [s for s in derived if s != "webapp-orchestrator"]
                    if not derived:
                        raise RuntimeError("sequence-from-output enabled but no handoff sequence found")
                    sequence = apply_auto_reviewer([sequence[0]] + derived, args.auto_reviewer)
                if not args.dry_run:
                    append_run_log(run_log, idx=step_no, skill=skill, prompt_file=prompt_file, output_file=out_file, status="skipped-before-start")
                    append_event_log(
                        events_log,
                        {
                            "ts": dt.datetime.now().isoformat(),
                            "event": "skipped-before-start",
                            "step": step_no,
                            "skill": skill,
                            "prompt": str(prompt_file),
                            "output": str(out_file),
                        },
                    )
                idx += 1
                continue
            print(f"missing output for step {step_no} to skip: {out_file}", file=sys.stderr)
            return 1

        if args.resume and not args.force and (out_file.exists() or response_file.exists()):
            content, _ = select_output_content(out_file, response_file)
            if content:
                outputs.append(content)
            if response_file.exists() and (not out_file.exists() or args.force):
                write_text(out_file, read_text(response_file))
            if args.sequence_from_output and skill == "webapp-orchestrator":
                derived = parse_sequence_from_orchestrator(outputs[-1] if outputs else "")
                derived = [s for s in derived if s != "webapp-orchestrator"]
                if not derived:
                    raise RuntimeError("sequence-from-output enabled but no handoff sequence found")
                sequence = apply_auto_reviewer([sequence[0]] + derived, args.auto_reviewer)
            if not args.dry_run:
                append_run_log(run_log, idx=step_no, skill=skill, prompt_file=prompt_file, output_file=out_file, status="skipped-existing")
                append_event_log(
                    events_log,
                    {
                        "ts": dt.datetime.now().isoformat(),
                        "event": "skipped-existing",
                        "step": step_no,
                        "skill": skill,
                        "prompt": str(prompt_file),
                        "output": str(out_file),
                    },
                )
            idx += 1
            continue

        if step_no == 1:
            if skill == "webapp-orchestrator" and not args.sequence_from_output:
                prompt = build_orchestrator_prompt(brief_for_prompt, sequence)
            else:
                prompt = build_initial_prompt(skill, brief_for_prompt)
            prompt = append_orchestrator_requirements(prompt, sequence)
        else:
            prompt = find_prompt(outputs, skill)
            if not prompt:
                if args.require_handoff and not args.auto_handoff:
                    raise RuntimeError(f"handoff prompt not found for {skill}")
                last_output = outputs[-1] if outputs else None
                prompt = build_fallback_prompt(skill, brief_for_prompt, last_output)
                append_event_log(
                    events_log,
                    {
                        "ts": dt.datetime.now().isoformat(),
                        "event": "handoff-auto-generated",
                        "step": step_no,
                        "skill": skill,
                    },
                )

        if args.require_handoff and not enforce_skill_tag(prompt, skill):
            if args.auto_handoff:
                prompt = f"[{skill}]\n" + prompt.lstrip()
                append_event_log(
                    events_log,
                    {
                        "ts": dt.datetime.now().isoformat(),
                        "event": "handoff-skill-tag-auto-fixed",
                        "step": step_no,
                        "skill": skill,
                    },
                )
            else:
                raise RuntimeError(f"handoff prompt missing skill tag for {skill}")

        if args.researcher_web_required and skill == "webapp-researcher":
            prompt = ensure_researcher_web_instruction(prompt)
        if args.avoid_timeout:
            prompt = apply_timebox_instruction(prompt, skill=skill)

        if args.dry_run:
            print(f"\n===== {skill} =====\n{prompt}\n")
            outputs.append("")
            idx += 1
            continue
        write_text(prompt_file, prompt)

        start_time = time.monotonic()
        try:
            config_overrides = list(args.codex_config or [])
            if args.avoid_timeout and skill == "webapp-implementer":
                config_overrides.append("model_reasoning_effort=low")
            result = run_codex(
                prompt,
                response_file,
                args.model,
                args.sandbox,
                args.full_auto,
                Path(args.cd),
                args.timeout_seconds,
                config_overrides,
            )
            elapsed = time.monotonic() - start_time
            if result.returncode != 0:
                error_file = write_error_log(out_dir, step_no, skill, result.stdout, result.stderr)
                note = f"codex exec failed with exit code {result.returncode}"
                append_run_log(
                    run_log,
                    idx=step_no,
                    skill=skill,
                    prompt_file=prompt_file,
                    output_file=None,
                    status="failed",
                    note=note,
                    error_file=error_file,
                    elapsed=elapsed,
                    timeout_seconds=args.timeout_seconds,
                )
                append_event_log(
                    events_log,
                    {
                        "ts": dt.datetime.now().isoformat(),
                        "event": "failed",
                        "step": step_no,
                        "skill": skill,
                        "prompt": str(prompt_file),
                        "returncode": result.returncode,
                        "elapsed": elapsed,
                        "timeout_seconds": args.timeout_seconds,
                        "error_log": str(error_file) if error_file else None,
                    },
                )
                return 1
            if response_file.exists() and (not out_file.exists() or args.force):
                write_text(out_file, read_text(response_file))
            content, source_file = select_output_content(out_file, response_file)
            if skill == "webapp-orchestrator" and args.require_handoff and not has_handoff_markers(content):
                content = synthesize_orchestrator_handoff(content, brief_for_prompt, sequence)
                write_text(out_file, content)
                append_event_log(
                    events_log,
                    {
                        "ts": dt.datetime.now().isoformat(),
                        "event": "handoff-auto-generated",
                        "step": step_no,
                        "skill": skill,
                        "output": str(out_file),
                    },
                )
            if content:
                outputs.append(content)
            append_run_log(
                run_log,
                idx=step_no,
                skill=skill,
                prompt_file=prompt_file,
                output_file=out_file,
                status="ok",
                elapsed=elapsed,
                timeout_seconds=args.timeout_seconds,
            )
            append_event_log(
                events_log,
                {
                    "ts": dt.datetime.now().isoformat(),
                    "event": "ok",
                    "step": step_no,
                    "skill": skill,
                    "prompt": str(prompt_file),
                    "output": str(out_file),
                    "elapsed": elapsed,
                    "timeout_seconds": args.timeout_seconds,
                },
            )
        except subprocess.TimeoutExpired as exc:
            elapsed = time.monotonic() - start_time
            error_file = write_error_log(out_dir, step_no, skill, exc.stdout, exc.stderr)
            note = f"TimeoutExpired after {args.timeout_seconds}s"
            append_run_log(
                run_log,
                idx=step_no,
                skill=skill,
                prompt_file=prompt_file,
                output_file=None,
                status="timeout",
                note=note,
                error_file=error_file,
                elapsed=elapsed,
                timeout_seconds=args.timeout_seconds,
            )
            append_event_log(
                events_log,
                {
                    "ts": dt.datetime.now().isoformat(),
                    "event": "timeout",
                    "step": step_no,
                    "skill": skill,
                    "prompt": str(prompt_file),
                    "elapsed": elapsed,
                    "timeout_seconds": args.timeout_seconds,
                    "error_log": str(error_file) if error_file else None,
                    "exception": "subprocess.TimeoutExpired",
                },
            )
            return 2
        except Exception as exc:  # noqa: BLE001
            elapsed = time.monotonic() - start_time
            note = f"{type(exc).__name__}: {exc}"
            append_run_log(
                run_log,
                idx=step_no,
                skill=skill,
                prompt_file=prompt_file,
                output_file=None,
                status="failed",
                note=note,
                elapsed=elapsed,
                timeout_seconds=args.timeout_seconds,
            )
            append_event_log(
                events_log,
                {
                    "ts": dt.datetime.now().isoformat(),
                    "event": "failed",
                    "step": step_no,
                    "skill": skill,
                    "prompt": str(prompt_file),
                    "elapsed": elapsed,
                    "timeout_seconds": args.timeout_seconds,
                    "exception": type(exc).__name__,
                },
            )
            return 1

        if args.sequence_from_output and skill == "webapp-orchestrator":
            derived = parse_sequence_from_orchestrator(outputs[-1])
            derived = [s for s in derived if s != "webapp-orchestrator"]
            if not derived:
                raise RuntimeError("sequence-from-output enabled but no handoff sequence found")
            sequence = apply_auto_reviewer([sequence[0]] + derived, args.auto_reviewer)

        executed += 1
        if args.stop_after and executed >= args.stop_after:
            if not args.dry_run:
                with run_log.open("a", encoding="utf-8") as f:
                    f.write(f"\n## Stop\n- Stopped after {executed} executed step(s).\n")
                append_event_log(
                    events_log,
                    {
                        "ts": dt.datetime.now().isoformat(),
                        "event": "stopped",
                        "executed": executed,
                    },
                )
            break

        idx += 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
