const dotenv = require("dotenv");
const express = require("express");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const userRoutes = require("./routes/user");
const session = require("express-session");
const clubRoutes = require("./routes/club");
const MongoStore = require("connect-mongo");

// Configuring dotenv
dotenv.config({
  path: "./.env",
});

// express app
const app = express();

// Database Connection
connectDB();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
      mongoUrl: process.env.DATABASE_URI,
      collectionName: process.env.SESSION_COLLECTION_NAME,
      dbName: process.env.DATABASE_NAME,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);
app.use(morgan("dev"));

// Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/club", clubRoutes);

// Port Running on process.env.PORT
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

app.get("/", (req, res) => {
  res.send(`welcome to the club app, ${req.hostname}!`);
});
