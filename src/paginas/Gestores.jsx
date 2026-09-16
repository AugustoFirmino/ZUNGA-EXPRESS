import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  FaUsersCog,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaTimes,
  FaSave,
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaTimesCircle,
  FaUserShield,
  FaPhone,
  FaEnvelope,
  FaBriefcase,
  FaSyncAlt,
  FaToggleOn,
  FaToggleOff,
  FaKey,
  FaChartBar,
  FaUsers,
  FaTags,
  FaBox,
  FaShoppingCart,
  FaMoneyBillWave,
  FaCreditCard,
  FaFileAlt,
  FaUser,
  FaExclamationTriangle,
  FaPowerOff,
  FaImage,
  FaUpload,
  FaCamera,
} from "react-icons/fa";

// =====================================================
// CONFIGURAÇÃO DA API
// =====================================================

import { API_URL } from "../../servidor/api";

const API_GESTORES = `${API_URL}/gestores`;

// =====================================================
// FORMULÁRIO INICIAL
// =====================================================

const formularioInicial = {
  nome: "",
  email: "",
  telefone: "",
  senha: "",
  cargo: "",

  permissao_dashboard: true,
  permissao_clientes: false,
  permissao_categorias: false,
  permissao_produtos: false,
  permissao_pedidos: false,
  permissao_vendas: false,
  permissao_pagamentos: false,
  permissao_relatorios: false,

  ativo: true,
};

// =====================================================
// PERMISSÕES
// =====================================================

const permissoes = [
  {
    campo: "permissao_dashboard",
    nome: "Dashboard",
    descricao: "Acesso ao painel principal",
    icone: FaChartBar,
  },
  {
    campo: "permissao_clientes",
    nome: "Clientes",
    descricao: "Gerir clientes",
    icone: FaUsers,
  },
  {
    campo: "permissao_categorias",
    nome: "Categorias",
    descricao: "Gerir categorias",
    icone: FaTags,
  },
  {
    campo: "permissao_produtos",
    nome: "Produtos",
    descricao: "Gerir produtos",
    icone: FaBox,
  },
  {
    campo: "permissao_pedidos",
    nome: "Pedidos",
    descricao: "Gerir pedidos",
    icone: FaShoppingCart,
  },
  {
    campo: "permissao_vendas",
    nome: "Vendas",
    descricao: "Aceder às vendas",
    icone: FaMoneyBillWave,
  },
  {
    campo: "permissao_pagamentos",
    nome: "Pagamentos",
    descricao: "Gerir pagamentos",
    icone: FaCreditCard,
  },
  {
    campo: "permissao_relatorios",
    nome: "Relatórios",
    descricao: "Consultar relatórios",
    icone: FaFileAlt,
  },
];

// =====================================================
// CONVERTER BOOLEAN
// =====================================================

const converterBoolean = (valor) => {
  return (
    valor === true ||
    valor === 1 ||
    valor === "1" ||
    valor === "true"
  );
};

// =====================================================
// LER RESPOSTA DA API
// =====================================================

const lerResposta = async (resposta) => {
  const texto = await resposta.text();

  if (!texto) {
    return {};
  }

  try {
    return JSON.parse(texto);
  } catch {
    return {
      mensagem: texto,
    };
  }
};

// =====================================================
// OBTER URL DA IMAGEM
// =====================================================

const obterUrlImagem = (gestor) => {
  if (!gestor) {
    return "";
  }

  const camposImagem = [
    "cloudinary_url",
    "imagem_url",
    "foto_url",
    "avatar_url",
    "imagem",
    "foto",
  ];

  for (const campo of camposImagem) {
    const valor = gestor[campo];

    if (
      typeof valor === "string" &&
      valor.trim() !== ""
    ) {
      return valor.trim();
    }
  }

  return "";
};

// =====================================================
// COMPONENTE
// =====================================================

