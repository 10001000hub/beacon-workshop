import type { Content } from '../content/index';
import type { Session } from '../core/session';
import type { Answer } from '../core/types';

/** What every screen receives. Screens read state and dispatch events; they never grade on their own. */
export interface Ctx {
  content: Content;
  session: Session;
  /** Unsubmitted answers, per activity. Memory only: lost when the tab closes (the workbench says so). */
  drafts: Map<string, Answer>;
  /** Show a one-off notice at the top of the next rendered screen. */
  flash(message: string): void;
  /** Re-render the current route (after state changes that the screen does not patch itself). */
  rerender(): void;
  /** Go to a hash; re-renders even when the hash is already current. */
  navigate(hash: string): void;
}
