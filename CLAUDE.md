# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native + Expo family expense tracking app (가족 가계부) with Firebase backend. The app allows family members to share and manage household expenses with real-time synchronization.

## Essential Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Platform-specific development
npm run ios       # iOS simulator
npm run android   # Android emulator
npm run web       # Web browser

# Linting
npm run lint
```

## Architecture

### Tech Stack
- **Frontend**: React Native with Expo Router for navigation
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **State Management**: React Context API
- **Language**: TypeScript with strict mode enabled

### Key Architecture Patterns

1. **Authentication Flow**: 
   - Auth state managed via AuthContext wrapper in app/_layout.tsx
   - Firebase Auth with AsyncStorage persistence for mobile platforms
   - User documents stored in Firestore users collection

2. **Data Models** (types/index.ts):
   - User: Links Firebase auth to family groups
   - FamilyGroup: Contains members array and unique invite code
   - Expense: Tracks income/expense with optional receipt attachments
   - All expenses are scoped to familyGroupId for data isolation

3. **Navigation Structure**:
   - File-based routing via Expo Router
   - Protected routes: (tabs)/* screens require authentication
   - Public routes: auth/* screens for login/register
   - Stack-based navigation with tab navigation for main app

4. **Firebase Services**:
   - Services layer (services/*) abstracts Firebase operations
   - firebase.ts handles initialization with platform-specific auth persistence
   - Environment variables prefixed with EXPO_PUBLIC_ for client-side access

5. **Real-time Sync**:
   - Firestore listeners for live updates across family members
   - Image uploads to Firebase Storage with URL references in Firestore

## Development Guidelines

### Firebase Setup Required
1. Copy `.env.example` to `.env`
2. Add Firebase configuration values
3. Enable Authentication, Firestore, and Storage in Firebase Console

### Path Aliases
- `@/*` maps to root directory (configured in tsconfig.json)

### Component Structure
- Themed components in components/ use light/dark mode from useColorScheme hook
- UI components separated in components/ui/ for platform-specific implementations