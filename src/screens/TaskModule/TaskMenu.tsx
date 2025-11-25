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
          text="Add New Task +"
          onPress={() => {
            navigation.navigate("TaskAdd");
          }}
          style={{
            marginTop: 10,
          }}
        />
        <Button
          text="Task Inbox"
          onPress={() => {
            navigation.navigate("TaskList");
          }}
          style={{
            marginTop: 10,
          }}
        />
        <Button
          text="Add New recepie +"
          onPress={() => {
            navigation.navigate("EventAdd");
          }}
          style={{
            marginTop: 10,
          }}
        />
        <Button
          text="Recipe List"
          onPress={() => {
            navigation.navigate("EventList");
          }}
          style={{
            marginTop: 10,
          }}
        />
      </View>
    </Layout>
  );
}
