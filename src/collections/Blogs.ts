import type { CollectionConfig } from 'payload'

// Blogs — product/application notes. Never invented copy; content authored
// via the visual rich-text editor (`body`). Legacy articles that used the raw
// HTML field keep working via the `contentHtml` fallback.
const Blogs: CollectionConfig = {
  slug: 'blogs',
  admin: {
    group: 'Publishing',
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'publishedAt', 'updatedAt'],
    defaultSort: '-publishedAt',
    listSearchableFields: ['title', 'slug', 'category', 'excerpt'],
    description:
      'Blog & news articles. Write the article in the visual editor, set a publish date, then set Status to "Published" so it appears on the website after publishing.',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user?.isAdmin),
    update: ({ req }) => Boolean(req.user?.isAdmin),
    delete: ({ req }) => Boolean(req.user?.isAdmin),
  },
  fields: [
    // ------------------------------------------------------------------
    // Article tab — the everyday editing surface.
    // ------------------------------------------------------------------
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Article',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              label: 'Post title',
              admin: { description: 'The headline shown on the blog card and article page.' },
            },
            {
              name: 'excerpt',
              type: 'textarea',
              label: 'Excerpt / summary',
              admin: { description: 'Short teaser text shown on the blog card. Leave blank to hide it.' },
            },
            {
              name: 'body',
              type: 'richText',
              label: 'Article body',
              admin: {
                description:
                  'Write the article here using the visual editor (bold, headings, lists, links, tables). No HTML needed.',
              },
            },
          ],
        },
        {
          label: 'Publishing',
          description: 'Where and how this article appears on the website.',
          fields: [
            {
              name: 'status',
              type: 'select',
              options: [
                { label: 'Published', value: 'published' },
                { label: 'Draft', value: 'draft' },
              ],
              defaultValue: 'published',
              label: 'Status',
              admin: {
                description: 'Draft articles are hidden from the website until you switch this to "Published".',
              },
            },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              label: 'URL slug',
              admin: {
                description: 'Web address ending for this article (e.g. my-article). Leave blank to auto-create from the title.',
              },
              hooks: {
                beforeValidate: [
                  ({ value, data }) => {
                    if (value) return value
                    const t = data?.title
                    if (!t) return value
                    const slug = String(t)
                      .toLowerCase()
                      .trim()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, '')
                      .slice(0, 120)
                    return slug || value
                  },
                ],
              },
            },
            {
              name: 'category',
              type: 'text',
              label: 'Category',
              admin: {
                description: 'Filter label used on the blog page (e.g. Product Guides, Installation, Technical).',
              },
            },
            {
              name: 'author',
              type: 'relationship',
              relationTo: 'users',
              label: 'Author',
              admin: { description: 'Team member this article is credited to.' },
            },
            {
              name: 'publishedAt',
              type: 'date',
              label: 'Publish date',
              admin: { description: 'Date shown on the article. Newest dates appear first in the blog list.' },
            },
            {
              name: 'readTime',
              type: 'text',
              label: 'Reading time',
              admin: { description: 'e.g. "5 min read".' },
            },
            {
              name: 'image',
              type: 'text',
              label: 'Featured image — path / URL (legacy)',
              admin: {
                description:
                  'Used automatically when no library image is chosen below. Existing articles keep their path/URL here — leave as-is.',
              },
            },
            {
              name: 'coverImage',
              type: 'relationship',
              relationTo: 'media',
              label: 'Cover image (from library)',
              admin: {
                description:
                  'Pick one of your uploaded images for this article. When set, it is used instead of the legacy path above. Upload new images in the Images collection.',
              },
            },
            {
              name: 'featured',
              type: 'checkbox',
              defaultValue: false,
              label: 'Featured article',
              admin: { description: 'Highlight this article on the blog page.' },
            },
            {
              name: 'tags',
              type: 'array',
              label: 'Tags',
              admin: { description: 'Optional labels/topics for this article.' },
              fields: [{ name: 'tag', type: 'text', label: 'Tag' }],
            },
          ],
        },
        {
          label: 'Advanced',
          description: 'Only needed in special cases. Most articles never touch these.',
          fields: [
            {
              name: 'contentHtml',
              type: 'textarea',
              label: 'HTML body (advanced)',
              admin: {
                description:
                  'Used only when the visual "Article body" editor above is empty. Existing legacy articles keep their HTML here — you can leave it as-is.',
              },
            },
          ],
        },
      ],
    },
  ],
}
export default Blogs