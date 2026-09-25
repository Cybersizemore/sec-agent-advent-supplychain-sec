#!/usr/bin/env bash
#
# Supply-Chain Safety: Tool & Skill Verification Gate - GitHub Actions Trigger Demo
# Pushes both Good (Clean) and Bad (Toxic) skill branches to GitHub to trigger CI/CD runs.
#

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

echo -e "${CYAN}${BOLD}"
echo "======================================================================"
echo "🛡️  ADVENT OF AGENTS - DAY 14: GITHUB ACTIONS CI/CD GATE DEMO"
echo "======================================================================"
echo -e "${NC}"

# 1. Ensure workflow triggers on push to main and test/** branches
echo -e "${CYAN}[*] Syncing GitHub Actions workflow triggers on 'main'...${NC}"
git checkout main 2>/dev/null || true

cat << 'EOF' > .github/workflows/skill-gate.yml
name: "Supply-Chain Safety: Tool & Skill Verification Gate"

"on":
  push:
    branches:
      - main
      - "test/**"
      - "demo/**"
  pull_request:
    branches:
      - main
  workflow_dispatch:
    inputs:
      target_skill:
        description: "Select skill scenario to audit"
        required: true
        default: "clean_weather_skill"
        type: choice
        options:
          - clean_weather_skill
          - toxic_skill

permissions:
  contents: read
  id-token: write

jobs:
  verify-skills:
    name: "SkillSpector Capability Boundary Verification"
    runs-on: ubuntu-latest
    steps:
      - name: "Checkout Code"
        uses: actions/checkout@v4

      - name: "Set up Python"
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: "Install uv"
        uses: astral-sh/setup-uv@v5
        with:
          enable-cache: true

      - name: "Install SkillSpector"
        run: |
          uv tool install git+https://github.com/NVIDIA/skillspector.git
          echo "$HOME/.local/bin" >> $GITHUB_PATH

      - name: "Audit Clean Skill (Scenario 1: Compliant Enterprise Skill)"
        if: |
          (github.event_name == 'push' && !contains(github.ref_name, 'toxic')) ||
          (github.event_name == 'workflow_dispatch' && inputs.target_skill == 'clean_weather_skill') ||
          (github.event_name == 'pull_request' && !contains(github.event.pull_request.title, 'toxic'))
        run: |
          python3 verify_skill_gate.py ./skills/clean_weather_skill sat.lock

      - name: "Audit Toxic Skill (Scenario 2: Boundary Breach Simulation)"
        if: |
          (github.event_name == 'push' && contains(github.ref_name, 'toxic')) ||
          (github.event_name == 'workflow_dispatch' && inputs.target_skill == 'toxic_skill') ||
          (github.event_name == 'pull_request' && contains(github.event.pull_request.title, 'toxic'))
        run: |
          python3 verify_skill_gate.py ./skills/toxic_skill sat.lock

      - name: "Authenticate to Google Cloud (WIF)"
        if: |
          success() &&
          vars.GCP_WIF_PROVIDER != '' &&
          ((github.event_name == 'push' && !contains(github.ref_name, 'toxic')) || inputs.target_skill == 'clean_weather_skill')
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ vars.GCP_WIF_PROVIDER }}
          service_account: ${{ vars.GCP_SERVICE_ACCOUNT }}

      - name: "Set up Cloud SDK"
        if: |
          success() &&
          vars.GCP_WIF_PROVIDER != '' &&
          ((github.event_name == 'push' && !contains(github.ref_name, 'toxic')) || inputs.target_skill == 'clean_weather_skill')
        uses: google-github-actions/setup-gcloud@v2
        with:
          install_components: alpha

      - name: "Register Approved Skill to Google Cloud Agent Registry"
        if: |
          success() &&
          ((github.event_name == 'push' && !contains(github.ref_name, 'toxic')) || inputs.target_skill == 'clean_weather_skill')
        env:
          GCP_PROJECT: ${{ vars.GCP_PROJECT_ID || 'your-gcp-project-id' }}
          GCP_LOCATION: ${{ vars.GCP_LOCATION || 'global' }}
        run: |
          python3 register_skill.py ./skills/clean_weather_skill asbom.json

      - name: "Upload Certified Skill Package & ASBOM"
        if: |
          success() &&
          ((github.event_name == 'push' && !contains(github.ref_name, 'toxic')) || inputs.target_skill == 'clean_weather_skill')
        uses: actions/upload-artifact@v4
        with:
          name: "agent-platform-certified-skill"
          path: |
            asbom.json
            registered_*_manifest.json
            *.zip
EOF

git add .github/workflows/skill-gate.yml demo.sh register_skill.py verify_skill_gate.py
if ! git diff --cached --quiet; then
    git commit -m "fix(security): enforce strict URL hostname parsing and skill_name validation"
    git push origin main
fi

# 2. Push Good (Clean) Skill Branch
echo -e "\n${BLUE}${BOLD}----------------------------------------------------------------------${NC}"
echo -e "${BLUE}${BOLD}🚀 1/2: PUSHING GOOD SKILL SCENARIO (test/clean-weather-skill)${NC}"
echo -e "${BLUE}${BOLD}----------------------------------------------------------------------${NC}"

git checkout -B test/clean-weather-skill main
date -u "+%Y-%m-%dT%H:%M:%SZ" > .clean-trigger
git add .clean-trigger
git commit -m "feat: verify clean weather skill [$(date -u +%H:%M:%S)]"
git push -u origin test/clean-weather-skill --force
echo -e "${GREEN}${BOLD}✔ Triggered GitHub Actions for 'test/clean-weather-skill' (Expected: PASS / GREEN)${NC}"

# 3. Push Bad (Toxic) Skill Branch
echo -e "\n${YELLOW}${BOLD}----------------------------------------------------------------------${NC}"
echo -e "${YELLOW}${BOLD}🚀 2/2: PUSHING BAD SKILL SCENARIO (test/toxic-weather-skill)${NC}"
echo -e "${YELLOW}${BOLD}----------------------------------------------------------------------${NC}"

git checkout -B test/toxic-weather-skill main
date -u "+%Y-%m-%dT%H:%M:%SZ" > .toxic-trigger
git add .toxic-trigger
git commit -m "test: simulate toxic weather skill breach [$(date -u +%H:%M:%S)]"
git push -u origin test/toxic-weather-skill --force
echo -e "${GREEN}${BOLD}✔ Triggered GitHub Actions for 'test/toxic-weather-skill' (Expected: FAIL / BLOCKED)${NC}"

# Return to main
git checkout main

echo -e "\n${GREEN}${BOLD}======================================================================${NC}"
echo -e "${GREEN}${BOLD}✔ BOTH GITHUB ACTIONS PIPELINES TRIGGERED!${NC}"
echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo -e "👉 Watch both runs live in GitHub Actions:"
echo -e "   ${CYAN}${BOLD}https://github.com/Cybersizemore/sec-agent-advent-supplychain-sec/actions${NC}\n"
echo -e "   • ${GREEN}test/clean-weather-skill${NC} -> Passes scan, generates ASBOM, registers to Agent Registry"
echo -e "   • ${RED}test/toxic-weather-skill${NC} -> Fails scan (Prompt Injection + C2 Egress), blocks build\n"
