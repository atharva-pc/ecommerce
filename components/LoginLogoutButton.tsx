"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Button } from "./ui/button";
import type { ButtonProps } from "./ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { signout } from "@/lib/auth-actions";
import type { User } from "@supabase/supabase-js";

const LoginButton: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user as User | null);
    };
    fetchUser();
  }, [supabase]);
  if (user) {
    return (
      <Button
        onClick={() => {
          signout();
          setUser(null);
        }}
      >
        Log out
      </Button>
    );
  }
  return (
    <Button
      {...({ variant: "outline", onClick: () => router.push("/login") } as ButtonProps)}
    >
      Login
    </Button>
  );
};

export default LoginButton;
