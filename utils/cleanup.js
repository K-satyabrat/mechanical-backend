const cron = require("node-cron");
const dummyOrder = require("../models/dummyOrder");
 
 
cron.schedule("*/10 * * * *", async () => {
    try {
        const expirationTime = new Date(Date.now() - 10 * 60 * 1000);
        await dummyOrder.deleteMany({ updatedAt: { $lt: expirationTime } });
        console.log("Expired dummyOrder records cleaned up.");
    } catch (err) {
        console.error("Error deleting expired dummyOrder records:", err);
    }
});
 
 