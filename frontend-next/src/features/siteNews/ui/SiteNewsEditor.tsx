'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useCallback, useMemo, useEffect } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
} from 'lucide-react';

interface SiteNewsEditorProps {
  body: string;
  onChange: (body: string) => void;
  placeholder?: string;
  className?: string;
}

export function SiteNewsEditor({
  body,
  onChange,
  placeholder = 'Start writing...',
  className = '',
}: SiteNewsEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Image.configure({ HTMLAttributes: { class: 'rounded-lg max-w-full h-auto' } }),
      Link.configure({ openOnClick: false }),
    ],
    content: body,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose max-w-none focus:outline-none min-h-[200px] p-4',
        'data-placeholder': placeholder,
      },
    },
  });

  // Sync external body changes (e.g. locale switch)
  useEffect(() => {
    if (editor && body !== editor.getHTML()) {
      editor.commands.setContent(body || '');
    }
  }, [editor, body]);

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:');
    if (url) editor?.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const addLink = useCallback(() => {
    const url = window.prompt('Enter link URL:');
    if (url) {
      const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      editor?.chain().focus().setLink({ href: normalizedUrl }).run();
    }
  }, [editor]);

  const toolbarButtons = useMemo(
    () => [
      { icon: <Undo className="w-4 h-4" />, onClick: () => editor?.chain().focus().undo().run(), disabled: !editor?.can().undo(), title: 'Undo' },
      { icon: <Redo className="w-4 h-4" />, onClick: () => editor?.chain().focus().redo().run(), disabled: !editor?.can().redo(), title: 'Redo' },
      { type: 'separator' as const },
      { icon: <Heading1 className="w-4 h-4" />, onClick: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), isActive: editor?.isActive('heading', { level: 1 }), title: 'Heading 1' },
      { icon: <Heading2 className="w-4 h-4" />, onClick: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), isActive: editor?.isActive('heading', { level: 2 }), title: 'Heading 2' },
      { type: 'separator' as const },
      { icon: <Bold className="w-4 h-4" />, onClick: () => editor?.chain().focus().toggleBold().run(), isActive: editor?.isActive('bold'), title: 'Bold' },
      { icon: <Italic className="w-4 h-4" />, onClick: () => editor?.chain().focus().toggleItalic().run(), isActive: editor?.isActive('italic'), title: 'Italic' },
      { icon: <Strikethrough className="w-4 h-4" />, onClick: () => editor?.chain().focus().toggleStrike().run(), isActive: editor?.isActive('strike'), title: 'Strikethrough' },
      { icon: <Code className="w-4 h-4" />, onClick: () => editor?.chain().focus().toggleCode().run(), isActive: editor?.isActive('code'), title: 'Code' },
      { type: 'separator' as const },
      { icon: <List className="w-4 h-4" />, onClick: () => editor?.chain().focus().toggleBulletList().run(), isActive: editor?.isActive('bulletList'), title: 'Bullet List' },
      { icon: <ListOrdered className="w-4 h-4" />, onClick: () => editor?.chain().focus().toggleOrderedList().run(), isActive: editor?.isActive('orderedList'), title: 'Ordered List' },
      { icon: <Quote className="w-4 h-4" />, onClick: () => editor?.chain().focus().toggleBlockquote().run(), isActive: editor?.isActive('blockquote'), title: 'Blockquote' },
      { type: 'separator' as const },
      { icon: <LinkIcon className="w-4 h-4" />, onClick: addLink, isActive: editor?.isActive('link'), title: 'Add Link' },
      { icon: <ImageIcon className="w-4 h-4" />, onClick: addImage, title: 'Add Image' },
    ],
    [editor, addLink, addImage],
  );

  if (!editor) {
    return (
      <div className={`border rounded-lg ${className}`}>
        <div className="p-4 text-[var(--text-muted)]">Loading editor…</div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg ${className}`}>
      <div className="flex flex-wrap gap-1 p-2 border-b bg-[var(--surface)]">
        {toolbarButtons.map((btn, index) => {
          if ('type' in btn && btn.type === 'separator') {
            return <div key={index} className="w-px h-6 bg-[var(--border)] mx-1" />;
          }
          const b = btn as { icon: React.ReactNode; onClick: () => void; disabled?: boolean; isActive?: boolean; title: string };
          return (
            <button
              key={index}
              type="button"
              onClick={b.onClick}
              onMouseDown={(e) => e.preventDefault()}
              onPointerDown={(e) => e.preventDefault()}
              disabled={b.disabled}
              title={b.title}
              className={`h-8 w-8 inline-flex items-center justify-center rounded transition-colors ${
                b.isActive
                  ? 'bg-[var(--primary-color)]/10 text-[var(--primary-color)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg)]'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {b.icon}
            </button>
          );
        })}
      </div>
      <EditorContent editor={editor} className="prose dark:prose-invert max-w-none" />
    </div>
  );
}
