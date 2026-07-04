import React, { useState, useEffect, useCallback } from "react";
import { FORMACOES, API_URL, CRONOGRAMAS, getNomeFormacao, obterAulasOcorridas } from "./Constants";
import { fetchComToken } from "./Api";

const COR = { fullstack: "#93b4ff", "ia-gen": "#8fc1ff", "mkt-dig": "#7d96e8" };

const formatHora = (v) => {
  if (!v) return "--:--";
  return v.includes("T") ? v.split("T")[1].substring(0, 5) : String(v).substring(0, 5);
};

const calcularFaltas = (aluno) => {
  const totalAulas = obterAulasOcorridas(aluno.formacao);
  const presencas = Math.min(aluno.total_presencas || 0, totalAulas);
  const brutas = Math.max(0, totalAulas - presencas);
  if (aluno.se_ausenta_sempre || aluno.justificou_ausencia) return { totalAulas, presencas, faltas: 0, justificado: true };
  const abonos = aluno.saldo_abonos || 0;
  return { totalAulas, presencas, faltas: abonos > 0 ? Math.max(0, brutas - abonos) : brutas, justificado: false };
};

const StatusPill = ({ aluno }) => {
  if (!aluno.formacao) return <span className="status-pill neutral">Sem turma</span>;
  const { faltas, totalAulas, justificado } = calcularFaltas(aluno);
  if (justificado) return <span className="status-pill info">✓ Justificado</span>;
  const pct = totalAulas > 0 ? (faltas / totalAulas) * 100 : 0;
  if (pct === 0) return <span className="status-pill ok">✓ Regular</span>;
  if (pct <= 25) return <span className="status-pill warn">⚠ {faltas} falta(s)</span>;
  return <span className="status-pill danger">✗ {faltas} falta(s)</span>;
};

const TurmaBadge = ({ id }) => {
  const f = FORMACOES.find((x) => x.id === id);
  if (!f) return <span className="status-pill neutral">Não definida</span>;
  return <span className={`turma-badge ${id}`}>{f.nome}</span>;
};

