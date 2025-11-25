import React, { useState, useEffect } from "react"; 
import { 
  View, 
  TouchableOpacity, 
  TouchableHighlight, 
  StyleSheet, 
  ActivityIndicator, 
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
import { getAuth } from "firebase/auth"; 
import { 
  getFirestore, 
  onSnapshot, 
  collection, 
  query, 
  where, 
} from "firebase/firestore"; 
import { SwipeListView } from "react-native-swipe-list-view"; 
 
export default function ({ 
  navigation, 
  route, 
}: NativeStackScreenProps<MainStackParamList, "CategoryList">) { 
  const { isDarkmode, setTheme } = useTheme(); 
  const auth = getAuth(); 
  const db = getFirestore(); 
  const [loading, setLoading] = useState<boolean>(true); 
  const [categoryArray, setCategoryArray] = useState<object[]>(); 
 
  useEffect(() => { 
    if (auth.currentUser) { 
      const q = query( 
        collection(db, "Category"), 
        where("CreatedUser.CreatedUserId", "==", auth.currentUser.uid) 
      ); 
 
      const subscriber = onSnapshot(q, (querySnapshot) => { 
        const categoryArrayData: object[] = []; 
 
        querySnapshot.forEach((doc) => { 
          categoryArrayData.push({ 
            ...doc.data(), 
 
            key: doc.id, 
          }); 
        }); 
 
        setCategoryArray(categoryArrayData); 
 
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
 
  const deleteRow = (rowMap: any, rowKey: any) => { 
    closeRow(rowMap, rowKey); 
  }; 
 
  const onRowDidOpen = (rowKey: any) => { 
    console.log("This row opened", rowKey); 
  }; 
 
  const renderItem = (data: any) => ( 
    <TouchableHighlight 
      style={styles.rowFront} 
      underlayColor={"#AAA"} 
      onPress={() => { 
        navigation.navigate("PostAdd", { 
          title: route.params.title, 
          description: route.params.description, 
          category: JSON.stringify({ 
            categoryID: data.item.key, 
            categoryName: data.item.categoryName, 
          }), 
        }); 
      }} 
    > 
      <View style={[styles.row, , { flexDirection: "column" }]}> 
        <Text>{data.item.categoryName}</Text> 
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
      > 
        <Text style={styles.backTextWhite}>Edit</Text> 
      </TouchableOpacity> 
 
      <TouchableOpacity 
        style={[styles.backRightBtn, styles.backRightBtnRight]} 
        onPress={() => deleteRow(rowMap, data.item.key)} 
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
        middleContent="Category List" 
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
        <Button 
          text="Category Add" 
          onPress={() => { 
            navigation.navigate("CategoryAdd"); 
          }} 
          style={{ 
            marginTop: 10, 
          }} 
        /> 
 
        <SwipeListView 
          data={categoryArray} 
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