import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { carsQueryOptions, type Car } from "@/lib/cars";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel Admin — JB Multimarcas" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

type FormState = Partial<Car> & { id?: string };

const EMPTY: FormState = {
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  km: 0,
  price: null,
  color: "",
  fuel: "Flex",
  transmission: "Automático",
  category: "seminovo",
  image_url: "",
  description: "",
  sold: false,
  featured: false,
  sort_order: 0,
};

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        navigate({ to: "/auth" });
        return;
      }
      setUserEmail(u.user.email ?? null);
      const { data: role } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      setIsAdmin(!!role);
      setAuthChecked(true);
    })();
  }, [navigate]);

  const { data: cars = [], refetch } = useQuery({ ...carsQueryOptions, enabled: authChecked });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  function resetForm() {
    setForm(EMPTY);
    setEditing(null);
    setErr(null);
  }

  function editCar(c: Car) {
    setForm({ ...c });
    setEditing(c.id);
    setErr(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const payload = {
        brand: form.brand!,
        model: form.model!,
        year: Number(form.year) || new Date().getFullYear(),
        km: Number(form.km) || 0,
        price: form.price ? Number(form.price) : null,
        color: form.color || null,
        fuel: form.fuel || null,
        transmission: form.transmission || null,
        category: form.category || "seminovo",
        image_url: form.image_url || null,
        description: form.description || null,
        sold: !!form.sold,
        featured: !!form.featured,
        sort_order: Number(form.sort_order) || 0,
      };
      if (editing) {
        const { error } = await supabase.from("cars").update(payload).eq("id", editing);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cars").insert(payload);
        if (error) throw error;
      }
      resetForm();
      await refetch();
      qc.invalidateQueries({ queryKey: ["cars"] });
    } catch (e: any) {
      setErr(e.message || "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir este veículo?")) return;
    const { error } = await supabase.from("cars").delete().eq("id", id);
    if (error) return alert(error.message);
    await refetch();
    qc.invalidateQueries({ queryKey: ["cars"] });
  }

  async function toggle(id: string, field: "sold" | "featured", value: boolean) {
    const patch = field === "sold" ? { sold: value } : { featured: value };
    const { error } = await supabase.from("cars").update(patch).eq("id", id);
    if (error) return alert(error.message);
    await refetch();
    qc.invalidateQueries({ queryKey: ["cars"] });
  }

  if (!authChecked) {
    return <div style={{ minHeight: "100vh", background: "#080810", color: "#fff", padding: 40 }}>Verificando acesso…</div>;
  }

  if (!isAdmin) {
    return (
      <div style={{ minHeight: "100vh", background: "#080810", color: "#fff", padding: 40, textAlign: "center" }}>
        <h1 style={{ fontFamily: "Outfit", fontSize: 28, marginBottom: 12 }}>Acesso restrito</h1>
        <p style={{ color: "#9aa0c0", marginBottom: 8 }}>Você está logado como <strong>{userEmail}</strong>, mas ainda não tem permissão de administrador.</p>
        <p style={{ color: "#9aa0c0", marginBottom: 24, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
          Para liberar seu acesso, um administrador precisa executar (no banco):<br />
          <code style={{ background: "#13131f", padding: 8, display: "inline-block", marginTop: 8, borderRadius: 6 }}>
            INSERT INTO public.user_roles (user_id, role) SELECT id, 'admin' FROM auth.users WHERE email = '{userEmail}';
          </code>
        </p>
        <button onClick={signOut} style={{ padding: "10px 20px", background: "#FFC501", color: "#000", fontWeight: 700, border: "none", borderRadius: 8, cursor: "pointer" }}>Sair</button>
      </div>
    );
  }

  const S = {
    input: { width: "100%", padding: 10, borderRadius: 8, background: "#0f0f1a", border: "1px solid #1e1e2e", color: "#fff", fontSize: 14 } as React.CSSProperties,
    label: { display: "block", fontSize: 12, color: "#9aa0c0", marginBottom: 4, marginTop: 10 } as React.CSSProperties,
    btn: { padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13 } as React.CSSProperties,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080810", color: "#fff", padding: "24px", fontFamily: "Inter, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <img src="/assets/images/logo.png" alt="JB" style={{ height: 48 }} />
            <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: 24 }}>Painel Admin</h1>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <a href="/" style={{ color: "#9aa0c0", textDecoration: "none" }}>← Ver site</a>
            <span style={{ color: "#9aa0c0", fontSize: 13 }}>{userEmail}</span>
            <button onClick={signOut} style={{ ...S.btn, background: "#1e1e2e", color: "#fff" }}>Sair</button>
          </div>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,420px) 1fr", gap: 24, alignItems: "start" }}>
          {/* Form */}
          <form onSubmit={save} style={{ background: "#13131f", padding: 24, borderRadius: 16, border: "1px solid #1e1e2e", position: "sticky", top: 24 }}>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 18, marginBottom: 8 }}>
              {editing ? "Editar veículo" : "Novo veículo"}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={S.label}>Marca *</label>
                <input required style={S.input} value={form.brand || ""} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Modelo *</label>
                <input required style={S.input} value={form.model || ""} onChange={(e) => setForm({ ...form, model: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Ano *</label>
                <input type="number" required style={S.input} value={form.year || ""} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
              </div>
              <div>
                <label style={S.label}>Km</label>
                <input type="number" style={S.input} value={form.km ?? 0} onChange={(e) => setForm({ ...form, km: Number(e.target.value) })} />
              </div>
              <div>
                <label style={S.label}>Preço (R$)</label>
                <input type="number" step="0.01" style={S.input} value={form.price ?? ""} onChange={(e) => setForm({ ...form, price: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div>
                <label style={S.label}>Cor</label>
                <input style={S.input} value={form.color || ""} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Combustível</label>
                <select style={S.input} value={form.fuel || ""} onChange={(e) => setForm({ ...form, fuel: e.target.value })}>
                  <option>Flex</option><option>Gasolina</option><option>Diesel</option><option>Etanol</option><option>Elétrico</option><option>Híbrido</option>
                </select>
              </div>
              <div>
                <label style={S.label}>Câmbio</label>
                <select style={S.input} value={form.transmission || ""} onChange={(e) => setForm({ ...form, transmission: e.target.value })}>
                  <option>Manual</option><option>Automático</option><option>CVT</option><option>Automatizado</option>
                </select>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={S.label}>Categoria (separe por espaço: novo, seminovo, suv, pickup)</label>
                <input style={S.input} value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={S.label}>URL da foto</label>
                <input style={S.input} value={form.image_url || ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://... ou /assets/images/car_x.png" />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={S.label}>Descrição</label>
                <textarea rows={3} style={S.input} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Ordem</label>
                <input type="number" style={S.input} value={form.sort_order ?? 0} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 20 }}>
                <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                  <input type="checkbox" checked={!!form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Destaque
                </label>
                <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                  <input type="checkbox" checked={!!form.sold} onChange={(e) => setForm({ ...form, sold: e.target.checked })} /> Vendido
                </label>
              </div>
            </div>
            {err && <div style={{ color: "#f87171", fontSize: 13, marginTop: 12 }}>{err}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button type="submit" disabled={busy} style={{ ...S.btn, flex: 1, background: "#FFC501", color: "#000" }}>
                {busy ? "Salvando..." : editing ? "Salvar alterações" : "Adicionar veículo"}
              </button>
              {editing && (
                <button type="button" onClick={resetForm} style={{ ...S.btn, background: "#1e1e2e", color: "#fff" }}>Cancelar</button>
              )}
            </div>
          </form>

          {/* List */}
          <div>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: 18, marginBottom: 12 }}>Veículos cadastrados ({cars.length})</h2>
            <div style={{ display: "grid", gap: 12 }}>
              {cars.map((c) => (
                <div key={c.id} style={{ background: "#13131f", border: "1px solid #1e1e2e", borderRadius: 12, padding: 16, display: "grid", gridTemplateColumns: "80px 1fr auto", gap: 16, alignItems: "center", opacity: c.sold ? 0.6 : 1 }}>
                  <div style={{ width: 80, height: 60, borderRadius: 8, overflow: "hidden", background: "#0f0f1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {c.image_url ? <img src={c.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <i className="fas fa-car" style={{ color: "#333", fontSize: 24 }}></i>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>
                      {c.brand} {c.model} <span style={{ color: "#9aa0c0", fontWeight: 400 }}>· {c.year}</span>
                    </div>
                    <div style={{ color: "#9aa0c0", fontSize: 13, marginTop: 4 }}>
                      {c.km.toLocaleString("pt-BR")} km · {c.category} {c.price ? `· R$ ${Number(c.price).toLocaleString("pt-BR")}` : ""}
                      {c.featured && <span style={{ color: "#FFC501", marginLeft: 8 }}>★ destaque</span>}
                      {c.sold && <span style={{ color: "#f87171", marginLeft: 8 }}>vendido</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button onClick={() => toggle(c.id, "featured", !c.featured)} style={{ ...S.btn, background: c.featured ? "#FFC501" : "#1e1e2e", color: c.featured ? "#000" : "#fff" }}>★</button>
                    <button onClick={() => toggle(c.id, "sold", !c.sold)} style={{ ...S.btn, background: c.sold ? "#f87171" : "#1e1e2e", color: "#fff" }}>{c.sold ? "Reativar" : "Vendido"}</button>
                    <button onClick={() => editCar(c)} style={{ ...S.btn, background: "#1e1e2e", color: "#fff" }}>Editar</button>
                    <button onClick={() => remove(c.id)} style={{ ...S.btn, background: "#7a1e1e", color: "#fff" }}>Excluir</button>
                  </div>
                </div>
              ))}
              {cars.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "#9aa0c0" }}>Nenhum veículo cadastrado.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}