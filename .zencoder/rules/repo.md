---
description: Repository Information Overview
alwaysApply: true
---

# Sparkle World Information

## Summary
Sparkle World is a whimsical, private, local-first "digital grimoire" web app designed for a 12-year-old audience. This repository currently serves as a **Context Pack** (Milestone 0), containing the initial documentation, technical specifications, and project plans needed to scaffold and build the application.

## Structure
- **.zencoder/ & .zenflow/**: Workflow configurations and instructions for AI agent automation.
- **docs/context/**: Core project documentation including `PRD.md`, `STACK.md`, `DESIGN.md`, and `PLAN.md`.
- **docs/evidence/**: Directory for capturing project milestones and validation results.
- **SPEC.md**: The master technical specification derived from the project handover.

## Specification & Tools
**Type**: Documentation and Context Pack (Pre-scaffolding)  
**Version**: 1.0 (Initial Context)  
**Required Tools**: 
- **AI Agent**: Configured with `.zencoder` and `.zenflow` workflows (Anti-Gravity).
- **Web Development**: Node.js, React (planned), CRA/CRACO, Tailwind CSS.

## Key Resources
**Main Files**:
- `SPEC.md`: Comprehensive technical and architectural overview.
- `docs/context/PRD.md`: Product requirements and feature set definitions.
- `docs/context/STACK.md`: Technical stack details (React, TypeScript, Dexie.js, Web Crypto API).
- `docs/context/PLAN.md`: Milestone-based implementation strategy.

**Configuration Structure**:
- Documentation is organized within `docs/context/` to provide a clear roadmap for the AI agent to follow during the development phase.

## Usage & Operations
**Key Commands**:
The repository currently lacks a buildable project. The next operational step is to scaffold the application:
```bash
# Planned scaffolding and development commands (to be implemented)
npm install
npm start
```

**Integration Points**:
- **Archive.org**: Planned integration for fetching books and audiobooks via JSON API.
- **YouTube**: Planned integration for media embedding via iframes.
- **Browser APIs**: Utilizes Web Crypto API (AES-GCM), Web Speech API, and IndexedDB (via Dexie.js).

## Validation
**Quality Checks**:
- **Milestone Gates**: Each milestone in `PLAN.md` has specific pass criteria (e.g., "M0 Context and plan gate").
- **PLAN_REVIEW.md**: Contains an acceptance checklist for project alignment with the specification.

**Testing Approach**:
The project plans to use a local-first validation strategy, ensuring:
- **Privacy**: No plaintext diary storage (verified via Dexie inspection).
- **Responsive Design**: Mobile-first layout (verified at 320px+).
- **Offline Capability**: PWA service worker for shell persistence.
