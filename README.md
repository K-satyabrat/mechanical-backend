# Mechanical Project Backend

A robust backend application built with Express.js for a mechanical parts/products e-commerce platform. This application provides a complete API solution for both user and admin interfaces.

## Features

- **User Management**
  - User registration and authentication
  - User profile management
  - Admin user management

- **Product Management**
  - Product CRUD operations
  - Product reviews and ratings
  - Product categorization

- **Shopping Features**
  - Shopping cart functionality
  - Order management
  - Payment processing

- **Referral System**
  - Refer and earn program
  - Referral points management
  - Referral redemption

- **Content Management**
  - Banner management
  - About Us section
  - Privacy Policy
  - Terms and Conditions
  - Refer and Earn Policy

- **Real-time Features**
  - WebSocket integration for real-time notifications
  - Admin notifications
  - User notifications

## Tech Stack

- **Backend Framework**: Express.js
- **Database**: MongoDB
- **Real-time Communication**: Socket.IO
- **Environment Variables**: Using dotenv

## Prerequisites

- Node.js (v12 or higher)
- MongoDB
- npm or yarn package manager

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory and add the following variables:
```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
# Add other environment variables as needed
```

3. Start the server:
```bash
npm run dev
```

The server will start running on `http://localhost:8000` (or the port specified in your .env file)

## API Endpoints

### User Routes
- `/api/user` - User authentication and management
- `/api/user/products` - Product browsing and details
- `/api/user/productReview` - Product reviews
- `/api/user/cart` - Shopping cart operations
- `/api/user/orders` - Order management
- `/api/user/notification` - User notifications
- `/api/user/referAndEarn` - Referral program

### Admin Routes
- `/api/admin` - Admin authentication and management
- `/api/admin/users` - User management
- `/api/admin/products` - Product management
- `/api/admin/orders` - Order management
- `/api/admin/notification` - Admin notifications
- `/api/admin/referAndEarn` - Referral program management

## Project Structure

```
├── config/
│   └── mongodbConnection.js
├── constants/
│   └── (constant files)
├── controllers/
│   ├── userController.js
│   ├── adminController.js
│   ├── productController.js
│   ├── cartController.js
│   ├── orderController.js
│   ├── paymentController.js
│   ├── notificationController.js
│   ├── referralController.js
│   ├── bannerController.js
│   ├── aboutUsController.js
│   ├── privacyAndPolicyController.js
│   ├── termsAndConditionsControllers.js
│   ├── referAndEarnPolicyController.js
│   └── adminNotfnController.js
├── models/
│   ├── userModel.js
│   ├── adminModel.js
│   ├── productModel.js
│   ├── cartModel.js
│   ├── orderModel.js
│   ├── paymentModel.js
│   ├── notificationModel.js
│   ├── referralModel.js
│   ├── bannerModel.js
│   ├── aboutUsModel.js
│   ├── privacyAndPolicyModel.js
│   ├── termsAndConditionsModel.js
│   ├── referAndEarnPolicyModel.js
│   ├── adminNotificationModel.js
│   ├── kycModel.js
│   └── dummyOrder.js
├── routers/
│   ├── userRouter.js
│   ├── adminRouter.js
│   ├── productRouter.js
│   ├── cartRouter.js
│   ├── orderRouter.js
│   ├── paymentRouter.js
│   ├── notificationRouter.js
│   ├── referralRouter.js
│   ├── bannerRouter.js
│   ├── aboutUsRouter.js
│   ├── privacyAndPolicyRouter.js
│   ├── termsAndConditionsRouter.js
│   ├── referAndEarnPolicyRouter.js
│   └── adminNotfnRouter.js
├── utils/
│   ├── socketHandler.js
│   └── cleanup.js
├── .env
├── .gitignore
├── index.js
├── package.json
└── package-lock.json
```





