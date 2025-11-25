import React, { useState, useEffect } from "react";
import {
  View,
  KeyboardAvoidingView,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from "react-native";
import { MainStackParamList } from "../../types/navigation";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import {
  Layout,
  TopNav,
  Text,
  TextInput,
  Button,
  useTheme,
  themeColor,
} from "react-native-rapi-ui";

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { getAuth } from "firebase/auth";
import { getFirestore, addDoc, collection } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ({
  navigation,
}: NativeStackScreenProps<MainStackParamList, "RecipeAdd">) {
  const { isDarkmode, setTheme } = useTheme();

  // Recipe fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [servings, setServings] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<string[]>([]);

  // Difficulty selection
  const [difficulty, setDifficulty] = useState("medium");

  // Image Picker
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          alert("Media library permission is required!");
        }
      }
    })();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const newFiles = result.assets.map((x) => x.uri);
      setImages([...images, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAddRecipe = async () => {
    if (!title.trim()) return alert("Recipe title is required");
    if (!ingredients.trim()) return alert("Ingredients are required");
    if (!instructions.trim()) return alert("Instructions are required");

    const auth = getAuth();
    const db = getFirestore();
    const storage = getStorage();

    const user = auth.currentUser;
    if (!user) return alert("Not logged in");

    const createdAt = Date.now();

    // Upload images
    const uploadedURLs: string[] = [];

    for (const file of images) {
      const response = await fetch(file);
      const blob = await response.blob();

      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const storageRef = ref(storage, `RecipeImages/${id}`);

      const snap = await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(snap.ref);
      uploadedURLs.push(url);
    }

    try {
      await addDoc(collection(db, "Recipes"), {
        title,
        category,
        servings: servings ? parseInt(servings) : null,
        prepTime,
        cookTime,
        difficulty,
        ingredients: ingredients.split("\n").filter((i) => i.trim()),
        instructions: instructions.split("\n").filter((i) => i.trim()),
        notes,
        images: uploadedURLs,
        createdAt,
        createdBy: {
          id: user.uid,
          name: user.displayName,
          photo: user.photoURL,
        },
      });

      alert("Recipe added successfully!");
      navigation.goBack();
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  return (
    <KeyboardAvoidingView behavior="height" style={{ flex: 1 }}>
      <Layout>
        <TopNav
          middleContent="Add Recipe"
          leftContent={<Ionicons name="chevron-back" size={20} />}
          leftAction={() => navigation.goBack()}
          rightContent={
            <Ionicons name={isDarkmode ? "sunny" : "moon"} size={20} />
          }
          rightAction={() => setTheme(isDarkmode ? "light" : "dark")}
        />

        <ScrollView style={{ flex: 1, padding: 20 }}>
          {/* Title */}
          <Text>Recipe Name</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Pasta Carbonara, Chocolate Cake..."
            style={{ marginBottom: 20 }}
          />

          {/* Category */}
          <Text>Category</Text>
          <TextInput
            value={category}
            onChangeText={setCategory}
            placeholder="Breakfast, Lunch, Dinner, Dessert..."
            style={{ marginBottom: 20 }}
          />

          {/* Servings */}
          <Text>Servings</Text>
          <TextInput
            value={servings}
            onChangeText={setServings}
            placeholder="Number of servings"
            keyboardType="numeric"
            style={{ marginBottom: 20 }}
          />

          {/* Prep & Cook Time */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <Text>Prep Time</Text>
              <TextInput
                value={prepTime}
                onChangeText={setPrepTime}
                placeholder="15 mins"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text>Cook Time</Text>
              <TextInput
                value={cookTime}
                onChangeText={setCookTime}
                placeholder="30 mins"
              />
            </View>
          </View>

          {/* Difficulty */}
          <Text>Difficulty Level</Text>
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              marginVertical: 10,
            }}
          >
            <Button
              text="Easy"
              status={difficulty === "easy" ? "success" : "info"}
              onPress={() => setDifficulty("easy")}
              size="sm"
            />
            <Button
              text="Medium"
              status={difficulty === "medium" ? "warning" : "info"}
              onPress={() => setDifficulty("medium")}
              size="sm"
            />
            <Button
              text="Hard"
              status={difficulty === "hard" ? "danger" : "info"}
              onPress={() => setDifficulty("hard")}
              size="sm"
            />
          </View>

          {/* Ingredients */}
          <Text>Ingredients (one per line)</Text>
          <TextInput
            value={ingredients}
            onChangeText={setIngredients}
            placeholder="2 cups flour&#10;1 cup sugar&#10;3 eggs..."
            multiline
            numberOfLines={5}
            style={{ marginBottom: 20 }}
          />

          {/* Instructions */}
          <Text>Instructions (one step per line)</Text>
          <TextInput
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Preheat oven to 350°F&#10;Mix dry ingredients&#10;Add wet ingredients..."
            multiline
            numberOfLines={6}
            style={{ marginBottom: 20 }}
          />

          {/* Notes */}
          <Text>Notes (optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Tips, variations, storage instructions..."
            multiline
            numberOfLines={3}
            style={{ marginBottom: 20 }}
          />

          {/* Images */}
          <Button text="Add Photos" onPress={pickImage} />

          <View
            style={{
              marginTop: 10,
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {images.map((uri, index) => (
              <View key={index} style={{ position: "relative" }}>
                <Image
                  source={{ uri }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 10,
                  }}
                />
                <TouchableOpacity
                  onPress={() => removeImage(index)}
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    backgroundColor: "red",
                    borderRadius: 12,
                    width: 24,
                    height: 24,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Submit */}
          <Button
            text="Save Recipe"
            status="primary"
            onPress={handleAddRecipe}
            style={{ marginTop: 30, marginBottom: 40 }}
          />
        </ScrollView>
      </Layout>
    </KeyboardAvoidingView>
  );
}