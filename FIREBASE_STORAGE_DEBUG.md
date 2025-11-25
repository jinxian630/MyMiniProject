# Firebase Storage Profile Picture Debug Guide

## Issue
Profile pictures uploaded during registration are not displaying on the profile page.

## Changes Made

### 1. Added Comprehensive Logging
- **Register.tsx**: Logs every step of the image upload process
- **Profile.tsx**: Logs when fetching and displaying profile photos

### 2. Improved Error Handling
- Added `onLoadStart`, `onLoad`, and `onError` handlers to Image component
- Added loading indicator while image is being fetched
- Removed cache-busting logic that might interfere with Firebase Storage URLs

## How to Debug

### Step 1: Check Console Logs During Registration

When a user registers with a photo, look for these logs in the console:

```
📤 Starting image upload...
📤 Local URI: [local file path]
📤 User ID: [firebase uid]
📤 Blob created, size: [number]
📤 Storage path: profile_pictures/[uid]
📤 Uploading to Firebase Storage...
📤 Upload complete: profile_pictures/[uid]
📤 Getting download URL...
📤 Download URL obtained: https://firebasestorage.googleapis.com/...
📤 URL length: [number > 0]
✅ User created in Auth: [uid]
✅ Image uploaded, URL: [full URL]
✅ User data saved successfully!
```

**If you see errors here, the upload is failing.**

### Step 2: Check Console Logs When Viewing Profile

When viewing the profile page, look for these logs:

```
📸 Fetched user data - photoURL: https://firebasestorage.googleapis.com/...
📸 photoURL length: [number > 0]
📸 photoURL starts with: https://firebasestorage.googleapis.com/v0/b/...
📸 Profile render - currentPhotoUrl: https://firebasestorage.googleapis.com/...
🔄 Starting to load image...
✅ Profile image loaded successfully
```

**If you see `❌ Error loading profile image`, there's an issue with the URL or permissions.**

### Step 3: Verify Firebase Storage Security Rules

Go to Firebase Console > Storage > Rules and ensure you have:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Allow public read access to profile pictures
    match /profile_pictures/{userId} {
      allow read: if true;  // Anyone can read profile pictures
      allow write: if request.auth != null && request.auth.uid == userId;  // Only owner can write
    }
  }
}
```

**Important**: Make sure to click "Publish" after updating rules!

### Step 4: Check Firestore Data

1. Go to Firebase Console > Firestore Database
2. Open the `users` collection
3. Find the user document
4. Check the `photoURL` field:
   - ✅ Should be: `https://firebasestorage.googleapis.com/v0/b/myminiprojectwpv-c6b94.firebasestorage.app/o/profile_pictures%2F[uid]?alt=media&token=[token]`
   - ❌ Should NOT be: empty string `""` or missing

### Step 5: Manual URL Test

1. Copy the `photoURL` value from Firestore
2. Paste it in a web browser
3. If it downloads/displays the image, Firebase Storage is working correctly
4. If you get an error, check your Firebase Storage rules

## Common Issues and Solutions

### Issue 1: photoURL is empty in Firestore
**Cause**: Image upload failed during registration
**Solution**: Check console logs during registration for upload errors

### Issue 2: photoURL exists but image doesn't load
**Cause**: Firebase Storage security rules are too restrictive
**Solution**: Update Storage rules to allow public read access (see Step 3)

### Issue 3: "Network request failed" during upload
**Cause**: Internet connection or Firebase configuration issue
**Solution**:
- Check internet connection
- Verify Firebase config in `src/config/firebase.ts`
- Ensure Storage is enabled in Firebase Console

### Issue 4: Image shows briefly then disappears
**Cause**: Authentication token in URL might be expired or invalid
**Solution**: Re-upload the image from the profile page

### Issue 5: CORS errors in console
**Cause**: Firebase Storage CORS configuration
**Solution**: This is usually handled automatically by Firebase, but if needed:
```bash
gsutil cors set cors.json gs://myminiprojectwpv-c6b94.firebasestorage.app
```

## Testing Checklist

- [ ] Console shows successful upload during registration
- [ ] Firestore has valid photoURL (not empty)
- [ ] Firebase Storage rules allow read access
- [ ] Console shows image loading successfully on profile page
- [ ] Manual URL test in browser works
- [ ] Image displays in the app

## Next Steps

1. Run the app and register a new user with a profile picture
2. Watch the console logs carefully
3. Share the console output with the developer if issues persist
4. Check Firebase Console for Storage rules and Firestore data
