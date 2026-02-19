# Student Profile Picture Management Feature - Complete Plan

## 📋 Overview

Add student profile picture functionality to the admission system with the following capabilities:

1. Upload image during admission (already exists)
2. Student can change picture from student portal
3. Admin can set change limit in configuration
4. Image displays on admission slip instead of Student ID watermark
5. Emoji fallback if no image exists

---

## 📊 System Architecture

### Current State Analysis

- **Photo Field**: Student model already has `photo` field (string for image path)
- **Image Upload**: Already existing during admission process
- **Slip Generation**: AdmissionSlip component shows student info + payment details
- **Config System**: Configuration model exists for academy settings

---

## 🗂️ Implementation Plan

### PHASE 1: Database Schema Enhancement

#### 1.1 Student Model Updates

**File**: `backend/models/Student.js`

**Add these fields**:

```javascript
// Photo Management
profilePictureUrl: {
  type: String,
  trim: true,
  default: null
},
profilePictureChangeCount: {
  type: Number,
  default: 0,
  min: 0
},
profilePictureChangeLog: [
  {
    changedAt: {
      type: Date,
      default: Date.now
    },
    oldPhotoUrl: String,
    newPhotoUrl: String,
    changedBy: {
      type: String,
      enum: ["student", "admin"],
      default: "student"
    }
  }
]
```

**Why**:

- `profilePictureUrl`: Stores the actual image path (can reuse existing `photo` field)
- `profilePictureChangeCount`: Tracks how many times student changed picture
- `profilePictureChangeLog`: Audit trail of all changes (for admin transparency)

---

#### 1.2 Configuration Model Updates

**File**: `backend/models/Configuration.js`

**Add new settings object**:

```javascript
studentProfilePictureSettings: {
  maxChangesPerStudent: {
    type: Number,
    default: 3,
    min: 0,
    max: 999
  },
  allowStudentPictureChanges: {
    type: Boolean,
    default: true
  },
  pictureDisplayOnSlip: {
    type: Boolean,
    default: true
  },
  fallbackEmoji: {
    type: String,
    default: "👤" // Person emoji as fallback
  },
  maxFileSizeMB: {
    type: Number,
    default: 5
  },
  allowedFormats: {
    type: [String],
    default: ["jpg", "jpeg", "png", "webp"]
  }
}
```

**Why**: Admin can control all aspects of student picture management from one place

---

### PHASE 2: API Endpoints (Backend)

#### 2.1 Upload Student Profile Picture

**Route**: `POST /api/student-portal/profile-picture`  
**Controller**: `studentPortalController.js`  
**Auth**: Protected (Student)

**Request**:

- Multipart form data with image file
- Request body: `{ allowOverwrite: boolean }`

**Validation**:

- File size check (default 5MB)
- File format validation (jpg, jpeg, png, webp)
- Check change count against config limit
- Student must be authenticated

**Response**:

```javascript
{
  success: true,
  message: "Profile picture updated successfully",
  data: {
    photoUrl: "uploads/students/260008_profile_1708284000.jpg",
    changesRemaining: 2,
    lastChangeDate: "2026-02-18T14:30:00Z",
    changeLog: [...]
  }
}
```

**Process**:

1. Validate file
2. Check if student has changes remaining
3. If photo exists, save old URL in changeLog
4. Upload new image to `uploads/students/` directory
5. Update document with new `profilePictureUrl` and increment `profilePictureChangeCount`
6. Add entry to `profilePictureChangeLog`
7. Delete old image file from disk (optional - keep backup)

---

#### 2.2 Get Student Picture Change Info

**Route**: `GET /api/student-portal/profile-picture/status`  
**Controller**: `studentPortalController.js`  
**Auth**: Protected (Student)

**Response**:

```javascript
{
  success: true,
  data: {
    currentPhotoUrl: "uploads/students/260008_profile_1708284000.jpg",
    changesUsed: 1,
    changesRemaining: 2,
    maxChangesAllowed: 3,
    lastChangeDate: "2026-02-18T14:30:00Z",
    canChangeNow: true
  }
}
```

---

#### 2.3 Update Configuration (Admin Only)

**Route**: `PUT /api/configuration/student-picture-settings`  
**Controller**: `configController.js`  
**Auth**: Protected (Admin - Owner role)

**Request Body**:

```javascript
{
  maxChangesPerStudent: 5,
  allowStudentPictureChanges: true,
  pictureDisplayOnSlip: true,
  fallbackEmoji: "🎓",
  maxFileSizeMB: 10
}
```

---

### PHASE 3: Frontend Components

#### 3.1 Student Portal - Profile Picture Section

**File**: `frontend/src/pages/StudentPortal.tsx` or new page

**Features**:

- Display current profile picture
- Show changes remaining counter
- Upload button to change picture
- Show last change date
- Disable button if no changes remaining
- Show countdown timer if there's a time-based limit (optional for future)

**UI Components**:

```typescript
- ImageUploadField (reusable)
- CircularProgressIndicator (for changes used)
- LastChangeInfo (display last update)
- UploadStatus (loading, success, error)
```

---

#### 3.2 Configuration Page - Picture Settings Card

**File**: `frontend/src/pages/Configuration.tsx`

**New Card**: "Student Profile Picture Settings"

**Form Fields**:

- Toggle: Allow students to change picture
- Input: Max changes per student (0 = unlimited)
- Toggle: Display picture on slip
- Dropdown: Fallback emoji selector
- Input: Max file size in MB
- Multi-checkbox: Allowed formats

