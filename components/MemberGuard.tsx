"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

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

    // Unmapped email — let them view the page they landed on (no restriction)
  }, [myMemberId, memberId, loading, router]);

  // While redirecting, show nothing (no flash of other member's data)
  if (!loading && myMemberId && myMemberId !== memberId) {
    return null;
  }

  return <>{children}</>;
}
