import type { Post } from "src/types";

export const sortPosts = (posts: Post[]) => {
  posts.sort((a: Post, b: Post) => {
    const dateStrA = a.frontmatter.dateFormatted.replace(/(st|nd|rd|th)/, "");
    const dateStrB = b.frontmatter.dateFormatted.replace(/(st|nd|rd|th)/, "");

    const dateA = new Date(dateStrA);
    const dateB = new Date(dateStrB);

    const millisecondsSinceEpochA = dateA.getTime();
    const millisecondsSinceEpochB = dateB.getTime();

    return millisecondsSinceEpochB - millisecondsSinceEpochA;
  });
};
