# Hostel Leave Management System - Project Summary

## 📋 Project Overview

The **Hostel Leave Management System** is a full-stack web application designed to streamline the process of managing student leave requests in a hostel environment. The system provides separate interfaces for students and wardens, enabling efficient leave request submission, approval, and tracking.

## 🎯 Key Features

### Student Portal
- **User Authentication**: Secure login system for students
- **Profile Display**: View student details including:
  - Name, Department, Roll Number, Registration Number
  - Room Number, Contact Information
- **Leave Request Creation**: Submit leave requests with:
  - Interactive calendar date picker for From/To dates
  - Reason field with inappropriate content filtering
  - Automatic student information pre-filling
- **Request Tracking**: View all submitted leave requests with status updates
- **QR Code Generation**: Generate and display QR codes for approved leave requests
- **Request History**: View past and current leave applications

### Warden Portal
- **User Authentication**: Secure login system for wardens
- **Dashboard Overview**: Comprehensive statistics including:
  - Total students on leave
  - Department-wise breakdown
  - Monthly leave requests visualization (bar chart)
- **Leave Request Management**:
  - View all pending leave requests
  - Approve or reject leave applications
  - Mark students as returned
  - Revoke decisions if needed
- **Student Information Display**: Complete student details including:
  - Room Number, Contact Information
  - Department, Roll Number, Registration Number
- **Returned Students History**: Track all students who have returned from leave

## 🛠️ Technology Stack

### Frontend
- **React 18.2.0** - UI framework
- **Vite 5.1.0** - Build tool and dev server
- **React Router DOM 6.22.1** - Client-side routing
- **Bootstrap 5.3.2** - CSS framework for responsive design
- **React DatePicker 8.7.0** - Interactive calendar for date selection
- **date-fns 4.1.0** - Date manipulation utilities
- **QRCode.react 3.2.0** - QR code generation for approved leaves
- **Custom CSS** - Professional styling with gradients and animations

### Backend
- **Node.js** - Runtime environment
- **Express 4.19.2** - Web framework
- **MongoDB** - Database (via Mongoose 8.5.2)
- **bcrypt 5.1.1** - Password hashing
- **CORS 2.8.5** - Cross-origin resource sharing
- **dotenv 16.4.5** - Environment variable management

### Database Schema
- **Students Collection**:
  - username, password_hash
  - full_name, roll_number, register_number
  - department, room_number, contact
- **Wardens Collection**:
  - username, password_hash

## 📁 Project Structure

```
hostel-leave-management/
├── src/
│   ├── components/
│   │   ├── StudentLogin.jsx       # Student authentication
│   │   ├── StudentDashboard.jsx   # Student main interface
│   │   ├── WardenLogin.jsx        # Warden authentication
│   │   ├── WardenDashboard.jsx    # Warden main interface
│   │   └── LeaveForm.jsx          # Leave request form
│   ├── assets/                    # Images (logo, gate images)
│   ├── App.jsx                    # Main app component with routing
│   ├── App.css                    # Main styling
│   └── main.jsx                   # Entry point
├── server/
│   └── src/
│       ├── index.js               # Express server & API routes
│       └── seed.js                # Database seeding script
└── public/                        # Static assets
```

## 🔑 Key Functionality

### Authentication & Authorization
- Role-based access control (Student/Warden)
- Secure password handling with bcrypt
- Session management via localStorage

### Leave Request Workflow
1. **Student submits leave request** → Status: Pending
2. **Warden reviews request** → Approve/Reject
3. **If approved** → Student can generate QR code
4. **After return** → Warden marks student as returned

### Data Storage
- **LocalStorage**: Used for leave applications (per-student namespace)
- **MongoDB**: Stores student and warden profiles
- **API Integration**: RESTful endpoints for profile data

### UI/UX Enhancements
- Professional gradient designs
- Smooth animations and transitions
- Responsive layout for mobile and desktop
- Interactive calendar picker for dates
- Real-time status updates
- Visual data representation (charts, badges)

## 📊 Recent Enhancements

### Date Selection
- ✅ Replaced native date inputs with React DatePicker
- ✅ Cross-browser calendar support
- ✅ Date range validation (To date must be after From date)

### Student Information
- ✅ Added Room Number and Contact fields
- ✅ Auto-populated from database
- ✅ Displayed in both Student and Warden dashboards
- ✅ Included in leave request details

### Dashboard Improvements
- ✅ Monthly leave statistics based on leave date ranges
- ✅ Department-wise breakdown
- ✅ Visual bar chart for monthly data
- ✅ Returned students history modal

### User Experience
- ✅ Removed unnecessary loading indicators
- ✅ Improved spacing and visual hierarchy
- ✅ Professional color scheme and styling
- ✅ Inappropriate content filtering for leave reasons

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB instance
- npm or yarn

### Installation
1. **Frontend Setup**:
   ```bash
   cd hostel-leave-management
   npm install
   npm run dev
   ```

2. **Backend Setup**:
   ```bash
   cd server
   npm install
   # Configure .env with MONGO_URI
   npm run seed  # Seed database with sample data
   npm start
   ```

### Environment Variables
Create `.env` or `env.local` in server directory:
```
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

## 📝 API Endpoints

- `GET /api/health` - Health check
- `POST /api/login` - User authentication
- `GET /api/students/:username` - Get student profile
- `GET /api/wardens/:username` - Get warden profile

## 🎨 Design Highlights

- Modern, clean interface with gradient accents
- Consistent color scheme (blues, purples, greens)
- Card-based layouts for better information organization
- Responsive design for all screen sizes
- Accessibility considerations (focus states, ARIA labels)

## 🔒 Security Features

- Password hashing with bcrypt
- Input validation and sanitization
- Inappropriate content filtering
- Role-based access control
- Secure session management

## 📈 Future Enhancements (Potential)

- Email notifications for status updates
- Export leave reports to PDF/Excel
- Advanced search and filtering
- Multi-language support
- Mobile app version
- Real-time notifications
- Leave request analytics dashboard

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: Production Ready

