import React, { useState } from "react";
import { API_URL } from "./Constants";

export default function Perfil({ user, setUser, onVoltar }) {
  const [nome, setNome] = useState(user.nome || "");
  const [avatar, setAvatar] = useState(user.avatar || "lorelei");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const modelos = [
    { id: "lorelei",         nome: "Casual",     url: `https://api.dicebear.com/7.x/lorelei/svg?seed=${user.email}` },
    { id: "personas",        nome: "Persona",    url: `https://api.dicebear.com/7.x/personas/svg?seed=${user.email}` },
    { id: "open-peeps",      nome: "Sketch",     url: `https://api.dicebear.com/7.x/open-peeps/svg?seed=${user.email}` },
    { id: "big-smile",       nome: "Expressivo", url: `https://api.dicebear.com/7.x/big-smile/svg?seed=${user.email}` },
    { id: "bottts-neutral",  nome: "Tech",       url: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${user.email}` },
  ];

  const avatarAtual = modelos.find((m) => m.id === avatar)?.url || modelos[0].url;

  const salvarPerfil = async () => {
    if (!nome.trim()) { setMsg({ tipo: "erro", txt: "Nome não pode estar vazio." }); return; }
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`${API_URL}/aluno/perfil`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ email: user.email, nome: nome.trim(), avatar }),
      });
      const data = await res.json();
      if (res.ok) {
        const updated = { ...user, nome: nome.trim(), avatar };
        setUser(updated);
        localStorage.setItem("juventudetech_session", JSON.stringify({ userData: updated, timestamp: Date.now() }));
        localStorage.setItem("juventudetech_remember", JSON.stringify({ email: updated.email, nome: updated.nome, formacao: updated.formacao, dataNasc: "" }));
        setMsg({ tipo: "ok", txt: "Perfil atualizado com sucesso!" });
      } else {
        setMsg({ tipo: "erro", txt: data.error || "Erro ao salvar." });
      }
    } catch {
      setMsg({ tipo: "erro", txt: "Erro de conexão." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "32px auto", padding: "0 20px", animation: "fadeInUp .4s ease" }}>
      <button className="btn-ghost mb-16" onClick={onVoltar} style={{ paddingLeft: 0 }}>
        ← Voltar
      </button>
      <div className="shadow-card p-24">
        <h2 className="font-display mb-24" style={{ fontSize: "1.2rem", fontWeight: 700 }}>Meu Perfil</h2>

        {/* AVATAR */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <div style={{ width: 90, height: 90, borderRadius: "50%", overflow: "hidden", border: "3px solid var(--accent)", marginBottom: 16, background: "var(--bg-surface)" }}>
            <img src={avatarAtual} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div className="avatar-grid" style={{ justifyContent: "center" }}>
            {modelos.map((m) => (
              <div key={m.id} className={`avatar-option ${avatar === m.id ? "selected" : ""}`} onClick={() => setAvatar(m.id)} title={m.nome}>
                <img src={m.url} alt={m.nome} />
              </div>
            ))}
          </div>
        </div>

        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-dim)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Nome completo
        </label>
        <input
          className="input-modern"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome completo"
        />

        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-dim)", marginBottom: 6, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          E-mail
        </label>
        <input className="input-modern" value={user.email} readOnly style={{ opacity: 0.6 }} />

        {msg && (
          <div style={{
            padding: "10px 14px", borderRadius: "var(--radius-sm)",
            background: msg.tipo === "ok" ? "var(--success-bg)" : "var(--danger-bg)",
            color: msg.tipo === "ok" ? "var(--success)" : "var(--danger)",
            fontSize: "0.84rem", marginBottom: 12,
          }}>
            {msg.txt}
          </div>
        )}

        <button className="btn-ponto in w-full" onClick={salvarPerfil} disabled={loading}>
          {loading ? "Salvando..." : "Salvar Perfil"}
        </button>
      </div>
    </div>
  );
}
