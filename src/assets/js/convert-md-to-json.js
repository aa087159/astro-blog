import { fileURLToPath } from "url";
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

// Directory containing your Markdown files
const markdownDir = path.join(
  fileURLToPath(import.meta.url),
  "..",
  "../../pages/posts"
);

// Output JSON file
const outputFile = path.join(
  fileURLToPath(import.meta.url),
  "..",
  "../../collections/posts.json"
);

// Function to read Markdown files and extract content
const readMarkdownFiles = async (dir) => {
  try {
    const files = await fs.readdir(dir);
    const categories = []; // Initialize categories array

    // Loop through each file
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = await fs.stat(filePath);

      // If it's a directory, process its content
      if (stats.isDirectory()) {
        const category = file; // Category name is the directory name
        const categoryFiles = await fs.readdir(filePath);

        // Initialize category array
        const categoryData = [];

        // Loop through files in the category directory
        for (const categoryFile of categoryFiles) {
          const fileContent = await fs.readFile(
            path.join(filePath, categoryFile),
            "utf-8"
          );

          const { data: frontmatter, content } = matter(fileContent);

          // Add filename, frontmatter, and content to the category array
          categoryData.push({
            filename: categoryFile,
            frontmatter,
            content,
          });
        }

        // Push the category data to the categories array
        categories.push({
          category,
          data: categoryData,
        });
      }
    }

    return { categories };
  } catch (error) {
    console.error("Error reading Markdown files:", error);
    return {};
  }
};

// Convert Markdown files to JSON
const convertMarkdownToJson = async () => {
  try {
    const markdownData = await readMarkdownFiles(markdownDir);
    await fs.writeFile(outputFile, JSON.stringify(markdownData, null, 2));
    console.log(`Converted Markdown files to JSON: ${outputFile}`);
  } catch (error) {
    console.error("Error converting Markdown to JSON:", error);
  }
};

// Run the conversion function
convertMarkdownToJson();
