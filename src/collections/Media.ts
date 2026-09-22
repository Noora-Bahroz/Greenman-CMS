import type { CollectionConfig } from 'payload'

// Media — the admin photo library. Non-technical editors upload images here,
// then pick them from the product / blog editors. Files are stored on local
// disk under /media and published to the website's assets/img/ folder page by
// page (see scripts/phase6/export.ts). Existing image references elsewhere in
// the CMS (products.images[].path, blogs.image) are plain file paths and keep
// working unchanged — the library only ADDS a cleaner way to attach images.
const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Image', plural: 'Images' },
  admin: {
    group: 'Publishing',
    useAsTitle: 'alt',
    defaultColumns: ['alt', 'kind', 'filename'],
    description:
      'The image library. Drag an image here (or click + Upload New) and give it a clear name. You can then attach it to a product or blog from that product/blog editor. Images with no "Name / alt text" show a date-based placeholder.',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user?.isAdmin),
    update: ({ req }) => Boolean(req.user?.isAdmin),
    delete: ({ req }) => Boolean(req.user?.isAdmin),
  },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*', 'application/pdf'],
    adminThumbnail: 'thumbnail',
    imageSizes: [
      { name: 'thumbnail', width: 200, height: 200, position: 'centre' },
      { name: 'card', width: 600, height: 600, position: 'centre' },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Name / alt text',
      admin: {
        description:
          'Short, clear name — it appears in every picker, and is also used as the image alt text on the website (e.g. "GM412115 cross section").',
      },
    },
    {
      name: 'kind',
      // Stored value is a plain string like the legacy fields, so previously
      // imported kinds (3d, drawing, gallery, image, technicalDrawing) are kept.
      type: 'select',
      options: [
        { label: 'General / main photo', value: 'image' },
        { label: 'Technical drawing', value: 'technicalDrawing' },
        { label: 'Drawing', value: 'drawing' },
        { label: 'Gallery photo', value: 'gallery' },
        { label: '3D model view', value: '3d' },
        { label: 'Main', value: 'main' },
        { label: 'Cover', value: 'cover' },
        { label: 'Logo', value: 'logo' },
        { label: 'Other', value: 'other' },
      ],
      label: 'Use',
      admin: { description: 'What this image is typically used for (informational).' },
    },
    {
      name: 'croppedTo',
      type: 'text',
      label: 'Crop hints',
      admin: {
        description: 'Optional note for cropping (e.g. "focus left side"). Rarely needed.',
      },
    },
  ],
}
export default Media