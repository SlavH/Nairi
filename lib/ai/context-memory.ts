/**
 * Context Memory System
 * Remembers user preferences and learns from interactions
 */

export interface UserPreferences {
  // Design preferences
  preferredStyle: string;
  preferredColors: string[];
  preferredFonts: string[];
  darkModePreference: 'light' | 'dark' | 'system';
  animationLevel: 'none' | 'subtle' | 'moderate' | 'rich';
  
  // Component preferences
  preferredFramework: 'react' | 'vue' | 'svelte' | 'html';
  preferredUILibrary: 'tailwind' | 'shadcn' | 'chakra' | 'mui' | 'custom';
  preferredIconSet: 'lucide' | 'heroicons' | 'feather' | 'fontawesome';
  
  // Code style preferences
  useTypeScript: boolean;
  preferFunctionalComponents: boolean;
  preferArrowFunctions: boolean;
  indentSize: 2 | 4;
  
  // Learned patterns
  commonPatterns: Pattern[];
  recentProjects: ProjectSummary[];
  feedbackHistory: Feedback[];
}

export interface Pattern {
  id: string;
  name: string;
  description: string;
  code: string;
  usageCount: number;
  lastUsed: Date;
  tags: string[];
}

export interface ProjectSummary {
  id: string;
  name: string;
  type: string;
  createdAt: Date;
  components: string[];
  style: string;
  colors: string[];
}

export interface Feedback {
  id: string;
  type: 'positive' | 'negative' | 'correction';
  context: string;
  originalOutput: string;
  correction?: string;
  timestamp: Date;
}

export interface ConversationContext {
  messages: Message[];
  currentProject: ProjectContext | null;
  activeFile: string | null;
  recentChanges: Change[];
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    components?: string[];
    codeGenerated?: boolean;
  };
}

export interface ProjectContext {
  name: string;
  files: Map<string, string>;
  dependencies: string[];
  designTokens: Record<string, any>;
}

export interface Change {
  file: string;
  type: 'create' | 'modify' | 'delete';
  timestamp: Date;
  description: string;
}

// Storage keys
const STORAGE_KEYS = {
  PREFERENCES: 'nairi_user_preferences',
  PATTERNS: 'nairi_patterns',
  PROJECTS: 'nairi_recent_projects',
  FEEDBACK: 'nairi_feedback',
  CONVERSATION: 'nairi_conversation'
};

/**
 * Initialize default preferences
 */
export function getDefaultPreferences(): UserPreferences {
  return {
    preferredStyle: 'modern',
    preferredColors: ['indigo', 'slate'],
    preferredFonts: ['Inter', 'system-ui'],
    darkModePreference: 'system',
    animationLevel: 'moderate',
    preferredFramework: 'react',
    preferredUILibrary: 'tailwind',
    preferredIconSet: 'lucide',
    useTypeScript: true,
    preferFunctionalComponents: true,
    preferArrowFunctions: true,
    indentSize: 2,
    commonPatterns: [],
    recentProjects: [],
    feedbackHistory: []
  };
}

/**
 * Load preferences from storage
 */
export function loadPreferences(): UserPreferences {
  if (typeof window === 'undefined') return getDefaultPreferences();
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    if (stored) {
      return { ...getDefaultPreferences(), ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load preferences:', e);
  }
  
  return getDefaultPreferences();
}

/**
 * Save preferences to storage
 */
export function savePreferences(preferences: Partial<UserPreferences>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const current = loadPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save preferences:', e);
  }
}

/**
 * Learn from user feedback
 */
export function learnFromFeedback(feedback: Omit<Feedback, 'id' | 'timestamp'>): void {
  const preferences = loadPreferences();
  
  const newFeedback: Feedback = {
    ...feedback,
    id: `feedback-${Date.now()}`,
    timestamp: new Date()
  };
  
  preferences.feedbackHistory.push(newFeedback);
  
  // Keep only last 100 feedback items
  if (preferences.feedbackHistory.length > 100) {
    preferences.feedbackHistory = preferences.feedbackHistory.slice(-100);
  }
  
  // Analyze feedback to update preferences
  if (feedback.type === 'correction' && feedback.correction) {
    analyzeCorrection(feedback.context, feedback.originalOutput, feedback.correction, preferences);
  }
  
  savePreferences(preferences);
}

