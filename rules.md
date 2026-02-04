# Agent Project Integrity Rules

## 1. Context Verification (Mandatory)
- BEFORE proposing any code changes or suggesting a "next step," you MUST verify the current state of the project.
- DO NOT rely solely on conversation history; prioritize the "Source of Truth" in the file system.
- Check the following files in order of priority:
    1. `memory.md` (if exists)
    2. `Tasks.md` or `ImplementationPlan.md` (in the .gemini/antigravity/brain/ folder)
    3. The actual source code of the file you intend to modify.

## 2. Progress Guardrails
- If a task is listed as "Done" in the project brain but the code is missing, alert the user immediately.
- If the user asks "What's next?", perform a workspace scan of the last 5 modified files to determine the actual current state.
- NEVER suggest reverting to a previous state unless explicitly asked to "rollback."

## 3. Session Start Protocol
- At the start of every new session or after a long pause, you must:
    a) Read the last 3 entries in the conversation.
    b) Sync with the project brain.
    c) Confirm the "Current Objective" with the user before writing code.