import type { CollectionConfig } from 'payload'
import type { ReusableContent } from '@payloadcms/plugin-form-builder/types' // no: form builder unused

// Blocks = free drop-in structure for reusable content blocks / spec tables /
// load tables / model tables emitted by the frozen Phase-0/1 exporters ONLY.
export const ContentBlock: Block = {
  slug: 'content',
  interfaceName: 'ContentBlock',
  fields: [{ name: 'body', type: 'richText' }],
}

export const SpecTableBlock: Block = {
  slug: 'specTable',
  interfaceName: 'SpecTableBlock',
  fields: [
    { name: 'caption', type: 'text' },
    { name: 'rows', type: 'array', fields: [{ type: 'text', name: 'key' }, { type: 'text', name: 'value' }] },
  ],
}

export const LoadTableBlock: Block = {
  slug: 'loadTable',
  interfaceName: 'LoadTableBlock',
  fields: [
    { name: 'case', type: 'text' },
    { name: 'spans', type: 'array', fields: [{ type: 'number', name: 'mm' }, { type: 'number', name: 'kN' }] },
  ],
}

const Blocks: CollectionConfig = {
  slug: 'blocks',
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user?.isAdmin),
    update: ({ req }) => Boolean(req.user?.isAdmin),
    delete: ({ req }) => Boolean(req.user?.isAdmin),
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'content', type: 'blocks', blocks: [ContentBlock, SpecTableBlock, LoadTableBlock] },
  ],
}
export default Blocks