export default function Admin({ user, setView }) {
  const [busca, setBusca] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [dataBusca, setDataBusca] = useState(new Date().toISOString().split("T")[0]);
  const [alunos, setAlunos] = useState([]);
  const [totalEncontrado, setTotalEncontrado] = useState(0);
  const [stats, setStats] = useState({ totalAlunos: 0, sessoesAtivas: 0, concluidosHoje: 0, pendentesSaida: 0 });
  const [carregando, setCarregando] = useState(false);
  const [periodoExport, setPeriodoExport] = useState({ inicio: "", fim: "" });
  const [duplicados, setDuplicados] = useState([]);
  const [resumoDup, setResumoDup] = useState({ totalEmailsDuplicados: 0, totalRegistrosDuplicados: 0 });
  const [loadDup, setLoadDup] = useState(false);
  const [removendoId, setRemovendoId] = useState(null);

  // Modal
  const [modalAluno, setModalAluno] = useState(null);
  const [historicoModal, setHistoricoModal] = useState([]);
  const [tabModal, setTabModal] = useState("historico");
  const [dadosEdicao, setDadosEdicao] = useState({ nome: "", email: "", data_nascimento: "" });
  const [manualPonto, setManualPonto] = useState({ data: new Date().toISOString().split("T")[0], check_in: "08:00", check_out: "12:00" });
  const [loadModal, setLoadModal] = useState(false);

  // Stats
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/stats/${filtroTurma}?dataFiltro=${dataBusca}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (res.ok) setStats(await res.json());
      } catch {}
    };
    load();
  }, [filtroTurma, dataBusca, user.token]);

  // Duplicados
  const carregarDuplicados = useCallback(async () => {
    setLoadDup(true);
    try {
      const res = await fetchComToken("/admin/duplicados");
      if (res.ok) {
        const d = await res.json();
        setDuplicados(d.duplicados || []);
        setResumoDup({ totalEmailsDuplicados: d.totalEmailsDuplicados || 0, totalRegistrosDuplicados: d.totalRegistrosDuplicados || 0 });
      }
    } catch {} finally { setLoadDup(false); }
  }, []);

  useEffect(() => { carregarDuplicados(); }, [carregarDuplicados]);

  const removerDuplicado = async (reg) => {
    if (!reg?.id) return alert("ID inválido.");
    if (!confirm(`Remover registro duplicado de ${reg.nome || reg.email}?`)) return;
    setRemovendoId(reg.id);
    try {
      const res = await fetchComToken(`/admin/aluno-id/${encodeURIComponent(reg.id)}`, "DELETE");
      if (res.ok) { alert("Removido!"); carregarDuplicados(); buscarAlunos(busca); }
      else { const e = await res.json(); alert(e.error || "Erro ao remover."); }
    } catch { alert("Erro de conexão."); } finally { setRemovendoId(null); }
  };

  // Busca
  const buscarAlunos = useCallback(async (termo) => {
    setCarregando(true);
    try {
const res = await fetchComToken(`/admin/busca?termo=${encodeURIComponent(termo)}&turma=${filtroTurma}&status=${filtroStatus}&dataFiltro=${dataBusca}&_=${Date.now()}`);      if (res.ok) {
        const d = await res.json();
        setAlunos(d.alunos || []);
        setTotalEncontrado(d.total || 0);
      }
    } catch {} finally { setCarregando(false); }
  }, [filtroTurma, filtroStatus, dataBusca]);

  useEffect(() => {
    const t = setTimeout(() => buscarAlunos(busca), 500);
    return () => clearTimeout(t);
  }, [busca, filtroStatus, filtroTurma, dataBusca, buscarAlunos]);

  // Modal detalhes
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
      if (res.ok) { alert("Dados atualizados!"); setModalAluno(null); buscarAlunos(busca); }
      else { const e = await res.json(); alert(e.error); }
    } catch { alert("Erro ao salvar."); } finally { setLoadModal(false); }
  };

  const registrarManual = async () => {
    if (!confirm("Inserir este registro de presença manualmente?")) return;
    try {
      const res = await fetch(`${API_URL}/admin/ponto-manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ email: modalAluno.email, ...manualPonto }),
      });
      if (res.ok) { alert("Presença registrada!"); abrirModal(modalAluno); }
      else { const e = await res.json(); alert(e.error); }
    } catch { alert("Erro de conexão."); }
  };

  const excluirAluno = async () => {
    if (!confirm(`ATENÇÃO: Excluir permanentemente ${modalAluno.nome || modalAluno.email} e todo seu histórico?`)) return;
    setLoadModal(true);
    try {
      const res = await fetch(`${API_URL}/admin/aluno/${encodeURIComponent(modalAluno.email)}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) { alert("Cadastro excluído."); setModalAluno(null); buscarAlunos(busca); }
      else { const e = await res.json(); alert(e.error); }
    } catch { alert("Erro de conexão."); } finally { setLoadModal(false); }
  };

  const exportarCSV = async () => {
    if (!periodoExport.inicio || !periodoExport.fim) { alert("Selecione o período de início e fim."); return; }
    try {
      const res = await fetch(`${API_URL}/admin/relatorio/${filtroTurma}?inicio=${periodoExport.inicio}&fim=${periodoExport.fim}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const dados = await res.json();
      if (!dados?.length) { alert("Nenhum dado encontrado para este período."); return; }
      const header = "Nome;Email;Formação;Data;Entrada;Saída;Nota;Feedback\n";
      const rows = dados.map((r) => `${r.Nome};${r.Email};${r.Formacao};${r.Data};${r.Entrada};${r.Saida};${r.Nota};"${(r.Feedback || "").replace(/"/g, '""')}"`).join("\n");
      const blob = new Blob(["\ufeff" + header + rows], { type: "text/csv;charset=utf-8;" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `frequencia_${filtroTurma}_${periodoExport.inicio}_a_${periodoExport.fim}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { alert("Erro ao exportar."); }
  };

  const presencaPct = stats.totalAlunos > 0 ? Math.round((stats.sessoesAtivas / stats.totalAlunos) * 100) : 0;

  return (
    <div className="admin-wrapper">
      {/* HEADER STATS */}
      <div className="admin-stats-grid mb-24">
        {[
          { label: "Check-ins Hoje", val: stats.sessoesAtivas, cor: "var(--accent)" },
          { label: "Pendentes Saída", val: stats.pendentesSaida, cor: "var(--warning)" },
          { label: "Concluídos", val: stats.concluidosHoje, cor: "var(--success)" },
          { label: "Total Alunos", val: stats.totalAlunos, cor: "var(--text-main)" },
        ].map((s, i) => (
          <div key={i} className="admin-stat">
            <div className="admin-stat-label">{s.label}</div>
            <div className="admin-stat-value" style={{ color: s.cor }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
        {/* COLUNA PRINCIPAL */}
        <div>
          {/* FILTROS */}
          <div className="filtros-bar mb-16">
            <input
              className="input-modern"
              placeholder="🔍 Buscar por nome ou e-mail..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ marginBottom: 0 }}
            />
            <select className="input-modern" value={filtroTurma} onChange={(e) => setFiltroTurma(e.target.value)} style={{ marginBottom: 0, minWidth: 180 }}>
              <option value="todos">Todas as Turmas</option>
              {FORMACOES.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
            <select className="input-modern" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} style={{ marginBottom: 0, minWidth: 180 }}>
              <option value="todos">Todos os Status</option>
              <option value="presentes_no_dia">✅ Presentes Hoje</option>
              <option value="pendente_saida">⏳ Pendente Saída</option>
              <option value="checkout_antecipado">⚡ Saída Antecipada</option>
            </select>
            <input
              type="date"
              className="input-modern"
              value={dataBusca}
              onChange={(e) => setDataBusca(e.target.value)}
              style={{ marginBottom: 0, minWidth: 150 }}
            />
          </div>

          {/* TABELA */}
          <div className="shadow-card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="section-title">
                Alunos
                <span className="section-count">{totalEncontrado}</span>
              </span>
              {carregando && <span className="loading-spinner" />}
            </div>
            <div style={{ overflowX: "auto" }}>
              {alunos.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
                  {carregando ? "Buscando..." : "Nenhum resultado. Use os filtros acima."}
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Turma</th>
                      <th>Frequência</th>
                      <th>Status</th>
                      <th>Check-in</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {alunos.map((aluno, i) => {
                      const { totalAulas, presencas } = calcularFaltas(aluno);
                      const pct = totalAulas > 0 ? Math.round((presencas / totalAulas) * 100) : 0;
                      const cor = pct >= 75 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--danger)";
                      return (
                        <tr key={i}>
                          <td>
                            <div className="fw-bold text-sm truncate" style={{ maxWidth: 160 }}>{aluno.nome || "—"}</div>
                            <div className="text-xs text-muted truncate" style={{ maxWidth: 160 }}>{aluno.email}</div>
                          </td>
                          <td><TurmaBadge id={aluno.formacao} /></td>
                          <td>
                            <div className="presence-bar-wrap">
                              <div className="presence-bar" style={{ maxWidth: 80 }}>
                                <div className="presence-bar-fill" style={{ width: `${pct}%`, background: cor }} />
                              </div>
                              <span className="presence-pct">{pct}%</span>
                            </div>
                            <div className="text-xs text-muted">{presencas}/{totalAulas} aulas</div>
                          </td>
                          <td><StatusPill aluno={aluno} /></td>
                          <td>
                            {aluno.check_in ? (
                              <span className="text-sm" style={{ color: "var(--accent)" }}>{formatHora(aluno.check_in)}</span>
                            ) : <span className="text-muted">—</span>}
                          </td>
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
        </div>

        {/* SIDEBAR */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* EXPORT */}
          <div className="shadow-card p-20">
            <div className="section-title mb-16">📥 Exportar Relatório</div>
            <label className="text-xs text-muted" style={{ display: "block", marginBottom: 4 }}>Período de início</label>
            <input type="date" className="input-modern" value={periodoExport.inicio} onChange={(e) => setPeriodoExport({ ...periodoExport, inicio: e.target.value })} />
            <label className="text-xs text-muted" style={{ display: "block", marginBottom: 4 }}>Período de fim</label>
            <input type="date" className="input-modern" value={periodoExport.fim} onChange={(e) => setPeriodoExport({ ...periodoExport, fim: e.target.value })} />
            <button className="btn-accent w-full" onClick={exportarCSV}>
              ⬇ Exportar CSV
            </button>
          </div>

          {/* PRESENÇA HOJE */}
          <div className="shadow-card p-20">
            <div className="section-title mb-12">📊 Presença Hoje</div>
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div className="font-display" style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--accent)" }}>{presencaPct}%</div>
              <div className="text-xs text-muted">{stats.sessoesAtivas} de {stats.totalAlunos} alunos</div>
            </div>
            <div className="presence-bar" style={{ height: 8 }}>
              <div className="presence-bar-fill" style={{ width: `${presencaPct}%`, background: "var(--accent)" }} />
            </div>
          </div>

          {/* DUPLICADOS */}
          <div className="shadow-card p-20" style={{ borderLeft: "3px solid var(--danger)" }}>
            <div className="flex justify-between items-center mb-12">
              <div className="section-title" style={{ color: "var(--danger)" }}>🔁 E-mails Duplicados</div>
              <button className="btn-ghost" style={{ fontSize: "0.75rem", padding: "4px 8px" }} onClick={carregarDuplicados} disabled={loadDup}>
                {loadDup ? "..." : "↻"}
              </button>
            </div>
            <div className="text-xs text-muted mb-12">
              {resumoDup.totalEmailsDuplicados} e-mail(s) · {resumoDup.totalRegistrosDuplicados} registros
            </div>
            {duplicados.length === 0 ? (
              <p className="text-xs text-muted">✓ Nenhuma duplicidade encontrada.</p>
            ) : (
              <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                {duplicados.map((grupo) => (
                  <div key={grupo.email} style={{ background: "var(--danger-bg)", borderRadius: "var(--radius-sm)", padding: "10px", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <div className="fw-bold text-xs mb-8 truncate" style={{ color: "var(--danger)" }}>{grupo.email}</div>
                    {grupo.registros.map((reg, idx) => (
                      <div key={reg.id || idx} className="flex justify-between items-center" style={{ gap: 6, marginBottom: 4 }}>
                        <span className="text-xs">{idx === 0 ? "✓ Manter" : "✗ Dupl."}: {reg.nome || "sem nome"}</span>
                        {idx > 0 && (
                          <button
                            className="btn-danger"
                            style={{ padding: "2px 8px", fontSize: "0.68rem" }}
                            onClick={() => removerDuplicado(reg)}
                            disabled={removendoId === reg.id}
                          >
                            {removendoId === reg.id ? "..." : "Remover"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DICA */}
          <div className="shadow-card p-16" style={{ borderLeft: "3px solid var(--warning)", background: "var(--warning-bg)" }}>
            <div className="text-xs fw-bold text-warning-c mb-8">💡 Dica</div>
            <p className="text-xs text-muted">
              Use o filtro "Pendente Saída" para identificar quem não fez check-out na última aula.
            </p>
          </div>
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

            {/* TABS */}
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

            {/* INFO DO ALUNO */}
            <div className="flex gap-8 mb-16" style={{ flexWrap: "wrap" }}>
              <TurmaBadge id={modalAluno.formacao} />
              <StatusPill aluno={modalAluno} />
              <span className="status-pill neutral">
                {calcularFaltas(modalAluno).presencas}/{calcularFaltas(modalAluno).totalAulas} presenças
              </span>
            </div>

            {/* ABA HISTÓRICO */}
            {tabModal === "historico" && (
              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {loadModal ? (
                  <div style={{ textAlign: "center", padding: 40 }}><span className="loading-spinner" /></div>
                ) : historicoModal.length === 0 ? (
                  <p className="text-muted text-center" style={{ padding: 40 }}>Sem registros.</p>
                ) : (
                  <table className="historico-table">
                    <thead>
                      <tr><th>Data</th><th>Entrada</th><th>Saída</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {historicoModal.map((h, i) => (
                        <tr key={i}>
                          <td>{new Date(h.data).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</td>
                          <td>{formatHora(h.check_in)}</td>
                          <td>{formatHora(h.check_out)}</td>
                          <td>
                            <span className={`status-pill ${h.check_in && h.check_out ? "ok" : "warn"}`}>
                              {h.check_in && h.check_out ? "✓" : "⏳"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ABA EDITAR */}
            {tabModal === "editar" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label className="text-xs text-muted" style={{ display: "block", marginBottom: 4 }}>Nome</label>
                    <input className="input-modern" value={dadosEdicao.nome} onChange={(e) => setDadosEdicao({ ...dadosEdicao, nome: e.target.value })} placeholder="Nome completo" />
                  </div>
                  <div>
                    <label className="text-xs text-muted" style={{ display: "block", marginBottom: 4 }}>E-mail</label>
                    <input className="input-modern" value={dadosEdicao.email} onChange={(e) => setDadosEdicao({ ...dadosEdicao, email: e.target.value })} placeholder="E-mail" />
                  </div>
                  <div>
                    <label className="text-xs text-muted" style={{ display: "block", marginBottom: 4 }}>Data de Nascimento</label>
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
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div>
                    <label className="text-xs text-muted" style={{ display: "block", marginBottom: 4 }}>Data</label>
                    <input type="date" className="input-modern" value={manualPonto.data} onChange={(e) => setManualPonto({ ...manualPonto, data: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted" style={{ display: "block", marginBottom: 4 }}>Entrada</label>
                    <input type="time" className="input-modern" value={manualPonto.check_in} onChange={(e) => setManualPonto({ ...manualPonto, check_in: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted" style={{ display: "block", marginBottom: 4 }}>Saída</label>
                    <input type="time" className="input-modern" value={manualPonto.check_out} onChange={(e) => setManualPonto({ ...manualPonto, check_out: e.target.value })} />
                  </div>
                </div>
                <button className="btn-accent w-full" onClick={registrarManual}>
                  ➕ Registrar Presença Manual
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
