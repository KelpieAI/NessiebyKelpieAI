/*
  # Fix Authentication Issue - Add Missing INSERT Policy for Profiles

  ## Problem
  The authentication service was failing with "Database error querying schema" because:
  - The profiles table has RLS enabled
  - When a new user signs up, the trigger `on_auth_user_created` fires
  - The trigger calls `handle_new_user()` which inserts into profiles
  - BUT there was no INSERT policy on profiles table
  - This caused the INSERT to fail, breaking user registration

  ## Solution
  Add an INSERT policy to the profiles table that allows:
  - New users to have their profile created during signup
  - Service role to insert profiles

  ## Changes
  1. Add INSERT policy for profiles table
     - Allows authenticated users to insert their own profile
     - Critical for the signup trigger to work

  ## Security
  - Policy ensures users can only create profiles with their own user ID
  - Prevents users from creating profiles for other users
*/

-- Add INSERT policy for profiles table
-- This allows the auth trigger to create profiles for new users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can insert own profile during signup'
  ) THEN
    CREATE POLICY "Users can insert own profile during signup"
      ON public.profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Also allow service role to insert (for admin operations and migrations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Service role can insert profiles'
  ) THEN
    CREATE POLICY "Service role can insert profiles"
      ON public.profiles
      FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;
END $$;
