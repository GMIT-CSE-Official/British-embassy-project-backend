const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI, {
      dbName: process.env.DATABASE_NAME,
    });
    console.log("Database connected successfully");
  } catch (error) {
    console.log(error);
    process.exit();
  }
};

module.exports = { connectDB };
