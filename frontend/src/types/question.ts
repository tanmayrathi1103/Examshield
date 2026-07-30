export type QuestionType = 'mcq' | 'true_false' | 'descriptive' | 'numerical';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface QuestionOptionBase {
  option_label?: string;
  option_text: string;
  is_correct: boolean;
  display_order: number;
}

export interface QuestionOptionCreate extends QuestionOptionBase {}

export interface QuestionOptionResponse extends QuestionOptionBase {
  id: string;
  question_id: string;
  created_at: string;
  updated_at: string;
}

export interface QuestionBase {
  exam_id: string;
  question_text: string;
  question_type: QuestionType;
  marks: number;
  negative_marks: number;
  difficulty: Difficulty;
  image_url?: string;
  explanation?: string;
  order_number: number;
  is_required: boolean;
  is_active: boolean;
}

export interface QuestionCreate extends QuestionBase {
  options?: QuestionOptionCreate[];
  correct_answer?: boolean;
}

export interface QuestionResponse extends QuestionBase {
  id: string;
  created_at: string;
  updated_at: string;
  options: QuestionOptionResponse[];
}

export interface QuestionListResponse {
  items: QuestionResponse[];
  total: number;
}
