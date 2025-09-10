import i18n from '../i18n';

// TODO: 이 ID들을 데이터베이스의 실제 UUID로 교체해야 함
// 임시로 문자열을 사용하고 있음 - 실제 환경에서는 DB에서 동적으로 로드해야 함

export const getCategoryName = (categoryKey: string) => {
  return i18n.t(`categories.expense.${categoryKey}`);
};

export const getIncomeCategoryName = (categoryKey: string) => {
  return i18n.t(`categories.income.${categoryKey}`);
};

export const DEFAULT_CATEGORIES = [
  { id: '1', nameKey: 'food', color: '#FF6B6B', icon: 'food' },
  { id: '2', nameKey: 'transportation', color: '#4ECDC4', icon: 'car' },
  { id: '3', nameKey: 'shopping', color: '#45B7D1', icon: 'shopping-bag' },
  { id: '4', nameKey: 'medical', color: '#96CEB4', icon: 'medical-bag' },
  { id: '5', nameKey: 'education', color: '#FFEAA7', icon: 'school' },
  { id: '6', nameKey: 'entertainment', color: '#DDA0DD', icon: 'gamepad-variant' },
  { id: '7', nameKey: 'household', color: '#98D8C8', icon: 'home' },
  { id: '8', nameKey: 'other', color: '#CDCDCD', icon: 'dots-horizontal' },
];

export const INCOME_CATEGORIES = [
  { id: 'income-salary', nameKey: 'salary', color: '#4CAF50', icon: 'cash' },
  { id: 'income-allowance', nameKey: 'allowance', color: '#8BC34A', icon: 'gift' },
  { id: 'income-sidejob', nameKey: 'sideJob', color: '#2E7D32', icon: 'briefcase' },
  { id: 'income-investment', nameKey: 'investment', color: '#388E3C', icon: 'trending-up' },
  { id: 'income-other', nameKey: 'other', color: '#689F38', icon: 'plus-circle' },
];

// Helper functions to get categories with translated names
export const getDefaultCategories = () => {
  return DEFAULT_CATEGORIES.map(category => ({
    ...category,
    name: i18n.t(`categories.expense.${category.nameKey}`)
  }));
};

export const getIncomeCategories = () => {
  return INCOME_CATEGORIES.map(category => ({
    ...category,
    name: i18n.t(`categories.income.${category.nameKey}`)
  }));
};