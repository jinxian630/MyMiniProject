import React, { useState } from "react"; 
import { View, Platform, StyleSheet, KeyboardAvoidingView } from "react-native"; 
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
}: NativeStackScreenProps<MainStackParamList, "CategoryAdd">) { 
  const { isDarkmode, setTheme } = useTheme(); 
  const [categoryName, setCategoryName] = useState<string>(""); 
  const [categoryDescription, setCategoryDescription] = useState<string>(""); 
  const [loading, setLoading] = useState<boolean>(false); 
 
  async function AddCategory() { 
    if (!categoryName) alert("Category Name is required"); 
    else if (!categoryDescription) alert("Category Description is required"); 
    else { 
      setLoading(true); 
 
      const db = getFirestore(); 
 
      const auth = getAuth(); 
      if (auth.currentUser) { 
        const currentUser: User = auth.currentUser; 
 
        const startDate = new Date().getTime(); 
 
        await addDoc(collection(db, "Category"), { 
          categoryName: categoryName, 
          categoryDescription: categoryDescription, 
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
            setCategoryName(""); 
            setCategoryDescription(""); 
 
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
    <KeyboardAvoidingView behavior="height" enabled style={{ flex: 1 }}> 
      <Layout> 
        <TopNav 
          middleContent="Add Category" 
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
          <Text>Category Name</Text> 
          <TextInput 
            containerStyle={{ marginTop: 15 }} 
            placeholder="Enter your category name" 
            value={categoryName} 
            onChangeText={(text) => setCategoryName(text)} 
          /> 
          <Text>Category Description</Text> 
          <TextInput 
            containerStyle={{ marginTop: 15 }} 
            placeholder="Enter your category description" 
            value={categoryDescription} 
            onChangeText={(text) => setCategoryDescription(text)} 
          /> 
          <Button 
            text={loading ? "Loading" : "Add"} 
            onPress={() => { 
              AddCategory(); 
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