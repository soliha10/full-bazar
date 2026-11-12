import { useAuthFormState } from './useAuthFormState';
import { createFormActions } from './formActions';
import { createSubmitActions } from './submitActions';

/**
 * AuthModal'ning butun mantiqi: holat + amallar bitta obyektda. Bosqich
 * komponentlari shu obyektni `f` prop sifatida oladi.
 */
export function useAuthForm() {
  const state = useAuthFormState();
  const formActions = createFormActions(state);
  const submitActions = createSubmitActions(state, formActions);
  return { ...state, ...formActions, ...submitActions };
}

export type AuthForm = ReturnType<typeof useAuthForm>;
