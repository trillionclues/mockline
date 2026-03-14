# Mockline Dashboard — Full Implementation Guide

> Build order matters. Each section depends on the one before it.
> Shell first, then data pages, then complex tools.

---

## Table of Contents

1. [Current State Audit](#1-current-state-audit)
2. [Design Constraints](#2-design-constraints)
3. [File Map — Everything You'll Create](#3-file-map--everything-youll-create)
4. [Phase 1 — Shell (Sidebar, Topbar, Layout)](#4-phase-1--shell-sidebar-topbar-layout)
5. [Phase 2 — Overview Page](#5-phase-2--overview-page)
6. [Phase 3 — Specs Pages](#6-phase-3--specs-pages)
7. [Phase 4 — Mocks Pages](#7-phase-4--mocks-pages)
8. [Phase 5 — Contracts Page](#8-phase-5--contracts-page)
9. [Phase 6 — Schema Diff Page](#9-phase-6--schema-diff-page)
10. [Phase 7 — API Explorer Page](#10-phase-7--api-explorer-page)
11. [Phase 8 — Settings Page](#11-phase-8--settings-page)
12. [Shared Components Catalogue](#12-shared-components-catalogue)
13. [Mobile Responsiveness Strategy](#13-mobile-responsiveness-strategy)
14. [State Management Patterns](#14-state-management-patterns)
15. [Implementation Checklist](#15-implementation-checklist)

---

## 1. Current State Audit

### What exists and works
- `(dashboard)/layout.tsx` — shell layout with sidebar + topbar
- `Sidebar` — nav links, active state, Settings link at bottom
- `Topbar` — page title + theme toggle
- `(dashboard)/overview/page.tsx` — placeholder only
- `(dashboard)/specs/page.tsx` — server component, fetches specs, passes to `SpecsView`
- `SpecsView` — query wrapper, upload button, empty state
- `SpecsTable` — renders spec rows, `...` button (no action yet)
- `UploadSpecModal` — create spec mutation, works end to end
- `SpecsEmptyState` — upload prompt

### What's missing
- User identity anywhere in the UI — no avatar, name, or logout
- Mobile sidebar — no drawer, no hamburger
- Spec detail page — click on a row goes nowhere
- All of `/mocks` — page, provision flow, status polling
- All of `/contracts` — run, results, expandable rows
- All of `/diff` — version selector, diff viewer
- All of `/explorer` — endpoint list, request form, response panel
- All of `/settings` — profile, danger zone
- Shared primitives — `StatusBadge`, `EmptyState`, `PageHeader`, `ConfirmDialog`, `CopyButton`

### What needs fixing in existing code
- `SpecsTable` rows are not clickable — need `onClick` → `/specs/[id]`
- `SpecsView` has double padding — `padding: '32px 48px'` inside a layout that already has `padding: '24px'`
- `Sidebar` logo is plain text — should use `MocklineWordmark`
- `Topbar` has no user section
- `onMouseEnter/onMouseLeave` inline handlers in several components — move to CSS classes

---

## 2. Design Constraints

These are non-negotiable. Everything below must respect them.

```
Colors:     Always use CSS variables. Never hardcode hex in components.
Borders:    border-radius max 8px (12px exception for cards/modals only)
Buttons:    Primary = background var(--color-primary), color var(--color-bg)
            Secondary = border var(--color-border), background transparent
            Height = 36px for standard, 28px for compact
Hover:      Use CSS classes in globals.css, not onMouseEnter/onMouseLeave
            Exception: imperative state changes (e.g. table row highlight) OK inline
Shadows:    max 0 2px 8px rgba(0,0,0,0.15). Modal overlay is an exception.
Typography: Headings use var(--font-family-heading). Body uses var(--font-family-sans).
Status:     RUNNING  = var(--color-status-running)   #22c55e
            BUILDING = var(--color-status-building)  #C0B87A
            STOPPED  = var(--color-status-stopped)   #71717a
            FAILED   = var(--color-status-failed)    #ef4444
Polling:    useQuery refetchInterval for live mock status. Stop polling on terminal state.
```

---

## 3. File Map — Everything You'll Create

```
apps/web/src/
├── app/(dashboard)/
│   ├── layout.tsx                          ← update (session fetch, DashboardShell)
│   ├── overview/
│   │   └── page.tsx                        ← replace placeholder
│   ├── specs/
│   │   ├── page.tsx                        ← exists, minor fix
│   │   └── [id]/
│   │       └── page.tsx                    ← new
│   ├── mocks/
│   │   ├── page.tsx                        ← new
│   │   └── [id]/
│   │       └── page.tsx                    ← new
│   ├── contracts/
│   │   └── page.tsx                        ← new
│   ├── diff/
│   │   └── page.tsx                        ← new
│   ├── explorer/
│   │   └── page.tsx                        ← new
│   └── settings/
│       └── page.tsx                        ← new
│
├── components/
│   ├── shell/
│   │   ├── Sidebar.tsx                     ← rewrite
│   │   ├── Topbar.tsx                      ← rewrite
│   │   ├── DashboardShell.tsx              ← new
│   │   └── MobileSidebarDrawer.tsx         ← new
│   │
│   ├── shared/
│   │   ├── StatusBadge.tsx                 ← new
│   │   ├── EmptyState.tsx                  ← new
│   │   ├── PageHeader.tsx                  ← new
│   │   ├── ConfirmDialog.tsx               ← new
│   │   └── CopyButton.tsx                  ← new
│   │
│   ├── specs/
│   │   ├── SpecsView.tsx                   ← fix double padding
│   │   ├── SpecsTable.tsx                  ← add row click + delete action
│   │   ├── SpecsEmptyState.tsx             ← exists, no change
│   │   ├── UploadSpecModal.tsx             ← exists, no change
│   │   ├── SpecDetailView.tsx              ← new
│   │   └── VersionHistoryTable.tsx         ← new
│   │
│   ├── mocks/
│   │   ├── MocksView.tsx                   ← new
│   │   ├── MocksTable.tsx                  ← new
│   │   ├── MocksEmptyState.tsx             ← new
│   │   ├── ProvisionMockModal.tsx          ← new
│   │   └── MockDetailView.tsx              ← new
│   │
│   ├── contracts/
│   │   ├── ContractsView.tsx               ← new
│   │   ├── RunContractModal.tsx            ← new
│   │   ├── ContractResultsTable.tsx        ← new
│   │   └── EndpointResultRow.tsx           ← new
│   │
│   ├── diff/
│   │   ├── DiffView.tsx                    ← new
│   │   ├── VersionSelector.tsx             ← new
│   │   └── DiffViewer.tsx                  ← new
│   │
│   └── explorer/
│       ├── ExplorerView.tsx                ← new
│       ├── EndpointList.tsx                ← new
│       ├── RequestPanel.tsx                ← new
│       └── ResponsePanel.tsx               ← new
```

---

## 4. Phase 1 — Shell (Sidebar, Topbar, Layout)

### 4.1 — globals.css additions

Add all of this to your existing `globals.css`. Nothing here replaces what's already there.

```css
/* ── Spin animation (used by StatusBadge) ── */
@keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
}

/* ── Dashboard shell ── */
.dashboard-shell {
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: var(--color-bg);
}

.dashboard-sidebar-desktop {
    display: flex;
}

.dashboard-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
}

.dashboard-main {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
}

.dashboard-main-inner {
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
}

/* ── Sidebar ── */
.sidebar {
    width: 220px;
    flex-shrink: 0;
    height: 100vh;
    background: var(--color-surface);
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.sidebar-header {
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
}

.sidebar-hamburger {
    display: none;
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
}

.sidebar-nav {
    flex: 1;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow-y: auto;
}

.sidebar-nav-item {
    display: flex;
    align-items: center;
    height: 36px;
    padding: 0 12px;
    border-radius: 6px;
    font-size: 13px;
    color: var(--color-text-muted);
    background: transparent;
    border-left: 2px solid transparent;
    text-decoration: none;
    transition: color 120ms ease, background 120ms ease;
    cursor: pointer;
    font-family: var(--font-family-sans);
}

.sidebar-nav-item:hover {
    color: var(--color-text-strong) !important;
    background: var(--color-surface-2) !important;
}

.sidebar-nav-item.active {
    color: var(--color-text-strong);
    background: var(--color-primary-muted);
    border-left: 2px solid var(--color-primary);
}

.sidebar-section-label {
    font-size: 11px;
    color: var(--color-text-subtle);
    padding: 12px 12px 4px;
    font-family: var(--font-family-sans);
}

.sidebar-footer {
    padding: 8px;
    border-top: 1px solid var(--color-border);
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.sidebar-user {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 6px;
    margin-top: 4px;
}

.sidebar-user-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    flex-shrink: 0;
    object-fit: cover;
}

.sidebar-user-avatar-fallback {
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text);
}

.sidebar-user-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.sidebar-user-name {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-strong);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.sidebar-user-email {
    font-size: 11px;
    color: var(--color-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.sidebar-logout-btn {
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    flex-shrink: 0;
    transition: color 120ms ease;
}

.sidebar-logout-btn:hover {
    color: var(--color-text-strong);
}

/* ── Topbar ── */
.topbar {
    height: 48px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg);
}

.topbar-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-strong);
}

.topbar-mobile-menu {
    display: none;
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
}

/* ── Mobile drawer ── */
.mobile-drawer-backdrop {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 40;
}

.mobile-drawer {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 50;
    transform: translateX(-100%);
    transition: transform 280ms cubic-bezier(0.21, 0.47, 0.32, 0.98);
}

.mobile-drawer.open {
    transform: translateX(0);
}

/* ── Shared component classes ── */
.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
}

.page-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-strong);
    margin-bottom: 4px;
}

.page-description {
    font-size: 13px;
    color: var(--color-text-muted);
}

.section-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-muted);
    margin-bottom: 12px;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 24px;
    background: var(--color-surface);
    border: 1px dashed var(--color-border);
    border-radius: 8px;
    text-align: center;
}

.empty-state-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    background: var(--color-surface-2);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    color: var(--color-text-muted);
}

.empty-state-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-strong);
    margin-bottom: 8px;
}

.empty-state-desc {
    font-size: 13px;
    color: var(--color-text-muted);
    max-width: 320px;
    margin-bottom: 24px;
}

/* ── Buttons ── */
.btn-primary {
    height: 36px;
    padding: 0 16px;
    background: var(--color-primary);
    color: var(--color-bg);
    border: none;
    border-radius: 6px;
    font-weight: 500;
    font-size: 13px;
    cursor: pointer;
    transition: opacity 120ms ease;
    font-family: var(--font-family-sans);
}

.btn-primary:hover { opacity: 0.88; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-secondary {
    height: 36px;
    padding: 0 16px;
    background: transparent;
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-weight: 500;
    font-size: 13px;
    cursor: pointer;
    transition: background 120ms ease, border-color 120ms ease;
    font-family: var(--font-family-sans);
}

.btn-secondary:hover { background: var(--color-surface-2); border-color: var(--color-text-subtle); }
.btn-secondary:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-destructive {
    height: 36px;
    padding: 0 16px;
    background: transparent;
    color: var(--color-destructive);
    border: 1px solid var(--color-destructive);
    border-radius: 6px;
    font-weight: 500;
    font-size: 13px;
    cursor: pointer;
    transition: background 120ms ease;
    font-family: var(--font-family-sans);
}

.btn-destructive:hover { background: rgba(239, 68, 68, 0.08); }

.btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    color: var(--color-text-muted);
    transition: color 120ms ease, background 120ms ease;
    padding: 0;
}

.btn-icon:hover { color: var(--color-text-strong); background: var(--color-surface-2); }
.btn-icon.destructive:hover { color: var(--color-destructive); background: rgba(239,68,68,0.08); }

/* ── Forms ── */
.form-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text);
}

.form-label-optional {
    font-weight: 400;
    color: var(--color-text-muted);
}

.form-input,
.form-select,
.form-textarea {
    width: 100%;
    padding: 8px 12px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    color: var(--color-text-strong);
    font-size: 14px;
    outline: none;
    transition: border-color 120ms ease;
    font-family: var(--font-family-sans);
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
    border-color: var(--color-text-subtle);
}

.form-select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
}

.form-hint {
    font-size: 12px;
    color: var(--color-text-muted);
    margin-top: 6px;
}

/* ── Modal ── */
.modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(10, 10, 11, 0.8);
    backdrop-filter: blur(4px);
}

.modal-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    width: 100%;
    max-width: 560px;
    padding: 32px;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.modal-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-strong);
}

.modal-subtitle {
    font-size: 13px;
    color: var(--color-text-muted);
    margin-top: -12px;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 8px;
}

/* ── Copy button ── */
.copy-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: transparent;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    color: var(--color-text-muted);
    transition: color 120ms ease;
    flex-shrink: 0;
}

.copy-btn:hover { color: var(--color-text-strong); }

/* ── Overview ── */
.overview-summary {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    margin-top: 8px;
}

.overview-count {
    font-weight: 600;
    color: var(--color-primary);
}

.overview-label {
    color: var(--color-text-muted);
}

.overview-divider {
    color: var(--color-border);
}

.overview-mock-list {
    display: flex;
    flex-direction: column;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    overflow: hidden;
}

.overview-mock-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-border);
    text-decoration: none;
    transition: background 120ms ease;
}

.overview-mock-row:last-child { border-bottom: none; }
.overview-mock-row:hover { background: var(--color-surface-2); }

.overview-mock-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-strong);
    display: block;
}

.overview-mock-spec {
    font-size: 11px;
    color: var(--color-text-muted);
    display: block;
}

.overview-mock-url {
    font-size: 11px;
    color: var(--color-text-subtle);
    font-family: var(--font-family-mono);
}

.overview-empty {
    font-size: 13px;
    color: var(--color-text-muted);
    padding: 24px;
    background: var(--color-surface);
    border: 1px dashed var(--color-border);
    border-radius: 8px;
}

.inline-link {
    color: var(--color-primary);
    text-decoration: none;
}

.inline-link:hover { text-decoration: underline; }

.view-all-link {
    font-size: 12px;
    color: var(--color-text-muted);
    text-decoration: none;
    transition: color 120ms ease;
}

.view-all-link:hover { color: var(--color-text-strong); }

/* ── Method badges (API Explorer + Contracts) ── */
.method-badge {
    display: inline-flex;
    align-items: center;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    font-family: var(--font-family-mono);
    flex-shrink: 0;
}

.method-get    { background: rgba(34,197,94,0.1);  color: #22c55e; }
.method-post   { background: rgba(59,130,246,0.1); color: #3b82f6; }
.method-put    { background: rgba(234,179,8,0.1);  color: #eab308; }
.method-patch  { background: rgba(249,115,22,0.1); color: #f97316; }
.method-delete { background: rgba(239,68,68,0.1);  color: #ef4444; }

/* ── Settings ── */
.settings-section {
    padding: 24px 0;
    border-bottom: 1px solid var(--color-border);
}

.settings-section:last-child { border-bottom: none; }

.settings-danger {
    margin-top: 8px;
}

.settings-profile {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 16px;
}

.settings-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
}

.settings-avatar-fallback {
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text);
}

.settings-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-strong);
}

.settings-email {
    font-size: 13px;
    color: var(--color-text-muted);
    margin-top: 2px;
}

.settings-oauth-note {
    font-size: 11px;
    color: var(--color-text-subtle);
    margin-top: 4px;
}

.settings-danger-desc {
    font-size: 13px;
    color: var(--color-text-muted);
    margin-top: 8px;
    margin-bottom: 16px;
    max-width: 480px;
}

/* ── Explorer ── */
.explorer-layout {
    display: flex;
    gap: 16px;
    height: calc(100vh - 160px);
}

.explorer-endpoint-list {
    width: 280px;
    flex-shrink: 0;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    overflow-y: auto;
}

.explorer-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow-y: auto;
    min-width: 0;
}

.explorer-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200px;
    background: var(--color-surface);
    border: 1px dashed var(--color-border);
    border-radius: 8px;
    font-size: 13px;
    color: var(--color-text-muted);
}

.endpoint-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    cursor: pointer;
    border-bottom: 1px solid var(--color-border);
    transition: background 120ms ease;
}

.endpoint-item:last-child { border-bottom: none; }
.endpoint-item:hover { background: var(--color-surface-2); }
.endpoint-item.active { background: var(--color-primary-muted); }

.endpoint-path {
    font-size: 12px;
    font-family: var(--font-family-mono);
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.endpoint-summary {
    font-size: 11px;
    color: var(--color-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* ── Contracts ── */
.contract-result-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 8px 16px;
    font-size: 13px;
    border-bottom: 1px solid var(--color-border);
}

.contract-result-row:last-child { border-bottom: none; }

.result-path {
    flex: 1;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.result-detail {
    font-size: 11px;
    color: var(--color-text-muted);
    margin-top: 4px;
    padding: 4px 8px;
    background: var(--color-surface-2);
    border-radius: 4px;
    width: 100%;
}

/* ── Diff ── */
.diff-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
}

/* ── Mobile ── */
@media (max-width: 768px) {
    .dashboard-sidebar-desktop { display: none; }
    .topbar-mobile-menu { display: flex; }
    .mobile-drawer-backdrop { display: block; }
    .mobile-drawer { display: flex; }
    .dashboard-main { padding: 16px; }
    .explorer-layout { flex-direction: column; height: auto; }
    .explorer-endpoint-list { width: 100%; height: 240px; }
    .modal-card { max-width: calc(100% - 32px) !important; padding: 24px; }
    .diff-controls { flex-direction: column; align-items: stretch; }
}

@media (max-width: 480px) {
    .dashboard-main { padding: 12px; }
    .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
    .page-header .btn-primary { width: 100%; }
    .overview-summary { flex-wrap: wrap; }
}
```

### 4.2 — Rewrite `Sidebar.tsx`

```tsx
'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { MocklineWordmark } from '@/components/brand'
import { LogOut, Settings } from 'lucide-react'

const NAV = [
    { href: '/overview', label: 'Overview' },
    { href: '/specs', label: 'Specs' },
    { href: '/mocks', label: 'Mock Servers' },
    { href: '/contracts', label: 'Contracts' },
]

const TOOLS = [
    { href: '/diff', label: 'Schema Diff' },
    { href: '/explorer', label: 'API Explorer' },
]

type User = { name?: string | null; email?: string | null; image?: string | null }

type Props = {
    user?: User
    onMobileMenuOpen?: () => void
}

export function Sidebar({ user, onMobileMenuOpen }: Props) {
    const pathname = usePathname()
    const router = useRouter()

    const isActive = (href: string) => pathname.startsWith(href)

    const handleLogout = async () => {
        await authClient.signOut()
        router.push('/login')
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                    <MocklineWordmark size={16} />
                </Link>
                <button
                    className="sidebar-hamburger"
                    onClick={onMobileMenuOpen}
                    aria-label="Close menu"
                >
                    ✕
                </button>
            </div>

            <nav className="sidebar-nav">
                {NAV.map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`sidebar-nav-item ${isActive(item.href) ? 'active' : ''}`}
                    >
                        {item.label}
                    </Link>
                ))}

                <span className="sidebar-section-label">Tools</span>

                {TOOLS.map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`sidebar-nav-item ${isActive(item.href) ? 'active' : ''}`}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="sidebar-footer">
                <Link
                    href="/settings"
                    className={`sidebar-nav-item ${isActive('/settings') ? 'active' : ''}`}
                >
                    <Settings size={14} style={{ marginRight: '8px', opacity: 0.6 }} />
                    Settings
                </Link>

                {user && (
                    <div className="sidebar-user">
                        {user.image ? (
                            <img
                                src={user.image}
                                alt={user.name ?? 'User'}
                                className="sidebar-user-avatar"
                            />
                        ) : (
                            <div className="sidebar-user-avatar sidebar-user-avatar-fallback">
                                {(user.name ?? user.email ?? 'U')[0].toUpperCase()}
                            </div>
                        )}
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-name">{user.name ?? 'User'}</span>
                            <span className="sidebar-user-email">{user.email}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="sidebar-logout-btn"
                            title="Sign out"
                        >
                            <LogOut size={14} />
                        </button>
                    </div>
                )}
            </div>
        </aside>
    )
}
```

### 4.3 — Rewrite `Topbar.tsx`

```tsx
'use client'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '../theme-toggle'
import { Menu } from 'lucide-react'

const TITLES: Record<string, string> = {
    '/overview': 'Overview',
    '/specs': 'Specs',
    '/mocks': 'Mock Servers',
    '/contracts': 'Contracts',
    '/diff': 'Schema Diff',
    '/explorer': 'API Explorer',
    '/settings': 'Settings',
}

type Props = { onMobileMenuOpen?: () => void }

export function Topbar({ onMobileMenuOpen }: Props) {
    const pathname = usePathname()
    const title = Object.entries(TITLES).find(
        ([key]) => pathname.startsWith(key)
    )?.[1] ?? 'Mockline'

    return (
        <header className="topbar">
            <button
                className="topbar-mobile-menu"
                onClick={onMobileMenuOpen}
                aria-label="Open menu"
            >
                <Menu size={18} />
            </button>
            <span className="topbar-title">{title}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ThemeToggle size="small" />
            </div>
        </header>
    )
}
```

### 4.4 — Create `DashboardShell.tsx`

```tsx
'use client'
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileSidebarDrawer } from './MobileSidebarDrawer'

type User = { name?: string | null; email?: string | null; image?: string | null }

export function DashboardShell({
    children,
    user,
}: {
    children: React.ReactNode
    user: User
}) {
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <div className="dashboard-shell">
            <div className="dashboard-sidebar-desktop">
                <Sidebar user={user} />
            </div>

            <MobileSidebarDrawer
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                user={user}
            />

            <div className="dashboard-content">
                <Topbar onMobileMenuOpen={() => setMobileOpen(true)} />
                <main className="dashboard-main">
                    <div className="dashboard-main-inner">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
```

### 4.5 — Create `MobileSidebarDrawer.tsx`

```tsx
'use client'
import { useEffect } from 'react'
import { Sidebar } from './Sidebar'

type User = { name?: string | null; email?: string | null; image?: string | null }

type Props = {
    open: boolean
    onClose: () => void
    user?: User
}

export function MobileSidebarDrawer({ open, onClose, user }: Props) {
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    return (
        <>
            {open && (
                <div className="mobile-drawer-backdrop" onClick={onClose} />
            )}
            <div className={`mobile-drawer ${open ? 'open' : ''}`}>
                <Sidebar user={user} onMobileMenuOpen={onClose} />
            </div>
        </>
    )
}
```

### 4.6 — Update `layout.tsx`

```tsx
import { DashboardShell } from '@/components/shell/DashboardShell'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getSession()
    if (!session) redirect('/login')

    return (
        <DashboardShell user={session.user}>
            {children}
        </DashboardShell>
    )
}
```

---

## 5. Phase 2 — Overview Page

### `app/(dashboard)/overview/page.tsx`

```tsx
import { specsApi, mocksApi } from '@/lib/api-client'
import { headers } from 'next/headers'
import { OverviewView } from '@/components/overview/OverviewView'

export default async function OverviewPage() {
    const reqHeaders = await headers()
    const cookie = reqHeaders.get('cookie')
    const apiHeaders: Record<string, string> = {}
    if (cookie) apiHeaders.cookie = cookie

    const [specs, mocks] = await Promise.all([
        specsApi.list({ headers: apiHeaders }),
        mocksApi.list({ headers: apiHeaders }),
    ])

    return <OverviewView specs={specs} mocks={mocks} />
}
```

### `components/overview/OverviewView.tsx`

```tsx
'use client'
import Link from 'next/link'
import type { Spec, MockServer } from '@/lib/api-client'
import { StatusBadge } from '@/components/shared/StatusBadge'

type Props = { specs: Spec[]; mocks: MockServer[] }

export function OverviewView({ specs, mocks }: Props) {
    const running = mocks.filter(m => m.status === 'RUNNING').length
    const failed  = mocks.filter(m => m.status === 'FAILED').length
    const recent  = [...mocks]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
                <h1 className="page-title">Overview</h1>
                <div className="overview-summary">
                    <span>
                        <span className="overview-count">{specs.length}</span>
                        <span className="overview-label"> specs</span>
                    </span>
                    <span className="overview-divider">·</span>
                    <span>
                        <span className="overview-count" style={{ color: 'var(--color-status-running)' }}>
                            {running}
                        </span>
                        <span className="overview-label"> running</span>
                    </span>
                    {failed > 0 && (
                        <>
                            <span className="overview-divider">·</span>
                            <span>
                                <span className="overview-count" style={{ color: 'var(--color-status-failed)' }}>
                                    {failed}
                                </span>
                                <span className="overview-label"> failed</span>
                            </span>
                        </>
                    )}
                </div>
            </div>

            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h2 className="section-title" style={{ marginBottom: 0 }}>Recent mock servers</h2>
                    <Link href="/mocks" className="view-all-link">View all</Link>
                </div>

                {recent.length === 0 ? (
                    <div className="overview-empty">
                        No mock servers yet.{' '}
                        <Link href="/mocks" className="inline-link">Provision your first →</Link>
                    </div>
                ) : (
                    <div className="overview-mock-list">
                        {recent.map(mock => (
                            <Link key={mock.id} href={`/mocks/${mock.id}`} className="overview-mock-row">
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <span className="overview-mock-name">{mock.spec.name}</span>
                                    <span className="overview-mock-spec">v{mock.specVersion.version}</span>
                                </div>
                                <StatusBadge status={mock.status} />
                                {mock.publicUrl && (
                                    <span
                                        className="overview-mock-url"
                                        onClick={e => e.preventDefault()}
                                    >
                                        {mock.publicUrl}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
```

---

## 6. Phase 3 — Specs Pages

### Fix `SpecsView.tsx`

Remove `padding: '32px 48px'` from the outer container. The layout already
applies `padding: '24px'`. `SpecsView` should have no padding of its own.

### Fix `SpecsTable.tsx`

```tsx
'use client'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { specsApi, type Spec } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { useState, useRef } from 'react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

export function SpecsTable({ specs }: { specs: Spec[] }) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [deleteTarget, setDeleteTarget] = useState<Spec | null>(null)
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

    const deleteMutation = useMutation({
        mutationFn: (id: string) => specsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.specs.all() })
            setDeleteTarget(null)
        },
    })

    return (
        <>
            <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                overflowX: 'auto',
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                            <th style={thStyle}>Name</th>
                            <th style={thStyle}>Format</th>
                            <th style={thStyle}>Versions</th>
                            <th style={thStyle}>Mocks</th>
                            <th style={thStyle}>Added</th>
                            <th style={{ ...thStyle, width: '40px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {specs.map(spec => (
                            <tr
                                key={spec.id}
                                onClick={() => router.push(`/specs/${spec.id}`)}
                                style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 120ms ease' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                            >
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: 500, color: 'var(--color-text-strong)' }}>
                                        {spec.name}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                        {spec.id.substring(0, 8)}
                                    </div>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '1px 6px',
                                        background: 'var(--color-surface-2)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontFamily: 'var(--font-family-mono)',
                                        color: 'var(--color-text-muted)',
                                    }}>
                                        {spec.format}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ color: 'var(--color-text-muted)' }}>
                                        {spec.versions?.length ?? 0}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ color: 'var(--color-text-muted)' }}>
                                        {spec._count?.mockServers ?? 0}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ color: 'var(--color-text-muted)' }}>
                                        {new Date(spec.createdAt).toLocaleDateString()}
                                    </span>
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                    <button
                                        className="btn-icon destructive"
                                        onClick={e => {
                                            e.stopPropagation()
                                            setDeleteTarget(spec)
                                        }}
                                        title="Delete spec"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title={`Delete "${deleteTarget?.name}"`}
                description="This will permanently delete the spec, all its versions, and any associated mock servers."
                confirmWord="DELETE"
                variant="destructive"
                onConfirm={() => deleteMutation.mutateAsync(deleteTarget!.id)}
            />
        </>
    )
}

const thStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--color-text-subtle)',
    padding: '10px 16px',
}

const tdStyle: React.CSSProperties = {
    fontSize: '13px',
    color: 'var(--color-text)',
    padding: '14px 16px',
}
```

### `app/(dashboard)/specs/[id]/page.tsx`

```tsx
import { specsApi } from '@/lib/api-client'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { SpecDetailView } from '@/components/specs/SpecDetailView'

export default async function SpecDetailPage({ params }: { params: { id: string } }) {
    const reqHeaders = await headers()
    const cookie = reqHeaders.get('cookie')
    const apiHeaders: Record<string, string> = {}
    if (cookie) apiHeaders.cookie = cookie

    try {
        const [spec, versions] = await Promise.all([
            specsApi.get(params.id, { headers: apiHeaders }),
            specsApi.getVersions(params.id, { headers: apiHeaders }),
        ])
        return <SpecDetailView spec={spec} initialVersions={versions} />
    } catch {
        notFound()
    }
}
```

### `components/specs/SpecDetailView.tsx`

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { specsApi, type SpecDetail, type SpecVersion } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { VersionHistoryTable } from './VersionHistoryTable'
import { UploadVersionModal } from './UploadVersionModal'
import { ArrowLeft } from 'lucide-react'

type Props = {
    spec: SpecDetail
    initialVersions: SpecVersion[]
}

export function SpecDetailView({ spec, initialVersions }: Props) {
    const router = useRouter()
    const [versionModalOpen, setVersionModalOpen] = useState(false)

    const { data: versions } = useQuery({
        queryKey: queryKeys.specs.versions(spec.id),
        queryFn: () => specsApi.getVersions(spec.id),
        initialData: initialVersions,
    })

    return (
        <div>
            <button
                onClick={() => router.push('/specs')}
                className="btn-secondary"
                style={{ height: '28px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
                <ArrowLeft size={12} />
                Specs
            </button>

            <div className="page-header">
                <div>
                    <h1 className="page-title">{spec.name}</h1>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        <span style={{ fontFamily: 'var(--font-family-mono)' }}>{spec.format}</span>
                        <span>·</span>
                        <span>{versions.length} version{versions.length !== 1 ? 's' : ''}</span>
                        <span>·</span>
                        <span>{spec._count.mockServers} mock{spec._count.mockServers !== 1 ? 's' : ''}</span>
                        <span>·</span>
                        <span>Added {new Date(spec.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <button onClick={() => setVersionModalOpen(true)} className="btn-primary">
                    New Version
                </button>
            </div>

            <VersionHistoryTable specId={spec.id} versions={versions} />

            <UploadVersionModal
                open={versionModalOpen}
                onClose={() => setVersionModalOpen(false)}
                specId={spec.id}
            />
        </div>
    )
}
```

### `components/specs/VersionHistoryTable.tsx`

```tsx
'use client'
import { useRouter } from 'next/navigation'
import type { SpecVersion } from '@/lib/api-client'

type Props = { specId: string; versions: SpecVersion[] }

export function VersionHistoryTable({ specId, versions }: Props) {
    const router = useRouter()

    if (versions.length === 0) {
        return (
            <div style={{ padding: '24px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                No versions yet.
            </div>
        )
    }

    const sorted = [...versions].sort((a, b) => b.version - a.version)

    return (
        <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            overflowX: 'auto',
        }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                        <th style={thStyle}>Version</th>
                        <th style={thStyle}>Uploaded</th>
                        <th style={thStyle}>Format</th>
                        <th style={thStyle}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((v, i) => {
                        const prev = sorted[i + 1]
                        return (
                            <tr key={v.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={tdStyle}>
                                    <span style={{ fontFamily: 'var(--font-family-mono)', fontWeight: 500, color: 'var(--color-text-strong)' }}>
                                        v{v.version}
                                    </span>
                                    {i === 0 && (
                                        <span style={{ marginLeft: '8px', fontSize: '10px', padding: '1px 5px', background: 'var(--color-primary-muted)', color: 'var(--color-primary)', borderRadius: '4px' }}>
                                            latest
                                        </span>
                                    )}
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ color: 'var(--color-text-muted)' }}>
                                        {new Date(v.createdAt).toLocaleDateString()}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                        {v.format}
                                    </span>
                                </td>
                                <td style={{ ...tdStyle, display: 'flex', gap: '8px' }}>
                                    {prev && (
                                        <button
                                            className="btn-secondary"
                                            style={{ height: '28px', fontSize: '12px' }}
                                            onClick={() => router.push(`/diff?specId=${specId}&v1=${prev.version}&v2=${v.version}`)}
                                        >
                                            View diff
                                        </button>
                                    )}
                                    <button
                                        className="btn-secondary"
                                        style={{ height: '28px', fontSize: '12px' }}
                                        onClick={() => router.push(`/mocks?specId=${specId}&specVersionId=${v.id}`)}
                                    >
                                        Deploy mock
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

const thStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 500, color: 'var(--color-text-subtle)', padding: '10px 16px' }
const tdStyle: React.CSSProperties = { fontSize: '13px', color: 'var(--color-text)', padding: '14px 16px' }
```

### `components/specs/UploadVersionModal.tsx`

Same pattern as `UploadSpecModal` but posts to `/specs/:id/versions`.

```tsx
'use client'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { specsApi } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

type Props = { open: boolean; onClose: () => void; specId: string }

export function UploadVersionModal({ open, onClose, specId }: Props) {
    const [content, setContent] = useState('')
    const [format, setFormat] = useState<'yaml' | 'json'>('yaml')
    const [error, setError] = useState<string | null>(null)
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: () => specsApi.uploadVersion(specId, { content, format }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.specs.versions(specId) })
            setContent('')
            setFormat('yaml')
            setError(null)
            onClose()
        },
        onError: (err: Error) => setError(err.message),
    })

    if (!open) return null

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <h2 className="modal-title">Upload New Version</h2>
                <p className="modal-subtitle">Paste updated OpenAPI spec content below.</p>

                {error && (
                    <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-destructive)', borderRadius: '6px', color: 'var(--color-destructive)', fontSize: '13px' }}>
                        {error}
                    </div>
                )}

                <div className="form-field">
                    <label className="form-label">Format</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {(['yaml', 'json'] as const).map(f => (
                            <label key={f} style={{
                                display: 'inline-block', padding: '6px 16px',
                                background: format === f ? 'var(--color-surface-2)' : 'var(--color-bg)',
                                border: `1px solid ${format === f ? 'var(--color-text-subtle)' : 'var(--color-border)'}`,
                                borderRadius: '6px', fontSize: '13px', fontWeight: 500,
                                cursor: 'pointer', color: format === f ? 'var(--color-text-strong)' : 'var(--color-text)',
                            }}>
                                <input type="radio" name="format" value={f} checked={format === f} onChange={() => setFormat(f)} style={{ display: 'none' }} />
                                {f.toUpperCase()}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="form-field">
                    <label className="form-label">Spec Content</label>
                    <textarea
                        className="form-textarea"
                        rows={10}
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder="Paste your OpenAPI spec here..."
                        style={{ resize: 'vertical', minHeight: '160px' }}
                    />
                </div>

                <div className="modal-actions">
                    <button onClick={onClose} disabled={mutation.isPending} className="btn-secondary">Cancel</button>
                    <button
                        onClick={() => mutation.mutate()}
                        disabled={mutation.isPending || !content.trim()}
                        className="btn-primary"
                    >
                        {mutation.isPending ? 'Uploading...' : 'Upload Version'}
                    </button>
                </div>
            </div>
        </div>
    )
}
```

---

## 7. Phase 4 — Mocks Pages

### Status polling strategy

```typescript
// Use this refetchInterval pattern on ANY query that displays mock status.
// Pass it as a function — returns false when all mocks are in terminal state.
refetchInterval: (query) => {
    const data = query.state.data
    if (!data) return false
    const mocks = Array.isArray(data) ? data : [data]
    const hasTransient = mocks.some(m => m.status === 'BUILDING' || m.status === 'STARTING')
    return hasTransient ? 2000 : false
},
```

### `app/(dashboard)/mocks/page.tsx`

```tsx
import { mocksApi, specsApi } from '@/lib/api-client'
import { headers } from 'next/headers'
import { MocksView } from '@/components/mocks/MocksView'

export default async function MocksPage({
    searchParams,
}: {
    searchParams: { specId?: string; specVersionId?: string }
}) {
    const reqHeaders = await headers()
    const cookie = reqHeaders.get('cookie')
    const apiHeaders: Record<string, string> = {}
    if (cookie) apiHeaders.cookie = cookie

    const [mocks, specs] = await Promise.all([
        mocksApi.list({ headers: apiHeaders }),
        specsApi.list({ headers: apiHeaders }),
    ])

    return (
        <MocksView
            initialMocks={mocks}
            specs={specs}
            // Pre-fill provision modal when navigated from spec detail "Deploy mock"
            prefilledSpecId={searchParams.specId}
            prefilledSpecVersionId={searchParams.specVersionId}
        />
    )
}
```

### `components/mocks/MocksView.tsx`

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { mocksApi, type MockServer, type Spec } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { MocksTable } from './MocksTable'
import { MocksEmptyState } from './MocksEmptyState'
import { ProvisionMockModal } from './ProvisionMockModal'
import { PageHeader } from '@/components/shared/PageHeader'

type Props = {
    initialMocks: MockServer[]
    specs: Spec[]
    prefilledSpecId?: string
    prefilledSpecVersionId?: string
}

export function MocksView({ initialMocks, specs, prefilledSpecId, prefilledSpecVersionId }: Props) {
    const [provisionOpen, setProvisionOpen] = useState(false)

    // Auto-open provision modal if navigated from spec detail
    useEffect(() => {
        if (prefilledSpecId && prefilledSpecVersionId) setProvisionOpen(true)
    }, [prefilledSpecId, prefilledSpecVersionId])

    const { data: mocks } = useQuery({
        queryKey: queryKeys.mocks.all(),
        queryFn: mocksApi.list,
        initialData: initialMocks,
        refetchInterval: (query) => {
            const data = query.state.data ?? []
            const hasTransient = data.some(m => m.status === 'BUILDING')
            return hasTransient ? 2000 : false
        },
    })

    return (
        <div>
            <PageHeader
                title="Mock Servers"
                action={{ label: 'New Mock', onClick: () => setProvisionOpen(true) }}
            />

            {mocks.length === 0 ? (
                <MocksEmptyState onProvision={() => setProvisionOpen(true)} />
            ) : (
                <MocksTable mocks={mocks} />
            )}

            <ProvisionMockModal
                open={provisionOpen}
                onClose={() => setProvisionOpen(false)}
                specs={specs}
                prefilledSpecId={prefilledSpecId}
                prefilledSpecVersionId={prefilledSpecVersionId}
            />
        </div>
    )
}
```

### `components/mocks/ProvisionMockModal.tsx`

```tsx
'use client'
import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { specsApi, mocksApi, type Spec } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

type Props = {
    open: boolean
    onClose: () => void
    specs: Spec[]
    prefilledSpecId?: string
    prefilledSpecVersionId?: string
}

export function ProvisionMockModal({ open, onClose, specs, prefilledSpecId, prefilledSpecVersionId }: Props) {
    const [specId, setSpecId] = useState(prefilledSpecId ?? '')
    const [specVersionId, setSpecVersionId] = useState(prefilledSpecVersionId ?? '')
    const [error, setError] = useState<string | null>(null)
    const queryClient = useQueryClient()

    useEffect(() => {
        if (prefilledSpecId) setSpecId(prefilledSpecId)
        if (prefilledSpecVersionId) setSpecVersionId(prefilledSpecVersionId)
    }, [prefilledSpecId, prefilledSpecVersionId])

    // Reset version when spec changes
    useEffect(() => {
        if (!prefilledSpecVersionId) setSpecVersionId('')
    }, [specId])

    const { data: versions } = useQuery({
        queryKey: queryKeys.specs.versions(specId),
        queryFn: () => specsApi.getVersions(specId),
        enabled: !!specId,
    })

    const mutation = useMutation({
        mutationFn: () => mocksApi.provision({ specId, specVersionId, stateful: false }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.mocks.all() })
            setSpecId('')
            setSpecVersionId('')
            setError(null)
            onClose()
        },
        onError: (err: Error) => setError(err.message),
    })

    if (!open) return null

    const canSubmit = !!specId && !!specVersionId && !mutation.isPending

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <h2 className="modal-title">Deploy Mock Server</h2>
                <p className="modal-subtitle">Provision a live mock API from an OpenAPI spec version.</p>

                {error && (
                    <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-destructive)', borderRadius: '6px', color: 'var(--color-destructive)', fontSize: '13px' }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-field">
                        <label className="form-label">Specification</label>
                        <select value={specId} onChange={e => setSpecId(e.target.value)} className="form-select">
                            <option value="">Select a spec...</option>
                            {specs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="form-field">
                        <label className="form-label">Version</label>
                        <select
                            value={specVersionId}
                            onChange={e => setSpecVersionId(e.target.value)}
                            disabled={!specId || !versions}
                            className="form-select"
                        >
                            <option value="">{!specId ? 'Select a spec first' : 'Select a version...'}</option>
                            {versions?.map(v => <option key={v.id} value={v.id}>v{v.version}</option>)}
                        </select>
                    </div>
                </div>

                <div className="modal-actions">
                    <button onClick={onClose} disabled={mutation.isPending} className="btn-secondary">Cancel</button>
                    <button onClick={() => mutation.mutate()} disabled={!canSubmit} className="btn-primary">
                        {mutation.isPending ? 'Deploying...' : 'Deploy Mock'}
                    </button>
                </div>
            </div>
        </div>
    )
}
```

### `components/mocks/MocksTable.tsx`

```tsx
'use client'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mocksApi, type MockServer } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { CopyButton } from '@/components/shared/CopyButton'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Play, Square, Trash2 } from 'lucide-react'
import { useState } from 'react'

export function MocksTable({ mocks }: { mocks: MockServer[] }) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [deleteTarget, setDeleteTarget] = useState<MockServer | null>(null)

    const startMutation = useMutation({
        mutationFn: (id: string) => mocksApi.start(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.mocks.all() })
            const prev = queryClient.getQueryData(queryKeys.mocks.all())
            queryClient.setQueryData(queryKeys.mocks.all(), (old: MockServer[]) =>
                old.map(m => m.id === id ? { ...m, status: 'BUILDING' as const } : m)
            )
            return { prev }
        },
        onError: (_err, _id, context) => {
            if (context?.prev) queryClient.setQueryData(queryKeys.mocks.all(), context.prev)
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.mocks.all() }),
    })

    const stopMutation = useMutation({
        mutationFn: (id: string) => mocksApi.stop(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.mocks.all() })
            const prev = queryClient.getQueryData(queryKeys.mocks.all())
            queryClient.setQueryData(queryKeys.mocks.all(), (old: MockServer[]) =>
                old.map(m => m.id === id ? { ...m, status: 'STOPPED' as const } : m)
            )
            return { prev }
        },
        onError: (_err, _id, context) => {
            if (context?.prev) queryClient.setQueryData(queryKeys.mocks.all(), context.prev)
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.mocks.all() }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => mocksApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.mocks.all() })
            setDeleteTarget(null)
        },
    })

    return (
        <>
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                            <th style={thStyle}>Mock</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}>URL</th>
                            <th style={thStyle}>Age</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mocks.map(mock => (
                            <tr
                                key={mock.id}
                                onClick={() => router.push(`/mocks/${mock.id}`)}
                                style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 120ms ease' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                            >
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: 500, color: 'var(--color-text-strong)' }}>
                                        {mock.spec.name}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                        v{mock.specVersion.version}
                                    </div>
                                </td>
                                <td style={tdStyle}>
                                    <StatusBadge status={mock.status} />
                                </td>
                                <td style={tdStyle}>
                                    {mock.publicUrl ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '12px', fontFamily: 'var(--font-family-mono)', color: 'var(--color-text-muted)' }}>
                                                {mock.publicUrl}
                                            </span>
                                            <CopyButton value={mock.publicUrl} />
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: '12px', color: 'var(--color-text-subtle)' }}>
                                            {mock.status === 'BUILDING' ? 'Provisioning...' : '—'}
                                        </span>
                                    )}
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                        {timeAgo(mock.createdAt)}
                                    </span>
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'right' }}>
                                    <div
                                        style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        {mock.status === 'STOPPED' && (
                                            <button className="btn-icon" onClick={() => startMutation.mutate(mock.id)} title="Start">
                                                <Play size={13} />
                                            </button>
                                        )}
                                        {mock.status === 'RUNNING' && (
                                            <button className="btn-icon" onClick={() => stopMutation.mutate(mock.id)} title="Stop">
                                                <Square size={13} />
                                            </button>
                                        )}
                                        <button className="btn-icon destructive" onClick={() => setDeleteTarget(mock)} title="Delete">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Delete mock server"
                description={`This will stop and permanently delete the mock server for "${deleteTarget?.spec.name} v${deleteTarget?.specVersion.version}".`}
                confirmWord="DELETE"
                variant="destructive"
                onConfirm={() => deleteMutation.mutateAsync(deleteTarget!.id)}
            />
        </>
    )
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}

const thStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 500, color: 'var(--color-text-subtle)', padding: '10px 16px' }
const tdStyle: React.CSSProperties = { fontSize: '13px', color: 'var(--color-text)', padding: '14px 16px' }
```

### `components/mocks/MocksEmptyState.tsx`

```tsx
import { Server } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'

export function MocksEmptyState({ onProvision }: { onProvision: () => void }) {
    return (
        <EmptyState
            icon={<Server size={24} />}
            title="No mock servers yet"
            description="Deploy a live mock API server from any of your OpenAPI specifications."
            action={{ label: 'New Mock', onClick: onProvision }}
        />
    )
}
```

### `app/(dashboard)/mocks/[id]/page.tsx`

```tsx
import { mocksApi } from '@/lib/api-client'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { MockDetailView } from '@/components/mocks/MockDetailView'

export default async function MockDetailPage({ params }: { params: { id: string } }) {
    const reqHeaders = await headers()
    const cookie = reqHeaders.get('cookie')
    const apiHeaders: Record<string, string> = {}
    if (cookie) apiHeaders.cookie = cookie

    try {
        const mock = await mocksApi.get(params.id, { headers: apiHeaders })
        return <MockDetailView initialMock={mock} />
    } catch {
        notFound()
    }
}
```

### `components/mocks/MockDetailView.tsx`

```tsx
'use client'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mocksApi, type MockServer } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { CopyButton } from '@/components/shared/CopyButton'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ArrowLeft, Play, Square, Trash2 } from 'lucide-react'
import { useState } from 'react'

export function MockDetailView({ initialMock }: { initialMock: MockServer }) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [deleteOpen, setDeleteOpen] = useState(false)

    const { data: mock } = useQuery({
        queryKey: queryKeys.mocks.detail(initialMock.id),
        queryFn: () => mocksApi.get(initialMock.id),
        initialData: initialMock,
        refetchInterval: (query) => {
            const status = query.state.data?.status
            if (status === 'RUNNING' || status === 'FAILED' || status === 'STOPPED') return false
            return 2000
        },
    })

    const startMutation = useMutation({
        mutationFn: () => mocksApi.start(mock.id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.mocks.detail(mock.id) }),
    })

    const stopMutation = useMutation({
        mutationFn: () => mocksApi.stop(mock.id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.mocks.detail(mock.id) }),
    })

    const deleteMutation = useMutation({
        mutationFn: () => mocksApi.delete(mock.id),
        onSuccess: () => router.push('/mocks'),
    })

    return (
        <div style={{ maxWidth: '720px' }}>
            <button
                onClick={() => router.push('/mocks')}
                className="btn-secondary"
                style={{ height: '28px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
                <ArrowLeft size={12} /> Mock Servers
            </button>

            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h1 className="page-title" style={{ marginBottom: 0 }}>
                        {mock.spec.name}
                    </h1>
                    <StatusBadge status={mock.status} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {mock.status === 'STOPPED' && (
                        <button className="btn-secondary" onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
                            <Play size={13} style={{ marginRight: '6px' }} />
                            Start
                        </button>
                    )}
                    {mock.status === 'RUNNING' && (
                        <button className="btn-secondary" onClick={() => stopMutation.mutate()} disabled={stopMutation.isPending}>
                            <Square size={13} style={{ marginRight: '6px' }} />
                            Stop
                        </button>
                    )}
                    <button className="btn-destructive" onClick={() => setDeleteOpen(true)}>
                        <Trash2 size={13} style={{ marginRight: '6px' }} />
                        Delete
                    </button>
                </div>
            </div>

            {/* Connection info */}
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-subtle)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Public URL</div>
                    {mock.publicUrl ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '14px', color: 'var(--color-text-strong)' }}>
                                {mock.publicUrl}
                            </span>
                            <CopyButton value={mock.publicUrl} />
                        </div>
                    ) : (
                        <span style={{ color: 'var(--color-text-subtle)', fontSize: '13px' }}>
                            {mock.status === 'BUILDING' ? 'Provisioning URL...' : 'No URL assigned'}
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '32px' }}>
                    <div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-subtle)', marginBottom: '4px' }}>Spec</div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>{mock.spec.name}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-subtle)', marginBottom: '4px' }}>Version</div>
                        <div style={{ fontSize: '13px', fontFamily: 'var(--font-family-mono)', color: 'var(--color-text)' }}>v{mock.specVersion.version}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-subtle)', marginBottom: '4px' }}>Created</div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>{new Date(mock.createdAt).toLocaleDateString()}</div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                title="Delete mock server"
                description={`Permanently delete the mock server for "${mock.spec.name} v${mock.specVersion.version}". This cannot be undone.`}
                confirmWord="DELETE"
                variant="destructive"
                onConfirm={() => deleteMutation.mutateAsync()}
            />
        </div>
    )
}
```

---

## 8. Phase 5 — Contracts Page

### `app/(dashboard)/contracts/page.tsx`

```tsx
import { contractsApi, specsApi, mocksApi } from '@/lib/api-client'
import { headers } from 'next/headers'
import { ContractsView } from '@/components/contracts/ContractsView'

export default async function ContractsPage() {
    const reqHeaders = await headers()
    const cookie = reqHeaders.get('cookie')
    const apiHeaders: Record<string, string> = {}
    if (cookie) apiHeaders.cookie = cookie

    const [runs, specs, mocks] = await Promise.all([
        contractsApi.list(undefined, { headers: apiHeaders }),
        specsApi.list({ headers: apiHeaders }),
        mocksApi.list({ headers: apiHeaders }),
    ])

    return <ContractsView initialRuns={runs} specs={specs} mocks={mocks} />
}
```

### `components/contracts/ContractsView.tsx`

```tsx
'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { contractsApi, type ContractTestRun, type Spec, type MockServer } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { RunContractModal } from './RunContractModal'
import { ContractResultsTable } from './ContractResultsTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ClipboardCheck } from 'lucide-react'

type Props = {
    initialRuns: ContractTestRun[]
    specs: Spec[]
    mocks: MockServer[]
}

export function ContractsView({ initialRuns, specs, mocks }: Props) {
    const [runOpen, setRunOpen] = useState(false)

    const { data: runs } = useQuery({
        queryKey: queryKeys.contracts.all(),
        queryFn: () => contractsApi.list(),
        initialData: initialRuns,
    })

    return (
        <div>
            <PageHeader
                title="Contracts"
                description="Run contract tests to validate mock servers against OpenAPI specs."
                action={{ label: 'Run Tests', onClick: () => setRunOpen(true) }}
            />

            {runs.length === 0 ? (
                <EmptyState
                    icon={<ClipboardCheck size={24} />}
                    title="No contract tests run yet"
                    description="Select a spec and a running mock server to validate the API contract."
                    action={{ label: 'Run Tests', onClick: () => setRunOpen(true) }}
                />
            ) : (
                <ContractResultsTable runs={runs} />
            )}

            <RunContractModal
                open={runOpen}
                onClose={() => setRunOpen(false)}
                specs={specs}
                mocks={mocks}
            />
        </div>
    )
}
```

### `components/contracts/RunContractModal.tsx`

```tsx
'use client'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contractsApi, type Spec, type MockServer } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

type Props = {
    open: boolean
    onClose: () => void
    specs: Spec[]
    mocks: MockServer[]
}

export function RunContractModal({ open, onClose, specs, mocks }: Props) {
    const [specId, setSpecId] = useState('')
    const [mockId, setMockId] = useState('')
    const [error, setError] = useState<string | null>(null)
    const queryClient = useQueryClient()

    // Only running mocks for the selected spec
    const eligibleMocks = mocks.filter(
        m => m.specId === specId && m.status === 'RUNNING'
    )
    const selectedMock = eligibleMocks.find(m => m.id === mockId)

    const mutation = useMutation({
        mutationFn: () => contractsApi.run({
            specId,
            baseUrl: selectedMock!.publicUrl!,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all() })
            setSpecId('')
            setMockId('')
            setError(null)
            onClose()
        },
        onError: (err: Error) => setError(err.message),
    })

    if (!open) return null

    const canSubmit = !!specId && !!mockId && !!selectedMock?.publicUrl && !mutation.isPending

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <h2 className="modal-title">Run Contract Tests</h2>
                <p className="modal-subtitle">Validate a running mock server against its OpenAPI specification.</p>

                {error && (
                    <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-destructive)', borderRadius: '6px', color: 'var(--color-destructive)', fontSize: '13px' }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-field">
                        <label className="form-label">Specification</label>
                        <select
                            value={specId}
                            onChange={e => { setSpecId(e.target.value); setMockId('') }}
                            className="form-select"
                        >
                            <option value="">Select a spec...</option>
                            {specs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="form-field">
                        <label className="form-label">Mock Server</label>
                        <select
                            value={mockId}
                            onChange={e => setMockId(e.target.value)}
                            disabled={!specId || eligibleMocks.length === 0}
                            className="form-select"
                        >
                            <option value="">
                                {!specId
                                    ? 'Select a spec first'
                                    : eligibleMocks.length === 0
                                        ? 'No running mocks for this spec'
                                        : 'Select a running mock...'}
                            </option>
                            {eligibleMocks.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.spec.name} v{m.specVersion.version} — {m.publicUrl}
                                </option>
                            ))}
                        </select>
                        {specId && eligibleMocks.length === 0 && (
                            <p className="form-hint">Start a mock server for this spec first.</p>
                        )}
                    </div>
                </div>

                <div className="modal-actions">
                    <button onClick={onClose} disabled={mutation.isPending} className="btn-secondary">Cancel</button>
                    <button onClick={() => mutation.mutate()} disabled={!canSubmit} className="btn-primary">
                        {mutation.isPending ? 'Running...' : 'Run Tests'}
                    </button>
                </div>
            </div>
        </div>
    )
}
```

### `components/contracts/ContractResultsTable.tsx`

```tsx
'use client'
import { useState } from 'react'
import type { ContractTestRun } from '@/lib/api-client'
import { EndpointResultRow } from './EndpointResultRow'
import { ChevronDown, ChevronRight } from 'lucide-react'

export function ContractResultsTable({ runs }: { runs: ContractTestRun[] }) {
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const sorted = [...runs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
            {sorted.map(run => {
                const isOpen = expandedId === run.id
                const allPassed = run.failed === 0

                return (
                    <div key={run.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        {/* Summary row */}
                        <div
                            onClick={() => setExpandedId(isOpen ? null : run.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                padding: '14px 16px',
                                cursor: 'pointer',
                                transition: 'background 120ms ease',
                                background: isOpen ? 'var(--color-surface-2)' : 'transparent',
                            }}
                            onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)' }}
                            onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                        >
                            {isOpen ? <ChevronDown size={14} color="var(--color-text-muted)" /> : <ChevronRight size={14} color="var(--color-text-muted)" />}

                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-strong)' }}>
                                    {run.baseUrl}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                    {new Date(run.createdAt).toLocaleString()}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                                <span style={{ color: 'var(--color-status-running)' }}>✓ {run.passed}</span>
                                <span style={{ color: run.failed > 0 ? 'var(--color-status-failed)' : 'var(--color-text-muted)' }}>
                                    ✗ {run.failed}
                                </span>
                                <span style={{ color: 'var(--color-text-subtle)' }}>{run.totalEndpoints} total</span>
                                <span style={{ color: 'var(--color-text-subtle)' }}>{run.duration}ms</span>
                                <span style={{
                                    fontSize: '11px',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    background: allPassed ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                                    color: allPassed ? 'var(--color-status-running)' : 'var(--color-status-failed)',
                                }}>
                                    {allPassed ? 'PASSED' : 'FAILED'}
                                </span>
                            </div>
                        </div>

                        {/* Expandable results */}
                        {isOpen && (
                            <div style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                                {run.results.map((result, i) => (
                                    <EndpointResultRow key={i} result={result} />
                                ))}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
```

### `components/contracts/EndpointResultRow.tsx`

```tsx
import type { ContractResult } from '@/lib/api-client'

export function EndpointResultRow({ result }: { result: ContractResult }) {
    return (
        <div style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="contract-result-row">
                <span className={`method-badge method-${result.method.toLowerCase()}`}>
                    {result.method}
                </span>
                <span className="result-path mono">{result.path}</span>
                <span style={{ fontSize: '12px', color: result.match ? 'var(--color-status-running)' : 'var(--color-status-failed)', flexShrink: 0 }}>
                    {result.match ? '✓' : '✗'}
                </span>
            </div>
            {!result.match && (
                <div style={{ padding: '0 16px 10px 16px' }}>
                    <div className="result-detail mono">
                        Expected {result.expectedStatus}, got {result.receivedStatus}
                        {result.detail ? ` — ${result.detail}` : ''}
                    </div>
                </div>
            )}
        </div>
    )
}
```

---

## 9. Phase 6 — Schema Diff Page

### `app/(dashboard)/diff/page.tsx`

```tsx
import { specsApi } from '@/lib/api-client'
import { headers } from 'next/headers'
import { DiffView } from '@/components/diff/DiffView'

export default async function DiffPage({
    searchParams,
}: {
    searchParams: { specId?: string; v1?: string; v2?: string }
}) {
    const reqHeaders = await headers()
    const cookie = reqHeaders.get('cookie')
    const apiHeaders: Record<string, string> = {}
    if (cookie) apiHeaders.cookie = cookie

    const specs = await specsApi.list({ headers: apiHeaders })

    return (
        <DiffView
            specs={specs}
            prefilledSpecId={searchParams.specId}
            prefilledV1={searchParams.v1 ? parseInt(searchParams.v1) : undefined}
            prefilledV2={searchParams.v2 ? parseInt(searchParams.v2) : undefined}
        />
    )
}
```

### `components/diff/DiffView.tsx`

```tsx
'use client'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { specsApi, type Spec } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { DiffViewer } from './DiffViewer'

type Props = {
    specs: Spec[]
    prefilledSpecId?: string
    prefilledV1?: number
    prefilledV2?: number
}

export function DiffView({ specs, prefilledSpecId, prefilledV1, prefilledV2 }: Props) {
    const [specId, setSpecId] = useState(prefilledSpecId ?? '')
    const [v1, setV1] = useState<number | null>(prefilledV1 ?? null)
    const [v2, setV2] = useState<number | null>(prefilledV2 ?? null)
    const [hasDiffed, setHasDiffed] = useState(false)

    const { data: versions } = useQuery({
        queryKey: queryKeys.specs.versions(specId),
        queryFn: () => specsApi.getVersions(specId),
        enabled: !!specId,
    })

    const { data: diff, isFetching, refetch } = useQuery({
        queryKey: queryKeys.specs.diff(specId, v1 ?? 0, v2 ?? 0),
        queryFn: () => specsApi.diff(specId, v1!, v2!),
        enabled: false,
    })

    // Auto-run diff when navigated from spec detail with pre-filled values
    useEffect(() => {
        if (prefilledSpecId && prefilledV1 && prefilledV2) {
            refetch()
            setHasDiffed(true)
        }
    }, [])

    const canCompare = !!specId && v1 !== null && v2 !== null && v1 !== v2

    const handleCompare = () => {
        refetch()
        setHasDiffed(true)
    }

    return (
        <div>
            <h1 className="page-title">Schema Diff</h1>
            <p className="page-description" style={{ marginBottom: '24px' }}>
                Compare two versions of the same spec to identify breaking changes.
            </p>

            <div className="diff-controls">
                <select
                    value={specId}
                    onChange={e => { setSpecId(e.target.value); setV1(null); setV2(null); setHasDiffed(false) }}
                    className="form-select"
                    style={{ maxWidth: '240px' }}
                >
                    <option value="">Select a spec...</option>
                    {specs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>

                {versions && versions.length >= 2 && (
                    <>
                        <select
                            value={v1 ?? ''}
                            onChange={e => setV1(Number(e.target.value))}
                            className="form-select"
                            style={{ maxWidth: '160px' }}
                        >
                            <option value="">Base version</option>
                            {versions.map(v => (
                                <option key={v.id} value={v.version} disabled={v.version === v2}>
                                    v{v.version}
                                </option>
                            ))}
                        </select>

                        <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>→</span>

                        <select
                            value={v2 ?? ''}
                            onChange={e => setV2(Number(e.target.value))}
                            className="form-select"
                            style={{ maxWidth: '160px' }}
                        >
                            <option value="">Compare version</option>
                            {versions.map(v => (
                                <option key={v.id} value={v.version} disabled={v.version === v1}>
                                    v{v.version}
                                </option>
                            ))}
                        </select>
                    </>
                )}

                {versions && versions.length < 2 && specId && (
                    <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        This spec needs at least 2 versions to diff.
                    </span>
                )}

                <button
                    onClick={handleCompare}
                    disabled={!canCompare || isFetching}
                    className="btn-primary"
                >
                    {isFetching ? 'Comparing...' : 'Compare'}
                </button>
            </div>

            {hasDiffed && diff && <DiffViewer diff={diff} />}
        </div>
    )
}
```

### `components/diff/DiffViewer.tsx`

```tsx
import type { SchemaDiff, DiffEntry } from '@/lib/api-client'

export function DiffViewer({ diff }: { diff: SchemaDiff }) {
    const hasBreaking    = diff.breaking.length > 0
    const hasNonBreaking = diff.nonBreaking.length > 0

    if (!hasBreaking && !hasNonBreaking) {
        return (
            <div style={{ padding: '24px', color: 'var(--color-text-muted)', fontSize: '14px', textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                No differences between these versions.
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {hasBreaking && (
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <h3 className="section-title" style={{ marginBottom: 0, color: 'var(--color-status-failed)' }}>
                            Breaking changes
                        </h3>
                        <span style={{ fontSize: '11px', padding: '2px 6px', background: 'rgba(239,68,68,0.1)', color: 'var(--color-status-failed)', borderRadius: '4px' }}>
                            {diff.breaking.length}
                        </span>
                    </div>
                    {diff.breaking.map((entry, i) => <DiffEntryRow key={i} entry={entry} />)}
                </section>
            )}

            {hasNonBreaking && (
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <h3 className="section-title" style={{ marginBottom: 0 }}>Non-breaking changes</h3>
                        <span style={{ fontSize: '11px', padding: '2px 6px', background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', borderRadius: '4px' }}>
                            {diff.nonBreaking.length}
                        </span>
                    </div>
                    {diff.nonBreaking.map((entry, i) => <DiffEntryRow key={i} entry={entry} />)}
                </section>
            )}
        </div>
    )
}

function DiffEntryRow({ entry }: { entry: DiffEntry }) {
    const config = {
        added:   { prefix: '+', color: 'var(--color-status-running)'  },
        removed: { prefix: '-', color: 'var(--color-status-failed)'   },
        changed: { prefix: '~', color: 'var(--color-status-building)' },
    }[entry.type]

    return (
        <div style={{
            display: 'flex',
            gap: '12px',
            padding: '10px 14px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            marginBottom: '4px',
        }}>
            <span style={{ color: config.color, fontWeight: 700, fontFamily: 'var(--font-family-mono)', flexShrink: 0 }}>
                {config.prefix}
            </span>
            <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '13px', color: 'var(--color-text-strong)', flex: 1 }}>
                {entry.path}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {entry.description}
            </span>
        </div>
    )
}
```

---

## 10. Phase 7 — API Explorer Page

### `app/(dashboard)/explorer/page.tsx`

```tsx
import { mocksApi } from '@/lib/api-client'
import { headers } from 'next/headers'
import { ExplorerView } from '@/components/explorer/ExplorerView'

export default async function ExplorerPage() {
    const reqHeaders = await headers()
    const cookie = reqHeaders.get('cookie')
    const apiHeaders: Record<string, string> = {}
    if (cookie) apiHeaders.cookie = cookie

    const mocks = await mocksApi.list({ headers: apiHeaders })

    return <ExplorerView initialMocks={mocks} />
}
```

### `components/explorer/ExplorerView.tsx`

```tsx
'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { mocksApi, specsApi, type MockServer } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { EndpointList } from './EndpointList'
import { RequestPanel } from './RequestPanel'
import { ResponsePanel } from './ResponsePanel'
import type { Endpoint } from '@/types'

export type ExplorerResponse = {
    status?: number
    statusText?: string
    headers?: Record<string, string>
    body?: unknown
    error?: string
    duration: number
}

export function ExplorerView({ initialMocks }: { initialMocks: MockServer[] }) {
    const [selectedMockId, setSelectedMockId] = useState<string | null>(null)
    const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null)
    const [response, setResponse] = useState<ExplorerResponse | null>(null)

    const { data: mocks } = useQuery({
        queryKey: queryKeys.mocks.all(),
        queryFn: mocksApi.list,
        initialData: initialMocks,
    })

    const runningMocks = mocks.filter(m => m.status === 'RUNNING')
    const selectedMock = runningMocks.find(m => m.id === selectedMockId)

    // SpecDetail has an `endpoints` field already parsed by the API.
    // No frontend parsing needed.
    const { data: specDetail } = useQuery({
        queryKey: queryKeys.specs.detail(selectedMock?.specId ?? ''),
        queryFn: () => specsApi.get(selectedMock!.specId),
        enabled: !!selectedMock,
    })

    const endpoints = specDetail?.endpoints ?? []

    return (
        <div>
            <h1 className="page-title">API Explorer</h1>
            <p className="page-description" style={{ marginBottom: '20px' }}>
                Fire real requests against your live mock servers.
            </p>

            <div style={{ marginBottom: '20px' }}>
                <select
                    value={selectedMockId ?? ''}
                    onChange={e => { setSelectedMockId(e.target.value); setSelectedEndpoint(null); setResponse(null) }}
                    className="form-select"
                    style={{ maxWidth: '320px' }}
                >
                    <option value="">Select a running mock...</option>
                    {runningMocks.map(m => (
                        <option key={m.id} value={m.id}>
                            {m.spec.name} v{m.specVersion.version}
                        </option>
                    ))}
                </select>
                {runningMocks.length === 0 && (
                    <p className="form-hint">No running mock servers. Start one from the Mocks page.</p>
                )}
            </div>

            {selectedMock && (
                <div className="explorer-layout">
                    <EndpointList
                        endpoints={endpoints}
                        selected={selectedEndpoint}
                        onSelect={(ep) => { setSelectedEndpoint(ep); setResponse(null) }}
                    />
                    <div className="explorer-right">
                        {selectedEndpoint ? (
                            <>
                                <RequestPanel
                                    endpoint={selectedEndpoint}
                                    baseUrl={selectedMock.publicUrl ?? ''}
                                    onResponse={setResponse}
                                />
                                {response && <ResponsePanel response={response} />}
                            </>
                        ) : (
                            <div className="explorer-placeholder">
                                Select an endpoint from the list
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
```

### `components/explorer/EndpointList.tsx`

```tsx
import type { Endpoint } from '@/types'

type Props = {
    endpoints: Endpoint[]
    selected: Endpoint | null
    onSelect: (ep: Endpoint) => void
}

export function EndpointList({ endpoints, selected, onSelect }: Props) {
    if (endpoints.length === 0) {
        return (
            <div className="explorer-endpoint-list" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>No endpoints found</span>
            </div>
        )
    }

    return (
        <div className="explorer-endpoint-list">
            {endpoints.map((ep, i) => {
                const isSelected = selected?.path === ep.path && selected?.method === ep.method
                return (
                    <div
                        key={i}
                        className={`endpoint-item ${isSelected ? 'active' : ''}`}
                        onClick={() => onSelect(ep)}
                    >
                        <span className={`method-badge method-${ep.method.toLowerCase()}`}>
                            {ep.method}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="endpoint-path">{ep.path}</div>
                            {ep.summary && <div className="endpoint-summary">{ep.summary}</div>}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
```

### `components/explorer/RequestPanel.tsx`

Path params are extracted from the path string. Query params and body are free-form.

```tsx
'use client'
import { useState, useEffect } from 'react'
import type { Endpoint } from '@/types'
import type { ExplorerResponse } from './ExplorerView'

type Props = {
    endpoint: Endpoint
    baseUrl: string
    onResponse: (r: ExplorerResponse) => void
}

// Extract {paramName} from path strings
function extractPathParams(path: string): string[] {
    return (path.match(/\{(\w+)\}/g) ?? []).map(m => m.slice(1, -1))
}

export function RequestPanel({ endpoint, baseUrl, onResponse }: Props) {
    const [pathParams, setPathParams] = useState<Record<string, string>>({})
    const [queryParams, setQueryParams] = useState('')   // "key=value\nkey2=value2"
    const [body, setBody] = useState('')
    const [isSending, setIsSending] = useState(false)

    const paramNames = extractPathParams(endpoint.path)
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(endpoint.method.toUpperCase())

    // Reset state when endpoint changes
    useEffect(() => {
        setPathParams({})
        setQueryParams('')
        setBody('')
    }, [endpoint.path, endpoint.method])

    const handleSend = async () => {
        setIsSending(true)
        const start = Date.now()

        try {
            let url = `${baseUrl}${endpoint.path}`

            // Substitute path params
            for (const [key, val] of Object.entries(pathParams)) {
                url = url.replace(`{${key}}`, encodeURIComponent(val))
            }

            // Append query params
            const pairs = queryParams
                .split('\n')
                .map(l => l.trim())
                .filter(l => l.includes('='))
                .map(l => l.split('=', 2) as [string, string])
            const qs = new URLSearchParams(pairs.filter(([k]) => k))
            if (qs.size) url += `?${qs.toString()}`

            const res = await fetch(url, {
                method: endpoint.method.toUpperCase(),
                headers: { 'Content-Type': 'application/json' },
                body: hasBody && body.trim() ? body : undefined,
            })

            let responseBody: unknown
            const contentType = res.headers.get('content-type') ?? ''
            if (contentType.includes('application/json')) {
                responseBody = await res.json()
            } else {
                responseBody = await res.text()
            }

            onResponse({
                status: res.status,
                statusText: res.statusText,
                headers: Object.fromEntries(res.headers.entries()),
                body: responseBody,
                duration: Date.now() - start,
            })
        } catch (err) {
            onResponse({ error: String(err), duration: Date.now() - start })
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Method + path header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={`method-badge method-${endpoint.method.toLowerCase()}`} style={{ fontSize: '12px', padding: '3px 8px' }}>
                    {endpoint.method}
                </span>
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '14px', color: 'var(--color-text-strong)' }}>
                    {endpoint.path}
                </span>
                {endpoint.summary && (
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>— {endpoint.summary}</span>
                )}
            </div>

            {/* Path params */}
            {paramNames.length > 0 && (
                <div>
                    <div className="form-label" style={{ marginBottom: '8px' }}>Path Parameters</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {paramNames.map(name => (
                            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '12px', color: 'var(--color-text-muted)', width: '120px', flexShrink: 0 }}>
                                    {name}
                                </span>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder={`Enter ${name}`}
                                    value={pathParams[name] ?? ''}
                                    onChange={e => setPathParams(p => ({ ...p, [name]: e.target.value }))}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Query params */}
            <div className="form-field">
                <label className="form-label">
                    Query Parameters
                    <span className="form-label-optional"> — one per line, key=value</span>
                </label>
                <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder={'page=1\nlimit=20'}
                    value={queryParams}
                    onChange={e => setQueryParams(e.target.value)}
                    style={{ fontFamily: 'var(--font-family-mono)', fontSize: '12px', resize: 'vertical' }}
                />
            </div>

            {/* Request body */}
            {hasBody && (
                <div className="form-field">
                    <label className="form-label">Request Body <span className="form-label-optional">(JSON)</span></label>
                    <textarea
                        className="form-textarea"
                        rows={6}
                        placeholder={'{\n  "key": "value"\n}'}
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        style={{ fontFamily: 'var(--font-family-mono)', fontSize: '12px', resize: 'vertical' }}
                    />
                </div>
            )}

            <button onClick={handleSend} disabled={isSending} className="btn-primary" style={{ alignSelf: 'flex-end' }}>
                {isSending ? 'Sending...' : 'Send Request'}
            </button>
        </div>
    )
}
```

### `components/explorer/ResponsePanel.tsx`

```tsx
import { useState } from 'react'
import type { ExplorerResponse } from './ExplorerView'

function statusColor(code: number) {
    if (code >= 500) return 'var(--color-status-failed)'
    if (code >= 400) return 'var(--color-warning)'
    if (code >= 300) return 'var(--color-text-muted)'
    return 'var(--color-status-running)'
}

export function ResponsePanel({ response }: { response: ExplorerResponse }) {
    const [headersOpen, setHeadersOpen] = useState(false)

    if (response.error) {
        return (
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-status-failed)', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--color-status-failed)', fontFamily: 'var(--font-family-mono)' }}>
                    {response.error}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '8px' }}>{response.duration}ms</div>
            </div>
        )
    }

    return (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
            {/* Status bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: statusColor(response.status!) }}>
                    {response.status}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{response.statusText}</span>
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--color-text-subtle)' }}>{response.duration}ms</span>
            </div>

            {/* Headers toggle */}
            {response.headers && (
                <div style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <button
                        onClick={() => setHeadersOpen(o => !o)}
                        style={{ width: '100%', textAlign: 'left', padding: '8px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--color-text-muted)' }}
                    >
                        {headersOpen ? '▾' : '▸'} Response Headers
                    </button>
                    {headersOpen && (
                        <pre style={{ margin: 0, padding: '8px 16px 12px', fontFamily: 'var(--font-family-mono)', fontSize: '11px', color: 'var(--color-text-muted)', overflowX: 'auto', background: 'var(--color-bg)' }}>
                            {Object.entries(response.headers).map(([k, v]) => `${k}: ${v}`).join('\n')}
                        </pre>
                    )}
                </div>
            )}

            {/* Body */}
            <pre style={{ margin: 0, padding: '16px', fontFamily: 'var(--font-family-mono)', fontSize: '12px', color: 'var(--color-text)', overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                {typeof response.body === 'string'
                    ? response.body
                    : JSON.stringify(response.body, null, 2)}
            </pre>
        </div>
    )
}
```

---

## 11. Phase 8 — Settings Page

### `app/(dashboard)/settings/page.tsx`

```tsx
import { getSession } from '@/lib/auth'
import { SettingsView } from '@/components/settings/SettingsView'

export default async function SettingsPage() {
    const session = await getSession()
    return <SettingsView user={session?.user} />
}
```

### `components/settings/SettingsView.tsx`

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

type User = { name?: string | null; email?: string | null; image?: string | null }

export function SettingsView({ user }: { user?: User }) {
    const [deleteOpen, setDeleteOpen] = useState(false)
    const router = useRouter()

    return (
        <div style={{ maxWidth: '600px' }}>
            <h1 className="page-title">Settings</h1>

            {/* Profile */}
            <section className="settings-section">
                <h2 className="section-title">Profile</h2>
                <div className="settings-profile">
                    {user?.image ? (
                        <img src={user.image} alt={user.name ?? ''} className="settings-avatar" />
                    ) : (
                        <div className="settings-avatar settings-avatar-fallback">
                            {(user?.name ?? user?.email ?? 'U')[0].toUpperCase()}
                        </div>
                    )}
                    <div>
                        <div className="settings-name">{user?.name ?? 'User'}</div>
                        <div className="settings-email">{user?.email}</div>
                        <div className="settings-oauth-note">Profile managed via GitHub OAuth</div>
                    </div>
                </div>
            </section>

            {/* Danger zone */}
            <section className="settings-section settings-danger">
                <h2 className="section-title" style={{ color: 'var(--color-destructive)' }}>
                    Danger Zone
                </h2>
                <p className="settings-danger-desc">
                    Permanently delete your account and all associated data — specs, mock servers, and contract runs.
                    This action cannot be undone.
                </p>
                <button className="btn-destructive" onClick={() => setDeleteOpen(true)}>
                    Delete Account
                </button>
            </section>

            <ConfirmDialog
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                title="Delete your account"
                description="This will permanently delete your account and all your data. Type DELETE to confirm."
                confirmWord="DELETE"
                variant="destructive"
                onConfirm={async () => {
                    await authClient.deleteUser()
                    router.push('/')
                }}
            />
        </div>
    )
}
```

---

## 12. Shared Components Catalogue

### `components/shared/StatusBadge.tsx`

```tsx
type MockServerStatus = 'RUNNING' | 'BUILDING' | 'STOPPED' | 'FAILED'

const STATUS_CONFIG: Record<MockServerStatus, { label: string; color: string; bg: string }> = {
    RUNNING:  { label: 'Running',  color: 'var(--color-status-running)',  bg: 'rgba(34, 197, 94, 0.08)'  },
    BUILDING: { label: 'Building', color: 'var(--color-status-building)', bg: 'rgba(192, 184, 122, 0.08)' },
    STOPPED:  { label: 'Stopped',  color: 'var(--color-status-stopped)',  bg: 'var(--color-surface-2)'   },
    FAILED:   { label: 'Failed',   color: 'var(--color-status-failed)',   bg: 'rgba(239, 68, 68, 0.08)'  },
}

export function StatusBadge({ status }: { status: MockServerStatus }) {
    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.STOPPED

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500,
            background: config.bg,
            color: config.color,
        }}>
            {status === 'BUILDING' ? (
                <svg
                    style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                >
                    <circle cx="5" cy="5" r="4" stroke={config.color} strokeWidth="1.5" strokeDasharray="12 6" />
                </svg>
            ) : (
                <span style={{
                    display: 'block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: config.color,
                    flexShrink: 0,
                }} />
            )}
            {config.label}
        </span>
    )
}
```

### `components/shared/EmptyState.tsx`

```tsx
type Props = {
    icon: React.ReactNode
    title: string
    description: string
    action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon, title, description, action }: Props) {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">{icon}</div>
            <h3 className="empty-state-title">{title}</h3>
            <p className="empty-state-desc">{description}</p>
            {action && (
                <button onClick={action.onClick} className="btn-secondary">
                    {action.label}
                </button>
            )}
        </div>
    )
}
```

### `components/shared/PageHeader.tsx`

```tsx
type Props = {
    title: string
    description?: string
    action?: { label: string; onClick: () => void }
}

export function PageHeader({ title, description, action }: Props) {
    return (
        <div className="page-header">
            <div>
                <h1 className="page-title">{title}</h1>
                {description && <p className="page-description">{description}</p>}
            </div>
            {action && (
                <button onClick={action.onClick} className="btn-primary">
                    {action.label}
                </button>
            )}
        </div>
    )
}
```

### `components/shared/ConfirmDialog.tsx`

```tsx
'use client'
import { useState } from 'react'

type Props = {
    open: boolean
    onClose: () => void
    title: string
    description: string
    confirmWord?: string
    onConfirm: () => Promise<void>
    variant?: 'default' | 'destructive'
}

export function ConfirmDialog({ open, onClose, title, description, confirmWord, onConfirm, variant = 'default' }: Props) {
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)

    if (!open) return null

    const canConfirm = !confirmWord || input === confirmWord
    const isDestructive = variant === 'destructive'

    const handleConfirm = async () => {
        setLoading(true)
        try {
            await onConfirm()
            setInput('')
            onClose()
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: '440px' }}>
                <h2 className="modal-title">{title}</h2>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '-8px' }}>
                    {description}
                </p>

                {confirmWord && (
                    <div className="form-field">
                        <input
                            type="text"
                            className="form-input"
                            placeholder={`Type ${confirmWord} to confirm`}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            style={{ fontFamily: 'var(--font-family-mono)' }}
                        />
                    </div>
                )}

                <div className="modal-actions">
                    <button onClick={() => { onClose(); setInput('') }} disabled={loading} className="btn-secondary">
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!canConfirm || loading}
                        className={isDestructive ? 'btn-destructive' : 'btn-primary'}
                    >
                        {loading ? 'Deleting...' : isDestructive ? 'Delete' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    )
}
```

### `components/shared/CopyButton.tsx`

```tsx
'use client'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyButton({ value }: { value: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation()
        await navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    return (
        <button onClick={handleCopy} className="copy-btn" title="Copy">
            {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
    )
}
```

---

## 13. State Management Patterns

### Standard query (read)

```typescript
const { data, isLoading } = useQuery({
    queryKey: queryKeys.resource.all(),
    queryFn: api.list,
    initialData: initialData,  // from server component — skips loading state
})
```

### Standard mutation (write)

```typescript
const mutation = useMutation({
    mutationFn: (input) => api.create(input),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.resource.all() })
        onClose()
    },
    onError: (err: Error) => setError(err.message),
})
```

### Optimistic update (start/stop mock)

```typescript
const mutation = useMutation({
    mutationFn: (id: string) => mocksApi.stop(id),
    onMutate: async (id) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.mocks.all() })
        const prev = queryClient.getQueryData(queryKeys.mocks.all())
        queryClient.setQueryData(queryKeys.mocks.all(), (old: MockServer[]) =>
            old.map(m => m.id === id ? { ...m, status: 'STOPPED' as const } : m)
        )
        return { prev }
    },
    onError: (_err, _id, context) => {
        if (context?.prev) queryClient.setQueryData(queryKeys.mocks.all(), context.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.mocks.all() }),
})
```

### Polling (building mocks)

```typescript
refetchInterval: (query) => {
    const data = query.state.data
    if (!data) return false
    const mocks = Array.isArray(data) ? data : [data]
    const hasTransient = mocks.some(m => m.status === 'BUILDING')
    return hasTransient ? 2000 : false
},
```

---

## 14. Implementation Checklist

Work through phases in order. Each phase should be complete and working before moving to the next.

```
PHASE 1 — SHELL
[ ] All globals.css additions applied
[ ] StatusBadge, EmptyState, PageHeader, ConfirmDialog, CopyButton created
[ ] Sidebar rewritten — MocklineWordmark, user avatar/name/email, logout
[ ] Topbar rewritten — accepts onMobileMenuOpen prop
[ ] DashboardShell client component created
[ ] MobileSidebarDrawer created
[ ] layout.tsx updated — server component, fetches session, passes to DashboardShell
[ ] Desktop: sidebar visible, hamburger hidden
[ ] Mobile: sidebar hidden, hamburger shown, drawer slides in/out
[ ] Logout: session cleared, redirect to /login

PHASE 2 — OVERVIEW
[ ] OverviewPage fetches specs + mocks server-side in parallel
[ ] OverviewView renders summary row (spec count, running, failed)
[ ] Recent mocks list shows last 5, links to /mocks/[id]
[ ] Uses mock.spec.name and mock.specVersion.version — not mock.name or mock.specName
[ ] Empty mock state renders correctly

PHASE 3 — SPECS
[ ] SpecsView double padding fixed
[ ] SpecsTable rows navigate to /specs/[id] on click
[ ] SpecsTable delete button opens ConfirmDialog, requires typing DELETE
[ ] /specs/[id] fetches spec + versions in parallel
[ ] SpecDetailView renders metadata + version history
[ ] Version history "View diff" passes query params to /diff
[ ] Version history "Deploy mock" passes query params to /mocks
[ ] UploadVersionModal posts to /specs/:id/versions

PHASE 4 — MOCKS
[ ] MocksPage fetches mocks + specs in parallel server-side
[ ] URL query params auto-open ProvisionMockModal pre-filled
[ ] ProvisionMockModal uses specVersionId (not versionId)
[ ] ProvisionMockModal: spec select → version select populates → Deploy
[ ] MocksTable renders mock.spec.name + mock.specVersion.version
[ ] MocksTable URL cell shows mock.publicUrl with CopyButton
[ ] MocksTable Play/Stop/Delete with correct visibility per status
[ ] Optimistic updates on start/stop
[ ] List polls every 2s when any mock is BUILDING, stops on terminal
[ ] /mocks/[id] detail page with status, URL, controls
[ ] MockDetailView polls until terminal status
[ ] Delete from detail redirects to /mocks

PHASE 5 — CONTRACTS
[ ] ContractsPage fetches runs + specs + mocks in parallel
[ ] RunContractModal: spec select → eligible mocks filter (specId + RUNNING)
[ ] RunContractModal uses mock.publicUrl as baseUrl
[ ] RunContractInput: { specId, baseUrl } — not mockId
[ ] ContractResultsTable: expandable rows per run
[ ] Expanded view shows ContractResult rows (method, path, match, detail)
[ ] Uses result.match (boolean) not result.status

PHASE 6 — SCHEMA DIFF
[ ] DiffPage reads specId/v1/v2 from searchParams
[ ] DiffView: spec select → version dropdowns → Compare
[ ] Pre-fill from spec detail "View diff" link works
[ ] DiffViewer renders diff.breaking and diff.nonBreaking arrays
[ ] DiffEntry rows show type prefix (+/-/~), path, description
[ ] Empty diff message when no differences

PHASE 7 — API EXPLORER
[ ] ExplorerPage fetches mocks server-side
[ ] Only RUNNING mocks shown in selector
[ ] Uses specDetail.endpoints (already parsed) — no frontend YAML parsing
[ ] EndpointList shows method badge + path + summary
[ ] RequestPanel extracts {param} names from path string
[ ] RequestPanel: path params, query params (key=value lines), body textarea
[ ] Send fires fetch against mock.publicUrl — not localhost
[ ] ResponsePanel: status colour, duration, headers toggle, body pre
[ ] Mobile: column layout

PHASE 8 — SETTINGS
[ ] SettingsPage reads session server-side
[ ] Profile: avatar (or fallback initial), name, email, OAuth note
[ ] Delete Account: ConfirmDialog with typed DELETE confirmation
[ ] On confirm: authClient.deleteUser() → redirect to /
```

---

*Last updated: March 2026 — Mockline dashboard v0.x, Next.js App Router, TanStack Query, BetterAuth. All types verified against actual API types.*