/**
 * Analyze a correction to learn patterns
 */
function analyzeCorrection(
  context: string,
  original: string,
  correction: string,
  preferences: UserPreferences
): void {
  // Detect style preferences from corrections
  if (correction.includes('dark:') && !original.includes('dark:')) {
    preferences.darkModePreference = 'dark';
  }
  
  // Detect animation preferences
  if (correction.includes('animate-') && !original.includes('animate-')) {
    preferences.animationLevel = 'rich';
  } else if (original.includes('animate-') && !correction.includes('animate-')) {
    preferences.animationLevel = 'subtle';
  }
  
  // Detect color preferences
  const colorRegex = /(?:bg|text|border)-(\w+)-\d+/g;
  const correctionColors = [...correction.matchAll(colorRegex)].map(m => m[1]);
  if (correctionColors.length > 0) {
    const uniqueColors = [...new Set(correctionColors)];
    preferences.preferredColors = uniqueColors.slice(0, 5);
  }
}

/**
 * Save a reusable pattern
 */
export function savePattern(pattern: Omit<Pattern, 'id' | 'usageCount' | 'lastUsed'>): void {
  const preferences = loadPreferences();
  
  const newPattern: Pattern = {
    ...pattern,
    id: `pattern-${Date.now()}`,
    usageCount: 1,
    lastUsed: new Date()
  };
  
  preferences.commonPatterns.push(newPattern);
  
  // Keep only top 50 patterns by usage
  if (preferences.commonPatterns.length > 50) {
    preferences.commonPatterns.sort((a, b) => b.usageCount - a.usageCount);
    preferences.commonPatterns = preferences.commonPatterns.slice(0, 50);
  }
  
  savePreferences(preferences);
}

/**
 * Find relevant patterns for a prompt
 */
export function findRelevantPatterns(prompt: string, limit: number = 3): Pattern[] {
  const preferences = loadPreferences();
  const lowerPrompt = prompt.toLowerCase();
  
  // Score patterns by relevance
  const scored = preferences.commonPatterns.map(pattern => {
    let score = 0;
    
    // Check tag matches
    pattern.tags.forEach(tag => {
      if (lowerPrompt.includes(tag.toLowerCase())) {
        score += 2;
      }
    });
    
    // Check name/description matches
    if (lowerPrompt.includes(pattern.name.toLowerCase())) {
      score += 3;
    }
    
    // Boost by usage count
    score += Math.min(pattern.usageCount / 10, 1);
    
    return { pattern, score };
  });
  
  // Return top patterns
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.pattern);
}

/**
 * Record pattern usage
 */
export function recordPatternUsage(patternId: string): void {
  const preferences = loadPreferences();
  
  const pattern = preferences.commonPatterns.find(p => p.id === patternId);
  if (pattern) {
    pattern.usageCount++;
    pattern.lastUsed = new Date();
    savePreferences(preferences);
  }
}

/**
 * Save project summary
 */
export function saveProjectSummary(project: Omit<ProjectSummary, 'id' | 'createdAt'>): void {
  const preferences = loadPreferences();
  
  const newProject: ProjectSummary = {
    ...project,
    id: `project-${Date.now()}`,
    createdAt: new Date()
  };
  
  preferences.recentProjects.unshift(newProject);
  
  // Keep only last 20 projects
  if (preferences.recentProjects.length > 20) {
    preferences.recentProjects = preferences.recentProjects.slice(0, 20);
  }
  
  savePreferences(preferences);
}

/**
 * Generate context-aware prompt enhancement
 */
