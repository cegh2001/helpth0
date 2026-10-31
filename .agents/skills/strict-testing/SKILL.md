---
name: strict-testing
description: Adversarial TDD and strict testing protocol for helpth0. Eliminates tautological mocks, shallow assertions, and complacent tests. Use when writing, modifying, or reviewing tests in Vitest.
---

# Strict & Adversarial Testing Protocol

When writing or reviewing tests, act as an adversarial QA engineer whose goal is to verify invariants and prove domain behavior, NOT merely get green checkmarks.

## 1. Forbidden Practices (Immediate Rejection)
1. **NO TAUTOLOGICAL MOCKS**: Never mock the unit under test, domain entities, value objects, or pure internal calculations. Mock ONLY external ports/boundaries: repository interfaces (`tests/mocks/in-memory-*.ts`), external exporters (ExcelJS/PDFKit), or system clocks.
2. **NO SHALLOW ASSERTIONS**:
   - BANNED as sole checks: `expect(result).toBeDefined()`, `expect(result).toBeTruthy()`, `expect(fn).toHaveBeenCalled()`.
   - REQUIRED: Assert exact return payloads (`toStrictEqual`), specific state transitions in the in-memory repository, or explicit custom domain error types/messages.
3. **NO ARTIFICIAL QUOTA SPAM**: Do not write redundant tests for cases TypeScript already forbids at compile-time. Every test must represent a real domain rule, invariant boundary, or failure mode.

## 2. Invariant & Mutation Checklist (Red-Green-Mutate)
Before considering a test suite complete, apply the **Mental Mutation Check**:
1. If you remove or invert the core `if` validation or invariant check in the domain entity or use case, **does this test fail**? If no, the assertion is weak.
2. Are edge domain conditions tested?
   - Non-chronological shift intervals (e.g., end time <= start time).
   - Negative or fractional patient volumes.
   - Non-existent doctor IDs or missing references.
   - In-memory repository state isolation across test runs.

## 3. Helpth0 Testing Architecture Guidelines
- **Unit Tests (`tests/unit/`)**: Fast, pure in-memory execution. NEVER import `@prisma/client`, run SQLite queries, or use network IO. Inject in-memory mock repositories (`tests/mocks/`).
- **Integration Tests (`tests/integration/`)**: Verify persistence against test SQLite database or real file generation buffers (ExcelJS/PDFKit).
