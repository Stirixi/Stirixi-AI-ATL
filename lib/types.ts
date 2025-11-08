export interface Engineer {
  _id: string;
  name: string;
  title: string;
  skills: (string | null)[];
  email: string;
  github_user: string;
  date_hired: string;
  pr_count: number;
  estimation_accuracy?: number | null;
  bug_count: number;
  avg_review_time?: number | null;
  token_cost: number;
  prompt_history: string[];
  monthly_performance: number[];
  recent_actions: string[];
}

export interface Prompt {
  _id: string;
  model: string;
  date: string;
  tokens: number;
  text: string;
  engineer: string;
}

// Restored interfaces for project-related conversions
export interface Action {
  _id: string;
  title: string;
  description: string;
  project?: string | null;
  date: string;
  engineer: string;
  event: string;
}

export interface Prospect {
  _id: string;
  name: string;
  title: string;
  skills: (string | null)[];
  email: string;
  github_user: string;
  date_applied: string;
  pr_count: number;
  estimation_accuracy?: number | null;
  bug_count: number;
  avg_review_time?: number | null;
  token_cost: number;
  performance: number;
}

export interface Project {
  _id: string;
  engineers: string[];
  importance: string;
  prospects: string[];
  target_date?: string | null;
  start_date?: string | null;
  description: string;
  title: string;
}
