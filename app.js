const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const engine = require("ejs-mate");

const app = express();
const PORT = process.env.PORT || 3000;

/* ==============================
   1️⃣ View Engine Setup
============================== */

app.engine("ejs", engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* ==============================
   2️⃣ Middleware Setup
============================== */

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ==============================
   3️⃣ Multer Setup
============================== */

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(new Error("Only PDF files allowed!"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

/* ==============================
   4️⃣ Routes
============================== */

// Home Page
app.get("/", (req, res) => {
    res.render("main");
});

// Upload Page
app.get("/upload", (req, res) => {
    res.render("upload");
});

// Download Route
app.get("/download/:course/:semester/:year/:filename", (req, res) => {

    const { course, semester, year, filename } = req.params;

    const filePath = path.join(__dirname, "uploads", course, semester, year, filename);

    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send("File not found ❌");
    }
});

/* ==============================
   5️⃣ Dynamic Course System
   (Keep dynamic routes below static routes)
============================== */

// Show Semesters of a Course
app.get("/:course", (req, res) => {

    const { course } = req.params;
    const coursePath = path.join(__dirname, "uploads", course);

    if (!fs.existsSync(coursePath)) {
        return res.status(404).send("Course not found ❌");
    }

    const semesters = fs.readdirSync(coursePath);

    res.render("semesters", { course, semesters });
});

// Show Years of a Semester
app.get("/:course/:semester", (req, res) => {

    const { course, semester } = req.params;
    const folderPath = path.join(__dirname, "uploads", course, semester);

    if (!fs.existsSync(folderPath)) {
        console.log("Course folder not found:", folderPath);
        return res.render("years", { 
            course, 
            semester, 
            years: [] 
        });
    }

    const years = fs.readdirSync(folderPath);

    res.render("years", { 
        course, 
        semester, 
        years 
    });
});

// Show Papers of a Year
app.get("/:course/:semester/:year", (req, res) => {

    const { course, semester, year } = req.params;
    const folderPath = path.join(__dirname, "uploads", course, semester, year);

    if (!fs.existsSync(folderPath)) {
        return res.render("papers", {
            course,
            semester,
            year,
            files: []
        });
    }

    const files = fs.readdirSync(folderPath)
        .filter(file => file.endsWith(".pdf"));

    res.render("papers", {
        course,
        semester,
        year,
        files
    });
});

/* ==============================
   6️⃣ Upload Route
============================== */

app.post("/upload", (req, res) => {

    upload.single("pdf")(req, res, function (err) {

        if (err instanceof multer.MulterError) {
            return res.status(400).send("File too large! Max 5MB allowed.");
        } else if (err) {
            return res.status(400).send(err.message);
        }

        if (!req.file) {
            return res.status(400).send("No file uploaded ❌");
        }

        res.render("download", { filename: req.file.filename });
    });
});

/* ==============================
   7️⃣ 404 Handler
============================== */

app.use((req, res) => {
    res.status(404).send("Page Not Found ❌");
});

/* ==============================
   8️⃣ Start Server
============================== */

app.listen(PORT, () => {
    console.log("Server is listening on port 3000 🚀");
});

