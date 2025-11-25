import React from "react";
import { StatusBar } from "expo-status-bar";
import {
  ScrollView,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Image,
  Modal,
  Alert,
} from "react-native";
import { AuthStackParamList } from "../../types/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../../config/firebase";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Layout,
  Text,
  TextInput,
  Button,
  useTheme,
  themeColor,
} from "react-native-rapi-ui";
import { Calendar } from "react-native-calendars";
import DropDownPicker from "react-native-dropdown-picker";
import { TextInputMask } from "react-native-masked-text";

export default function ({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, "Register">) {
  const { isDarkmode, setTheme } = useTheme();

  // -------- Form state --------
  const [displayName, setDisplayName] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [confirmPassword, setConfirmPassword] = React.useState<string>("");
  const [gender, setGender] = React.useState<string>("");
  const [genderOpen, setGenderOpen] = React.useState<boolean>(false);
  const [birthDate, setBirthDate] = React.useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = React.useState<boolean>(false);
  const [countryCode, setCountryCode] = React.useState<string>("+60");
  const [countryCodeOpen, setCountryCodeOpen] = React.useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string>("");
  const [profileImage, setProfileImage] = React.useState<string | null>(null);

  // Gender dropdown
  const [genderItems, setGenderItems] = React.useState([
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
  ]);

  // Country code dropdown
  const [countryCodeItems, setCountryCodeItems] = React.useState([
    { label: "+60", value: "+60" },
  ]);

  // -------- Year/Month Quick Jump for Calendar --------
  const [yearOpen, setYearOpen] = React.useState(false);
  const [monthOpen, setMonthOpen] = React.useState(false);
  const [year, setYear] = React.useState<number>(birthDate.getFullYear());
  const [month, setMonth] = React.useState<number>(birthDate.getMonth() + 1);
  const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));
  const [calendarCurrent, setCalendarCurrent] = React.useState<string>(
    `${year}-${pad2(month)}-01`
  );

  const currentYear = new Date().getFullYear();
  const years = React.useMemo(
    () =>
      Array.from(
        { length: currentYear - 1950 + 1 },
        (_, i) => currentYear - i
      ).map((y) => ({ label: String(y), value: y })),
    [currentYear]
  );

  const months = React.useMemo(
    () => [
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
    ],
    []
  );

  // keep calendar month in sync with selected year/month
  React.useEffect(() => {
    setCalendarCurrent(`${year}-${pad2(month)}-01`);
  }, [year, month]);

  // -------- Validation using alert() --------
  const validateForm = (): boolean => {
    const phoneDigits = phoneNumber.replace(/[\s-]/g, "");

    if (!displayName.trim()) {
      alert("Display name is required");
      return false;
    } else if (!email.trim()) {
      alert("Email is required");
      return false;
    } else if (!password) {
      alert("Password is required");
      return false;
    } else if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return false;
    } else if (password !== confirmPassword) {
      alert("Passwords do not match");
      return false;
    } else if (!gender) {
      alert("Please select your gender");
      return false;
    } else if (!phoneDigits) {
      alert("Phone number is required");
      return false;
    } else if (!/^[0-9]{9,11}$/.test(phoneDigits)) {
      alert("Please enter a valid Malaysian phone number (9–11 digits)");
      return false;
    }

    // optional: you can also alert if birth date is in the future
    const today = new Date();
    const onlyDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const bdOnly = new Date(
      birthDate.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate()
    );
    if (bdOnly > onlyDate) {
      alert("Birth date cannot be in the future");
      return false;
    }

    // clear any previous banner error
    setErrorMessage("");
    return true;
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  async function uploadImage(uri: string, uid: string) {
    console.log("📤 Starting image upload...");
    console.log("📤 Local URI:", uri);
    console.log("📤 User ID:", uid);

    const blob: any = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        console.log("📤 Blob created, size:", xhr.response?.size);
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        console.error("📤 Failed to create blob:", e);
        reject(new TypeError("Network request failed"));
      };
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });

    const storagePath = "profile_pictures/" + uid;
    console.log("📤 Storage path:", storagePath);
    const storageRef = ref(storage, storagePath);

    console.log("📤 Uploading to Firebase Storage...");
    const uploadResult = await uploadBytes(storageRef, blob);
    console.log("📤 Upload complete:", uploadResult.metadata.fullPath);
    blob.close();

    console.log("📤 Getting download URL...");
    const downloadURL = await getDownloadURL(storageRef);
    console.log("📤 Download URL obtained:", downloadURL);
    console.log("📤 URL length:", downloadURL.length);

    return downloadURL;
  }

  async function register() {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setErrorMessage("");
      console.log("Starting registration...");
      console.log("Auth instance:", auth);
      console.log("Firestore instance:", db);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("✅ User created in Auth:", userCredential.user.uid);

      let photoURL = "";
      if (profileImage) {
        console.log("Uploading profile image...");
        try {
          const uploadedURL = await uploadImage(profileImage, userCredential.user.uid);
          if (uploadedURL && uploadedURL.trim() !== "") {
            photoURL = uploadedURL;
            console.log("✅ Image uploaded, URL:", photoURL);
          } else {
            console.error("⚠️ Image upload returned empty URL");
          }
        } catch (uploadError: any) {
          console.error("⚠️ Image upload failed:", uploadError);
          // Continue registration even if image upload fails
        }
      }

      const userData = {
        displayName: displayName.trim(),
        email: email.trim(),
        gender: gender,
        birthDate: birthDate.toISOString(),
        phoneNumber: `${countryCode}${phoneNumber}`,
        photoURL: photoURL.trim(),
        bio: "",
        createdAt: new Date().toISOString(),
      };

      console.log("Saving user data to Firestore:", userData);

      // Try to save user data to Firestore with retry logic
      let saveAttempts = 0;
      let saveFailed = false;

      while (saveAttempts < 3 && !saveFailed) {
        try {
          await setDoc(doc(db, "users", userCredential.user.uid), userData);
          console.log("✅ User data saved successfully!");
          saveFailed = false;
          break;
        } catch (firestoreError: any) {
          saveAttempts++;
          console.error(`❌ Firestore save attempt ${saveAttempts} failed:`, firestoreError);

          if (saveAttempts >= 3) {
            saveFailed = true;
            console.error("❌ All Firestore save attempts failed");

            // Delete the auth account since we couldn't save user data
            try {
              await userCredential.user.delete();
              console.log("🗑️ Auth account deleted due to Firestore save failure");
            } catch (deleteError) {
              console.error("❌ Failed to delete auth account:", deleteError);
            }

            throw new Error(
              firestoreError.code === 'permission-denied'
                ? "Permission denied: Unable to create user profile. Please check Firestore security rules or contact support."
                : "Failed to save user data after multiple attempts. Please try again or contact support."
            );
          }

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      setLoading(false);
      Alert.alert("Success", "Account created!");
    } catch (error: any) {
      setLoading(false);
      console.error("❌ Registration error:", error);
      console.error("Error code:", error?.code);
      console.error("Error message:", error?.message);

      let errorMessage = "Registration failed. Please try again.";

      // Provide specific error messages based on Firebase error codes
      if (error?.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered. Please login instead.";
      } else if (error?.code === "auth/invalid-email") {
        errorMessage = "Invalid email address format.";
      } else if (error?.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Use at least 6 characters.";
      } else if (error?.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error?.code?.includes("firestore")) {
        errorMessage = "Failed to save user data. Please check Firestore permissions.";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setErrorMessage(errorMessage);
      Alert.alert("Registration Error", errorMessage);
    }
  }

  // -------- Calendar handlers --------
  const onDateSelect = (day: any) => {
    const selectedDate = new Date(day.dateString);
    setBirthDate(selectedDate);
    setYear(selectedDate.getFullYear());
    setMonth(selectedDate.getMonth() + 1);
    setShowCalendar(false);
  };

  const formatDate = (date: Date): string =>
    date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <KeyboardAvoidingView behavior="height" enabled style={{ flex: 1 }}>
      <Layout>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: isDarkmode ? "#17171E" : themeColor.white100,
              paddingVertical: 20,
            }}
          >
            <TouchableOpacity onPress={pickImage}>
              <Image
                resizeMode="cover"
                style={{
                  height: 150,
                  width: 150,
                  borderRadius: 75,
                  borderWidth: 2,
                  borderColor: themeColor.primary,
                }}
                source={
                  profileImage
                    ? { uri: profileImage }
                    : require("../../../assets/images/register.png")
                }
              />
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  backgroundColor: themeColor.primary,
                  borderRadius: 20,
                  padding: 8,
                }}
              >
                <Text style={{ color: "white", fontSize: 12 }}>Edit</Text>
              </View>
            </TouchableOpacity>
            <Text style={{ marginTop: 10, color: "gray" }}>
              Tap to upload profile picture
            </Text>
          </View>

          <View
            style={{
              flex: 3,
              paddingHorizontal: 20,
              paddingBottom: 20,
              backgroundColor: isDarkmode ? themeColor.dark : themeColor.white,
            }}
          >
            <Text
              fontWeight="bold"
              size="h3"
              style={{ alignSelf: "center", padding: 30 }}
            >
              Register
            </Text>

            {errorMessage ? (
              <View
                style={{
                  backgroundColor: "#ffebee",
                  padding: 10,
                  borderRadius: 5,
                  marginBottom: 15,
                }}
              >
                <Text style={{ color: "#c62828" }}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Display Name */}
            <Text>Display Name</Text>
            <TextInput
              containerStyle={{ marginTop: 15 }}
              placeholder="Enter your display name"
              value={displayName}
              autoCapitalize="words"
              autoComplete="off"
              autoCorrect={false}
              onChangeText={setDisplayName}
            />

            {/* Email */}
            <Text style={{ marginTop: 15 }}>Email</Text>
            <TextInput
              containerStyle={{ marginTop: 15 }}
              placeholder="Enter your email"
              value={email}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={setEmail}
            />

            {/* Password */}
            <Text style={{ marginTop: 15 }}>Password</Text>
            <TextInput
              containerStyle={{ marginTop: 15 }}
              placeholder="Enter your password"
              value={password}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              secureTextEntry
              onChangeText={setPassword}
            />

            {/* Confirm Password */}
            <Text style={{ marginTop: 15 }}>Confirm Password</Text>
            <TextInput
              containerStyle={{ marginTop: 15 }}
              placeholder="Confirm your password"
              value={confirmPassword}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              secureTextEntry
              onChangeText={setConfirmPassword}
            />

            {/* Gender */}
            <Text style={{ marginTop: 15 }}>Gender</Text>
            <View style={{ marginTop: 15, zIndex: 3000 }}>
              <DropDownPicker
                open={genderOpen}
                value={gender}
                items={genderItems}
                setOpen={setGenderOpen}
                setValue={setGender}
                setItems={setGenderItems}
                placeholder="Select your gender"
                style={{
                  backgroundColor: isDarkmode
                    ? themeColor.dark200
                    : themeColor.white,
                  borderColor: "#ccc",
                }}
                textStyle={{
                  color: isDarkmode ? themeColor.white : themeColor.dark,
                }}
                dropDownContainerStyle={{
                  backgroundColor: isDarkmode
                    ? themeColor.dark200
                    : themeColor.white,
                  borderColor: "#ccc",
                }}
              />
            </View>

            {/* Birth Date */}
            <Text style={{ marginTop: 15 }}>Birth Date</Text>
            <TouchableOpacity
              onPress={() => setShowCalendar(true)}
              style={{
                marginTop: 15,
                padding: 15,
                borderRadius: 5,
                borderWidth: 1,
                borderColor: "#ccc",
                backgroundColor: isDarkmode ? themeColor.dark200 : "#f5f5f5",
              }}
            >
              <Text>{formatDate(birthDate)}</Text>
            </TouchableOpacity>

            {/* Calendar Modal with Year/Month quick selectors */}
            {showCalendar && (
              <Modal
                visible={showCalendar}
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
                    {/* Quick selectors row */}
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 10,
                        marginBottom: 12,
                        zIndex: 9999,
                      }}
                    >
                      {/* Year */}
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
                            minHeight: 46,
                          }}
                          dropDownContainerStyle={{
                            backgroundColor: isDarkmode
                              ? themeColor.dark200
                              : themeColor.white,
                            borderColor: "#ccc",
                          }}
                        />
                      </View>

                      {/* Month */}
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
                            minHeight: 46,
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

                    {/* Calendar controlled by current (year-month) */}
                    <Calendar
                      current={calendarCurrent}
                      hideArrows={true}
                      onDayPress={onDateSelect}
                      maxDate={new Date().toISOString().split("T")[0]}
                      markedDates={{
                        [birthDate.toISOString().split("T")[0]]: {
                          selected: true,
                          selectedColor: themeColor.primary,
                        },
                      }}
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

            {/* Phone Number */}
            <Text style={{ marginTop: 15 }}>Phone Number</Text>
            <View
              style={{
                flexDirection: "row",
                marginTop: 15,
                gap: 10,
                zIndex: 2000,
              }}
            >
              {/* Country Code */}
              <View style={{ flex: 1, zIndex: 2000 }}>
                <DropDownPicker
                  open={countryCodeOpen}
                  value={countryCode}
                  items={countryCodeItems}
                  setOpen={setCountryCodeOpen}
                  setValue={setCountryCode}
                  setItems={setCountryCodeItems}
                  placeholder="+60"
                  style={{
                    backgroundColor: isDarkmode
                      ? themeColor.dark200
                      : themeColor.white,
                    borderColor: "#ccc",
                    minHeight: 50,
                  }}
                  textStyle={{
                    color: isDarkmode ? themeColor.white : themeColor.dark,
                    fontSize: 14,
                  }}
                  dropDownContainerStyle={{
                    backgroundColor: isDarkmode
                      ? themeColor.dark200
                      : themeColor.white,
                    borderColor: "#ccc",
                  }}
                  listItemLabelStyle={{
                    color: isDarkmode ? themeColor.white : themeColor.dark,
                  }}
                />
              </View>

              {/* Phone */}
              <View style={{ flex: 2 }}>
                <TextInputMask
                  type={"custom"}
                  options={{ mask: "99-9999999" }}
                  placeholder="12-3456789"
                  value={phoneNumber}
                  keyboardType="phone-pad"
                  onChangeText={(text) =>
                    setPhoneNumber(text.replace(/[^0-9]/g, ""))
                  }
                  style={{
                    padding: 15,
                    borderRadius: 5,
                    borderWidth: 1,
                    borderColor: "#ccc",
                    backgroundColor: isDarkmode
                      ? themeColor.dark200
                      : themeColor.white,
                    color: isDarkmode ? themeColor.white : themeColor.dark,
                    height: 50,
                  }}
                />
              </View>
            </View>

            <Button
              text={loading ? "Loading" : "Create an account"}
              onPress={register}
              style={{ marginTop: 20 }}
              disabled={loading}
            />

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 15,
                justifyContent: "center",
              }}
            >
              <Text size="md">Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text size="md" fontWeight="bold" style={{ marginLeft: 5 }}>
                  Login here
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 30,
                justifyContent: "center",
              }}
            >
              <TouchableOpacity
                onPress={() =>
                  isDarkmode ? setTheme("light") : setTheme("dark")
                }
              >
                <Text size="md" fontWeight="bold" style={{ marginLeft: 5 }}>
                  {isDarkmode ? "☀️ light theme" : "🌑 dark theme"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Layout>
    </KeyboardAvoidingView>
  );
}
