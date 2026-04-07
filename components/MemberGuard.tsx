"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import members from "@/data/members.json";

interface MemberGuardProps {
  memberId: string;
  children: React.ReactNode;
}

export default function MemberGuard({ memberId, children }: MemberGuardProps) {
  const { memberId: myMemberId, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // If we know who they are and it's not this page, redirect
    if (myMemberId && myMemberId !== memberId) {
      router.replace(`/${myMemberId}`);
      return;
    }

    // If they're logged in but not mapped to any member, send to first member
    if (!myMemberId && !loading) {
      router.replace(`/${members[0].id}`);
    }
  }, [myMemberId, memberId, loading, router]);

  // While redirecting, show nothing (no flash of other member's data)
  if (!loading && myMemberId && myMemberId !== memberId) {
    return null;
  }

  return <>{children}</>;
}
