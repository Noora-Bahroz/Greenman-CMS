import type { CollectionConfig } from 'payload'

// Families = schema-v2 family records (the "8 migrated" + any later-migrated)
//   + legacy FULLER copy preserved (R1/R2 full category description and
//   R3/R4 aliases — see phase1/leaf_resolutions.json; nothing overwritten).
const Families: CollectionConfig = {
  slug: 'families',
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user && req.user.isAdmin),
    update: ({ req }) => Boolean(req.user && req.user.isAdmin),
    delete: ({ req }) => Boolean(req.user && req.user.isAdmin),
  },
  admin: { group: 'Catalogue', useAsTitle: 'productName', defaultColumns: ['code', 'name', 'type', 'category'] },
  fields: [
    { name: 'code', type: 'text', required: true, unique: true, index: true },
    // schema-v2 canonical family name (e.g. 'GreenBolt G2 Through Anchor').
    { name: 'name', type: 'text' },
    // schema-v2 mandatory type: drives which variant attribute groups apply.
    {
      name: 'type',
      type: 'select',
      options: ['PROFILE', 'ANCHOR', 'FASTENER', 'CLAMP', 'ACCESSORY'],
      required: true,
      index: true,
      admin: { description: 'Family type (schema-v2). Drives variant attribute blocks.' },
    },
    { name: 'productName', type: 'text', required: true },
    { name: 'productNameAlias', type: 'text' }, // R4: legacy 'GreenBolt HexCap'
    { name: 'category', type: 'text', required: true }, // R3 canonical 'Hex Cap Bolts' etc.
    { name: 'categoryAlias', type: 'text' }, // R3: legacy 'Fasteners & Screws'
    { name: 'shortDescription', type: 'textarea' }, // schema short (kept, not truncated)
    { name: 'definition', type: 'textarea' }, // gaco/greengrip/fasteners definition copy
    { name: 'fullName', type: 'text' },
    { name: 'series', type: 'text' },
    { name: 'badge', type: 'text' },
    { name: 'sortOrder', type: 'number' },
    { name: 'brand', type: 'text' },
    { name: 'productRange', type: 'text' },
    { name: 'website', type: 'text' },
    { name: 'categoryID', type: 'relationship', relationTo: 'categories' },
    // Phase 6 round-trip provenance: source data file and original export key.
    { name: 'file', type: 'text', admin: { position: 'sidebar', description: 'Source contract file' } },
    { name: 'contractKey', type: 'text', admin: { position: 'sidebar', description: 'Original export key casing (e.g. greengrip ggtcTriLock)' } },
    { name: 'fileBadge', type: 'text', admin: { position: 'sidebar', description: 'Badge verbatim from the source contract file (may differ from category doc)' } },
    { name: 'fileDescription', type: 'textarea', admin: { position: 'sidebar', description: 'Category description verbatim from the source contract file' } },
    { name: 'order', type: 'number', admin: { position: 'sidebar', description: 'Parse order within source file' } },
    { name: 'codePrefix', type: 'text', admin: { description: 'Accessory code_prefix verbatim' } },
    { name: 'extra', type: 'json', admin: { description: 'Unmodeled top-level source keys (e.g. components)' } },
    { name: 'catalogPdf', type: 'relationship', relationTo: 'media', admin: { position: 'sidebar' } },
    // String-safe: source PDF page can be 'PAGE 55'.
    { name: 'pdfPage', type: 'text', admin: { position: 'sidebar' } },
    { name: 'mountingMethod', type: 'textarea' },
    // strut/c-channel technicalData group (material1/2 + types) kept verbatim.
    { name: 'technicalData', type: 'json' },
    {
      name: 'specifications',
      type: 'array',
      fields: [
        { name: 'key', type: 'text', required: true },
        { name: 'value', type: 'text' },
        { name: 'unit', type: 'text' },
      ],
    },
    // Family images feed the catalog pages (main photo, technical drawing).
    // Existing rows store string paths; optionally an uploaded library image
    // can be picked instead (export resolves it to assets/img/...).
    {
      name: 'images',
      type: 'array',
      admin: {
        description:
          'Photos & drawings for this family. Pick an uploaded library image per row, or keep an existing path.',
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
              'Choose one of your uploaded images. Preferred — published automatically (assets/img/).',
          },
        },
        { name: 'path', type: 'text', label: 'Image path (manual)', admin: { description: 'Existing path or URL. Only when the library picker above is empty.' } },
        { name: 'code', type: 'text', label: 'Image code (optional)' },
      ],
    },
    // ACCESSORY verbatim tables (gaco etc.) kept pixel-faithful.
    {
      name: 'tables',
      type: 'array',
      fields: [
        { name: 'id', type: 'text' },
        { name: 'label', type: 'text' },
        { name: 'columns', type: 'array', fields: [{ name: 'column', type: 'text' }] },
        { name: 'rows', type: 'json' },
      ],
    },
  ],
}

export default Families
