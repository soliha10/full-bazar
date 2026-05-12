export type Language = 'uz' | 'ru' | 'en';

export { uz } from './uz';
export { ru } from './ru';
export { en } from './en';

import { uz } from './uz';
import { ru } from './ru';
import { en } from './en';

export const translations = { uz, ru, en };
