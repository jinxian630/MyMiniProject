import React, { useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView } from "react-native";
import { MainStackParamList } from "../../types/navigation";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Layout,
  TopNav,
  Text,
  useTheme,
  themeColor,
  TextInput,
  Button,
} from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { getFirestore, addDoc, collection } from "firebase/firestore";
import { getAuth, User } from "firebase/auth";
export default function ({
  navigation,
}: NativeStackScreenProps<MainStackParamList, "NoteAdd">) {
  const { isDarkmode, setTheme } = useTheme();
  const [NoteTitle, setNoteTitle] = useState<string>("");
  const [NoteDescription, setNoteDescription] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  async function AddNote() {
    if (!NoteTitle) alert("Note Title is required");
    else if (!NoteDescription) alert("Note Description is required");
    else {
      setLoading(true);
      const db = getFirestore();
      const auth = getAuth();
      if (auth.currentUser) {
        const currentUser: User = auth.currentUser;
        const startDate = new Date().getTime();
        await addDoc(collection(db, "Note"), {
          NoteTitle: NoteTitle,
          NoteDescription: NoteDescription,
          startDate: startDate,
          updatedDate: startDate,
          CreatedUser: {
            CreatedUserId: currentUser.uid,
            CreatedUserName: currentUser.displayName,
            CreatedUserPhoto: currentUser.photoURL,
          },
        })
          .then((docRef) => {
            setLoading(false);
            setNoteTitle("");
            setNoteDescription("");
            alert("Added successfully. Document written with ID: " + docRef.id);
          })
          .catch((error) => {
            setLoading(false);
            alert("Error adding document: " + error);
          });
      }
    }
  }
  return (
    <KeyboardAvoidingView behavior="height" enabled style={styles.container}>
      <Layout>
        <TopNav
          middleContent="Add Note"
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
          }}
        >
          <Text>Note Title</Text>
          <TextInput
            containerStyle={{ marginTop: 15 }}
            placeholder="Enter your Note title"
            value={NoteTitle}
            onChangeText={(text) => setNoteTitle(text)}
          />
          <Text>Note Description</Text>
          <TextInput
            containerStyle={{ marginTop: 15 }}
            placeholder="Enter your Note description"
            value={NoteDescription}
            onChangeText={(text) => setNoteDescription(text)}
          />
          <Button
            text={loading ? "Loading" : "Add"}
            onPress={() => {
              AddNote();
            }}
            style={{
              marginTop: 20,
            }}
            disabled={loading}
          />
        </View>
      </Layout>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    flex: 1,
  },
});
