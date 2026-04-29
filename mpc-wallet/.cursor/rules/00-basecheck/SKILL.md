---
name: 00-basecheck
description: |
  Code rules constraints in the project. **Enforce this Skill must be executed first**
---

# Basecheck
Code rules constraints in the project. **Enforce this Skill must be executed first**

# When to Use
Before writing code, it is strictly necessary to refer to this skill.
Before merging a commit, check again whether the commit complies with this rule.


# Thinking Overall
```
- [] What tech stack is this project?
- [] Is there already a standard code specification based on this tech stack?
- [] Does this project already have documents that AI can refer to?
- [] Are these changes limited in scope, or will they impact most of the project?
```

# Rules (MANDATORY)

```
* Avoid duplicate implementation of code and functionality
* Avoid magic values; all numbers and literals must have explicit semantic meaning (e.g., constants, enums, or configuration)
* Functions, interfaces, and key logic MUST include comments explaining WHY, not WHAT
* Prioritize following the existing project structure, and avoid introducing differences unless necessary
* Do not introduce new dependency modules unless necessary
* If any part of the code requires refactoring, this must be explicitly indicated, and clear safety boundaries must be provided.
* For low-coupling or standalone modules, MUST use higher-level abstractions and modern features, without being constrained by existing legacy patterns
* i18n: First check existing i18n keys and reuse them; if none fit, extend the i18n configuration following the project's existing naming conventions — never hardcode display strings inline.
* Key logic, error paths, and critical state changes MUST include structured logs with sufficient context for debugging 
```