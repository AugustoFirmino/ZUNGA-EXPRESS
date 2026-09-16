import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBan,
  FaBars,
  FaBoxOpen,
  FaCalendarAlt,
  FaChartBar,
  FaCheck,
  FaCheckCircle,
  FaChevronDown,
  FaClipboardList,
  FaClock,
  FaCog,
  FaCreditCard,
  FaDollarSign,
  FaEdit,
  FaExclamationTriangle,
  FaFilter,
  FaFilePdf,
  FaHistory,
  FaInfoCircle,
  FaLock,
  FaMoneyBillWave,
  FaPhone,
  FaReceipt,
  FaSave,
  FaSearch,
  FaShieldAlt,
  FaShoppingBag,
  FaShoppingCart,
  FaSignOutAlt,
  FaStar,
  FaStore,
  FaSyncAlt,
  FaTags,
  FaTachometerAlt,
  FaTimes,
  FaTrash,
  FaUser,
  FaUserCog,
  FaUsers,
} from "react-icons/fa";

import LogoEmpresa from "../assets/Logo ZungaExpress.png";
import { API_URL } from "../../servidor/api";
import Kilapes from "../paginas/Kilapes";
import jsPDF from "jspdf";

const normalizarLista = (dados, chave = "dados") => {
  if (Array.isArray(dados)) return dados;
  if (!dados || typeof dados !== "object") return [];

  if (Array.isArray(dados[chave])) return dados[chave];
  if (Array.isArray(dados.data)) return dados.data;
  if (Array.isArray(dados.rows)) return dados.rows;
  if (Array.isArray(dados.resultados)) return dados.resultados;

  return [];
};

const formatarMoeda = (valor) => {
  const numero = Number(valor ?? 0);
  return `${new Intl.NumberFormat("pt-AO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numero) ? numero : 0)} Kz`;
};

