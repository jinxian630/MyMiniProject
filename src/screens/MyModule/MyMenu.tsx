import React from "react";
import { View } from "react-native";
import { MainStackParamList } from "../../types/navigation";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Layout,
  TopNav,
  Text,
  useTheme,
  themeColor,
  Button,
} from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";

export default function ({
  navigation,
}: NativeStackScreenProps<MainStackParamList, "MyMenu">) {
  const { isDarkmode, setTheme } = useTheme();
  return (
    <Layout>
      <TopNav
        middleContent="My Menu"
        leftContent={
          <Ionicons
            name="chevron-back"
            size={20}
            color={isDarkmode ? themeColor.white100 : themeColor.dark}
          />
        }
        leftAction={() => navigation.goBack()}
        rightContent={
          <Ionicons
            name={isDarkmode ? "sunny" : "moon"}
            size={20}
            color={isDarkmode ? themeColor.white100 : themeColor.dark}
          />
        }
        rightAction={() => {
          if (isDarkmode) {
            setTheme("light");
          } else {
            setTheme("dark");
          }
        }}
      />

      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Button
          text="Go to Question Add"
          onPress={() => {
            navigation.navigate("QuestionAdd");
          }}
          style={{
            marginTop: 10,
          }}
        />
        <Button
          text="Go to Question List"
          onPress={() => {
            navigation.navigate("QuestionList");
          }}
          style={{
            marginTop: 10,
          }}
        />
        <Button
          text="Go to Blog Add"
          onPress={() => {
            navigation.navigate("BlogAdd");
          }}
          style={{
            marginTop: 10,
          }}
        />
        <Button
          text="Go to Blog List"
          onPress={() => {
            navigation.navigate("BlogList");
          }}
          style={{
            marginTop: 10,
          }}
        />
        <Button
          text="Go to Note Add"
          onPress={() => {
            navigation.navigate("NoteAdd");
          }}
          style={{
            marginTop: 10,
          }}
        />
        <Button
          text="Go to Note List"
          onPress={() => {
            navigation.navigate("NoteList");
          }}
          style={{
            marginTop: 10,
          }}
        />
        <Button
          text="Go to Topic Add"
          onPress={() => {
            navigation.navigate("TopicAdd");
          }}
          style={{
            marginTop: 10,
          }}
        />
        <Button
          text="Go to Topic List"
          onPress={() => {
            navigation.navigate("TopicList");
          }}
        />
        <Button 
          text="Go to Post Add" 
          onPress={() => { 
            navigation.navigate("PostAdd", { 
              title: "", 
              description: "", 
              category: "", 
            }); 
          }} 
          style={{ 
            marginTop: 10, 
          }} 
        />
      </View>
    </Layout>
  );
}
