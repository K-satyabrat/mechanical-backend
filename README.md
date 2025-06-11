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
- **API Documentation**: Available at `/api` endpoints
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
npm start
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
├── routers/
│   ├── userRouter.js
│   ├── productRouter.js
│   ├── cartRouter.js
│   ├── orderRouter.js
│   └── ... (other routers)
├── utils/
│   ├── socketHandler.js
│   └── cleanup.js
├── .env
├── index.js
└── package.json
```





