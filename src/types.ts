export interface Post {
  filename: string;
  frontmatter: {
    layout: string;
    title: string;
    description: string;
    dateFormatted: string;
    link: string;
    category: string;
  };
  content: string;
}
