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
} from "react-native-rapi-ui";
import { Ionicons } from "@expo/vector-icons";
import { getFirestore, collection, query, getDocs } from "firebase/firestore";
import { SwipeListView } from "react-native-swipe-list-view";
export default function ({
  navigation,
}: NativeStackScreenProps<MainStackParamList, "QuestionList">) {
  const { isDarkmode, setTheme } = useTheme();
  const db = getFirestore();
  const [loading, setLoading] = useState<boolean>(true); // Set loading to true on component mount
  const [questionArray, setQuestionArray] = useState<object[]>(); // Initial empty
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const q = query(collection(db, "Question"));
        const querySnapshot = await getDocs(q);
        const questionArrayData: object[] = [];
        querySnapshot.forEach((doc) => {
          questionArrayData.push({
            ...doc.data(),
            key: doc.id,
          });
        });
        setQuestionArray(questionArrayData);
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);
  const closeRow = (rowMap: any, rowKey: any) => {
    if (rowMap[rowKey]) {
      rowMap[rowKey].closeRow();
    }
  };
  const deleteRow = (rowMap: any, rowKey: any, imageLocation: string) => {
    closeRow(rowMap, rowKey);
  };
  const onRowDidOpen = (rowKey: any) => {
    console.log("This row opened", rowKey);
  };
  const renderItem = (data: any) => (
    <TouchableHighlight style={styles.rowFront} underlayColor={"#AAA"}>
      <View style={[styles.row, , { flexDirection: "column" }]}>
        <Text>{data.item.questionTitle}</Text>
        <Text>{data.item.questionDescription}</Text>
        <Text>{new Date(data.item.updatedDate).toLocaleString()}</Text>
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
      <TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnRight]}>
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
        middleContent="Question List"
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
          data={questionArray}
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
