import React, { useState, useEffect } from "react";
import { View, Platform, KeyboardAvoidingView, Image } from "react-native";
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
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
export default function ({
  navigation,
}: NativeStackScreenProps<MainStackParamList, "BlogAdd">) {
  const { isDarkmode, setTheme } = useTheme();
  const [image, setImage] = useState<any>(null);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const emptyState = () => {
    setImage(null);
    setTitle("");
    setDescription("");
  };
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          alert("Sorry, we need camera roll permissions to make this work!");
        }
      }
    })();
  }, []);
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    console.log(result);
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };
  const handlePress = async () => {
    if (!title) alert("Title is required");
    else if (!description) alert("Description is required");
    else if (image == null) alert("Image is required.");
    else {
      setLoading(true);
      const auth = getAuth();
      const storage = getStorage();
      const db = getFirestore();
      if (auth.currentUser) {
        const currentUser: User = auth.currentUser;
        const startDate = new Date().getTime();
        const response = await fetch(image);
        const blob = await response.blob();
        let u =
          Date.now().toString(16) + Math.random().toString(16) + "0".repeat(16);
        let guid = [
          u.substring(0, 8),
          u.substring(8, 4),
          "4000-8" + u.substring(13, 3),
          u.substring(16, 12),
        ].join("-");
        const spaceRef = ref(storage, "Blog/" + guid);
        try {
          uploadBytes(spaceRef, blob).then((snapshot) => {
            getDownloadURL(snapshot.ref).then((downloadURL) => {
              console.log("File available at", downloadURL);
              addDoc(collection(db, "Blog"), {
                title: title,
                description: description,
                imageURL: downloadURL,
                startDate: startDate,
                updatedDate: startDate,
                CreatedUser: {
                  CreatedUserId: currentUser.uid,
                  CreatedUserName: currentUser.displayName,
                  CreatedUserPhoto: currentUser.photoURL,
                },
              })
                .then((docRef) => {
                  emptyState();
                  setLoading(false);
                  alert(
                    "Added successfully. Document written with ID: " + docRef.id
                  );
                })
                .catch((error) => {
                  setLoading(false);
                  alert("Error adding document: " + error);
                });
            });
          });
        } catch (err: any) {
          setLoading(false);
          alert("There is something wrong!" + err.message);
        }
      }
    }
  };
  return (
    <KeyboardAvoidingView behavior="height" enabled style={{ flex: 1 }}>
      <Layout>
        <TopNav
          middleContent="Add Blog"
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
          <Button text="Pick an image from camera roll" onPress={pickImage} />
          {image && (
            <Image
              source={{ uri: image }}
              style={{ width: 200, height: 200 }}
            />
          )}
          <Text>Title</Text>
          <TextInput
            containerStyle={{ marginTop: 15 }}
            placeholder="Title*"
            value={title}
            autoCapitalize="none"
            autoCompleteType="on"
            autoCorrect={true}
            onChangeText={(title) => setTitle(title)}
          />
          <Text style={{ marginTop: 15 }}>Description</Text>
          <TextInput
            containerStyle={{ marginTop: 15 }}
            placeholder="Description*"
            value={description}
            autoCapitalize="none"
            autoCompleteType="on"
            autoCorrect={true}
            onChangeText={(description) => setDescription(description)}
          />
          <Button
            text={loading ? "Loading" : "Done"}
            onPress={() => {
              handlePress();
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
