import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import { useNavigate } from "react-router-dom";

import {
    FaUsers,
    FaShoppingBag,
    FaShoppingCart,
    FaTruck,
    FaMoneyBillWave,
    FaBoxOpen,
    FaArrowUp,
    FaArrowDown,
    FaClock,
    FaSyncAlt,
    FaExclamationTriangle,
    FaCheckCircle
} from "react-icons/fa";

// =====================================================
// CONFIGURAÇÃO
// =====================================================

import {API_URL} from "../../servidor/api";

// =====================================================
// TOKEN
// =====================================================

function obterToken() {
    const possiveisTokens = [
        "adminToken",
        "admin_token",
        "token",
        "accessToken",
        "access_token",
        "clienteToken",
        "cliente_token"
    ];

    for (const chave of possiveisTokens) {
        const token = localStorage.getItem(chave);

        if (
            token !== null &&
            token !== undefined &&
            String(token).trim() !== ""
        ) {
            return String(token).trim();
        }
    }

    return "";
}

// =====================================================
// FETCH API_URL
// =====================================================

async function API_URLFetch(url, options = {}) {
    const token = obterToken();

    const headers = {
        ...(options.headers || {})
    };

    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return fetch(url, {
        ...options,
        headers,
        credentials: "include"
    });
}

// =====================================================
// LER RESPOSTA
// =====================================================

async function lerResposta(response) {
    const texto = await response.text();

    if (!texto) {
        return {};
    }

    try {
        return JSON.parse(texto);
    } catch {
        return {
            mensagem: texto
        };
    }
}

// =====================================================
// PRIMEIRO VALOR
// =====================================================

function primeiroValor(...valores) {
    for (const valor of valores) {
        if (
            valor !== undefined &&
            valor !== null &&
            valor !== ""
        ) {
            return valor;
        }
    }

    return null;
}

// =====================================================
// EXTRAIR LISTA
// =====================================================

function extrairLista(dados, nomes = []) {
    if (Array.isArray(dados)) {
        return dados;
    }

    if (!dados || typeof dados !== "object") {
        return [];
    }

    const possibilidades = [
        ...nomes,
        "data",
        "dados",
        "resultados",
        "results",
        "rows",
        "items",
        "lista",
        "pedidos",
        "orders",
        "clientes",
        "produtos",
        "kilapes"
    ];

    for (const nome of possibilidades) {
        if (Array.isArray(dados[nome])) {
            return dados[nome];
        }
    }

    return [];
}

// =====================================================
// NORMALIZAR TEXTO
// =====================================================

