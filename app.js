const dotenv = require("dotenv");
const express = require("express");
const { connectDB } = require("./config/db");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const userRoutes = require("./routes/user");
const session = require("express-session");
const clubRoutes = require("./routes/club");
const adminRoutes = require("./routes/admin");
const memberRoutes = require("./routes/member");
const walletRoutes = require("./routes/wallet");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");
const MongoStore = require("connect-mongo");
const cron = require("node-cron");
const {
  deleteUnverifiedClubs,
  removeTemporaryAdmins,
} = require("./controller/club");

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
    store: MongoStore.create({
      mongoUrl: process.env.DATABASE_URI,
    }),
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
app.use("/api/v1/wallet", walletRoutes);

// Port Running on process.env.PORT
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

app.get("/", (req, res) => {
  res.send(`welcome to the club app, ${req.hostname}!`);
});

cron.schedule("0 3 * * *", async () => {
  await deleteUnverifiedClubs();
  await removeTemporaryAdmins();
});