**Position**: Add after "Master Subjects" section

---

#### 3.3 Admission Slip Component - Image Integration

**File**: `frontend/src/components/admissions/AdmissionSlip.tsx`

**Modifications**:

Replace the watermarked Student ID section with a profile picture area:

Current:

```
"Student ID"
"260008"
(redundant - ID already at top)
```

New:

```
[Profile Photo Area]
- If photo exists: Show circular image
- If no photo: Show fallback emoji (from config)
- Dimensions: ~150x150px
- Style: Circular with subtle border
```

---

### PHASE 4: Image Storage & Management

#### 4.1 File Upload Handling

**middleware**: `backend/middleware/upload.js` (enhance existing)

**Enhancements**:

- Add specific field for student profile pictures
- Validate MIME types
- Generate unique filenames: `{studentId}_profile_{timestamp}.{ext}`
- Store in `/backend/uploads/students/profile/` directory
- Return relative URL path for database storage

**Example**:

```javascript
// Original
uploads/students/260008_profile_1708284000.jpg

// On display (frontend)
http://localhost:8080/uploads/students/profile/260008_profile_1708284000.jpg
```

---

#### 4.2 Cleanup & Versioning

**When student changes picture**:

1. Keep old image for 30 days (configurable)
2. Tag old images with date suffix
3. Auto-delete older than 30 days
4. Or keep last 3 versions (configurable)

**Storage Path Structure**:

```
/uploads/
  /students/
    /admission/     (current - existing)
    /profile/       (new - for student portal updates)
      260008_profile_1708284000.jpg
      260008_profile_1708285000.jpg (old - marked for deletion)
```

---

### PHASE 5: Business Logic Details

#### 5.1 Change Counter Logic

```
- Counter increments when student successfully uploads image
- Only counts successful uploads, not failed attempts
- Admin can reset counter from configuration (admin action)
- When limit reached (e.g., 3), button disabled with message
```

#### 5.2 Display Logic in Slip

```
IF pictureDisplayOnSlip is enabled in config:
  IF student.profilePictureUrl exists:
    Display circular image
  ELSE:
    Display fallbackEmoji (from config)
ELSE:
  Display original Student ID watermark
```

#### 5.3 Audit Trail

```
Every picture change logged:
- Who changed it (student/admin)
- When it happened
- Old photo URL
- New photo URL
- Allows admin to track changes
```

---

## 🎯 Implementation Checklist

### Backend

- [ ] Update Student model with new fields
- [ ] Update Configuration model with picture settings
- [ ] Create upload endpoint for profile picture (`POST /student-portal/profile-picture`)
- [ ] Create status endpoint (`GET /student-portal/profile-picture/status`)
- [ ] Update getStudentProfile to include picture change count
- [ ] Enhance upload middleware for profile pictures
- [ ] Add image cleanup cron job (optional)
- [ ] Update configuration update endpoint to handle picture settings

### Frontend

- [ ] Add Student Profile Picture section to StudentPortal page
- [ ] Create ImageUploadField component
- [ ] Create ProfilePictureStatus component
- [ ] Update Configuration page with picture settings card
- [ ] Modify AdmissionSlip to display image instead of watermarked ID
- [ ] Add emoji picker for fallback selection
- [ ] Handle loading, success, and error states

### Integration

- [ ] Test upload with various file sizes
- [ ] Test change counter reset
- [ ] Test image display on slip
- [ ] Test emoji fallback
- [ ] Test configuration updates apply immediately
- [ ] Test access control (students can only change own photo)

---

## 🔒 Security Considerations

1. **File Upload**:
   - Validate MIME types server-side
   - Rename files (don't trust original names)
   - Store outside root directory
   - Implement file size limits

2. **Access Control**:
   - Only authenticated students can change own picture
   - Admin can view change history
   - Only admin can modify config settings

3. **Data Integrity**:
   - Keep change log for audit
   - Don't allow mass deletion of pictures
   - Backup old photos before deletion

---

## 📱 User Experience Flow

### Student's Perspective

```
1. Student logs into portal
2. Clicks on "Profile" or "Settings"
3. Sees current profile picture + "2 changes remaining"
4. Clicks "Change Picture" button
5. Selects image file
6. Image uploaded and displayed immediately
7. Counter updates to "1 change remaining"
8. Student receives admission slip - new image appears
```

### Admin's Perspective

```
1. Admin goes to Configuration
2. Opens "Student Profile Picture Settings" card
3. Sets "Max changes per student" to 5
4. Sets fallback emoji to "🎓"
5. Disables student picture changes (if needed)
6. Saves changes - immediately effective system-wide
```

---

## 🎨 Emoji Suggestions for Fallback

- 👤 Person (default)
- 🎓 Student/Graduation cap
- 👨‍🎓 Man student
- 👩‍🎓 Woman student
- 📸 Camera (placeholder)
- ✨ Star (generic)

---

## ⏱️ Estimated Timeline

- **Backend API**: 2-3 hours
- **Database Schema**: 30 minutes
- **Frontend Components**: 3-4 hours
- **Integration & Testing**: 2-3 hours
- **Total**: ~8-10 hours for complete feature

---

## 🚀 Deployment Checklist

- [ ] Database migration for new Student fields
- [ ] Database migration for Configuration fields
- [ ] Create uploads directory structure
- [ ] Test in staging environment
- [ ] Performance testing with multiple images
- [ ] User documentation
- [ ] Permission checks verified
- [ ] Error handling comprehensive