function normalizarTexto(valor) {
    return String(valor ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ");
}

// =====================================================
// NORMALIZAR STATUS
// =====================================================

function normalizarStatus(status) {
    return normalizarTexto(status);
}

// =====================================================
// VERIFICAR STATUS DE PAGAMENTO
//
// Aqui verificamos vários campos possíveis.
// =====================================================

function obterStatusPagamento(pedido) {
    if (!pedido || typeof pedido !== "object") {
        return "";
    }

    const valor = primeiroValor(
        pedido.status_pagamento,
        pedido.statusPagamento,
        pedido.estado_pagamento,
        pedido.estadoPagamento,
        pedido.situacao_pagamento,
        pedido.situacaoPagamento,
        pedido.pagamento_status,
        pedido.pagamentoStatus,
        pedido.payment_status,
        pedido.paymentStatus,
        pedido.status_payment,
        pedido.statusPayment,
        pedido.estado_pagamento_pedido,
        pedido.estadoPagamentoPedido
    );

    return normalizarStatus(valor);
}

// =====================================================
// VERIFICAR SE PAGAMENTO ESTÁ PAGO
// =====================================================

function statusPagamentoEstaPago(pedido) {
    const statusPagamento =
        obterStatusPagamento(pedido);

    if (!statusPagamento) {
        return false;
    }

    return [
        "pago",
        "paga",
        "pagamento pago",
        "pagamento aprovado",
        "aprovado",
        "aprovada",
        "confirmado",
        "confirmada",
        "confirmado pagamento",
        "pagamento confirmado",
        "sucesso",
        "sucesso pagamento",
        "paid",
        "payment approved",
        "approved",
        "confirmed"
    ].includes(statusPagamento);
}

// =====================================================
// STATUS GERAL É PAGO
//
// Caso o backend coloque o pagamento diretamente
// em "status", também reconhecemos.
// =====================================================

function statusGeralEstaPago(pedido) {
    if (!pedido || typeof pedido !== "object") {
        return false;
    }

    const status = normalizarStatus(
        primeiroValor(
            pedido.status,
            pedido.estado,
            pedido.situacao,
            pedido.status_pedido,
            pedido.statusPedido,
            pedido.estado_pedido,
            pedido.estadoPedido
        )
    );

    return [
        "pago",
        "paga",
        "pagamento pago",
        "pagamento aprovado",
        "aprovado",
        "aprovada",
        "confirmado",
        "confirmada",
        "confirmado pagamento",
        "pagamento confirmado",
        "paid",
        "payment approved",
        "approved",
        "confirmed"
    ].includes(status);
}

// =====================================================
// PEDIDO ESTÁ PAGO
// =====================================================

function pedidoEstaPago(pedido) {
    if (!pedido || typeof pedido !== "object") {
        return false;
    }

    // Primeiro verifica campos específicos do pagamento.
    if (statusPagamentoEstaPago(pedido)) {
        return true;
    }

    // Depois verifica status geral.
    if (statusGeralEstaPago(pedido)) {
        return true;
    }

    // Alguns backends enviam booleanos.
    const camposBooleanos = [
        pedido.pago,
        pedido.isPago,
        pedido.is_pago,
        pedido.pagamento_confirmado,
        pedido.pagamentoConfirmado,
        pedido.paymentConfirmed
    ];

    for (const valor of camposBooleanos) {
        if (
            valor === true ||
            valor === 1 ||
            String(valor).toLowerCase() === "true"
        ) {
            return true;
        }
    }

    return false;
}

// =====================================================
// TEXTO DO STATUS PARA EXIBIÇÃO
// =====================================================

function obterStatusExibicao(pedido) {
    if (pedidoEstaPago(pedido)) {
        return "PAGO";
    }

    const statusPagamento =
        obterStatusPagamento(pedido);

    if (statusPagamento) {
        return String(
            statusPagamento
        )
            .replace(/\b\w/g, (letra) =>
                letra.toUpperCase()
            );
    }

    const status = primeiroValor(
        pedido?.status,
        pedido?.estado,
        pedido?.situacao,
        "Pendente"
    );

    return String(status);
}

// =====================================================
// PEDIDO PENDENTE
// =====================================================

function pedidoEstaPendente(pedido) {
    if (pedidoEstaPago(pedido)) {
        return false;
    }

    const status = normalizarStatus(
        primeiroValor(
            pedido?.status,
            pedido?.estado,
            pedido?.situacao,
            pedido?.status_pedido,
            pedido?.statusPedido
        )
    );

    return [
        "pendente",
        "aguardando",
        "novo",
        "processando",
        "em processamento",
        "aguardando pagamento",
        "aguardando aprovacao",
        "aguardando aprovacao do pagamento"
    ].includes(status);
}

// =====================================================
// MOEDA
// =====================================================

function converterNumero(valor) {
    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        return 0;
    }

    if (typeof valor === "number") {
        return Number.isFinite(valor)
            ? valor
            : 0;
    }

    let texto = String(valor)
        .trim()
        .replace(/\s/g, "");

    if (!texto) {
        return 0;
    }

    // Remove símbolos de moeda
    texto = texto
        .replace(/Kz/gi, "")
        .replace(/AOA/gi, "")
        .trim();

    // 1.000,50 -> 1000.50
    if (
        texto.includes(".") &&
        texto.includes(",")
    ) {
        texto = texto
            .replace(/\./g, "")
            .replace(",", ".");
    } else if (
        texto.includes(",")
    ) {
        texto = texto.replace(",", ".");
    }

    const numero = Number(texto);

    return Number.isFinite(numero)
        ? numero
        : 0;
}

// =====================================================
// FORMATAR MOEDA
// =====================================================

