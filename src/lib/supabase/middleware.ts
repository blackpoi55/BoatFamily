import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const FORWARD_USER_HEADER = "x-mw-user-id";

export async function updateSession(request: NextRequest) {
  // Strip any client-supplied forwarding header so it can't be spoofed
  request.headers.delete(FORWARD_USER_HEADER);

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    request.headers.set(FORWARD_USER_HEADER, user.id);
    response = NextResponse.next({ request });
  }

  return { response, user };
}

export { FORWARD_USER_HEADER };
