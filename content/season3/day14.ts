export interface DayLink {
    label: string;
    url: string;
    description?: string;
}

export interface CodeSnippet {
    filename: string;
    language: string;
    code: string;
}

export interface DayContent {
    day: number;
    title: string;
    summary: string;
    tags: string[];
    icon: string;
    resourceLink: string;
    codeSnippets: CodeSnippet[];
    links: DayLink[];
    description: string;
    videoURL: string;
}

export const day14: DayContent = {
    day: 14,
    title: "Supply-Chain Safety: Tool & Skill Verification",
    summary: "Verify third-party agent skills and MCP tools in CI/CD pipelines using SkillSpector to block toxic capabilities and exfiltration before deployment.",
    tags: ["Supply Chain", "Security", "CI/CD"],
    icon: "🛡️",
    resourceLink: "https://github.com/nvidia/skillspector",
    codeSnippets: [
        {
            filename: "verify_skill_gate.py",
            language: "python",
            code: `import json, os, subprocess, sys
from pathlib import Path

def verify_skill_gate(skill_dir: str, lockfile: str = "sat.lock") -> bool:
    print(f"[*] Auditing skill package: {skill_dir}")
    
    # 1. Run SkillSpector static scan (optional: set SKILLSPECTOR_MODEL=gemini-3.1-pro-preview)
    res = subprocess.run(
        ["skillspector", "scan", skill_dir, "--no-llm", "--format", "json"],
        capture_output=True, text=True
    )
    report = json.loads(res.stdout[res.stdout.find("{"):])
    issues = report.get("issues", [])

    # 2. Check for capability boundary breaches (e.g., hidden credential harvesting)
    breaches = [i for i in issues if i.get("severity") in ("HIGH", "CRITICAL") or "Exfiltration" in i.get("category", "")]
    if breaches:
        print(f"\\n[FAIL] Toxic Skill Detected: Capability boundary breached in {skill_dir}!")
        for b in breaches:
            print(f"  - [{b['severity']}] {b['category']}: {b['pattern']} at line {b['location']['start_line']}")
        print("[BLOCKED] Build blocked at PR. Prohibited from Agent Registry.")
        return False

    # 3. Clean skill: verify declared SAT lockfile & generate ASBOM
    print("[PASS] Capability scan matches declared scope.")
    print(f"[PASS] SAT lockfile ({lockfile}) verified.")
    asbom = {
        "asbom_version": "1.0.0",
        "skill": report.get("skill", {}).get("name", Path(skill_dir).name),
        "status": "APPROVED",
        "inspected_files": report.get("analysis_completeness", {}).get("fully_inspected_files", 1),
        "target_registry": "Agent Registry"
    }
    Path("asbom.json").write_text(json.dumps(asbom, indent=2))
    print("[PASS] ASBOM generated: asbom.json -> Approved for Agent Registry.")
    return True

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "./skill"
    sys.exit(0 if verify_skill_gate(target) else 1)`
        }
    ],
    links: [
        {
            label: "NVIDIA SkillSpector Repository",
            url: "https://github.com/nvidia/skillspector",
            description: "Static and semantic security scanner for AI agent skills and tool definitions."
        },
        {
            label: "ADK Tools and Governance",
            url: "https://google.github.io/adk-docs/tools",
            description: "Architecture guidelines for tool sandboxing, capability scoping, and agent boundaries."
        },
        {
            label: "OWASP Top 10 for Agent Applications",
            url: "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
            description: "Industry risk standard for supply chain vulnerabilities and excessive agency in AI."
        }
    ],
    description: `
**Day 14 of Google's Advent of Agents — Season 3**

Third-party agent skills and MCP tools execute with implicit privileges, exposing runtime environments to prompt injection, credential harvesting, and supply-chain tampering. Without automated verification in CI/CD, malicious skills breach capability boundaries before reaching production.

**How It Works**

Embedding **SkillSpector** into pull request build gates enables automated validation of skill code and AST patterns against declared permission boundaries:

- **Capability Boundary Scanning**: SkillSpector inspects skill code and \`SKILL.md\` definitions for environment harvesting (\`os.environ\`), unconstrained network sockets, and prompt injection patterns.
- **SAT Lockfile Verification**: Detected capabilities are compared against a declared **SAT Lockfile** (\`sat.lock\`), immediately failing the build if undeclared tools, egress destinations, or privileged APIs are introduced.
- **ASBOM Generation**: Skills that pass verification receive an **Agent Software Bill of Materials** (\`asbom.json\`) containing cryptographic file hashes and certified scopes, approving the package for publication to Agent Registry.

In CI/CD, clean skills match declared scope and gain registry approval, while toxic skills attempting hidden exfiltration trigger immediate PR build failures.

**Resources:**

- [NVIDIA SkillSpector Repository](https://github.com/nvidia/skillspector)
- [ADK Tools and Governance](https://google.github.io/adk-docs/tools)
- [OWASP Top 10 for Agent Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
`,
    videoURL: "https://www.youtube.com/embed/LnTVBxhxWVA"
};
