import { getAuthenticatedUser } from "@/lib/auth";
import { CreatorHeaderClient } from "@/components/nav/CreatorHeaderClient";

export async function CreatorHeader() {
  const auth = await getAuthenticatedUser();
  return <CreatorHeaderClient auth={auth} />;
}
