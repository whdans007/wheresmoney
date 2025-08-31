// TODO: 이 ID들을 데이터베이스의 실제 UUID로 교체해야 함
// 임시로 문자열을 사용하고 있음 - 실제 환경에서는 DB에서 동적으로 로드해야 함
export const DEFAULT_CATEGORIES = [
  { id: '1', name: '식비', color: '#FF6B6B', icon: 'food' },
  { id: '2', name: '교통비', color: '#4ECDC4', icon: 'car' },
  { id: '3', name: '쇼핑', color: '#45B7D1', icon: 'shopping-bag' },
  { id: '4', name: '의료비', color: '#96CEB4', icon: 'medical-bag' },
  { id: '5', name: '교육', color: '#FFEAA7', icon: 'school' },
  { id: '6', name: '오락', color: '#DDA0DD', icon: 'gamepad-variant' },
  { id: '7', name: '생활용품', color: '#98D8C8', icon: 'home' },
  { id: '8', name: '기타', color: '#CDCDCD', icon: 'dots-horizontal' },
];