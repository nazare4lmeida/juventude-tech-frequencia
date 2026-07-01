import React from "react";
import { FORMACOES, HORARIOS_AULAO, TOLERANCIA_ANTES_MIN, TOLERANCIA_DEPOIS_MIN } from "./Constants";

const Secao = ({ icone, titulo, children }) => (
  <div className="shadow-card p-24 mb-16">
    <h3 style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <span style={{ fontSize: "1.3rem" }}>{icone}</span> {titulo}
    </h3>
    <div style={{ color: "var(--text-dim)", fontSize: "0.92rem", lineHeight: 1.7 }}>
      {children}
    </div>
  </div>
);

export default function Manual({ onVoltar, isDarkMode, setIsDarkMode, publico }) {
  const horarioPadrao = HORARIOS_AULAO.fullstack; // igual para os 3 cursos por padrão

  const conteudo = (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 20px 60px", animation: "fadeInUp .4s ease" }}>
      <button className="btn-ghost mb-16" onClick={onVoltar} style={{ paddingLeft: 0 }}>
        ← Voltar
      </button>

      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <img src="/juvetech-logo.png" alt="Juventude Tech" style={{ height: 40, marginBottom: 12 }} />
        <h1 className="font-display" style={{ fontSize: "1.6rem", fontWeight: 800 }}>
          Manual do Aluno
        </h1>
        <p className="text-muted text-sm">Como usar o sistema de frequência do Juventude Tech</p>
      </div>

      <Secao icone="🧭" titulo="O que é este sistema?">
        <p>
          Este é o sistema oficial de <strong>registro de frequência</strong> do Juventude Tech,
          usado exclusivamente para marcar sua presença nos <strong>aulões ao vivo de sábado</strong> —
          os encontros semanais da sua trilha (Programação Full Stack, Marketing Digital ou
          Inteligência Artificial).
        </p>
        <p style={{ marginTop: 10 }}>
          As aulas gravadas de segunda a sexta continuam sendo acompanhadas normalmente pela
          plataforma <strong>Moodle</strong> — este sistema não controla presença nesses dias.
        </p>
      </Secao>

      <Secao icone="🔑" titulo="Como fazer login">
        <ol style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          <li>Use o <strong>e-mail cadastrado</strong> no programa Juventude Tech / Ceará de Valores.</li>
          <li>Sua senha é a sua <strong>data de nascimento</strong>, no formato DD/MM/AAAA.</li>
          <li>No primeiro acesso, selecione a <strong>formação</strong> (curso) que você está cursando.</li>
        </ol>
        <p style={{ marginTop: 10 }}>
          Não pedimos nenhum outro dado sensível — apenas e-mail e data de nascimento são usados
          para identificar você no sistema.
        </p>
      </Secao>

      <Secao icone="📅" titulo="Quando registrar presença">
        <p>
          O check-in e o check-out só ficam <strong>liberados aos sábados</strong>, exclusivamente
          nas datas de aulão do cronograma oficial da sua trilha — elas aparecem na sua tela
          inicial em "Próximas Aulas".
        </p>
        <div className="horarios-box mt-16">
          <div className="horario-item">
            <span className="horario-label">Início padrão</span>
            <span className="horario-value">{horarioPadrao.inicio}</span>
          </div>
          <div className="horario-divider" />
          <div className="horario-item">
            <span className="horario-label">Fim padrão</span>
            <span className="horario-value">{horarioPadrao.fim}</span>
          </div>
          <div className="horario-divider" />
          <div className="horario-item">
            <span className="horario-label">Dia</span>
            <span className="horario-value">Sábado</span>
          </div>
        </div>
        <p style={{ marginTop: 12, fontSize: "0.85rem" }}>
          O check-in abre {TOLERANCIA_ANTES_MIN} minutos antes do início do aulão e continua
          disponível até {TOLERANCIA_DEPOIS_MIN} minutos depois. O check-out segue a mesma regra
          em torno do horário de encerramento. Fora dessa janela, os botões ficam bloqueados — isso
          é esperado e não é um erro do sistema.
        </p>
      </Secao>

      <Secao icone="📍" titulo="Check-in e Check-out, passo a passo">
        <ol style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          <li>Ao chegar para o aulão (online, ao vivo), abra o sistema e toque em <strong>📍 CHECK-IN</strong>.</li>
          <li>Ao final do encontro, dentro da janela de saída, toque em <strong>🚪 CHECK-OUT</strong>.</li>
          <li>
            No check-out, você verá um pedido de <strong>feedback rápido</strong>: dê uma nota de
            <strong> 1 a 5</strong> para a aula e, se quiser, deixe um comentário, dúvida ou sugestão.
            O feedback é obrigatório para concluir o check-out.
          </li>
        </ol>
      </Secao>

      <Secao icone="📊" titulo="Frequência e faltas">
        <p>Para ser considerado participante regular do Juventude Tech, é necessário:</p>
        <ul style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
          <li>Concluir pelo menos 75% das aulas gravadas (Moodle);</li>
          <li>Entregar o projeto da trilha;</li>
          <li>Participar de pelo menos 1 aulão/atividade presencial;</li>
          <li>Manter check-in e check-out em dia nos sábados de aulão.</li>
        </ul>
        <p style={{ marginTop: 10 }}>
          Sua porcentagem de frequência aparece em tempo real na sua tela inicial. Em caso de falta
          justificada, procure a coordenação do programa.
        </p>
      </Secao>

      <Secao icone="🎓" titulo="Trilhas disponíveis">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {FORMACOES.map((f) => (
            <div key={f.id} className="flex items-center gap-8" style={{ justifyContent: "space-between" }}>
              <span><span style={{ marginRight: 6 }}></span>{f.nome}</span>
              <span className="text-xs text-muted">{f.horas}</span>
            </div>
          ))}
        </div>
      </Secao>

      <Secao icone="👤" titulo="Meu Perfil">
        <p>
          Em "Meu Perfil" você pode atualizar seu nome de exibição e escolher um avatar. O e-mail
          de login não pode ser alterado por você — em caso de e-mail incorreto, procure a
          coordenação.
        </p>
      </Secao>

      <Secao icone="❓" titulo="Problemas comuns">
        <ul style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          <li><strong>"Hoje não há aulão para o seu curso":</strong> hoje não é uma data de aulão da sua trilha — confira "Próximas Aulas" na tela inicial.</li>
          <li><strong>Botão de check-in/check-out bloqueado:</strong> você está fora da janela de horário liberada. Aguarde o horário oficial do aulão.</li>
          <li><strong>Esqueci de fazer check-out:</strong> avise a coordenação — o ajuste manual é feito pela equipe administrativa.</li>
          <li><strong>Data de nascimento não confere:</strong> confirme o formato DD/MM/AAAA; se persistir, fale com o suporte do programa.</li>
        </ul>
      </Secao>

      <p className="text-xs text-muted" style={{ textAlign: "center", marginTop: 24 }}>
        Dúvidas que não foram respondidas aqui? Procure a coordenação do Juventude Tech pelos
        canais oficiais do programa.
      </p>
    </div>
  );

  if (!publico) return conteudo;

  return (
    <div className="app-wrapper">
      <header className="glass-header">
        <div className="brand-logo">
          <img src="/juvetech-logo.png" alt="Juventude Tech" className="brand-logo-img" />
          <div className="brand-text">
            Registro de Frequência
            <span>Juventude Tech</span>
          </div>
        </div>
        <div className="header-right">
          <div className="nav-actions">
            <button className="btn-action-circle" title="Alternar Tema" onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? "○" : "●"}
            </button>
          </div>
        </div>
      </header>
      {conteudo}
    </div>
  );
}
