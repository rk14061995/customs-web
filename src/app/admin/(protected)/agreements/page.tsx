import { redirect } from "next/navigation";

// Agreements got folded into the combined Agreements & Documents page — keep this route around
// (rather than 404ing) for anyone with the old URL bookmarked.
export default function AdminAgreementsPage() {
  redirect("/admin/documents");
}
