import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  TouchableHighlight,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  TextInput as RNTextInput,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
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
import {
  getFirestore,
  doc,
  onSnapshot,
  collection,
  deleteDoc,
  query,
  where,
  updateDoc,
} from "firebase/firestore";

import { SwipeListView } from "react-native-swipe-list-view";
import { getStorage, ref, deleteObject } from "firebase/storage";
import { getAuth } from "firebase/auth";

type RecipeType = {
  key: string;
  title: string;
  category?: string;
  servings?: string;
  prepTime?: string;
  cookTime?: string;
  difficulty?: string;
  images?: string[];
  createdBy?: { id: string; name: string };
  createdAt: number;
};

export default function ({
  navigation,
}: NativeStackScreenProps<MainStackParamList, "RecipeList">) {
  const { isDarkmode, setTheme } = useTheme();

  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();

  const [loading, setLoading] = useState<boolean>(true);
  const [RecipeArray, setRecipeArray] = useState<RecipeType[]>([]);
  const [isRowOpen, setIsRowOpen] = useState<boolean>(false);

  // Edit Modal States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeType | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editServings, setEditServings] = useState("");
  const [editPrepTime, setEditPrepTime] = useState("");
  const [editCookTime, setEditCookTime] = useState("");
  const [editDifficulty, setEditDifficulty] = useState("");

  useEffect(() => {
    if (auth.currentUser) {
      const q = query(
        collection(db, "Recipes"),
        where("createdBy.id", "==", auth.currentUser.uid)
      );

      const subscriber = onSnapshot(q, (querySnapshot) => {
        const recipeData: RecipeType[] = [];

        querySnapshot.forEach((doc) => {
          recipeData.push({
            ...doc.data(),
            key: doc.id,
          } as RecipeType);
        });

        if (recipeData.length > 0) {
          recipeData.sort((a, b) => b.createdAt - a.createdAt);
          setRecipeArray(recipeData);
        }

        setLoading(false);
      });

      return () => subscriber();
    }
  }, []);

  const closeRow = (rowMap: any, rowKey: any) => {
    if (rowMap[rowKey]) rowMap[rowKey].closeRow();
  };

  const deleteRow = async (rowMap: any, rowKey: any, images: string[]) => {
    console.log("deleteRow called with key:", rowKey);
    closeRow(rowMap, rowKey);

    try {
      // Delete recipe from Firestore
      await deleteDoc(doc(db, "Recipes", rowKey));
      console.log("Recipe deleted from Firestore!");

      // Delete associated images
      if (images && images.length > 0) {
        for (const fileURL of images) {
          try {
            const fileRef = ref(storage, fileURL);
            await deleteObject(fileRef);
            console.log("Image deleted:", fileURL);
          } catch (error) {
            console.log("Error deleting image:", error);
          }
        }
      }

      // Show success alert
      Alert.alert("Success", "Recipe deleted successfully!", [{ text: "OK" }]);
    } catch (err: any) {
      console.error("Delete error:", err);
      Alert.alert("Error", err.message || "Failed to delete recipe");
    }
  };

  const openEditModal = (recipe: RecipeType) => {
    setSelectedRecipe(recipe);
    setEditTitle(recipe.title || "");
    setEditCategory(recipe.category || "");
    setEditServings(recipe.servings || "");
    setEditPrepTime(recipe.prepTime || "");
    setEditCookTime(recipe.cookTime || "");
    setEditDifficulty(recipe.difficulty || "");
    setEditModalVisible(true);
  };

  const handleUpdateRecipe = async () => {
    if (!selectedRecipe) return;
    if (!editTitle.trim()) {
      Alert.alert("Error", "Title is required");
      return;
    }

    try {
      await updateDoc(doc(db, "Recipes", selectedRecipe.key), {
        title: editTitle.trim(),
        category: editCategory.trim(),
        servings: editServings.trim(),
        prepTime: editPrepTime.trim(),
        cookTime: editCookTime.trim(),
        difficulty: editDifficulty.toLowerCase(),
        updatedAt: new Date().getTime(),
      });

      Alert.alert("Success", "Recipe updated successfully!", [{ text: "OK" }]);
      setEditModalVisible(false);
      setSelectedRecipe(null);
    } catch (err: any) {
      console.error("Update error:", err);
      Alert.alert("Error", err.message || "Failed to update recipe");
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "#4CAF50";
      case "medium":
        return "#FF9800";
      case "hard":
        return "#F44336";
      default:
        return "#888";
    }
  };

  const renderItem = (data: any) => (
    <TouchableHighlight
      style={{ borderRadius: 10, marginVertical: 5 }}
      underlayColor={"#DADADA"}
      onPress={() => {
        if (!isRowOpen) {
          openEditModal(data.item);
        }
      }}
    >
      <View
        style={{
          flexDirection: "row",
          backgroundColor: isDarkmode ? "#333" : "#fff5e6",
          borderRadius: 10,
          padding: 12,
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* IMAGE */}
        {data.item.images && data.item.images.length > 0 ? (
          <Image
            source={{ uri: data.item.images[0] }}
            style={{
              width: 80,
              height: 80,
              borderRadius: 10,
              backgroundColor: "#eee",
            }}
          />
        ) : (
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 10,
              backgroundColor: "#e5e5e5",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="restaurant-outline" size={36} color="#888" />
          </View>
        )}

        {/* INFO */}
        <View style={{ flex: 1, flexDirection: "column", gap: 3 }}>
          <Text fontWeight="bold" style={{ fontSize: 17, marginBottom: 2 }}>
            {data.item.title}
          </Text>

          {data.item.category && (
            <Text style={{ fontSize: 13, color: "#6c6c6cff" }}>
              Category: {data.item.category}
            </Text>
          )}

          <View style={{ flexDirection: "row", gap: 15, marginTop: 2 }}>
            {data.item.servings && (
              <Text style={{ fontSize: 12, color: "#6c6c6cff" }}>
                🍽️ {data.item.servings} servings
              </Text>
            )}
            {data.item.prepTime && (
              <Text style={{ fontSize: 12, color: "#6c6c6cff" }}>
                ⏱️ {data.item.prepTime}
              </Text>
            )}
            {data.item.cookTime && (
              <Text style={{ fontSize: 12, color: "#6c6c6cff" }}>
                🔥 {data.item.cookTime}
              </Text>
            )}
          </View>

          {data.item.difficulty && (
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: getDifficultyColor(data.item.difficulty),
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 5,
                marginTop: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: "#fff",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              >
                {data.item.difficulty}
              </Text>
            </View>
          )}

          <Text
            style={{
              fontSize: 11,
              fontStyle: "italic",
              color: "#666",
              marginTop: 4,
            }}
          >
            By: {data.item.createdBy?.name}
          </Text>
        </View>
      </View>
    </TouchableHighlight>
  );

  const renderHiddenItem = (data: any, rowMap: any) => (
    <View
      style={{
        flex: 1,
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        borderRadius: 10,
        marginVertical: 5,
        overflow: "hidden",
      }}
    >
      <TouchableOpacity
        style={{
          backgroundColor: "#999",
          justifyContent: "center",
          alignItems: "center",
          width: 75,
          height: "100%",
        }}
        onPress={() => {
          console.log("Close pressed");
          closeRow(rowMap, data.item.key);
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Close</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: "#0a0",
          justifyContent: "center",
          alignItems: "center",
          width: 75,
          height: "100%",
        }}
        onPress={() => {
          console.log("Edit pressed for:", data.item.key);
          closeRow(rowMap, data.item.key);
          setTimeout(() => {
            openEditModal(data.item);
          }, 100);
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Edit</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: "#f00",
          justifyContent: "center",
          alignItems: "center",
          width: 75,
          height: "100%",
        }}
        onPress={() => {
          console.log("Delete pressed for:", data.item.key);
          deleteRow(rowMap, data.item.key, data.item.images || []);
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return <ActivityIndicator />;

  return (
    <Layout>
      <TopNav
        middleContent="Recipe List"
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
        rightAction={() => setTheme(isDarkmode ? "light" : "dark")}
      />

      <View style={{ flex: 1 }}>
        <SwipeListView
          data={RecipeArray}
          renderItem={renderItem}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-215}
          previewRowKey={"0"}
          previewOpenValue={-40}
          previewOpenDelay={3000}
          onRowOpen={() => setIsRowOpen(true)}
          onRowClose={() => setIsRowOpen(false)}
        />
      </View>

      {/* Edit Recipe Modal */}
      {selectedRecipe && (
        <Modal
          visible={editModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior="padding"
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <View
              style={{
                width: "90%",
                maxHeight: "85%",
                backgroundColor: isDarkmode ? themeColor.dark : themeColor.white,
                borderRadius: 12,
                padding: 20,
              }}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}>
                  <Ionicons
                    name="create"
                    size={24}
                    color={isDarkmode ? themeColor.white100 : themeColor.dark}
                  />
                  <Text fontWeight="bold" size="h3" style={{ marginLeft: 10 }}>
                    Edit Recipe
                  </Text>
                </View>

                {/* Recipe Image Preview */}
                {selectedRecipe.images && selectedRecipe.images.length > 0 && (
                  <Image
                    source={{ uri: selectedRecipe.images[0] }}
                    style={{
                      width: "100%",
                      height: 200,
                      borderRadius: 10,
                      marginBottom: 15,
                    }}
                  />
                )}

                {/* Title */}
                <Text style={{ marginBottom: 5, fontWeight: "600" }}>Title *</Text>
                <RNTextInput
                  placeholder="Recipe title"
                  value={editTitle}
                  onChangeText={setEditTitle}
                  style={{
                    borderWidth: 1,
                    backgroundColor: isDarkmode ? "#222" : "#fff",
                    color: isDarkmode ? "#fff" : "#000",
                    borderColor: "#ccc",
                    borderRadius: 5,
                    padding: 10,
                    marginBottom: 10,
                  }}
                />

                {/* Category */}
                <Text style={{ marginBottom: 5, fontWeight: "600" }}>Category</Text>
                <RNTextInput
                  placeholder="e.g., Breakfast, Lunch, Dinner"
                  value={editCategory}
                  onChangeText={setEditCategory}
                  style={{
                    borderWidth: 1,
                    backgroundColor: isDarkmode ? "#222" : "#fff",
                    color: isDarkmode ? "#fff" : "#000",
                    borderColor: "#ccc",
                    borderRadius: 5,
                    padding: 10,
                    marginBottom: 10,
                  }}
                />

                {/* Servings */}
                <Text style={{ marginBottom: 5, fontWeight: "600" }}>Servings</Text>
                <RNTextInput
                  placeholder="e.g., 4"
                  value={editServings}
                  onChangeText={setEditServings}
                  keyboardType="numeric"
                  style={{
                    borderWidth: 1,
                    backgroundColor: isDarkmode ? "#222" : "#fff",
                    color: isDarkmode ? "#fff" : "#000",
                    borderColor: "#ccc",
                    borderRadius: 5,
                    padding: 10,
                    marginBottom: 10,
                  }}
                />

                {/* Prep Time */}
                <Text style={{ marginBottom: 5, fontWeight: "600" }}>Prep Time</Text>
                <RNTextInput
                  placeholder="e.g., 15 mins"
                  value={editPrepTime}
                  onChangeText={setEditPrepTime}
                  style={{
                    borderWidth: 1,
                    backgroundColor: isDarkmode ? "#222" : "#fff",
                    color: isDarkmode ? "#fff" : "#000",
                    borderColor: "#ccc",
                    borderRadius: 5,
                    padding: 10,
                    marginBottom: 10,
                  }}
                />

                {/* Cook Time */}
                <Text style={{ marginBottom: 5, fontWeight: "600" }}>Cook Time</Text>
                <RNTextInput
                  placeholder="e.g., 30 mins"
                  value={editCookTime}
                  onChangeText={setEditCookTime}
                  style={{
                    borderWidth: 1,
                    backgroundColor: isDarkmode ? "#222" : "#fff",
                    color: isDarkmode ? "#fff" : "#000",
                    borderColor: "#ccc",
                    borderRadius: 5,
                    padding: 10,
                    marginBottom: 10,
                  }}
                />

                {/* Difficulty */}
                <Text style={{ marginBottom: 5, fontWeight: "600" }}>Difficulty</Text>
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 15 }}>
                  {["easy", "medium", "hard"].map((level) => (
                    <TouchableOpacity
                      key={level}
                      onPress={() => setEditDifficulty(level)}
                      style={{
                        flex: 1,
                        padding: 10,
                        borderRadius: 5,
                        backgroundColor:
                          editDifficulty === level
                            ? getDifficultyColor(level)
                            : isDarkmode
                            ? "#333"
                            : "#f0f0f0",
                        borderWidth: 1,
                        borderColor:
                          editDifficulty === level
                            ? getDifficultyColor(level)
                            : "#ccc",
                      }}
                    >
                      <Text
                        style={{
                          textAlign: "center",
                          color: editDifficulty === level ? "#fff" : isDarkmode ? "#fff" : "#000",
                          fontWeight: editDifficulty === level ? "bold" : "normal",
                          textTransform: "capitalize",
                        }}
                      >
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Buttons */}
                <Button
                  text="Update Recipe"
                  onPress={handleUpdateRecipe}
                  style={{ marginTop: 10 }}
                  color="success"
                />

                <Button
                  text="Cancel"
                  onPress={() => {
                    setEditModalVisible(false);
                    setSelectedRecipe(null);
                  }}
                  style={{ marginTop: 10 }}
                  color="warning"
                />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </Layout>
  );
}

const styles = StyleSheet.create({
  rowFront: {
    backgroundColor: "#fff5e6",
    borderBottomColor: "#181717ff",
    borderBottomWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#eee",
  },

  noImageBox: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#e5e5e5",
    justifyContent: "center",
    alignItems: "center",
  },

  infoContainer: {
    flex: 1,
    flexDirection: "column",
    gap: 3,
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },

  smallText: {
    fontSize: 13,
    color: "#444",
  },

  createdBy: {
    fontSize: 11,
    marginTop: 4,
    color: "#666",
    fontStyle: "italic",
  },

  rowBack: {
    alignItems: "center",
    backgroundColor: "#666",
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingRight: 0,
  },

  backRightBtn: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    position: "relative",
    top: 0,
    width: 75,
    height: "100%",
  },

  backRightBtnLeft: {
    backgroundColor: "blue",
  },
  backRightBtnMiddle: {
    backgroundColor: "green",
  },
  backRightBtnRight: {
    backgroundColor: "red",
  },

  backTextWhite: {
    color: "#FFF",
    fontWeight: "bold",
  },
});