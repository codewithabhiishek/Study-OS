import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabaseClient } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [botcheck, setBotcheck] = useState(false);
  const [gotcha, setGotcha] = useState("");
  const [formLoadTime] = useState(() => Date.now());
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (botcheck || gotcha || Date.now() - formLoadTime < 1800) {
      setSent(true);
      return;
    }
    setLoading(true);
    try {
      await supabaseClient.auth.resetPasswordRequest(email);
    } catch {
      // Always show success regardless
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthLayout
      icon={Mail}
      title="Reset password"
      subtitle="We'll send you a link to reset it"
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1" />Back to log in
        </Link>
      }
    >
      {sent ? (
        <p className="text-sm text-foreground text-center">
          {"If an account exists with that email, you'll receive a password reset link shortly."}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dual Honeypot defense */}
          <input
            type="checkbox"
            name="botcheck"
            checked={botcheck}
            onChange={(e) => setBotcheck(e.target.checked)}
            style={{ display: "none" }}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <input
            type="text"
            name="_gotcha"
            value={gotcha}
            onChange={(e) => setGotcha(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            style={{ position: "absolute", left: "-9999px", opacity: 0 }}
            aria-hidden="true"
          />
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                maxLength={254}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value.replace(/<[^>]*>?/gm, "").slice(0, 254))}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
