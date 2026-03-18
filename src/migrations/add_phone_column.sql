-- Migration: Add phone column to profiles table
-- Description: Adds a phone field to store user telephone numbers

ALTER TABLE profiles 
ADD COLUMN phone TEXT DEFAULT '';
