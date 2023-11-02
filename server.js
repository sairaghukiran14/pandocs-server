import path from "path";
import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import http from "http";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import userRoutes from "./routes/userRoutes.js";
import { Server } from "socket.io";
import cors from "cors";
import Document from "./models/Document.js";
const defaultValue = "";
const app = express();
app.use(cors());
connectDB();
// import Document from './models/Document.js';
// import documentRouter from './routes/documentRouter.js';
const server = http.createServer(app);
const port = process.env.PORT || 5000;
const io = new Server(server, {
  cors: "http://localhost:3000",
  methods: ["GET", "POST"],
});
io.on("connection", (socket) => {
  console.log(socket.id + "is COnnected");
  // socket.emit("receiveMessage", { message: "message from server" });
  // socket.on("sendMessage", (data) => {
  //   console.log(data);
  // });
  socket.on("get-document", async (documentId) => {
    const document = await findorCreateDocument(documentId);
    // to create a room for the document
    socket.join(documentId);
    socket.emit("load-document", document.data);
    // Sending Changes back to the server
    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("recieve-changes", delta);
    });
    // Saving the document in the database
    socket.on("save-document", async (data) => {
      // socket.on("send-Userinfo", (data) => {
      //   userID = data._id;
      // });
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});
async function findorCreateDocument(id) {
  // If the id is null then theere is no document change
  if (id == null) return;
  // if the  id is present then return the  document with the ID to the client
  const document = await Document.findById(id);

  if (document) return document;
  // if the document is not present but the ID is unique then return the new document to the client
  return await Document.create({
    _id: id,
    data: defaultValue,
  });
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api/users", userRoutes);

if (process.env.NODE_ENV === "production") {
  const __dirname = path.resolve();
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running....");
  });
}

app.use(notFound);
app.use(errorHandler);
// app.use('/documents/:id',documentRouter)

server.listen(port, () => console.log(`Server started on port ${port}`));
