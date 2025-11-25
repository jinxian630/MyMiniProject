import React, { useState, useEffect } from "react"; 
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
import { getFirestore, doc, updateDoc } from "firebase/firestore"; 
import { ImageSlider } from "react-native-image-slider-banner"; 
 
type DataType = { 
  img: string; 
}; 
 
export default function ({ 
  navigation, 
  route, 
}: NativeStackScreenProps<MainStackParamList, "TopicEdit">) { 
  const { isDarkmode, setTheme } = useTheme(); 
  const [images, setImages] = useState<DataType[]>([]); 
  const [title, setTitle] = useState<string>(route.params.title); 
  const [description, setDescription] = useState<string>( 
    route.params.description 
  ); 
  const [loading, setLoading] = useState<boolean>(false); 
 
  useEffect(() => { 
    if (route.params.imageURL && Array.isArray(route.params.imageURL)) { 
      const formattedImages = route.params.imageURL.map((url) => ({ 
        img: url, 
      })); 
      setImages(formattedImages); 
    } 
  }, [route.params.imageURL]); 
 
  const handlePress = async () => { 
    if (!title) alert("Title is required"); 
    else if (!description) alert("Description is required"); 
    else { 
      setLoading(true); 
      try { 
        const d = new Date().getTime(); 
        const db = getFirestore(); 
        await updateDoc(doc(db, "Topic", route.params.key), { 
          title: title, 
          description: description, 
          updatedDate: d, 
        }) 
          .then(() => { 
            setLoading(false); 
            alert("Document successfully edit!"); 
          }) 
          .catch((error) => { 
            setLoading(false); 
            alert("Error writing document: " + error); 
          }); 
      } catch (err: any) { 
        setLoading(false); 
 
        alert("There is something wrong! " + err.message); 
      } 
    } 
  }; 
 
  return ( 
    <KeyboardAvoidingView behavior="height" enabled style={{ flex: 1 }}> 
      <Layout> 
        <TopNav 
          middleContent="Edit Topic" 
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
          <Text>{route.params.CreatedUser.CreatedUserName}</Text> 
          <ImageSlider 
            data={images} 
            autoPlay={true} 
            onItemChanged={(item) => console.log("item", item)} 
            closeIconColor="#fff" 
          /> 
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
const styles = StyleSheet.create({ 
  container: { 
    backgroundColor: "white", 
    flex: 1, 
  }, 
});