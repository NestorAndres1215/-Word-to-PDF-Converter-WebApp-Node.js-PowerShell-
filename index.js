const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

const app = express();
const PORT = 3000;

// Middleware para servir archivos estáticos
app.use(express.static("public"));
app.use("/output", express.static(path.join(__dirname, "output")));
app.use("/views", express.static(path.join(__dirname, "views")));
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));
// Configurar multer para subir archivos .docx
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Ruta para servir el formulario
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Ruta para manejar la conversión
app.post("/convertir", (req, res) => {
  upload.single("archivo")(req, res, (err) => {
    if (err) {
      return res.status(400).send("Error al subir archivo: " + err.message);
    }

    if (!req.file) {
      return res.status(400).send("No se subió ningún archivo.");
    }

    const archivoSubido = req.file.path;
    const nombrePDF = req.file.filename.replace(/\.docx$/i, ".pdf");
    const rutaSalida = path.join("output", nombrePDF);

    const comando = `powershell -ExecutionPolicy Bypass -File "${path.resolve("convert.ps1")}" -inputPath "${path.resolve(archivoSubido)}" -outputPath "${path.resolve(rutaSalida)}"`;

    exec(comando, (error) => {
      // Eliminar el archivo original después de la conversión
      fs.unlink(archivoSubido, () => {});

      if (error || !fs.existsSync(rutaSalida)) {
        return res.status(500).send("Error al convertir el archivo.");
      }

      // Redirigir a la página de descarga
      res.redirect(`/descarga?archivo=${encodeURIComponent(nombrePDF)}`);
    });
  });
});

// Ruta para la página de descarga
app.get("/descarga", (req, res) => {
  const nombreArchivo = req.query.archivo;
  const rutaArchivo = path.join(__dirname, "output", nombreArchivo);

  if (!fs.existsSync(rutaArchivo)) {
    return res.status(404).send("Archivo no encontrado.");
  }

  res.sendFile(path.join(__dirname, "views", "descargar.html"));
});

// Crear carpetas necesarias si no existen
["uploads", "output"].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
