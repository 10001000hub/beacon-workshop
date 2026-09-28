import type { Answer } from '../../core/types';

/** A rendered activity board. Boards only collect IDs; grading happens in core/grading. */
export interface Board {
  el: HTMLElement;
  answer(): Answer;
  /** Human-readable description of what is still missing, or null if the answer can be judged. */
  missing(): string | null;
  focus(): void;
}

export type OnChange = (answer: Answer) => void;
