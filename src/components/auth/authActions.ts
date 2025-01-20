import { createAsyncThunk } from '@reduxjs/toolkit';
import { getMe } from "../../services/user.service";
import { AuthUser } from "../../services/mappings/authMappings";

export const refreshUserData = createAsyncThunk<
  AuthUser, // The return type of the async action (User data)
  void, // The argument type, in this case, it's void since no arguments are passed
  { rejectValue: string } // The type for the error message in case of rejection
>(
  'auth/refreshUserData', // Action type
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return rejectWithValue('No token found');
    }

    try {
      const user = await getMe(); // Replace with your actual function to fetch user data

      if (!user) {
        throw new Error('Failed to fetch user data');
      }
      return user; // If successful, return the user data
    } catch (error) {
      return rejectWithValue('Error fetching user data');
    }
  }
);
