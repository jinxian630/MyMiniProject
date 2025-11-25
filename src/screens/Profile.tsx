import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { MainStackParamList } from "../types/navigation";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Layout, Text, TextInput, useTheme, themeColor, Button } from "react-native-rapi-ui";
import { auth, db, storage } from "../config/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

interface UserData {
  displayName: string;
  email: string;
  gender: string;
  birthDate: string;
  phoneNumber: string;
  photoURL: string;
  bio: string;
  createdAt: string;
}

export default function ({
  navigation,
}: NativeStackScreenProps<MainStackParamList, "MainTabs">) {
  const { isDarkmode } = useTheme();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Editable fields
  const [editedDisplayName, setEditedDisplayName] = useState<string>("");
  const [editedBio, setEditedBio] = useState<string>("");
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [displayNameError, setDisplayNameError] = useState<string>("");
  const [bioError, setBioError] = useState<string>("");
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [imageHasChanges, setImageHasChanges] = useState<boolean>(false);
  const [imageSaved, setImageSaved] = useState<boolean>(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    setImageLoadError(false);
  }, [userData?.photoURL]);

  const handleAutoRecovery = async (currentUser: any) => {
    try {
      console.log("🔧 Attempting auto-recovery...");
      console.log("🔧 Creating missing user document for:", currentUser.uid);

      // Create basic user data from auth info
      const basicUserData: UserData = {
        displayName: currentUser.displayName || currentUser.email?.split('@')[0] || "User",
        email: currentUser.email || "",
        gender: "",
        birthDate: "",
        phoneNumber: "",
        photoURL: "",
        bio: "",
        createdAt: new Date().toISOString(),
      };

      // Try to create the document
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, basicUserData);

      console.log("✅ Auto-recovery successful! User document created.");
      Alert.alert(
        "Account Recovered",
        "Your profile was incomplete. We've created a basic profile for you. Please update your information.",
        [{ text: "OK", onPress: () => fetchUserData() }]
      );
    } catch (recoveryError: any) {
      console.error("❌ Auto-recovery failed:", recoveryError);

      if (recoveryError.code === 'permission-denied') {
        setError("Permission denied. Your Firestore security rules need to be updated to allow profile creation. Please contact support.");
      } else {
        setError("User data not found and could not be recovered automatically. Please contact support or re-register.");
      }
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(""); // Clear previous errors

      console.log("👤 Starting to fetch user data...");
      const currentUser = auth.currentUser;
      console.log("👤 Current user:", currentUser ? currentUser.uid : "null");
      console.log("👤 User email:", currentUser?.email);

      if (!currentUser) {
        console.error("❌ No user logged in");
        setError("No user logged in");
        setLoading(false);
        return;
      }

      console.log("📂 Fetching from Firestore...");
      console.log("📂 Collection: users");
      console.log("📂 Document ID:", currentUser.uid);

      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      console.log("📂 Document exists:", userDocSnap.exists());

      if (userDocSnap.exists()) {
        const data = userDocSnap.data() as UserData;
        console.log("✅ User data retrieved successfully!");
        console.log("✅ Full data:", JSON.stringify(data, null, 2));
        console.log("📸 photoURL:", data.photoURL);
        console.log("📸 photoURL length:", data.photoURL?.length);
        console.log("📸 photoURL type:", typeof data.photoURL);

        setUserData(data);
        setEditedDisplayName(data.displayName);
        setEditedBio(data.bio || "");
      } else {
        console.error("❌ User document does not exist in Firestore!");
        console.error("❌ Checked path: users/" + currentUser.uid);
        console.error("❌ This means the user was created in Auth but data wasn't saved to Firestore");

        // Attempt auto-recovery by creating the missing document
        await handleAutoRecovery(currentUser);
      }
    } catch (err: any) {
      console.error("❌ Error fetching user data:");
      console.error("❌ Error message:", err.message);
      console.error("❌ Error code:", err.code);
      console.error("❌ Full error:", JSON.stringify(err, null, 2));

      if (err.code === 'permission-denied') {
        setError("Permission denied. Check Firestore security rules.");
      } else {
        setError(err.message || "Failed to load user data");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const validateDisplayName = (name: string): boolean => {
    setDisplayNameError("");

    const trimmedName = name.trim();

    if (!trimmedName) {
      setDisplayNameError("Display name is required");
      return false;
    }

    if (trimmedName.length < 3) {
      setDisplayNameError("Display name must be at least 3 characters");
      return false;
    }

    if (trimmedName.length > 30) {
      setDisplayNameError("Display name must not exceed 30 characters");
      return false;
    }

    if (!/^[a-zA-Z0-9\s_-]+$/.test(trimmedName)) {
      setDisplayNameError("Only letters, numbers, spaces, hyphens and underscores allowed");
      return false;
    }

    return true;
  };

  const validateBio = (bio: string): boolean => {
    setBioError("");

    const trimmedBio = bio.trim();

    // Bio is optional, so empty is valid
    if (trimmedBio.length === 0) {
      return true;
    }

    if (trimmedBio.length > 200) {
      setBioError("Bio must not exceed 200 characters");
      return false;
    }

    return true;
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          Alert.alert("Error", "Not logged in");
          return;
        }

        console.log("📸 Image selected, showing preview...");
        const imageUri = result.assets[0].uri;

        // Just show preview, don't upload yet
        setSelectedImageUri(imageUri);
        setImageHasChanges(true);
        setImageSaved(false);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleSaveProfilePicture = async () => {
    if (!selectedImageUri) {
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Error", "Not logged in");
      return;
    }

    console.log("📸 Starting profile picture upload...");
    setSaving(true);

    try {
      // Upload to Storage
      console.log("📤 Fetching image blob...");
      const response = await fetch(selectedImageUri);
      const blob = await response.blob();

      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const storageRef = ref(storage, `profile_pictures/${currentUser.uid}_${id}`);

      console.log("📤 Uploading to Storage:", `profile_pictures/${currentUser.uid}_${id}`);
      const snap = await uploadBytes(storageRef, blob);

      console.log("📤 Getting download URL...");
      const url = await getDownloadURL(snap.ref);
      console.log("✅ Upload complete! URL:", url);

      // Save URL to Firestore users/{uid}/photoURL
      console.log("💾 Saving to Firestore users/" + currentUser.uid + "/photoURL");
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, {
        photoURL: url,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      console.log("✅ PhotoURL saved to Firestore!");

      // Update states
      setImageHasChanges(false);
      setImageSaved(true);
      setSelectedImageUri(null);

      // Show success message for 3 seconds
      setTimeout(() => {
        setImageSaved(false);
      }, 3000);

      // Refresh user data to display new photo
      await fetchUserData();

    } catch (uploadError: any) {
      console.error("❌ Upload failed:", uploadError);
      Alert.alert("Error", "Failed to upload: " + uploadError.message);
      setImageSaved(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDisplayNameChange = (text: string) => {
    setEditedDisplayName(text);
    const bioChanged = editedBio.trim() !== (userData?.bio || "");
    const nameChanged = text.trim() !== userData?.displayName;
    setHasChanges(nameChanged || bioChanged);
    validateDisplayName(text);
  };

  const handleBioChange = (text: string) => {
    setEditedBio(text);
    const bioChanged = text.trim() !== (userData?.bio || "");
    const nameChanged = editedDisplayName.trim() !== userData?.displayName;
    setHasChanges(nameChanged || bioChanged);
    validateBio(text);
  };

  const handleSaveChanges = async () => {
    if (!validateDisplayName(editedDisplayName)) {
      return;
    }

    if (!validateBio(editedBio)) {
      return;
    }

    try {
      setSaving(true);
      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert("Error", "No user logged in");
        return;
      }

      console.log("💾 Saving profile changes...");

      // Save display name and bio to Firestore
      await updateDoc(doc(db, "users", currentUser.uid), {
        displayName: editedDisplayName.trim(),
        bio: editedBio.trim(),
        updatedAt: new Date().toISOString(),
      });

      console.log("✅ Profile saved to Firestore!");

      Alert.alert("Success", "Profile updated successfully!");
      setHasChanges(false);

      // Refresh user data from Firestore
      await fetchUserData();
    } catch (error: any) {
      console.error("❌ Error updating profile:", error);
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color={themeColor.primary} />
          <Text style={{ marginTop: 10 }}>Loading profile...</Text>
        </View>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <Ionicons name="warning" size={60} color="red" style={{ marginBottom: 20 }} />
          <Text style={{ color: "red", textAlign: "center", fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
            Error Loading Profile
          </Text>
          <Text style={{ color: isDarkmode ? "#ccc" : "#666", textAlign: "center", marginBottom: 20 }}>
            {error}
          </Text>

          <Button
            text="Retry"
            onPress={fetchUserData}
            style={{ marginBottom: 10, minWidth: 200 }}
          />

          <Text style={{ fontSize: 12, color: isDarkmode ? "#888" : "#999", marginTop: 20, textAlign: "center" }}>
            Check the console logs for detailed error information
          </Text>

          {auth.currentUser && (
            <View style={{ marginTop: 20, padding: 15, backgroundColor: isDarkmode ? "#2a2a2a" : "#f5f5f5", borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: isDarkmode ? "#ccc" : "#666", marginBottom: 5 }}>
                Debug Info:
              </Text>
              <Text style={{ fontSize: 11, color: isDarkmode ? "#aaa" : "#888" }}>
                User ID: {auth.currentUser.uid}
              </Text>
              <Text style={{ fontSize: 11, color: isDarkmode ? "#aaa" : "#888" }}>
                Email: {auth.currentUser.email}
              </Text>
            </View>
          )}
        </View>
      </Layout>
    );
  }

  // Display preview if available, otherwise show saved photo from Firestore
  const displayPhotoUrl = selectedImageUri || (userData?.photoURL && userData.photoURL.trim() !== "" ? userData.photoURL : null);

  console.log("📸 Profile render - displayPhotoUrl:", displayPhotoUrl);
  console.log("📸 selectedImageUri:", selectedImageUri);
  console.log("📸 imageLoadError:", imageLoadError);

  return (
    <Layout>
      <ScrollView>
        {/* Profile Header */}
        <View
          style={{
            alignItems: "center",
            paddingVertical: 40,
            backgroundColor: isDarkmode ? "#17171E" : themeColor.white100,
          }}
        >
          <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
            <View>
              <Image
                key={displayPhotoUrl || 'default'}
                source={
                  displayPhotoUrl && displayPhotoUrl.trim() !== "" && !imageLoadError
                    ? { uri: displayPhotoUrl }
                    : require("../../assets/images/register.png")
                }
                style={{
                  width: 130,
                  height: 130,
                  borderRadius: 65,
                  borderWidth: 4,
                  borderColor: themeColor.primary,
                }}
                onLoad={(e) => {
                  console.log("✅ Profile image loaded successfully");
                  console.log("✅ Image dimensions:", e.nativeEvent.source);
                }}
                onError={(error) => {
                  console.error("❌ Error loading profile image");
                  console.error("❌ Error details:", JSON.stringify(error.nativeEvent));
                  console.error("❌ Failed URL:", displayPhotoUrl);
                  setImageLoadError(true);
                }}
              />
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  backgroundColor: themeColor.primary,
                  borderRadius: 22,
                  width: 44,
                  height: 44,
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 3,
                  borderColor: isDarkmode ? "#17171E" : themeColor.white100,
                }}
              >
                <Ionicons name="camera" size={20} color="white" />
              </View>
            </View>
          </TouchableOpacity>
          <Text
            style={{
              marginTop: 10,
              color: isDarkmode ? "#aaa" : "#666",
              fontSize: 12,
            }}
          >
            Tap to change photo
          </Text>

          {/* Save Changes Button for Profile Picture */}
          {imageHasChanges && (
            <Button
              text={saving ? "Saving..." : "Save Changes"}
              onPress={handleSaveProfilePicture}
              disabled={saving}
              status="success"
              style={{ marginTop: 15, minWidth: 200 }}
            />
          )}

          {/* Success Message */}
          {imageSaved && (
            <View
              style={{
                marginTop: 10,
                paddingHorizontal: 15,
                paddingVertical: 8,
                backgroundColor: "#4CAF50",
                borderRadius: 5,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons name="checkmark-circle" size={16} color="white" style={{ marginRight: 5 }} />
              <Text style={{ fontSize: 12, color: "white", fontWeight: "bold" }}>
                Profile picture saved successfully!
              </Text>
            </View>
          )}

        </View>

        {/* Editable Display Name Section */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 20,
            backgroundColor: isDarkmode ? themeColor.dark : themeColor.white,
          }}
        >
          <View
            style={{
              backgroundColor: isDarkmode ? themeColor.dark200 : themeColor.white,
              borderRadius: 10,
              padding: 15,
              marginBottom: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Ionicons
                name="person"
                size={20}
                color={themeColor.primary}
                style={{ marginRight: 10 }}
              />
              <Text style={{ color: isDarkmode ? "#aaa" : "#666", fontSize: 12 }}>
                Display Name (Editable)
              </Text>
            </View>
            <TextInput
              value={editedDisplayName}
              onChangeText={handleDisplayNameChange}
              placeholder="Enter your display name"
              containerStyle={{ marginTop: 0 }}
              style={{
                fontSize: 16,
                color: isDarkmode ? themeColor.white : themeColor.dark,
              }}
            />
            {displayNameError ? (
              <Text style={{ color: "red", fontSize: 12, marginTop: 5 }}>
                {displayNameError}
              </Text>
            ) : null}
          </View>

          {/* Editable Bio Section */}
          <View
            style={{
              backgroundColor: isDarkmode ? themeColor.dark200 : themeColor.white,
              borderRadius: 10,
              padding: 15,
              marginBottom: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Ionicons
                name="document-text"
                size={20}
                color={themeColor.primary}
                style={{ marginRight: 10 }}
              />
              <Text style={{ color: isDarkmode ? "#aaa" : "#666", fontSize: 12 }}>
                Bio (Editable)
              </Text>
            </View>
            <TextInput
              value={editedBio}
              onChangeText={handleBioChange}
              placeholder="Tell us about yourself..."
              containerStyle={{ marginTop: 0 }}
              multiline
              numberOfLines={4}
              style={{
                fontSize: 16,
                color: isDarkmode ? themeColor.white : themeColor.dark,
                minHeight: 80,
                textAlignVertical: "top",
              }}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 5 }}>
              {bioError ? (
                <Text style={{ color: "red", fontSize: 12 }}>
                  {bioError}
                </Text>
              ) : (
                <Text style={{ color: isDarkmode ? "#666" : "#999", fontSize: 12 }}>
                  {editedBio.length}/200 characters
                </Text>
              )}
            </View>
          </View>

          {/* Save Button */}
          {hasChanges && (
            <Button
              text={saving ? "Saving..." : "Save Changes"}
              onPress={handleSaveChanges}
              disabled={saving || !!displayNameError || !!bioError}
              status={saving ? "info" : "success"}
              style={{ marginBottom: 20 }}
            />
          )}

          {/* Personal Information Card */}
          <View
            style={{
              backgroundColor: isDarkmode ? themeColor.dark200 : themeColor.white,
              borderRadius: 10,
              padding: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text
              fontWeight="bold"
              size="h4"
              style={{ marginBottom: 20, color: themeColor.primary }}
            >
              Personal Information
            </Text>

            {/* Email */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
                <Ionicons
                  name="mail"
                  size={18}
                  color={isDarkmode ? "#aaa" : "#666"}
                  style={{ marginRight: 8 }}
                />
                <Text style={{ color: isDarkmode ? "#aaa" : "#666", fontSize: 12 }}>
                  Email
                </Text>
              </View>
              <Text style={{ fontSize: 16, marginLeft: 26 }}>
                {userData?.email}
              </Text>
            </View>

            {/* Phone Number */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
                <Ionicons
                  name="call"
                  size={18}
                  color={isDarkmode ? "#aaa" : "#666"}
                  style={{ marginRight: 8 }}
                />
                <Text style={{ color: isDarkmode ? "#aaa" : "#666", fontSize: 12 }}>
                  Phone Number
                </Text>
              </View>
              <Text style={{ fontSize: 16, marginLeft: 26 }}>
                {userData?.phoneNumber}
              </Text>
            </View>

            {/* Gender */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
                <Ionicons
                  name={userData?.gender === "Male" ? "male" : "female"}
                  size={18}
                  color={isDarkmode ? "#aaa" : "#666"}
                  style={{ marginRight: 8 }}
                />
                <Text style={{ color: isDarkmode ? "#aaa" : "#666", fontSize: 12 }}>
                  Gender
                </Text>
              </View>
              <Text style={{ fontSize: 16, marginLeft: 26 }}>
                {userData?.gender}
              </Text>
            </View>

            {/* Birth Date */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
                <Ionicons
                  name="calendar"
                  size={18}
                  color={isDarkmode ? "#aaa" : "#666"}
                  style={{ marginRight: 8 }}
                />
                <Text style={{ color: isDarkmode ? "#aaa" : "#666", fontSize: 12 }}>
                  Birth Date
                </Text>
              </View>
              <Text style={{ fontSize: 16, marginLeft: 26 }}>
                {userData?.birthDate ? formatDate(userData.birthDate) : "N/A"}
              </Text>
            </View>

            {/* Member Since */}
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
                <Ionicons
                  name="time"
                  size={18}
                  color={isDarkmode ? "#aaa" : "#666"}
                  style={{ marginRight: 8 }}
                />
                <Text style={{ color: isDarkmode ? "#aaa" : "#666", fontSize: 12 }}>
                  Member Since
                </Text>
              </View>
              <Text style={{ fontSize: 16, marginLeft: 26 }}>
                {userData?.createdAt ? formatDate(userData.createdAt) : "N/A"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </Layout>
  );
}
