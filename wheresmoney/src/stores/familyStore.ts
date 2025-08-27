import { create } from 'zustand';
import { Family, FamilyMember } from '../types';

interface FamilyState {
  families: any[];
  currentFamily: any | null;
  currentFamilyMembers: FamilyMember[];
  loading: boolean;
  setFamilies: (families: any[]) => void;
  setCurrentFamily: (family: any, members: FamilyMember[]) => void;
  setLoading: (loading: boolean) => void;
  addFamily: (family: any) => void;
  removeFamily: (familyId: string) => void;
}

export const useFamilyStore = create<FamilyState>((set) => ({
  families: [],
  currentFamily: null,
  currentFamilyMembers: [],
  loading: false,
  
  setFamilies: (families) => set({ families }),
  
  setCurrentFamily: (family, members) => 
    set({ currentFamily: family, currentFamilyMembers: members }),
  
  setLoading: (loading) => set({ loading }),
  
  addFamily: (family) => 
    set((state) => ({ families: [...state.families, family] })),
  
  removeFamily: (familyId) => 
    set((state) => ({ 
      families: state.families.filter(f => f.id !== familyId),
      currentFamily: state.currentFamily?.id === familyId ? null : state.currentFamily,
      currentFamilyMembers: state.currentFamily?.id === familyId ? [] : state.currentFamilyMembers,
    })),
}));