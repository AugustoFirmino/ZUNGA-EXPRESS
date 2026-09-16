import { useEffect, useMemo, useState } from "react";

import {
  FaShoppingCart,
  FaSearch,
  FaPlus,
  FaMinus,
  FaTrash,
  FaCheck,
  FaTimes,
  FaBox,
  FaImage,
  FaTag,
  FaUser,
  FaPaperPlane,
  FaPhone,
  FaEnvelope,
  FaHistory,
  FaSyncAlt,
  FaChevronDown,
  FaChevronUp,
  FaClipboardList,
  FaMoneyBillWave,
  FaExclamationCircle,
  FaEye,
  FaSpinner,
  FaTrashAlt,
} from "react-icons/fa";

// =====================================================
// CONFIGURAÇÃO
// =====================================================

import { API_URL } from "../../servidor/api";

const API_PRODUTOS = `${API_URL}/produtos`;
const API_CLIENTES = `${API_URL}/clientes`;
const API_PEDIDOS = `${API_URL}/pedidos`;

// =====================================================
// COMPONENTE
// =====================================================

export default function Pedidos() {
  // ===================================================
  // ESTADOS
  // ===================================================

  const [produtos, setProdutos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);

  const [pesquisa, setPesquisa] = useState("");
  const [pesquisaCliente, setPesquisaCliente] = useState("");
  const [pesquisaPedidos, setPesquisaPedidos] = useState("");

  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState("Todas");

  const [clienteSelecionado, setClienteSelecionado] =
    useState(null);

  const [carregandoProdutos, setCarregandoProdutos] =
    useState(true);

  const [carregandoClientes, setCarregandoClientes] =
    useState(true);

  const [carregandoPedidos, setCarregandoPedidos] =
    useState(true);

  const [actualizandoPedidos, setActualizandoPedidos] =
    useState(false);

  const [enviandoPedido, setEnviandoPedido] =
    useState(false);

  const [validandoPagamento, setValidandoPagamento] =
    useState(null);

  const [excluindoPedido, setExcluindoPedido] =
    useState(null);

  const [mensagem, setMensagem] = useState(null);

  const [mostrarCarrinho, setMostrarCarrinho] =
    useState(false);

  const [pedidoAberto, setPedidoAberto] =
    useState(null);

  const [modalConfirmacao, setModalConfirmacao] =
    useState({
      aberto: false,
      pedido: null,
      novoStatusPagamento: null,
      novoStatusPedido: null,
      titulo: "",
      mensagem: "",
      tipo: "",
    });

  // ===================================================
  // MENSAGEM
  // ===================================================

  const mostrarMensagem = (tipo, texto) => {
    setMensagem({
      tipo,
      texto,
    });

    setTimeout(() => {
      setMensagem(null);
    }, 4000);
  };

  // ===================================================
  // LER RESPOSTA
  // ===================================================

  const lerResposta = async (resposta) => {
    const contentType =
      resposta.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      try {
        return await resposta.json();
      } catch {
        return {};
      }
    }

    try {
      const texto = await resposta.text();

      return {
        mensagem: texto,
      };
    } catch {
      return {};
    }
  };

  // ===================================================
  // NORMALIZAR CLIENTE
  // ===================================================

  const normalizarCliente = (item = {}) => {
    return {
      ...item,

      id:
        item.id ??
        item.cliente_id ??
        item.id_cliente,

      nome:
        item.nome ??
        item.nome_cliente ??
        item.nome_completo ??
        "Cliente",

      telefone:
        item.telefone ??
        item.telefone_cliente ??
        "",

      email:
        item.email ??
        item.email_cliente ??
        "",

      imagem:
        item.imagem ??
        item.imagem_url ??
        item.imagemUrl ??
        item.foto ??
        item.foto_url ??
        item.cloudinary_url ??
        item.avatar ??
        item.avatar_url ??
        item.url_imagem ??
        "",
    };
  };

  // ===================================================
  // NORMALIZAR PRODUTO
  // ===================================================

  const normalizarProduto = (item = {}) => {
    return {
      ...item,

      id:
        item.id ??
        item.produto_id,

      nome:
        item.nome ??
        item.nome_produto ??
        "",

      descricao:
        item.descricao ??
        "",

      preco: Number(
        item.preco ??
        item.valor ??
        item.preco_unitario ??
        item.preco_unitario_produto ??
        0
      ),

      quantidade: Number(
        item.quantidade ??
        item.estoque ??
        item.stock ??
        0
      ),

      categoria:
        item.categoria ??
        item.categoria_nome ??
        item.nome_categoria ??
        "",

      cloudinary_url:
        item.cloudinary_url ??
        item.imagem_url ??
        item.imagemUrl ??
        item.imagem ??
        item.foto ??
        "",
    };
  };

  // ===================================================
  // NORMALIZAR PAGAMENTO
  // ===================================================

  const normalizarPagamento = (item = {}) => {
    const statusPagamento =
      item.status_pagamento ??
      item.pagamento_status ??
      item.estado_pagamento ??
      item.statusPagamento ??
      item.payment_status ??
      item.paymentStatus ??
      item.pagamento?.status ??
      "Pendente";

    const statusNormalizado = String(statusPagamento)
      .trim()
      .toLowerCase();

    const pago =
      statusNormalizado === "pago";

    return {
      pago,

      status_pagamento:
        statusNormalizado === "pago"
          ? "Pago"
          : statusNormalizado === "falhou"
          ? "Falhou"
          : statusNormalizado === "cancelado"
          ? "Cancelado"
          : "Pendente",
    };
  };

  // ===================================================
  // NORMALIZAR ITEM
  // ===================================================

  const normalizarItemPedido = (item = {}) => {
    const quantidade = Number(
      item.quantidade ??
      item.qtd ??
      item.quantidade_produto ??
      0
    );

    const preco = Number(
      item.preco_unitario ??
      item.preco ??
      item.valor_unitario ??
      item.preco_produto ??
      0
    );

    const subtotalInformado =
      item.subtotal !== undefined &&
      item.subtotal !== null
        ? Number(item.subtotal)
        : preco * quantidade;

    return {
      ...item,

      id:
        item.id ??
        item.item_id,

      pedido_id:
        item.pedido_id ??
        item.id_pedido,

      produto_id:
        item.produto_id ??
        item.id_produto,

      nome:
        item.nome ??
        item.nome_produto ??
        item.produto_nome ??
        item.produto?.nome ??
        "Produto",

      quantidade,

      preco_unitario: preco,

      subtotal: Number.isFinite(subtotalInformado)
        ? subtotalInformado
        : preco * quantidade,

      imagem:
        item.cloudinary_url ??
        item.imagem_url ??
        item.imagem ??
        item.produto?.cloudinary_url ??
        item.produto?.imagem_url ??
        item.produto?.imagem ??
        "",

      categoria:
        item.categoria ??
        item.categoria_nome ??
        item.produto?.categoria ??
        "",
    };
  };

  // ===================================================
  // NORMALIZAR PEDIDO
  // ===================================================

  const normalizarPedido = (item = {}) => {
    let itens =
      item.itens ??
      item.produtos ??
      item.items ??
      item.pedido_itens ??
      item.detalhes ??
      [];

    if (!Array.isArray(itens)) {
      itens = [];
    }

    itens = itens.map(normalizarItemPedido);

    const totalCalculado = itens.reduce(
      (total, produto) =>
        total + Number(produto.subtotal || 0),
      0
    );

    const pagamento = normalizarPagamento(item);

    const statusOriginal =
      item.status ??
      item.estado ??
      "pendente";

    const statusNormalizado = String(statusOriginal)
      .trim()
      .toLowerCase();

    /*
     * REGRA PRINCIPAL:
     *
     * Pagamento Pago => pedido concluido
     */
    const statusFinal =
      pagamento.status_pagamento === "Pago"
        ? "concluido"
        : statusNormalizado;

    return {
      ...item,

      id:
        item.id ??
        item.pedido_id ??
        item.id_pedido,

      cliente_id:
        item.cliente_id ??
        item.id_cliente,

      cliente_nome:
        item.cliente_nome ??
        item.nome_cliente ??
        item.cliente?.nome ??
        "Cliente",

      cliente_telefone:
        item.cliente_telefone ??
        item.telefone_cliente ??
        item.cliente?.telefone ??
        "",

      cliente_email:
        item.cliente_email ??
        item.email_cliente ??
        item.cliente?.email ??
        "",

      /*
       * TODAS AS POSSÍVEIS COLUNAS DE IMAGEM
       */
      cliente_imagem:
        item.cliente_imagem ??
        item.imagem_cliente ??
        item.cliente_imagem_url ??
        item.imagem_cliente_url ??
        item.foto_cliente ??
        item.foto_cliente_url ??
        item.avatar_cliente ??
        item.avatar_cliente_url ??
        item.cliente?.imagem ??
        item.cliente?.imagem_url ??
        item.cliente?.imagemUrl ??
        item.cliente?.foto ??
        item.cliente?.foto_url ??
        item.cliente?.cloudinary_url ??
        item.cliente?.avatar ??
        item.cliente?.avatar_url ??
        "",

      status: statusFinal,

      criado_em:
        item.criado_em ??
        item.created_at ??
        item.data_pedido ??
        item.data ??
        "",

      atualizado_em:
        item.atualizado_em ??
        item.updated_at ??
        "",

      total: Number(
        item.total ??
        item.total_pedido ??
        item.valor_total ??
        totalCalculado
      ),

      pago: pagamento.pago,

      status_pagamento:
        pagamento.status_pagamento,

      itens,
    };
  };

  // ===================================================
  // OBTER IMAGEM DO CLIENTE
  // ===================================================

  const obterImagemCliente = (pedido) => {
    if (!pedido) {
      return "";
    }

    const imagemPedido =
      pedido.cliente_imagem ??
      pedido.imagem_cliente ??
      pedido.cliente_imagem_url ??
      pedido.imagem_cliente_url ??
      pedido.foto_cliente ??
      pedido.foto_cliente_url ??
      pedido.cliente?.imagem ??
      pedido.cliente?.imagem_url ??
      pedido.cliente?.imagemUrl ??
      pedido.cliente?.foto ??
      pedido.cliente?.foto_url ??
      pedido.cliente?.cloudinary_url ??
      pedido.cliente?.avatar ??
      pedido.cliente?.avatar_url ??
      "";

    if (imagemPedido) {
      return imagemPedido;
    }

    const cliente = clientes.find(
      (item) =>
        Number(item.id) ===
        Number(pedido.cliente_id)
    );

    if (cliente) {
      return (
        cliente.imagem ||
        cliente.foto ||
        cliente.imagem_url ||
        cliente.foto_url ||
        cliente.cloudinary_url ||
        cliente.avatar ||
        cliente.avatar_url ||
        ""
      );
    }

    return "";
  };

  // ===================================================
  // INICIAIS DO CLIENTE
  // ===================================================

  const obterIniciais = (nome) => {
    const texto = String(nome || "Cliente")
      .trim();

    if (!texto) {
      return "C";
    }

    const partes = texto.split(/\s+/);

    if (partes.length === 1) {
      return partes[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return (
      partes[0].charAt(0) +
      partes[partes.length - 1].charAt(0)
    ).toUpperCase();
  };

  // ===================================================
  // CARREGAR CLIENTES
  // ===================================================

  const carregarClientes = async () => {
    try {
      setCarregandoClientes(true);

      const resposta = await fetch(
        API_CLIENTES,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const dados = await lerResposta(resposta);

      if (!resposta.ok) {
        throw new Error(
          dados.mensagem ||
          dados.message ||
          dados.erro ||
          `Erro HTTP ${resposta.status}`
        );
      }

      let lista = [];

      if (Array.isArray(dados)) {
        lista = dados;
      } else if (Array.isArray(dados.clientes)) {
        lista = dados.clientes;
      } else if (Array.isArray(dados.data)) {
        lista = dados.data;
      } else if (Array.isArray(dados.rows)) {
        lista = dados.rows;
      }

      const clientesNormalizados =
        lista
          .map(normalizarCliente)
          .filter(
            (cliente) =>
              cliente.id &&
              Number(cliente.id) > 0
          );

      setClientes(clientesNormalizados);

      let clienteLocal = null;

      const possiveisChaves = [
        "cliente",
        "clienteLogado",
        "usuario",
        "usuarioLogado",
        "dadosCliente",
        "clienteSelecionado",
      ];

      for (const chave of possiveisChaves) {
        const valor =
          localStorage.getItem(chave);

        if (!valor) {
          continue;
        }

        try {
          const dadosLocal = JSON.parse(valor);

          if (
            dadosLocal &&
            (
              dadosLocal.id ||
              dadosLocal.cliente_id ||
              dadosLocal.cliente?.id
            )
          ) {
            clienteLocal =
              normalizarCliente(
                dadosLocal.cliente ||
                dadosLocal
              );

            break;
          }
        } catch {
          // Ignorar
        }
      }

      if (clienteLocal?.id) {
        const clienteDaLista =
          clientesNormalizados.find(
            (cliente) =>
              Number(cliente.id) ===
              Number(clienteLocal.id)
          );

        if (clienteDaLista) {
          setClienteSelecionado(
            clienteDaLista
          );
        } else {
          setClienteSelecionado(
            clienteLocal
          );
        }
      }
    } catch (erro) {
      console.error(
        "Erro ao carregar clientes:",
        erro
      );

      mostrarMensagem(
        "erro",
        erro.message ||
        "Não foi possível carregar os clientes."
      );

      setClientes([]);
    } finally {
      setCarregandoClientes(false);
    }
  };

  // ===================================================
  // CARREGAR PRODUTOS
  // ===================================================

  const carregarProdutos = async () => {
    try {
      setCarregandoProdutos(true);

      const resposta = await fetch(
        API_PRODUTOS,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const dados = await lerResposta(resposta);

      if (!resposta.ok) {
        throw new Error(
          dados.mensagem ||
          dados.message ||
          dados.erro ||
          `Erro HTTP ${resposta.status}`
        );
      }

      let lista = [];

      if (Array.isArray(dados)) {
        lista = dados;
      } else if (Array.isArray(dados.produtos)) {
        lista = dados.produtos;
      } else if (Array.isArray(dados.data)) {
        lista = dados.data;
      } else if (Array.isArray(dados.rows)) {
        lista = dados.rows;
      }

      const produtosNormalizados =
        lista
          .map(normalizarProduto)
          .filter(
            (produto) =>
              produto.id &&
              Number(produto.id) > 0
          );

      setProdutos(produtosNormalizados);
    } catch (erro) {
      console.error(
        "Erro ao carregar produtos:",
        erro
      );

      mostrarMensagem(
        "erro",
        erro.message ||
        "Não foi possível carregar os produtos."
      );

      setProdutos([]);
    } finally {
      setCarregandoProdutos(false);
    }
  };

  // ===================================================
  // CARREGAR PEDIDOS
  // ===================================================

  const carregarPedidos = async (
    mostrarNotificacao = false
  ) => {
    try {
      if (mostrarNotificacao) {
        setActualizandoPedidos(true);
      } else {
        setCarregandoPedidos(true);
      }

      const resposta = await fetch(
        API_PEDIDOS,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const dados = await lerResposta(resposta);

      console.log(
        "RESPOSTA DOS PEDIDOS:",
        dados
      );

      if (!resposta.ok) {
        throw new Error(
          dados.mensagem ||
          dados.message ||
          dados.erro ||
          `Erro HTTP ${resposta.status}`
        );
      }

      let lista = [];

      if (Array.isArray(dados)) {
        lista = dados;
      } else if (Array.isArray(dados.pedidos)) {
        lista = dados.pedidos;
      } else if (Array.isArray(dados.data)) {
        lista = dados.data;
      } else if (Array.isArray(dados.rows)) {
        lista = dados.rows;
      } else if (Array.isArray(dados.resultados)) {
        lista = dados.resultados;
      }

      const pedidosNormalizados =
        lista
          .map(normalizarPedido)
          .filter(
            (pedido) =>
              pedido.id
          );

      /*
       * Depois de carregar os pedidos,
       * associamos a imagem do cliente.
       */
      const pedidosComImagem =
        pedidosNormalizados.map(
          (pedido) => {
            const cliente =
              clientes.find(
                (item) =>
                  Number(item.id) ===
                  Number(pedido.cliente_id)
              );

            if (
              !pedido.cliente_imagem &&
              cliente
            ) {
              return {
                ...pedido,

                cliente_nome:
                  pedido.cliente_nome ||
                  cliente.nome,

                cliente_telefone:
                  pedido.cliente_telefone ||
                  cliente.telefone,

                cliente_email:
                  pedido.cliente_email ||
                  cliente.email,

                cliente_imagem:
                  cliente.imagem ||
                  cliente.imagem_url ||
                  cliente.foto ||
                  cliente.foto_url ||
                  cliente.cloudinary_url ||
                  cliente.avatar ||
                  cliente.avatar_url ||
                  "",
              };
            }

            return pedido;
          }
        );

      setPedidos(pedidosComImagem);

      if (mostrarNotificacao) {
        mostrarMensagem(
          "sucesso",
          "Lista de pedidos atualizada."
        );
      }
    } catch (erro) {
      console.error(
        "Erro ao carregar pedidos:",
        erro
      );

      setPedidos([]);

      mostrarMensagem(
        "erro",
        erro.message ||
        "Não foi possível carregar os pedidos."
      );
    } finally {
      setCarregandoPedidos(false);
      setActualizandoPedidos(false);
    }
  };

  // ===================================================
  // INICIALIZAÇÃO
  // ===================================================

  useEffect(() => {
    carregarProdutos();
    carregarClientes();
  }, []);

  /*
   * Primeiro carregamos clientes.
   * Depois carregamos pedidos para poder
   * associar a imagem do cliente.
   */
  useEffect(() => {
    carregarPedidos();
  }, [clientes.length]);

  // ===================================================
  // CATEGORIAS
  // ===================================================

  const categorias = useMemo(() => {
    const lista = [
      ...new Set(
        produtos
          .map(
            (produto) =>
              produto.categoria
          )
          .filter(Boolean)
      ),
    ];

    return lista.sort(
      (a, b) =>
        String(a).localeCompare(
          String(b)
        )
    );
  }, [produtos]);

  // ===================================================
  // CLIENTES FILTRADOS
  // ===================================================

  const clientesFiltrados = useMemo(() => {
    const texto =
      pesquisaCliente
        .toLowerCase()
        .trim();

    if (!texto) {
      return clientes;
    }

    return clientes.filter(
      (cliente) => {
        const nome =
          String(
            cliente.nome || ""
          ).toLowerCase();

        const telefone =
          String(
            cliente.telefone || ""
          ).toLowerCase();

        const email =
          String(
            cliente.email || ""
          ).toLowerCase();

        return (
          nome.includes(texto) ||
          telefone.includes(texto) ||
          email.includes(texto)
        );
      }
    );
  }, [
    clientes,
    pesquisaCliente,
  ]);

  // ===================================================
  // PRODUTOS FILTRADOS
  // ===================================================

  const produtosFiltrados = useMemo(() => {
    const texto =
      pesquisa
        .toLowerCase()
        .trim();

    return produtos.filter(
      (produto) => {
        const nome =
          String(
            produto.nome || ""
          ).toLowerCase();

        const descricao =
          String(
            produto.descricao || ""
          ).toLowerCase();

        const categoria =
          String(
            produto.categoria || ""
          ).toLowerCase();

        const correspondeTexto =
          !texto ||
          nome.includes(texto) ||
          descricao.includes(texto) ||
          categoria.includes(texto);

        const correspondeCategoria =
          categoriaSelecionada ===
            "Todas" ||
          produto.categoria ===
            categoriaSelecionada;

        return (
          correspondeTexto &&
          correspondeCategoria
        );
      }
    );
  }, [
    produtos,
    pesquisa,
    categoriaSelecionada,
  ]);

  // ===================================================
  // PEDIDOS FILTRADOS
  // ===================================================

  const pedidosFiltrados = useMemo(() => {
    const texto =
      pesquisaPedidos
        .toLowerCase()
        .trim();

    if (!texto) {
      return pedidos;
    }

    return pedidos.filter(
      (pedido) => {
        const id =
          String(
            pedido.id || ""
          ).toLowerCase();

        const cliente =
          String(
            pedido.cliente_nome ||
            ""
          ).toLowerCase();

        const status =
          String(
            pedido.status || ""
          ).toLowerCase();

        const pagamento =
          String(
            pedido.status_pagamento ||
            ""
          ).toLowerCase();

        const produtosTexto =
          pedido.itens
            .map(
              (item) =>
                item.nome
            )
            .join(" ")
            .toLowerCase();

        return (
          id.includes(texto) ||
          cliente.includes(texto) ||
          status.includes(texto) ||
          pagamento.includes(texto) ||
          produtosTexto.includes(texto)
        );
      }
    );
  }, [
    pedidos,
    pesquisaPedidos,
  ]);

  // ===================================================
  // ESTATÍSTICAS
  // ===================================================

  const pedidosPagos = useMemo(() => {
    return pedidos.filter(
      (pedido) =>
        pedido.status_pagamento ===
        "Pago"
    ).length;
  }, [pedidos]);

  const pedidosNaoPagos = useMemo(() => {
    return pedidos.filter(
      (pedido) =>
        pedido.status_pagamento !==
        "Pago"
    ).length;
  }, [pedidos]);

  const pedidosConcluidos = useMemo(() => {
    return pedidos.filter(
      (pedido) =>
        pedido.status ===
        "concluido"
    ).length;
  }, [pedidos]);

  // ===================================================
  // FORMATAR PREÇO
  // ===================================================

  const formatarPreco = (valor) => {
    return Number(
      valor || 0
    ).toLocaleString(
      "pt-AO",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  };

  // ===================================================
  // FORMATAR DATA
  // ===================================================

  const formatarData = (valor) => {
    if (!valor) {
      return "Data não disponível";
    }

    try {
      const data =
        new Date(valor);

      if (
        Number.isNaN(
          data.getTime()
        )
      ) {
        return String(valor);
      }

      return data.toLocaleString(
        "pt-AO",
        {
          dateStyle: "short",
          timeStyle: "short",
        }
      );
    } catch {
      return String(valor);
    }
  };

  // ===================================================
  // SELECIONAR CLIENTE
  // ===================================================

  const selecionarCliente = (
    cliente
  ) => {
    if (!cliente?.id) {
      return;
    }

    setClienteSelecionado(
      cliente
    );

    localStorage.setItem(
      "clienteSelecionado",
      JSON.stringify(cliente)
    );

    mostrarMensagem(
      "sucesso",
      `Cliente "${cliente.nome}" selecionado.`
    );
  };

  // ===================================================
  // ADICIONAR PRODUTO
  // ===================================================

  const adicionarProduto = (
    produto
  ) => {
    if (!produto?.id) {
      return;
    }

    const estoque = Number(
      produto.quantidade || 0
    );

    if (estoque <= 0) {
      mostrarMensagem(
        "erro",
        "Este produto está sem stock."
      );

      return;
    }

    setCarrinho(
      (anterior) => {
        const existente =
          anterior.find(
            (item) =>
              Number(
                item.produto_id
              ) ===
              Number(
                produto.id
              )
          );

        if (existente) {
          if (
            Number(
              existente.quantidade
            ) >= estoque
          ) {
            mostrarMensagem(
              "erro",
              "Você atingiu o limite disponível em stock."
            );

            return anterior;
          }

          return anterior.map(
            (item) => {
              if (
                Number(
                  item.produto_id
                ) !==
                Number(
                  produto.id
                )
              ) {
                return item;
              }

              return {
                ...item,
                quantidade:
                  Number(
                    item.quantidade
                  ) + 1,
              };
            }
          );
        }

        return [
          ...anterior,
          {
            produto_id:
              Number(
                produto.id
              ),

            nome:
              produto.nome,

            preco:
              Number(
                produto.preco || 0
              ),

            quantidade: 1,

            estoque,

            imagem:
              produto.cloudinary_url ||
              "",

            categoria:
              produto.categoria ||
              "",
          },
        ];
      }
    );

    mostrarMensagem(
      "sucesso",
      `${produto.nome} adicionado ao pedido.`
    );
  };

  // ===================================================
  // AUMENTAR QUANTIDADE
  // ===================================================

  const aumentarQuantidade = (
    produtoId
  ) => {
    setCarrinho(
      (anterior) =>
        anterior.map(
          (item) => {
            if (
              Number(
                item.produto_id
              ) !==
              Number(
                produtoId
              )
            ) {
              return item;
            }

            if (
              Number(
                item.quantidade
              ) >=
              Number(
                item.estoque
              )
            ) {
              mostrarMensagem(
                "erro",
                "Quantidade máxima disponível no stock."
              );

              return item;
            }

            return {
              ...item,
              quantidade:
                Number(
                  item.quantidade
                ) + 1,
            };
          }
        )
    );
  };

  // ===================================================
  // DIMINUIR QUANTIDADE
  // ===================================================

  const diminuirQuantidade = (
    produtoId
  ) => {
    setCarrinho(
      (anterior) =>
        anterior
          .map(
            (item) => {
              if (
                Number(
                  item.produto_id
                ) !==
                Number(
                  produtoId
                )
              ) {
                return item;
              }

              return {
                ...item,
                quantidade:
                  Number(
                    item.quantidade
                  ) - 1,
              };
            }
          )
          .filter(
            (item) =>
              Number(
                item.quantidade
              ) > 0
          )
    );
  };

  // ===================================================
  // REMOVER PRODUTO
  // ===================================================

  const removerProduto = (
    produtoId
  ) => {
    setCarrinho(
      (anterior) =>
        anterior.filter(
          (item) =>
            Number(
              item.produto_id
            ) !==
            Number(
              produtoId
            )
        )
    );
  };

  // ===================================================
  // LIMPAR CARRINHO
  // ===================================================

  const limparCarrinho = () => {
    setCarrinho([]);
  };

  // ===================================================
  // TOTAL DE ITENS
  // ===================================================

  const totalItens = useMemo(() => {
    return carrinho.reduce(
      (total, item) =>
        total +
        Number(
          item.quantidade || 0
        ),
      0
    );
  }, [carrinho]);

  // ===================================================
  // TOTAL DO PEDIDO
  // ===================================================

  const totalPedido = useMemo(() => {
    return carrinho.reduce(
      (total, item) =>
        total +
        Number(
          item.preco || 0
        ) *
        Number(
          item.quantidade || 0
        ),
      0
    );
  }, [carrinho]);

  // ===================================================
  // OBTER ID CLIENTE
  // ===================================================

  const obterClienteId = () => {
    if (clienteSelecionado?.id) {
      const id = Number(
        clienteSelecionado.id
      );

      if (
        Number.isInteger(id) &&
        id > 0
      ) {
        return id;
      }
    }

    const clienteSalvo =
      localStorage.getItem(
        "clienteSelecionado"
      );

    if (clienteSalvo) {
      try {
        const dados =
          JSON.parse(
            clienteSalvo
          );

        const id = Number(
          dados?.id ??
          dados?.cliente_id ??
          dados?.cliente?.id
        );

        if (
          Number.isInteger(id) &&
          id > 0
        ) {
          return id;
        }
      } catch {
        // Ignorar
      }
    }

    return null;
  };

  // ===================================================
  // ENVIAR PEDIDO
  // ===================================================

  const enviarPedido = async () => {
    if (enviandoPedido) {
      return;
    }

    const clienteId =
      obterClienteId();

    if (!clienteId) {
      mostrarMensagem(
        "erro",
        "Selecione um cliente antes de confirmar o pedido."
      );

      return;
    }

    if (
      !Array.isArray(carrinho) ||
      carrinho.length === 0
    ) {
      mostrarMensagem(
        "erro",
        "Adicione pelo menos um produto ao pedido."
      );

      return;
    }

    const produtosPedido =
      carrinho.map(
        (item) => ({
          produto_id:
            Number(
              item.produto_id
            ),

          quantidade:
            Number(
              item.quantidade
            ),
        })
      );

    const produtoInvalido =
      produtosPedido.some(
        (item) =>
          !Number.isInteger(
            item.produto_id
          ) ||
          item.produto_id <= 0 ||
          !Number.isInteger(
            item.quantidade
          ) ||
          item.quantidade <= 0
      );

    if (produtoInvalido) {
      mostrarMensagem(
        "erro",
        "Existe um produto inválido no pedido."
      );

      return;
    }

    const corpo = {
      cliente_id:
        Number(clienteId),

      produtos:
        produtosPedido,
    };

    try {
      setEnviandoPedido(true);

      const resposta =
        await fetch(
          API_PEDIDOS,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body:
              JSON.stringify(
                corpo
              ),
          }
        );

      const dados =
        await lerResposta(
          resposta
        );

      console.log(
        "RESPOSTA DO SERVIDOR:",
        dados
      );

      if (!resposta.ok) {
        throw new Error(
          dados.mensagem ||
          dados.message ||
          dados.erro ||
          `Erro HTTP ${resposta.status}`
        );
      }

      mostrarMensagem(
        "sucesso",
        dados.mensagem ||
        "Pedido realizado com sucesso."
      );

      setCarrinho([]);

      setMostrarCarrinho(false);

      await carregarProdutos();
      await carregarPedidos();

      setTimeout(() => {
        const elemento =
          document.getElementById(
            "historico-pedidos"
          );

        if (elemento) {
          elemento.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 300);
    } catch (erro) {
      console.error(
        "Erro ao enviar pedido:",
        erro
      );

      mostrarMensagem(
        "erro",
        erro.message ||
        "Não foi possível realizar o pedido."
      );
    } finally {
      setEnviandoPedido(false);
    }
  };

  // ===================================================
  // MODAL PAGAMENTO
  // ===================================================

  const abrirModalPagamento = (
    pedido,
    novoEstado
  ) => {
    if (!pedido?.id) {
      mostrarMensagem(
        "erro",
        "ID do pedido inválido."
      );

      return;
    }

    const idPedido =
      Number(pedido.id);

    if (
      !Number.isInteger(idPedido) ||
      idPedido <= 0
    ) {
      mostrarMensagem(
        "erro",
        "ID do pedido inválido."
      );

      return;
    }

    setModalConfirmacao({
      aberto: true,

      pedido,

      novoStatusPagamento:
        novoEstado
          ? "Pago"
          : "Pendente",

      novoStatusPedido:
        novoEstado
          ? "concluido"
          : "pendente",

      titulo:
        novoEstado
          ? "Confirmar pagamento"
          : "Reverter pagamento",

      mensagem:
        novoEstado
          ? `Deseja confirmar que o pagamento do pedido #${idPedido} foi recebido?`
          : `Deseja reverter o pagamento do pedido #${idPedido} para "Pendente"?`,

      tipo: "pagamento",
    });
  };

  // ===================================================
  // MODAL EXCLUSÃO
  // ===================================================

  const abrirModalExclusao = (
    pedido
  ) => {
    if (!pedido?.id) {
      mostrarMensagem(
        "erro",
        "ID do pedido inválido."
      );

      return;
    }

    setModalConfirmacao({
      aberto: true,

      pedido,

      novoStatusPagamento: null,

      novoStatusPedido: null,

      titulo:
        "Excluir pedido",

      mensagem:
        `Tem certeza que deseja excluir o pedido #${pedido.id}? Esta operação não poderá ser desfeita.`,

      tipo: "exclusao",
    });
  };

  // ===================================================
  // FECHAR MODAL
  // ===================================================

  const fecharModalPagamento = () => {
    if (
      validandoPagamento !== null ||
      excluindoPedido !== null
    ) {
      return;
    }

    setModalConfirmacao({
      aberto: false,
      pedido: null,
      novoStatusPagamento: null,
      novoStatusPedido: null,
      titulo: "",
      mensagem: "",
      tipo: "",
    });
  };

  // ===================================================
  // ALTERAR PAGAMENTO
  // ===================================================

  const confirmarAlteracaoPagamento =
    async () => {
      const pedido =
        modalConfirmacao.pedido;

      const novoStatusPagamento =
        modalConfirmacao
          .novoStatusPagamento;

      const novoStatusPedido =
        modalConfirmacao
          .novoStatusPedido;

      if (!pedido?.id) {
        fecharModalPagamento();

        mostrarMensagem(
          "erro",
          "Pedido inválido."
        );

        return;
      }

      const idPedido =
        Number(pedido.id);

      if (
        !Number.isInteger(idPedido) ||
        idPedido <= 0
      ) {
        mostrarMensagem(
          "erro",
          "ID do pedido inválido."
        );

        return;
      }

      if (
        ![
          "Pendente",
          "Pago",
          "Falhou",
          "Cancelado",
        ].includes(
          novoStatusPagamento
        )
      ) {
        mostrarMensagem(
          "erro",
          "Status de pagamento inválido."
        );

        return;
      }

      if (
        ![
          "pendente",
          "confirmado",
          "processando",
          "concluido",
          "cancelado",
        ].includes(
          novoStatusPedido
        )
      ) {
        mostrarMensagem(
          "erro",
          "Status do pedido inválido."
        );

        return;
      }

      try {
        setValidandoPagamento(
          idPedido
        );

        const corpo = {
          status_pagamento:
            novoStatusPagamento,

          status:
            novoStatusPedido,
        };

        console.log(
          "ATUALIZANDO PAGAMENTO:",
          corpo
        );

        const resposta =
          await fetch(
            `${API_PEDIDOS}/${idPedido}/pagamento`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",

                Accept:
                  "application/json",
              },

              body:
                JSON.stringify(
                  corpo
                ),
            }
          );

        const dados =
          await lerResposta(
            resposta
          );

        console.log(
          "RESPOSTA VALIDAÇÃO PAGAMENTO:",
          dados
        );

        if (!resposta.ok) {
          throw new Error(
            dados.mensagem ||
            dados.message ||
            dados.erro ||
            `Erro HTTP ${resposta.status}`
          );
        }

        setPedidos(
          (anterior) =>
            anterior.map(
              (item) => {
                if (
                  Number(
                    item.id
                  ) !==
                  idPedido
                ) {
                  return item;
                }

                return {
                  ...item,

                  status_pagamento:
                    novoStatusPagamento,

                  pago:
                    novoStatusPagamento ===
                    "Pago",

                  status:
                    novoStatusPagamento ===
                    "Pago"
                      ? "concluido"
                      : novoStatusPedido,
                };
              }
            )
        );

        fecharModalPagamento();

        mostrarMensagem(
          "sucesso",
          novoStatusPagamento ===
            "Pago"
            ? `Pagamento do pedido #${idPedido} confirmado. Pedido concluído.`
            : `Pagamento do pedido #${idPedido} revertido para Pendente.`
        );

        await carregarPedidos();
      } catch (erro) {
        console.error(
          "Erro ao alterar pagamento:",
          erro
        );

        mostrarMensagem(
          "erro",
          erro.message ||
          "Não foi possível atualizar o pagamento."
        );
      } finally {
        setValidandoPagamento(null);
      }
    };

  // ===================================================
  // EXCLUIR PEDIDO
  // ===================================================

  const excluirPedido = async () => {
    const pedido =
      modalConfirmacao.pedido;

    if (!pedido?.id) {
      mostrarMensagem(
        "erro",
        "Pedido inválido."
      );

      fecharModalPagamento();

      return;
    }

    const idPedido =
      Number(pedido.id);

    if (
      !Number.isInteger(idPedido) ||
      idPedido <= 0
    ) {
      mostrarMensagem(
        "erro",
        "ID do pedido inválido."
      );

      return;
    }

    try {
      setExcluindoPedido(
        idPedido
      );

      console.log(
        `EXCLUINDO PEDIDO #${idPedido}`
      );

      const resposta =
        await fetch(
          `${API_PEDIDOS}/${idPedido}`,
          {
            method: "DELETE",

            headers: {
              Accept:
                "application/json",
            },
          }
        );

      const dados =
        await lerResposta(
          resposta
        );

      console.log(
        "RESPOSTA EXCLUSÃO:",
        dados
      );

      if (!resposta.ok) {
        throw new Error(
          dados.mensagem ||
          dados.message ||
          dados.erro ||
          `Erro HTTP ${resposta.status}`
        );
      }

      /*
       * Remove imediatamente da interface.
       */
      setPedidos(
        (anterior) =>
          anterior.filter(
            (item) =>
              Number(item.id) !==
              idPedido
          )
      );

      /*
       * Se estava aberto, fecha.
       */
      if (
        Number(pedidoAberto) ===
        idPedido
      ) {
        setPedidoAberto(null);
      }

      fecharModalPagamento();

      mostrarMensagem(
        "sucesso",
        dados.mensagem ||
        `Pedido #${idPedido} excluído com sucesso.`
      );

      /*
       * Confirma com o banco.
       */
      await carregarPedidos();
    } catch (erro) {
      console.error(
        "Erro ao excluir pedido:",
        erro
      );

      mostrarMensagem(
        "erro",
        erro.message ||
        "Não foi possível excluir o pedido."
      );
    } finally {
      setExcluindoPedido(null);
    }
  };

  // ===================================================
  // CONFIRMAR MODAL
  // ===================================================

  const confirmarModal = () => {
    if (
      modalConfirmacao.tipo ===
      "exclusao"
    ) {
      excluirPedido();

      return;
    }

    confirmarAlteracaoPagamento();
  };

  // ===================================================
  // STATUS DO PEDIDO
  // ===================================================

  const formatarStatusPedido = (
    status
  ) => {
    const mapa = {
      pendente: "Pendente",
      confirmado: "Confirmado",
      processando: "Processando",
      concluido: "Concluído",
      cancelado: "Cancelado",
    };

    return (
      mapa[
        String(status)
          .toLowerCase()
      ] ||
      status ||
      "Pendente"
    );
  };

  // ===================================================
  // STATUS PAGAMENTO
  // ===================================================

  const formatarStatusPagamento = (
    status
  ) => {
    const mapa = {
      Pendente: "Pendente",
      Pago: "Pago",
      Falhou: "Falhou",
      Cancelado: "Cancelado",
    };

    return (
      mapa[status] ||
      status ||
      "Pendente"
    );
  };

  // ===================================================
  // CLASSE STATUS PEDIDO
  // ===================================================

  const classeStatusPedido = (
    status
  ) => {
    switch (
      String(status)
        .toLowerCase()
    ) {
      case "concluido":
        return "bg-green-100 text-green-700";

      case "confirmado":
        return "bg-blue-100 text-blue-700";

      case "processando":
        return "bg-yellow-100 text-yellow-700";

      case "cancelado":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // ===================================================
  // CLASSE PAGAMENTO
  // ===================================================

  const classePagamento = (
    status
  ) => {
    switch (status) {
      case "Pago":
        return "bg-green-100 text-green-700";

      case "Falhou":
        return "bg-red-100 text-red-700";

      case "Cancelado":
        return "bg-red-100 text-red-700";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">

      {/* =================================================
          MENSAGEM
      ================================================== */}

      {mensagem && (
        <div
          className={`fixed top-5 right-5 z-[200] max-w-md rounded-xl px-5 py-4 shadow-xl text-white flex items-center gap-3 ${
            mensagem.tipo === "erro"
              ? "bg-red-600"
              : mensagem.tipo === "aviso"
              ? "bg-yellow-600"
              : "bg-green-600"
          }`}
        >
          {mensagem.tipo === "erro" ? (
            <FaExclamationCircle />
          ) : (
            <FaCheck />
          )}

          <span className="font-medium">
            {mensagem.texto}
          </span>

          <button
            type="button"
            onClick={() =>
              setMensagem(null)
            }
            className="ml-2"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* =================================================
          CABEÇALHO
      ================================================== */}

      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            
               <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white shadow">
                            <FaClipboardList className=" text-white" />
                        </div>
              Gestão de Pedidos
            </h1>

            <p className="text-slate-500 mt-2">
              Crie pedidos, selecione clientes e
              controle os pagamentos.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              carregarPedidos(true)
            }
            disabled={
              actualizandoPedidos
            }
        className="
                            flex
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            px-4
                            py-3
                            text-sm
                            font-bold
                            text-slate-700
                            transition
                            hover:bg-slate-100
                            disabled:opacity-50
                        "  >
            <FaSyncAlt
              className={
                actualizandoPedidos
                  ? "animate-spin"
                  : ""
              }
            />

            {actualizandoPedidos
              ? "Atualizando..."
              : "Atualizar pedidos"}
          </button>
        </div>
      </div>

      {/* =================================================
          ESTATÍSTICAS
      ================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">
                Total de pedidos
              </p>

              <p className="text-3xl font-bold text-slate-800 mt-1">
                {pedidos.length}
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <FaClipboardList />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">
                Pagamentos pagos
              </p>

              <p className="text-3xl font-bold text-green-600 mt-1">
                {pedidosPagos}
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
              <FaMoneyBillWave />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">
                Pagamentos pendentes
              </p>

              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {pedidosNaoPagos}
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center">
              <FaMoneyBillWave />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">
                Pedidos concluídos
              </p>

              <p className="text-3xl font-bold text-purple-600 mt-1">
                {pedidosConcluidos}
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <FaCheck />
            </div>
          </div>
        </div>

      </div>

      {/* =================================================
          ÁREA DE CLIENTES
      ================================================== */}

      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-8">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">

          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FaUser className="text-blue-600" />
              Selecionar cliente
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Selecione o cliente para criar o pedido.
            </p>
          </div>

          {clienteSelecionado && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 px-4 py-3 rounded-xl">

              {clienteSelecionado.imagem ? (
                <img
                  src={
                    clienteSelecionado.imagem
                  }
                  alt={
                    clienteSelecionado.nome
                  }
                  className="w-11 h-11 rounded-full object-cover border-2 border-white shadow"
                  onError={(e) => {
                    e.currentTarget.style.display =
                      "none";
                  }}
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  {obterIniciais(
                    clienteSelecionado.nome
                  )}
                </div>
              )}

              <div>
                <p className="text-xs text-blue-600 font-semibold">
                  CLIENTE SELECIONADO
                </p>

                <p className="font-bold text-slate-800">
                  {clienteSelecionado.nome}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="relative mb-5">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            value={pesquisaCliente}
            onChange={(e) =>
              setPesquisaCliente(
                e.target.value
              )
            }
            placeholder="Pesquisar cliente por nome, telefone ou email..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {carregandoClientes ? (
          <div className="py-10 flex justify-center">
            <FaSpinner className="animate-spin text-3xl text-blue-600" />
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            Nenhum cliente encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[420px] overflow-y-auto pr-1">

            {clientesFiltrados.map(
              (cliente) => (
                <button
                  key={cliente.id}
                  type="button"
                  onClick={() =>
                    selecionarCliente(
                      cliente
                    )
                  }
                  className={`text-left border rounded-2xl p-4 transition hover:shadow-md ${
                    Number(
                      clienteSelecionado?.id
                    ) ===
                    Number(cliente.id)
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                      : "border-slate-200 bg-white"
                  }`}
                >

                  <div className="flex items-center gap-3">

                    {cliente.imagem ? (
                      <img
                        src={
                          cliente.imagem
                        }
                        alt={
                          cliente.nome
                        }
                        className="w-14 h-14 rounded-full object-cover border border-slate-200"
                        onError={(e) => {
                          e.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold">
                        {obterIniciais(
                          cliente.nome
                        )}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        {cliente.nome}
                      </p>

                      {cliente.telefone && (
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <FaPhone size={11} />
                          {cliente.telefone}
                        </p>
                      )}

                      {cliente.email && (
                        <p className="text-xs text-slate-400 truncate">
                          {cliente.email}
                        </p>
                      )}
                    </div>
                  </div>

                </button>
              )
            )}

          </div>
        )}
      </section>

      {/* =================================================
          PRODUTOS
      ================================================== */}

      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-8">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">

          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FaBox className="text-blue-600" />
              Produtos
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Adicione produtos ao pedido.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setMostrarCarrinho(
                true
              )
            }
            className="relative inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold"
          >
            <FaShoppingCart />

            Carrinho

            {totalItens > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">
                {totalItens}
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">

          <div className="lg:col-span-2 relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={pesquisa}
              onChange={(e) =>
                setPesquisa(
                  e.target.value
                )
              }
              placeholder="Pesquisar produto..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={
              categoriaSelecionada
            }
            onChange={(e) =>
              setCategoriaSelecionada(
                e.target.value
              )
            }
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Todas">
              Todas as categorias
            </option>

            {categorias.map(
              (categoria) => (
                <option
                  key={categoria}
                  value={categoria}
                >
                  {categoria}
                </option>
              )
            )}
          </select>

        </div>

        {carregandoProdutos ? (
          <div className="py-16 flex justify-center">
            <FaSpinner className="animate-spin text-4xl text-blue-600" />
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            Nenhum produto encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

            {produtosFiltrados.map(
              (produto) => (
                <div
                  key={produto.id}
                  className="border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition bg-white"
                >

                  <div className="h-48 bg-slate-100 flex items-center justify-center overflow-hidden">

                    {produto.cloudinary_url ? (
                      <img
                        src={
                          produto.cloudinary_url
                        }
                        alt={
                          produto.nome
                        }
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <FaImage className="text-5xl text-slate-300" />
                    )}

                  </div>

                  <div className="p-4">

                    <div className="flex items-start justify-between gap-2">

                      <h3 className="font-bold text-slate-800 line-clamp-2">
                        {produto.nome}
                      </h3>

                      {produto.categoria && (
                        <span className="shrink-0 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">
                          {produto.categoria}
                        </span>
                      )}

                    </div>

                    <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                      {produto.descricao ||
                        "Sem descrição"}
                    </p>

                    <div className="flex items-center justify-between mt-4">

                      <div>
                        <p className="text-lg font-bold text-blue-600">
                          {formatarPreco(
                            produto.preco
                          )} Kz
                        </p>

                        <p className="text-xs text-slate-500">
                          Stock:{" "}
                          {produto.quantidade}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          adicionarProduto(
                            produto
                          )
                        }
                        disabled={
                          Number(
                            produto.quantidade
                          ) <= 0
                        }
                        className="w-11 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white flex items-center justify-center transition"
                        title="Adicionar"
                      >
                        <FaPlus />
                      </button>

                    </div>
                  </div>

                </div>
              )
            )}

          </div>
        )}

      </section>

      {/* =================================================
          CARRINHO
      ================================================== */}

      {mostrarCarrinho && (
        <div className="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden">

            <div className="flex items-center justify-between p-5 border-b">

              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <FaShoppingCart className="text-blue-600" />
                  Carrinho
                </h2>

                <p className="text-sm text-slate-500">
                  {totalItens} item(ns)
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMostrarCarrinho(
                    false
                  )
                }
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <FaTimes />
              </button>

            </div>

            <div className="p-5 overflow-y-auto max-h-[60vh]">

              {!clienteSelecionado && (
                <div className="mb-5 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl p-4 flex gap-3">
                  <FaExclamationCircle className="mt-1" />

                  <div>
                    <p className="font-bold">
                      Cliente não selecionado
                    </p>

                    <p className="text-sm">
                      Selecione um cliente antes de enviar o pedido.
                    </p>
                  </div>
                </div>
              )}

              {carrinho.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <FaShoppingCart className="text-5xl mx-auto mb-4 text-slate-300" />

                  <p className="font-semibold">
                    O carrinho está vazio.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">

                  {carrinho.map(
                    (item) => (
                      <div
                        key={
                          item.produto_id
                        }
                        className="flex flex-col sm:flex-row gap-4 border border-slate-200 rounded-xl p-4"
                      >

                        <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">

                          {item.imagem ? (
                            <img
                              src={
                                item.imagem
                              }
                              alt={
                                item.nome
                              }
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FaImage className="text-2xl text-slate-300" />
                          )}

                        </div>

                        <div className="flex-1">

                          <h3 className="font-bold text-slate-800">
                            {item.nome}
                          </h3>

                          <p className="text-sm text-slate-500">
                            {formatarPreco(
                              item.preco
                            )} Kz / unidade
                          </p>

                          <div className="flex items-center gap-2 mt-3">

                            <button
                              type="button"
                              onClick={() =>
                                diminuirQuantidade(
                                  item.produto_id
                                )
                              }
                              className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                            >
                              <FaMinus />
                            </button>

                            <span className="font-bold min-w-[30px] text-center">
                              {
                                item.quantidade
                              }
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                aumentarQuantidade(
                                  item.produto_id
                                )
                              }
                              className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center justify-center"
                            >
                              <FaPlus />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                removerProduto(
                                  item.produto_id
                                )
                              }
                              className="ml-3 w-9 h-9 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center"
                            >
                              <FaTrash />
                            </button>

                          </div>

                        </div>

                        <div className="font-bold text-blue-600">
                          {formatarPreco(
                            Number(
                              item.preco
                            ) *
                            Number(
                              item.quantidade
                            )
                          )}{" "}
                          Kz
                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>

            {carrinho.length > 0 && (
              <div className="border-t p-5">

                <div className="flex items-center justify-between mb-4">

                  <span className="text-slate-500">
                    Total
                  </span>

                  <span className="text-2xl font-bold text-blue-600">
                    {formatarPreco(
                      totalPedido
                    )}{" "}
                    Kz
                  </span>

                </div>

                <div className="flex flex-col sm:flex-row gap-3">

                  <button
                    type="button"
                    onClick={
                      limparCarrinho
                    }
                    className="flex-1 px-5 py-3 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 font-semibold"
                  >
                    <FaTrash className="inline mr-2" />
                    Limpar
                  </button>

                  <button
                    type="button"
                    onClick={
                      enviarPedido
                    }
                    disabled={
                      enviandoPedido
                    }
                    className="flex-1 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold flex items-center justify-center gap-2"
                  >
                    {enviandoPedido ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane />
                        Confirmar pedido
                      </>
                    )}
                  </button>

                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* =================================================
          HISTÓRICO DE PEDIDOS
      ================================================== */}

      <section
        id="historico-pedidos"
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5"
      >

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">

          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FaHistory className="text-blue-600" />
              Histórico de pedidos
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Consulte, confirme pagamentos ou exclua pedidos.
            </p>
          </div>

          <div className="relative w-full lg:w-96">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={pesquisaPedidos}
              onChange={(e) =>
                setPesquisaPedidos(
                  e.target.value
                )
              }
              placeholder="Pesquisar pedido, cliente ou produto..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

        </div>

        {carregandoPedidos ? (
          <div className="py-16 flex justify-center">
            <FaSpinner className="animate-spin text-4xl text-blue-600" />
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <FaClipboardList className="text-5xl mx-auto mb-4 text-slate-300" />

            <p className="font-semibold">
              Nenhum pedido encontrado.
            </p>
          </div>
        ) : (
          <div className="space-y-5">

            {pedidosFiltrados.map(
              (pedido) => {
                const imagemCliente =
                  obterImagemCliente(
                    pedido
                  );

                const aberto =
                  Number(
                    pedidoAberto
                  ) ===
                  Number(
                    pedido.id
                  );

                return (
                  <div
                    key={pedido.id}
                    className="border border-slate-200 rounded-2xl overflow-hidden bg-white"
                  >

                    {/* CABEÇALHO DO PEDIDO */}

                    <div className="p-5">

                      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">

                        {/* CLIENTE */}

                        <div className="flex items-center gap-4 min-w-0">

                          {imagemCliente ? (
                            <img
                              src={
                                imagemCliente
                              }
                              alt={
                                pedido.cliente_nome
                              }
                              className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 shadow-sm shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold shrink-0">
                              {obterIniciais(
                                pedido.cliente_nome
                              )}
                            </div>
                          )}

                          <div className="min-w-0">

                            <div className="flex items-center gap-2 flex-wrap">

                              <h3 className="text-lg font-bold text-slate-800">
                                {pedido.cliente_nome}
                              </h3>

                              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                                Pedido #{pedido.id}
                              </span>

                            </div>

                            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 mt-1 text-sm text-slate-500">

                              {pedido.cliente_telefone && (
                                <span className="flex items-center gap-1">
                                  <FaPhone size={11} />
                                  {
                                    pedido.cliente_telefone
                                  }
                                </span>
                              )}

                              {pedido.cliente_email && (
                                <span className="flex items-center gap-1 truncate">
                                  <FaEnvelope size={11} />
                                  {
                                    pedido.cliente_email
                                  }
                                </span>
                              )}

                            </div>

                          </div>

                        </div>

                        {/* STATUS */}

                        <div className="flex flex-wrap gap-2">

                          <span
                            className={`px-3 py-2 rounded-xl text-sm font-semibold ${classeStatusPedido(
                              pedido.status
                            )}`}
                          >
                            {formatarStatusPedido(
                              pedido.status
                            )}
                          </span>

                          <span
                            className={`px-3 py-2 rounded-xl text-sm font-semibold ${classePagamento(
                              pedido.status_pagamento
                            )}`}
                          >
                            Pagamento:{" "}
                            {formatarStatusPagamento(
                              pedido.status_pagamento
                            )}
                          </span>

                        </div>

                      </div>

                      {/* INFORMAÇÕES */}

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">

                        <div className="bg-slate-50 rounded-xl p-4">
                          <p className="text-xs text-slate-500">
                            Total
                          </p>

                          <p className="text-lg font-bold text-blue-600 mt-1">
                            {formatarPreco(
                              pedido.total
                            )}{" "}
                            Kz
                          </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4">
                          <p className="text-xs text-slate-500">
                            Data do pedido
                          </p>

                          <p className="font-semibold text-slate-700 mt-1">
                            {formatarData(
                              pedido.criado_em
                            )}
                          </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4">
                          <p className="text-xs text-slate-500">
                            Produtos
                          </p>

                          <p className="font-semibold text-slate-700 mt-1">
                            {pedido.itens.length}{" "}
                            produto(s)
                          </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4">
                          <p className="text-xs text-slate-500">
                            Situação
                          </p>

                          <p
                            className={`font-semibold mt-1 ${
                              pedido.status_pagamento ===
                              "Pago"
                                ? "text-green-600"
                                : "text-yellow-600"
                            }`}
                          >
                            {pedido.status_pagamento ===
                            "Pago"
                              ? "Pagamento confirmado"
                              : "Aguardando pagamento"}
                          </p>
                        </div>

                      </div>

                      {/* BOTÕES */}

                      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mt-5">

                        <button
                          type="button"
                          onClick={() =>
                            setPedidoAberto(
                              aberto
                                ? null
                                : pedido.id
                            )
                          }
                          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                        >
                          <FaEye />

                          {aberto
                            ? "Ocultar detalhes"
                            : "Ver detalhes"}

                          {aberto ? (
                            <FaChevronUp />
                          ) : (
                            <FaChevronDown />
                          )}
                        </button>

                        {pedido.status_pagamento !==
                        "Pago" ? (
                          <button
                            type="button"
                            onClick={() =>
                              abrirModalPagamento(
                                pedido,
                                true
                              )
                            }
                            disabled={
                              validandoPagamento ===
                              Number(
                                pedido.id
                              )
                            }
                            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold"
                          >
                            <FaCheck />
                            Confirmar pagamento
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              abrirModalPagamento(
                                pedido,
                                false
                              )
                            }
                            disabled={
                              validandoPagamento ===
                              Number(
                                pedido.id
                              )
                            }
                            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-white font-semibold"
                          >
                            <FaSyncAlt />
                            Reverter pagamento
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            abrirModalExclusao(
                              pedido
                            )
                          }
                          disabled={
                            excluindoPedido ===
                            Number(
                              pedido.id
                            )
                          }
                          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold"
                        >
                          {excluindoPedido ===
                          Number(
                            pedido.id
                          ) ? (
                            <>
                              <FaSpinner className="animate-spin" />
                              Excluindo...
                            </>
                          ) : (
                            <>
                              <FaTrashAlt />
                              Excluir pedido
                            </>
                          )}
                        </button>

                      </div>

                    </div>

                    {/* DETALHES */}

                    {aberto && (
                      <div className="border-t bg-slate-50 p-5">

                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <FaBox className="text-blue-600" />
                          Produtos do pedido
                        </h4>

                        {pedido.itens.length === 0 ? (
                          <p className="text-slate-500">
                            Nenhum produto encontrado neste pedido.
                          </p>
                        ) : (
                          <div className="space-y-3">

                            {pedido.itens.map(
                              (item, indice) => (
                                <div
                                  key={
                                    item.id ||
                                    `${pedido.id}-${item.produto_id}-${indice}`
                                  }
                                  className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4"
                                >

                                  <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">

                                    {item.imagem ? (
                                      <img
                                        src={
                                          item.imagem
                                        }
                                        alt={
                                          item.nome
                                        }
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <FaImage className="text-2xl text-slate-300" />
                                    )}

                                  </div>

                                  <div className="flex-1">

                                    <p className="font-bold text-slate-800">
                                      {item.nome}
                                    </p>

                                    {item.categoria && (
                                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                        <FaTag />
                                        {
                                          item.categoria
                                        }
                                      </p>
                                    )}

                                    <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-2">

                                      <span>
                                        Quantidade:{" "}
                                        <strong className="text-slate-700">
                                          {
                                            item.quantidade
                                          }
                                        </strong>
                                      </span>

                                      <span>
                                        Preço unitário:{" "}
                                        <strong className="text-slate-700">
                                          {formatarPreco(
                                            item.preco_unitario
                                          )}{" "}
                                          Kz
                                        </strong>
                                      </span>

                                    </div>

                                  </div>

                                  <div className="sm:text-right">

                                    <p className="text-xs text-slate-500">
                                      Subtotal
                                    </p>

                                    <p className="font-bold text-blue-600 text-lg">
                                      {formatarPreco(
                                        item.subtotal
                                      )}{" "}
                                      Kz
                                    </p>

                                  </div>

                                </div>
                              )
                            )}

                          </div>
                        )}

                        {/* RESUMO */}

                        <div className="mt-5 bg-white rounded-xl border border-slate-200 p-5">

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                            <div>
                              <p className="text-sm text-slate-500">
                                Total do pedido
                              </p>

                              <p className="text-2xl font-bold text-blue-600">
                                {formatarPreco(
                                  pedido.total
                                )}{" "}
                                Kz
                              </p>
                            </div>

                            <div className="text-sm text-slate-500">
                              <p>
                                Criado em:{" "}
                                <strong className="text-slate-700">
                                  {formatarData(
                                    pedido.criado_em
                                  )}
                                </strong>
                              </p>

                              {pedido.atualizado_em && (
                                <p className="mt-1">
                                  Atualizado em:{" "}
                                  <strong className="text-slate-700">
                                    {formatarData(
                                      pedido.atualizado_em
                                    )}
                                  </strong>
                                </p>
                              )}
                            </div>

                          </div>

                        </div>

                      </div>
                    )}

                  </div>
                );
              }
            )}

          </div>
        )}

      </section>

      {/* =================================================
          MODAL DE CONFIRMAÇÃO
      ================================================== */}

      {modalConfirmacao.aberto && (
        <div className="fixed inset-0 z-[300] bg-black/60 flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">

            <div
              className={`p-5 ${
                modalConfirmacao.tipo ===
                "exclusao"
                  ? "bg-red-50"
                  : modalConfirmacao
                      .novoStatusPagamento ===
                    "Pago"
                  ? "bg-green-50"
                  : "bg-yellow-50"
              }`}
            >

              <div className="flex items-start gap-4">

                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    modalConfirmacao.tipo ===
                    "exclusao"
                      ? "bg-red-100 text-red-600"
                      : modalConfirmacao
                          .novoStatusPagamento ===
                        "Pago"
                      ? "bg-green-100 text-green-600"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                >
                  {modalConfirmacao.tipo ===
                  "exclusao" ? (
                    <FaTrashAlt />
                  ) : modalConfirmacao
                      .novoStatusPagamento ===
                    "Pago" ? (
                    <FaCheck />
                  ) : (
                    <FaSyncAlt />
                  )}
                </div>

                <div className="flex-1">

                  <h3 className="text-lg font-bold text-slate-800">
                    {
                      modalConfirmacao.titulo
                    }
                  </h3>

                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    {
                      modalConfirmacao.mensagem
                    }
                  </p>

                </div>

              </div>

            </div>

            <div className="p-5 flex flex-col sm:flex-row gap-3">

              <button
                type="button"
                onClick={
                  fecharModalPagamento
                }
                disabled={
                  validandoPagamento !==
                    null ||
                  excluindoPedido !==
                    null
                }
                className="flex-1 px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  confirmarModal
                }
                disabled={
                  validandoPagamento !==
                    null ||
                  excluindoPedido !==
                    null
                }
                className={`flex-1 px-5 py-3 rounded-xl text-white font-semibold disabled:opacity-60 flex items-center justify-center gap-2 ${
                  modalConfirmacao.tipo ===
                  "exclusao"
                    ? "bg-red-600 hover:bg-red-700"
                    : modalConfirmacao
                        .novoStatusPagamento ===
                      "Pago"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-yellow-500 hover:bg-yellow-600"
                }`}
              >

                {validandoPagamento !==
                  null ||
                excluindoPedido !==
                  null ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    {modalConfirmacao.tipo ===
                    "exclusao" ? (
                      <>
                        <FaTrashAlt />
                        Excluir
                      </>
                    ) : (
                      <>
                        <FaCheck />
                        Confirmar
                      </>
                    )}
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