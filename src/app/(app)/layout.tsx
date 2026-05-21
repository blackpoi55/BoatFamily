import { requireUserWithUnread } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { UserMenu } from "@/components/user-menu";
import { NotificationsBell } from "@/components/notifications-bell";
import { SideNav } from "@/components/side-nav";
import { PermissionPrompt } from "@/components/permission-prompt";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUserWithUnread();
  const unread = user.unreadCount;
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

  return (
    <div className="flex h-dvh">
      <PermissionPrompt vapidPublicKey={vapidPublicKey} />
      <SideNav user={user} unreadCount={unread} />
      <div className="flex h-dvh min-w-0 flex-1 flex-col">
        <div className="lg:hidden">
          <AppHeader
            right={
              <>
                <NotificationsBell initialUnread={unread} userId={user.id} />
                <UserMenu
                  name={user.name}
                  email={user.email}
                  avatarUrl={user.avatarUrl}
                  isAdmin={user.role === "ADMIN"}
                />
              </>
            }
          />
        </div>
        <main className="mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col overflow-y-auto lg:max-w-5xl">
          {children}
        </main>
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
