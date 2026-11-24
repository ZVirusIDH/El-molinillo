import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Unlink,
  RemoveFormatting,
} from 'lucide-react';

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export const EditorTextoEnriquecido: React.FC<Props> = ({
  content,
  onChange,
  placeholder = 'Escriba o pegue aquí el texto desde Word, Docs o PDF...',
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-emerald-700 underline font-medium hover:text-emerald-900',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'min-h-[160px] max-h-[420px] overflow-y-auto px-4 py-3 focus:outline-none text-xs text-slate-800 leading-relaxed space-y-2',
      },
    },
  });

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Introduce la dirección web (URL):', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="border border-slate-300 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-emerald-600 focus-within:border-emerald-600 transition shadow-sm">
      {/* Barra de herramientas */}
      <div className="bg-slate-50 border-b border-slate-200 p-1.5 flex flex-wrap items-center gap-1">
        {/* Deshacer / Rehacer */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Deshacer (Ctrl+Z)"
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded disabled:opacity-30 transition"
        >
          <Undo className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Rehacer (Ctrl+Y)"
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded disabled:opacity-30 transition"
        >
          <Redo className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-slate-300 mx-1" />

        {/* Encabezados */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Título Principal (H1)"
          className={`p-1.5 rounded transition ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-emerald-100 text-emerald-900 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Subtítulo (H2)"
          className={`p-1.5 rounded transition ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-emerald-100 text-emerald-900 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Apartado (H3)"
          className={`p-1.5 rounded transition ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-emerald-100 text-emerald-900 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-slate-300 mx-1" />

        {/* Formatos de texto */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Negrita (Ctrl+B)"
          className={`p-1.5 rounded transition ${
            editor.isActive('bold')
              ? 'bg-emerald-100 text-emerald-900 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Cursiva (Ctrl+I)"
          className={`p-1.5 rounded transition ${
            editor.isActive('italic')
              ? 'bg-emerald-100 text-emerald-900'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Subrayado (Ctrl+U)"
          className={`p-1.5 rounded transition ${
            editor.isActive('underline')
              ? 'bg-emerald-100 text-emerald-900'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Tachado"
          className={`p-1.5 rounded transition ${
            editor.isActive('strike')
              ? 'bg-emerald-100 text-emerald-900'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-slate-300 mx-1" />

        {/* Listas y Citas */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Lista con viñetas"
          className={`p-1.5 rounded transition ${
            editor.isActive('bulletList')
              ? 'bg-emerald-100 text-emerald-900'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Lista numerada"
          className={`p-1.5 rounded transition ${
            editor.isActive('orderedList')
              ? 'bg-emerald-100 text-emerald-900'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Nota o Cita oficial"
          className={`p-1.5 rounded transition ${
            editor.isActive('blockquote')
              ? 'bg-emerald-100 text-emerald-900'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-slate-300 mx-1" />

        {/* Enlace */}
        <button
          type="button"
          onClick={setLink}
          title="Insertar enlace web"
          className={`p-1.5 rounded transition ${
            editor.isActive('link')
              ? 'bg-emerald-100 text-emerald-900 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>
        {editor.isActive('link') && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Quitar enlace"
            className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-slate-200 rounded transition"
          >
            <Unlink className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="w-[1px] h-4 bg-slate-300 mx-1" />

        {/* Limpiar formato */}
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          title="Limpiar formato"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition"
        >
          <RemoveFormatting className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Área editable */}
      <EditorContent editor={editor} />

      {/* Pie informativo de pegado inteligente */}
      <div className="bg-slate-50 border-t border-slate-200 px-3 py-1.5 text-[11px] text-slate-500 flex items-center justify-between">
        <span>
          Pegado inteligente activo: conserva negritas, encabezados, listas y enlaces desde Word, Google Docs o PDFs.
        </span>
        <span className="font-mono text-slate-400">
          {editor.storage.characterCount?.characters?.() || editor.getText().length} caracteres
        </span>
      </div>
    </div>
  );
};
