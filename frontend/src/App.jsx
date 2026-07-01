import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import {
  API_URL,
  FORMACOES,
  getNomeFormacao,
  getHorarioAulao,
  obterDatasOcorridas,
  obterProximasAulas,
  formatarDataBR,
  avaliarJanelaPonto,
} from "./Constants";
import Login from "./Login";
import Admin from "./Admin";
import Perfil from "./Perfil";
import Manual from "./Manual";
import { fetchComToken } from "./Api";
import GestaoRapida from "./GestaoRapida";
import HomeAdmin from "./HomeAdmin";
import ImportacaoJustificativas from "./ImportacaoJustificativas";

const getProximasAulasFormatadas = (formacao) =>
  obterProximasAulas(formacao).map(formatarDataBR);

export default function App() {
  const [user, setUser] = useState(() => {
    const s = localStorage.getItem("juventudetech_session");
    if (!s) return null;
    try {
      const { userData, timestamp } = JSON.parse(s);
      if (Date.now() - timestamp < 12 * 60 * 60 * 1000) return userData;
    } catch {}
    return null;
  });

  const [dadosSalvos, setDadosSalvos] = useState(() => {
    const s = localStorage.getItem("juventudetech_remember");
    return s ? JSON.parse(s) : null;
  });

  const [view, setView] = useState("home");
  const [form, setForm] = useState(dadosSalvos || { email: "", dataNasc: "", formacao: "" });
  const [historico, setHistorico] = useState([]);
  const [popup, setPopup] = useState({ show: false, msg: "", tipo: "" });
  const [feedback, setFeedback] = useState({ nota: 0, revisao: "", modal: false });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const s = localStorage.getItem("juventudetech_theme");
    return s ? JSON.parse(s) : true;
  });
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
  const [showManualPublico, setShowManualPublico] = useState(false);

  // Redireciona admin para dashboard
  useEffect(() => {
    if (user?.role === "admin") {
      const t = setTimeout(() => setView((v) => (v === "home" ? "admin" : v)), 0);
      return () => clearTimeout(t);
    }
  }, [user?.role]);

  // Relógio
  useEffect(() => {
    const t = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    }, 10000);
    return () => clearInterval(t);
  }, []);

  // Dark mode
  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode);
    localStorage.setItem("juventudetech_theme", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const exibirPopup = useCallback((msg, tipo) => {
    setPopup({ show: true, msg, tipo });
    setTimeout(() => setPopup({ show: false, msg: "", tipo: "" }), 5000);
  }, []);

  const handleLogin = async () => {
    try {
      const partes = form.dataNasc.split("/");
      if (partes.length !== 3 || form.dataNasc.length < 10) {
        exibirPopup("Digite a data completa: DD/MM/AAAA", "erro");
        return;
      }
      const dataParaEnvio = `${partes[2]}-${partes[1]}-${partes[0]}`;

      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim().toLowerCase(), dataNascimento: dataParaEnvio, formacao: form.formacao }),
      });
      const data = await res.json();

      if (!res.ok) {
        exibirPopup(data.error || "Erro no login.", "erro");
        return;
      }

      setUser(data);
      localStorage.setItem("juventudetech_session", JSON.stringify({ userData: data, timestamp: Date.now() }));
      localStorage.setItem("juventudetech_remember", JSON.stringify({
        email: data.email, dataNasc: form.dataNasc,
        nome: data.nome || "", formacao: data.formacao,
      }));
    } catch {
      exibirPopup("Erro de conexão com o servidor.", "erro");
    }
  };

  const carregarHistorico = useCallback(async () => {
    if (!user?.email || user?.role === "admin" || !user?.token) return;
    try {
      const res = await fetch(`${API_URL}/historico/aluno/${user.email.trim().toLowerCase()}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) setHistorico(await res.json());
    } catch {}
  }, [user]);

  useEffect(() => {
    if (user?.email) {
      const t = setTimeout(carregarHistorico, 0);
      return () => clearTimeout(t);
    }
  }, [user?.email, carregarHistorico]);

  const baterPonto = async (extra = {}) => {
    if (!user?.email || !user?.token) return exibirPopup("Sessão expirada. Faça login novamente.", "erro");
    try {
      const res = await fetchComToken("/ponto", "POST", {
        aluno_id: user.email.trim().toLowerCase(),
        ...extra,
      });
      const data = await res.json();
      if (!res.ok) return exibirPopup(data.error || "Erro ao registrar ponto.", "erro");
      exibirPopup(data.msg, "sucesso");
      await carregarHistorico();
      if (!extra.nota) {
        const horarioFim = getHorarioAulao(user.formacao).fim;
        setTimeout(() => exibirPopup(`📌 Lembrete: o check-out abre perto do encerramento do aulão (${horarioFim}).`, "aviso"), 1500);
      }
      setFeedback({ nota: 0, revisao: "", modal: false });
    } catch {
      exibirPopup("Erro de conexão com o servidor.", "erro");
    }
  };

  const logout = () => {
    localStorage.removeItem("juventudetech_session");
    setUser(null);
    setView("home");
    setHistorico([]);
  };

  if (!user) {
    if (showManualPublico) {
      return <Manual onVoltar={() => setShowManualPublico(false)} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} publico />;
    }
    return (
      <Login
        form={form} setForm={setForm} handleLogin={handleLogin}
        dadosSalvos={dadosSalvos} setDadosSalvos={setDadosSalvos}
        isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}
        onAbrirManual={() => setShowManualPublico(true)}
      />
    );
  }

  const totalPresencas = historico.filter((h) => h.check_in).length;
  const nomeExibicao = user.nome || user.email?.split("@")[0];
  const formacaoInfo = FORMACOES.find((f) => f.id === user.formacao);
  const proximasAulas = getProximasAulasFormatadas(user.formacao);
  const horarioCurso = getHorarioAulao(user.formacao);

  const NAV_ADMIN = [
    { key: "home",      label: "Home" },
    { key: "admin",     label: "Dashboard" },
    { key: "limpeza",   label: "Edição" },
    { key: "importacao",label: "Importação" },
    { key: "manual",    label: "Manual" },
  ];

  return (
    <div className="app-wrapper">
      {/* TOAST */}
      {popup.show && (
        <div className={`custom-popup-modern ${popup.tipo}`}>{popup.msg}</div>
      )}

      {/* HEADER */}
      <header className="glass-header">
        <div className="brand-logo" onClick={() => setView("home")}>
          <img src="/juvetech-logo.png" alt="Juventude Tech" className="brand-logo-img" />
          <div className="brand-text">
            Registro de Frequência
            <span>Juventude Tech</span>
          </div>
          <div className="user-badge">{user.role === "admin" ? "Admin" : "Aluno"}</div>
        </div>

        <div className="header-right">
          <span className="clock">🕒 {currentTime}</span>
          <div className="nav-actions">
            {user.role === "admin" ? (
              NAV_ADMIN.map((n) => (
                <button
                  key={n.key}
                  className={`btn-secondary ${view === n.key ? "active" : ""}`}
                  onClick={() => setView(n.key)}
                >
                  {n.label}
                </button>
              ))
            ) : (
              <>
                <button className="btn-action-circle" title="Manual do Aluno" onClick={() => setView("manual")}>
                  📘
                </button>
                <button className="btn-action-circle" title="Meu Perfil" onClick={() => setView("perfil")}>
                  👤
                </button>
              </>
            )}
            <button className="btn-action-circle" title="Alternar Tema" onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? "○" : "●"}
            </button>
            <button className="btn-secondary" onClick={logout}>Sair</button>
          </div>
        </div>
      </header>

      {/* ROTEAMENTO DE VIEWS */}
      {view === "home" && user.role === "admin" ? (
        <HomeAdmin user={user} />
      ) : view === "admin" && user.role === "admin" ? (
        <Admin user={user} setView={setView} />
      ) : view === "limpeza" && user.role === "admin" ? (
        <GestaoRapida user={user} setView={setView} />
      ) : view === "importacao" && user.role === "admin" ? (
        <ImportacaoJustificativas user={user} setView={setView} />
      ) : view === "manual" ? (
        <Manual onVoltar={() => setView("home")} />
      ) : view === "perfil" && user.role !== "admin" ? (
        <Perfil user={user} setUser={setUser} onVoltar={() => setView("home")} />
      ) : (
        /* ALUNO HOME */
        <main className="aluno-main-wrapper">
          {/* CARD PRINCIPAL */}
          <div className="aula-card">
            <div className="card-header-info">
              <div>
                <p className="text-muted text-sm">{new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                <div className="flex items-center gap-8 mt-12" style={{ flexWrap: "wrap" }}>
                  <h2>Olá, {nomeExibicao}!</h2>
                  {formacaoInfo && (
                    <span className={`turma-badge ${user.formacao}`} style={{ fontFamily: "var(--font-body)" }}>
                      {formacaoInfo.nome}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="info-banner">
              <span>ℹ️</span>
              <span>Check-in e check-out só ficam disponíveis aos <strong>sábados de aulão</strong>, dentro da janela de horário do seu curso. De segunda a sexta, a frequência é controlada pelo Moodle.</span>
            </div>

            {/* BOTÕES PONTO */}
            {(() => {
              const janelaReal = avaliarJanelaPonto(user.formacao);
              const { ehDiaDeAulao, podeCheckIn, podeCheckOut } = janelaReal;
              const hojeISO = new Date().toLocaleDateString("en-CA");
              const registroHoje = historico.find((h) => h.data?.substring(0, 10) === hojeISO);
              const jaFezIn = !!registroHoje?.check_in;
              const jaFezOut = !!registroHoje?.check_out;

              return (
                <>
                  <div className="btn-pair mt-16">
                    <button
                      className={`btn-ponto in ${jaFezIn ? "concluido" : ""}`}
                      disabled={jaFezIn}
                      onClick={() => {
                        if (!ehDiaDeAulao) {
                          exibirPopup("Hoje não é dia de aulão do seu curso. A presença é registrada apenas nos sábados do cronograma.", "erro");
                          return;
                        }
                        if (!podeCheckIn) {
                          exibirPopup(`Check-in disponível próximo ao horário do aulão (${horarioCurso.inicio}).`, "erro");
                          return;
                        }
                        baterPonto();
                      }}
                    >
                      {jaFezIn ? "✓ CHECK-IN FEITO" : "📍 CHECK-IN"}
                    </button>
                    <button
                      className={`btn-ponto out ${jaFezOut ? "concluido" : ""}`}
                      disabled={jaFezOut || !jaFezIn}
                      onClick={() => {
                        if (!jaFezIn) { exibirPopup("Faça o check-in primeiro!", "erro"); return; }
                        if (!ehDiaDeAulao || !podeCheckOut) {
                          exibirPopup(`Check-out disponível próximo ao encerramento do aulão (${horarioCurso.fim}).`, "erro");
                          return;
                        }
                        setFeedback({ ...feedback, modal: true });
                      }}
                    >
                      {jaFezOut ? "✓ CHECK-OUT FEITO" : "🚪 CHECK-OUT"}
                    </button>
                  </div>

                  {/* JANELAS */}
                  <div className="horarios-box">
                    <div className="horario-item">
                      <span className="horario-label">Entrada</span>
                      <span className="horario-value">{horarioCurso.inicio}</span>
                    </div>
                    <div className="horario-divider" />
                    <div className="horario-item">
                      <span className="horario-label">Saída</span>
                      <span className="horario-value">{horarioCurso.fim}</span>
                    </div>
                    <div className="horario-divider" />
                    <div className="horario-item">
                      <span className="horario-label">Dia</span>
                      <span className="horario-value">Sábado</span>
                    </div>
                  </div>

                  {janelaReal.tema && (
                    <p className="text-xs text-muted mt-8" style={{ textAlign: "center" }}>
                      Tema do aulão de hoje: <strong>{janelaReal.tema}</strong>
                    </p>
                  )}
                </>
              );
            })()}

            {/* STATS */}
            <div className="stats-grid mt-20">
              <div className="stat-card">
                <span className="stat-label">✅ Total de Presenças</span>
                <div className="stat-value text-success-c">{totalPresencas}</div>
              </div>

              <div className="stat-card">
                <span className="stat-label">📅 Próximas Aulas</span>
                <ul>
                  {proximasAulas.length > 0 ? proximasAulas.map((d, i) => (
                    <li key={i}>
                      <strong>{d}</strong>
                      <span className="text-muted" style={{ marginLeft: 6, fontSize: "0.72rem" }}>{horarioCurso.inicio}h</span>
                    </li>
                  )) : <li className="text-muted">Sem aulas agendadas</li>}
                </ul>
              </div>

              <div className="stat-card">
                <span className="stat-label">📊 Frequência</span>
                {(() => {
                  const total = obterDatasOcorridas(user.formacao).length;
                  const pct = total > 0 ? Math.round((totalPresencas / total) * 100) : 0;
                  return (
                    <>
                      <div className="stat-value">{pct}%</div>
                      <div style={{ marginTop: 8 }}>
                        <div className="presence-bar">
                          <div className="presence-bar-fill" style={{
                            width: `${pct}%`,
                            background: pct >= 75 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--danger)",
                          }} />
                        </div>
                        <div className="text-xs text-muted mt-8">{totalPresencas} de {total} aulas</div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="stat-card">
                <span className="stat-label">🎓 Formação</span>
                <div style={{ marginTop: 8 }}>
                  <div className={`tag-formacao tag-${user.formacao}`} style={{ marginBottom: 8, fontSize: "0.72rem" }}>
                    {formacaoInfo?.tag || user.formacao}
                  </div>
                  <div className="text-sm fw-bold">{getNomeFormacao(user.formacao)}</div>
                  <div className="text-xs text-muted">{formacaoInfo?.horas}</div>
                </div>
              </div>
            </div>
          </div>

          {/* HISTÓRICO */}
          <div className="historico-container">
            <h3>📋 Meu Histórico Completo</h3>
            <div className="table-responsive">
              <table className="historico-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Entrada</th>
                    <th>Saída</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center text-muted" style={{ padding: "32px" }}>
                        Nenhum registro encontrado.
                      </td>
                    </tr>
                  ) : (
                    historico.map((h, i) => {
                      const checkIn = h.check_in
                        ? (h.check_in.includes("T") ? h.check_in.split("T")[1].substring(0, 5) : h.check_in.substring(0, 5))
                        : "--:--";
                      const checkOut = h.check_out
                        ? (h.check_out.includes("T") ? h.check_out.split("T")[1].substring(0, 5) : h.check_out.substring(0, 5))
                        : "--:--";
                      const completo = h.check_in && h.check_out;
                      return (
                        <tr key={i}>
                          <td>{new Date(h.data).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</td>
                          <td><strong>{checkIn}</strong></td>
                          <td>{checkOut}</td>
                          <td>
                            <span className={`status-pill ${completo ? "ok" : "warn"}`}>
                              {completo ? "✓ Completo" : "⏳ Em aberto"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* MODAL FEEDBACK CHECKOUT */}
      {feedback.modal && (
        <div className="modal-overlay">
          <div className="modal-content shadow-xl" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div>
                <h3>Finalizar Check-out</h3>
                <p className="text-muted text-sm">Como foi sua experiência na aula de hoje?</p>
              </div>
              <button className="modal-close" onClick={() => setFeedback({ ...feedback, modal: false })}>✕</button>
            </div>

            <div className="flex gap-8 mb-16" style={{ justifyContent: "center" }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={`btn-rating ${feedback.nota === n ? "active" : ""}`}
                  onClick={() => setFeedback({ ...feedback, nota: n })}
                >
                  {n}
                </button>
              ))}
            </div>

            <textarea
              className="input-notes w-full mb-16"
              placeholder="Algum comentário, dúvida ou sugestão?"
              value={feedback.revisao}
              onChange={(e) => setFeedback({ ...feedback, revisao: e.target.value })}
            />

            <div className="flex gap-8">
              <button
                className="btn-ponto out"
                style={{ flex: 1 }}
                onClick={() => baterPonto({ nota: feedback.nota, revisao: feedback.revisao })}
              >
                Confirmar Saída
              </button>
              <button className="btn-secondary" onClick={() => setFeedback({ ...feedback, modal: false })}>
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
