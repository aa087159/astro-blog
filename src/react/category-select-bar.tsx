import React from "react";
import posts from "../collections/posts.json";
import DisplayPosts from "src/components/display-posts";

const categories: string[] = posts.categories.reduce(
  (accumulator, category) => {
    return accumulator.concat(category.category);
  },
  [] as string[]
);

interface CategorySelectbarProps {
  count: number;
}

const CategorySelectbar = ({ count }: CategorySelectbarProps) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All");

  const handleSelectChange: React.ChangeEventHandler<HTMLSelectElement> = (
    e
  ) => {
    setSelectedCategory(e.target.value);
  };

  const displayPosts = posts.categories.reduce((accumulator, category) => {
    return accumulator.concat(category.data);
  }, [] as any[]);

  const postsLoop = displayPosts.slice(0, count).filter((post) => {
    if (selectedCategory === "All") {
      return true;
    } else {
      return post.frontmatter.category === selectedCategory;
    }
  });

  return (
    <div>
      <form className="flex max-w-lg mt-5 items-center">
        <select
          id="categories"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          onChange={handleSelectChange}
          value={selectedCategory}
        >
          <option value="All">All</option>
          {categories.map((category, i) => (
            <option value={category} key={i}>
              {category}
            </option>
          ))}
        </select>
      </form>

      <DisplayPosts posts={postsLoop} />
    </div>
  );
};

export default CategorySelectbar;
