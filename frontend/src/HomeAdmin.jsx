import React, { useState, useEffect, useCallback } from "react";
import { API_URL, FORMACOES, CRONOGRAMAS, TEMAS_AULOES, formatarDataBR } from "./Constants";

const COR_FORMACAO = {
  fullstack: { bar: "#2a3fae", text: "#93b4ff" },
  "ia-gen":  { bar: "#3882ff", text: "#8fc1ff" },
  "mkt-dig": { bar: "#15215e", text: "#7d96e8" },
};

function DonutChart({ pct, cor, label }) {
  const r = 48;
  const circ = 2 * Math.PI * r;
  const fill = Math.min(100, Math.max(0, pct));
  const dash = (fill / 100) * circ;

  return (
    <div className="donut-wrap">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r}
          fill="none"
          stroke={cor}
          strokeWidth="10"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s ease" }}
        />
      </svg>
      <div className="donut-label">
        <span className="donut-pct" style={{ color: cor }}>{fill}%</span>
        <span className="donut-sub">{label}</span>
      </div>
    </div>
  );
}

export default function HomeAdmin({ user }) {
  const [stats, setStats] = useState({ totalAlunos: 0, sessoesAtivas: 0, concluidosHoje: 0, pendentesSaida: 0 });
  const [alunosAtivos, setAlunosAtivos] = useState([]);
  const [auditoria, setAuditoria] = useState([]);
  const [loading, setLoading] = useState(true);

  const obterProximosEncontros = () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return FORMACOES.map((f) => {
      const datas = CRONOGRAMAS[f.id] || [];
      const proxima = datas.find((d) => new Date(d + "T12:00:00") >= hoje);
      if (!proxima) return { ...f, data: null, pauta: "Cronograma concluído." };
      return {
        ...f,
        data: formatarDataBR(proxima),
        pauta: TEMAS_AULOES[f.id]?.[proxima] || "Aulão conforme cronograma Juventude Tech.",
      };
    });
  };

  const proximosEncontros = obterProximosEncontros();

  const carregarDashboard = useCallback(async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const hoje = new Date().toISOString().split("T")[0];
      const headers = { Authorization: `Bearer ${user.token}` };

      const [resStats, resLista, resAuditoria] = await Promise.all([
        fetch(`${API_URL}/admin/stats/todos?dataFiltro=${hoje}`, { headers }),
        fetch(`${API_URL}/admin/busca?termo=&turma=todos&status=presentes_no_dia&dataFiltro=${hoje}`, { headers }),
        fetch(`${API_URL}/admin/auditoria?turma=todos`, { headers }),
      ]);

      if (resStats.ok) setStats(await resStats.json());
      if (resLista.ok) {
        const d = await resLista.json();
        setAlunosAtivos((d.alunos || []).filter((a) => !a.check_out));
      }
      if (resAuditoria.ok) {
        const d = await resAuditoria.json();
        setAuditoria(d.alunos || []);
      }
    } catch (err) {
      console.error("Erro dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    carregarDashboard();
    const interval = setInterval(carregarDashboard, 60000);
    return () => clearInterval(interval);
  }, [carregarDashboard]);

  // Frequência por curso baseada na auditoria
  const freqPorCurso = FORMACOES.map((f) => {
    const alunos = auditoria.filter((a) => a.formacao === f.id);
    const totalAulas = CRONOGRAMAS[f.id]?.length || 1;
    const totalPresencas = alunos.reduce((s, a) => s + (a.total_presencas || 0), 0);
    const possivel = alunos.length * totalAulas;
    const pct = possivel > 0 ? Math.round((totalPresencas / possivel) * 100) : 0;
    return { ...f, alunos: alunos.length, presencas: totalPresencas, pct };
  });

  const presencaGlobal = stats.totalAlunos > 0
    ? Math.round((stats.sessoesAtivas / stats.totalAlunos) * 100)
    : 0;

  const formatHora = (v) => {
    if (!v) return "--:--";
    return v.includes("T") ? v.split("T")[1].substring(0, 5) : v.substring(0, 5);
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px", animation: "fadeInUp .4s ease" }}>
      {/* HERO HEADER */}
      <div className="admin-header-card mb-24">
        <div className="flex justify-between items-center" style={{ flexWrap: "wrap", gap: 16 }}>
          <div>
            <span className="text-accent text-xs fw-bold" style={{ letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Painel de Controle · Juventude Tech
            </span>
            <h1 className="font-display" style={{ fontSize: "2rem", fontWeight: 800, marginTop: 6 }}>
              Olá, {user?.nome?.split(" ")[0] || "Instrutor"}! 🚀
            </h1>
          </div>
          <button
            onClick={carregarDashboard}
            disabled={loading}
            className="btn-accent"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <span className="loading-spinner" style={{ width: 16, height: 16 }} /> : "🔄"} Atualizar
          </button>
        </div>

        {/* STATS */}
        <div className="admin-stats-grid mt-20">
          {[
            { label: "Check-ins Hoje", val: stats.sessoesAtivas, cor: "var(--accent)", sub: "Alunos presentes" },
            { label: "Pendentes Saída", val: stats.pendentesSaida, cor: "var(--warning)", sub: "Sessões em aberto" },
            { label: "Concluídos Hoje", val: stats.concluidosHoje, cor: "var(--success)", sub: "Check-out realizado" },
            { label: "Total de Alunos", val: stats.totalAlunos, cor: "var(--text-main)", sub: "Base Juventude Tech" },
          ].map((s, i) => (
            <div key={i} className="admin-stat">
              <div className="admin-stat-label">{s.label}</div>
              <div className="admin-stat-value" style={{ color: s.cor }}>{s.val}</div>
              <div className="admin-stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* ALUNOS ATIVOS */}
        <div className="shadow-card p-24">
          <div className="section-header">
            <span className="section-title">⚡ Alunos no Prédio Agora</span>
            <span className="section-count">{alunosAtivos.length}</span>
          </div>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <span className="loading-spinner" />
            </div>
          ) : alunosAtivos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px 0", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "2rem", marginBottom: 12 }}>👥</div>
              <p>Nenhum check-in registrado hoje.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 340, overflowY: "auto" }}>
              {alunosAtivos.map((aluno, i) => {
                const cor = COR_FORMACAO[aluno.formacao]?.bar || "#888";
                return (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 14px", background: "var(--bg-surface)", borderRadius: "var(--radius-md)",
                    borderLeft: `4px solid ${cor}`,
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{aluno.nome || aluno.email}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                        {FORMACOES.find((f) => f.id === aluno.formacao)?.nome || aluno.formacao}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "var(--accent)", fontWeight: 700, fontSize: "0.9rem" }}>{formatHora(aluno.check_in)}</div>
                      <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Entrada</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* COLUNA DIREITA */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* ENGAJAMENTO */}
          <div className="shadow-card p-24">
            <div className="section-title mb-16">📊 Engajamento Global</div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <DonutChart pct={presencaGlobal} cor="var(--accent)" label="Hoje" />
            </div>
            <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
              {freqPorCurso.map((f) => (
                <div key={f.id}>
                  <div className="flex justify-between mb-8" style={{ fontSize: "0.78rem" }}>
                    <span style={{ color: COR_FORMACAO[f.id]?.text }}>{f.nome}</span>
                    <span className="fw-bold">{f.alunos} alunos</span>
                  </div>
                  <div className="presence-bar">
                    <div
                      className="presence-bar-fill"
                      style={{
                        width: `${f.pct}%`,
                        background: COR_FORMACAO[f.id]?.bar || "var(--primary)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PRÓXIMOS ENCONTROS */}
          <div className="shadow-card p-24" style={{ borderLeft: "4px solid var(--warning)" }}>
            <div className="section-title mb-12" style={{ color: "var(--warning)" }}>📅 Próximos Aulões (por curso)</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {proximosEncontros.map((f) => (
                <div key={f.id} style={{ background: "var(--warning-bg)", borderRadius: "var(--radius-md)", padding: "12px 16px", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>{f.nome}</span>
                    <span className="font-display" style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--warning)" }}>{f.data || "—"}</span>
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", lineHeight: 1.4, margin: 0 }}>{f.pauta}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FREQ POR CURSO - BARRAS */}
      <div className="chart-container">
        <div className="chart-title">📈 Taxa de Frequência Acumulada por Curso</div>
        <div className="bar-chart">
          {freqPorCurso.map((f) => (
            <div key={f.id} className="bar-group">
              <div className="bar-val">{f.pct}%</div>
              <div className="bar-fill" style={{ height: `${f.pct}%`, background: COR_FORMACAO[f.id]?.bar, minHeight: 4 }} />
              <div className="bar-label">{f.nome.split(" ")[0]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
