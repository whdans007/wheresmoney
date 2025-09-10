// 사용자 관련 타입
export interface User {
  id: string;
  email: string;
  nickname: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// 가족방 관련 타입
export interface Family {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  user?: User;
}

// 가계부 관련 타입
export interface LedgerCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface LedgerEntry {
  id: string;
  family_id: string;
  user_id: string;
  amount: number;
  category_id: string;
  description: string;
  photo_url: string; // 필수 사진
  date: string;
  created_at: string;
  updated_at: string;
  user?: User;
  category?: LedgerCategory;
}

// 네비게이션 타입
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Profile: undefined;
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
  EditProfile: undefined;
  Settings: undefined;
  DeleteAccount: undefined;
  Notification: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  CreateFamily: undefined;
  JoinFamily: undefined;
  FamilyDetail: { familyId: string };
  AddLedgerEntry: { familyId: string };
  AddIncomeEntry: { familyId: string };
  AddEntry: { familyId: string };
  LedgerDetail: { entryId: string };
  Invite: { familyId: string };
  Stats: { familyId: string };
  MemberStats: { familyId: string; memberId: string; memberName: string };
};