import React, { useState, useEffect } from "react"; 
import { View, Image } from "react-native"; 
import { MainStackParamList } from "../../types/navigation"; 
import { NativeStackScreenProps } from "@react-navigation/native-stack"; 
import { 
  Layout, 
  TopNav, 
  Text, 
  useTheme, 
  themeColor, 
} from "react-native-rapi-ui"; 
import { Ionicons } from "@expo/vector-icons"; 
import { ImageSlider } from "react-native-image-slider-banner"; 
 
type DataType = { 
  img: string; 
}; 
 
export default function ({ 
  route, 
  navigation, 
}: NativeStackScreenProps<MainStackParamList, "TopicDetail">) { 
  const { isDarkmode, setTheme } = useTheme(); 
  const [images, setImages] = useState<DataType[]>([]); 
  useEffect(() => { 
    if (route.params.imageURL && Array.isArray(route.params.imageURL)) { 
      const formattedImages = route.params.imageURL.map((url) => ({ 
        img: url, 
      })); 
      setImages(formattedImages); 
    } 
  }, [route.params.imageURL]); 
 
  return ( 
    <Layout> 
      <TopNav 
        middleContent="Topic Detail" 
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
        {/* This text using ubuntu font */} 
        <Text fontWeight="bold">{route.params.title}</Text> 
        <View 
          style={{ 
            flex: 1, 
          }} 
        > 
          <ImageSlider 
            data={images} 
            autoPlay={true} 
            onItemChanged={(item) => console.log("item", item)} 
            closeIconColor="#fff" 
          /> 
        </View> 
        <Text>{route.params.description}</Text> 
        <Text>{route.params.CreatedUser.CreatedUserName}</Text> 
        <Text>{new Date(route.params.updatedDate).toLocaleString()}</Text> 
      </View> 
    </Layout> 
  ); 
} 


