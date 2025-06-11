const mongoose = require('mongoose');
require('dotenv').config();
const mongoDbConnection = async ()=>{
    try{
        await mongoose.connect(process.env.MONODB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          });
        console.log('Connected to database');
    }
    catch(err){
        console.log(err);
    }
}
module.exports = mongoDbConnection;