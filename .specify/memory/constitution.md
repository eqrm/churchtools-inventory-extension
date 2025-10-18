<!--
Sync Impact Report:
Version Change: Initial → 1.0.0
Created: 2025-10-18

New Principles Established:
  I. Type Safety First - Leveraging TypeScript strict mode
  II. User Experience Consistency - ChurchTools integration standards
  III. Code Quality Standards - ESLint, formatting, and maintainability
  IV. Performance Budget - Bundle size and runtime performance requirements

Templates Updated:
  ✅ plan-template.md - Constitution Check section populated with specific gates from principles
  ✅ spec-template.md - Already contains user scenarios and success criteria sections (no changes needed)
  ✅ tasks-template.md - Added Constitution Compliance Gates to Phase 2 and Pre-Deployment Quality Gates to final phase

Follow-up Actions:
  - None. All templates now align with established principles.
-->

# ChurchTools Inventory Extension Constitution

## Core Principles

### I. Type Safety First (NON-NEGOTIABLE)

TypeScript strict mode MUST be enabled and adhered to at all times. All code MUST:
- Use explicit type annotations for function parameters and return types
- Avoid `any` type unless absolutely necessary with documented justification
- Leverage TypeScript utility types and type guards
- Pass TypeScript compilation without errors or suppressions

**Rationale**: Type safety prevents runtime errors, improves code maintainability, and provides
excellent developer experience through IDE autocomplete and refactoring support. The ChurchTools
API integration requires strict typing to ensure data integrity.

### II. User Experience Consistency

All user-facing features MUST maintain consistency with ChurchTools UI patterns and behavior:
- Follow ChurchTools design language (components, colors, spacing)
- Respect existing ChurchTools user workflows and navigation patterns
- Provide clear, actionable error messages in user's language
- Ensure responsive behavior across all supported screen sizes
- Test in both development mode (standalone) and production mode (embedded in ChurchTools)

**Rationale**: Extensions are embedded within ChurchTools; inconsistent UX creates confusion
and undermines trust. Users should feel the extension is a natural part of ChurchTools.

### III. Code Quality Standards

All code MUST meet the following quality standards:
- **Linting**: Pass all ESLint rules with no warnings or errors
- **Formatting**: Use consistent code formatting (automated via tooling)
- **Modularity**: Functions should do one thing well; aim for < 50 lines per function
- **Naming**: Use descriptive, semantic names (no abbreviations except domain standards)
- **Documentation**: Public APIs and non-obvious logic MUST have JSDoc comments
- **No Dead Code**: Remove commented-out code, unused imports, and unreachable statements

**Rationale**: High code quality reduces bugs, speeds up reviews, and makes the codebase
welcoming to contributors. Automated tooling enforces consistency without bikeshedding.

### IV. Performance Budget

The extension MUST respect strict performance budgets to ensure fast load times:
- **Bundle Size**: Production bundle MUST be < 200 KB (minified + gzipped)
- **Initial Load**: First contentful paint MUST occur within 1 second on 3G connections
- **Runtime Performance**: UI interactions MUST respond within 100ms
- **API Efficiency**: Minimize API calls; use batching and caching where appropriate
- **Memory Usage**: Avoid memory leaks; profile and optimize long-running operations

**Rationale**: ChurchTools is used by churches globally, including regions with limited
internet connectivity. Slow extensions degrade the entire ChurchTools experience.

## Testing Standards

All features MUST include appropriate testing based on complexity and risk:

### Manual Testing (Minimum Requirement)
- Every feature MUST be manually tested in both development and production modes
- Test in multiple browsers (Chrome, Safari, Firefox)
- Verify API integration with actual ChurchTools instance
- Document test scenarios in feature specification

### Automated Testing (Recommended)
- **Unit Tests**: For complex business logic, data transformations, and utilities
- **Integration Tests**: For API interactions and state management
- **E2E Tests**: For critical user workflows (if feature warrants the investment)

**When automated tests are REQUIRED**:
- Features handling sensitive data (permissions, user data)
- Complex calculations or data transformations
- Critical workflows that block primary use cases

**Rationale**: Testing prevents regressions and builds confidence. Manual testing is always
required; automated tests are an investment that pays off for complex or critical features.

## Development Workflow

### Code Review Requirements
- All changes MUST go through pull request review
- Reviewer MUST verify:
  - TypeScript compilation passes without errors
  - Code follows naming and modularity standards
  - No console.log statements or debug code in production
  - Bundle size impact is acceptable (check build output)
  - Manual testing has been performed

### Build and Deployment
- Production builds MUST use `npm run build` (TypeScript compilation + Vite bundling)
- Deployment packages MUST use `npm run deploy` (builds + packages via scripts/package.js)
- Version numbers MUST follow Semantic Versioning (MAJOR.MINOR.PATCH)
- Each deployment MUST update package.json version and include changelog notes

### Environment Configuration
- Sensitive data (credentials, API keys) MUST use `.env` files (never commit)
- Production code MUST handle missing environment variables gracefully
- Development-only code MUST be conditionally imported (see main.ts pattern)

## Governance

This constitution supersedes all other practices and guidelines. All features, pull requests,
and architectural decisions MUST comply with these principles.

### Amendment Process
1. Propose amendment with clear rationale and impact analysis
2. Update this constitution document with version bump:
   - MAJOR: Remove or fundamentally change an existing principle
   - MINOR: Add new principle or section
   - PATCH: Clarify wording or fix inconsistencies
3. Update all dependent templates in `.specify/templates/`
4. Document changes in Sync Impact Report (HTML comment at top of file)
5. Obtain approval from project maintainer(s)

### Compliance Verification
- Constitution compliance MUST be checked during plan creation (plan-template.md)
- Any violation MUST be justified in the Complexity Tracking table
- Repeated violations without justification indicate need for principle revision

### Version History
Initial ratification established core principles for code quality, UX consistency, type safety,
and performance budgets appropriate for a ChurchTools extension project.

**Version**: 1.0.0 | **Ratified**: 2025-10-18 | **Last Amended**: 2025-10-18
