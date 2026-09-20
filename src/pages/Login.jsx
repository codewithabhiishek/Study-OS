import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabaseClient } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [botcheck, setBotcheck] = useState(false);
  const [gotcha, setGotcha] = useState("");
  const [formLoadTime] = useState(() => Date.now());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (botcheck || gotcha || Date.now() - formLoadTime < 1800) {
      return;
    }
    setError("");
    setLoading(true);
    try {
      await supabaseClient.auth.loginViaEmailPassword(email, password);
      window.location.href = "/today";
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    supabaseClient.auth.loginWithProvider("google", "/today");
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Welcome back"
      subtitle="Log in to your account"
      footer={
        <>
          {"Don't have an account?"}{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">or</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

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
          <Label htmlFor="email">Email</Label>
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              maxLength={128}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value.slice(0, 128))}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
