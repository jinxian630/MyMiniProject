import React, { useState, useEffect } from "react"; 
import { 
  View, 
  TouchableOpacity, 
  TouchableHighlight, 
  StyleSheet, 
  ActivityIndicator, 
  Image, 
} from "react-native"; 
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
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  collection, 
  deleteDoc, 
  query, 
  where, 
} from "firebase/firestore"; 
import { SwipeListView } from "react-native-swipe-list-view"; 
import { getStorage, ref, deleteObject } from "firebase/storage"; 
import { getAuth } from "firebase/auth"; 
 
export default function ({ 
  navigation, 
}: NativeStackScreenProps<MainStackParamList, "TopicList">) { 
  const { isDarkmode, setTheme } = useTheme(); 
  const auth = getAuth(); 
  const db = getFirestore(); 
  const storage = getStorage(); 
 
  const [loading, setLoading] = useState<boolean>(true); 
  const [TopicArray, setTopicArray] = useState<object[]>(); 
 
  useEffect(() => { 
    if (auth.currentUser) { 
      const q = query( 
        collection(db, "Topic"), 
        where("CreatedUser.CreatedUserId", "==", auth.currentUser.uid) 
      ); 
 
      const subscriber = onSnapshot(q, (querySnapshot) => { 
        const TopicArrayData: object[] = []; 
 
        querySnapshot.forEach((doc) => { 
          TopicArrayData.push({ 
            ...doc.data(), 
 
            key: doc.id, 
          }); 
        }); 
 
        if (TopicArrayData.length > 0) { 
          TopicArrayData.sort( 
            (a: any, b: any) => b.updatedDate - a.updatedDate 
          ); 
          setTopicArray(TopicArrayData); 
        } 
 
        setLoading(false); 
      }); 
 
      return () => subscriber(); 
    } 
  }, []); 
 
  const closeRow = (rowMap: any, rowKey: any) => { 
    if (rowMap[rowKey]) { 
      rowMap[rowKey].closeRow(); 
    } 
  }; 
 
  const deleteRow = (rowMap: any, rowKey: any, imageURL: string[]) => { 
    closeRow(rowMap, rowKey); 
 
    try { 
      deleteDoc(doc(db, "Topic", rowKey)) 
        .then(() => { 
          console.log("Document successfully deleted!"); 
          imageURL.map(async (image, index) => { 
            console.log(image); 
            const desertRef = ref(storage, image); 
            deleteObject(desertRef) 
              .then(() => { 
                console.log("Image successfully deleted!"); 
              }) 
              .catch((error) => { 
                console.log(error); 
              }); 
          }); 
        }) 
        .catch((err) => { 
          alert(err.message); 
        }); 
    } catch (err: any) { 
      alert(err.message); 
    } 
  }; 
 
  const onRowDidOpen = (rowKey: any) => { 
    console.log("This row opened", rowKey); 
  }; 
 
  const renderItem = (data: any) => ( 
    <TouchableHighlight 
      style={styles.rowFront} 
      underlayColor={"#AAA"} 
      onPress={() => { 
        navigation.navigate("TopicDetail", { 
          key: data.item.key, 
          title: data.item.title, 
          description: data.item.description, 
          imageURL: data.item.imageURL, 
          startDate: data.item.startDate, 
          updatedDate: data.item.updatedDate, 
          CreatedUser: data.item.CreatedUser, 
        }); 
      }} 
    > 
      <View style={[styles.row, , { flexDirection: "column" }]}> 
        <Text>{data.item.title}</Text> 
        <Image 
          source={{ uri: data.item.imageURL[0] }} 
          style={{ 
            width: 80, 
            height: 80, 
            borderWidth: 2, 
            borderColor: "#d35647", 
            resizeMode: "contain", 
            margin: 8, 
          }} 
        /> 
 
        <Text>{new Date(data.item.updatedDate).toLocaleString()}</Text> 
        <Text>{data.item.CreatedUser.CreatedUserName}</Text> 
      </View> 
    </TouchableHighlight> 
  ); 
 
  const renderHiddenItem = (data: any, rowMap: any) => ( 
    <View style={styles.rowBack}> 
      <TouchableOpacity 
        style={[styles.backRightBtn, styles.backRightBtnLeft]} 
        onPress={() => closeRow(rowMap, data.item.key)} 
      > 
        <Text style={styles.backTextWhite}>Close</Text> 
      </TouchableOpacity> 
 
      <TouchableOpacity 
        style={[styles.backRightBtn, styles.backRightBtnMiddle]} 
        onPress={() => { 
          navigation.navigate("TopicEdit", { 
            key: data.item.key, 
            title: data.item.title, 
            description: data.item.description, 
            imageURL: data.item.imageURL, 
            startDate: data.item.startDate, 
            updatedDate: data.item.updatedDate, 
            CreatedUser: data.item.CreatedUser, 
          }); 
        }} 
      > 
        <Text style={styles.backTextWhite}>Edit</Text> 
      </TouchableOpacity> 
 
      <TouchableOpacity 
        style={[styles.backRightBtn, styles.backRightBtnRight]} 
        onPress={() => deleteRow(rowMap, data.item.key, data.item.imageURL)} 
      > 
        <Text style={styles.backTextWhite}>Delete</Text> 
      </TouchableOpacity> 
    </View> 
  ); 
 
  if (loading) { 
    return <ActivityIndicator />; 
  } 
 
  return ( 
    <Layout> 
      <TopNav 
        middleContent="Topic List" 
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
        <SwipeListView 
          data={TopicArray} 
          renderItem={renderItem} 
          renderHiddenItem={renderHiddenItem} 
          rightOpenValue={-215} 
          previewRowKey={"0"} 
          previewOpenValue={-40} 
          previewOpenDelay={3000} 
          onRowDidOpen={onRowDidOpen} 
        /> 
      </View> 
    </Layout> 
  ); 
} 
const styles = StyleSheet.create({ 
  container: { 
    backgroundColor: "white", 
    flex: 1, 
  }, 
 
  backTextWhite: { 
    color: "#FFF", 
  }, 
 
  rowFront: { 
    alignItems: "center", 
    backgroundColor: "#CCC", 
    borderBottomColor: "black", 
    borderBottomWidth: 1, 
    justifyContent: "center", 
    height: 180, 
  }, 
 
  rowBack: { 
    alignItems: "center", 
    backgroundColor: "#DDD", 
    flex: 1, 
    flexDirection: "row", 
    justifyContent: "space-between", 
    paddingLeft: 15, 
  }, 
 
  backRightBtn: { 
    alignItems: "center", 
    bottom: 0, 
    justifyContent: "center", 
    position: "absolute", 
    top: 0, 
    width: 75, 
  }, 
 
  backRightBtnLeft: { 
    backgroundColor: "blue", 
    right: 150, 
  }, 
 
  backRightBtnMiddle: { 
    backgroundColor: "green", 
    right: 75, 
  }, 
 
  backRightBtnRight: { 
    backgroundColor: "red", 
    right: 0, 
  }, 
 
  row: { 
    flex: 1, 
    flexDirection: "row", 
    flexWrap: "wrap", 
    alignItems: "center", 
    marginBottom: 10, 
  }, 
});