import React, { useState, useEffect, useCallback } from "react";
import { fetchComToken } from "./Api";
import { API_URL, FORMACOES, obterDatasOcorridas, obterAulasOcorridas } from "./Constants";

const calcularFaltas = (aluno) => {
  const totalAulas = obterAulasOcorridas(aluno.formacao);
  const presencas = Math.min(aluno.total_presencas || 0, totalAulas);
  const brutas = Math.max(0, totalAulas - presencas);
  if (aluno.se_ausenta_sempre || aluno.justificou_ausencia) return { totalAulas, presencas, faltas: 0, justificado: true };
  const abonos = aluno.saldo_abonos || 0;
  return { totalAulas, presencas, faltas: abonos > 0 ? Math.max(0, brutas - abonos) : brutas, justificado: false };
};

const getStatus = (aluno) => {
  if (aluno.se_ausenta_sempre || aluno.justificativa_ativa) return "JUSTIFICADO";
  const { faltas, totalAulas } = calcularFaltas(aluno);
  if (totalAulas === 0) return "SEM_AULAS";
  const pct = (faltas / totalAulas) * 100;
  if (pct === 0) return "REGULAR";
  if (pct <= 25) return "ATENCAO";
  return "CRITICO";
};

const formatHora = (v) => {
  if (!v) return "--:--";
  return v.includes("T") ? v.split("T")[1].substring(0, 5) : String(v).substring(0, 5);
};

