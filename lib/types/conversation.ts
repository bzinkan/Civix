export type AIProvider = 'gemini' | 'anthropic' | 'openai';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  provider?: AIProvider;
  tokensUsed?: number;
  confidence?: number;
  timestamp?: Date;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  tokensUsed?: number;
}

export interface RuleMatch {
  category: string;
  subcategory?: string;
  confidence: number;
  requiredInputs: string[];
  canonicalQuestion: string;
  ruleKeys: string[];
}

export interface ConversationContext {
  conversationId: string;
  userId?: string;
  fingerprint?: string;

  jurisdiction?: string;
  category?: string;
  subcategory?: string;

  collectedInputs: Record<string, any>;
  requiredInputs: string[];

  messages: Message[];
  primaryProvider: AIProvider;
  fallbackUsed: boolean;
  status: 'active' | 'completed' | 'abandoned';
}

export interface ConversationResponse {
  type: 'question' | 'clarification' | 'result' | 'error' | 'paywall';
  message: string;
  options?: string[];
  context: ConversationContext;
  outcome?: 'ALLOWED' | 'PROHIBITED' | 'CONDITIONAL' | 'RESTRICTED';
  rationale?: string;
  citations?: any[];
  usage?: {
    remaining: number;
    limit: number;
  };
}
