import type { CollectionConfig } from 'payload'

// Products = each live family's product records (one family's variants as
// child 'variants' array in the SAME order the live contract lists them).
const Products: CollectionConfig = {
  slug: 'products',
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user && req.user.isAdmin),
    update: ({ req }) => Boolean(req.user && req.user.isAdmin),
    delete: ({ req }) => Boolean(req.user && req.user.isAdmin),
  },
  admin: {
    group: 'Catalogue',
    useAsTitle: 'productName',
    defaultColumns: ['productName', 'sku', 'family', 'subtitle', 'updatedAt'],
    defaultSort: 'sku',
    listSearchableFields: ['productName', 'productNameAlias', 'sku', 'categoryId', 'category', 'brand'],
    description:
      'Product catalogue. Click a product to open it, edit any field, then press "Save". Changes are applied to the website the next time content is published.',
  },
  fields: [
    // ------------------------------------------------------------------
    // Sidebar — identity + import metadata (kept out of the main tabs so
    // editors can't accidentally change publisher-controlled values).
    // ------------------------------------------------------------------
    {
      name: 'sku',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'SKU / Product code',
      admin: {
        position: 'sidebar',
        description: 'Unique product code. Used to look products up and in catalog exports.',
      },
    },
    {
      name: 'family',
      type: 'relationship',
      relationTo: 'families',
      label: 'Product family',
      admin: {
        position: 'sidebar',
        description: 'The family this product belongs to (e.g. Strut Channel, Metal Anchor). Pick from the list.',
      },
    },
    {
      name: 'subtitle',
      type: 'text',
      label: 'Subtitle',
      admin: {
        description: 'Short tagline shown under the product name (catalog exports).',
      },
    },
    {
      name: 'file',
      type: 'text',
      label: 'Source document',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Contract file this product was imported from. Managed automatically — not editable.',
      },
    },
    {
      name: 'categoryId',
      type: 'text',
      label: 'Catalog category key',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Internal grouping key used to place this product in the website catalog. Managed by import.',
      },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Display order',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Position of this product within its catalog group. Managed by import.',
      },
    },
    {
      name: 'page',
      type: 'number',
      label: 'Source page number',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Page number in the original price list/PDF. For reference only.',
      },
    },
    {
      name: 'specSet',
      type: 'relationship',
      relationTo: 'reusable-blocks',
      label: 'Specification table',
      admin: {
        position: 'sidebar',
        description: 'Optional reusable specification/load table attached to this product.',
      },
    },
    {
      name: 'auditDays',
      type: 'join',
      collection: 'audits',
      on: 'product',
    },

    // ------------------------------------------------------------------
    // Main editing area — grouped into tabs for a non-technical editor.
    // ------------------------------------------------------------------
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Overview',
          description: 'Name, category and marketing copy for this product.',
          fields: [
            {
              name: 'productName',
              type: 'text',
              label: 'Product name',
              admin: { description: 'Full product name — shown as the product title on the website.' },
            },
            {
              name: 'productNameAlias',
              type: 'text',
              label: 'Product name alias',
              admin: { description: 'Alternative name used in some catalog listings.' },
            },
            {
              name: 'category',
              type: 'text',
              label: 'Category label',
              admin: { description: 'Main category this product is displayed under.' },
            },
            {
              name: 'categoryAlias',
              type: 'text',
              label: 'Category alias',
              admin: { description: 'Alternative category label used in some listings.' },
            },
            {
              name: 'brand',
              type: 'text',
              label: 'Brand',
              admin: { description: 'Brand name (e.g. GRIP).' },
            },
            {
              name: 'productRange',
              type: 'text',
              label: 'Product range',
              admin: { description: 'Range name this product belongs to, if any.' },
            },
            {
              name: 'shortDescription',
              type: 'textarea',
              label: 'Short description',
              admin: {
                description: 'Short summary shown on catalog cards and list pages. (Supports normal text.)',
              },
            },
            {
              name: 'description',
              type: 'textarea',
              label: 'Full description',
              admin: {
                description: 'Longer legacy description text where available.',
              },
            },
            {
              name: 'categoryDefinition',
              type: 'textarea',
              label: 'Category definition',
              admin: { description: 'Longer definition of the category this product belongs to.' },
            },
          ],
        },
        {
          label: 'Specifications',
          description: 'Key technical facts as name/value pairs (e.g. Material = Steel, Height = 41 mm).',
          fields: [
            {
              name: 'specifications',
              type: 'array',
              label: 'Specifications',
              admin: {
                initCollapsed: true,
                description: 'Fact sheet shown on the product page. Add a row for each specification.',
              },
              fields: [
                { name: 'key', type: 'text', required: true, label: 'Specification name' },
                { name: 'value', type: 'text', label: 'Value' },
                { name: 'unit', type: 'text', label: 'Unit (e.g. kN, mm)' },
              ],
            },
          ],
        },
        {
          label: 'Images',
          description:
            'Photos & drawings shown for this product. Pick one of your uploaded images per row (Image from library) — no file paths needed. Existing path values keep working as before.',
          fields: [
            {
              name: 'image',
              type: 'relationship',
              relationTo: 'media',
              label: 'Main image (media library)',
              admin: { description: 'Reserved for a library-linked main image. Most products use the rows below instead.' },
            },
            {
              name: 'images',
              type: 'array',
              label: 'Images',
              admin: {
                initCollapsed: true,
                description: 'Add one row per image. The first row of each "Use" is what the website shows.',
              },
              fields: [
                {
                  name: 'kind',
                  type: 'select',
                  options: [
                    { label: 'Main photo', value: 'image' },
                    { label: 'Technical drawing', value: 'technicalDrawing' },
                    { label: 'Drawing', value: 'drawing' },
                    { label: 'Gallery photo', value: 'gallery' },
                    { label: '3D model view', value: '3d' },
                    { label: 'Main', value: 'main' },
                    { label: 'Cover', value: 'cover' },
                    { label: 'Logo', value: 'logo' },
                    { label: 'Other', value: 'other' },
                  ],
                  defaultValue: 'image',
                  label: 'Use',
                  admin: { description: 'Main photo, technical drawing, gallery...' },
                },
                {
                  name: 'media',
                  type: 'relationship',
                  relationTo: 'media',
                  label: 'Image from library',
                  admin: {
                    description:
                      'Choose one of your uploaded images. Preferred — the page will publish it automatically (stored under assets/img/).',
                  },
                },
                {
                  name: 'path',
                  type: 'text',
                  label: 'Image path (manual)',
                  admin: {
                    description:
                      'Existing path or URL (e.g. assets/... ). Only fill this in when the library picker above is left empty.',
                  },
                },
                {
                  name: 'code',
                  type: 'text',
                  label: 'Image code (optional)',
                  admin: { description: 'Optional identifier (e.g. GM412115).' },
                },
              ],
            },
          ],
        },
        {
          label: 'Variants',
          description:
            'Size variants recorded on this product record. Note: most size variants are managed in the "Variants" collection — this list only shows variants attached directly to this product.',
          fields: [
            {
              name: 'variants',
              type: 'array',
              label: 'Variants on this product',
              admin: { initCollapsed: true },
              fields: [
                { name: 'sku', type: 'text', required: true, label: 'SKU' },
                { name: 'size', type: 'text', label: 'Size' },
                { name: 'loadRating', type: 'text', label: 'Load rating (e.g. 1 kN)' },
                { name: 'loadCases', type: 'json', label: 'Load cases' },
                { name: 'dimensions', type: 'json', label: 'Dimensions' },
                { name: 'attributes', type: 'json', label: 'Attributes' },
              ],
            },
          ],
        },
        {
          label: 'Technical',
          description: 'Advanced engineering data. Usually left as-is after import.',
          fields: [
            {
              name: 'mountingMethod',
              type: 'textarea',
              label: 'Mounting method',
              admin: { description: 'How this product is mounted/installed.' },
            },
            { name: 'technicalData', type: 'json', label: 'Technical data', admin: { initCollapsed: true } },
            { name: 'technicalTable', type: 'json', label: 'Technical table', admin: { initCollapsed: true } },
            { name: 'properties', type: 'json', label: 'Section properties', admin: { initCollapsed: true } },
            { name: 'loadCases', type: 'json', label: 'Load cases', admin: { initCollapsed: true } },
          ],
        },
      ],
    },
  ],
}

export default Products