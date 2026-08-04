import { createContentLoader } from "@/lib/content";

const blog = createContentLoader("src/app/blog/_content");

export const getPostSlugs = blog.getSlugs;
export const getPostBySlug = blog.getBySlug;
export const getAllPosts = blog.getAll;
export const getAllPostsSorted = blog.getAllSorted;