export default function GestaoRapida({ user, setView }) {
  const [alunos, setAlunos] = useState([]);
  const [filtroTurma, setFiltroTurma] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [statusSalva, setStatusSalva] = useState({});

  // Modal
  const [modalAluno, setModalAluno] = useState(null);
  const [historicoModal, setHistoricoModal] = useState([]);
  const [tabModal, setTabModal] = useState("historico");
  const [dadosEdicao, setDadosEdicao] = useState({ nome: "", email: "", data_nascimento: "" });
  const [manualPonto, setManualPonto] = useState({ data: new Date().toISOString().split("T")[0], check_in: "08:00", check_out: "12:00" });
  const [loadModal, setLoadModal] = useState(false);

  const carregarTodos = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await fetchComToken(`/admin/busca?termo=&turma=todos&status=todos&_=${Date.now()}`);
      if (!res.ok) throw new Error();
      const d = await res.json();
      setAlunos((d.alunos || []).map((a) => ({ ...a, nome: a.nome || "", total_presencas: a.total_presencas || 0 })));
    } catch { alert("Erro ao carregar alunos."); } finally { setCarregando(false); }
  }, []);

  useEffect(() => { carregarTodos(); }, [carregarTodos]);

  const alunosFiltrados = alunos.filter((a) => {
    if (filtroTurma !== "todos" && a.formacao !== filtroTurma) return false;
    if (busca) {
      const q = busca.toLowerCase();
      if (!(a.nome || "").toLowerCase().includes(q) && !a.email.toLowerCase().includes(q)) return false;
    }
    if (filtroStatus !== "todos") {
      const st = getStatus(a);
      if (filtroStatus === "critico" && st !== "CRITICO") return false;
      if (filtroStatus === "atencao" && st !== "ATENCAO") return false;
      if (filtroStatus === "regular" && st !== "REGULAR") return false;
      if (filtroStatus === "justificado" && st !== "JUSTIFICADO") return false;
    }
    return true;
  });

  // Resumo por status
  const resumo = { regular: 0, atencao: 0, critico: 0, justificado: 0 };
  alunos.forEach((a) => {
    const s = getStatus(a);
    if (s === "REGULAR") resumo.regular++;
    else if (s === "ATENCAO") resumo.atencao++;
    else if (s === "CRITICO") resumo.critico++;
    else if (s === "JUSTIFICADO") resumo.justificado++;
  });

  const salvarNome = async (email, nome) => {
    setStatusSalva((prev) => ({ ...prev, [email]: "salvando" }));
    try {
      const res = await fetchComToken("/admin/limpeza-nome", "PATCH", { email, nome: nome.trim() });
      setStatusSalva((prev) => ({ ...prev, [email]: res.ok ? "ok" : "erro" }));
      setTimeout(() => setStatusSalva((prev) => ({ ...prev, [email]: null })), 2000);
    } catch { setStatusSalva((prev) => ({ ...prev, [email]: "erro" })); }
  };

  const abrirModal = async (aluno) => {
    setModalAluno(aluno);
    setTabModal("historico");
    setDadosEdicao({ nome: aluno.nome || "", email: aluno.email, data_nascimento: aluno.data_nascimento || "" });
    setLoadModal(true);
    try {
      const res = await fetch(`${API_URL}/historico/aluno/${aluno.email}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) setHistoricoModal(await res.json());
    } catch {} finally { setLoadModal(false); }
  };

  const salvarEdicao = async () => {
    setLoadModal(true);
    try {
      const res = await fetch(`${API_URL}/admin/aluno/${encodeURIComponent(modalAluno.email)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(dadosEdicao),
      });
      if (res.ok) { alert("Salvo!"); setModalAluno(null); carregarTodos(); }
      else { const e = await res.json(); alert(e.error); }
    } catch { alert("Erro."); } finally { setLoadModal(false); }
  };

  const registrarManual = async () => {
    if (!confirm("Registrar ponto manual?")) return;
    try {
      const res = await fetch(`${API_URL}/admin/ponto-manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ email: modalAluno.email, ...manualPonto }),
      });
      if (res.ok) { alert("Registrado!"); abrirModal(modalAluno); }
      else { const e = await res.json(); alert(e.error); }
    } catch { alert("Erro."); }
  };

  const excluirAluno = async () => {
    if (!confirm(`EXCLUIR PERMANENTEMENTE ${modalAluno.nome || modalAluno.email}?`)) return;
    setLoadModal(true);
    try {
      const res = await fetch(`${API_URL}/admin/aluno/${encodeURIComponent(modalAluno.email)}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) { alert("Excluído."); setModalAluno(null); carregarTodos(); }
      else { const e = await res.json(); alert(e.error); }
    } catch { alert("Erro."); } finally { setLoadModal(false); }
  };

  const exportarTudoCSV = () => {
    const header = "Nome;Email;Formação;Total Aulas;Presenças;Faltas;Status\n";
    const rows = alunosFiltrados.map((a) => {
      const { totalAulas, presencas, faltas } = calcularFaltas(a);
      const st = getStatus(a);
      const forma = FORMACOES.find((f) => f.id === a.formacao)?.nome || a.formacao || "";
      return `${a.nome || ""};${a.email};${forma};${totalAulas};${presencas};${faltas};${st}`;
    }).join("\n");
    const blob = new Blob(["\ufeff" + header + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `gestao_alunos_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const getStatusStyle = (status) => {
    if (status === "REGULAR")     return { pill: "ok",      label: "✓ Regular" };
    if (status === "ATENCAO")     return { pill: "warn",    label: "⚠ Atenção" };
    if (status === "CRITICO")     return { pill: "danger",  label: "✗ Crítico" };
    if (status === "JUSTIFICADO") return { pill: "info",    label: "✓ Justif." };
    return                               { pill: "neutral", label: "—" };
  };

  return (
    <div className="gestao-wrapper">
      {/* HEADER */}
      <div className="shadow-card p-24 mb-20" style={{ borderLeft: "5px solid var(--accent)" }}>
        <div className="flex justify-between items-center" style={{ flexWrap: "wrap", gap: 12 }}>
          <div>
            <span className="text-accent text-xs fw-bold" style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Edição & Gestão
            </span>
            <h2 className="font-display" style={{ fontSize: "1.4rem", fontWeight: 800, marginTop: 4 }}>
              Controle de Alunos
            </h2>
          </div>
          <div className="flex gap-8">
            <button className="btn-secondary" onClick={carregarTodos} disabled={carregando}>
              {carregando ? "..." : "🔄 Recarregar"}
            </button>
            <button className="btn-accent" onClick={exportarTudoCSV}>
              ⬇ Exportar CSV
            </button>
          </div>
        </div>

        {/* CARDS RESUMO */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 20 }}>
          {[
            { label: "Regulares",    val: resumo.regular,     cor: "var(--success)", filter: "regular" },
            { label: "Atenção",      val: resumo.atencao,     cor: "var(--warning)", filter: "atencao" },
            { label: "Críticos",     val: resumo.critico,     cor: "var(--danger)",  filter: "critico" },
            { label: "Justificados", val: resumo.justificado, cor: "var(--info)",    filter: "justificado" },
          ].map((c) => (
            <div
              key={c.filter}
              onClick={() => setFiltroStatus(filtroStatus === c.filter ? "todos" : c.filter)}
              style={{
                background: filtroStatus === c.filter ? `${c.cor}22` : "var(--bg-surface)",
                border: `1px solid ${filtroStatus === c.filter ? c.cor : "var(--border)"}`,
                borderRadius: "var(--radius-md)", padding: "14px",
                textAlign: "center", cursor: "pointer", transition: "all var(--transition)",
              }}
            >
              <div className="font-display" style={{ fontSize: "1.8rem", fontWeight: 800, color: c.cor }}>{c.val}</div>
              <div className="text-xs text-muted">{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FILTROS */}
      <div className="filtros-bar mb-16">
        <input className="input-modern" style={{ marginBottom: 0 }} placeholder="🔍 Buscar nome ou e-mail..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        <select className="input-modern" style={{ marginBottom: 0 }} value={filtroTurma} onChange={(e) => setFiltroTurma(e.target.value)}>
          <option value="todos">Todas as Turmas</option>
          {FORMACOES.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
        </select>
      </div>

      {/* TABELA */}
      <div className="shadow-card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="section-title">
            Alunos
            <span className="section-count">{alunosFiltrados.length}</span>
          </span>
          {carregando && <span className="loading-spinner" />}
        </div>
        <div style={{ overflowX: "auto" }}>
          {alunosFiltrados.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
              {carregando ? "Carregando..." : "Nenhum aluno encontrado."}
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nome / E-mail</th>
                  <th>Turma</th>
                  <th>Frequência</th>
                  <th>Faltas</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {alunosFiltrados.map((aluno, i) => {
                  const { totalAulas, presencas, faltas, justificado } = calcularFaltas(aluno);
                  const pct = totalAulas > 0 ? Math.round((presencas / totalAulas) * 100) : 0;
                  const cor = pct >= 75 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--danger)";
                  const st = getStatus(aluno);
                  const { pill, label } = getStatusStyle(st);
                  const formacao = FORMACOES.find((f) => f.id === aluno.formacao);

                  return (
                    <tr key={i}>
                      <td>
                        <div className="fw-bold text-sm">{aluno.nome || <span className="text-muted">Sem nome</span>}</div>
                        <div className="text-xs text-muted truncate" style={{ maxWidth: 200 }}>{aluno.email}</div>
                      </td>
                      <td>
                        {formacao ? (
                          <span className={`turma-badge ${aluno.formacao}`}>{formacao.nome}</span>
                        ) : <span className="text-muted text-xs">—</span>}
                      </td>
                      <td>
                        <div className="presence-bar-wrap">
                          <div className="presence-bar" style={{ maxWidth: 80 }}>
                            <div className="presence-bar-fill" style={{ width: `${pct}%`, background: cor }} />
                          </div>
                          <span className="presence-pct">{pct}%</span>
                        </div>
                        <div className="text-xs text-muted">{presencas}/{totalAulas}</div>
                      </td>
                      <td>
                        {justificado ? (
                          <span className="text-xs" style={{ color: "var(--info)" }}>—</span>
                        ) : (
                          <span className="font-display fw-bold" style={{ fontSize: "1.1rem", color: faltas > 0 ? "var(--danger)" : "var(--success)" }}>
                            {faltas}
                          </span>
                        )}
                      </td>
                      <td><span className={`status-pill ${pill}`}>{label}</span></td>
                      <td>
                        <button className="btn-secondary" style={{ fontSize: "0.78rem", padding: "5px 12px" }} onClick={() => abrirModal(aluno)}>
                          Gerenciar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL */}
      {modalAluno && (
        <div className="modal-overlay">
          <div className="modal-content shadow-xl" style={{ maxWidth: 620, width: "95%" }}>
            <div className="modal-header">
              <div>
                <h3>{modalAluno.nome || "Sem nome"}</h3>
                <p className="text-muted text-sm">{modalAluno.email}</p>
              </div>
              <button className="modal-close" onClick={() => setModalAluno(null)}>✕</button>
            </div>

            <div className="tab-list mb-16">
              {[
                { key: "historico", label: "📋 Histórico" },
                { key: "editar",    label: "✏️ Editar" },
                { key: "manual",    label: "➕ Ponto Manual" },
              ].map((t) => (
                <button key={t.key} className={`tab-item ${tabModal === t.key ? "active" : ""}`} onClick={() => setTabModal(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>

            {tabModal === "historico" && (
              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {loadModal ? (
                  <div style={{ textAlign: "center", padding: 40 }}><span className="loading-spinner" /></div>
                ) : historicoModal.length === 0 ? (
                  <p className="text-center text-muted" style={{ padding: 40 }}>Sem registros.</p>
                ) : (
                  <table className="historico-table">
                    <thead><tr><th>Data</th><th>Entrada</th><th>Saída</th><th>Status</th></tr></thead>
                    <tbody>
                      {historicoModal.map((h, i) => (
                        <tr key={i}>
                          <td>{new Date(h.data).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</td>
                          <td>{formatHora(h.check_in)}</td>
                          <td>{formatHora(h.check_out)}</td>
                          <td><span className={`status-pill ${h.check_in && h.check_out ? "ok" : "warn"}`}>{h.check_in && h.check_out ? "✓" : "⏳"}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {tabModal === "editar" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label className="text-xs text-muted" style={{ display: "block", marginBottom: 4 }}>Nome</label>
                    <input className="input-modern" value={dadosEdicao.nome} onChange={(e) => setDadosEdicao({ ...dadosEdicao, nome: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted" style={{ display: "block", marginBottom: 4 }}>E-mail</label>
                    <input className="input-modern" value={dadosEdicao.email} onChange={(e) => setDadosEdicao({ ...dadosEdicao, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted" style={{ display: "block", marginBottom: 4 }}>Nascimento</label>
                    <input type="date" className="input-modern" value={dadosEdicao.data_nascimento} onChange={(e) => setDadosEdicao({ ...dadosEdicao, data_nascimento: e.target.value })} />
                  </div>
                </div>
                <button className="btn-primary w-full" onClick={salvarEdicao} disabled={loadModal}>
                  {loadModal ? "Salvando..." : "💾 Salvar Alterações"}
                </button>
                <div className="divider" />
                <button className="btn-danger w-full" onClick={excluirAluno} disabled={loadModal}>
                  🗑️ Excluir Cadastro Permanentemente
                </button>
              </div>
            )}

           {/* ABA PONTO MANUAL */}
            {tabModal === "manual" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 10,
                  }}
                >
                  <div>
                    <label
                      className="text-xs text-muted"
                      style={{ display: "block", marginBottom: 4 }}
                    >
                      Data
                    </label>
                    <input
                      type="date"
                      className="input-modern"
                      value={manualPonto.data}
                      onChange={(e) =>
                        setManualPonto({ ...manualPonto, data: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label
                      className="text-xs text-muted"
                      style={{ display: "block", marginBottom: 4 }}
                    >
                      Entrada
                    </label>
                    <input
                      type="time"
                      className="input-modern"
                      value={manualPonto.check_in}
                      onChange={(e) =>
                        setManualPonto({
                          ...manualPonto,
                          check_in: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label
                      className="text-xs text-muted"
                      style={{ display: "block", marginBottom: 4 }}
                    >
                      Saída
                    </label>
                    <input
                      type="time"
                      className="input-modern"
                      value={manualPonto.check_out}
                      onChange={(e) =>
                        setManualPonto({
                          ...manualPonto,
                          check_out: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <button className="btn-accent w-full" onClick={registrarManual}>
                  ➕ Registrar Presença Manual
                </button>

                <div className="divider" />

                <div>
                  <label
                    className="text-xs text-muted fw-bold"
                    style={{ display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}
                  >
                    Adicionar check-out em registro existente
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label
                        className="text-xs text-muted"
                        style={{ display: "block", marginBottom: 4 }}
                      >
                        Data do registro
                      </label>
                      <input
                        type="date"
                        className="input-modern"
                        value={manualPonto.data}
                        onChange={(e) =>
                          setManualPonto({ ...manualPonto, data: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label
                        className="text-xs text-muted"
                        style={{ display: "block", marginBottom: 4 }}
                      >
                        Horário de saída
                      </label>
                      <input
                        type="time"
                        className="input-modern"
                        value={manualPonto.check_out}
                        onChange={(e) =>
                          setManualPonto({ ...manualPonto, check_out: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <button
                    className="btn-primary w-full"
                    style={{ marginTop: 10 }}
                    onClick={async () => {
                      if (!confirm("Adicionar check-out neste registro?")) return;
                      try {
                        const res = await fetch(`${API_URL}/admin/checkout-manual`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
                          body: JSON.stringify({ email: modalAluno.email, data: manualPonto.data, check_out: manualPonto.check_out }),
                        });
                        if (res.ok) { alert("Check-out adicionado!"); abrirModal(modalAluno); }
                        else { const e = await res.json(); alert(e.error); }
                      } catch { alert("Erro de conexão."); }
                    }}
                  >
                    ✏️ Adicionar Check-out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
