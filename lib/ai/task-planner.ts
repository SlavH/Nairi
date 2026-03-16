/**
 * Task Planner - Breaks complex tasks into manageable steps
 * Uses chain-of-thought reasoning for better results
 */

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'create' | 'modify' | 'style' | 'animate' | 'integrate' | 'test';
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  dependencies: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  subtasks?: Task[];
  code?: string;
  validation?: TaskValidation;
}

export interface TaskValidation {
  checks: ValidationCheck[];
  passed: boolean;
}

export interface ValidationCheck {
  name: string;
  description: string;
  passed: boolean;
  message?: string;
}

export interface TaskPlan {
  id: string;
  originalPrompt: string;
  summary: string;
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedTotalTime: string;
  tasks: Task[];
  currentTaskIndex: number;
  status: 'planning' | 'executing' | 'completed' | 'failed';
}

/**
 * Analyze prompt complexity and determine if planning is needed
 */
export function analyzeComplexity(prompt: string): 'simple' | 'moderate' | 'complex' {
  const lowerPrompt = prompt.toLowerCase();
  
  // Complex indicators
  const complexIndicators = [
    'full', 'complete', 'entire', 'whole',
    'with authentication', 'with database', 'with api',
    'multi-page', 'dashboard', 'e-commerce', 'marketplace',
    'real-time', 'websocket', 'payment', 'stripe',
    'admin panel', 'user management', 'role-based'
  ];
  
  // Moderate indicators
  const moderateIndicators = [
    'landing page', 'form with validation', 'data table',
    'multiple sections', 'responsive', 'animated',
    'with state', 'interactive', 'filterable', 'sortable'
  ];
  
  const complexCount = complexIndicators.filter(i => lowerPrompt.includes(i)).length;
  const moderateCount = moderateIndicators.filter(i => lowerPrompt.includes(i)).length;
  
  if (complexCount >= 2 || (complexCount >= 1 && moderateCount >= 2)) {
    return 'complex';
  } else if (moderateCount >= 2 || complexCount >= 1) {
    return 'moderate';
  }
  return 'simple';
}

/**
 * Generate a task plan from a user prompt
 */
export function generateTaskPlan(prompt: string): TaskPlan {
  const complexity = analyzeComplexity(prompt);
  const tasks = breakdownIntoTasks(prompt, complexity);
  
  return {
    id: generateId(),
    originalPrompt: prompt,
    summary: generateSummary(prompt, tasks),
    complexity,
    estimatedTotalTime: calculateTotalTime(tasks),
    tasks,
    currentTaskIndex: 0,
    status: 'planning'
  };
}

/**
 * Break down a prompt into individual tasks
 */
