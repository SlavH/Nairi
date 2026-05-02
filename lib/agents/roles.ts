export const AVAILABLE_ROLES = {
  developer: {
    name: "Developer",
    description: "Write clean, performant, and idiomatic code.",
    tools: ["read", "write", "bash"]
  },
  architect: {
    name: "Architect",
    description: "Design high-level systems, data structures, and overall software architecture.",
    tools: ["read"]
  },
  researcher: {
    name: "Researcher",
    description: "Investigate APIs, documentation, and best practices. Thorough and analytical.",
    tools: ["read", "webfetch"]
  },
  designer: {
    name: "Designer",
    description: "Focus on beautiful UI/UX, aesthetic, and visual presentation.",
    tools: ["write"]
  },
  debugger: {
    name: "Debugger",
    description: "Systematically find and fix bugs. Precise and analytical.",
    tools: ["read", "bash"]
  }
}
