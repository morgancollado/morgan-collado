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
  return slugs.map((slug) => getPostBySlug(slug, fields))
}

export function getAllPostsSorted(fields) {
  const withDate = fields.includes('date') ? fields : [...fields, 'date']
  return getAllPosts(withDate).sort((a, b) =>
    (b.date || '').localeCompare(a.date || '')
  )
}

export function readingTimeMinutes(content = "") {
  const words = content.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 225))
}

function roman(n) {
  const table = [
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'],
    [5, 'V'], [4, 'IV'], [1, 'I'],
  ]
  let out = ''
  for (const [value, numeral] of table) {
    while (n >= value) {
      out += numeral
      n -= value
    }
  }
  return out
}

// Folio line for the issue a post belongs to: the volume is the publication
// year counted from the archive's first year, the number is the post's
// chronological position within that year.
export function folioForDate(date) {
  const dates = getAllPostsSorted(['date']).map((post) => String(post.date))
  const firstYear = Number(dates[dates.length - 1].slice(0, 4))
  const year = Number(String(date).slice(0, 4))
  const issue = dates.filter(
    (d) => d.slice(0, 4) === String(year) && d <= String(date)
  ).length
  return `Vol. ${roman(year - firstYear + 1)}, No. ${roman(Math.max(1, issue))}`
}

// The masthead folio for site pages: the latest published issue.
export function currentFolio() {
  const [newest] = getAllPostsSorted(['date'])
  return newest ? folioForDate(newest.date) : 'Vol. I, No. I'
}
