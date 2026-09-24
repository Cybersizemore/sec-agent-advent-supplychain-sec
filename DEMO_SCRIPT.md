# Day 14 Demo Practice & Recording Guide

This guide gives you the exact talking points, screen setup, and pacing to record the Day 14 video demo and capture the hype GIF for **Google's Advent of Agents — Season 3**.

---

## 1. Quick Screen Setup (Before Recording)

1. **Terminal:**
   - Font size: 16–18pt (high contrast, easy to read on YouTube 1080p).
   - Working Directory: `sec-agent-advent-supplychain-sec/`
   - Split panes (optional, or sequential commands).
2. **Browser Tab:**
   - Tab 1: GitHub Pull Request check showing the Actions workflow.
   - Tab 2: NVIDIA SkillSpector repo (`https://github.com/nvidia/skillspector`).
   - Tab 3: Advent of Agents portal (`adventofagents.com`).

---

## 2. Video Walkthrough Script (Target Length: ~5–7 Minutes)

### Phase 1: The Threat Problem Statement (0:00 – 1:30)
- **Speaker:**
  > *"Hi everyone, I'm Christine Sizemore, and welcome to Day 14 of Advent of Agents Season 3! Today we are tackling one of the most critical security challenges in the Agent Development Lifecycle: **Supply-Chain Safety for Tools and Skills**.*
  >
  > *As agentic architectures expand, agents no longer run in a closed loop. They install community skills, hook into Model Context Protocol (MCP) servers, and invoke third-party tools. But here is the reality check: **agent skills execute with implicit privileges**.*
  >
  > *If an agent pulls an untrusted skill that performs hidden environment variable harvesting or unconstrained socket egress, an attacker can siphon GCP service account tokens or prompt-inject the model into unauthorized database execution. We cannot rely on manual code review. We need an automated **CI/CD Build Gate**."*

### Phase 2: How It Works Technically (1:30 – 3:00)
- **Action:** Open `sat.lock` and `skills/clean_weather_skill/SKILL.md` on screen.
- **Speaker:**
  > *"Here is how our verification gate works. We combine **NVIDIA SkillSpector** with two governance primitives:*
  > 
  > 1. *First, **Capability Boundary Scanning**: SkillSpector performs static AST analysis across the skill’s code and `SKILL.md` definitions, looking for 71 vulnerability patterns including data exfiltration, prompt injection, and excessive agency.*
  > 2. *Second, **The SAT Lockfile**: Much like a package-lock.json locks your dependencies, our `sat.lock` declares permitted capabilities and network domains.*
  > 3. *Third, **ASBOM Generation**: Clean skills are certified with an Agent Software Bill of Materials and approved for our enterprise Agent Registry.*
  >
  > *Let's see this in action."*

### Phase 3: Live Demo — Clean Skill [PASS] (3:00 – 4:30)
- **Action:** In terminal, run:
  ```bash
  python3 verify_skill_gate.py ./skills/clean_weather_skill sat.lock
  python3 register_skill.py ./skills/clean_weather_skill asbom.json
  ```
- **Speaker:**
  > *"First, let's submit a Pull Request introducing `clean_weather_skill`. This tool queries weather forecasts and adheres strictly to its declared scope.*
  >
  > *Notice the output: SkillSpector scans all components, verifies that detected capabilities match the `sat.lock` manifest, generates `asbom.json`, and exits with code 0.*
  >
  > *Then, the pipeline triggers our registration step: `register_skill.py` verifies the ASBOM digest and promotes the skill directly to the central Agent Platform Skills Catalog with certified cryptographic provenance.*
  >
  > *In CI/CD, this check passes and the certified skill is published."*

### Phase 4: Live Demo — Toxic Skill [FAIL] (4:30 – 6:00)
- **Action:** Show `skills/toxic_skill/SKILL.md` briefly, highlighting line 20 (`os.environ` filtering for `KEY`, `SECRET`, `TOKEN`). Then run:
  ```bash
  python3 verify_skill_gate.py ./skills/toxic_skill sat.lock
  ```
- **Speaker:**
  > *"Now, let's examine what happens when an attacker tries to sneak a toxic skill through a PR. Here we have a seemingly innocent caching utility. But embedded inside is a payload harvesting `os.environ` for GCP credentials and establishing socket egress.*
  >
  > *Watch the build gate:*
  >
  > *Immediately, SkillSpector catches the AST pattern: **Category: Data Exfiltration, Pattern: Env Variable Harvesting at SKILL.md:20**. The capability boundary is breached! The gate fails with a non-zero exit code and immediately blocks the GitHub Pull Request before this skill can ever enter our agent environment."*

### Phase 5: Wrap-up & Resources (6:00 – 7:00)
- **Speaker:**
  > *"By enforcing tool verification at the CI/CD build gate, we turn agent supply-chain security from reactive incident response into automated, fail-closed policy.*
  >
  > *Check out the code snippet and documentation links in the Day 14 modal, clone the repo, and try it yourself. Thank you, and happy agent building!"*

---

## 3. How to Capture the "Hype" GIF (< 20 seconds)

1. Open a clean terminal window, sized 80 columns by 24 rows.
2. Start your screen-to-gif recording tool (e.g. `peek`, `asciinema`, or Mac screen recording converted via `ffmpeg`).
3. Run the rehearsal script:
   ```bash
   ./run_demo.sh
   ```
4. As the colored green and red outputs complete, stop recording.
5. Crop to ~12 seconds. Fast, punchy, high technical density!
