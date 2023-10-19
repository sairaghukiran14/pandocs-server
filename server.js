const mongoose = require("mongoose");
const Document = require("./Document");

mongoose
  .connect(
    "mongodb+srv://raghukiran1414:Raghu%40123@cluster0.m82pxwz.mongodb.net/pan_docs?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(console.log("DB connected"));

const io = require("socket.io")(3001, {
  cors: {
    origin: "https://pandocs-client.vercel.app",
    methods: ["GET", "POST"],
  },
});

const defaultValue = "";

// Socket Connection
io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const document = await findorCreateDocument(documentId);
    // to create a room for the document
    socket.join(documentId);
    socket.emit("load-document", document.data);
    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("recieve-changes", delta);
    });
    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

async function findorCreateDocument(id) {
  if (id == null) return;
  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({ _id: id, data: defaultValue });
}
