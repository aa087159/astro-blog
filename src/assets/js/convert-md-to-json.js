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
    const data = [];
    for (const file of files) {
      const filePath = path.join(dir, file);
      const content = await fs.readFile(filePath, "utf-8");
      const { data: frontmatter, content: markdownContent } = matter(content);
      // You can manipulate frontmatter or content here as needed
      data.push({
        filename: file,
        frontmatter,
        content: markdownContent,
      });
    }
    return data;
  } catch (error) {
    console.error("Error reading Markdown files:", error);
    return [];
  }
};

// Convert Markdown files to JSON
const convertMarkdownToJson = async () => {
  try {
    const markdownData = await readMarkdownFiles(markdownDir);
    await fs.writeFile(outputFile, JSON.stringify(markdownData, null, 2));
    console.log(
      `Converted ${markdownData.length} Markdown files to JSON: ${outputFile}`
    );
  } catch (error) {
    console.error("Error converting Markdown to JSON:", error);
  }
};

// Run the conversion function
convertMarkdownToJson();