export function enhancePromptWithContext(prompt: string): string {
  const preferences = loadPreferences();
  const relevantPatterns = findRelevantPatterns(prompt);
  
  let enhanced = prompt;
  
  // Add style preferences
  enhanced += `\n\n## User Preferences\n`;
  enhanced += `- Style: ${preferences.preferredStyle}\n`;
  enhanced += `- Colors: ${preferences.preferredColors.join(', ')}\n`;
  enhanced += `- Animation level: ${preferences.animationLevel}\n`;
  enhanced += `- Dark mode: ${preferences.darkModePreference}\n`;
  
  // Add code preferences
  enhanced += `\n## Code Style\n`;
  enhanced += `- Framework: ${preferences.preferredFramework}\n`;
  enhanced += `- UI Library: ${preferences.preferredUILibrary}\n`;
  enhanced += `- TypeScript: ${preferences.useTypeScript ? 'Yes' : 'No'}\n`;
  enhanced += `- Icons: ${preferences.preferredIconSet}\n`;
  
  // Add relevant patterns
  if (relevantPatterns.length > 0) {
    enhanced += `\n## Relevant Patterns from User History\n`;
    relevantPatterns.forEach(pattern => {
      enhanced += `\n### ${pattern.name}\n`;
      enhanced += `${pattern.description}\n`;
      enhanced += `\`\`\`tsx\n${pattern.code}\n\`\`\`\n`;
    });
  }
  
  return enhanced;
}

/**
 * Conversation memory for multi-turn interactions
 */
class ConversationMemory {
  private context: ConversationContext;
  private maxMessages: number = 20;
  
  constructor() {
    this.context = {
      messages: [],
      currentProject: null,
      activeFile: null,
      recentChanges: []
    };
    this.load();
  }
  
  private load(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = sessionStorage.getItem(STORAGE_KEYS.CONVERSATION);
      if (stored) {
        this.context = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load conversation:', e);
    }
  }
  
  private save(): void {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.setItem(STORAGE_KEYS.CONVERSATION, JSON.stringify(this.context));
    } catch (e) {
      console.error('Failed to save conversation:', e);
    }
  }
  
  addMessage(role: 'user' | 'assistant', content: string, metadata?: Message['metadata']): void {
    this.context.messages.push({
      role,
      content,
      timestamp: new Date(),
      metadata
    });
    
    // Keep only recent messages
    if (this.context.messages.length > this.maxMessages) {
      this.context.messages = this.context.messages.slice(-this.maxMessages);
    }
    
    this.save();
  }
  
  getRecentMessages(count: number = 5): Message[] {
    return this.context.messages.slice(-count);
  }
  
  setActiveFile(file: string): void {
    this.context.activeFile = file;
    this.save();
  }
  
  recordChange(change: Omit<Change, 'timestamp'>): void {
    this.context.recentChanges.push({
      ...change,
      timestamp: new Date()
    });
    
    // Keep only last 10 changes
    if (this.context.recentChanges.length > 10) {
      this.context.recentChanges = this.context.recentChanges.slice(-10);
    }
    
    this.save();
  }
  
  getContext(): ConversationContext {
    return this.context;
  }
  
  clear(): void {
    this.context = {
      messages: [],
      currentProject: null,
      activeFile: null,
      recentChanges: []
    };
    this.save();
  }
  
  /**
   * Generate context summary for AI prompt
   */
  generateContextSummary(): string {
    const recentMessages = this.getRecentMessages(5);
    
    if (recentMessages.length === 0) {
      return '';
    }
    
    let summary = '## Conversation Context\n\n';
    
    // Add recent messages
    summary += '### Recent Messages\n';
    recentMessages.forEach(msg => {
      summary += `**${msg.role}**: ${msg.content.slice(0, 200)}${msg.content.length > 200 ? '...' : ''}\n\n`;
    });
    
    // Add active file
    if (this.context.activeFile) {
      summary += `\n### Currently Editing\n${this.context.activeFile}\n`;
    }
    
    // Add recent changes
    if (this.context.recentChanges.length > 0) {
      summary += `\n### Recent Changes\n`;
      this.context.recentChanges.slice(-3).forEach(change => {
        summary += `- ${change.type}: ${change.file} - ${change.description}\n`;
      });
    }
    
    return summary;
  }
}

// Singleton instance
let conversationMemory: ConversationMemory | null = null;

export function getConversationMemory(): ConversationMemory {
  if (!conversationMemory) {
    conversationMemory = new ConversationMemory();
  }
  return conversationMemory;
}

export default {
  loadPreferences,
  savePreferences,
  learnFromFeedback,
  savePattern,
  findRelevantPatterns,
  recordPatternUsage,
  saveProjectSummary,
  enhancePromptWithContext,
  getConversationMemory
};
