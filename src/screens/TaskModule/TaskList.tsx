import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Alert,
  TextInput as RNTextInput,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackParamList } from "../../types/navigation";
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
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Calendar } from "react-native-calendars";

type TaskType = {
  id: string;
  taskName: string;
  details?: string;
  startDate?: number;
  dueDate?: number;
  timeline?: string;
  createdAt: number;
  updatedAt: number;
  CreatedUser: { id: string; name: string };
};

type CommentType = {
  id: string;
  text: string;
  createdAt: number;
  user: { id: string; name: string };
};

export default function TaskInbox({
  navigation,
}: NativeStackScreenProps<MainStackParamList, "TaskInbox">) {
  const { isDarkmode, setTheme } = useTheme();
  const db = getFirestore();
  const auth = getAuth();

  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [timelineVisible, setTimelineVisible] = useState(false);

  const [subtasks, setSubtasks] = useState<TaskType[]>([]);
  const [subtaskName, setSubtaskName] = useState<string>("");
  const [subtaskDetails, setSubtaskDetails] = useState<string>("");
  const [subtaskDueDate, setSubtaskDueDate] = useState<Date | null>(null);
  const [showSubtaskCalendar, setShowSubtaskCalendar] = useState(false);

  const [comments, setComments] = useState<CommentType[]>([]);
  const [commentText, setCommentText] = useState<string>("");

  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));
  const [calendarCurrent, setCalendarCurrent] = useState<string>(
    `${year}-${pad2(month)}-01`
  );

  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);

  useEffect(() => {
    setCalendarCurrent(`${year}-${pad2(month)}-01`);
  }, [year, month]);

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Load tasks
  useEffect(() => {
    const q = query(collection(db, "Tasks"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allTasks: TaskType[] = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as TaskType)
      );
      setTasks(allTasks);
    });
    return () => unsubscribe();
  }, []);

  // Load selected task comments and subtasks
  useEffect(() => {
    if (!selectedTask) return;

    const unsubscribeComments = onSnapshot(
      query(
        collection(db, "Tasks", selectedTask.id, "Comments"),
        orderBy("createdAt", "asc")
      ),
      (snapshot) => {
        const allComments: CommentType[] = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as CommentType)
        );
        setComments(allComments);
      }
    );

    const unsubscribeSubtasks = onSnapshot(
      query(
        collection(db, "Tasks", selectedTask.id, "Subtasks"),
        orderBy("createdAt", "asc")
      ),
      (snapshot) => {
        const allSubtasks: TaskType[] = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as TaskType)
        );
        setSubtasks(allSubtasks);
      }
    );

    return () => {
      unsubscribeComments();
      unsubscribeSubtasks();
    };
  }, [selectedTask]);

  // Complete main task
  const handleCompleteTask = (taskId: string) => {
    setCompletedTaskIds((prev) => [...prev, taskId]);
  };

  // Delete main task
  const handleDeleteTask = async (taskId: string) => {
    if (!taskId) return;
    try {
      await deleteDoc(doc(db, "Tasks", taskId));
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
        setModalVisible(false);
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  // Complete subtask
  const handleCompleteSubtask = (subtaskId: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
  };

  // Add subtask
  const handleAddSubtask = async () => {
    if (!selectedTask) return;
    if (!subtaskName.trim()) {
      Alert.alert("Error", "Subtask name is required");
      return;
    }
    if (!subtaskDueDate) {
      Alert.alert("Error", "Please select a due date");
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    await addDoc(collection(db, "Tasks", selectedTask.id, "Subtasks"), {
      taskName: subtaskName.trim(),
      details: subtaskDetails,
      dueDate: subtaskDueDate.getTime(),
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
      CreatedUser: { id: user.uid, name: user.displayName || "User" },
    });

    setSubtaskName("");
    setSubtaskDetails("");
    setSubtaskDueDate(null);
  };

  // Add comment
  const handleAddComment = async () => {
    if (!selectedTask || !commentText.trim()) return;
    const user = auth.currentUser;
    if (!user) return;

    await addDoc(collection(db, "Tasks", selectedTask.id, "Comments"), {
      text: commentText.trim(),
      createdAt: new Date().getTime(),
      user: { id: user.uid, name: user.displayName || "User" },
    });

    setCommentText("");
  };

  // Delete subtask
  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!selectedTask) return;
    await deleteDoc(doc(db, "Tasks", selectedTask.id, "Subtasks", subtaskId));
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!selectedTask) return;
    await deleteDoc(doc(db, "Tasks", selectedTask.id, "Comments", commentId));
  };

  const onSelectSubtaskDate = (day: any) => {
    const date = new Date(day.dateString);
    setSubtaskDueDate(date);
    setYear(date.getFullYear());
    setMonth(date.getMonth() + 1);
    setShowSubtaskCalendar(false);
  };

  // Generate Timeline Data
  const generateTimelineData = () => {
    if (!selectedTask) return [];

    const timeline: Array<{
      type: "task" | "subtask" | "comment";
      timestamp: number;
      data: TaskType | CommentType;
    }> = [];

    // Add main task created
    timeline.push({
      type: "task",
      timestamp: selectedTask.createdAt,
      data: selectedTask,
    });

    // Add subtasks
    subtasks.forEach((subtask) => {
      timeline.push({
        type: "subtask",
        timestamp: subtask.createdAt,
        data: subtask,
      });
    });

    // Add comments
    comments.forEach((comment) => {
      timeline.push({
        type: "comment",
        timestamp: comment.createdAt,
        data: comment,
      });
    });

    // Sort by timestamp
    return timeline.sort((a, b) => a.timestamp - b.timestamp);
  };

  const renderTimelineItem = (item: ReturnType<typeof generateTimelineData>[0]) => {
    const bgColor = isDarkmode ? "#222" : "#f5f5f5";
    const borderColor = isDarkmode ? "#444" : "#ddd";

    if (item.type === "task") {
      const task = item.data as TaskType;
      return (
        <View
          style={{
            marginBottom: 15,
            borderLeftWidth: 4,
            borderLeftColor: "#2196F3",
            paddingLeft: 15,
          }}
        >
          <View
            style={{
              backgroundColor: bgColor,
              borderRadius: 8,
              padding: 12,
              borderWidth: 1,
              borderColor: borderColor,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
              <Ionicons name="document-text" size={20} color="#2196F3" />
              <Text fontWeight="bold" style={{ marginLeft: 8, color: "#2196F3" }}>
                Task Created
              </Text>
            </View>
            <Text fontWeight="bold" style={{ fontSize: 16 }}>
              {task.taskName}
            </Text>
            {task.details && <Text style={{ marginTop: 5 }}>{task.details}</Text>}
            {task.timeline && (
              <View style={{ 
                flexDirection: "row", 
                alignItems: "center", 
                marginTop: 5,
                padding: 8,
                backgroundColor: isDarkmode ? "#1a3a4a" : "#e3f2fd",
                borderRadius: 5
              }}>
                <Ionicons name="time-outline" size={16} color="#2196F3" />
                <Text style={{ fontSize: 13, marginLeft: 5 }}>
                  Timeline: <Text fontWeight="bold">{task.timeline}</Text>
                </Text>
              </View>
            )}
            <Text style={{ fontSize: 12, color: "#888", marginTop: 5 }}>
              {formatDateTime(task.createdAt)}
            </Text>
            <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
              By: {task.CreatedUser.name}
            </Text>
          </View>
        </View>
      );
    }

    if (item.type === "subtask") {
      const subtask = item.data as TaskType;
      return (
        <View
          style={{
            marginBottom: 15,
            borderLeftWidth: 4,
            borderLeftColor: "#4CAF50",
            paddingLeft: 15,
          }}
        >
          <View
            style={{
              backgroundColor: bgColor,
              borderRadius: 8,
              padding: 12,
              borderWidth: 1,
              borderColor: borderColor,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
              <Ionicons name="list" size={20} color="#4CAF50" />
              <Text fontWeight="bold" style={{ marginLeft: 8, color: "#4CAF50" }}>
                Subtask Added
              </Text>
            </View>
            <Text fontWeight="bold">{subtask.taskName}</Text>
            {subtask.details && <Text style={{ marginTop: 5 }}>{subtask.details}</Text>}
            {subtask.dueDate && (
              <Text style={{ fontSize: 12, color: "#666", marginTop: 5 }}>
                Due: {formatDate(new Date(subtask.dueDate))}
              </Text>
            )}
            <Text style={{ fontSize: 12, color: "#888", marginTop: 5 }}>
              {formatDateTime(subtask.createdAt)}
            </Text>
            <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
              By: {subtask.CreatedUser.name}
            </Text>
          </View>
        </View>
      );
    }

    if (item.type === "comment") {
      const comment = item.data as CommentType;
      return (
        <View
          style={{
            marginBottom: 15,
            borderLeftWidth: 4,
            borderLeftColor: "#FF9800",
            paddingLeft: 15,
          }}
        >
          <View
            style={{
              backgroundColor: bgColor,
              borderRadius: 8,
              padding: 12,
              borderWidth: 1,
              borderColor: borderColor,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
              <Ionicons name="chatbubble" size={20} color="#FF9800" />
              <Text fontWeight="bold" style={{ marginLeft: 8, color: "#FF9800" }}>
                Comment
              </Text>
            </View>
            <Text>{comment.text}</Text>
            <Text style={{ fontSize: 12, color: "#888", marginTop: 5 }}>
              {formatDateTime(comment.createdAt)}
            </Text>
            <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
              By: {comment.user.name}
            </Text>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <KeyboardAvoidingView behavior="height" style={{ flex: 1 }}>
      <Layout>
        <TopNav
          middleContent="Task Inbox"
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
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isCompleted = completedTaskIds.includes(item.id);
              return (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: isCompleted ? "#aaa" : "#0af",
                    borderRadius: 8,
                    backgroundColor: isCompleted ? "#ccc" : "#cceeff",
                    padding: 15,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => handleCompleteTask(item.id)}
                    style={{ marginRight: 10 }}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={24}
                      color={isCompleted ? "#888" : "#0a0"}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => {
                      setSelectedTask(item);
                      setModalVisible(true);
                    }}
                  >
                    <Text
                      fontWeight="bold"
                      style={{
                        textDecorationLine: isCompleted
                          ? "line-through"
                          : "none",
                        color: isCompleted ? "#555" : "#000",
                      }}
                    >
                      {item.taskName}
                    </Text>
                    {item.details && (
                      <Text
                        style={{
                          textDecorationLine: isCompleted
                            ? "line-through"
                            : "none",
                          color: isCompleted ? "#555" : "#333",
                        }}
                      >
                        {item.details}
                      </Text>
                    )}
                    {item.timeline && (
                      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3 }}>
                        <Ionicons name="time-outline" size={14} color="#666" />
                        <Text style={{ fontSize: 12, color: "#666", marginLeft: 4 }}>
                          Timeline: {item.timeline}
                        </Text>
                      </View>
                    )}
                    {item.startDate && (
                      <Text style={{ fontSize: 12, color: "#666" }}>
                        Start: {formatDate(new Date(item.startDate))}
                      </Text>
                    )}
                    {item.dueDate && (
                      <Text style={{ fontSize: 12, color: "#666" }}>
                        Due: {formatDate(new Date(item.dueDate))}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => handleDeleteTask(item.id)}>
                    <Ionicons name="trash-outline" size={24} color="#f44336" />
                  </TouchableOpacity>
                </View>
              );
            }}
          />

          {/* Task Modal */}
          {selectedTask && (
            <Modal
              visible={modalVisible}
              transparent
              animationType="slide"
              onRequestClose={() => setModalVisible(false)}
            >
              <KeyboardAvoidingView
                behavior="height"
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
                    maxHeight: "90%",
                    backgroundColor: isDarkmode
                      ? themeColor.dark
                      : themeColor.white,
                    borderRadius: 12,
                    padding: 20,
                  }}
                >
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <Text fontWeight="bold" size="h3">
                      {selectedTask.taskName}
                    </Text>
                    {selectedTask.details && <Text>{selectedTask.details}</Text>}

                    {selectedTask.timeline && (
                      <View style={{ 
                        flexDirection: "row", 
                        alignItems: "center", 
                        marginTop: 8,
                        padding: 10,
                        backgroundColor: isDarkmode ? "#1a3a4a" : "#e3f2fd",
                        borderRadius: 8,
                        borderLeftWidth: 3,
                        borderLeftColor: "#2196F3"
                      }}>
                        <Ionicons name="time" size={18} color="#2196F3" />
                        <Text style={{ marginLeft: 8, color: isDarkmode ? "#fff" : "#000" }}>
                          Timeline: <Text fontWeight="bold">{selectedTask.timeline}</Text>
                        </Text>
                      </View>
                    )}

                    {selectedTask.startDate && (
                      <Text style={{ marginTop: 5 }}>
                        Start Date: {formatDate(new Date(selectedTask.startDate))}
                      </Text>
                    )}
                    {selectedTask.dueDate && (
                      <Text>
                        Due Date: {formatDate(new Date(selectedTask.dueDate))}
                      </Text>
                    )}

                    {/* Timeline Button */}
                    <Button
                      text="View Timeline"
                      onPress={() => setTimelineVisible(true)}
                      style={{ marginTop: 15 }}
                      leftContent={
                        <Ionicons name="time-outline" size={20} color="#fff" />
                      }
                    />

                    {/* Subtasks */}
                    <Text fontWeight="bold" style={{ marginTop: 15 }}>
                      Subtasks
                    </Text>
                    <View
                      style={{
                        height: 1,
                        backgroundColor: isDarkmode ? "#444" : "#ccc",
                        marginVertical: 8,
                      }}
                    />
                    {subtasks.map((s) => (
                      <View
                        key={s.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 5,
                        }}
                      >
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <TouchableOpacity
                            onPress={() => handleCompleteSubtask(s.id)}
                            style={{ marginRight: 10 }}
                          >
                            <Ionicons
                              name="checkmark-circle-outline"
                              size={20}
                              color={isDarkmode ? "#0f0" : "#0a0"}
                            />
                          </TouchableOpacity>
                          <View>
                            <Text>{s.taskName}</Text>
                            {s.details && (
                              <Text style={{ fontSize: 12, color: "#666" }}>
                                {s.details}
                              </Text>
                            )}
                            {s.startDate && (
                              <Text style={{ fontSize: 12, color: "#666" }}>
                                Start: {formatDate(new Date(s.startDate))}
                              </Text>
                            )}
                            {s.dueDate && (
                              <Text style={{ fontSize: 12, color: "#666" }}>
                                Due: {formatDate(new Date(s.dueDate))}
                              </Text>
                            )}
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteSubtask(s.id)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color="#f44336"
                          />
                        </TouchableOpacity>
                      </View>
                    ))}

                    {/* Add Subtask */}
                    <RNTextInput
                      placeholder="Subtask name"
                      value={subtaskName}
                      onChangeText={(text) => {
                        setSubtaskName(text);
                        if (text.trim()) setShowSubtaskCalendar(true);
                      }}
                      style={{
                        borderWidth: 1,
                        backgroundColor: isDarkmode ? "#222" : "#fff",
                        color: isDarkmode ? "#fff" : "#000",
                        borderColor: "#ccc",
                        borderRadius: 5,
                        padding: 8,
                        marginTop: 5,
                      }}
                    />
                    <RNTextInput
                      placeholder="Subtask description"
                      value={subtaskDetails}
                      onChangeText={setSubtaskDetails}
                      style={{
                        borderWidth: 1,
                        color: isDarkmode ? "#fff" : "#000",
                        backgroundColor: isDarkmode ? "#222" : "#fff",
                        borderColor: "#ccc",
                        borderRadius: 5,
                        padding: 8,
                        marginTop: 5,
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => setShowSubtaskCalendar(true)}
                      style={{
                        padding: 10,
                        borderWidth: 1,
                        borderColor: "#ccc",
                        borderRadius: 5,
                        marginTop: 5,
                      }}
                    >
                      <Text>
                        {subtaskDueDate
                          ? formatDate(subtaskDueDate)
                          : "Select due date"}
                      </Text>
                    </TouchableOpacity>

                    {showSubtaskCalendar && (
                      <Modal transparent animationType="fade">
                        <TouchableOpacity
                          style={{
                            flex: 1,
                            backgroundColor: "rgba(0,0,0,0.5)",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                          activeOpacity={1}
                          onPress={() => setShowSubtaskCalendar(false)}
                        >
                          <View
                            style={{
                              width: "90%",
                              backgroundColor: isDarkmode
                                ? themeColor.dark
                                : themeColor.white,
                              borderRadius: 10,
                              padding: 10,
                            }}
                          >
                            <Calendar
                              current={calendarCurrent}
                              hideArrows
                              onDayPress={onSelectSubtaskDate}
                            />
                            <Button
                              text="Close"
                              onPress={() => setShowSubtaskCalendar(false)}
                              style={{ marginTop: 10 }}
                            />
                          </View>
                        </TouchableOpacity>
                      </Modal>
                    )}
                    <Button
                      text="Add Subtask"
                      onPress={handleAddSubtask}
                      style={{ marginTop: 10 }}
                    />

                    {/* Comments */}
                    <Text fontWeight="bold" style={{ marginTop: 15 }}>
                      Comments
                    </Text>
                    <View
                      style={{
                        height: 1,
                        backgroundColor: isDarkmode ? "#444" : "#ccc",
                        marginVertical: 8,
                      }}
                    />
                    {comments.map((c) => (
                      <View
                        key={c.id}
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingVertical: 5,
                        }}
                      >
                        <Text>{c.text}</Text>
                        <TouchableOpacity
                          onPress={() => handleDeleteComment(c.id)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color="#f44336"
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 5 }}>
                      <RNTextInput
                        placeholder="Add comment..."
                        value={commentText}
                        onChangeText={setCommentText}
                        style={{
                          flex: 1,
                          backgroundColor: isDarkmode ? "#222" : "#fff",
                          color: isDarkmode ? "#fff" : "#000",
                          borderColor: "#ccc",
                          borderWidth: 1,
                          borderRadius: 5,
                          paddingHorizontal: 10,
                          height: 40,
                        }}
                      />
                      <Button text="Comment" onPress={handleAddComment} />
                    </View>

                    {/* Delete & Close */}
                    <Button
                      text="Delete Task"
                      color="red"
                      onPress={() => handleDeleteTask(selectedTask.id)}
                      style={{ marginTop: 10 }}
                    />
                    <Button
                      text="Close"
                      onPress={() => {
                        setModalVisible(false);
                        setSelectedTask(null);
                      }}
                      style={{ marginTop: 15 }}
                    />
                  </ScrollView>
                </View>
              </KeyboardAvoidingView>
            </Modal>
          )}

          {/* Timeline Modal */}
          <Modal
            visible={timelineVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setTimelineVisible(false)}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.5)",
                justifyContent: "center",
                alignItems: "center",
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
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}>
                  <Ionicons
                    name="time"
                    size={24}
                    color={isDarkmode ? themeColor.white100 : themeColor.dark}
                  />
                  <Text fontWeight="bold" size="h3" style={{ marginLeft: 10 }}>
                    Timeline
                  </Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {generateTimelineData().map((item, index) => (
                    <View key={`timeline-${index}`}>
                      {renderTimelineItem(item)}
                    </View>
                  ))}
                </ScrollView>

                <Button
                  text="Close Timeline"
                  onPress={() => setTimelineVisible(false)}
                  style={{ marginTop: 15 }}
                />
              </View>
            </View>
          </Modal>
        </View>
      </Layout>
    </KeyboardAvoidingView>
  );
}