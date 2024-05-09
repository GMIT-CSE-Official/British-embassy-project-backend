const dotenv = require("dotenv");
const express = require("express");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const userRoutes = require("./routes/user");
const session = require("express-session");
const clubRoutes = require("./routes/club");
const adminRoutes = require("./routes/admin");
const memberRoutes = require("./routes/member");
const RedisStore = require("connect-redis").default;
const { createClient } = require("redis");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");

// Configuring dotenv
dotenv.config({
  path: "./.env",
});

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// express app
const app = express();

// Redis Store
const redisClient = createClient({
  url: process.env.REDIS_DB_URI,
});

redisClient.connect();

redisClient.on("error", (err) => {
  console.log("Server Disconnected socket closed");
});

redisClient.on("connect", () => {
  console.log("Redis Connected");
});

redisClient.on("end", () => {
  console.log("Redis Disconnected");
});

const redisStore = new RedisStore({
  client: redisClient,
  prefix: "session:",
  ttl: 86400,
});

// Database Connection
connectDB();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: redisStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Access-Control-Allow-Origin",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);
app.use(morgan("dev"));

// Routes
app.use("/api/v1/operator", userRoutes);
app.use("/api/v1/club", clubRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/member", memberRoutes);

// Port Running on process.env.PORT
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

app.get("/", (req, res) => {
  res.send(`welcome to the club app, ${req.hostname}!`);
});
