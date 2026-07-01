import React from "react";
import { FORMACOES } from "./Constants";

export default function Login({
  form, setForm, handleLogin, dadosSalvos, setDadosSalvos, isDarkMode, setIsDarkMode, onAbrirManual,
}) {
  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleUseAnotherAccount = () => {
    localStorage.removeItem("juventudetech_remember");
    setDadosSalvos(null);
    setForm({ email: "", dataNasc: "", formacao: "" });
  };

  return (
    <div className="login-container">
      <button
        className="btn-action-circle"
        onClick={() => setIsDarkMode(!isDarkMode)}
        style={{ position: "fixed", top: 20, right: 20, zIndex: 1000 }}
        title="Alternar tema"
      >
        {isDarkMode ? "○" : "●"}
      </button>

      <div className="login-card">
        <img src="/juvetech-logo.png" alt="Juventude Tech" className="login-logo" />
        <h1>Registro de Frequência</h1>
        <p className="subtitle">Juventude Tech</p>

        {dadosSalvos ? (
          <div className="welcome-back">
            <p className="text-muted text-sm" style={{ marginBottom: 4 }}>
              Bem-vindo(a) de volta
            </p>
            <div className="user-name-badge">
              {dadosSalvos.nome || dadosSalvos.email}
            </div>
            <p className="text-muted text-xs" style={{ marginBottom: 20 }}>
              {FORMACOES.find((f) => f.id === dadosSalvos.formacao)?.nome || "Turma não definida"}
            </p>
            <button onClick={handleLogin} className="btn-ponto in w-full" style={{ marginBottom: 10 }}>
              ✓ Confirmar e Entrar
            </button>
            <button onClick={handleUseAnotherAccount} className="btn-ghost w-full">
              Usar outra conta
            </button>
          </div>
        ) : (
          <div className="login-form">
            <input
              type="email"
              className="input-modern"
              placeholder="Seu e-mail cadastrado"
              value={form.email}
              onChange={handleChange("email")}
              autoComplete="email"
            />
            <input
              type="text"
              className="input-modern"
              placeholder="Data de nascimento (DD/MM/AAAA)"
              value={form.dataNasc}
              onChange={(e) => {
                let v = e.target.value.replace(/\D/g, "");
                if (v.length > 8) v = v.slice(0, 8);
                if (v.length >= 5) v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
                else if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                setForm({ ...form, dataNasc: v });
              }}
              maxLength={10}
            />
            <select
              className="input-modern"
              value={form.formacao || ""}
              onChange={handleChange("formacao")}
              style={{ appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7fa0' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
            >
              <option value="">Selecione sua Formação</option>
              {FORMACOES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
            <button
              onClick={handleLogin}
              className="btn-ponto in w-full"
              disabled={!form.formacao || !form.email || !form.dataNasc}
              style={{ marginTop: 4 }}
            >
              Entrar no Portal
            </button>
          </div>
        )}

        <p className="usability-info">
          Utilize seu e-mail cadastrado no programa. Primeiro acesso: sua senha é sua data de nascimento (DD/MM/AAAA).
        </p>

        {onAbrirManual && (
          <button
            type="button"
            className="btn-ghost w-full"
            style={{ marginTop: 10 }}
            onClick={onAbrirManual}
          >
            📘 Como funciona o sistema? Ver Manual do Aluno
          </button>
        )}
      </div>
    </div>
  );
}
