#!/usr/bin/env python3
"""
git_commit_push.py — Commit generated CDS results and push to a branch,
recovering from concurrent-push races instead of losing the run's work.

Two workflow runs processing different files can land close enough together
that both check out the same branch tip and both try to push their own new
commit back. Whichever pushes first wins; the second's plain `git push`
used to just fail outright, killing the whole job and discarding everything
it had just parsed (nothing is committed until this step).

This retries through that: on a rejected push, it fetches and rebases onto
whatever landed first. Per-school files (data/cds/{year}/{slug}.json, the
source PDF/xlsx, a school's own generated page, a new SCHOOL_META line) are
additive between two different schools and rebase cleanly on their own. The
aggregate files (data/cds-{year}.json, data/schools-{year}.json,
sitemap.xml) are fully rewritten every run though, so two runs' versions of
them can't be reconciled by text diff — those are resolved by taking either
side as a placeholder and then unconditionally rebuilding them fresh via
build-cds-json.py / generate-school-pages.js against the now-combined set of
per-school files, which is always correct regardless of what the rebase left
in those specific files.

Usage (as a script):
    python scripts/git_commit_push.py --branch cds-data-staging --years 2025-2026 \\
        --message-file cds_drop_summary.txt

Usage (imported):
    from git_commit_push import commit_and_push
    commit_and_push(years=["2025-2026"], message="...", branch="cds-data-staging")
"""

import argparse
import os
import subprocess
import sys
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent


def _run(cmd, check=False, capture=False):
    print("+", " ".join(cmd))
    return subprocess.run(cmd, cwd=REPO_ROOT, check=check, capture_output=capture, text=True)


def rebuild_aggregates(years):
    for year in years:
        _run([sys.executable, str(REPO_ROOT / "scripts" / "build-cds-json.py"), "--year", year], check=True)
        _run(["node", str(REPO_ROOT / "scripts" / "generate-school-pages.js"), "--year", year], check=True)


def _current_branch():
    return _run(["git", "rev-parse", "--abbrev-ref", "HEAD"], check=True, capture=True).stdout.strip()


def commit_and_push(years, message, branch=None, max_attempts=5):
    """Stage the usual CDS output paths, commit, and push — retrying through
    concurrent-push races by rebasing and rebuilding the aggregates fresh.
    No-ops (returns without error) if there's nothing staged to commit."""
    branch = branch or os.environ.get("GITHUB_REF_NAME") or _current_branch()

    _run(["git", "config", "user.name", "cds-bot"], check=True)
    _run(["git", "config", "user.email", "cds-bot@users.noreply.github.com"], check=True)

    _run(["git", "add", "data/", "js/school.js", "schools/", "sitemap.xml"], check=True)
    if _run(["git", "diff", "--cached", "--quiet"]).returncode == 0:
        print("Nothing new to commit.")
        return

    _run(["git", "commit", "-m", message], check=True)

    expected_conflicts = {f"data/cds-{y}.json" for y in years} | {f"data/schools-{y}.json" for y in years}
    expected_conflicts.add("sitemap.xml")

    for attempt in range(1, max_attempts + 1):
        if _run(["git", "push", "origin", f"HEAD:{branch}"]).returncode == 0:
            print(f"Pushed on attempt {attempt}.")
            return

        print(f"Push rejected (attempt {attempt}/{max_attempts}) — another run landed on "
              f"{branch} first. Rebasing and rebuilding aggregates before retrying...")
        _run(["git", "fetch", "origin", branch], check=True)
        rebase = _run(["git", "rebase", f"origin/{branch}"])

        if rebase.returncode != 0:
            conflicted = _run(["git", "diff", "--name-only", "--diff-filter=U"], capture=True).stdout.split()
            unexpected = [f for f in conflicted if f not in expected_conflicts]
            if unexpected:
                _run(["git", "rebase", "--abort"])
                sys.exit(f"Rebase conflict in unexpected file(s), needs a human to resolve: {unexpected}")
            for f in conflicted:
                _run(["git", "checkout", "--ours", f], check=True)
                _run(["git", "add", f], check=True)
            subprocess.run(["git", "rebase", "--continue"], cwd=REPO_ROOT, check=True,
                            env={**os.environ, "GIT_EDITOR": "true"})

        # The rebase may have left a stale (single-run) version of the
        # aggregate files even when it succeeded without conflict — rebuild
        # them fresh either way so they reflect every school now on disk,
        # not just whichever run's rewrite happened to "win" the rebase.
        rebuild_aggregates(years)
        _run(["git", "add", "data/", "schools/", "sitemap.xml"], check=True)
        if _run(["git", "diff", "--cached", "--quiet"]).returncode != 0:
            _run(["git", "commit", "--amend", "--no-edit"], check=True)

        time.sleep(min(attempt * 3, 15))

    sys.exit(f"Failed to push to {branch} after {max_attempts} attempts — giving up.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--branch", help="Defaults to $GITHUB_REF_NAME, else the current branch")
    parser.add_argument("--years", nargs="+", required=True)
    parser.add_argument("--message")
    parser.add_argument("--message-file")
    parser.add_argument("--max-attempts", type=int, default=5)
    args = parser.parse_args()

    if not args.message and not args.message_file:
        sys.exit("Pass --message or --message-file")
    message = args.message or Path(args.message_file).read_text(encoding="utf-8")

    commit_and_push(args.years, message, branch=args.branch, max_attempts=args.max_attempts)


if __name__ == "__main__":
    main()
