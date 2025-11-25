import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SecondScreen from "../screens/SecondScreen";
import ThirdScreen from "../screens/ThirdScreen";
import FourthScreen from "../screens/FourthScreen";
import MainTabs from "./MainTabs";
import MyMenu from "../screens/MyModule/MyMenu";
import QuestionAdd from "../screens/MyModule/QuestionAdd";
import QuestionList from "../screens/MyModule/QuestionList";
import BlogAdd from "../screens/MyModule/BlogAdd";
import BlogList from "../screens/MyModule/BlogList";
import NoteAdd from "../screens/MyModule/NoteAdd";
import NoteList from "../screens/MyModule/NoteList";
import TopicAdd from "../screens/MyModule/TopicAdd";
import TopicList from "../screens/MyModule/TopicList";
import TaskMenu from "../screens/TaskModule/TaskMenu";
import TaskAdd from "../screens/TaskModule/TaskAdd";
import TaskList from "../screens/TaskModule/TaskList";
import EventAdd from "../screens/TaskModule/EventAdd";
import EventList from "../screens/TaskModule/EventList";
import CategoryAdd from "../screens/MyModule/categoryAdd";
import CategoryList from "../screens/MyModule/categoryList";
import PostAdd from "../screens/MyModule/postAdd";


const MainStack = createNativeStackNavigator();
const Main = () => {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <MainStack.Screen name="MainTabs" component={MainTabs} />
      <MainStack.Screen name="SecondScreen" component={SecondScreen} />
      <MainStack.Screen name="ThirdScreen" component={ThirdScreen} />
      <MainStack.Screen name="FourthScreen" component={FourthScreen} />
      <MainStack.Screen name="MyMenu" component={MyMenu} />
      <MainStack.Screen name="QuestionAdd" component={QuestionAdd} />
      <MainStack.Screen name="QuestionList" component={QuestionList} />
      <MainStack.Screen name="BlogAdd" component={BlogAdd} />
      <MainStack.Screen name="BlogList" component={BlogList} />
      <MainStack.Screen name="NoteAdd" component={NoteAdd} />
      <MainStack.Screen name="NoteList" component={NoteList} />
      <MainStack.Screen name="TopicAdd" component={TopicAdd} />
      <MainStack.Screen name="TopicList" component={TopicList} />
      <MainStack.Screen name="TaskMenu" component={TaskMenu} />
      <MainStack.Screen name="TaskAdd" component={TaskAdd} />
      <MainStack.Screen name="TaskList" component={TaskList} />
      <MainStack.Screen name="EventAdd" component={EventAdd} />
      <MainStack.Screen name="EventList" component={EventList} />
      <MainStack.Screen name="CategoryAdd" component={CategoryAdd} />
      <MainStack.Screen name="CategoryList" component={CategoryList} />
      <MainStack.Screen name="PostAdd" component={PostAdd} />

    </MainStack.Navigator>
  );
};

export default Main;
