import { legacyMarkersToHtml } from "@/lib/richText";

export default function ClauseHtml({ text, className }: { text: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: legacyMarkersToHtml(text) }} />;
}
