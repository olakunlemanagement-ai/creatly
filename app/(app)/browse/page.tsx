// Placeholder — catalogue content is built in step 1.4.
import { getAuthenticatedUser } from "@/lib/auth";
import { LogoutButton } from "@/components/shared/LogoutButton";
import { APP_NAME } from "@/lib/config";

export default async function BrowsePage() {
  const auth = await getAuthenticatedUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold">{APP_NAME}</h1>
      {auth ? (
        <>
          <p className="text-muted-foreground">
            Welcome, {auth.profile.full_name ?? auth.user.email}
          </p>
          <LogoutButton />
        </>
      ) : (
        <p className="text-muted-foreground">Browse page — catalogue coming in step 1.4.</p>
      )}
    </div>
  );
}
