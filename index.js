const express = require('express');
const cors = require('cors');
const mongoDbConnection = require('./config/mongodbConnection');
const { userProductRouter, adminProductRouter } = require('./routers/productRouter');
const productReviewRouter = require('./routers/productReviewRouter');
const { userRouter, adminUserRouter } = require('./routers/userRouter');
const adminRouter = require('./routers/adminRouter');
const { userAboutUsRouter, adminAboutUsRouter } = require('./routers/aboutUsRouter');
const http = require("http");
const { socketHandler } = require('./utils/socketHandler');
const { userNotificationRouter, adminNotificationRouter } = require('./routers/notificationRouter');
const { adminBannerRouter, userBannerRouter } = require('./routers/bannerRouter');
const { adminPrivacyPolicyRouter, userPrivacyPolicyRouter ,} = require('./routers/privacyAndPolicyRouter');
const cartRouter = require('./routers/cartRouter');
const { userTermsAndConditionsRouter, adminTermsAndConditionsRouter } = require('./routers/termsAndConditionsRouter');
const { userReferAndEarnPolicyRouter, adminReferAndEarnPolicyRouter } = require('./routers/referAndEarnPolicyRouter');
 
const { adminRedeemedRouter, referralRouter } = require('./routers/referralRouter');
const paymentRouter = require('./routers/paymentRouter');
const { adminOrderRouter, userOrderRouter } = require('./routers/orderRouter');
const refferalPointsRouter = require('./routers/refferalRouter');
const { adminNotificationsRouter } = require('./routers/adminNotfnRouter');
 
require('dotenv').config();
require("./utils/cleanup")

const app = express();

const server = http.createServer(app);
const io =require("socket.io")(server,{
  cors:{
    origin: '*', optionsSuccessStatus: 200
  }
});
socketHandler(io)

app.use(cors({ origin: '*', optionsSuccessStatus: 200 }));


app.use(express.json());
app.use(express.urlencoded({extended: true}));
mongoDbConnection();
 
app.get('/', (req,res)=>{
    res.send(`
    <html>
      <head><title>Mechanical-App Project BE</title></head>
      <body>
        <h1>Welcome to Mechanical-App Project</h1>
      </body>
    </html>
  `);
})
app.use('/api/user',userRouter);
app.use('/api/user/products',userProductRouter);
app.use('/api/user/productReview',productReviewRouter);
app.use('/api/user/aboutUs',userAboutUsRouter);
app.use('/api/user/notification',userNotificationRouter)
app.use('/api/user/banner',userBannerRouter); 
app.use('/api/user/privacyAndPolicy', userPrivacyPolicyRouter)
app.use('/api/user/termsAndConditions', userTermsAndConditionsRouter)
app.use('/api/user/referAndEarnPolicy', userReferAndEarnPolicyRouter)
app.use('/api/user/cart',cartRouter)
app.use('/api/user/orders',userOrderRouter)
app.use('/api/user/referAndEarn', referralRouter)
app.use('/api/user/paymnet', paymentRouter)

app.use('/api/admin',adminRouter);
app.use('/api/admin/users',adminUserRouter);
app.use('/api/admin/products',adminProductRouter);
app.use('/api/admin/banner',adminBannerRouter);
app.use('/api/admin/aboutUs',adminAboutUsRouter);
app.use('/api/admin/notification',adminNotificationRouter)
app.use('/api/admin/privacyAndPolicy',adminPrivacyPolicyRouter)
app.use('/api/admin/termsAndConditions',adminTermsAndConditionsRouter)
app.use('/api/admin/referAndEarnPolicy', adminReferAndEarnPolicyRouter)
app.use('/api/admin/referAndEarn', adminRedeemedRouter)
app.use('/api/admin/orders', adminOrderRouter)
app.use('/api/admin/refferalPoints', refferalPointsRouter)
app.use('/api/admin/notifications',adminNotificationsRouter)



server.listen(process.env.PORT || 8000, ()=>{
    console.log(`server started at port ${process.env.PORT?process.env.PORT:'8000'}`);
})
