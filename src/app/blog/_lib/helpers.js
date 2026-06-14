import fs from 'fs'
import { join } from 'path'
import matter from 'gray-matter'

const postsDirectory = join(process.cwd(), "/src/app/blog/_content");

export function getPostSlugs() {
  return fs.readdirSync(postsDirectory).filter((file) => file.endsWith('.md'))
}

export function getPostBySlug(slug, fields) {
    const realSlug = slug.replace(/\.md$/, '')
    const fullPath = join(postsDirectory, `${realSlug}.md`)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)
  
    let items = {}
  
    // Ensure only the minimal needed data is exposed
    fields.forEach((field) => {
      if (field === 'slug') {
        items[field] = realSlug
      }
      if (field === 'content') {
        items[field] = content
      }
  
      if (typeof data[field] !== 'undefined') {
        items[field] = data[field]
      }
    })
    
  
    return items
  }

  export function getAllPosts(fields) {
    const slugs = getPostSlugs()
    const posts = slugs
      .map((slug) => getPostBySlug(slug, fields))
    return posts
  }

  export function getAllPostsSorted(fields) {
    const withDate = fields.includes('date') ? fields : [...fields, 'date']
    return getAllPosts(withDate).sort((a, b) =>
      (b.date || '').localeCompare(a.date || '')
    )
  }