export default function Gestores() {
  // =====================================================
  // ESTADOS PRINCIPAIS
  // =====================================================

  const [gestores, setGestores] = useState([]);

  const [carregando, setCarregando] = useState(true);

  const [salvando, setSalvando] = useState(false);

  const [eliminando, setEliminando] = useState(false);

  const [erro, setErro] = useState("");

  const [sucesso, setSucesso] = useState("");

  const [pesquisa, setPesquisa] = useState("");

  const [filtroEstado, setFiltroEstado] = useState("todos");

  // =====================================================
  // MODAL
  // =====================================================

  const [mostrarModal, setMostrarModal] = useState(false);

  const [modoEdicao, setModoEdicao] = useState(false);

  const [gestorSelecionado, setGestorSelecionado] = useState(null);

  const [mostrarSenha, setMostrarSenha] = useState(false);

  // =====================================================
  // FORMULÁRIO
  // =====================================================

  const [formulario, setFormulario] = useState({
    ...formularioInicial,
  });

  // =====================================================
  // IMAGEM
  // =====================================================

  const [imagemArquivo, setImagemArquivo] = useState(null);

  const [imagemPreview, setImagemPreview] = useState("");

  const [imagemExistente, setImagemExistente] = useState("");

  const inputImagemRef = useRef(null);

  // =====================================================
  // ESTADO
  // =====================================================

  const [alterandoEstadoId, setAlterandoEstadoId] = useState(null);

  // =====================================================
  // CONFIRMAÇÃO
  // =====================================================

  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

  const [tipoConfirmacao, setTipoConfirmacao] = useState(null);

  const [gestorConfirmacao, setGestorConfirmacao] = useState(null);

  // =====================================================
  // MENSAGENS
  // =====================================================

  const limparMensagens = () => {
    setErro("");
    setSucesso("");
  };

  const mostrarSucesso = (mensagem) => {
    setSucesso(mensagem);

    setTimeout(() => {
      setSucesso("");
    }, 4000);
  };

  // =====================================================
  // CARREGAR GESTORES
  // =====================================================

  const carregarGestores = async () => {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await fetch(API_GESTORES, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      const dados = await lerResposta(resposta);

      if (!resposta.ok) {
        throw new Error(
          dados?.mensagem ||
            dados?.message ||
            "Erro ao carregar gestores."
        );
      }

      const lista =
        dados?.gestores ??
        dados?.data ??
        dados?.resultados ??
        (Array.isArray(dados) ? dados : []);

      setGestores(Array.isArray(lista) ? lista : []);
    } catch (error) {
      console.error("Erro ao carregar gestores:", error);

      setErro(
        error.message ||
          "Não foi possível carregar os gestores."
      );
    } finally {
      setCarregando(false);
    }
  };

  // =====================================================
  // CARREGAR AO ABRIR
  // =====================================================

  useEffect(() => {
    carregarGestores();
  }, []);

  // =====================================================
  // LIMPAR URL DA IMAGEM AO DESMONTAR
  // =====================================================

  useEffect(() => {
    return () => {
      if (
        imagemPreview &&
        imagemPreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(imagemPreview);
      }
    };
  }, [imagemPreview]);

  // =====================================================
  // FILTRAR
  // =====================================================

  const gestoresFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    return gestores.filter((gestor) => {
      const correspondePesquisa =
        !termo ||
        String(gestor.nome || "")
          .toLowerCase()
          .includes(termo) ||
        String(gestor.email || "")
          .toLowerCase()
          .includes(termo) ||
        String(gestor.telefone || "")
          .toLowerCase()
          .includes(termo) ||
        String(gestor.cargo || "")
          .toLowerCase()
          .includes(termo);

      const ativo = converterBoolean(gestor.ativo);

      const correspondeEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "ativos" && ativo) ||
        (filtroEstado === "inativos" && !ativo);

      return correspondePesquisa && correspondeEstado;
    });
  }, [gestores, pesquisa, filtroEstado]);

  // =====================================================
  // ESTATÍSTICAS
  // =====================================================

  const totalGestores = gestores.length;

  const gestoresAtivos = gestores.filter((gestor) =>
    converterBoolean(gestor.ativo)
  ).length;

  const gestoresInativos =
    totalGestores - gestoresAtivos;

  // =====================================================
  // LIMPAR IMAGEM
  // =====================================================

  const limparImagem = () => {
    if (
      imagemPreview &&
      imagemPreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(imagemPreview);
    }

    setImagemArquivo(null);
    setImagemPreview("");

    if (inputImagemRef.current) {
      inputImagemRef.current.value = "";
    }
  };

  // =====================================================
  // ABRIR CADASTRO
  // =====================================================

  const abrirCadastro = () => {
    limparMensagens();

    limparImagem();

    setModoEdicao(false);

    setGestorSelecionado(null);

    setFormulario({
      ...formularioInicial,
    });

    setMostrarSenha(false);

    setImagemExistente("");

    setMostrarModal(true);
  };

  // =====================================================
  // ABRIR EDIÇÃO
  // =====================================================

  const abrirEdicao = (gestor) => {
    limparMensagens();

    limparImagem();

    setModoEdicao(true);

    setGestorSelecionado(gestor);

    setFormulario({
      nome: gestor.nome || "",
      email: gestor.email || "",
      telefone: gestor.telefone || "",
      senha: "",
      cargo: gestor.cargo || "",

      permissao_dashboard: converterBoolean(
        gestor.permissao_dashboard
      ),

      permissao_clientes: converterBoolean(
        gestor.permissao_clientes
      ),

      permissao_categorias: converterBoolean(
        gestor.permissao_categorias
      ),

      permissao_produtos: converterBoolean(
        gestor.permissao_produtos
      ),

      permissao_pedidos: converterBoolean(
        gestor.permissao_pedidos
      ),

      permissao_vendas: converterBoolean(
        gestor.permissao_vendas
      ),

      permissao_pagamentos: converterBoolean(
        gestor.permissao_pagamentos
      ),

      permissao_relatorios: converterBoolean(
        gestor.permissao_relatorios
      ),

      ativo: converterBoolean(gestor.ativo),
    });

    setImagemExistente(
      obterUrlImagem(gestor)
    );

    setMostrarSenha(false);

    setMostrarModal(true);
  };

  // =====================================================
  // FECHAR MODAL
  // =====================================================

  const fecharModal = () => {
    if (salvando) {
      return;
    }

    limparImagem();

    setMostrarModal(false);

    setModoEdicao(false);

    setGestorSelecionado(null);

    setFormulario({
      ...formularioInicial,
    });

    setMostrarSenha(false);

    setImagemExistente("");
  };

  // =====================================================
  // ALTERAR CAMPO
  // =====================================================

  const alterarCampo = (campo, valor) => {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  // =====================================================
  // ALTERAR PERMISSÃO
  // =====================================================

  const alterarPermissao = (campo) => {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: !anterior[campo],
    }));
  };

  // =====================================================
  // SELECIONAR IMAGEM
  // =====================================================

  const selecionarImagem = (evento) => {
    const arquivo = evento.target.files?.[0];

    if (!arquivo) {
      return;
    }

    limparMensagens();

    const tiposPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!tiposPermitidos.includes(arquivo.type)) {
      setErro(
        "Formato inválido. Use JPG, PNG ou WEBP."
      );

      evento.target.value = "";

      return;
    }

    const tamanhoMaximo = 5 * 1024 * 1024;

    if (arquivo.size > tamanhoMaximo) {
      setErro(
        "A imagem não pode ter mais de 5 MB."
      );

      evento.target.value = "";

      return;
    }

    // Revogar preview anterior
    if (
      imagemPreview &&
      imagemPreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(imagemPreview);
    }

    const novaUrl = URL.createObjectURL(arquivo);

    setImagemArquivo(arquivo);

    setImagemPreview(novaUrl);

    // Se selecionou nova imagem,
    // deixa de mostrar a imagem antiga
    setImagemExistente("");
  };

  // =====================================================
  // REMOVER IMAGEM
  // =====================================================

  const removerImagem = () => {
    limparImagem();

    setImagemExistente("");
  };

  // =====================================================
  // VALIDAR
  // =====================================================

  const validarFormulario = () => {
    const nome = formulario.nome.trim();
    const email = formulario.email.trim();
    const telefone = formulario.telefone.trim();
    const cargo = formulario.cargo.trim();
    const senha = formulario.senha.trim();

    if (!nome) {
      return "Informe o nome do gestor.";
    }

    if (!email) {
      return "Informe o email do gestor.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return "Informe um email válido.";
    }

    if (!telefone) {
      return "Informe o telefone do gestor.";
    }

    if (!cargo) {
      return "Informe o cargo do gestor.";
    }

    if (!modoEdicao && !senha) {
      return "Informe a senha do gestor.";
    }

    if (senha && senha.length < 6) {
      return "A senha deve ter pelo menos 6 caracteres.";
    }

    return null;
  };

  // =====================================================
  // SALVAR GESTOR
  // =====================================================

  const salvarGestor = async (evento) => {
    evento.preventDefault();

    limparMensagens();

    const erroValidacao = validarFormulario();

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    if (
      modoEdicao &&
      !gestorSelecionado?.id
    ) {
      setErro(
        "Não foi possível identificar o gestor."
      );

      return;
    }

    try {
      setSalvando(true);

      const dadosFormulario = new FormData();

      dadosFormulario.append(
        "nome",
        formulario.nome.trim()
      );

      dadosFormulario.append(
        "email",
        formulario.email.trim()
      );

      dadosFormulario.append(
        "telefone",
        formulario.telefone.trim()
      );

      dadosFormulario.append(
        "cargo",
        formulario.cargo.trim()
      );

      dadosFormulario.append(
        "permissao_dashboard",
        formulario.permissao_dashboard ? "1" : "0"
      );

      dadosFormulario.append(
        "permissao_clientes",
        formulario.permissao_clientes ? "1" : "0"
      );

      dadosFormulario.append(
        "permissao_categorias",
        formulario.permissao_categorias ? "1" : "0"
      );

      dadosFormulario.append(
        "permissao_produtos",
        formulario.permissao_produtos ? "1" : "0"
      );

      dadosFormulario.append(
        "permissao_pedidos",
        formulario.permissao_pedidos ? "1" : "0"
      );

      dadosFormulario.append(
        "permissao_vendas",
        formulario.permissao_vendas ? "1" : "0"
      );

      dadosFormulario.append(
        "permissao_pagamentos",
        formulario.permissao_pagamentos ? "1" : "0"
      );

      dadosFormulario.append(
        "permissao_relatorios",
        formulario.permissao_relatorios ? "1" : "0"
      );

      dadosFormulario.append(
        "ativo",
        formulario.ativo ? "1" : "0"
      );

      // =================================================
      // SENHA
      // =================================================

      if (formulario.senha.trim()) {
        dadosFormulario.append(
          "senha",
          formulario.senha
        );
      }

      // =================================================
      // IMAGEM
      // =================================================

      if (imagemArquivo instanceof File) {
        dadosFormulario.append(
          "imagem",
          imagemArquivo,
          imagemArquivo.name
        );
      }

      // =================================================
      // URL
      // =================================================

      const url = modoEdicao
        ? `${API_GESTORES}/${gestorSelecionado.id}`
        : API_GESTORES;

      const metodo = modoEdicao
        ? "PUT"
        : "POST";

      console.log(
        "Enviando gestor para:",
        url
      );

      const resposta = await fetch(url, {
        method: metodo,

        headers: {
          Accept: "application/json",
        },

        // IMPORTANTE:
        // NÃO colocar Content-Type aqui.
        // O navegador cria automaticamente
        // o multipart/form-data.
        body: dadosFormulario,
      });

      const dados = await lerResposta(resposta);

      if (!resposta.ok) {
        throw new Error(
          dados?.mensagem ||
            dados?.message ||
            "Erro ao guardar gestor."
        );
      }

      // =================================================
      // LIMPAR FORMULÁRIO
      // =================================================

      limparImagem();

      setMostrarModal(false);

      setModoEdicao(false);

      setGestorSelecionado(null);

      setFormulario({
        ...formularioInicial,
      });

      setMostrarSenha(false);

      setImagemExistente("");

      // =================================================
      // RECARREGAR
      // =================================================

      await carregarGestores();

      mostrarSucesso(
        modoEdicao
          ? "Gestor atualizado com sucesso."
          : "Gestor cadastrado com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao guardar gestor:",
        error
      );

      setErro(
        error.message ||
          "Erro ao guardar gestor."
      );
    } finally {
      setSalvando(false);
    }
  };

  // =====================================================
  // SOLICITAR ALTERAÇÃO DE ESTADO
  // =====================================================

  const solicitarAlteracaoEstado = (gestor) => {
    if (!gestor?.id) {
      setErro(
        "Não foi possível identificar o gestor."
      );

      return;
    }

    if (
      alterandoEstadoId !== null ||
      eliminando ||
      salvando
    ) {
      return;
    }

    limparMensagens();

    setGestorConfirmacao(gestor);

    setTipoConfirmacao("estado");

    setMostrarConfirmacao(true);
  };

  // =====================================================
  // SOLICITAR ELIMINAÇÃO
  // =====================================================

  const solicitarEliminacao = (gestor) => {
    if (!gestor?.id) {
      setErro(
        "Não foi possível identificar o gestor."
      );

      return;
    }

    if (
      alterandoEstadoId !== null ||
      eliminando ||
      salvando
    ) {
      return;
    }

    limparMensagens();

    setGestorConfirmacao(gestor);

    setTipoConfirmacao("eliminar");

    setMostrarConfirmacao(true);
  };

  // =====================================================
  // FECHAR CONFIRMAÇÃO
  // =====================================================

  const fecharConfirmacao = () => {
    if (
      alterandoEstadoId !== null ||
      eliminando
    ) {
      return;
    }

    setMostrarConfirmacao(false);

    setTipoConfirmacao(null);

    setGestorConfirmacao(null);
  };

  // =====================================================
  // CONFIRMAR AÇÃO
  // =====================================================

  const confirmarAcao = async () => {
    if (!gestorConfirmacao?.id) {
      setErro(
        "Não foi possível identificar o gestor."
      );

      setMostrarConfirmacao(false);

      setTipoConfirmacao(null);

      setGestorConfirmacao(null);

      return;
    }

    if (
      alterandoEstadoId !== null ||
      eliminando
    ) {
      return;
    }

    // =================================================
    // ALTERAR ESTADO
    // =================================================

    if (tipoConfirmacao === "estado") {
      const gestor = gestorConfirmacao;

      const estadoAtual = converterBoolean(
        gestor.ativo
      );

      const novoEstado = estadoAtual ? 0 : 1;

      try {
        limparMensagens();

        setAlterandoEstadoId(gestor.id);

        const resposta = await fetch(
          `${API_GESTORES}/${gestor.id}/estado`,
          {
            method: "PUT",

            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },

            body: JSON.stringify({
              ativo: novoEstado,
            }),
          }
        );

        const dados = await lerResposta(resposta);

        if (!resposta.ok) {
          throw new Error(
            dados?.mensagem ||
              dados?.message ||
              "Não foi possível alterar o estado."
          );
        }

        setGestores((listaAnterior) =>
          listaAnterior.map((item) =>
            String(item.id) ===
            String(gestor.id)
              ? {
                  ...item,
                  ativo: novoEstado,
                }
              : item
          )
        );

        setMostrarConfirmacao(false);

        setTipoConfirmacao(null);

        setGestorConfirmacao(null);

        mostrarSucesso(
          novoEstado === 1
            ? `O gestor "${gestor.nome}" foi ativado com sucesso.`
            : `O gestor "${gestor.nome}" foi desativado com sucesso.`
        );
      } catch (error) {
        console.error(
          "Erro ao alterar estado:",
          error
        );

        setErro(
          error.message ||
            "Erro ao alterar o estado."
        );
      } finally {
        setAlterandoEstadoId(null);
      }

      return;
    }

    // =================================================
    // ELIMINAR
    // =================================================

    if (tipoConfirmacao === "eliminar") {
      const gestor = gestorConfirmacao;

      try {
        limparMensagens();

        setEliminando(true);

        const resposta = await fetch(
          `${API_GESTORES}/${gestor.id}`,
          {
            method: "DELETE",

            headers: {
              Accept: "application/json",
            },
          }
        );

        const dados = await lerResposta(resposta);

        if (!resposta.ok) {
          throw new Error(
            dados?.mensagem ||
              dados?.message ||
              "Não foi possível eliminar o gestor."
          );
        }

        setGestores((listaAnterior) =>
          listaAnterior.filter(
            (item) =>
              String(item.id) !==
              String(gestor.id)
          )
        );

        setMostrarConfirmacao(false);

        setTipoConfirmacao(null);

        setGestorConfirmacao(null);

        mostrarSucesso(
          `O gestor "${gestor.nome}" foi eliminado com sucesso.`
        );
      } catch (error) {
        console.error(
          "Erro ao eliminar gestor:",
          error
        );

        setErro(
          error.message ||
            "Erro ao eliminar gestor."
        );
      } finally {
        setEliminando(false);
      }
    }
  };

  // =====================================================
  // FORMATAR DATA
  // =====================================================

  const formatarData = (data) => {
    if (!data) {
      return "-";
    }

    const dataFormatada = new Date(data);

    if (
      Number.isNaN(
        dataFormatada.getTime()
      )
    ) {
      return "-";
    }

    return dataFormatada.toLocaleDateString(
      "pt-PT",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // CONFIRMAÇÃO
  // =====================================================

  const confirmarEliminacao =
    tipoConfirmacao === "eliminar";

  const gestorEstaAtivo = gestorConfirmacao
    ? converterBoolean(
        gestorConfirmacao.ativo
      )
    : false;

  const textoAcaoEstado =
    gestorEstaAtivo
      ? "desativar"
      : "ativar";

  const processandoConfirmacao =
    alterandoEstadoId !== null ||
    eliminando;

  // =====================================================
  // IMAGEM DO FORMULÁRIO
  // =====================================================

  const imagemAtualFormulario =
    imagemPreview ||
    imagemExistente;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">

      {/* =================================================
          CABEÇALHO
      ================================================= */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex items-center gap-3">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white shadow">
            <FaUsersCog size={23} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Gestores
            </h1>

            <p className="text-sm text-gray-500">
              Gerencie os utilizadores responsáveis pelo site
            </p>
          </div>

        </div>

        <div className="flex gap-2">

          <button
            type="button"
            onClick={carregarGestores}
            disabled={
              carregando ||
              alterandoEstadoId !== null ||
              eliminando
            }
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaSyncAlt
              className={
                carregando
                  ? "animate-spin"
                  : ""
              }
            />

            Atualizar
          </button>

          <button
            type="button"
            onClick={abrirCadastro}
            disabled={
              alterandoEstadoId !== null ||
              eliminando
            }
            className="flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaPlus />

            Novo gestor
          </button>

        </div>

      </div>

      {/* =================================================
          SUCESSO
      ================================================= */}

      {sucesso && (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

          <FaCheck />

          <span>{sucesso}</span>

          <button
            type="button"
            onClick={() => setSucesso("")}
            className="ml-auto"
          >
            <FaTimes />
          </button>

        </div>
      )}

      {/* =================================================
          ERRO
      ================================================= */}

      {erro && (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <FaTimesCircle />

          <span>{erro}</span>

          <button
            type="button"
            onClick={() => setErro("")}
            className="ml-auto"
          >
            <FaTimes />
          </button>

        </div>
      )}

      {/* =================================================
          ESTATÍSTICAS
      ================================================= */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Total de gestores
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-800">
                {totalGestores}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <FaUsersCog />
            </div>

          </div>

        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Gestores ativos
              </p>

              <p className="mt-1 text-2xl font-bold text-green-600">
                {gestoresAtivos}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <FaCheck />
            </div>

          </div>

        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Gestores inativos
              </p>

              <p className="mt-1 text-2xl font-bold text-red-600">
                {gestoresInativos}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <FaTimesCircle />
            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          FILTROS
      ================================================= */}

      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-3 md:flex-row">

          <div className="relative flex-1">

            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={pesquisa}
              onChange={(e) =>
                setPesquisa(e.target.value)
              }
              placeholder="Pesquisar por nome, email, telefone ou cargo..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />

          </div>

          <select
            value={filtroEstado}
            onChange={(e) =>
              setFiltroEstado(e.target.value)
            }
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="todos">
              Todos os gestores
            </option>

            <option value="ativos">
              Apenas ativos
            </option>

            <option value="inativos">
              Apenas inativos
            </option>
          </select>

        </div>

      </div>

      {/* =================================================
          TABELA
      ================================================= */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1100px]">

             <thead className="bg-slate-950 text-xs uppercase tracking-wide text-white">


              <tr>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white">
                  Gestor
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-white">
                  Contacto
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide  text-white">
                  Cargo
                </th>

                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide  text-white">
                  Permissões
                </th>

                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide  text-white">
                  Estado
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide  text-white">
                  Criado
                </th>

                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide  text-white">
                  Ações
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100">

              {carregando ? (

                <tr>

                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center"
                  >

                    <FaSyncAlt className="mx-auto animate-spin text-2xl text-indigo-600" />

                    <p className="mt-3 text-sm text-gray-500">
                      Carregando gestores...
                    </p>

                  </td>

                </tr>

              ) : gestoresFiltrados.length === 0 ? (

                <tr>

                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center"
                  >

                    <FaUsersCog className="mx-auto text-4xl text-gray-300" />

                    <p className="mt-3 font-medium text-gray-600">
                      Nenhum gestor encontrado
                    </p>

                    <p className="mt-1 text-sm text-gray-400">
                      Tente alterar a pesquisa ou cadastre um novo gestor.
                    </p>

                  </td>

                </tr>

              ) : (

                gestoresFiltrados.map((gestor) => {

                  const ativo =
                    converterBoolean(
                      gestor.ativo
                    );

                  const alterando =
                    alterandoEstadoId !== null &&
                    String(alterandoEstadoId) ===
                      String(gestor.id);

                  const totalPermissoes =
                    permissoes.filter(
                      (permissao) =>
                        converterBoolean(
                          gestor[permissao.campo]
                        )
                    ).length;

                  const imagemGestor =
                    obterUrlImagem(gestor);

                  return (
                    <tr
                      key={gestor.id}
                      className="transition hover:bg-gray-50"
                    >

                      {/* GESTOR */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          {imagemGestor ? (

                            <img
                              src={imagemGestor}
                              alt={
                                gestor.nome ||
                                "Gestor"
                              }
                              className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-indigo-100"
                              onError={(e) => {
                                e.currentTarget.style.display =
                                  "none";

                                e.currentTarget.nextElementSibling?.classList.remove(
                                  "hidden"
                                );
                              }}
                            />

                          ) : null}

                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 ${
                              imagemGestor
                                ? "hidden"
                                : ""
                            }`}
                          >
                            {String(
                              gestor.nome || "G"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>

                            <p className="font-semibold text-gray-800">
                              {gestor.nome}
                            </p>

                            <p className="text-xs text-gray-400">
                              ID #{gestor.id}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* CONTACTO */}

                      <td className="px-5 py-4">

                        <div className="space-y-1 text-sm">

                          <div className="flex items-center gap-2 text-gray-600">

                            <FaEnvelope className="text-gray-400" />

                            {gestor.email || "-"}

                          </div>

                          <div className="flex items-center gap-2 text-gray-500">

                            <FaPhone className="text-gray-400" />

                            {gestor.telefone || "-"}

                          </div>

                        </div>

                      </td>

                      {/* CARGO */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-2">

                          <FaBriefcase className="text-gray-400" />

                          <span className="text-sm font-medium text-gray-700">
                            {gestor.cargo || "-"}
                          </span>

                        </div>

                      </td>

                      {/* PERMISSÕES */}

                      <td className="px-5 py-4 text-center">

                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">

                          <FaKey />

                          {totalPermissoes}/
                          {permissoes.length}

                        </span>

                      </td>

                      {/* ESTADO */}

                      <td className="px-5 py-4 text-center">

                        {ativo ? (

                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">

                            <FaCheck />

                            Ativo

                          </span>

                        ) : (

                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">

                            <FaTimesCircle />

                            Inativo

                          </span>

                        )}

                      </td>

                      {/* DATA */}

                      <td className="px-5 py-4 text-sm text-gray-500">

                        {formatarData(
                          gestor.criado_em
                        )}

                      </td>

                      {/* AÇÕES */}

                      <td className="px-5 py-4">

                        <div className="flex items-center justify-center gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              solicitarAlteracaoEstado(
                                gestor
                              )
                            }
                            disabled={
                              alterando ||
                              alterandoEstadoId !== null ||
                              salvando ||
                              eliminando
                            }
                            title={
                              ativo
                                ? "Desativar gestor"
                                : "Ativar gestor"
                            }
                            className={`flex h-9 w-9 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              ativo
                                ? "bg-green-50 text-green-600 hover:bg-green-100"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >

                            {alterando ? (

                              <FaSyncAlt className="animate-spin" />

                            ) : ativo ? (

                              <FaToggleOn size={21} />

                            ) : (

                              <FaToggleOff size={21} />

                            )}

                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              abrirEdicao(gestor)
                            }
                            disabled={
                              alterandoEstadoId !== null ||
                              eliminando
                            }
                            title="Editar gestor"
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <FaEdit />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              solicitarEliminacao(
                                gestor
                              )
                            }
                            disabled={
                              eliminando ||
                              alterandoEstadoId !== null ||
                              salvando
                            }
                            title="Eliminar gestor"
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <FaTrash />
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })

              )}

            </tbody>

          </table>

        </div>

        {!carregando &&
          gestoresFiltrados.length > 0 && (

            <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 text-sm text-gray-500">

              A mostrar{" "}

              <strong>
                {gestoresFiltrados.length}
              </strong>{" "}

              de{" "}

              <strong>
                {gestores.length}
              </strong>{" "}

              gestores.

            </div>

          )}

      </div>

      {/* =================================================
          MODAL CADASTRO / EDIÇÃO
      ================================================= */}

      {mostrarModal && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget
            ) {
              fecharModal();
            }
          }}
        >

          <div className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* CABEÇALHO */}

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">

                  {modoEdicao ? (
                    <FaEdit />
                  ) : (
                    <FaUserShield />
                  )}

                </div>

                <div>

                  <h2 className="text-lg font-bold text-gray-800">

                    {modoEdicao
                      ? "Editar gestor"
                      : "Cadastrar gestor"}

                  </h2>

                  <p className="text-xs text-gray-500">

                    {modoEdicao
                      ? "Atualize os dados, imagem e permissões."
                      : "Preencha os dados do novo gestor."}

                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={fecharModal}
                disabled={salvando}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              >
                <FaTimes />
              </button>

            </div>

            {/* FORMULÁRIO */}

            <form
              onSubmit={salvarGestor}
              className="overflow-y-auto"
            >

              <div className="space-y-6 p-6">

                {/* =================================================
                    IMAGEM
                ================================================= */}

                <div>

                  <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">

                    <FaImage className="text-indigo-600" />

                    <div>

                      <h3 className="font-semibold text-gray-800">
                        Imagem do gestor
                      </h3>

                      <p className="text-xs text-gray-500">
                        Fotografia do gestor.
                      </p>

                    </div>

                  </div>

                  <div className="flex flex-col items-center gap-5 rounded-xl border border-gray-200 bg-gray-50 p-5 sm:flex-row">

                    {/* PREVIEW */}

                    <div className="relative shrink-0">

                      {imagemAtualFormulario ? (

                        <img
                          src={imagemAtualFormulario}
                          alt="Pré-visualização"
                          className="h-32 w-32 rounded-full object-cover shadow-md ring-4 ring-white"
                          onError={(e) => {
                            e.currentTarget.style.display =
                              "none";
                          }}
                        />

                      ) : (

                        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shadow-md ring-4 ring-white">

                          <FaUser size={45} />

                        </div>

                      )}

                      <div className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow">

                        <FaCamera size={15} />

                      </div>

                    </div>

                    {/* INFORMAÇÕES */}

                    <div className="flex-1 text-center sm:text-left">

                      <p className="break-all text-sm font-semibold text-gray-700">

                        {imagemArquivo
                          ? imagemArquivo.name
                          : imagemExistente
                          ? "Imagem atual do gestor"
                          : "Nenhuma imagem selecionada"}

                      </p>

                      <p className="mt-1 text-xs leading-5 text-gray-500">

                        JPG, PNG ou WEBP.
                        <br />
                        Tamanho máximo: 5 MB.

                      </p>

                      <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">

                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">

                          <FaUpload />

                          Selecionar imagem

                          <input
                            ref={inputImagemRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={
                              selecionarImagem
                            }
                            className="hidden"
                          />

                        </label>

                        {(imagemArquivo ||
                          imagemExistente) && (

                          <button
                            type="button"
                            onClick={removerImagem}
                            disabled={salvando}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >

                            <FaTrash />

                            Remover

                          </button>

                        )}

                      </div>

                    </div>

                  </div>

                </div>

                {/* =================================================
                    DADOS
                ================================================= */}

                <div>

                  <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">

                    <FaUser className="text-indigo-600" />

                    <h3 className="font-semibold text-gray-800">
                      Dados do gestor
                    </h3>

                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    {/* NOME */}

                    <div>

                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Nome *
                      </label>

                      <input
                        type="text"
                        value={formulario.nome}
                        onChange={(e) =>
                          alterarCampo(
                            "nome",
                            e.target.value
                          )
                        }
                        placeholder="Nome completo"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />

                    </div>

                    {/* EMAIL */}

                    <div>

                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Email *
                      </label>

                      <input
                        type="email"
                        value={formulario.email}
                        onChange={(e) =>
                          alterarCampo(
                            "email",
                            e.target.value
                          )
                        }
                        placeholder="gestor@empresa.com"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />

                    </div>

                    {/* TELEFONE */}

                    <div>

                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Telefone *
                      </label>

                      <div className="relative">

                        <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                        <input
                          type="text"
                          value={
                            formulario.telefone
                          }
                          onChange={(e) =>
                            alterarCampo(
                              "telefone",
                              e.target.value
                            )
                          }
                          placeholder="+244 9XX XXX XXX"
                          className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />

                      </div>

                    </div>

                    {/* CARGO */}

                    <div>

                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Cargo *
                      </label>

                      <div className="relative">

                        <FaBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                        <input
                          type="text"
                          value={
                            formulario.cargo
                          }
                          onChange={(e) =>
                            alterarCampo(
                              "cargo",
                              e.target.value
                            )
                          }
                          placeholder="Ex.: Administrador"
                          className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />

                      </div>

                    </div>

                    {/* SENHA */}

                    <div className="md:col-span-2">

                      <label className="mb-1.5 block text-sm font-medium text-gray-700">

                        Senha{" "}

                        {!modoEdicao && "*"}

                      </label>

                      <div className="relative">

                        <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                        <input
                          type={
                            mostrarSenha
                              ? "text"
                              : "password"
                          }
                          value={
                            formulario.senha
                          }
                          onChange={(e) =>
                            alterarCampo(
                              "senha",
                              e.target.value
                            )
                          }
                          placeholder={
                            modoEdicao
                              ? "Deixe vazio para manter a senha"
                              : "Mínimo de 6 caracteres"
                          }
                          className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-11 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setMostrarSenha(
                              (valor) => !valor
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >

                          {mostrarSenha ? (
                            <FaEyeSlash />
                          ) : (
                            <FaEye />
                          )}

                        </button>

                      </div>

                    </div>

                    {/* ATIVO */}

                    <div className="md:col-span-2">

                      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">

                        <input
                          type="checkbox"
                          checked={
                            formulario.ativo
                          }
                          onChange={() =>
                            alterarCampo(
                              "ativo",
                              !formulario.ativo
                            )
                          }
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                        />

                        <div>

                          <p className="text-sm font-semibold text-gray-700">
                            Gestor ativo
                          </p>

                          <p className="text-xs text-gray-500">
                            Permitir utilização do sistema.
                          </p>

                        </div>

                      </label>

                    </div>

                  </div>

                </div>

                {/* =================================================
                    PERMISSÕES
                ================================================= */}

                <div>

                  <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">

                    <div className="flex items-center gap-2">

                      <FaUserShield className="text-indigo-600" />

                      <div>

                        <h3 className="font-semibold text-gray-800">
                          Permissões
                        </h3>

                        <p className="text-xs text-gray-500">
                          Áreas que o gestor poderá acessar.
                        </p>

                      </div>

                    </div>

                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">

                      {
                        permissoes.filter(
                          (permissao) =>
                            formulario[
                              permissao.campo
                            ]
                        ).length
                      }{" "}
                      selecionadas

                    </span>

                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

                    {permissoes.map(
                      (permissao) => {

                        const Icone =
                          permissao.icone;

                        const selecionada =
                          Boolean(
                            formulario[
                              permissao.campo
                            ]
                          );

                        return (

                          <button
                            key={
                              permissao.campo
                            }
                            type="button"
                            onClick={() =>
                              alterarPermissao(
                                permissao.campo
                              )
                            }
                            className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                              selecionada
                                ? "border-indigo-300 bg-indigo-50"
                                : "border-gray-200 bg-white hover:bg-gray-50"
                            }`}
                          >

                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                selecionada
                                  ? "bg-indigo-600 text-white"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >

                              <Icone />

                            </div>

                            <div className="min-w-0 flex-1">

                              <p className="text-sm font-semibold text-gray-700">
                                {permissao.nome}
                              </p>

                              <p className="truncate text-xs text-gray-400">
                                {permissao.descricao}
                              </p>

                            </div>

                            {selecionada ? (
                              <FaCheck className="text-indigo-600" />
                            ) : (
                              <FaTimes className="text-gray-300" />
                            )}

                          </button>

                        );
                      }
                    )}

                  </div>

                </div>

              </div>

              {/* =================================================
                  RODAPÉ
              ================================================= */}

              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={fecharModal}
                  disabled={salvando}
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                  className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {salvando ? (

                    <>
                      <FaSyncAlt className="animate-spin" />
                      Guardando...
                    </>

                  ) : (

                    <>
                      <FaSave />

                      {modoEdicao
                        ? "Atualizar gestor"
                        : "Cadastrar gestor"}
                    </>

                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =================================================
          MODAL CONFIRMAÇÃO
      ================================================= */}

      {mostrarConfirmacao &&
        gestorConfirmacao && (

          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
            onMouseDown={(e) => {
              if (
                e.target === e.currentTarget &&
                !processandoConfirmacao
              ) {
                fecharConfirmacao();
              }
            }}
          >

            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

              <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-5">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">

                  {confirmarEliminacao ? (
                    <FaTrash />
                  ) : (
                    <FaPowerOff />
                  )}

                </div>

                <div>

                  <h2 className="text-lg font-bold text-gray-800">

                    {confirmarEliminacao
                      ? "Eliminar gestor?"
                      : gestorEstaAtivo
                      ? "Desativar gestor?"
                      : "Ativar gestor?"}

                  </h2>

                  <p className="text-sm text-gray-500">
                    Confirmação necessária
                  </p>

                </div>

              </div>

              <div className="px-6 py-5">

                <div className="mb-4 rounded-xl bg-gray-50 p-4">

                  <div className="flex items-center gap-3">

                    {obterUrlImagem(
                      gestorConfirmacao
                    ) ? (

                      <img
                        src={obterUrlImagem(
                          gestorConfirmacao
                        )}
                        alt={
                          gestorConfirmacao.nome ||
                          "Gestor"
                        }
                        className="h-11 w-11 rounded-full object-cover"
                      />

                    ) : (

                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">

                        {String(
                          gestorConfirmacao.nome ||
                            "G"
                        )
                          .charAt(0)
                          .toUpperCase()}

                      </div>

                    )}

                    <div className="min-w-0">

                      <p className="truncate font-semibold text-gray-800">
                        {gestorConfirmacao.nome}
                      </p>

                      <p className="truncate text-sm text-gray-500">
                        {gestorConfirmacao.email || "-"}
                      </p>

                    </div>

                  </div>

                </div>

                {confirmarEliminacao ? (

                  <div>

                    <p className="text-sm leading-6 text-gray-600">

                      Tem certeza de que deseja eliminar o gestor{" "}

                      <strong className="text-gray-800">
                        "{gestorConfirmacao.nome}"
                      </strong>
                      ?

                    </p>

                    <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">

                      <FaExclamationTriangle className="mt-0.5 shrink-0 text-red-500" />

                      <p className="text-xs leading-5 text-red-700">

                        Esta ação irá remover o gestor do sistema e não poderá ser desfeita.

                      </p>

                    </div>

                  </div>

                ) : (

                  <div>

                    <p className="text-sm leading-6 text-gray-600">

                      Tem certeza de que deseja{" "}

                      <strong className="text-gray-800">
                        {textoAcaoEstado}
                      </strong>{" "}

                      o gestor{" "}

                      <strong className="text-gray-800">
                        "{gestorConfirmacao.nome}"
                      </strong>
                      ?

                    </p>

                  </div>

                )}

              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={fecharConfirmacao}
                  disabled={processandoConfirmacao}
                  className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <FaTimes />

                  Cancelar

                </button>

                <button
                  type="button"
                  onClick={confirmarAcao}
                  disabled={processandoConfirmacao}
                  className={`flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    confirmarEliminacao
                      ? "bg-red-600 hover:bg-red-700"
                      : gestorEstaAtivo
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >

                  {processandoConfirmacao ? (

                    <>
                      <FaSyncAlt className="animate-spin" />
                      Processando...
                    </>

                  ) : confirmarEliminacao ? (

                    <>
                      <FaTrash />
                      Sim, eliminar
                    </>

                  ) : gestorEstaAtivo ? (

                    <>
                      <FaPowerOff />
                      Sim, desativar
                    </>

                  ) : (

                    <>
                      <FaCheck />
                      Sim, ativar
                    </>

                  )}

                </button>

              </div>

            </div>

          </div>

        )}

    </div>
  );
}