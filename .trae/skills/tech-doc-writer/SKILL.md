---
name: "tech-doc-writer"
description: "Writes comprehensive technical documentation (README, ARCHITECTURE, guides). Invoke when user asks to create/update documentation files or write technical docs from source code."
---

# Technical Documentation Writer

This skill writes extremely detailed, comprehensive technical documentation that enables readers to understand and rebuild projects from scratch.

## Core Principles

1. **Completeness**: Every detail must be documented - no assumptions that readers will "figure it out"
2. **Working Examples**: Every feature/concept must have runnable code examples
3. **Self-Contained**: Documentation must be complete without requiring external references
4. **Structured Depth**: Follows clear hierarchy from overview → details → reference

## Documentation Types

### README.md - Usage Guide

**Purpose**: How to USE the project

**Structure**:
1. Project Overview (1-2 paragraphs)
2. Quick Start (minimal working example)
3. Installation/Setup
4. Core Concepts (brief)
5. Detailed Feature Guide (by category)
6. API Reference (for libraries)
7. Examples (comprehensive)
8. Troubleshooting/FAQ

**Key Content**:
- What the project does
- Why to use it
- How to install
- How to use (step-by-step)
- All features with examples
- Configuration options
- Common use cases

### ARCHITECTURE.md - Architecture Documentation

**Purpose**: How the project WORKS internally

**Structure**:
1. Architecture Overview
2. Design Principles
3. Core Components (with relationships)
4. Data Flow
5. Key Algorithms
6. Extension Points
7. Implementation Details
8. File Structure

**Key Content**:
- Why the architecture is designed this way
- All components and their responsibilities
- How data flows through the system
- Key algorithms and their complexity
- How to extend/customize
- Important implementation decisions

## Writing Standards

### Completeness Checklist

For EVERY feature/concept, document:
- [ ] What it is (definition)
- [ ] Why it exists (purpose)
- [ ] How it works (mechanism)
- [ ] When to use it (use cases)
- [ ] How to use it (syntax/examples)
- [ ] Configuration options (parameters)
- [ ] Edge cases/limitations
- [ ] Related features

### Code Examples

Every feature MUST have:
```typescript
// Example 1: Basic usage
const example1 = ...;

// Example 2: With configuration
const example2 = ...;

// Example 3: Real-world use case
const example3 = ...;

// Example 4: Edge cases
const example4 = ...;
```

### Interface Documentation

For every interface/type:
```typescript
interface Example {
  /** Field description */
  field: Type;

  /**
   * Method description
   * @param paramName - Parameter description
   * @returns What the method returns
   */
  method(param: Type): ReturnType;
}
```

### Architecture Components

For every component:
1. **Purpose**: What it does
2. **Location**: File path
3. **Public API**: Methods/properties
4. **Dependencies**: What it uses
5. **Used By**: Who uses it
6. **Lifecycle**: When created/destroyed
7. **State Management**: How it manages state

## Process

1. **Read ALL source files** completely
2. **Identify all components** and their relationships
3. **Document structure**:
   - README: User-facing features and usage
   - ARCHITECTURE: Internal design and implementation
4. **Write comprehensive content** with full examples
5. **Verify completeness** against checklist

## Quality Gates

- [ ] Can someone rebuild the project from this documentation alone?
- [ ] Are ALL features documented with examples?
- [ ] Are ALL interfaces/types documented?
- [ ] Are ALL configuration options explained?
- [ ] Is the architecture clearly explained?
- [ ] Are there working code examples for everything?
