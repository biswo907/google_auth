import { View, Text, Button, Dimensions } from 'react-native';
import React, { useEffect, useState } from 'react';
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { revokeAsync } from 'expo-auth-session';

// Completing the authentication session if redirected back to the app
WebBrowser.maybeCompleteAuthSession();


const { width, height } = Dimensions.get('window');

export default function App() {
  const [userInfo, setUserInfo] = useState(null);

  const [request, response, promptAsync] = Google.useAuthRequest({

    androidClientId: "1039008260365-9qf46t9so0qo9qdff6rptvd494q41878.apps.googleusercontent.com",
    webClientId: "1039008260365-4hvdtdl9lihdmhof15klgrrff3qnvsuh.apps.googleusercontent.com",

  });

  // Handle the response after a Google login attempt
  useEffect(() => {
    if (response?.type === 'success') {
      setUserInfo(response.authentication);
    }
  }, [response]);





  const
    getUserInfo = async (token) => {
      if (!token) return;
      try {
        const response = await fetch(
          "https://www.googleapis.com/userinfo/v2/me",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const user = await response.json();
        await AsyncStorage.setItem("user", JSON.stringify(user));
        console.log("Token_Auth", token);
        setUserInfo(user);
      } catch (error) {
        console.error(
          "Failed to fetch user data:",
          response.status,
          response.statusText
        );
      }
    };


  const signInWithGoogle = async () => {
    try {
      const userJSON = await AsyncStorage.getItem("user");

      if (userJSON) {
        setUserInfo(JSON.parse(userJSON));
      } else if (response?.type === "success") {
        console.log("GOOGLE TOKEN", response.authentication.accessToken);
        await AsyncStorage.setItem("googleToken", JSON.stringify(response.authentication.accessToken));
        getUserInfo(response.authentication.accessToken);
      }
    } catch (error) {
      console.error("Error retrieving user data from AsyncStorage:", error);
    }
  };

  useEffect(() => {
    signInWithGoogle();
  }, [response]);

  console.log(JSON.stringify(userInfo))


  const logout = async () => {
    try {
      // Optionally revoke the Google OAuth token
      // const accessToken = userInfo?.accessToken;
      const accessToken = await AsyncStorage.getItem("googleToken");

      if (accessToken) {
        await revokeAsync(
          { token: accessToken, clientId: "1039008260365-9qf46t9so0qo9qdff6rptvd494q41878.apps.googleusercontent.com" }, // Using Android client ID here as an example
          { revocationEndpoint: 'https://oauth2.googleapis.com/revoke' }
        );
      }

      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('accessToken');
      setUserInfo(null);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleOpenBrowser = async () => {
    const url = 'https://chat.openai.com/c/0ea4fa89-4ad0-448f-a017-7f96cba35c61'; // Replace with your desired URL
    await WebBrowser.openBrowserAsync(url);
  };


  return (
    <View style={{ height: height, width: width, backgroundColor: "#777" }}>
      <View style={{ margin: 50 }}>

        <Button title="Sign In with Google" onPress={() => {
          if (request) {
            promptAsync();
          }
        }} />
        <Text style={{ color: "red", fontSize: 21, textAlign: "center", marginTop: 12 }}>
          {userInfo ? JSON.stringify(userInfo) : "Here Show User Details"}
        </Text>

        <Button title="logout" onPress={logout} />
        <Button title="Open" onPress={handleOpenBrowser} />

      </View>
    </View>
  );
}

