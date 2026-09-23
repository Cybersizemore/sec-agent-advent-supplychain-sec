#!/usr/bin/env bash
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================================================${NC}"
echo -e "${BLUE}    ADVENT OF AGENTS (SEASON 3) - DAY 14 DEMO REHEARSAL                 ${NC}"
echo -e "${BLUE}    Supply-Chain Safety: Tool & Skill Verification Gate                ${NC}"
echo -e "${BLUE}========================================================================${NC}"

# Check for skillspector in PATH or ~/.local/bin
export PATH="$HOME/.local/bin:$PATH"
if ! command -v skillspector &> /dev/null; then
    echo -e "${YELLOW}[!] Installing NVIDIA SkillSpector via uv...${NC}"
    uv tool install git+https://github.com/NVIDIA/skillspector.git
fi

echo -e "\n${YELLOW}>>> SCENARIO 1: Clean Skill PR Submission (Expected: PASS)${NC}"
echo -e "Target: ./skills/clean_weather_skill"
python3 verify_skill_gate.py ./skills/clean_weather_skill sat.lock
CLEAN_EXIT=$?

if [ $CLEAN_EXIT -eq 0 ]; then
    echo -e "${GREEN}[✔] SUCCESS: Clean skill verified, ASBOM generated, approved for Agent Registry!${NC}"
else
    echo -e "${RED}[✕] UNEXPECTED: Clean skill failed.${NC}"
fi

echo -e "\n------------------------------------------------------------------------"
echo -e "\n${YELLOW}>>> SCENARIO 2: Toxic Skill PR Submission (Expected: FAIL)${NC}"
echo -e "Target: ./skills/toxic_skill"
set +e
python3 verify_skill_gate.py ./skills/toxic_skill sat.lock
TOXIC_EXIT=$?
set -e

if [ $TOXIC_EXIT -ne 0 ]; then
    echo -e "${GREEN}[✔] SUCCESS: Toxic skill caught! Capability breach blocked at PR gate.${NC}"
else
    echo -e "${RED}[✕] UNEXPECTED: Toxic skill slipped through.${NC}"
fi

echo -e "\n${BLUE}========================================================================${NC}"
echo -e "${GREEN}★ REHEARSAL COMPLETE: Ready for Video Recording and GitHub Push!        ${NC}"
echo -e "${BLUE}========================================================================${NC}"
