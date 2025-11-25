import React, { useContext } from "react";
import { getApps, initializeApp } from "firebase/app";
import { AuthContext } from "../provider/AuthProvider";

import { NavigationContainer } from "@react-navigation/native";

import Main from "./MainStack";
import Auth from "./AuthStack";
import Loading from "../screens/utils/Loading";

// Better put your these secret keys in .env file
const firebaseConfig = {
  apiKey: "AIzaSyDaXlRP4lPsW566s41jfeoo1UpsJSBOvCw",
  authDomain: "myminiproject-f6d7e.firebaseapp.com",
  projectId: "myminiproject-f6d7e",
  storageBucket: "myminiproject-f6d7e.firebasestorage.app",
  messagingSenderId: "586003701721",
  appId: "1:586003701721:web:6fd82962bc46f98fcb83c8",
};

if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}

export default () => {
  const auth = useContext(AuthContext);
  const user = auth.user;
  return (
    <NavigationContainer>
      {user == null && <Loading />}
      {user == false && <Auth />}
      {user == true && <Main />}
    </NavigationContainer>
  );
};
