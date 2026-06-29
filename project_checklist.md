# Project Tracker: Internal Operating System

This checklist tracks the implementation progress of the complete internal operating system, divided by the planned phases.

## 🟡 PHASE 1 — Operational Dashboard + Client Management + Automation
**Goal:** Build complete internal operating system for agency (Operations, Workflow, Automation, Basic AI).
**Duration:** 10–12 weeks

### Module 1 — Authentication & Access Control
- [x] JWT auth implementation
- [x] Login / Logout flows
- [x] RBAC (Role-Based Access) setup
- [ ] Define precise roles: Admin, Manager, Team Lead, Employee
- [ ] Permissions: Manager-only AI bot
- [ ] Permissions: Module restrictions based on role

### Module 2 — Client Management
- [x] Add / Edit / Delete client
- [x] Client profile
- [x] Client status (Active, Hold, Lost, Completed)
- [ ] Industry type field
- [ ] Notes system for clients
- [ ] Client documents upload
- [ ] Client onboarding flow

### Module 3 — Task Management
- [x] Create / Assign task
- [x] Due date & Deadline
- [x] Priority (Low, Medium, High, Critical)
- [x] Status (Pending, In Progress, Completed, Overdue)
- [x] Task comments
- [ ] Start date tracking
- [ ] Subtasks
- [ ] Attachments

### Module 4 — Time Tracking
- [ ] Task start timer
- [ ] Pause / Resume timer
- [ ] Stop timer
- [ ] Manual time entry
- [ ] Daily work hours tracking
- [ ] Metrics calculation (Actual time spent, Estimated time, Delay tracking)

### Module 5 — Automation Engine
**Task Automations:**
- [ ] Auto overdue detection
- [ ] Auto status update
- [ ] Auto reminders (e.g., Task due in 24 hrs)
- [ ] Deadline alerts

**Client Automations:**
- [ ] Onboarding workflow
- [ ] Follow-up reminders
- [ ] Contract renewal reminders

**Escalation Automations:**
- [ ] Escalation alerts
- [ ] Severity-based notifications (e.g., Critical escalation → notify manager immediately)

### Module 6 — Notification System
- [x] In-app notifications
- [x] Email notifications
- [ ] Push notifications
- [ ] WhatsApp reminders (Future)
- [ ] Event triggers: Task overdue, New task assigned, Escalation raised

### Module 7 — Escalation Management
- [x] Create escalation
- [x] Severity levels (Low, Medium, High, Critical)
- [x] Status & Resolution tracking
- [ ] Manager alerts

### Module 8 — Reporting Dashboard
- [x] Total / Active clients metrics
- [x] Pending / Completed / Overdue tasks metrics
- [x] Escalations metrics
- [ ] Employee productivity reports
- [ ] Team performance reports

### Module 9 — Manager AI Assistant
- [x] Chat UI
- [x] Groq integration
- [x] Prisma DB query tools integration
- [ ] Refine specific queries (Active clients?, Pending tasks?, Overdue tasks?, Open escalations?)

---

## 🟡 PHASE 2 — RAG Knowledge System
**Goal:** Document embeddings, SOPs, reports, Vector DB.
**Duration:** 3–4 weeks
- [ ] Setup Vector DB / Embeddings architecture
- [ ] SOP ingestion pipeline
- [ ] Document search capability
- [ ] Reports retrieval

---

## 🟠 PHASE 3 — Hybrid AI Assistant
**Goal:** DB + RAG context building, smart retrieval.
**Duration:** 3–4 weeks
- [ ] Merge Structured DB Queries with Unstructured RAG Context
- [ ] Context building logic
- [ ] Smart retrieval agent

---

## 🔵 PHASE 4 — Modular Prompt System
**Goal:** Specialized modules for different agency departments.
**Duration:** 4–6 weeks
- [ ] SEO Prompt Module
- [ ] Paid Media Prompt Module
- [ ] Social Media Prompt Module
- [ ] Content Prompt Module

---

## 🔴 PHASE 5 — Intelligence Layer
**Goal:** Recommendations, strategy generation, client insights.
**Duration:** 4–6 weeks
- [ ] Client insight generation engine
- [ ] Strategy recommendation system
- [ ] Predictive health scoring for clients

---

## 🟣 PHASE 6 — Advanced Automation + AI Agents
**Goal:** Autonomous workflows, AI-driven task creation, predictive alerts.
**Duration:** 6–8 weeks
- [ ] Autonomous workflows builder
- [ ] AI-driven proactive task creation
- [ ] Predictive risk alerts