function breakdownIntoTasks(prompt: string, complexity: 'simple' | 'moderate' | 'complex'): Task[] {
  const lowerPrompt = prompt.toLowerCase();
  const tasks: Task[] = [];
  let taskIndex = 0;
  
  // Always start with structure/layout
  tasks.push({
    id: `task-${taskIndex++}`,
    title: 'Create Base Structure',
    description: 'Set up the component structure, imports, and basic layout',
    type: 'create',
    priority: 'high',
    estimatedTime: '30s',
    dependencies: [],
    status: 'pending'
  });
  
  // Detect sections needed
  const sections = detectSections(lowerPrompt);
  sections.forEach(section => {
    tasks.push({
      id: `task-${taskIndex++}`,
      title: `Create ${section.charAt(0).toUpperCase() + section.slice(1)} Section`,
      description: `Build the ${section} section with proper layout and content`,
      type: 'create',
      priority: 'high',
      estimatedTime: '45s',
      dependencies: ['task-0'],
      status: 'pending'
    });
  });
  
  // Add styling task
  tasks.push({
    id: `task-${taskIndex++}`,
    title: 'Apply Styling',
    description: 'Add colors, typography, spacing, and visual polish',
    type: 'style',
    priority: 'medium',
    estimatedTime: '30s',
    dependencies: tasks.slice(0, -1).map(t => t.id),
    status: 'pending'
  });
  
  // Add responsive task if needed
  if (lowerPrompt.includes('responsive') || !lowerPrompt.includes('desktop only')) {
    tasks.push({
      id: `task-${taskIndex++}`,
      title: 'Make Responsive',
      description: 'Add responsive breakpoints for mobile, tablet, and desktop',
      type: 'style',
      priority: 'medium',
      estimatedTime: '30s',
      dependencies: [tasks[tasks.length - 1].id],
      status: 'pending'
    });
  }
  
  // Add animation task if needed
  if (lowerPrompt.includes('animat') || lowerPrompt.includes('motion') || lowerPrompt.includes('transition')) {
    tasks.push({
      id: `task-${taskIndex++}`,
      title: 'Add Animations',
      description: 'Add hover effects, transitions, and entrance animations',
      type: 'animate',
      priority: 'low',
      estimatedTime: '30s',
      dependencies: [tasks[tasks.length - 1].id],
      status: 'pending'
    });
  }
  
  // Add interactivity task if needed
  if (lowerPrompt.includes('interactive') || lowerPrompt.includes('click') || lowerPrompt.includes('state')) {
    tasks.push({
      id: `task-${taskIndex++}`,
      title: 'Add Interactivity',
      description: 'Implement state management and user interactions',
      type: 'create',
      priority: 'medium',
      estimatedTime: '45s',
      dependencies: [tasks[tasks.length - 1].id],
      status: 'pending'
    });
  }
  
  // Add integration tasks for complex projects
  if (complexity === 'complex') {
    if (lowerPrompt.includes('api') || lowerPrompt.includes('fetch') || lowerPrompt.includes('data')) {
      tasks.push({
        id: `task-${taskIndex++}`,
        title: 'Add API Integration',
        description: 'Set up data fetching and API calls',
        type: 'integrate',
        priority: 'medium',
        estimatedTime: '60s',
        dependencies: [tasks[tasks.length - 1].id],
        status: 'pending'
      });
    }
    
    if (lowerPrompt.includes('auth') || lowerPrompt.includes('login') || lowerPrompt.includes('user')) {
      tasks.push({
        id: `task-${taskIndex++}`,
        title: 'Add Authentication',
        description: 'Implement authentication flow and protected routes',
        type: 'integrate',
        priority: 'high',
        estimatedTime: '90s',
        dependencies: [tasks[tasks.length - 1].id],
        status: 'pending'
      });
    }
  }
  
  // Always end with validation
  tasks.push({
    id: `task-${taskIndex++}`,
    title: 'Validate & Polish',
    description: 'Check for errors, accessibility, and final polish',
    type: 'test',
    priority: 'high',
    estimatedTime: '15s',
    dependencies: [tasks[tasks.length - 1].id],
    status: 'pending'
  });
  
  return tasks;
}

/**
 * Detect which sections are needed based on prompt
 */
function detectSections(prompt: string): string[] {
  const sections: string[] = [];
  
  const sectionKeywords: Record<string, string[]> = {
    'navbar': ['navbar', 'navigation', 'header', 'menu'],
    'hero': ['hero', 'banner', 'header section', 'above fold', 'landing'],
    'features': ['features', 'benefits', 'capabilities', 'what we offer'],
    'pricing': ['pricing', 'plans', 'subscription', 'tiers'],
    'testimonials': ['testimonials', 'reviews', 'quotes', 'customers say'],
    'faq': ['faq', 'questions', 'help'],
    'cta': ['cta', 'call to action', 'get started', 'sign up'],
    'footer': ['footer', 'bottom']
  };
  
  // Check for explicit sections
  Object.entries(sectionKeywords).forEach(([section, keywords]) => {
    if (keywords.some(k => prompt.includes(k))) {
      sections.push(section);
    }
  });
  
  // If it's a landing page but no sections specified, add defaults
  if (prompt.includes('landing') && sections.length < 3) {
    const defaults = ['navbar', 'hero', 'features', 'cta', 'footer'];
    defaults.forEach(d => {
      if (!sections.includes(d)) sections.push(d);
    });
  }
  
  // If it's a dashboard, add dashboard sections
  if (prompt.includes('dashboard')) {
    return ['sidebar', 'header', 'stats', 'charts', 'table'];
  }
  
  return sections.length > 0 ? sections : ['main'];
}

/**
 * Generate a summary of the task plan
 */