const formatarData = (valor) => {
  if (!valor) return "Sem data";

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "Sem data";

  return data.toLocaleDateString("pt-AO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const normalizarStatusKilape = (valor) => {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

const obterStatusInfoKilape = (status) => {
  const statusNormalizado = normalizarStatusKilape(status);

  if (statusNormalizado === "aprovado" || statusNormalizado === "aprovada") {
    return { texto: "Aprovado", classe: "bg-blue-50 text-blue-700 border-blue-200", icone: <FaCheckCircle /> };
  }

  if (statusNormalizado === "recusado" || statusNormalizado === "recusada" || statusNormalizado === "rejeitado" || statusNormalizado === "rejeitada") {
    return { texto: "Recusado", classe: "bg-red-50 text-red-700 border-red-200", icone: <FaTimes /> };
  }

  if (statusNormalizado === "pago" || statusNormalizado === "paga") {
    return { texto: "Pago", classe: "bg-emerald-50 text-emerald-700 border-emerald-200", icone: <FaCheckCircle /> };
  }

  if (statusNormalizado === "atrasado" || statusNormalizado === "vencido" || statusNormalizado === "vencida") {
    return { texto: "Atrasado", classe: "bg-red-50 text-red-700 border-red-200", icone: <FaExclamationTriangle /> };
  }

  if (statusNormalizado === "cancelado" || statusNormalizado === "cancelada") {
    return { texto: "Cancelado", classe: "bg-slate-100 text-slate-600 border-slate-200", icone: <FaTimes /> };
  }

  return { texto: "Pendente", classe: "bg-amber-50 text-amber-700 border-amber-200", icone: <FaClock /> };
};

const obterImagemProduto = (produto) => {
  const candidatos = [
    produto?.cloudinary_url,
    produto?.imagem_url,
    produto?.imagemUrl,
    produto?.imagem,
    produto?.image,
    produto?.url_imagem,
    produto?.urlImagem,
    produto?.produto_imagem,
    produto?.produto_imagem_url,
    produto?.produtoImagemUrl,
    produto?.foto,
  ];

  for (const valor of candidatos) {
    if (typeof valor === "string" && valor.trim()) {
      return valor.trim();
    }
  }

  return "";
};

const obterImagemCliente = (cliente) => {
  const candidatos = [
    cliente?.cloudinary_url,
    cliente?.imagem_url,
    cliente?.imagemUrl,
    cliente?.imagem,
    cliente?.image,
    cliente?.url_imagem,
    cliente?.urlImagem,
    cliente?.foto,
    cliente?.avatar,
    cliente?.photo,
    cliente?.perfil_url,
    cliente?.perfilUrl,
  ];

  for (const valor of candidatos) {
    if (typeof valor === "string" && valor.trim()) {
      return valor.trim();
    }
  }

  return "";
};

const obterPrimeiroValor = (...valores) => {
  for (const valor of valores) {
    if (valor === undefined || valor === null) continue;
    if (typeof valor === "string" && !valor.trim()) continue;
    return valor;
  }

  return "";
};

const normalizarKilapeGestor = (kilape) => {
  if (!kilape || typeof kilape !== "object") {
    return {
      ...kilape,
      cliente_id: "",
      cliente_nome: "Cliente",
      cliente_telefone: "",
      cliente_email: "",
      cliente_imagem: "",
      valor: 0,
      prazo_dias: 21,
      observacao: "",
    };
  }

  const cliente = kilape.cliente || {};
  const clienteImagem = obterPrimeiroValor(
    kilape.cliente_imagem,
    kilape.cliente_imagem_url,
    kilape.clienteImagem,
    kilape.clienteImagemUrl,
    kilape.foto_cliente,
    kilape.fotoCliente,
    kilape.cliente_foto,
    kilape.clienteFoto,
    cliente.imagem_url,
    cliente.imagemUrl,
    cliente.imagem,
    cliente.foto,
    cliente.foto_url,
    cliente.fotoUrl,
    cliente.avatar,
    cliente.photo,
    cliente.cloudinary_url,
    cliente.cloudinaryUrl,
    ""
  );

  return {
    ...kilape,
    cliente_id: obterPrimeiroValor(kilape.cliente_id, kilape.clienteId, cliente.id, ""),
    cliente_nome: obterPrimeiroValor(kilape.cliente_nome, kilape.nome_cliente, kilape.nome, cliente.nome, "Cliente"),
    cliente_telefone: obterPrimeiroValor(kilape.cliente_telefone, kilape.telefone_cliente, kilape.telefone, cliente.telefone, ""),
    cliente_email: obterPrimeiroValor(kilape.cliente_email, kilape.email_cliente, kilape.email, cliente.email, ""),
    cliente_imagem: clienteImagem,
    valor: Number(obterPrimeiroValor(kilape.valor, kilape.valor_solicitado, kilape.valorSolicitado, 0)) || 0,
    prazo_dias: Number(obterPrimeiroValor(kilape.prazo_dias, kilape.prazoDias, 21)) || 21,
    observacao: obterPrimeiroValor(kilape.observacao, kilape.observacao_geral, ""),
  };
};

const vendaEstaPaga = (venda) => {
  const status = String(venda?.status_pagamento || venda?.pagamento_status || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return ["pago", "paga", "paid", "concluido", "concluida"].includes(status);
};

const gerarPDFVendaGestor = (venda) => {
  if (!vendaEstaPaga(venda)) {
    throw new Error("Não é possível gerar o PDF porque a venda ainda não está paga.");
  }

  const documento = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const largura = documento.internal.pageSize.getWidth();
  const altura = documento.internal.pageSize.getHeight();
  const margem = 14;
  let y = 18;
  const nomeEmpresa = localStorage.getItem("nome_empresa") || "ZungaExpress";
  const itens = Array.isArray(venda.itens) ? venda.itens : [];

  documento.setFillColor(15, 23, 42);
  documento.rect(0, 0, largura, 34, "F");
  documento.addImage(LogoEmpresa, "PNG", margem, 7, 20, 20);
  documento.setTextColor(255, 255, 255);
  documento.setFont("helvetica", "bold");
  documento.setFontSize(18);
  documento.text(nomeEmpresa, margem + 26, 15);
  documento.setFont("helvetica", "normal");
  documento.setFontSize(10);
  documento.text("Comprovativo de venda - PAGAMENTO CONFIRMADO", margem + 26, 23);

  y = 47;
  documento.setTextColor(15, 23, 42);
  documento.setFont("helvetica", "bold");
  documento.setFontSize(12);
  documento.text(`Venda #${venda.id ?? "-"}`, margem, y);
  documento.setFont("helvetica", "normal");
  documento.setFontSize(10);
  y += 8;
  documento.text(`Cliente: ${venda.cliente_nome || "Cliente"}`, margem, y);
  y += 6;
  documento.text(`Email: ${venda.cliente_email || "Não informado"}`, margem, y);
  y += 6;
  documento.text(`Telefone: ${venda.cliente_telefone || "Não informado"}`, margem, y);
  y += 6;
  documento.text(`Data: ${formatarData(venda.criado_em)}`, margem, y);

  y += 12;
  documento.setFillColor(23, 63, 53);
  documento.rect(margem, y - 5, largura - margem * 2, 8, "F");
  documento.setTextColor(255, 255, 255);
  documento.setFont("helvetica", "bold");
  documento.text("Produto", margem + 2, y);
  documento.text("Qtd.", largura - 72, y);
  documento.text("Preço", largura - 50, y);
  documento.text("Subtotal", largura - 27, y);
  y += 10;

  documento.setTextColor(51, 65, 85);
  documento.setFont("helvetica", "normal");
  itens.forEach((item) => {
    if (y > altura - 35) {
      documento.addPage();
      y = 20;
    }

    const nome = String(item.produto_nome || "Produto");
    const linhas = documento.splitTextToSize(nome, largura - 92);
    const quantidade = Number(item.quantidade || 0);
    const preco = Number(item.preco || 0);
    const subtotal = Number(item.subtotal ?? quantidade * preco);

    documento.text(linhas, margem + 2, y);
    documento.text(String(quantidade), largura - 72, y);
    documento.text(formatarMoeda(preco), largura - 50, y);
    documento.text(formatarMoeda(subtotal), largura - 27, y);
    y += Math.max(7, linhas.length * 5);
    documento.setDrawColor(226, 232, 240);
    documento.line(margem, y - 3, largura - margem, y - 3);
  });

  y += 8;
  if (y > altura - 30) {
    documento.addPage();
    y = 20;
  }
  documento.setFont("helvetica", "bold");
  documento.setTextColor(23, 63, 53);
  documento.setFontSize(13);
  documento.text(`Total: ${formatarMoeda(venda.total || 0)}`, largura - margem, y, { align: "right" });
  documento.setFont("helvetica", "normal");
  documento.setFontSize(8);
  documento.setTextColor(100, 116, 139);
  documento.text(`Documento gerado pela ${nomeEmpresa}.`, margem, altura - 12);
  documento.text(`Venda #${venda.id ?? "-"} - PAGO`, largura - margem, altura - 12, { align: "right" });

  const identificador = String(venda.id || "venda").replace(/[^a-zA-Z0-9_-]/g, "_");
  documento.save(`venda_${identificador}_PAGO.pdf`);
};

const obterUsuario = () => {
  try {
    const fontes = [localStorage.getItem("usuario"), sessionStorage.getItem("usuario")];

    for (const texto of fontes) {
      if (!texto) continue;

      try {
        const usuario = JSON.parse(texto);
        if (usuario && typeof usuario === "object" && !Array.isArray(usuario)) {
          return usuario;
        }
      } catch {
        // ignora dados inválidos
      }
    }
  } catch (error) {
    console.error("Erro ao obter usuário:", error);
  }

  return null;
};

const limparAutenticacao = () => {
  ["token", "accessToken", "jwt", "access_token", "usuario"].forEach((chave) => {
    localStorage.removeItem(chave);
    sessionStorage.removeItem(chave);
  });
};

const obterToken = () => {
  return localStorage.getItem("token") || sessionStorage.getItem("token") || "";
};

const montarHeaders = (conteudoJson = true) => {
  const token = obterToken();
  const headers = {};

  if (conteudoJson) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

function ModalConfirmarSaida({ aberto, onCancelar, onConfirmar }) {
  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancelar();
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          <FaExclamationTriangle size={24} />
        </div>

        <h2 className="mt-5 text-xl font-bold text-slate-900">Confirmar saída</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Tem certeza de que deseja terminar a sessão?
        </p>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirmar}
            className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700"
          >
            <FaSignOutAlt />
            Sim, sair
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalConfirmarExclusao({ aberto, titulo, texto, onCancelar, onConfirmar, textoBotao = "Sim, excluir" }) {
  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancelar();
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          <FaExclamationTriangle size={24} />
        </div>

        <h2 className="mt-5 text-xl font-bold text-slate-900">{titulo}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{texto}</p>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirmar}
            className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700"
          >
            <FaTimes />
            {textoBotao}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GestaoGestores() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(() => obterUsuario());
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [vendasAbertas, setVendasAbertas] = useState({});
  const [gerandoPDFVenda, setGerandoPDFVenda] = useState(null);
  const [pesquisaVenda, setPesquisaVenda] = useState("");
  const [kilapes, setKilapes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [menuAberto, setMenuAberto] = useState(false);
  const [modalSaida, setModalSaida] = useState(false);
  const [modalExclusaoCategoria, setModalExclusaoCategoria] = useState(false);
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState(null);
  const [modalExclusaoProduto, setModalExclusaoProduto] = useState(false);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState(null);
  const [menuAtivo, setMenuAtivo] = useState("dashboard");
  const [pesquisaCategoria, setPesquisaCategoria] = useState("");
  const [pesquisaProduto, setPesquisaProduto] = useState("");
  const [categoriaSelecionadaProduto, setCategoriaSelecionadaProduto] = useState("todas");
  const [pesquisaKilape, setPesquisaKilape] = useState("");
  const [filtroStatusKilape, setFiltroStatusKilape] = useState("todos");
  const [mostrarFormularioKilape, setMostrarFormularioKilape] = useState(false);
  const [kilapeEditando, setKilapeEditando] = useState(null);
  const [kilapeForm, setKilapeForm] = useState({ cliente_id: "", valor: "", observacao: "", prazo_dias: 21 });
  const [kilapeModalAcao, setKilapeModalAcao] = useState(null);
  const [motivoRecusaKilape, setMotivoRecusaKilape] = useState("");
  const [kilapeParaExcluir, setKilapeParaExcluir] = useState(null);
  const [modalExclusaoKilape, setModalExclusaoKilape] = useState(false);
  const [categoriaForm, setCategoriaForm] = useState({ nome: "", descricao: "" });
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [produtoForm, setProdutoForm] = useState({
    nome: "",
    descricao: "",
    preco: "",
    estoque: "",
    categoria_id: "",
  });
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [produtoImagem, setProdutoImagem] = useState(null);
  const [produtoFormularioAberto, setProdutoFormularioAberto] = useState(true);
  const [perfilGestorForm, setPerfilGestorForm] = useState(() => {
    const gestor = obterUsuario() || {};
    return {
      nome: gestor.nome || gestor.nome_completo || "",
      email: gestor.email || "",
      telefone: gestor.telefone || "",
      senha: "",
    };
  });
  const [perfilGestorImagem, setPerfilGestorImagem] = useState(null);
  const [salvandoPerfilGestor, setSalvandoPerfilGestor] = useState(false);

  const gestorNome = usuario?.nome || usuario?.nome_completo || "Gestor";

  const carregarDados = async () => {
    setCarregando(true);
    setErro("");

    try {
      const [respostaClientes, respostaProdutos, respostaPedidos, respostaVendas, respostaKilapes, respostaCategorias] = await Promise.all([
        fetch(`${API_URL}/clientes`, { headers: montarHeaders(false) }),
        fetch(`${API_URL}/produtos`, { headers: montarHeaders(false) }),
        fetch(`${API_URL}/pedidos`, { headers: montarHeaders(false) }),
        fetch(`${API_URL}/vendas`, { headers: montarHeaders(false) }),
        fetch(`${API_URL}/kilapes`, { headers: montarHeaders(false) }),
        fetch(`${API_URL}/categorias`, { headers: montarHeaders(false) }),
      ]);

      const dadosClientes = await respostaClientes.json().catch(() => ({}));
      const dadosProdutos = await respostaProdutos.json().catch(() => ({}));
      const dadosPedidos = await respostaPedidos.json().catch(() => ({}));
      const dadosVendas = await respostaVendas.json().catch(() => ({}));
      const dadosKilapes = await respostaKilapes.json().catch(() => ({}));
      const dadosCategorias = await respostaCategorias.json().catch(() => ({}));

      if (!respostaClientes.ok || !respostaProdutos.ok || !respostaPedidos.ok || !respostaVendas.ok || !respostaKilapes.ok || !respostaCategorias.ok) {
        throw new Error(
          dadosClientes?.mensagem ||
            dadosProdutos?.mensagem ||
            dadosPedidos?.mensagem ||
            dadosVendas?.mensagem ||
            dadosKilapes?.mensagem ||
            dadosCategorias?.mensagem ||
            "Não foi possível carregar o painel de gestão."
        );
      }

      setClientes(normalizarLista(dadosClientes, "clientes"));
      setProdutos(normalizarLista(dadosProdutos, "produtos"));
      setPedidos(normalizarLista(dadosPedidos, "pedidos"));
      setVendas(normalizarLista(dadosVendas, "vendas"));
      setKilapes(normalizarLista(dadosKilapes, "kilapes").map(normalizarKilapeGestor));
      setCategorias(normalizarLista(dadosCategorias, "categorias"));
    } catch (error) {
      console.error("Erro ao carregar dados do gestor:", error);
      setErro(error.message || "Não foi possível carregar o painel de gestão.");
    } finally {
      setCarregando(false);
    }
  };

  const carregarCategorias = async () => {
    try {
      const resposta = await fetch(`${API_URL}/categorias`, {
        method: "GET",
        headers: montarHeaders(false),
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(dados?.mensagem || "Erro ao carregar categorias.");
      }

      const lista = Array.isArray(dados)
        ? dados
        : Array.isArray(dados.categorias)
          ? dados.categorias
          : Array.isArray(dados.data)
            ? dados.data
            : [];

      setCategorias(lista);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      setCategorias([]);
      setErro(error.message || "Erro ao carregar categorias.");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void carregarDados();
      void carregarCategorias();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const totalFaturamento = useMemo(() => {
    return pedidos.reduce((total, pedido) => {
      const valor = Number(pedido.total ?? pedido.valor_total ?? pedido.valor ?? 0);
      return total + (Number.isFinite(valor) ? valor : 0);
    }, 0);
  }, [pedidos]);

  const pedidosRecentes = useMemo(() => {
    return [...pedidos]
      .sort((a, b) => {
        const dataA = new Date(a.data_pedido || a.criado_em || 0).getTime();
        const dataB = new Date(b.data_pedido || b.criado_em || 0).getTime();
        return dataB - dataA;
      })
      .slice(0, 5);
  }, [pedidos]);

  const clientesFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    if (!termo) return clientes;

    return clientes.filter((cliente) => {
      const nome = String(cliente.nome || "").toLowerCase();
      const email = String(cliente.email || "").toLowerCase();
      const telefone = String(cliente.telefone || "").toLowerCase();
      return nome.includes(termo) || email.includes(termo) || telefone.includes(termo);
    });
  }, [clientes, pesquisa]);

  const totalProdutosEmStock = useMemo(() => {
    return produtos.reduce((total, produto) => {
      const quantidade = Number(produto.estoque ?? produto.quantidade ?? 0);
      return total + (Number.isFinite(quantidade) ? quantidade : 0);
    }, 0);
  }, [produtos]);

  const categoriasFiltradas = useMemo(() => {
    const termo = pesquisaCategoria.trim().toLowerCase();

    if (!termo) return categorias;

    return categorias.filter((categoria) => {
      const nome = String(categoria.nome || "").toLowerCase();
      const descricao = String(categoria.descricao || "").toLowerCase();
      return nome.includes(termo) || descricao.includes(termo);
    });
  }, [categorias, pesquisaCategoria]);

  const produtosFiltrados = useMemo(() => {
    const termo = pesquisaProduto.trim().toLowerCase();
    const categoriaSelecionada = categoriaSelecionadaProduto;

    return produtos.filter((produto) => {
      const nome = String(produto.nome || "").toLowerCase();
      const descricao = String(produto.descricao || "").toLowerCase();
      const categoria = String(produto.categoria || produto.nome_categoria || produto.categoria_nome || "").toLowerCase();
      const categoriaIdProduto = String(produto.categoria_id ?? produto.id_categoria ?? "");
      const categoriaNomeSelecionada = categorias.find((item) => String(item.id) === String(categoriaSelecionada))?.nome?.toLowerCase() || "";
      const atendeCategoria =
        categoriaSelecionada === "todas" ||
        categoriaIdProduto === String(categoriaSelecionada) ||
        categoria.includes(categoriaNomeSelecionada);

      const atendeTexto = !termo || nome.includes(termo) || descricao.includes(termo) || categoria.includes(termo);

      return atendeCategoria && atendeTexto;
    });
  }, [produtos, pesquisaProduto, categoriaSelecionadaProduto, categorias]);

  const kilapesFiltrados = useMemo(() => {
    const termo = pesquisaKilape.trim().toLowerCase();

    return kilapes.filter((kilape) => {
      const clienteNome = String(kilape.cliente_nome || kilape.nome || "").toLowerCase();
      const clienteTelefone = String(kilape.cliente_telefone || kilape.telefone || "").toLowerCase();
      const clienteEmail = String(kilape.cliente_email || kilape.email || "").toLowerCase();
      const status = normalizarStatusKilape(kilape.status);
      const atendeStatus = filtroStatusKilape === "todos" || status === filtroStatusKilape;
      const atendePesquisa = !termo || clienteNome.includes(termo) || clienteTelefone.includes(termo) || clienteEmail.includes(termo) || String(kilape.id || "").includes(termo);

      return atendeStatus && atendePesquisa;
    });
  }, [kilapes, pesquisaKilape, filtroStatusKilape]);

  const vendasFiltradas = useMemo(() => {
    const termo = pesquisaVenda.trim().toLowerCase();

    if (!termo) return vendas;

    return vendas.filter((venda) => {
      const itens = Array.isArray(venda.itens) ? venda.itens : [];
      const textoProdutos = itens
        .map((item) => item.produto_nome || item.nome || "")
        .join(" ");
      const campos = [
        venda.id,
        venda.cliente_nome,
        venda.cliente_email,
        venda.cliente_telefone,
        venda.status_pagamento,
        venda.status,
        textoProdutos,
      ];

      return campos.some((campo) => String(campo ?? "").toLowerCase().includes(termo));
    });
  }, [vendas, pesquisaVenda]);

  const totalSolicitadoKilape = useMemo(
    () => kilapes.reduce((total, kilape) => total + Number(kilape.valor ?? kilape.valor_solicitado ?? 0), 0),
    [kilapes]
  );

  const kilapesPendentes = useMemo(
    () => kilapes.filter((kilape) => normalizarStatusKilape(kilape.status) === "pendente").length,
    [kilapes]
  );

  const kilapesAprovados = useMemo(
    () => kilapes.filter((kilape) => normalizarStatusKilape(kilape.status) === "aprovado").length,
    [kilapes]
  );

  const kilapesPagos = useMemo(
    () => kilapes.filter((kilape) => normalizarStatusKilape(kilape.status) === "pago").length,
    [kilapes]
  );

  const converterValorKilape = (valorTexto) => {
    if (valorTexto === undefined || valorTexto === null || valorTexto === "") return 0;

    let texto = String(valorTexto).trim().replace(/\s/g, "");
    if (texto.includes(".") && texto.includes(",")) {
      texto = texto.replace(/\./g, "").replace(",", ".");
    } else if (texto.includes(",")) {
      texto = texto.replace(",", ".");
    }

    const numero = Number(texto);
    return Number.isFinite(numero) ? numero : 0;
  };

  const abrirFormularioKilape = (kilape = null) => {
    setKilapeEditando(kilape);
    setKilapeForm({
      cliente_id: kilape ? String(kilape.cliente_id ?? "") : "",
      valor: kilape ? String(kilape.valor ?? "") : "",
      observacao: kilape ? String(kilape.observacao ?? "") : "",
      prazo_dias: kilape?.prazo_dias ?? 21,
    });
    setMotivoRecusaKilape("");
    setMostrarFormularioKilape(true);
    setErro("");
  };

  const fecharFormularioKilape = () => {
    setMostrarFormularioKilape(false);
    setKilapeEditando(null);
    setKilapeForm({ cliente_id: "", valor: "", observacao: "", prazo_dias: 21 });
    setMotivoRecusaKilape("");
  };

  const salvarKilape = async (evento) => {
    evento.preventDefault();

    if (!kilapeForm.cliente_id) {
      setErro("Selecione um cliente para o Kilape.");
      return;
    }

    const valorNumerico = converterValorKilape(kilapeForm.valor);
    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      setErro("Informe um valor válido para o Kilape.");
      return;
    }

    try {
      const metodo = kilapeEditando ? "PUT" : "POST";
      const url = kilapeEditando ? `${API_URL}/kilapes/${kilapeEditando.id}` : `${API_URL}/kilapes`;
      const resposta = await fetch(url, {
        method: metodo,
        headers: montarHeaders(true),
        body: JSON.stringify({
          cliente_id: Number(kilapeForm.cliente_id),
          valor: valorNumerico,
          observacao: kilapeForm.observacao.trim(),
          ...(kilapeEditando ? {} : { prazo_dias: Number(kilapeForm.prazo_dias || 21) }),
        }),
      });

      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        throw new Error(dados?.mensagem || "Erro ao salvar Kilape.");
      }

      setErro("");
      fecharFormularioKilape();
      await carregarDados();
    } catch (error) {
      console.error("Erro ao salvar Kilape:", error);
      setErro(error.message || "Erro ao salvar Kilape.");
    }
  };

  const aprovarKilape = async (id) => {
    try {
      const resposta = await fetch(`${API_URL}/kilapes/${id}/aprovar`, {
        method: "PUT",
        headers: montarHeaders(true),
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados?.mensagem || "Erro ao aprovar Kilape.");
      setKilapeModalAcao(null);
      setErro("");
      await carregarDados();
    } catch (error) {
      console.error("Erro ao aprovar Kilape:", error);
      setErro(error.message || "Erro ao aprovar Kilape.");
    }
  };

  const recusarKilape = async (id) => {
    if (!motivoRecusaKilape.trim()) {
      setErro("Digite o motivo da recusa do Kilape.");
      return;
    }

    try {
      const resposta = await fetch(`${API_URL}/kilapes/${id}/recusar`, {
        method: "PUT",
        headers: montarHeaders(true),
        body: JSON.stringify({ observacao: motivoRecusaKilape.trim() }),
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados?.mensagem || "Erro ao recusar Kilape.");
      setKilapeModalAcao(null);
      setMotivoRecusaKilape("");
      setErro("");
      await carregarDados();
    } catch (error) {
      console.error("Erro ao recusar Kilape:", error);
      setErro(error.message || "Erro ao recusar Kilape.");
    }
  };

  const pagarKilape = async (id) => {
    try {
      const resposta = await fetch(`${API_URL}/kilapes/${id}/pagar`, {
        method: "PUT",
        headers: montarHeaders(true),
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados?.mensagem || "Erro ao registrar pagamento do Kilape.");
      setKilapeModalAcao(null);
      setErro("");
      await carregarDados();
    } catch (error) {
      console.error("Erro ao pagar Kilape:", error);
      setErro(error.message || "Erro ao registrar pagamento do Kilape.");
    }
  };

  const eliminarKilape = async () => {
    if (!kilapeParaExcluir?.id) return;

    try {
      const resposta = await fetch(`${API_URL}/kilapes/${kilapeParaExcluir.id}`, {
        method: "DELETE",
        headers: montarHeaders(true),
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados?.mensagem || "Erro ao eliminar Kilape.");
      setModalExclusaoKilape(false);
      setKilapeParaExcluir(null);
      setErro("");
      await carregarDados();
    } catch (error) {
      console.error("Erro ao eliminar Kilape:", error);
      setErro(error.message || "Erro ao eliminar Kilape.");
    }
  };

  const confirmarLogout = () => {
    limparAutenticacao();
    setModalSaida(false);
    setMenuAberto(false);
    navigate("/login", { replace: true });
  };

  const gerarPDFDaVenda = async (venda) => {
    if (!vendaEstaPaga(venda)) {
      setErro(`O PDF da venda #${venda.id ?? ""} só pode ser gerado depois da confirmação do pagamento.`);
      return;
    }

    try {
      setErro("");
      setGerandoPDFVenda(venda.id);
      await new Promise((resolver) => setTimeout(resolver, 100));
      gerarPDFVendaGestor(venda);
    } catch (error) {
      console.error("Erro ao gerar PDF da venda:", error);
      setErro(error.message || "Não foi possível gerar o PDF da venda.");
    } finally {
      setGerandoPDFVenda(null);
    }
  };

  const salvarPerfilGestor = async (evento) => {
    evento.preventDefault();

    const gestorId = usuario?.id || usuario?.gestor_id;
    if (!gestorId) {
      setErro("Não foi possível identificar o gestor para atualizar os dados.");
      return;
    }

    if (!perfilGestorForm.nome.trim() || !perfilGestorForm.email.trim()) {
      setErro("Nome e email são obrigatórios.");
      return;
    }

    try {
      setSalvandoPerfilGestor(true);
      setErro("");

      const corpo = new FormData();
      corpo.append("nome", perfilGestorForm.nome.trim());
      corpo.append("email", perfilGestorForm.email.trim());
      corpo.append("telefone", perfilGestorForm.telefone.trim());

      if (perfilGestorForm.senha.trim()) {
        corpo.append("senha", perfilGestorForm.senha.trim());
      }

      if (perfilGestorImagem) {
        corpo.append("imagem", perfilGestorImagem);
      }

      const resposta = await fetch(`${API_URL}/gestores/${gestorId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${obterToken()}`,
        },
        body: corpo,
      });

      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        throw new Error(dados?.mensagem || "Erro ao atualizar os dados do gestor.");
      }

      const gestorAtualizado = { ...usuario, ...(dados.gestor || {}), id: gestorId };
      delete gestorAtualizado.senha;
      setUsuario(gestorAtualizado);
      setPerfilGestorForm((anterior) => ({ ...anterior, senha: "" }));
      setPerfilGestorImagem(null);
      localStorage.setItem("usuario", JSON.stringify(gestorAtualizado));
      sessionStorage.setItem("usuario", JSON.stringify(gestorAtualizado));
      setErro("");
    } catch (error) {
      console.error("Erro ao atualizar perfil do gestor:", error);
      setErro(error.message || "Erro ao atualizar os dados do gestor.");
    } finally {
      setSalvandoPerfilGestor(false);
    }
  };

  const salvarCategoria = async (evento) => {
    evento.preventDefault();

    if (!categoriaForm.nome?.trim()) {
      setErro("Informe o nome da categoria.");
      return;
    }

    try {
      const metodo = categoriaEditando ? "PUT" : "POST";
      const url = categoriaEditando
        ? `${API_URL}/categorias/${categoriaEditando.id}`
        : `${API_URL}/categorias`;

      const resposta = await fetch(url, {
        method: metodo,
        headers: montarHeaders(true),
        body: JSON.stringify({
          nome: categoriaForm.nome,
          descricao: categoriaForm.descricao,
        }),
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(dados?.mensagem || "Erro ao salvar categoria.");
      }

      setCategoriaForm({ nome: "", descricao: "" });
      setCategoriaEditando(null);
      await carregarCategorias();
      setErro("");
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
      setErro(error.message || "Erro ao salvar categoria.");
    }
  };

  const confirmarExclusaoCategoria = async () => {
    if (!categoriaParaExcluir?.id) return;

    const categoriaId = categoriaParaExcluir.id;

    try {
      const resposta = await fetch(`${API_URL}/categorias/${categoriaId}`, {
        method: "DELETE",
        headers: montarHeaders(false),
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(dados?.mensagem || "Erro ao eliminar categoria.");
      }

      setCategorias((listaAnterior) => listaAnterior.filter((item) => item.id !== categoriaId));
      if (categoriaEditando?.id === categoriaId) {
        setCategoriaEditando(null);
        setCategoriaForm({ nome: "", descricao: "" });
      }
      setErro("");
    } catch (error) {
      console.error("Erro ao eliminar categoria:", error);
      setErro(error.message || "Erro ao eliminar categoria.");
    } finally {
      setModalExclusaoCategoria(false);
      setCategoriaParaExcluir(null);
    }
  };

  const abrirModalExclusaoCategoria = (categoria) => {
    setCategoriaParaExcluir(categoria);
    setModalExclusaoCategoria(true);
  };

  const confirmarExclusaoProduto = async () => {
    if (!produtoParaExcluir?.id) return;

    const produtoId = produtoParaExcluir.id;

    try {
      const resposta = await fetch(`${API_URL}/produtos/${produtoId}`, {
        method: "DELETE",
        headers: montarHeaders(false),
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(dados?.mensagem || "Erro ao eliminar produto.");
      }

      setProdutos((listaAnterior) => listaAnterior.filter((item) => item.id !== produtoId));
      setErro("");
    } catch (error) {
      console.error("Erro ao eliminar produto:", error);
      setErro(error.message || "Erro ao eliminar produto.");
    } finally {
      setModalExclusaoProduto(false);
      setProdutoParaExcluir(null);
    }
  };

  const abrirModalExclusaoProduto = (produto) => {
    setProdutoParaExcluir(produto);
    setModalExclusaoProduto(true);
  };

  const salvarProduto = async (evento) => {
    evento.preventDefault();

    const nomeProduto = String(produtoForm.nome || "").trim();
    const precoProduto = Number(produtoForm.preco ?? "");
    const estoqueProduto = Number(produtoForm.estoque ?? 0);
    const categoriaSelecionada = produtoForm.categoria_id || (categorias.length ? String(categorias[0].id) : "");

    if (!nomeProduto) {
      setErro("Informe o nome do produto.");
      return;
    }

    if (!produtoForm.preco || !Number.isFinite(precoProduto) || precoProduto < 0) {
      setErro("Informe um preço válido para o produto.");
      return;
    }

    if (!Number.isFinite(estoqueProduto) || estoqueProduto < 0) {
      setErro("Informe um estoque válido para o produto.");
      return;
    }

    if (!categoriaSelecionada && categorias.length === 0) {
      setErro("Crie uma categoria antes de cadastrar um produto.");
      return;
    }

    try {
      const metodo = produtoEditando ? "PUT" : "POST";
      const url = produtoEditando
        ? `${API_URL}/produtos/${produtoEditando.id}`
        : `${API_URL}/produtos`;

      const body = new FormData();
      body.append("nome", nomeProduto);
      body.append("descricao", produtoForm.descricao || "");
      body.append("preco", String(precoProduto));
      body.append("estoque", String(estoqueProduto));

      if (categoriaSelecionada) {
        body.append("categoria_id", String(Number(categoriaSelecionada)));
      }

      if (produtoImagem) {
        body.append("imagem", produtoImagem);
      }

      const resposta = await fetch(url, {
        method: metodo,
        headers: {
          Authorization: `Bearer ${obterToken()}`,
        },
        body,
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(dados?.mensagem || "Erro ao salvar produto.");
      }

      setProdutoForm({ nome: "", descricao: "", preco: "", estoque: "", categoria_id: "" });
      setProdutoEditando(null);
      setProdutoImagem(null);
      await carregarDados();
      setErro("");
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      setErro(error.message || "Erro ao salvar produto.");
    }
  };

  const abrirFormularioProduto = () => {
    setProdutoEditando(null);
    setProdutoImagem(null);
    setProdutoForm({ nome: "", descricao: "", preco: "", estoque: "", categoria_id: "" });
    setProdutoFormularioAberto(true);
    setErro("");
  };

  const selecionarMenu = (key) => {
    setMenuAtivo(key);
    setMenuAberto(false);

    if (key === "produtos") {
      setProdutoEditando(null);
      setProdutoImagem(null);
      setProdutoForm({ nome: "", descricao: "", preco: "", estoque: "", categoria_id: "" });
      setProdutoFormularioAberto(true);
      setErro("");
    }
  };

  const editarProduto = (produto) => {
    setProdutoEditando(produto);
    setProdutoForm({
      nome: produto.nome || "",
      descricao: produto.descricao || "",
      preco: produto.preco ?? produto.valor ?? "",
      estoque: produto.estoque ?? produto.quantidade ?? "",
      categoria_id: produto.categoria_id ?? produto.id_categoria ?? "",
    });
    setProdutoImagem(null);
    setProdutoFormularioAberto(true);
  };

  const atualizarStatusPedido = async (pedidoId, novoStatus) => {
    try {
      const resposta = await fetch(`${API_URL}/pedidos/${pedidoId}/status`, {
        method: "PUT",
        headers: montarHeaders(true),
        body: JSON.stringify({ status: novoStatus }),
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(dados?.mensagem || "Erro ao validar pedido.");
      }

      await carregarDados();
      setErro("");
    } catch (error) {
      console.error("Erro ao alterar status do pedido:", error);
      setErro(error.message || "Erro ao validar pedido.");
    }
  };

  const atualizarPagamentoPedido = async (pedidoId, novoPagamento) => {
    try {
      const resposta = await fetch(`${API_URL}/pedidos/${pedidoId}/pagamento`, {
        method: "PUT",
        headers: montarHeaders(true),
        body: JSON.stringify({ status_pagamento: novoPagamento }),
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(dados?.mensagem || "Erro ao atualizar pagamento.");
      }

      await carregarDados();
      setErro("");
    } catch (error) {
      console.error("Erro ao alterar pagamento:", error);
      setErro(error.message || "Erro ao atualizar pagamento.");
    }
  };

  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: FaTachometerAlt },
    { key: "clientes", label: "Clientes", icon: FaUsers },
    { key: "categorias", label: "Categorias", icon: FaTags },
    { key: "kilapes", label: "Kilapes", icon: FaMoneyBillWave },
    { key: "produtos", label: "Produtos", icon: FaShoppingBag },
    { key: "pedidos", label: "Pedidos", icon: FaClipboardList },
    { key: "vendas", label: "Vendas", icon: FaReceipt },
    { key: "configuracoes", label: "Configurações", icon: FaCog },
  ];

  const renderConteudoMenu = () => {
    const painelPadrao = (
      <>
        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Clientes</p>
                <p className="mt-3 text-3xl font-black text-slate-900">{carregando ? "..." : clientes.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <FaUsers />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Produtos</p>
                <p className="mt-3 text-3xl font-black text-slate-900">{carregando ? "..." : produtos.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e7b65b]/20 text-[#a3771d]">
                <FaBoxOpen />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pedidos</p>
                <p className="mt-3 text-3xl font-black text-slate-900">{carregando ? "..." : pedidos.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                <FaShoppingCart />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Faturamento</p>
                <p className="mt-3 text-xl font-black text-slate-900">{carregando ? "..." : formatarMoeda(totalFaturamento)}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <FaDollarSign />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Atividades</p>
                <h2 className="text-xl font-black text-slate-900">Últimos pedidos</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{pedidosRecentes.length} recentes</span>
            </div>

            <div className="space-y-4">
              {carregando ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">A carregar atividade...</div>
              ) : pedidosRecentes.length ? (
                pedidosRecentes.map((pedido) => (
                  <div key={pedido.id ?? pedido.pedido_id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#173f35] text-white">
                        <FaClipboardList />
                      </div>

                      <div>
                        <p className="font-bold text-slate-800">Pedido #{pedido.id ?? pedido.pedido_id}</p>
                        <p className="text-xs text-slate-500">{formatarData(pedido.data_pedido || pedido.criado_em)}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-black text-[#173f35]">{formatarMoeda(pedido.total ?? pedido.valor_total ?? pedido.valor ?? 0)}</p>
                      <p className="text-xs text-slate-500">{pedido.status || "Em análise"}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Ainda não existem pedidos registados.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Operação</p>
                  <h2 className="text-xl font-black text-slate-900">Resumo rápido</h2>
                </div>
                <FaChartBar className="text-[#e7b65b]" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-3 text-slate-700">
                    <FaShieldAlt className="text-emerald-600" />
                    <span className="text-sm font-semibold">Kilapes pendentes</span>
                  </div>
                  <strong>{kilapesPendentes}</strong>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-3 text-slate-700">
                    <FaStar className="text-amber-600" />
                    <span className="text-sm font-semibold">Clientes ativos</span>
                  </div>
                  <strong>{clientes.length}</strong>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-3 text-slate-700">
                    <FaMoneyBillWave className="text-sky-600" />
                    <span className="text-sm font-semibold">Faturamento total</span>
                  </div>
                  <strong>{formatarMoeda(totalFaturamento)}</strong>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Acesso</p>
                  <h2 className="text-xl font-black text-slate-900">Pessoa responsável</h2>
                </div>
                <FaUser className="text-[#173f35]" />
              </div>

              <div className="rounded-2xl bg-[#edf7f4] p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#173f35] text-xl font-black text-white">
                    {gestorNome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black text-slate-900">{gestorNome}</p>
                    <p className="text-sm text-slate-500">{usuario?.cargo || "Gestor"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Clientes</p>
              <h2 className="text-xl font-black text-slate-900">Lista de clientes</h2>
            </div>

            <label className="relative block w-full max-w-md">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={pesquisa}
                onChange={(evento) => setPesquisa(evento.target.value)}
                placeholder="Pesquisar cliente pelo nome, email ou telefone..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none ring-0 transition focus:border-[#173f35]"
              />
            </label>
          </div>

          {carregando ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              A carregar clientes...
            </div>
          ) : clientesFiltrados.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-100 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-bold">Cliente</th>
                    <th className="px-4 py-3 font-bold">Contacto</th>
                    <th className="px-4 py-3 font-bold">Valor</th>
                    <th className="px-4 py-3 font-bold">Registo</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map((cliente) => {
                    const fotoCliente = obterImagemCliente(cliente);

                    return (
                      <tr key={cliente.id} className="border-t border-slate-200">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#173f35] text-sm font-black text-white">
                              {fotoCliente ? (
                                <img
                                  src={fotoCliente}
                                  alt={cliente.nome || "Cliente"}
                                  className="h-full w-full object-cover"
                                  onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center">
                                  {String(cliente.nome || "C").charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{cliente.nome || "Cliente"}</p>
                              <p className="text-xs text-slate-500">#{cliente.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <FaPhone className="text-slate-400" />
                            <span>{cliente.telefone || "Sem telefone"}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                            <FaUser className="text-slate-400" />
                            <span>{cliente.email || "Sem email"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-[#173f35]">{formatarMoeda(cliente.valor ?? 0)}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{formatarData(cliente.criado_em)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Nenhum cliente encontrado com este filtro.
            </div>
          )}
        </section>

        <section className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Status</h3>
              <FaCheckCircle className="text-emerald-600" />
            </div>
            <p className="text-sm leading-6 text-slate-600">
              O painel está funcionando corretamente e a operação está sincronizada com a base de dados.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Cobrança</h3>
              <FaMoneyBillWave className="text-sky-600" />
            </div>
            <p className="text-sm leading-6 text-slate-600">
              O total acumulado até agora está em <strong className="text-[#173f35]">{formatarMoeda(totalFaturamento)}</strong>.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Produção</h3>
              <FaStore className="text-[#e7b65b]" />
            </div>
            <p className="text-sm leading-6 text-slate-600">
              Há <strong>{produtos.length}</strong> produtos disponíveis para gestão e venda.
            </p>
          </div>
        </section>
      </>
    );

    switch (menuAtivo) {
      case "clientes":
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Clientes</p>
                  <h2 className="text-xl font-black text-slate-900">Gestão de clientes</h2>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{clientes.length} registos</span>
              </div>

              <label className="relative block w-full max-w-md">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={pesquisa}
                  onChange={(evento) => setPesquisa(evento.target.value)}
                  placeholder="Pesquisar cliente..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#173f35]"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-100 text-xs uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-bold">Cliente</th>
                      <th className="px-4 py-3 font-bold">Contacto</th>
                      <th className="px-4 py-3 font-bold">Registo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesFiltrados.length ? (
                      clientesFiltrados.map((cliente) => {
                        const fotoCliente = obterImagemCliente(cliente);

                        return (
                          <tr key={cliente.id} className="border-t border-slate-200">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#173f35] text-sm font-black text-white">
                                  {fotoCliente ? (
                                    <img
                                      src={fotoCliente}
                                      alt={cliente.nome || "Cliente"}
                                      className="h-full w-full object-cover"
                                      onError={(event) => {
                                        event.currentTarget.style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <span className="flex h-full w-full items-center justify-center">
                                      {String(cliente.nome || "C").charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800">{cliente.nome || "Cliente"}</p>
                                  <p className="text-xs text-slate-500">#{cliente.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              <div className="flex items-center gap-2">
                                <FaPhone className="text-slate-400" />
                                <span>{cliente.telefone || "Sem telefone"}</span>
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                <FaUser className="text-slate-400" />
                                <span>{cliente.email || "Sem email"}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-500">{formatarData(cliente.criado_em)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-4 py-8 text-center text-sm text-slate-500">
                          Nenhum cliente encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "kilapes":
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Kilapes</p>
                  <h2 className="text-xl font-black text-slate-900">Gestão completa de Kilapes</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{kilapesPendentes} pendentes</span>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">{kilapesAprovados} aprovados</span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{kilapesPagos} pagos</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Total em Kilapes</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{formatarMoeda(totalSolicitadoKilape)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Pendentes</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{kilapesPendentes}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Aprovados</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{kilapesAprovados}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Pagos</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{kilapesPagos}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full max-w-xl">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={pesquisaKilape}
                    onChange={(e) => setPesquisaKilape(e.target.value)}
                    placeholder="Pesquisar por cliente, telefone, email ou ID..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-[#173f35]"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={filtroStatusKilape}
                      onChange={(e) => setFiltroStatusKilape(e.target.value)}
                      className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-[#173f35]"
                    >
                      <option value="todos">Todos</option>
                      <option value="pendente">Pendentes</option>
                      <option value="aprovado">Aprovados</option>
                      <option value="pago">Pagos</option>
                      <option value="atrasado">Atrasados</option>
                      <option value="recusado">Recusados</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPesquisaKilape("");
                      setFiltroStatusKilape("todos");
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={() => abrirFormularioKilape()}
                    className="rounded-xl bg-[#173f35] px-4 py-3 text-sm font-bold text-white hover:bg-[#214e42]"
                  >
                    Novo Kilape
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-100 text-xs uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-bold">ID</th>
                      <th className="px-4 py-3 font-bold">Cliente</th>
                      <th className="px-4 py-3 font-bold">Contacto</th>
                      <th className="px-4 py-3 font-bold">Valor</th>
                      <th className="px-4 py-3 font-bold">Prazo</th>
                      <th className="px-4 py-3 font-bold">Solicitação</th>
                      <th className="px-4 py-3 font-bold">Vencimento</th>
                      <th className="px-4 py-3 font-bold">Estado</th>
                      <th className="px-4 py-3 font-bold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kilapesFiltrados.length ? (
                      kilapesFiltrados.map((kilape) => {
                        const statusInfo = obterStatusInfoKilape(kilape.status);
                        const statusNormalizado = normalizarStatusKilape(kilape.status);

                        return (
                          <tr key={kilape.id} className="border-t border-slate-200 align-top">
                            <td className="px-4 py-3 text-sm font-bold text-slate-800">#{kilape.id}</td>
                            <td className="px-4 py-3 text-sm text-slate-700">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-700">
                                  {kilape.cliente_imagem ? (
                                    <img
                                      src={kilape.cliente_imagem}
                                      alt={kilape.cliente_nome || "Cliente"}
                                      className="h-full w-full object-cover"
                                      onError={(event) => {
                                        event.currentTarget.style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <FaUser />
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900">{kilape.cliente_nome || "Cliente"}</div>
                                  <div className="mt-1 text-xs text-slate-500">ID cliente: #{kilape.cliente_id ?? "-"}</div>
                                </div>
                              </div>
                              <div className="mt-2 text-xs text-slate-500">{kilape.observacao || "Sem observação"}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              <div>{kilape.cliente_telefone || "Sem telefone"}</div>
                              <div className="mt-1 text-xs text-slate-500">{kilape.cliente_email || "Sem email"}</div>
                            </td>
                            <td className="px-4 py-3 text-sm font-black text-[#173f35]">{formatarMoeda(kilape.valor ?? 0)}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{kilape.prazo_dias ?? 21} dias</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{formatarData(kilape.data_solicitacao)}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{formatarData(kilape.data_vencimento)}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusInfo.classe}`}>
                                {statusInfo.icone}
                                {statusInfo.texto}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => abrirFormularioKilape(kilape)} className="rounded-lg bg-amber-100 px-2.5 py-2 text-[10px] font-bold text-amber-700">Editar</button>
                                <button type="button" onClick={() => setKilapeParaExcluir(kilape)} className="rounded-lg bg-red-100 px-2.5 py-2 text-[10px] font-bold text-red-700">Eliminar</button>
                                {statusNormalizado === "pendente" && (
                                  <>
                                    <button type="button" onClick={() => setKilapeModalAcao({ tipo: "aprovar", kilape })} className="rounded-lg bg-emerald-100 px-2.5 py-2 text-[10px] font-bold text-emerald-700">Aprovar</button>
                                    <button type="button" onClick={() => setKilapeModalAcao({ tipo: "recusar", kilape })} className="rounded-lg bg-orange-100 px-2.5 py-2 text-[10px] font-bold text-orange-700">Recusar</button>
                                  </>
                                )}
                                {(statusNormalizado === "aprovado" || statusNormalizado === "atrasado") && (
                                  <button type="button" onClick={() => setKilapeModalAcao({ tipo: "pagar", kilape })} className="rounded-lg bg-blue-100 px-2.5 py-2 text-[10px] font-bold text-blue-700">Pagar</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="9" className="px-4 py-8 text-center text-sm text-slate-500">
                          Nenhum Kilape encontrado para o filtro selecionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {mostrarFormularioKilape && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={(event) => {
                if (event.target === event.currentTarget) fecharFormularioKilape();
              }}>
                <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Kilapes</p>
                      <h3 className="text-xl font-black text-slate-900">{kilapeEditando ? "Editar Kilape" : "Novo Kilape"}</h3>
                    </div>
                    <button type="button" onClick={fecharFormularioKilape} className="rounded-xl bg-slate-100 p-2 text-slate-700"><FaTimes /></button>
                  </div>

                  <form onSubmit={salvarKilape} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">Cliente</label>
                      <select
                        value={kilapeForm.cliente_id}
                        onChange={(e) => setKilapeForm((prev) => ({ ...prev, cliente_id: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-[#173f35]"
                      >
                        <option value="">Selecione um cliente</option>
                        {clientes.map((cliente) => (
                          <option key={cliente.id} value={cliente.id}>{cliente.nome || "Cliente"} - {cliente.telefone || cliente.email || "Sem contacto"}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">Valor do Kilape</label>
                      <div className="relative">
                        <FaMoneyBillWave className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={kilapeForm.valor}
                          onChange={(e) => setKilapeForm((prev) => ({ ...prev, valor: e.target.value }))}
                          placeholder="Ex.: 50.000"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm outline-none focus:border-[#173f35]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">Prazo de pagamento</label>
                      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm"><FaCalendarAlt /></div>
                          <div>
                            <p className="font-black text-slate-900">{kilapeForm.prazo_dias || 21} dias</p>
                            <p className="text-xs text-slate-500">Prazo padrão de 21 dias</p>
                          </div>
                        </div>
                        <FaLock className="text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">Observação</label>
                      <textarea
                        value={kilapeForm.observacao}
                        onChange={(e) => setKilapeForm((prev) => ({ ...prev, observacao: e.target.value }))}
                        rows={3}
                        placeholder="Digite uma observação opcional..."
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#173f35]"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={fecharFormularioKilape} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">Cancelar</button>
                      <button type="submit" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#173f35] px-4 py-3 text-sm font-bold text-white hover:bg-[#214e42]">
                        {kilapeEditando ? <><FaSave /> Guardar</> : <><FaCheckCircle /> Criar</>}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {kilapeParaExcluir && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setKilapeParaExcluir(null);
                }
              }}>
                <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600"><FaTrash size={22} /></div>
                  <h2 className="mt-5 text-xl font-black text-slate-900">Eliminar Kilape?</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Tem certeza que deseja eliminar o Kilape #{kilapeParaExcluir.id} de <strong>{kilapeParaExcluir.cliente_nome || "Cliente"}</strong>? Esta ação não poderá ser desfeita.
                  </p>
                  <div className="mt-6 flex gap-3">
                    <button type="button" onClick={() => setKilapeParaExcluir(null)} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">Cancelar</button>
                    <button type="button" onClick={eliminarKilape} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700">Eliminar</button>
                  </div>
                </div>
              </div>
            )}

            {kilapeModalAcao && (
              <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={(event) => {
                if (event.target === event.currentTarget) setKilapeModalAcao(null);
              }}>
                <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${kilapeModalAcao.tipo === "aprovar" ? "bg-emerald-100 text-emerald-700" : kilapeModalAcao.tipo === "recusar" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
                        {kilapeModalAcao.tipo === "aprovar" ? <FaCheck /> : kilapeModalAcao.tipo === "recusar" ? <FaBan /> : <FaCreditCard />}
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-slate-900">{kilapeModalAcao.tipo === "aprovar" ? "Aprovar Kilape" : kilapeModalAcao.tipo === "recusar" ? "Recusar Kilape" : "Registrar pagamento"}</h2>
                        <p className="text-xs text-slate-500">Kilape #{kilapeModalAcao.kilape.id}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setKilapeModalAcao(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><FaTimes /></button>
                  </div>

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm leading-6 text-slate-600">
                      {kilapeModalAcao.tipo === "aprovar" ? "Tem certeza que deseja aprovar este Kilape?" : kilapeModalAcao.tipo === "recusar" ? "Informe o motivo da recusa." : "Confirme que o pagamento foi recebido."}
                    </p>

                    {kilapeModalAcao.tipo === "recusar" && (
                      <div className="mt-4">
                        <textarea
                          value={motivoRecusaKilape}
                          onChange={(e) => setMotivoRecusaKilape(e.target.value)}
                          rows={4}
                          placeholder="Digite o motivo da recusa..."
                          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button type="button" onClick={() => setKilapeModalAcao(null)} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">Cancelar</button>
                    <button
                      type="button"
                      onClick={() => {
                        if (kilapeModalAcao.tipo === "aprovar") aprovarKilape(kilapeModalAcao.kilape.id);
                        if (kilapeModalAcao.tipo === "recusar") recusarKilape(kilapeModalAcao.kilape.id);
                        if (kilapeModalAcao.tipo === "pagar") pagarKilape(kilapeModalAcao.kilape.id);
                      }}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white ${kilapeModalAcao.tipo === "aprovar" ? "bg-emerald-600" : kilapeModalAcao.tipo === "recusar" ? "bg-orange-600" : "bg-blue-600"}`}
                    >
                      {kilapeModalAcao.tipo === "aprovar" ? "Sim, aprovar" : kilapeModalAcao.tipo === "recusar" ? "Sim, recusar" : "Confirmar pagamento"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "categorias":
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Categorias</p>
                  <h2 className="text-xl font-black text-slate-900">Gestão de categorias</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCategoriaEditando(null);
                    setCategoriaForm({ nome: "", descricao: "" });
                    setErro("");
                  }}
                  className="rounded-xl bg-[#173f35] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#214e42]"
                >
                  Nova categoria
                </button>
              </div>

              <div className="mt-4 max-w-md">
                <label className="relative block">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={pesquisaCategoria}
                    onChange={(evento) => setPesquisaCategoria(evento.target.value)}
                    placeholder="Pesquisar categoria..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#173f35]"
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
              <form onSubmit={salvarCategoria} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-black text-slate-900">
                  {categoriaEditando ? "Editar categoria" : "Adicionar categoria"}
                </h3>
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">Nome</label>
                    <input
                      value={categoriaForm.nome}
                      onChange={(e) => setCategoriaForm((prev) => ({ ...prev, nome: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-[#173f35]"
                      placeholder="Ex: Bebidas"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">Descrição</label>
                    <textarea
                      value={categoriaForm.descricao}
                      onChange={(e) => setCategoriaForm((prev) => ({ ...prev, descricao: e.target.value }))}
                      rows="4"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-[#173f35]"
                      placeholder="Descreva a categoria..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="rounded-xl bg-[#173f35] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#214e42]"
                    >
                      {categoriaEditando ? "Guardar" : "Adicionar"}
                    </button>

                    {categoriaEditando && (
                      <button
                        type="button"
                        onClick={() => {
                          setCategoriaEditando(null);
                          setCategoriaForm({ nome: "", descricao: "" });
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </form>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900">Categorias existentes</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{categoriasFiltradas.length}</span>
                </div>

                <div className="space-y-3">
                  {categoriasFiltradas.length ? (
                    categoriasFiltradas.map((categoria) => (
                      <div key={categoria.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{categoria.nome}</p>
                          <p className="text-sm text-slate-500">{categoria.descricao || "Sem descrição"}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCategoriaEditando(categoria);
                              setCategoriaForm({ nome: categoria.nome || "", descricao: categoria.descricao || "" });
                              setErro("");
                            }}
                            className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-200"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => abrirModalExclusaoCategoria(categoria)}
                            className="rounded-lg bg-red-100 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-200"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                      Nenhuma categoria encontrada com este filtro.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "produtos":
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Produtos</p>
                  <h2 className="text-xl font-black text-slate-900">Gestão de produtos</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">{produtos.length} produtos</span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{totalProdutosEmStock} em stock</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 md:flex-row">
              <label className="relative block w-full max-w-md">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={pesquisaProduto}
                  onChange={(evento) => setPesquisaProduto(evento.target.value)}
                  placeholder="Pesquisar produto..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#173f35]"
                />
              </label>

              <label className="relative block w-full max-w-xs">
                <select
                  value={categoriaSelecionadaProduto}
                  onChange={(evento) => setCategoriaSelecionadaProduto(evento.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-[#173f35]"
                >
                  <option value="todas">Todas as categorias</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={String(categoria.id)}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-black text-slate-900">Catálogo</h3>
                  <button
                    type="button"
                    onClick={abrirFormularioProduto}
                    className="rounded-xl bg-[#173f35] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#214e42]"
                  >
                    Novo produto
                  </button>
                </div>

                {produtoFormularioAberto && (
                  <form onSubmit={salvarProduto} className="mt-4">
                    <h4 className="text-base font-black text-slate-900">
                      {produtoEditando ? "Editar produto" : "Adicionar produto"}
                    </h4>

                    <div className="mt-5 space-y-4">
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">Nome</label>
                        <input
                          value={produtoForm.nome}
                          onChange={(e) => setProdutoForm((prev) => ({ ...prev, nome: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-[#173f35]"
                          placeholder="Ex: Coca-Cola 2L"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">Descrição</label>
                        <textarea
                          value={produtoForm.descricao}
                          onChange={(e) => setProdutoForm((prev) => ({ ...prev, descricao: e.target.value }))}
                          rows="3"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-[#173f35]"
                          placeholder="Descreva o produto..."
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-semibold text-slate-700">Preço (Kz)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={produtoForm.preco}
                            onChange={(e) => setProdutoForm((prev) => ({ ...prev, preco: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-[#173f35]"
                            placeholder="2500"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-semibold text-slate-700">Estoque</label>
                          <input
                            type="number"
                            min="0"
                            value={produtoForm.estoque}
                            onChange={(e) => setProdutoForm((prev) => ({ ...prev, estoque: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-[#173f35]"
                            placeholder="20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">Categoria</label>
                        <select
                          value={produtoForm.categoria_id}
                          onChange={(e) => setProdutoForm((prev) => ({ ...prev, categoria_id: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-[#173f35]"
                        >
                          <option value="">Selecione uma categoria</option>
                          {categorias.map((categoria) => (
                            <option key={categoria.id} value={categoria.id}>
                              {categoria.nome}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">Imagem do produto</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => setProdutoImagem(event.target.files?.[0] || null)}
                          className="w-full rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-[#173f35] file:px-3 file:py-2 file:text-sm file:font-bold file:text-white"
                        />
                        {produtoImagem && (
                          <p className="mt-2 text-xs text-slate-500">Arquivo selecionado: {produtoImagem.name}</p>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="rounded-xl bg-[#173f35] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#214e42]"
                        >
                          {produtoEditando ? "Guardar" : "Adicionar"}
                        </button>

                        {(produtoEditando || produtoFormularioAberto) && (
                          <button
                            type="button"
                            onClick={() => {
                              setProdutoEditando(null);
                              setProdutoImagem(null);
                              setProdutoForm({ nome: "", descricao: "", preco: "", estoque: "", categoria_id: "" });
                              setProdutoFormularioAberto(false);
                            }}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900">Produtos em catálogo</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{produtosFiltrados.length}</span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {produtosFiltrados.length ? (
                    produtosFiltrados.map((produto) => {
                      const urlImagem = obterImagemProduto(produto);

                      return (
                        <div key={produto.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                            {urlImagem ? (
                              <img
                                src={urlImagem}
                                alt={produto.nome || "Produto"}
                                className="h-40 w-full object-cover"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="flex h-40 items-center justify-center bg-[#e7b65b]/10 text-[#a3771d]">
                                <FaBoxOpen size={38} />
                              </div>
                            )}
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e7b65b]/20 text-[#a3771d]">
                              <FaBoxOpen />
                            </div>
                            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700">
                              {produto.categoria || "Sem categoria"}
                            </span>
                          </div>

                          <h4 className="mt-4 text-lg font-bold text-slate-900">{produto.nome}</h4>
                          <p className="mt-2 text-sm text-slate-500">{produto.descricao || "Sem descrição"}</p>

                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-xl font-black text-[#173f35]">{formatarMoeda(produto.preco ?? produto.valor ?? 0)}</span>
                            <span className="text-xs text-slate-500">{produto.estoque ?? produto.quantidade ?? 0} em stock</span>
                          </div>

                          <div className="mt-4 flex gap-2">
                            <button
                              type="button"
                              onClick={() => editarProduto(produto)}
                              className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-200"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => abrirModalExclusaoProduto(produto)}
                              className="rounded-lg bg-red-100 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-200"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 md:col-span-2">
                      Nenhum produto registado.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "pedidos":
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Pedidos</p>
                  <h2 className="text-xl font-black text-slate-900">Validação de pedidos</h2>
                </div>
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">{pedidos.length} pedidos</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="space-y-4">
                {pedidos.length ? (
                  pedidos.map((pedido) => (
                    <div key={pedido.id ?? pedido.pedido_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-black text-slate-900">Pedido #{pedido.id ?? pedido.pedido_id}</p>
                          <p className="text-sm text-slate-500">{formatarData(pedido.data_pedido || pedido.criado_em)}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700">
                            {pedido.status || "Pendente"}
                          </span>
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                            {pedido.status_pagamento || "Pendente"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="text-sm text-slate-600">
                          <p className="font-semibold text-slate-800">Cliente: {pedido.cliente_nome || pedido.nome_cliente || "Cliente"}</p>
                          <p>Total: <span className="font-bold text-[#173f35]">{formatarMoeda(pedido.total ?? pedido.valor_total ?? pedido.valor ?? 0)}</span></p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => atualizarStatusPedido(pedido.id ?? pedido.pedido_id, "confirmado")}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                          >
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => atualizarStatusPedido(pedido.id ?? pedido.pedido_id, "processando")}
                            className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-700"
                          >
                            Processar
                          </button>
                          <button
                            type="button"
                            onClick={() => atualizarStatusPedido(pedido.id ?? pedido.pedido_id, "concluido")}
                            className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-700"
                          >
                            Concluir
                          </button>
                          <button
                            type="button"
                            onClick={() => atualizarPagamentoPedido(pedido.id ?? pedido.pedido_id, "Pago")}
                            className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-white hover:bg-amber-600"
                          >
                            Pagamento pago
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                    Nenhum pedido registado.
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "vendas":
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Vendas</p>
                  <h2 className="text-xl font-black text-slate-900">Vendas e produtos comprados</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">{vendasFiltradas.length} vendas</span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{formatarMoeda(vendas.reduce((total, venda) => total + Number(venda.total || 0), 0))}</span>
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative block w-full max-w-xl">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={pesquisaVenda}
                    onChange={(evento) => setPesquisaVenda(evento.target.value)}
                    placeholder="Pesquisar por número da venda, cliente ou produto..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#173f35]"
                  />
                </label>
                {pesquisaVenda && (
                  <button
                    type="button"
                    onClick={() => setPesquisaVenda("")}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Limpar pesquisa
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Total das vendas</p>
                <p className="mt-3 text-3xl font-black text-[#173f35]">{formatarMoeda(vendas.reduce((total, venda) => total + Number(venda.total || 0), 0))}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Produtos vendidos</p>
                <p className="mt-3 text-3xl font-black text-slate-900">
                  {vendas.reduce((total, venda) => total + Number(venda.quantidade_itens || (venda.itens || []).reduce((soma, item) => soma + Number(item.quantidade || 0), 0)), 0)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              {carregando ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">A carregar vendas...</div>
              ) : vendasFiltradas.length ? (
                <div className="space-y-4">
                  {vendasFiltradas.map((venda) => {
                    const itens = Array.isArray(venda.itens) ? venda.itens : [];
                    const aberta = Boolean(vendasAbertas[venda.id]);

                    return (
                      <div key={venda.id} className="overflow-hidden rounded-2xl border border-slate-200">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setVendasAbertas((anterior) => ({ ...anterior, [venda.id]: !anterior[venda.id] }))}
                          onKeyDown={(evento) => {
                            if (evento.key === "Enter" || evento.key === " ") {
                              evento.preventDefault();
                              setVendasAbertas((anterior) => ({ ...anterior, [venda.id]: !anterior[venda.id] }));
                            }
                          }}
                          className="flex w-full flex-col gap-3 bg-slate-50 p-4 text-left transition hover:bg-slate-100 md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <p className="font-black text-slate-900">Venda #{venda.id}</p>
                            <p className="mt-1 text-sm text-slate-600">Cliente: {venda.cliente_nome || "Cliente"}</p>
                            <p className="mt-1 text-xs text-slate-500">{formatarData(venda.criado_em)} · {venda.cliente_email || "Sem email"}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 md:justify-end">
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">{itens.length} produtos</span>
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{venda.status_pagamento || "Pendente"}</span>
                            <strong className="text-lg text-[#173f35]">{formatarMoeda(venda.total || 0)}</strong>
                            <button
                              type="button"
                              disabled={!vendaEstaPaga(venda) || gerandoPDFVenda === venda.id}
                              onClick={(evento) => {
                                evento.stopPropagation();
                                void gerarPDFDaVenda(venda);
                              }}
                              title={vendaEstaPaga(venda) ? "Gerar PDF da venda" : "Disponível após pagamento"}
                              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${
                                vendaEstaPaga(venda)
                                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                                  : "cursor-not-allowed bg-slate-200 text-slate-400"
                              }`}
                            >
                              <FaFilePdf />
                              {gerandoPDFVenda === venda.id ? "A gerar..." : "PDF"}
                            </button>
                            <FaChevronDown className={`transition-transform ${aberta ? "rotate-180" : ""}`} />
                          </div>
                        </div>

                        {aberta && (
                          <div className="border-t border-slate-200 bg-white p-4">
                            {itens.length ? (
                              <div className="space-y-3">
                                {itens.map((item) => {
                                  const imagem = obterImagemProduto(item);

                                  return (
                                    <div key={item.id || `${venda.id}-${item.produto_id}`} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-[#a3771d]">
                                          {imagem ? (
                                            <img src={imagem} alt={item.produto_nome || "Produto"} className="h-full w-full object-cover" />
                                          ) : (
                                            <FaBoxOpen />
                                          )}
                                        </div>
                                        <div>
                                          <p className="font-bold text-slate-900">{item.produto_nome || "Produto"}</p>
                                          <p className="mt-1 text-xs text-slate-500">Quantidade: {item.quantidade || 0} · Preço: {formatarMoeda(item.preco || 0)}</p>
                                        </div>
                                      </div>
                                      <strong className="text-sm text-[#173f35]">{formatarMoeda(item.subtotal ?? Number(item.quantidade || 0) * Number(item.preco || 0))}</strong>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500">Esta venda não possui produtos registrados.</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  {pesquisaVenda ? "Nenhuma venda encontrada para esta pesquisa." : "Nenhuma venda registrada."}
                </div>
              )}
            </div>
          </div>
        );

      case "configuracoes":
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Configurações</p>
                  <h2 className="text-xl font-black text-slate-900">Perfil do gestor</h2>
                </div>
                <FaUserCog className="text-[#173f35]" />
              </div>

              <form onSubmit={salvarPerfilGestor} className="space-y-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#173f35] text-2xl font-black text-white">
                    {perfilGestorImagem ? (
                      <img src={URL.createObjectURL(perfilGestorImagem)} alt="Pré-visualização do gestor" className="h-full w-full object-cover" />
                    ) : obterImagemCliente(usuario) ? (
                      <img src={obterImagemCliente(usuario)} alt={gestorNome} className="h-full w-full object-cover" />
                    ) : (
                      gestorNome.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Foto do gestor</p>
                    <label className="mt-2 inline-flex cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
                      Escolher imagem
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(evento) => setPerfilGestorImagem(evento.target.files?.[0] || null)}
                      />
                    </label>
                    {perfilGestorImagem && <p className="mt-2 text-xs text-slate-500">{perfilGestorImagem.name}</p>}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-slate-700">Nome</span>
                    <input
                      value={perfilGestorForm.nome}
                      onChange={(evento) => setPerfilGestorForm((anterior) => ({ ...anterior, nome: evento.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-[#173f35]"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-slate-700">Email</span>
                    <input
                      type="email"
                      value={perfilGestorForm.email}
                      onChange={(evento) => setPerfilGestorForm((anterior) => ({ ...anterior, email: evento.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-[#173f35]"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-slate-700">Telefone</span>
                    <input
                      value={perfilGestorForm.telefone}
                      onChange={(evento) => setPerfilGestorForm((anterior) => ({ ...anterior, telefone: evento.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-[#173f35]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-slate-700">Nova senha</span>
                    <input
                      type="password"
                      value={perfilGestorForm.senha}
                      onChange={(evento) => setPerfilGestorForm((anterior) => ({ ...anterior, senha: evento.target.value }))}
                      placeholder="Deixe vazio para manter a atual"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-[#173f35]"
                      minLength={6}
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-5">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Cargo atual</p>
                    <p className="text-sm text-slate-500">{usuario?.cargo || "Gestor"}</p>
                  </div>
                  <button
                    type="submit"
                    disabled={salvandoPerfilGestor}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#173f35] px-5 py-3 text-sm font-bold text-white hover:bg-[#214e42] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FaSave />
                    {salvandoPerfilGestor ? "A guardar..." : "Guardar alterações"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );

      default:
        return painelPadrao;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <ModalConfirmarSaida aberto={modalSaida} onCancelar={() => setModalSaida(false)} onConfirmar={confirmarLogout} />
      <ModalConfirmarExclusao
        aberto={modalExclusaoCategoria}
        titulo="Confirmar exclusão"
        texto={
          categoriaParaExcluir
            ? `Tem certeza que deseja excluir a categoria "${categoriaParaExcluir.nome}"? Esta ação não pode ser desfeita.`
            : "Tem certeza que deseja excluir esta categoria?"
        }
        onCancelar={() => {
          setModalExclusaoCategoria(false);
          setCategoriaParaExcluir(null);
        }}
        onConfirmar={confirmarExclusaoCategoria}
      />

      <ModalConfirmarExclusao
        aberto={modalExclusaoProduto}
        titulo="Confirmar exclusão"
        texto={
          produtoParaExcluir
            ? `Tem certeza que deseja excluir o produto "${produtoParaExcluir.nome}"? Esta ação não pode ser desfeita.`
            : "Tem certeza que deseja excluir este produto?"
        }
        onCancelar={() => {
          setModalExclusaoProduto(false);
          setProdutoParaExcluir(null);
        }}
        onConfirmar={confirmarExclusaoProduto}
      />

      <header className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between bg-slate-950 px-4 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
            <img src={LogoEmpresa} width={50} height={50} alt="ZungaExpress" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">ZungaExpress</h1>
            <p className="text-[10px] text-slate-400">Gestor</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMenuAberto(!menuAberto)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white hover:bg-white/10"
          aria-label="Abrir menu"
        >
          {menuAberto ? <FaTimes /> : <FaBars />}
        </button>
      </header>

      <aside
        className={`fixed bottom-0 left-0 top-0 z-40 flex w-72 flex-col bg-slate-950 px-5 py-6 transition-transform duration-200 lg:translate-x-0 ${
          menuAberto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white">
            <img src={LogoEmpresa} width={50} height={50} alt="ZungaExpress" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">ZungaExpress</h1>
            <p className="text-xs text-slate-400">Gestor</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Menu principal</p>

          <nav className="space-y-2">
            {menuItems.map(({ key, label, icon: Icone }) => (
              <button
                key={key}
                type="button"
                onClick={() => selecionarMenu(key)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                  menuAtivo === key
                    ? "border border-slate-200 bg-white text-slate-900"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icone />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={() => setModalSaida(true)}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10"
          >
            <FaSignOutAlt />
            Sair
          </button>

          <div className="rounded-2xl border border-white/10 p-4">
            <p className="text-xs font-semibold text-white">Gestor</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">Painel de operação e acompanhamento.</p>
          </div>
        </div>
      </aside>

      {menuAberto && <div onClick={() => setMenuAberto(false)} className="fixed inset-0 z-30 bg-black/40 lg:hidden" />}

      <main className="min-h-screen bg-white pt-16 lg:ml-72 lg:pt-0">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Gestão</p>
              <h1 className="mt-1 text-2xl font-black text-slate-900">Painel do gestor</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <span className="text-slate-500">Olá, </span>
                <strong>{gestorNome}</strong>
              </div>
              <button
                type="button"
                onClick={carregarDados}
                className="rounded-xl bg-[#173f35] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#214e42]"
              >
                Atualizar dados
              </button>
            </div>
          </div>

          {erro && (
            <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              <span>{erro}</span>
              <button type="button" onClick={() => setErro("")} className="text-red-500 hover:text-red-700">
                <FaTimes />
              </button>
            </div>
          )}

          {renderConteudoMenu()}
        </div>
      </main>
    </div>
  );
}
