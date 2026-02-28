// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 5000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// ----------------------
// MongoDB Connection
// ----------------------
mongoose.connect("mongodb://127.0.0.1:27017/resqai", {
    // no need useNewUrlParser or useUnifiedTopology in modern mongoose
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB connection error:", err));

// ----------------------
// Schemas
// ----------------------
const responderSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    state: String,
    type: String, // expertise
    gender: String,
    availability: { type: Boolean, default: true }
});

const requestSchema = new mongoose.Schema({
    victimName: String,
    contact: String,
    location: { lat: Number, lng: Number },
    state: String,
    type: String, // Medical, Food, etc
    urgency: String,
    preferredResponderGender: String,
    status: { type: String, default: "Pending" },
    assignedResponder: { type: mongoose.Schema.Types.ObjectId, ref: "Responder" },
    priorityScore: Number,
    description: String
});

// ----------------------
// Models
// ----------------------
const Responder = mongoose.model("Responder", responderSchema);
const Request = mongoose.model("Request", requestSchema);

// ----------------------
// AI Assignment Function
// ----------------------
async function assignResponderAI(request) {
    // Find available responders matching state & type
    let candidates = await Responder.find({
        state: request.state,
        type: request.type,
        availability: true
    });

    // Respect gender preference
    if(request.preferredResponderGender){
        candidates = candidates.filter(r => r.gender === request.preferredResponderGender);
    }

    if(candidates.length === 0) return null;

    // Pick first available (simple AI)
    const selected = candidates[0];

    // Update responder availability
    selected.availability = false;
    await selected.save();

    // Assign to request
    request.assignedResponder = selected._id;
    request.status = "Dispatched";
    await request.save();

    return selected;
}

// ----------------------
// Routes
// ----------------------

// Add new responder
app.post("/api/responders", async (req, res) => {
    try {
        const newResponder = new Responder(req.body);
        await newResponder.save();
        res.json({ message: "Responder added", responder: newResponder });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get all responders
app.get("/api/responders", async (req, res) => {
    const responders = await Responder.find();
    res.json(responders);
});

// Add new request
app.post("/api/requests", async (req, res) => {
    try {
        const { victimName, contact, location, state, type, urgency, preferredResponderGender, description } = req.body;

        // Calculate priority score
        let priorityScore = urgency === "High" ? 3 : urgency === "Medium" ? 2 : 1;

        const newRequest = new Request({ victimName, contact, location, state, type, urgency, preferredResponderGender, description, priorityScore });
        await newRequest.save();

        // Run AI assignment
        const assigned = await assignResponderAI(newRequest);

        res.json({
            message: "Request registered",
            request: newRequest,
            assignedResponder: assigned ? assigned.name : null
        });

    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get all requests
app.get("/api/requests", async (req, res) => {
    const requests = await Request.find().populate("assignedResponder");
    res.json(requests);
});

// Update status
app.patch("/api/requests/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const request = await Request.findById(req.params.id).populate("assignedResponder");

        if(!request) return res.status(404).json({ error: "Request not found" });

        request.status = status;

        // If delivered, make responder available again
        if(status === "Delivered" && request.assignedResponder){
            const responder = await Responder.findById(request.assignedResponder._id);
            responder.availability = true;
            await responder.save();
        }

        await request.save();
        res.json({ message: "Status updated", request });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ----------------------
// Start Server
// ----------------------
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));