import { DayContent } from '../types';

export const day14: DayContent = {
    day: 14,
    title: "Supply-Chain Safety: Tool & Skill Verification",
    summary: "Scan agent skills and MCP tool definitions for prompt injection, credential exfiltration, and unauthorized egress before publishing verified skills to Google Cloud Agent Registry.",
    tags: ["Security", "Governance", "Supply Chain", "Tools"],
    icon: "🛡️",
    resourceLink: "https://docs.cloud.google.com/agent-registry/overview",
    codeSnippets: [
        {
            title: "Verify a Clean vs. Poisoned Skill in 60 Seconds",
            filename: "verify_skill.py",
            language: "python",
            code: `# Day 14: Verify a clean skill vs. a poisoned skill in under 60 seconds.
# Quickstart (copy-paste into your terminal):
#   git clone https://github.com/Cybersizemore/advent-agents-supplychain-simple.git
#   cd advent-agents-supplychain-simple && ./demo-simple.sh
#
# Full Enterprise CI/CD + Google Cloud Agent Registry repo:
#   https://github.com/Cybersizemore/sec-agent-advent-supplychain-sec

import json, subprocess, sys, tempfile
from pathlib import Path

DEFAULT_AGENT_MODEL = "gemini-3.1-pro-preview"

def verify_skill(skill_dir: str) -> bool:
    """Run NVIDIA SkillSpector and block any skill with HIGH or CRITICAL findings."""
    skill_path = Path(skill_dir).resolve()
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
        report_path = Path(tmp.name)

    try:
        proc = subprocess.run(
            ["skillspector", "scan", str(skill_path), "--format", "json", "--output", str(report_path)],
            capture_output=True, text=True, check=False,
        )
        report_text = report_path.read_text(encoding="utf-8").strip()
        if not report_text:
            print(f"[ERROR] SkillSpector failed to generate report: {proc.stderr.strip()}", file=sys.stderr)
            return False
        report = json.loads(report_text)
    finally:
        report_path.unlink(missing_ok=True)

    findings = report.get("findings", [])
    blockers = [f for f in findings if f.get("severity") in ("CRITICAL", "HIGH")]

    print(f"\\n=== Scanning: {skill_path.name} ({report.get('verdict', 'UNKNOWN')}) ===")
    for f in blockers:
        loc = f.get("location", {})
        print(f"  [BLOCKED] [{f['severity']}] {f['rule_id']}: {f['message']}")
        print(f"            File: {loc.get('file')} (Line {loc.get('line')})")

    if blockers:
        print(f"[FAIL] {len(blockers)} HIGH/CRITICAL supply-chain threats blocked.")
        return False

    print(f"[PASS] Zero HIGH/CRITICAL findings. Safe for ADK ({DEFAULT_AGENT_MODEL}) consumption.")
    return True

if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Usage: python3 verify_skill.py <path-to-skill>")
    sys.exit(0 if verify_skill(sys.argv[1]) else 1)`
        }
    ],
    links: [
        {
            label: "30-Second Local Kata: Agent Skill Verification",
            url: "https://github.com/Cybersizemore/advent-agents-supplychain-simple",
            description: "Run the local SkillSpector verification gate against clean and poisoned skills in under 30 seconds."
        },
        {
            label: "Full CI/CD Gate + Google Cloud Agent Registry Pipeline",
            url: "https://github.com/Cybersizemore/sec-agent-advent-supplychain-sec",
            description: "End-to-end GitHub Actions security gate, sat.lock allowlist, ASBOM generator, and Agent Registry publisher."
        },
        {
            label: "NVIDIA SkillSpector Open-Source Scanner",
            url: "https://github.com/nvidia/skillspector",
            description: "Static AST, regex, and YARA scanner for detecting prompt injection and exfiltration in agent skills."
        },
        {
            label: "Google Cloud Agent Registry Documentation",
            url: "https://docs.cloud.google.com/agent-registry/overview",
            description: "Discover, govern, and publish verified enterprise skills and MCP tools in Google Cloud."
        }
    ],
    description: `
**Day 14 of Google's Advent of Agents — Season 3**

Every third-party skill, MCP server, or \`SKILL.md\` instruction file you attach to an agent runs with your agent's implicit privileges. Unlike traditional software packages, an agent skill mixes executable Python or Bash with natural-language instructions that steer the reasoning loop directly. A compromised skill doesn't need a zero-day exploit: a hidden prompt override in \`SKILL.md\` or an uninspected \`os.environ\` read in a helper script is enough to exfiltrate credentials on the first turn.

**How It Works**

Securing the agent supply chain requires treating every external skill and MCP tool definition as untrusted input until it passes an automated verification gate:

- **Static AST and YARA Scanning**: Run **NVIDIA SkillSpector** against every skill directory to inspect both natural-language instructions (\`SKILL.md\`) for prompt injection or MCP tool poisoning and executable scripts (\`.py\`, \`.sh\`) for environment harvesting, obfuscated payloads, and shell execution.
- **Capability Boundary and Lockfile Enforcement**: Compare every external domain and network call discovered in the skill against a strict allowlist (\`sat.lock\`), and generate an Agent Software Bill of Materials (\`asbom.json\`) recording SHA-256 file digests and declared capabilities.
- **Automated CI/CD and Agent Registry Governance**: Block pull requests automatically when \`CRITICAL\` or \`HIGH\` severity findings appear, and publish only verified skills with cryptographic provenance to **Google Cloud Agent Registry** (\`cloudapiregistry.googleapis.com\`).

**Why Static + Semantic Verification Matters**

Standard dependency scanners (\`pip-audit\`, \`npm audit\`) only check known CVEs in published library versions. They are completely blind to a freshly authored \`SKILL.md\` that instructs an ADK agent powered by \`gemini-3.1-pro-preview\` to dump \`os.environ\` and POST API keys to an external webhook. Combining AST analysis, YARA rules for prompt injection, and lockfile domain checks stops malicious skills in under 30 seconds before the agent ever loads them.

**Resources:**

- [30-Second Local Kata Repository (advent-agents-supplychain-simple)](https://github.com/Cybersizemore/advent-agents-supplychain-simple)
- [Full CI/CD + Google Cloud Agent Registry Repository (sec-agent-advent-supplychain-sec)](https://github.com/Cybersizemore/sec-agent-advent-supplychain-sec)
- [NVIDIA SkillSpector Open-Source Scanner](https://github.com/nvidia/skillspector)
- [Google Cloud Agent Registry Documentation](https://docs.cloud.google.com/agent-registry/overview)
`,
    videoURL: "https://www.youtube.com/embed/9A-CzJNxZp0"
};
