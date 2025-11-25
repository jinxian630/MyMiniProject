import React, { useState } from "react"; 
import { View, Platform, KeyboardAvoidingView } from "react-native"; 
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

type CategoryType = { 
  key: string; 
  categoryName: string; 
}; 

export default function ({ 
  navigation, 
  route, 
}: NativeStackScreenProps<MainStackParamList, "PostAdd">) { 
  const { isDarkmode, setTheme } = useTheme(); 
  const [PostTitle, setPostTitle] = useState<string>(route.params.title); 
  const [PostDescription, setPostDescription] = useState<string>( 
    route.params.description 
  ); 

  const categoryObject = 
    route.params.category == "" 
      ? { key: "", categoryName: "" } 
      : JSON.parse(route.params.category); 

  const [category, setCategory] = useState<CategoryType>(categoryObject); 
  const [loading, setLoading] = useState<boolean>(false); 

  async function AddPost() { 
    if (!PostTitle) alert("Post Title is required"); 
    else if (!PostDescription) alert("Post Description is required"); 
    else if (!route.params.category) alert("Post Category is required"); 
    else { 
      setLoading(true); 

      const db = getFirestore(); 

      const auth = getAuth(); 
      if (auth.currentUser) { 
        const currentUser: User = auth.currentUser; 

        const startDate = new Date().getTime(); 

        await addDoc(collection(db, "Post"), { 
          PostTitle: PostTitle, 
          PostDescription: PostDescription, 
          PostCategory: categoryObject, 
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

            setPostTitle(""); 

            setPostDescription(""); 

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
          middleContent="Add Post" 
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
          <Text>Post Title</Text> 
          <TextInput 
            containerStyle={{ marginTop: 15 }} 
            placeholder="Enter your Post title" 
            value={PostTitle} 
            onChangeText={(text) => setPostTitle(text)} 
          /> 
          <Text>Post Description</Text> 
          <TextInput 
            containerStyle={{ marginTop: 15 }} 
            placeholder="Enter your Post description" 
            value={PostDescription} 
            onChangeText={(text) => setPostDescription(text)} 
          /> 
          <Text>Post Category</Text> 
          <Text>{category.categoryName}</Text> 
          <Button 
            text="Category List" 
            onPress={() => { 
              navigation.navigate("CategoryList", { 
                title: PostTitle, 
                description: PostDescription, 
                category: "", 
              }); 
            }} 
            style={{ 
              marginTop: 10, 
            }} 
          /> 
          <Button 
            text={loading ? "Loading" : "Add"} 
            onPress={() => { 
              AddPost(); 
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