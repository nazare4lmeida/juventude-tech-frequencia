import React, { useState } from "react";
import { fetchComToken } from "./Api";
import { FORMACOES } from "./Constants";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export default function ImportacaoJustificativas({ setView }) {
  const [arquivo, setArquivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [cursoImportacao, setCursoImportacao] = useState("fullstack");

  const processarArquivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setArquivo(file);
    setResultado(null);
  };

  const enviarParaBackend = async (dados) => {
    let inseridos = 0, atualizados = 0, erros = 0, ignorados = 0;
    const erroDetalhes = [];

    for (const [index, linha] of dados.entries()) {
      const email = (
        linha.email || linha.aluno_email || linha["Email"] || linha["E-mail"] ||
        linha["Endereço de e-mail"] || linha["seu e-mail"]
      )?.toString().trim().toLowerCase() || null;

      if (!email) { ignorados++; continue; }

      const nome = (
        linha.nome || linha.nome_aluno || linha.nome_x || linha["Nome"] || linha["Nome Completo"]
      )?.toString().trim() || null;

      const recRaw = (
        linha.frequencia || linha.recorrencia || linha.tipo_recorrencia ||
        linha["Com que frequência isso vai acontecer?"]
      )?.toString().trim() || "";

      const valorCursoBruto = (linha.formacao || linha.curso || cursoImportacao || "").toString().toLowerCase().trim();
      let cursoFinal = cursoImportacao;
      if (valorCursoBruto.includes("full")) cursoFinal = "fullstack";
      else if (valorCursoBruto.includes("gen") || valorCursoBruto.includes("ia")) cursoFinal = "ia-gen";
      else if (valorCursoBruto.includes("mkt") || valorCursoBruto.includes("marketing")) cursoFinal = "mkt-dig";

      try {
        const res = await fetchComToken("/admin/importar-justificativa", "POST", {
          email, nome, formacao: cursoFinal, recorrencia: recRaw,
        });
        const body = await res.json().catch(() => ({}));
        if (res.ok) {
          body.modo === "insert" ? inseridos++ : atualizados++;
        } else {
          erros++;
          erroDetalhes.push(`Linha ${index + 1} (${email}): ${body.error || "Erro desconhecido"}`);
        }
      } catch (err) {
        erros++;
        erroDetalhes.push(`Linha ${index + 1}: Erro de conexão`);
      }
    }
    setResultado({ inseridos, atualizados, ignorados, erros, detalhes: erroDetalhes });
  };

  const handleUpload = () => {
    if (!arquivo) return;
    setLoading(true);
    setResultado(null);
    const ext = arquivo.name.split(".").pop().toLowerCase();

    if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
          const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
          await enviarParaBackend(json);
        } catch { setResultado({ erro: "Erro ao ler arquivo Excel." }); }
        finally { setLoading(false); }
      };
      reader.readAsArrayBuffer(arquivo);
    } else if (ext === "csv") {
      Papa.parse(arquivo, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          await enviarParaBackend(results.data);
          setLoading(false);
        },
        error: () => { setResultado({ erro: "Erro ao ler arquivo CSV." }); setLoading(false); },
      });
    } else {
      setResultado({ erro: "Formato não suportado. Use .csv, .xlsx ou .xls" });
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: "32px auto", padding: "0 20px", animation: "fadeInUp .4s ease" }}>
      <div className="shadow-card p-24">
        <div className="flex justify-between items-center mb-20">
          <div>
            <span className="text-accent text-xs fw-bold" style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Importação
            </span>
            <h2 className="font-display" style={{ fontSize: "1.4rem", fontWeight: 800, marginTop: 4 }}>
              Importar Justificativas
            </h2>
          </div>
          <button className="btn-secondary" onClick={() => setView("limpeza")}>
            Ir para Gestão →
          </button>
        </div>

        <div className="info-banner mb-20">
          <span>ℹ️</span>
          <span>Aceita arquivos <strong>.csv</strong>, <strong>.xlsx</strong> e <strong>.xls</strong>. O sistema detecta automaticamente se a ausência é recorrente ou pontual.</span>
        </div>

        <div className="mb-16">
          <label className="text-xs text-muted fw-bold" style={{ display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Formação dos alunos nesta planilha
          </label>
          <select className="input-modern" value={cursoImportacao} onChange={(e) => setCursoImportacao(e.target.value)}>
            {FORMACOES.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </div>

        {/* UPLOAD ZONE */}
        <div
          style={{
            padding: "40px 20px",
            border: `2px dashed ${arquivo ? "var(--primary)" : "var(--border-active)"}`,
            borderRadius: "var(--radius-lg)",
            textAlign: "center",
            background: arquivo ? "var(--primary-glow)" : "var(--bg-surface)",
            transition: "all var(--transition)",
            marginBottom: 20,
          }}
        >
          <input type="file" id="file-upload" accept=".csv,.xlsx,.xls" onChange={processarArquivo} style={{ display: "none" }} />
          <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>{arquivo ? "📁" : "⬆️"}</div>
          {arquivo ? (
            <>
              <p className="fw-bold mb-8">{arquivo.name}</p>
              <p className="text-muted text-sm">Arquivo pronto para importação</p>
              <button className="btn-ghost text-sm mt-12" onClick={() => { setArquivo(null); setResultado(null); document.getElementById("file-upload").value = ""; }}>
                ✕ Remover
              </button>
            </>
          ) : (
            <>
              <label htmlFor="file-upload" className="btn-secondary" style={{ cursor: "pointer", display: "inline-flex" }}>
                📎 Escolher Planilha
              </label>
              <p className="text-muted text-xs mt-12">CSV, Excel (.xlsx, .xls)</p>
            </>
          )}
        </div>

        <button
          className="btn-ponto in w-full"
          onClick={handleUpload}
          disabled={loading || !arquivo}
        >
          {loading ? (
            <span className="flex items-center gap-8" style={{ justifyContent: "center" }}>
              <span className="loading-spinner" style={{ width: 18, height: 18 }} /> Processando...
            </span>
          ) : "✓ Confirmar Importação"}
        </button>

        {/* RESULTADO */}
        {resultado && (
          <div style={{ marginTop: 20, animation: "fadeInUp .3s ease" }}>
            {resultado.erro ? (
              <div style={{ padding: "14px", background: "var(--danger-bg)", borderRadius: "var(--radius-md)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.25)" }}>
                ❌ {resultado.erro}
              </div>
            ) : (
              <div style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: 20 }}>
                <div className="section-title mb-16">📊 Resultado da Importação</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
                  {[
                    { label: "Inseridos",   val: resultado.inseridos,  cor: "var(--success)" },
                    { label: "Atualizados", val: resultado.atualizados,cor: "var(--info)" },
                    { label: "Ignorados",   val: resultado.ignorados,  cor: "var(--text-dim)" },
                    { label: "Erros",       val: resultado.erros,      cor: "var(--danger)" },
                  ].map((r) => (
                    <div key={r.label} style={{ textAlign: "center", padding: "12px", background: "var(--card-bg)", borderRadius: "var(--radius-sm)" }}>
                      <div className="font-display fw-bold" style={{ fontSize: "1.6rem", color: r.cor }}>{r.val}</div>
                      <div className="text-xs text-muted">{r.label}</div>
                    </div>
                  ))}
                </div>
                {resultado.detalhes?.length > 0 && (
                  <details>
                    <summary className="text-xs text-muted" style={{ cursor: "pointer" }}>Ver detalhes dos erros ({resultado.detalhes.length})</summary>
                    <div style={{ marginTop: 8, maxHeight: 150, overflowY: "auto" }}>
                      {resultado.detalhes.map((d, i) => (
                        <div key={i} className="text-xs" style={{ padding: "4px 0", color: "var(--danger)", borderBottom: "1px solid var(--border)" }}>{d}</div>
                      ))}
                    </div>
                  </details>
                )}
                {resultado.erros === 0 && (resultado.inseridos > 0 || resultado.atualizados > 0) && (
                  <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--success-bg)", borderRadius: "var(--radius-sm)", color: "var(--success)", fontSize: "0.84rem" }}>
                    ✓ Importação concluída com sucesso!
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* COLUNAS ESPERADAS */}
        <div className="divider" />
        <div>
          <div className="section-title mb-12">📋 Colunas esperadas na planilha</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              ["email / E-mail / Endereço de e-mail", "E-mail do aluno (obrigatório)"],
              ["nome / Nome / Nome Completo",         "Nome do aluno"],
              ["formacao / curso",                    "Turma (opcional)"],
              ["frequencia / recorrencia",            "\"sempre\" ou \"uma vez\""],
            ].map(([col, desc]) => (
              <div key={col} style={{ padding: "10px 12px", background: "var(--bg-surface)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <div className="fw-bold text-xs" style={{ color: "var(--primary-light)", marginBottom: 2 }}>{col}</div>
                <div className="text-xs text-muted">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
