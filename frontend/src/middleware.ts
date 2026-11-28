import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Merge duplicate entry points cleanly
  if (pathname === "/careers/my-applications") {
    return NextResponse.redirect(new URL("/candidate/applications", request.url));
  }
  if (pathname === "/careers/profile") {
    return NextResponse.redirect(new URL("/candidate/profile", request.url));
  }
  if (pathname === "/careers/auth") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname === "/recruiter/dashboard") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (pathname === "/recruiter/pipeline") {
    return NextResponse.redirect(new URL("/kanban", request.url));
  }

  // 2. Public Job Requisitions: Anyone can browse jobs and job details without logging in
  const isPublicJobRoute =
    pathname === "/careers/jobs" ||
    pathname === "/candidate/jobs" ||
    (pathname.startsWith("/careers/jobs/") && !pathname.endsWith("/apply")) ||
    (pathname.startsWith("/candidate/jobs/") && !pathname.endsWith("/apply"));

  if (isPublicJobRoute) {
    return NextResponse.next();
  }

  // 3. Server-side session verification via Supabase Auth
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  let isAuthenticated = false;
  let userRole: "candidate" | "recruiter" | "anonymous" = "anonymous";

  if (supabaseUrl && supabaseKey) {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (user && !userErr) {
        isAuthenticated = true;

        // Resolve role from server-controlled company_members / users table
        const { data: member } = await supabase
          .from("company_members")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (member?.role && ["recruiter", "admin", "hiring_manager", "interviewer"].includes(member.role)) {
          userRole = "recruiter";
        } else {
          const { data: uRec } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

          if (uRec?.role && ["recruiter", "admin", "hiring_manager", "interviewer"].includes(uRec.role)) {
            userRole = "recruiter";
          } else {
            userRole = "candidate";
          }
        }
      }
    } catch {
      // Session verification failed
    }
  }

  // 4. Fallback check for local development session cookies
  if (!isAuthenticated) {
    const authCookie = request.cookies.get("ts_auth")?.value;
    const roleCookie = request.cookies.get("ts_role")?.value;
    if (authCookie === "true" && roleCookie) {
      isAuthenticated = true;
      userRole = roleCookie === "candidate" ? "candidate" : "recruiter";
    }
  }

  // Protected recruiter routes
  const isRecruiterRoute =
    pathname === "/dashboard" ||
    pathname.startsWith("/jobs") ||
    pathname.startsWith("/candidates") ||
    pathname.startsWith("/kanban") ||
    pathname.startsWith("/outbox") ||
    pathname.startsWith("/screening") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/interviews") ||
    pathname.startsWith("/offers") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/pipeline");

  // Protected candidate routes (including application submission)
  const isCandidateRoute =
    pathname.startsWith("/candidate") ||
    pathname.endsWith("/apply");

  // 5. Unauthenticated access protection
  if ((isRecruiterRoute || isCandidateRoute) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 6. Cross-role enforcement
  if (isAuthenticated) {
    // Candidate attempting to access Recruiter routes
    if (userRole === "candidate" && isRecruiterRoute) {
      return NextResponse.redirect(new URL("/candidate/jobs", request.url));
    }

    // Recruiter attempting to access Candidate portal
    if (userRole === "recruiter" && pathname.startsWith("/candidate")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/jobs/:path*",
    "/candidates/:path*",
    "/kanban/:path*",
    "/outbox/:path*",
    "/screening/:path*",
    "/analytics/:path*",
    "/interviews/:path*",
    "/offers/:path*",
    "/settings/:path*",
    "/notifications/:path*",
    "/pipeline/:path*",
    "/recruiter/:path*",
    "/candidate/:path*",
    "/careers/:path*",
  ],
};