function formatarMoeda(valor) {
    const numero = converterNumero(valor);

    return (
        numero.toLocaleString("pt-AO", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + " Kz"
    );
}

// =====================================================
// DATA VÁLIDA
// =====================================================

function obterDataValida(valor) {
    if (
        valor === undefined ||
        valor === null ||
        valor === ""
    ) {
        return null;
    }

    if (valor instanceof Date) {
        return Number.isNaN(valor.getTime())
            ? null
            : valor;
    }

    const texto = String(valor).trim();

    if (!texto) {
        return null;
    }

    // YYYY-MM-DD
    if (
        /^\d{4}-\d{2}-\d{2}$/.test(texto)
    ) {
        const [
            ano,
            mes,
            dia
        ] = texto
            .split("-")
            .map(Number);

        const data = new Date(
            ano,
            mes - 1,
            dia
        );

        return Number.isNaN(data.getTime())
            ? null
            : data;
    }

    // YYYY-MM-DD HH:mm:ss
    const data = new Date(
        texto.replace(" ", "T")
    );

    if (Number.isNaN(data.getTime())) {
        return null;
    }

    return data;
}

// =====================================================
// DATA HOJE
// =====================================================

function dataEhHoje(valor) {
    const data = obterDataValida(valor);

    if (!data) {
        return false;
    }

    const agora = new Date();

    return (
        data.getFullYear() ===
            agora.getFullYear() &&
        data.getMonth() ===
            agora.getMonth() &&
        data.getDate() ===
            agora.getDate()
    );
}

// =====================================================
// OBTER DATA DE CRIAÇÃO
// =====================================================

function obterDataPedido(pedido) {
    if (!pedido) {
        return null;
    }

    return primeiroValor(
        pedido.data,
        pedido.data_pedido,
        pedido.dataPedido,
        pedido.data_criacao,
        pedido.dataCriacao,
        pedido.criado_em,
        pedido.created_at,
        pedido.createdAt,
        pedido.createdAtDate
    );
}

// =====================================================
// OBTER DATA DE PAGAMENTO
// =====================================================

function obterDataPagamento(pedido) {
    if (!pedido) {
        return null;
    }

    const data = primeiroValor(
        pedido.data_pagamento,
        pedido.dataPagamento,
        pedido.data_pago,
        pedido.dataPago,
        pedido.pago_em,
        pedido.pagoEm,
        pedido.pagamento_em,
        pedido.pagamentoEm,
        pedido.data_confirmacao_pagamento,
        pedido.dataConfirmacaoPagamento,
        pedido.data_confirmacao,
        pedido.dataConfirmacao,
        pedido.payment_date,
        pedido.paymentDate,
        pedido.payment_at,
        pedido.paymentAt,
        pedido.aprovado_em,
        pedido.aprovadoEm,
        pedido.confirmado_em,
        pedido.confirmadoEm
    );

    if (
        data !== null &&
        data !== undefined &&
        data !== ""
    ) {
        return data;
    }

    return obterDataPedido(pedido);
}

// =====================================================
// OBTER VALOR DO PEDIDO
// =====================================================

function obterValorPedido(pedido) {
    if (!pedido) {
        return 0;
    }

    const valor = primeiroValor(
        pedido.valor_pago,
        pedido.valorPago,
        pedido.total_pago,
        pedido.totalPago,
        pedido.valor,
        pedido.total,
        pedido.valor_total,
        pedido.valorTotal,
        pedido.total_pedido,
        pedido.totalPedido,
        pedido.preco_total,
        pedido.precoTotal,
        pedido.amount,
        pedido.total_amount
    );

    return converterNumero(valor);
}

// =====================================================
// NORMALIZAR CLIENTE
// =====================================================

function normalizarCliente(cliente) {
    if (
        !cliente ||
        typeof cliente !== "object"
    ) {
        return {};
    }

    return {
        ...cliente,

        id: primeiroValor(
            cliente.id,
            cliente.cliente_id,
            cliente.clienteId
        ),

        nome: String(
            primeiroValor(
                cliente.nome,
                cliente.nome_completo,
                cliente.nomeCompleto,
                cliente.name,
                "Cliente"
            )
        )
    };
}

// =====================================================
// NORMALIZAR PRODUTO
// =====================================================

function normalizarProduto(produto) {
    if (
        !produto ||
        typeof produto !== "object"
    ) {
        return {};
    }

    return {
        ...produto,

        id: primeiroValor(
            produto.id,
            produto.produto_id,
            produto.produtoId
        ),

        nome: String(
            primeiroValor(
                produto.nome,
                produto.nome_produto,
                produto.nomeProduto,
                produto.name,
                "Produto"
            )
        ),

        estoque: converterNumero(
            primeiroValor(
                produto.estoque,
                produto.stock,
                produto.quantidade,
                produto.quantidade_estoque,
                0
            )
        )
    };
}

// =====================================================
// NORMALIZAR PEDIDO
// =====================================================

function normalizarPedido(pedido) {
    if (
        !pedido ||
        typeof pedido !== "object"
    ) {
        return {};
    }

    const dataPedido =
        obterDataPedido(pedido);

    const dataPagamento =
        obterDataPagamento(pedido);

    const pago =
        pedidoEstaPago(pedido);

    return {
        ...pedido,

        id: primeiroValor(
            pedido.id,
            pedido.pedido_id,
            pedido.pedidoId
        ),

        cliente_nome: String(
            primeiroValor(
                pedido.cliente_nome,
                pedido.nome_cliente,
                pedido.cliente?.nome,
                pedido.nome,
                pedido.nome_completo,
                pedido.nomeCompleto,
                "Cliente"
            )
        ),

        valor:
            obterValorPedido(pedido),

        status: String(
            primeiroValor(
                pedido.status,
                pedido.estado,
                pedido.situacao,
                pedido.status_pedido,
                pedido.statusPedido,
                "pendente"
            )
        ),

        statusPagamento:
            obterStatusPagamento(pedido),

        pago,

        data: dataPedido,

        dataPagamento
    };
}

// =====================================================
// NORMALIZAR KILAPE
// =====================================================

function normalizarKilape(kilape) {
    if (
        !kilape ||
        typeof kilape !== "object"
    ) {
        return {};
    }

    return {
        ...kilape,

        id: primeiroValor(
            kilape.id,
            kilape.kilape_id,
            kilape.kilapeId
        ),

        status: String(
            primeiroValor(
                kilape.status,
                kilape.estado,
                kilape.situacao,
                "pendente"
            )
        ),

        data: primeiroValor(
            kilape.data,
            kilape.data_kilape,
            kilape.data_criacao,
            kilape.dataCriacao,
            kilape.criado_em,
            kilape.created_at,
            kilape.createdAt
        )
    };
}

// =====================================================
// DASHBOARD
// =====================================================

export default function Dashboard() {
    const navigate = useNavigate();

    const [clientes, setClientes] =
        useState([]);

    const [produtos, setProdutos] =
        useState([]);

    const [pedidos, setPedidos] =
        useState([]);

    const [kilapes, setKilapes] =
        useState([]);

    const [carregando, setCarregando] =
        useState(true);

    const [erro, setErro] =
        useState("");

    // =================================================
    // CLIENTES
    // =================================================

    const carregarClientes =
        useCallback(async () => {
            const resposta =
                await API_URLFetch(
                    `${API_URL}/clientes`
                );

            const dados =
                await lerResposta(
                    resposta
                );

            if (!resposta.ok) {
                throw new Error(
                    dados?.mensagem ||
                    dados?.message ||
                    "Erro ao carregar clientes."
                );
            }

            const lista =
                extrairLista(
                    dados,
                    ["clientes"]
                );

            setClientes(
                lista.map(
                    normalizarCliente
                )
            );
        }, []);

    // =================================================
    // PRODUTOS
    // =================================================

    const carregarProdutos =
        useCallback(async () => {
            const resposta =
                await API_URLFetch(
                    `${API_URL}/produtos`
                );

            const dados =
                await lerResposta(
                    resposta
                );

            if (!resposta.ok) {
                throw new Error(
                    dados?.mensagem ||
                    dados?.message ||
                    "Erro ao carregar produtos."
                );
            }

            const lista =
                extrairLista(
                    dados,
                    ["produtos"]
                );

            setProdutos(
                lista.map(
                    normalizarProduto
                )
            );
        }, []);

    // =================================================
    // PEDIDOS
    // =================================================

    const carregarPedidos =
        useCallback(async () => {
            const resposta =
                await API_URLFetch(
                    `${API_URL}/pedidos`
                );

            const dados =
                await lerResposta(
                    resposta
                );

            if (!resposta.ok) {
                throw new Error(
                    dados?.mensagem ||
                    dados?.message ||
                    "Erro ao carregar pedidos."
                );
            }

            const lista =
                extrairLista(
                    dados,
                    ["pedidos"]
                );

            const normalizados =
                lista.map(
                    normalizarPedido
                );

            console.log(
                "DASHBOARD - PEDIDOS:",
                normalizados
            );

            console.log(
                "DASHBOARD - PAGOS:",
                normalizados.filter(
                    (pedido) =>
                        pedido.pago === true
                )
            );

            setPedidos(
                normalizados
            );
        }, []);

    // =================================================
    // KILAPES
    // =================================================

    const carregarKilapes =
        useCallback(async () => {
            try {
                const resposta =
                    await API_URLFetch(
                        `${API_URL}/kilapes`
                    );

                const dados =
                    await lerResposta(
                        resposta
                    );

                if (!resposta.ok) {
                    throw new Error(
                        dados?.mensagem ||
                        dados?.message ||
                        "Erro ao carregar Kilapes."
                    );
                }

                const lista =
                    extrairLista(
                        dados,
                        [
                            "kilapes",
                            "kilape"
                        ]
                    );

                setKilapes(
                    lista.map(
                        normalizarKilape
                    )
                );
            } catch (error) {
                console.error(
                    "Erro ao carregar Kilapes:",
                    error
                );

                setKilapes([]);
            }
        }, []);

    // =================================================
    // CARREGAR DASHBOARD
    // =================================================

    const carregarDashboard =
        useCallback(async () => {
            setCarregando(true);
            setErro("");

            try {
                const resultados =
                    await Promise.allSettled([
                        carregarClientes(),
                        carregarProdutos(),
                        carregarPedidos(),
                        carregarKilapes()
                    ]);

                const houveErro =
                    resultados.some(
                        (resultado) =>
                            resultado.status ===
                            "rejected"
                    );

                if (houveErro) {
                    setErro(
                        "Alguns dados do Dashboard não puderam ser carregados."
                    );
                }
            } catch (error) {
                console.error(
                    "Erro no Dashboard:",
                    error
                );

                setErro(
                    error?.message ||
                    "Não foi possível carregar o Dashboard."
                );
            } finally {
                setCarregando(false);
            }
        }, [
            carregarClientes,
            carregarProdutos,
            carregarPedidos,
            carregarKilapes
        ]);

    // =================================================
    // INICIALIZAÇÃO
    // =================================================

    useEffect(() => {
        carregarDashboard();
    }, [carregarDashboard]);

    // =================================================
    // TOTAIS
    // =================================================

    const totalClientes =
        clientes.length;

    const totalProdutos =
        produtos.length;

    const totalPedidos =
        pedidos.length;

    const totalKilapes =
        kilapes.length;

    // =================================================
    // PEDIDOS PAGOS
    // =================================================

    const pedidosPagos =
        useMemo(() => {
            return pedidos.filter(
                (pedido) =>
                    pedido.pago === true ||
                    pedidoEstaPago(pedido)
            );
        }, [pedidos]);

    // =================================================
    // PEDIDOS PAGOS HOJE
    //
    // USA DATA DE PAGAMENTO.
    // =================================================

    const pedidosPagosHoje =
        useMemo(() => {
            return pedidosPagos.filter(
                (pedido) =>
                    dataEhHoje(
                        pedido.dataPagamento
                    )
            );
        }, [pedidosPagos]);

    // =================================================
    // TOTAL VENDAS HOJE
    // =================================================

    const vendasHoje =
        useMemo(() => {
            return pedidosPagosHoje.reduce(
                (total, pedido) =>
                    total +
                    obterValorPedido(
                        pedido
                    ),
                0
            );
        }, [pedidosPagosHoje]);

    // =================================================
    // PEDIDOS PENDENTES
    // =================================================

    const pedidosPendentes =
        useMemo(() => {
            return pedidos.filter(
                (pedido) =>
                    pedidoEstaPendente(
                        pedido
                    )
            ).length;
        }, [pedidos]);

    // =================================================
    // ESTOQUE
    // =================================================

    const produtosEmEstoque =
        useMemo(() => {
            return produtos.filter(
                (produto) =>
                    Number(
                        produto.estoque
                    ) > 0
            ).length;
        }, [produtos]);

    const produtosEstoqueBaixo =
        useMemo(() => {
            return produtos.filter(
                (produto) => {
                    const estoque =
                        Number(
                            produto.estoque
                        );

                    return (
                        estoque > 0 &&
                        estoque <= 5
                    );
                }
            ).length;
        }, [produtos]);

    // =================================================
    // PEDIDOS RECENTES
    //
    // IMPORTANTE:
    //
    // Se o pedido foi pago recentemente,
    // usamos a DATA DE PAGAMENTO para ordenar.
    //
    // Assim pedidos pagos aparecem corretamente
    // no histórico.
    // =================================================

    const pedidosRecentes =
        useMemo(() => {
            return [...pedidos]
                .sort((a, b) => {
                    const dataA =
                        obterDataValida(
                            a.pago
                                ? a.dataPagamento
                                : obterDataPedido(a)
                        )?.getTime() || 0;

                    const dataB =
                        obterDataValida(
                            b.pago
                                ? b.dataPagamento
                                : obterDataPedido(b)
                        )?.getTime() || 0;

                    return (
                        dataB - dataA
                    );
                })
                .slice(0, 5);
        }, [pedidos]);

    // =================================================
    // ESTATÍSTICAS
    // =================================================

    const estatisticas =
        useMemo(() => [
            {
                titulo:
                    "Total de clientes",
                valor:
                    totalClientes,
                descricao:
                    "Clientes cadastrados",
                icone:
                    <FaUsers />,
                rota:
                    "/clientes"
            },
            {
                titulo:
                    "Produtos",
                valor:
                    totalProdutos,
                descricao:
                    "Produtos cadastrados",
                icone:
                    <FaShoppingBag />,
                rota:
                    "/produtos"
            },
            {
                titulo:
                    "Pedidos",
                valor:
                    totalPedidos,
                descricao:
                    "Pedidos realizados",
                icone:
                    <FaShoppingCart />,
                rota:
                    "/pedidos"
            },
            {
                titulo:
                    "Total de Kilapes",
                valor:
                    totalKilapes,
                descricao:
                    "Kilapes registados",
                icone:
                    <FaTruck />,
                rota:
                    "/kilapes"
            }
        ], [
            totalClientes,
            totalProdutos,
            totalPedidos,
            totalKilapes
        ]);

    // =================================================
    // RENDER
    // =================================================

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

            <div className="mx-auto max-w-7xl">

                {/* CABEÇALHO */}

                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                        <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
                            Dashboard
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Visão geral da sua plataforma ZungaExpress.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={carregarDashboard}
                        disabled={carregando}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <FaSyncAlt
                            className={
                                carregando
                                    ? "animate-spin"
                                    : ""
                            }
                        />

                        Actualizar
                    </button>

                </div>

                {/* ERRO */}

                {erro && (
                    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                        <FaExclamationTriangle className="mt-0.5 shrink-0" />

                        <div>
                            <p className="font-bold">
                                Atenção
                            </p>

                            <p className="mt-1">
                                {erro}
                            </p>
                        </div>

                    </div>
                )}

                {/* ESTATÍSTICAS */}

                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

                    {estatisticas.map(
                        (item) => (
                            <button
                                type="button"
                                key={item.titulo}
                                onClick={() =>
                                    navigate(
                                        item.rota
                                    )
                                }
                                className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-1 hover:shadow-lg"
                            >

                                <div className="flex items-start justify-between">

                                    <div>

                                        <p className="text-sm font-medium text-slate-500">
                                            {item.titulo}
                                        </p>

                                        <h2 className="mt-2 text-3xl font-black text-slate-900">
                                            {carregando
                                                ? "..."
                                                : item.valor}
                                        </h2>

                                    </div>

                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-white">
                                        {item.icone}
                                    </div>

                                </div>

                                <p className="mt-4 text-xs text-slate-400">
                                    {item.descricao}
                                </p>

                            </button>
                        )
                    )}

                </div>

                {/* RESUMO */}

                <div className="mt-6 grid gap-5 lg:grid-cols-3">

                    {/* VENDAS HOJE */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-6">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm font-medium text-slate-500">
                                    Total pago hoje
                                </p>

                                <h2 className="mt-2 text-2xl font-black text-slate-900">
                                    {carregando
                                        ? "..."
                                        : formatarMoeda(
                                            vendasHoje
                                        )}
                                </h2>

                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                                <FaMoneyBillWave />
                            </div>

                        </div>

                        <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-emerald-600">

                            <FaCheckCircle />

                            <span>
                                {carregando
                                    ? "A carregar..."
                                    : `${pedidosPagosHoje.length} pedido(s) pago(s) hoje`}
                            </span>

                        </div>

                    </div>

                    {/* PEDIDOS PENDENTES */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-6">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm font-medium text-slate-500">
                                    Pedidos pendentes
                                </p>

                                <h2 className="mt-2 text-2xl font-black text-slate-900">
                                    {carregando
                                        ? "..."
                                        : pedidosPendentes}
                                </h2>

                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                                <FaClock />
                            </div>

                        </div>

                        <p className="mt-5 text-xs text-slate-400">
                            Pedidos aguardando pagamento ou processamento.
                        </p>

                    </div>

                    {/* KILAPES */}

                    <div className="rounded-2xl border border-slate-200 bg-white p-6">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm font-medium text-slate-500">
                                    Total de Kilapes
                                </p>

                                <h2 className="mt-2 text-2xl font-black text-slate-900">
                                    {carregando
                                        ? "..."
                                        : totalKilapes}
                                </h2>

                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                                <FaTruck />
                            </div>

                        </div>

                        <p className="mt-5 text-xs text-slate-400">
                            Total de Kilapes registados na plataforma.
                        </p>

                    </div>

                </div>

                {/* ÁREA PRINCIPAL */}

                <div className="mt-6 grid gap-6 lg:grid-cols-2">

                    {/* PEDIDOS RECENTES */}

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

                        <div className="flex items-center justify-between border-b border-slate-100 p-5">

                            <div>

                                <h2 className="font-bold text-slate-900">
                                    Pedidos recentes
                                </h2>

                                <p className="mt-1 text-xs text-slate-400">
                                    Últimos pedidos, incluindo pagamentos confirmados.
                                </p>

                            </div>

                            <FaShoppingCart className="text-slate-400" />

                        </div>

                        <div className="p-5">

                            {carregando ? (

                                <div className="flex flex-col items-center justify-center py-10 text-center">

                                    <FaSyncAlt className="animate-spin text-2xl text-slate-400" />

                                    <p className="mt-3 text-sm text-slate-400">
                                        A carregar pedidos...
                                    </p>

                                </div>

                            ) : pedidosRecentes.length === 0 ? (

                                <div className="flex flex-col items-center justify-center py-10 text-center">

                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">

                                        <FaShoppingCart />

                                    </div>

                                    <h3 className="font-semibold text-slate-700">
                                        Nenhum pedido
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-400">
                                        Os pedidos aparecerão aqui.
                                    </p>

                                </div>

                            ) : (

                                <div className="space-y-3">

                                    {pedidosRecentes.map(
                                        (
                                            pedido,
                                            index
                                        ) => {

                                            const pago =
                                                pedido.pago === true ||
                                                pedidoEstaPago(
                                                    pedido
                                                );

                                            const status =
                                                normalizarStatus(
                                                    pedido.status
                                                );

                                            let classeStatus =
                                                "bg-amber-50 text-amber-700";

                                            if (pago) {
                                                classeStatus =
                                                    "bg-emerald-50 text-emerald-700";
                                            }

                                            if (
                                                !pago &&
                                                [
                                                    "cancelado",
                                                    "cancelada",
                                                    "recusado",
                                                    "recusada",
                                                    "rejeitado",
                                                    "rejeitada"
                                                ].includes(
                                                    status
                                                )
                                            ) {
                                                classeStatus =
                                                    "bg-red-50 text-red-700";
                                            }

                                            return (
                                                <button
                                                    type="button"
                                                    key={
                                                        pedido.id
                                                            ? String(
                                                                pedido.id
                                                            )
                                                            : `pedido-${index}`
                                                    }
                                                    onClick={() =>
                                                        navigate(
                                                            "/pedidos"
                                                        )
                                                    }
                                                    className="w-full rounded-xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:bg-slate-100"
                                                >

                                                    <div className="flex items-center justify-between gap-4">

                                                        <div className="min-w-0">

                                                            <p className="truncate text-sm font-bold text-slate-800">
                                                                {
                                                                    pedido.cliente_nome
                                                                }
                                                            </p>

                                                            <p className="mt-1 text-xs text-slate-400">
                                                                Pedido #
                                                                {
                                                                    pedido.id
                                                                }
                                                            </p>

                                                            {pago && (
                                                                <p className="mt-1 text-[10px] font-semibold text-emerald-600">
                                                                    Pagamento confirmado
                                                                </p>
                                                            )}

                                                        </div>

                                                        <div className="shrink-0 text-right">

                                                            <p className="text-sm font-black text-slate-900">
                                                                {formatarMoeda(
                                                                    pedido.valor
                                                                )}
                                                            </p>

                                                            <span
                                                                className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${classeStatus}`}
                                                            >

                                                                {pago && (
                                                                    <FaCheckCircle />
                                                                )}

                                                                {pago
                                                                    ? "PAGO"
                                                                    : obterStatusExibicao(
                                                                        pedido
                                                                    )}

                                                            </span>

                                                        </div>

                                                    </div>

                                                </button>
                                            );
                                        }
                                    )}

                                </div>

                            )}

                        </div>

                    </div>

                    {/* ESTOQUE */}

                    <div className="rounded-2xl border border-slate-200 bg-white">

                        <div className="flex items-center justify-between border-b border-slate-100 p-5">

                            <div>

                                <h2 className="font-bold text-slate-900">
                                    Estado do estoque
                                </h2>

                                <p className="mt-1 text-xs text-slate-400">
                                    Resumo dos produtos.
                                </p>

                            </div>

                            <FaBoxOpen className="text-slate-400" />

                        </div>

                        <div className="space-y-4 p-5">

                            {/* PRODUTOS EM ESTOQUE */}

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/produtos"
                                    )
                                }
                                className="flex w-full items-center justify-between rounded-xl bg-slate-50 p-4 text-left transition hover:bg-slate-100"
                            >

                                <div className="flex items-center gap-3">

                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
                                        <FaBoxOpen />
                                    </div>

                                    <div>

                                        <p className="text-sm font-semibold text-slate-700">
                                            Produtos em estoque
                                        </p>

                                        <p className="text-xs text-slate-400">
                                            Produtos disponíveis
                                        </p>

                                    </div>

                                </div>

                                <strong className="text-slate-900">
                                    {carregando
                                        ? "..."
                                        : produtosEmEstoque}
                                </strong>

                            </button>

                            {/* ESTOQUE BAIXO */}

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/produtos"
                                    )
                                }
                                className="flex w-full items-center justify-between rounded-xl bg-slate-50 p-4 text-left transition hover:bg-slate-100"
                            >

                                <div className="flex items-center gap-3">

                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-500">
                                        <FaArrowDown />
                                    </div>

                                    <div>

                                        <p className="text-sm font-semibold text-slate-700">
                                            Estoque baixo
                                        </p>

                                        <p className="text-xs text-slate-400">
                                            Produtos para repor
                                        </p>

                                    </div>

                                </div>

                                <strong className="text-red-500">
                                    {carregando
                                        ? "..."
                                        : produtosEstoqueBaixo}
                                </strong>

                            </button>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}