import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";

// Function to get all folders under a certain directory
function getFolders(directory) {
  return fs
    .readdirSync(directory)
    .filter((file) => fs.statSync(path.join(directory, file)).isDirectory());
}

// Get the directory name of the current module file
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Output JSON file
const outputFile = path.join(
  __dirname,
  "../../collections/posts-categories.json"
);

const parentDirectory = path.join(
  fileURLToPath(import.meta.url),
  "..",
  "../../pages/posts"
);

const convertFoldersToCategories = async () => {
  const folders = await getFolders(parentDirectory);
  try {
    await fs.promises.writeFile(outputFile, JSON.stringify(folders, null, 2));
    console.log("Successfully converted folders to categories array");
  } catch (error) {
    console.error("Error converting folders", error);
  }
};

convertFoldersToCategories();
