import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Área Administrativa — JB Multimarcas" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        setMsg("Conta criada. Se a confirmação por e-mail estiver ativa, verifique sua caixa de entrada. Depois peça ao suporte para liberar acesso admin.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/admin" });
      }
    } catch (e: any) {
      setErr(e.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080810", color: "#fff", padding: 24 }}>
      <form onSubmit={onSubmit} style={{ background: "#13131f", padding: 32, borderRadius: 16, width: "100%", maxWidth: 400, border: "1px solid #1e1e2e" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src="/assets/images/logo.png" alt="JB" style={{ height: 64 }} />
          <h1 style={{ marginTop: 12, fontSize: 22, fontFamily: "Outfit, sans-serif" }}>
            {mode === "login" ? "Entrar no Painel" : "Criar Conta Admin"}
          </h1>
        </div>
        <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#9aa0c0" }}>E-mail</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 12, borderRadius: 8, background: "#0f0f1a", border: "1px solid #1e1e2e", color: "#fff", marginBottom: 16 }} />
        <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#9aa0c0" }}>Senha</label>
        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 12, borderRadius: 8, background: "#0f0f1a", border: "1px solid #1e1e2e", color: "#fff", marginBottom: 16 }} />
        {err && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{err}</div>}
        {msg && <div style={{ color: "#4ade80", fontSize: 13, marginBottom: 12 }}>{msg}</div>}
        <button type="submit" disabled={loading}
          style={{ width: "100%", padding: 12, borderRadius: 8, background: "#FFC501", color: "#000", fontWeight: 700, border: "none", cursor: "pointer" }}>
          {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Cadastrar"}
        </button>
        <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}
          style={{ width: "100%", padding: 12, marginTop: 12, background: "transparent", color: "#9aa0c0", border: "none", cursor: "pointer", fontSize: 13 }}>
          {mode === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </button>
        <a href="/" style={{ display: "block", textAlign: "center", marginTop: 16, color: "#9aa0c0", fontSize: 13 }}>← Voltar ao site</a>
      </form>
    </div>
  );
}