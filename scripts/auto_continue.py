#!/usr/bin/env python3
"""Auto-continue auto_orchestrate.py in single-step chunks."""

from __future__ import annotations

import argparse
import datetime as dt
import subprocess
import sys
from pathlib import Path


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write_text(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")


def append_log(path: Path, line: str) -> None:
    with path.open("a", encoding="utf-8") as f:
        f.write(line.rstrip() + "\n")


def parse_sequence(runlog_path: Path) -> list[str] | None:
    if not runlog_path.exists():
        return None
    for line in read_text(runlog_path).splitlines():
        if line.startswith("- Sequence:"):
            raw = line.split(":", 1)[1].strip()
            return [s.strip() for s in raw.split(",") if s.strip()]
    return None


def find_next_step(run_dir: Path, sequence: list[str]) -> int:
    for idx, skill in enumerate(sequence, 1):
        out_file = run_dir / f"{idx:02d}-{skill}.md"
        resp_file = run_dir / f"{idx:02d}-{skill}.response.md"
        if out_file.exists() or resp_file.exists():
            continue
        return idx
    return len(sequence) + 1


def build_base_cmd(args: argparse.Namespace, run_dir: Path, start_at: int, timeout_seconds: int | None) -> list[str]:
    cmd = [
        sys.executable,
        "scripts/auto_orchestrate.py",
        "--brief",
        args.brief,
        "--start-at",
        str(start_at),
        "--stop-after",
        "1",
    ]
    if args.full_auto:
        cmd.append("--full-auto")
    if args.avoid_timeout:
        cmd.append("--avoid-timeout")
    if args.sequence:
        cmd += ["--sequence", args.sequence]
    if args.sequence_from_output:
        cmd.append("--sequence-from-output")
    if args.model:
        cmd += ["--model", args.model]
    if args.codex_config:
        for item in args.codex_config:
            cmd += ["--codex-config", item]
    if args.sandbox:
        cmd += ["--sandbox", args.sandbox]
    if args.skills_dir:
        cmd += ["--skills-dir", args.skills_dir]
    if args.cd:
        cmd += ["--cd", args.cd]
    if timeout_seconds is not None:
        cmd += ["--timeout-seconds", str(timeout_seconds)]
    if args.short_prompt:
        cmd.append("--short-prompt")
    if args.short_prompt_chars:
        cmd += ["--short-prompt-chars", str(args.short_prompt_chars)]
    if args.require_handoff is False:
        cmd.append("--no-require-handoff")
    if args.researcher_web_required is False:
        cmd.append("--no-researcher-web-required")
    if args.auto_reviewer is False:
        cmd.append("--no-auto-reviewer")
    if args.force:
        cmd.append("--force")
    if args.resume:
        cmd += ["--resume", str(run_dir)]
    else:
        cmd += ["--out", str(run_dir)]
    return cmd


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--brief", required=True, help="Path to brief Markdown file")
    parser.add_argument("--resume", default=None, help="Resume using an existing runs/<timestamp> directory")
    parser.add_argument("--out", default=None, help="Output directory for a new run")
    parser.add_argument("--sequence", default=None, help="Comma-separated skill sequence")
    parser.add_argument("--sequence-from-output", action="store_true", help="Derive sequence from orchestrator output")
    parser.add_argument("--model", default=None, help="Codex model to use")
    parser.add_argument(
        "--codex-config",
        action="append",
        default=None,
        help="Override Codex config values (repeatable, e.g. model_reasoning_effort=low)",
    )
    parser.add_argument("--sandbox", default=None, help="Codex sandbox mode")
    parser.add_argument("--full-auto", action="store_true", help="Enable --full-auto for codex exec")
    parser.add_argument("--avoid-timeout", action="store_true", help="Apply conservative timeout-avoidance settings")
    parser.add_argument("--skills-dir", default=None, help="Directory that contains installed skills")
    parser.add_argument("--cd", default=None, help="Working directory for codex")
    parser.add_argument("--timeout-seconds", type=int, default=None, help="Per-step timeout in seconds")
    parser.add_argument("--short-prompt", action="store_true", help="Use shortened brief in prompts")
    parser.add_argument("--short-prompt-chars", type=int, default=None, help="Max chars for short prompt")
    parser.add_argument("--require-handoff", action=argparse.BooleanOptionalAction, default=True, help="Require handoff prompt")
    parser.add_argument("--researcher-web-required", action=argparse.BooleanOptionalAction, default=True, help="Force researcher web search")
    parser.add_argument("--auto-reviewer", action=argparse.BooleanOptionalAction, default=True, help="Auto insert reviewer roles")
    parser.add_argument("--force", action="store_true", help="Re-run steps even if output files already exist")
    parser.add_argument("--max-steps", type=int, default=None, help="Maximum steps to execute in this run")
    parser.add_argument(
        "--retry-on-timeout",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Retry a step with a larger timeout when a timeout occurs",
    )
    parser.add_argument("--timeout-max", type=int, default=1200, help="Maximum timeout for retries (seconds)")

    args = parser.parse_args()

    if args.resume:
        run_dir = Path(args.resume)
        if not run_dir.exists():
            print(f"resume directory not found: {run_dir}", file=sys.stderr)
            return 1
    else:
        run_dir = Path(args.out) if args.out else Path("runs") / dt.datetime.now().strftime("%Y%m%d-%H%M%S")
        run_dir.mkdir(parents=True, exist_ok=True)

    runlog = run_dir / "runlog.md"
    auto_log = run_dir / "auto_continue.log"
    append_log(auto_log, f"== Auto continue start: {dt.datetime.now().isoformat()} ==")

    executed = 0
    if args.timeout_seconds is not None:
        current_timeout = args.timeout_seconds
    else:
        current_timeout = 180 if args.avoid_timeout else 300
    while True:
        sequence = parse_sequence(runlog)
        if not sequence and args.sequence:
            sequence = [s.strip() for s in args.sequence.split(",") if s.strip()]
        if not sequence:
            print("sequence not found; run orchestrator first or provide --sequence", file=sys.stderr)
            return 1

        next_step = find_next_step(run_dir, sequence)
        if next_step > len(sequence):
            append_log(auto_log, "All steps completed.")
            break

        cmd = build_base_cmd(args, run_dir, next_step, current_timeout)
        append_log(auto_log, f"step {next_step}/{len(sequence)}: {' '.join(cmd)}")
        result = subprocess.run(cmd)
        append_log(auto_log, f"exit code: {result.returncode}")

        if result.returncode != 0:
            if result.returncode == 2 and args.retry_on_timeout:
                if current_timeout < args.timeout_max:
                    current_timeout = min(args.timeout_max, current_timeout * 2)
                    append_log(auto_log, f"Timeout detected; retrying with timeout {current_timeout}s.")
                    continue
            append_log(auto_log, "Stopping due to non-zero exit code.")
            return result.returncode

        executed += 1
        if args.max_steps is not None and executed >= args.max_steps:
            append_log(auto_log, f"Reached max steps: {args.max_steps}")
            break

    append_log(auto_log, f"== Auto continue end: {dt.datetime.now().isoformat()} ==")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
