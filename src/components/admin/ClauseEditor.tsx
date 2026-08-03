"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Bold as BoldIcon, Underline as UnderlineIcon } from "lucide-react";
import { legacyMarkersToHtml, stripOuterParagraph } from "@/lib/richText";
import { cn } from "@/lib/utils";

export default function ClauseEditor({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (html: string) => void;
  className?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        strike: false,
        italic: false,
      }),
      Underline,
    ],
    content: legacyMarkersToHtml(value),
    onUpdate: ({ editor }) => onChange(stripOuterParagraph(editor.getHTML())),
    editorProps: {
      attributes: {
        class:
          "min-h-[2.5rem] rounded-xl border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-navy prose-sm [&_p]:m-0",
      },
    },
    immediatelyRender: false,
  });

  // Tiptap only reads `content` on mount — resync if the clause changes out
  // from under us (e.g. another clause was deleted, shifting this one's index).
  useEffect(() => {
    if (!editor) return;
    const incoming = legacyMarkersToHtml(value);
    const current = stripOuterParagraph(editor.getHTML());
    if (incoming !== current) editor.commands.setContent(incoming, false);
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className={cn("flex-1", className)}>
      <div className="mb-1 flex gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
          title="Bold"
          className={cn(
            "flex size-7 items-center justify-center rounded text-foreground/60 hover:bg-navy/10 hover:text-navy",
            editor.isActive("bold") && "bg-navy/10 text-navy"
          )}
        >
          <BoldIcon className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          aria-label="Underline"
          title="Underline"
          className={cn(
            "flex size-7 items-center justify-center rounded text-foreground/60 hover:bg-navy/10 hover:text-navy",
            editor.isActive("underline") && "bg-navy/10 text-navy"
          )}
        >
          <UnderlineIcon className="size-3.5" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