function generateSummary(prompt: string, tasks: Task[]): string {
  const taskCount = tasks.length;
  const createTasks = tasks.filter(t => t.type === 'create').length;
  const styleTasks = tasks.filter(t => t.type === 'style').length;
  
  return `Breaking down into ${taskCount} tasks: ${createTasks} creation, ${styleTasks} styling, and validation.`;
}

/**
 * Calculate total estimated time
 */
function calculateTotalTime(tasks: Task[]): string {
  let totalSeconds = 0;
  
  tasks.forEach(task => {
    const time = task.estimatedTime;
    if (time.includes('s')) {
      totalSeconds += parseInt(time);
    } else if (time.includes('m')) {
      totalSeconds += parseInt(time) * 60;
    }
  });
  
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  } else {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate prompt for a specific task
 */
export function generateTaskPrompt(task: Task, context: { previousCode?: string; designSystem?: string }): string {
  let prompt = `## Task: ${task.title}\n\n${task.description}\n\n`;
  
  if (context.previousCode) {
    prompt += `## Current Code:\n\`\`\`tsx\n${context.previousCode}\n\`\`\`\n\n`;
  }
  
  if (context.designSystem) {
    prompt += `## Design System:\n${context.designSystem}\n\n`;
  }
  
  // Add task-specific instructions
  switch (task.type) {
    case 'create':
      prompt += `Create the component/section. Use semantic HTML and proper React patterns.\n`;
      break;
    case 'style':
      prompt += `Apply styling using Tailwind CSS. Ensure consistency with the design system.\n`;
      break;
    case 'animate':
      prompt += `Add animations using Tailwind classes or CSS. Keep animations smooth and purposeful.\n`;
      break;
    case 'integrate':
      prompt += `Integrate the required functionality. Handle loading and error states.\n`;
      break;
    case 'test':
      prompt += `Review the code for:\n- Syntax errors\n- Accessibility issues\n- Missing responsive styles\n- Console warnings\n`;
      break;
  }
  
  prompt += `\nReturn ONLY the complete updated code, no explanations.`;
  
  return prompt;
}

/**
 * Validate completed task
 */
export function validateTask(task: Task, code: string): TaskValidation {
  const checks: ValidationCheck[] = [];
  
  // Check for syntax errors (basic)
  checks.push({
    name: 'Syntax Check',
    description: 'Code has valid syntax',
    passed: !code.includes('undefined') && code.includes('export'),
    message: code.includes('undefined') ? 'Found undefined references' : undefined
  });
  
  // Check for imports
  checks.push({
    name: 'Imports Check',
    description: 'Required imports are present',
    passed: code.includes('import') && code.includes('from'),
    message: !code.includes('import') ? 'Missing imports' : undefined
  });
  
  // Check for responsive classes
  if (task.type === 'style') {
    checks.push({
      name: 'Responsive Check',
      description: 'Has responsive breakpoints',
      passed: code.includes('md:') || code.includes('lg:') || code.includes('sm:'),
      message: 'Consider adding responsive breakpoints'
    });
  }
  
  // Check for accessibility
  checks.push({
    name: 'Accessibility Check',
    description: 'Has basic accessibility attributes',
    passed: code.includes('aria-') || code.includes('role=') || code.includes('alt='),
    message: 'Consider adding ARIA labels for accessibility'
  });
  
  return {
    checks,
    passed: checks.filter(c => c.passed).length >= checks.length * 0.7 // 70% pass rate
  };
}

/**
 * Self-correction prompt for failed validation
 */
export function generateCorrectionPrompt(task: Task, code: string, validation: TaskValidation): string {
  const failedChecks = validation.checks.filter(c => !c.passed);
  
  let prompt = `## Fix Required\n\nThe following issues were found:\n\n`;
  
  failedChecks.forEach(check => {
    prompt += `- **${check.name}**: ${check.message || check.description}\n`;
  });
  
  prompt += `\n## Current Code:\n\`\`\`tsx\n${code}\n\`\`\`\n\n`;
  prompt += `Fix these issues and return the complete corrected code.`;
  
  return prompt;
}

export default {
  analyzeComplexity,
  generateTaskPlan,
  generateTaskPrompt,
  validateTask,
  generateCorrectionPrompt
};
