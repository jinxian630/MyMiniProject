import React, { useState, useEffect } from "react";
import {
  View,
  KeyboardAvoidingView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
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
import DropDownPicker from "react-native-dropdown-picker";
import { Calendar } from "react-native-calendars";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function ({
  navigation,
}: NativeStackScreenProps<MainStackParamList, "TaskAdd">) {
  const { isDarkmode, setTheme } = useTheme();
  const [taskName, setTaskName] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [timeline, setTimeline] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showStartCalendar, setShowStartCalendar] = useState(false);

  // Calendar quick year/month selectors for Due Date
  const [yearOpen, setYearOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));
  const [calendarCurrent, setCalendarCurrent] = useState<string>(
    `${year}-${pad2(month)}-01`
  );

  useEffect(() => {
    setCalendarCurrent(`${year}-${pad2(month)}-01`);
  }, [year, month]);

  const years = Array.from(
    { length: 50 },
    (_, i) => new Date().getFullYear() - i
  ).map((y) => ({ label: String(y), value: y }));

  const months = [
    { label: "Jan", value: 1 },
    { label: "Feb", value: 2 },
    { label: "Mar", value: 3 },
    { label: "Apr", value: 4 },
    { label: "May", value: 5 },
    { label: "Jun", value: 6 },
    { label: "Jul", value: 7 },
    { label: "Aug", value: 8 },
    { label: "Sep", value: 9 },
    { label: "Oct", value: 10 },
    { label: "Nov", value: 11 },
    { label: "Dec", value: 12 },
  ];

  const formatDate = (date: Date): string =>
    date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const emptyState = () => {
    setTaskName("");
    setDetails("");
    setDueDate(null);
    setStartDate(null);
    setTimeline("");
  };

  const handleAddTask = async () => {
    if (!taskName.trim()) return alert("Task name is required");
    if (!dueDate) return alert("Please select a due date");
    if (!timeline.trim()) return alert("Please enter a timeline");

    setLoading(true);
    const auth = getAuth();
    const db = getFirestore();

    if (auth.currentUser) {
      const currentUser: User = auth.currentUser;
      const createdAt = new Date().getTime();

      try {
        const docRef = await addDoc(collection(db, "Tasks"), {
          taskName,
          details,
          timeline: timeline,
          startDate: startDate ? startDate.getTime() : null,
          dueDate: dueDate.getTime(),
          completed: false,
          createdAt,
          updatedAt: createdAt,
          reminderSet: true,
          CreatedUser: {
            id: currentUser.uid,
            name: currentUser.displayName,
            photo: currentUser.photoURL,
          },
        });

        emptyState();
        setLoading(false);
        alert("Task added! Document ID: " + docRef.id);
        navigation.goBack();
      } catch (err: any) {
        setLoading(false);
        alert("Error adding task: " + err.message);
      }
    }
  };

  const onDateSelect = (day: any) => {
    const selectedDate = new Date(day.dateString);
    setDueDate(selectedDate);
    setYear(selectedDate.getFullYear());
    setMonth(selectedDate.getMonth() + 1);
    setShowCalendar(false);
  };

  const onStartDateSelect = (day: any) => {
    const selectedDate = new Date(day.dateString);
    setStartDate(selectedDate);
    setShowStartCalendar(false);
  };

  return (
    <KeyboardAvoidingView behavior="height" style={{ flex: 1 }}>
      <Layout>
        <TopNav
          middleContent="Add Task"
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

        <View style={{ flex: 1, padding: 20 }}>
          <Text style={{ marginTop: 20 }}>Task Name</Text>
          <TextInput
            placeholder="Enter task name..."
            value={taskName}
            onChangeText={setTaskName}
          />

          <Text style={{ marginTop: 20 }}>Details (optional)</Text>
          <TextInput
            placeholder="Enter task details..."
            value={details}
            onChangeText={setDetails}
          />

          {/* Start Date */}
          <Text style={{ marginTop: 20 }}>Start Date</Text>
          <TouchableOpacity
            onPress={() => setShowStartCalendar(true)}
            style={{
              padding: 12,
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 8,
              marginTop: 5,
            }}
          >
            <Text>
              {startDate ? formatDate(startDate) : "Select start date"}
            </Text>
          </TouchableOpacity>

          {showStartCalendar && (
            <Modal
              transparent
              animationType="fade"
              onRequestClose={() => setShowStartCalendar(false)}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                activeOpacity={1}
                onPress={() => setShowStartCalendar(false)}
              >
                <View
                  style={{
                    backgroundColor: isDarkmode
                      ? themeColor.dark
                      : themeColor.white,
                    borderRadius: 10,
                    padding: 20,
                    width: "90%",
                    maxWidth: 420,
                  }}
                  onStartShouldSetResponder={() => true}
                >
                  <Calendar
                    current={
                      startDate
                        ? startDate.toISOString().split("T")[0]
                        : new Date().toISOString().split("T")[0]
                    }
                    hideArrows
                    onDayPress={onStartDateSelect}
                    markedDates={
                      startDate
                        ? {
                            [startDate.toISOString().split("T")[0]]: {
                              selected: true,
                              selectedColor: themeColor.primary,
                            },
                          }
                        : {}
                    }
                    theme={{
                      backgroundColor: isDarkmode
                        ? themeColor.dark
                        : themeColor.white,
                      calendarBackground: isDarkmode
                        ? themeColor.dark
                        : themeColor.white,
                      textSectionTitleColor: isDarkmode
                        ? themeColor.white
                        : themeColor.dark,
                      selectedDayBackgroundColor: themeColor.primary,
                      selectedDayTextColor: themeColor.white,
                      todayTextColor: themeColor.primary,
                      dayTextColor: isDarkmode
                        ? themeColor.white
                        : themeColor.dark,
                      textDisabledColor: "#888",
                      monthTextColor: isDarkmode
                        ? themeColor.white
                        : themeColor.dark,
                      arrowColor: themeColor.primary,
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowStartCalendar(false)}
                    style={{
                      marginTop: 20,
                      padding: 12,
                      backgroundColor: themeColor.primary,
                      borderRadius: 5,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{ color: themeColor.white, fontWeight: "bold" }}
                    >
                      Close
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>
          )}

          {/* Due Date */}
          <Text style={{ marginTop: 20 }}>Due Date</Text>
          <TouchableOpacity
            onPress={() => setShowCalendar(true)}
            style={{
              padding: 12,
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 8,
              marginTop: 5,
            }}
          >
            <Text>{dueDate ? formatDate(dueDate) : "Select due date"}</Text>
          </TouchableOpacity>

          {showCalendar && (
            <Modal
              transparent
              animationType="fade"
              onRequestClose={() => setShowCalendar(false)}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                activeOpacity={1}
                onPress={() => setShowCalendar(false)}
              >
                <View
                  style={{
                    backgroundColor: isDarkmode
                      ? themeColor.dark
                      : themeColor.white,
                    borderRadius: 10,
                    padding: 20,
                    width: "90%",
                    maxWidth: 420,
                  }}
                  onStartShouldSetResponder={() => true}
                >
                  {/* Year/Month selectors */}
                  <View
                    style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}
                  >
                    <View style={{ flex: 1, zIndex: 9999 }}>
                      <DropDownPicker
                        open={yearOpen}
                        value={year}
                        items={years}
                        setOpen={setYearOpen}
                        setValue={setYear}
                        setItems={() => {}}
                        placeholder="Year"
                        style={{
                          backgroundColor: isDarkmode
                            ? themeColor.dark200
                            : themeColor.white,
                          borderColor: "#ccc",
                        }}
                        dropDownContainerStyle={{
                          backgroundColor: isDarkmode
                            ? themeColor.dark200
                            : themeColor.white,
                          borderColor: "#ccc",
                        }}
                      />
                    </View>
                    <View style={{ flex: 1, zIndex: 9998 }}>
                      <DropDownPicker
                        open={monthOpen}
                        value={month}
                        items={months}
                        setOpen={setMonthOpen}
                        setValue={setMonth}
                        setItems={() => {}}
                        placeholder="Month"
                        style={{
                          backgroundColor: isDarkmode
                            ? themeColor.dark200
                            : themeColor.white,
                          borderColor: "#ccc",
                        }}
                        dropDownContainerStyle={{
                          backgroundColor: isDarkmode
                            ? themeColor.dark200
                            : themeColor.white,
                          borderColor: "#ccc",
                        }}
                      />
                    </View>
                  </View>

                  <Calendar
                    current={calendarCurrent}
                    hideArrows
                    onDayPress={onDateSelect}
                    markedDates={
                      dueDate
                        ? {
                            [dueDate.toISOString().split("T")[0]]: {
                              selected: true,
                              selectedColor: themeColor.primary,
                            },
                          }
                        : {}
                    }
                    theme={{
                      backgroundColor: isDarkmode
                        ? themeColor.dark
                        : themeColor.white,
                      calendarBackground: isDarkmode
                        ? themeColor.dark
                        : themeColor.white,
                      textSectionTitleColor: isDarkmode
                        ? themeColor.white
                        : themeColor.dark,
                      selectedDayBackgroundColor: themeColor.primary,
                      selectedDayTextColor: themeColor.white,
                      todayTextColor: themeColor.primary,
                      dayTextColor: isDarkmode
                        ? themeColor.white
                        : themeColor.dark,
                      textDisabledColor: "#888",
                      monthTextColor: isDarkmode
                        ? themeColor.white
                        : themeColor.dark,
                      arrowColor: themeColor.primary,
                    }}
                  />

                  <TouchableOpacity
                    onPress={() => setShowCalendar(false)}
                    style={{
                      marginTop: 20,
                      padding: 12,
                      backgroundColor: themeColor.primary,
                      borderRadius: 5,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{ color: themeColor.white, fontWeight: "bold" }}
                    >
                      Close
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>
          )}

          {/* Timeline - Now as Text Input */}
          <Text style={{ marginTop: 20 }}>Timeline</Text>
          <TextInput
            placeholder="Enter timeline (e.g., 2 weeks, 1 month, 30 days)..."
            value={timeline}
            onChangeText={setTimeline}
          />

          <Button
            text={loading ? "Saving..." : "Add Task"}
            onPress={handleAddTask}
            style={{ marginTop: 30 }}
            disabled={loading}
          />
        </View>
      </Layout>
    </KeyboardAvoidingView>
  );
}