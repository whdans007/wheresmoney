# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WheresMyMoney is a React Native Expo app for family expense tracking. It's a Korean family ledger app that allows families to create shared expense tracking rooms and log expenses with mandatory photos.

## Commands

### Development
- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/simulator  
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser

### Project Structure
- Navigate to the `/wheresmoney` subdirectory for all development work - this contains the actual Expo app
- Root directory contains SQL files for Supabase database setup

## Architecture

### Core Technologies
- **React Native + Expo** - Mobile framework
- **TypeScript** - Type safety with strict mode enabled
- **Supabase** - Backend-as-a-Service for auth, database, and storage
- **Zustand** - State management for auth and family data
- **React Navigation** - Navigation with bottom tabs and stack navigators
- **React Native Paper** - Material Design components with custom theme

### Database Design
Supabase PostgreSQL with Row Level Security (RLS):
- `users` - User profiles with nickname and avatar
- `families` - Family groups with owner
- `family_members` - Junction table for family membership with roles (owner/member)
- `ledger_entries` - Expense records with mandatory photo_url

### Navigation Structure
```
App (Auth Check) 
├── AuthNavigator (Stack)
│   ├── LoginScreen
│   ├── SignUpScreen  
│   └── ForgotPasswordScreen
└── MainNavigator (Bottom Tabs)
    ├── HomeNavigator (Stack)
    │   ├── HomeScreen (family list)
    │   ├── CreateFamilyScreen
    │   ├── FamilyDetailScreen
    │   ├── AddLedgerEntryScreen
    │   └── LedgerDetailScreen
    └── ProfileScreen
```

### State Management
- **authStore** - User authentication state with Zustand
- **familyStore** - Family data and operations with Zustand
- Real-time auth state changes via Supabase auth listeners

### Key Business Logic
- All expense entries require photo uploads (photo_url is mandatory)
- Family-based expense sharing with role-based access
- Default expense categories defined in constants/categories.ts
- Korean UI with Korean labels throughout the app

### Service Layer
- `services/auth.ts` - Authentication operations with Supabase
- `services/family.ts` - Family and ledger operations
- `services/supabase.ts` - Supabase client configuration and database types

### Environment Setup
- Requires `.env` file with `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Uses `react-native-dotenv` for environment variable access

## Development Notes

### Database Setup
- Multiple SQL files in root directory for Supabase configuration
- RLS policies are critical for data security
- Database schema includes proper foreign key relationships

### Photo Upload Flow
- All ledger entries must include photos
- Uses `expo-image-picker` for photo selection
- Photos are stored in Supabase storage

### Authentication Flow
- Email/password authentication via Supabase
- Automatic session persistence with AsyncStorage
- Auth state listeners handle automatic login/logout

### Korean Localization
- UI text and labels are in Korean
- Category names and navigation labels use Korean text