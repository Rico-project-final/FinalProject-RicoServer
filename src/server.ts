import express, { Express } from "express";
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoute';
import taskRoutes from './routes/taskRoute';
import userRoutes from './routes/userRoute';
import reviewRoutes from './routes/reviewRoute';
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
import path from 'path';
import http from 'http';
import cors from 'cors'
import reviewAnalysisRoute from "./routes/reviewAnalysisRoute";
import businessRoute from "./routes/businessRoute";

dotenv.config();

const app = express();
const server = http.createServer(app); // Create HTTP server to handle socket.io

// Middleware
app.use(cors({
  origin: ["0.0.0.0",process.env.DOMAIN_URL || 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "*");
  next();
});
// Static files for images
// app.use('/uploads', express.static(path.join(__dirname, '../../public/uploads')));
// app.use(express.static(path.resolve(__dirname , '..' , '../front')))

// Routes
app.use('/auth', authRoutes);
app.use('/reviews', reviewRoutes);
app.use('/analysis', reviewAnalysisRoute)
app.use('/business', businessRoute);
app.use('/tasks', taskRoutes);
app.use('/users', userRoutes)

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Web Dev 2025 REST API",
      version: "1.0.0",
      description: "REST server including authentication using JWT",
    },
    servers: [{ url: "http://localhost:5000", },{url : process.env.DOMAIN_URL}],
  },
  apis: ["./src/routes/*.ts"],
};
const specs = swaggerJsDoc(options);

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));
// app.use("*" , (req,res)=>{
//   res.sendFile(path.resolve(__dirname , '..' , '../front/index.html'))
// })
// Connect to MongoDB

const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to database"));

const initApp = () => {
  return new Promise<{app : Express , server : http.Server}>((resolve, reject) => {
    if (!process.env.MONGODB_URI) {
      reject("MONGODB_URI is not defined in .env file");
    } else {
      mongoose
        .connect(process.env.MONGODB_URI)
        .then(() => {
          resolve({app,server});
        })
        .catch((error) => {
          reject(error);
        });
    }
  });
};
// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});
export default initApp;