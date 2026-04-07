import { redirect } from "next/navigation";
import members from "@/data/members.json";

export default function RootPage() {
  // Redirect to first member by default
  redirect(`/${members[0].id}`);
}
