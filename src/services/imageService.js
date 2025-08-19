const path = require("path");
const fs = require("fs");

// use env-defined upload dir
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "../uploads");

async function getImage({ filename }) {
  try {
    if (!filename) {
      return {};
    }

    const filePath = path.join(UPLOAD_DIR, filename);
    const resolvedPath = path.resolve(filePath);

    if (!resolvedPath.startsWith(path.resolve(UPLOAD_DIR))) {
      return {};
    }

    if (!fs.existsSync(resolvedPath)) {
      console.warn("File not found:", resolvedPath);
      return {};
    }

    return { filePath: resolvedPath };
  } catch (err) {
    console.error("Error in getImage service:", err);
    return {};
  }
}

module.exports = { getImage };
