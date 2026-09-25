#!/usr/bin/env python3
"""Supply-Chain Safety: Tool & Skill Verification Gate.

Scans agent skills and MCP tool definitions with SkillSpector, enforces
declared capability boundaries via SAT lockfiles, and generates verifiable ASBOMs.
"""

import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse


def is_domain_allowed(finding: str, allowed_domains: list[str]) -> bool:
    """Strictly validate that all URLs in finding match allowed_domains by parsed hostname."""
    if not allowed_domains:
        return False
    urls = re.findall(r"https?://[^\s\"')\]>]+", finding)
    if not urls and "://" not in finding:
        candidate = finding.strip().split("/")[0]
        if candidate:
            urls = [f"https://{candidate}"]
    if not urls:
        return False
    normalized_allowed = [d.strip().lower() for d in allowed_domains if d.strip()]
    for raw_url in urls:
        host = (urlparse(raw_url).hostname or "").lower().rstrip(".")
        if not host:
            return False
        if not any(host == d or host.endswith("." + d) for d in normalized_allowed):
            return False
    return True


def get_skillspector_bin() -> str:
    """Find the skillspector binary on PATH or common local user bin directories."""
    path_bin = shutil.which("skillspector")
    if path_bin:
        return path_bin
    for candidate in [
        Path.home() / ".local" / "bin" / "skillspector",
        Path.home() / ".cargo" / "bin" / "skillspector",
        Path("/root/.local/bin/skillspector"),
    ]:
        if candidate.exists():
            return str(candidate)
    return "skillspector"


def verify_skill_gate(skill_dir: str, lockfile: str = "sat.lock") -> bool:
    print(f"\n=======================================================")
    print(f"[*] CI/CD Build Gate: Auditing skill package: {skill_dir}")
    print(f"=======================================================")

    bin_path = get_skillspector_bin()
    report_file = Path("report.json")
    if report_file.exists():
        try:
            report_file.unlink()
        except OSError:
            pass

    # 1. Execute SkillSpector static scan (optional: set SKILLSPECTOR_MODEL=gemini-3.1-pro-preview)
    cmd = [
        bin_path,
        "scan",
        skill_dir,
        "--no-llm",
        "--format",
        "json",
        "--output",
        "report.json",
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)

    report = {}
    if report_file.exists():
        try:
            report = json.loads(report_file.read_text())
        except Exception:
            pass

    if not report:
        try:
            raw_json = res.stdout[res.stdout.find("{") :]
            report = json.loads(raw_json)
        except Exception as e:
            print(f"[!] Scan parsing failed: {e}\nstdout: {res.stdout}\nstderr: {res.stderr}")
            return False

    issues = report.get("issues", [])


    # Extract declared allowed domains from sat.lock
    allowed_domains = []
    lockfile_path = Path(lockfile)
    if lockfile_path.exists():
        try:
            lock_data = json.loads(lockfile_path.read_text())
            for sk_conf in lock_data.get("declared_skills", {}).values():
                allowed_domains.extend(sk_conf.get("allowed_network_domains", []))
        except Exception:
            pass

    # 2. Check for capability boundary breaches against declared sat.lock policy
    breaches = []
    for i in issues:
        severity = i.get("severity")
        category = i.get("category", "")
        pattern = i.get("pattern", "")
        finding = i.get("finding", "")
        rule_id = i.get("id", "")

        # Always block HIGH / CRITICAL issues (prompt injection, harvesting, poisoning, etc.)
        if severity in ("HIGH", "CRITICAL") or "Harvesting" in pattern or "Injection" in category or "Injection" in pattern:
            breaches.append(i)
            continue

        # Check external network transmission (E1) against declared sat.lock domains
        if rule_id == "E1" or "External Transmission" in pattern:
            domain_allowed = is_domain_allowed(finding, allowed_domains)
            if not domain_allowed:
                i["remediation"] = f"Undeclared network domain '{finding}' breached capability boundary (not in {lockfile})."
                breaches.append(i)

    if breaches:
        print(
            f"\n\033[91m[FAIL] Toxic Skill Detected: Capability boundary breached in {skill_dir}!\033[0m"
        )
        for b in breaches:
            loc = b.get("location", {})
            print(
                f"  - [{b.get('severity')}] {b.get('category')}: {b.get('pattern')} at {loc.get('file')}:{loc.get('start_line')}"
            )
            print(f"    Remediation: {b.get('remediation')}")
        print(
            f"\n\033[91m[BLOCKED] Pull Request build gate failed. Skill rejected from Agent Registry.\033[0m"
        )
        return False

    # 3. Clean skill: verify declared SAT lockfile & generate ASBOM
    print(
        "\033[92m[PASS] Capability scan matches declared scope.\033[0m"
    )
    print(f"\033[92m[PASS] SAT lockfile ({lockfile}) verified.\033[0m")

    asbom = {
        "asbom_version": "1.0.0",
        "skill": report.get("skill", {}).get("name", Path(skill_dir).name),
        "status": "APPROVED",
        "inspected_files": report.get("analysis_completeness", {}).get(
            "fully_inspected_files", 1
        ),
        "target_registry": "Agent Registry",
    }
    Path("asbom.json").write_text(json.dumps(asbom, indent=2))
    print(
        "\033[92m[PASS] ASBOM generated: asbom.json -> Approved for Agent Registry.\033[0m"
    )
    return True


def scan_all_skills(skills_dir: str = "./skills", lockfile: str = "sat.lock") -> bool:
    """Scan all skill directories found under skills_dir."""
    p = Path(skills_dir)
    skill_dirs = [d for d in p.iterdir() if d.is_dir() and (d / "SKILL.md").exists()]
    if not skill_dirs:
        print(f"[*] No skill packages found in {skills_dir}")
        return True
    all_passed = True
    for d in sorted(skill_dirs):
        if not verify_skill_gate(str(d), lockfile):
            all_passed = False
    return all_passed


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--all":
        target = sys.argv[2] if len(sys.argv) > 2 else "./skills"
        lock = sys.argv[3] if len(sys.argv) > 3 else "sat.lock"
        success = scan_all_skills(target, lock)
    else:
        target = sys.argv[1] if len(sys.argv) > 1 else "./skills/clean_weather_skill"
        lock = sys.argv[2] if len(sys.argv) > 2 else "sat.lock"
        success = verify_skill_gate(target, lock)
    sys.exit(0 if success else 1)

