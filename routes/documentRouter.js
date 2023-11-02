import express from "express";
import Document from "../models/Document.js"; // Import your document model and other dependencies

const documentRouter = express.Router();
import { Server } from "socket.io";
const io = new Server(3001, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT"],
  },
});
const defaultValue = "";
const doc = io.of("/documents/:id");

doc.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    // Create a room for the document
    socket.join(documentId);
    socket.emit("load-document", document.data);
    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });
    // Save the document in the database
    socket.on("save-document", async (data) => {
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
  return await Document.create({ _id: id, data: defaultValue });
}
export default documentRouter;
