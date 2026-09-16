import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import {
    FaMoneyBillWave,
    FaCalendarAlt,
    FaClock,
    FaCheckCircle,
    FaTimesCircle,
    FaExclamationTriangle,
    FaSyncAlt,
    FaPlus,
    FaHistory,
    FaInfoCircle,
    FaLock,
    FaTimes,
    FaUser,
    FaSearch,
    FaEdit,
    FaTrash,
    FaSave,
    FaBan,
    FaCreditCard,
    FaCheck,
    FaFilter
} from "react-icons/fa";

// =====================================================
// CONFIGURAÇÃO
// =====================================================

import { API_URL } from "../../servidor/api";

const PRAZO_DIAS = 21;

// =====================================================
// TOKEN
// =====================================================

function obterTokenAdmin() {
    const possiveisTokens = [
        "adminToken",
        "admin_token",
        "token",
        "accessToken",
        "access_token"
    ];

    for (const chave of possiveisTokens) {
        const token = localStorage.getItem(chave);

        if (token && token.trim()) {
            return token.trim();
        }
    }

    return "";
}

// =====================================================
// FETCH
// =====================================================

async function API_URLFetch(url, options = {}) {
    const token = obterTokenAdmin();

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
// ERRO
// =====================================================

function obterMensagemErro(dados, status) {
    if (dados?.mensagem) {
        return String(dados.mensagem);
    }

    if (dados?.message) {
        return String(dados.message);
    }

    if (dados?.erro) {
        return String(dados.erro);
    }

    if (dados?.error) {
        return String(dados.error);
    }

    if (status === 400) {
        return "Dados inválidos.";
    }

    if (status === 401) {
        return "Sessão não autorizada. Faça login novamente.";
    }

    if (status === 403) {
        return "Você não tem permissão para executar esta operação.";
    }

    if (status === 404) {
        return "Registo não encontrado.";
    }

    if (status === 409) {
        return "Não foi possível realizar a operação porque existe um conflito.";
    }

    if (status >= 500) {
        return "Erro interno do servidor.";
    }

    return "Não foi possível concluir a operação.";
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

    return "";
}

// =====================================================
// MOEDA
// =====================================================

function formatarMoeda(valor) {
    const numero = Number(valor || 0);

    return (
        numero.toLocaleString("pt-AO", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + " Kz"
    );
}

// =====================================================
// DATA
// =====================================================

function formatarData(data) {
    if (!data) {
        return "-";
    }

    const objeto = new Date(data);

    if (Number.isNaN(objeto.getTime())) {
        return String(data);
    }

    return objeto.toLocaleDateString("pt-AO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

// =====================================================
// DATA VENCIMENTO
// =====================================================

function calcularDataVencimento(dataInicial = new Date()) {
    const data = new Date(dataInicial);

    data.setDate(
        data.getDate() + PRAZO_DIAS
    );

    return data;
}

// =====================================================
// STATUS
// =====================================================

function normalizarStatus(valor) {
    return String(valor || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

// =====================================================
// CLIENTE
// =====================================================

function normalizarCliente(cliente) {
    if (!cliente || typeof cliente !== "object") {
        return {
            id: "",
            nome: "",
            telefone: "",
            email: ""
        };
    }

    return {
        ...cliente,

        id: primeiroValor(
            cliente.id,
            cliente.cliente_id,
            cliente.clienteId
        ),

        nome: primeiroValor(
            cliente.nome,
            cliente.nome_completo,
            cliente.name,
            "Cliente sem nome"
        ),

        telefone: primeiroValor(
            cliente.telefone,
            cliente.phone,
            cliente.contacto,
            ""
        ),

        email: primeiroValor(
            cliente.email,
            ""
        )
    };
}

// =====================================================
// KILAPE
// =====================================================

function obterImagemClienteKilape(cliente) {
    const fonte = cliente && typeof cliente === "object" ? cliente : {};

    const candidatos = [
        fonte.imagem_url,
        fonte.imagemUrl,
        fonte.imagem,
        fonte.foto,
        fonte.foto_url,
        fonte.fotoUrl,
        fonte.avatar,
        fonte.photo,
        fonte.perfil_url,
        fonte.perfilUrl,
        fonte.cloudinary_url,
        fonte.cloudinaryUrl
    ];

    for (const valor of candidatos) {
        if (typeof valor === "string" && valor.trim()) {
            return valor.trim();
        }
    }

    return "";
}

function normalizarKilape(kilape) {
    if (!kilape || typeof kilape !== "object") {
        return {
            id: "",
            cliente_id: "",
            cliente_nome: "",
            cliente_telefone: "",
            cliente_email: "",
            cliente_imagem: "",
            valor: 0,
            prazo_dias: PRAZO_DIAS,
            data_solicitacao: "",
            data_vencimento: "",
            status: "pendente",
            observacao: ""
        };
    }

    return {
        ...kilape,

        id: primeiroValor(
            kilape.id,
            kilape.kilape_id,
            kilape.kilapeId
        ),

        cliente_id: primeiroValor(
            kilape.cliente_id,
            kilape.clienteId,
            kilape.cliente?.id
        ),

        cliente_nome: primeiroValor(
            kilape.cliente_nome,
            kilape.nome_cliente,
            kilape.nome,
            kilape.cliente?.nome,
            "Cliente"
        ),

        cliente_telefone: primeiroValor(
            kilape.cliente_telefone,
            kilape.telefone_cliente,
            kilape.telefone,
            kilape.cliente?.telefone,
            ""
        ),

        cliente_email: primeiroValor(
            kilape.cliente_email,
            kilape.email_cliente,
            kilape.email,
            kilape.cliente?.email,
            ""
        ),

        cliente_imagem: primeiroValor(
            kilape.cliente_imagem,
            kilape.cliente_imagem_url,
            kilape.clienteImagem,
            kilape.clienteImagemUrl,
            kilape.foto_cliente,
            kilape.fotoCliente,
            kilape.cliente_foto,
            kilape.clienteFoto,
            kilape.cliente?.imagem_url,
            kilape.cliente?.imagemUrl,
            kilape.cliente?.imagem,
            kilape.cliente?.foto,
            kilape.cliente?.foto_url,
            kilape.cliente?.fotoUrl,
            kilape.cliente?.avatar,
            kilape.cliente?.photo,
            ""
        ),

        valor:
            Number(
                primeiroValor(
                    kilape.valor,
                    kilape.valor_solicitado,
                    kilape.valorSolicitado,
                    0
                )
            ) || 0,

        prazo_dias:
            Number(
                primeiroValor(
                    kilape.prazo_dias,
                    kilape.prazoDias,
                    PRAZO_DIAS
                )
            ) || PRAZO_DIAS,

        data_solicitacao:
            primeiroValor(
                kilape.data_solicitacao,
                kilape.dataSolicitacao,
                kilape.criado_em,
                kilape.created_at,
                kilape.createdAt
            ),

        data_vencimento:
            primeiroValor(
                kilape.data_vencimento,
                kilape.dataVencimento,
                kilape.vencimento
            ),

        status:
            primeiroValor(
                kilape.status,
                "pendente"
            ),

        observacao:
            primeiroValor(
                kilape.observacao,
                kilape.observacoes,
                kilape.mensagem,
                ""
            )
    };
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
        "resultados",
        "results",
        "rows"
    ];

    for (const nome of possibilidades) {
        if (Array.isArray(dados[nome])) {
            return dados[nome];
        }
    }

    return [];
}

// =====================================================
// STATUS INFO
// =====================================================

function obterStatusInfo(status) {
    const normalizado =
        normalizarStatus(status);

    if (
        normalizado === "aprovado" ||
        normalizado === "aprovada"
    ) {
        return {
            texto: "Aprovado",
            classe:
                "bg-blue-50 text-blue-700 border-blue-200",
            icone: <FaCheckCircle />
        };
    }

    if (
        normalizado === "recusado" ||
        normalizado === "recusada" ||
        normalizado === "rejeitado" ||
        normalizado === "rejeitada"
    ) {
        return {
            texto: "Recusado",
            classe:
                "bg-red-50 text-red-700 border-red-200",
            icone: <FaTimesCircle />
        };
    }

    if (
        normalizado === "pago" ||
        normalizado === "paga"
    ) {
        return {
            texto: "Pago",
            classe:
                "bg-emerald-50 text-emerald-700 border-emerald-200",
            icone: <FaCheckCircle />
        };
    }

    if (
        normalizado === "atrasado" ||
        normalizado === "vencido" ||
        normalizado === "vencida"
    ) {
        return {
            texto: "Atrasado",
            classe:
                "bg-red-50 text-red-700 border-red-200",
            icone: <FaExclamationTriangle />
        };
    }

    if (
        normalizado === "cancelado" ||
        normalizado === "cancelada"
    ) {
        return {
            texto: "Cancelado",
            classe:
                "bg-slate-100 text-slate-600 border-slate-200",
            icone: <FaTimesCircle />
        };
    }

    return {
        texto: "Pendente",
        classe:
            "bg-amber-50 text-amber-700 border-amber-200",
        icone: <FaClock />
    };
}

// =====================================================
// COMPONENTE
// =====================================================

export default function Kilapes() {

    const [clientes, setClientes] =
        useState([]);

    const [kilapes, setKilapes] =
        useState([]);

    const [clienteId, setClienteId] =
        useState("");

    const [valor, setValor] =
        useState("");

    const [observacao, setObservacao] =
        useState("");

    const [pesquisaCliente, setPesquisaCliente] =
        useState("");

    const [pesquisaKilape, setPesquisaKilape] =
        useState("");

    const [filtroStatus, setFiltroStatus] =
        useState("todos");

    const [carregando, setCarregando] =
        useState(true);

    const [carregandoClientes, setCarregandoClientes] =
        useState(true);

    const [enviando, setEnviando] =
        useState(false);

    const [erro, setErro] =
        useState("");

    const [sucesso, setSucesso] =
        useState("");

    const [mostrarFormulario, setMostrarFormulario] =
        useState(false);

    const [modoEdicao, setModoEdicao] =
        useState(false);

    const [kilapeEditando, setKilapeEditando] =
        useState(null);

    const [confirmarEliminacao, setConfirmarEliminacao] =
        useState(null);

    const [processandoId, setProcessandoId] =
        useState(null);

    // =================================================
    // NOVO MODAL DE AÇÕES
    // =================================================

    const [modalAcao, setModalAcao] =
        useState(null);

    const [motivoRecusa, setMotivoRecusa] =
        useState("");

    // =================================================
    // DATA PREVISTA
    // =================================================

    const dataVencimentoPrevista =
        useMemo(
            () => calcularDataVencimento(),
            []
        );

    // =================================================
    // CLIENTES FILTRADOS
    // =================================================

    const clientesFiltrados =
        useMemo(() => {

            const pesquisa =
                pesquisaCliente
                    .trim()
                    .toLowerCase();

            if (!pesquisa) {
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
                        nome.includes(pesquisa) ||
                        telefone.includes(pesquisa) ||
                        email.includes(pesquisa)
                    );
                }
            );

        }, [
            clientes,
            pesquisaCliente
        ]);

    // =================================================
    // KILAPES FILTRADOS
    // =================================================

    const kilapesFiltrados =
        useMemo(() => {

            const pesquisa =
                pesquisaKilape
                    .trim()
                    .toLowerCase();

            return kilapes.filter(
                (kilape) => {

                    const status =
                        normalizarStatus(
                            kilape.status
                        );

                    const correspondeStatus =
                        filtroStatus === "todos" ||
                        status === filtroStatus;

                    if (!correspondeStatus) {
                        return false;
                    }

                    if (!pesquisa) {
                        return true;
                    }

                    return (
                        String(
                            kilape.cliente_nome || ""
                        )
                            .toLowerCase()
                            .includes(pesquisa) ||

                        String(
                            kilape.cliente_telefone || ""
                        )
                            .toLowerCase()
                            .includes(pesquisa) ||

                        String(
                            kilape.id || ""
                        )
                            .toLowerCase()
                            .includes(pesquisa)
                    );
                }
            );

        }, [
            kilapes,
            pesquisaKilape,
            filtroStatus
        ]);

    // =================================================
    // CLIENTE SELECIONADO
    // =================================================

    const clienteSelecionado =
        useMemo(() => {

            return clientes.find(
                (cliente) =>
                    String(cliente.id) ===
                    String(clienteId)
            );

        }, [
            clientes,
            clienteId
        ]);

    // =================================================
    // CARREGAR CLIENTES
    // =================================================

    const carregarClientes =
        useCallback(
            async () => {

                try {

                    setCarregandoClientes(true);

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
                            obterMensagemErro(
                                dados,
                                resposta.status
                            )
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

                } catch (error) {

                    console.error(
                        "ERRO AO CARREGAR CLIENTES:",
                        error
                    );

                    setErro(
                        error?.message ||
                        "Erro ao carregar clientes."
                    );

                } finally {

                    setCarregandoClientes(
                        false
                    );

                }

            },
            []
        );

    // =================================================
    // CARREGAR KILAPES
    // =================================================

    const carregarKilapes =
        useCallback(
            async () => {

                try {

                    setCarregando(true);

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
                            obterMensagemErro(
                                dados,
                                resposta.status
                            )
                        );
                    }

                    const lista =
                        extrairLista(
                            dados,
                            ["kilapes"]
                        );

                    setKilapes(
                        lista.map(
                            normalizarKilape
                        )
                    );

                } catch (error) {

                    console.error(
                        "ERRO AO CARREGAR KILAPES:",
                        error
                    );

                    setKilapes([]);

                    setErro(
                        error?.message ||
                        "Erro ao carregar os Kilapes."
                    );

                } finally {

                    setCarregando(false);

                }

            },
            []
        );

    // =================================================
    // CARREGAR
    // =================================================

    useEffect(() => {

        carregarClientes();
        carregarKilapes();

    }, [
        carregarClientes,
        carregarKilapes
    ]);

    // =================================================
    // VALOR
    // =================================================

    function handleValorChange(event) {

        let novoValor =
            event.target.value;

        novoValor =
            novoValor.replace(
                /[^\d.,]/g,
                ""
            );

        setValor(novoValor);

        setErro("");
        setSucesso("");
    }

    // =================================================
    // CONVERTER VALOR
    // =================================================

    function converterValor(valorTexto) {

        if (!valorTexto) {
            return 0;
        }

        let texto =
            String(valorTexto)
                .trim()
                .replace(/\s/g, "");

        if (
            texto.includes(".") &&
            texto.includes(",")
        ) {
            texto =
                texto
                    .replace(/\./g, "")
                    .replace(",", ".");
        } else if (
            texto.includes(",")
        ) {
            texto =
                texto.replace(",", ".");
        } else if (
            texto.includes(".")
        ) {

            const partes =
                texto.split(".");

            const ultimaParte =
                partes[partes.length - 1];

            if (
                ultimaParte.length === 3 &&
                partes.length > 1
            ) {
                texto =
                    texto.replace(
                        /\./g,
                        ""
                    );
            }
        }

        const numero =
            Number(texto);

        return Number.isFinite(numero)
            ? numero
            : 0;
    }

    // =================================================
    // LIMPAR FORM
    // =================================================

    function limparFormulario() {
        setClienteId("");
        setValor("");
        setObservacao("");
        setPesquisaCliente("");
        setModoEdicao(false);
        setKilapeEditando(null);
    }

    // =================================================
    // ABRIR NOVO
    // =================================================

    function abrirFormulario() {

        setErro("");
        setSucesso("");

        limparFormulario();

        setMostrarFormulario(true);
    }

    // =================================================
    // ABRIR EDITAR
    // =================================================

    function abrirEdicao(kilape) {

        setErro("");
        setSucesso("");

        setModoEdicao(true);

        setKilapeEditando(kilape);

        setClienteId(
            String(kilape.cliente_id || "")
        );

        setValor(
            String(kilape.valor || "")
        );

        setObservacao(
            kilape.observacao || ""
        );

        setPesquisaCliente("");

        setMostrarFormulario(true);
    }

    // =================================================
    // FECHAR FORMULÁRIO
    // =================================================

    function fecharFormulario() {

        if (enviando) {
            return;
        }

        setMostrarFormulario(false);

        limparFormulario();
    }

    // =================================================
    // CRIAR / EDITAR
    // =================================================

    async function salvarKilape(event) {

        event.preventDefault();

        setErro("");
        setSucesso("");

        if (!clienteId) {
            setErro(
                "Selecione um cliente."
            );
            return;
        }

        const valorNumerico =
            converterValor(valor);

        if (
            !Number.isFinite(valorNumerico) ||
            valorNumerico <= 0
        ) {
            setErro(
                "Informe um valor válido."
            );
            return;
        }

        if (valorNumerico < 1000) {
            setErro(
                "O valor mínimo para o Kilape é de 1.000 Kz."
            );
            return;
        }

        try {

            setEnviando(true);

            let resposta;

            if (modoEdicao) {

                resposta =
                    await API_URLFetch(
                        `${API_URL}/kilapes/${kilapeEditando.id}`,
                        {
                            method: "PUT",

                            body: JSON.stringify({
                                cliente_id:
                                    Number(
                                        clienteId
                                    ),

                                valor:
                                    valorNumerico,

                                observacao:
                                    observacao.trim()
                            })
                        }
                    );

            } else {

                resposta =
                    await API_URLFetch(
                        `${API_URL}/kilapes`,
                        {
                            method: "POST",

                            body: JSON.stringify({
                                cliente_id:
                                    Number(
                                        clienteId
                                    ),

                                valor:
                                    valorNumerico,

                                observacao:
                                    observacao.trim(),

                                prazo_dias:
                                    PRAZO_DIAS
                            })
                        }
                    );
            }

            const dados =
                await lerResposta(
                    resposta
                );

            if (!resposta.ok) {
                throw new Error(
                    obterMensagemErro(
                        dados,
                        resposta.status
                    )
                );
            }

            if (modoEdicao) {

                setSucesso(
                    "Kilape actualizado com sucesso."
                );

            } else {

                setSucesso(
                    `Kilape de ${formatarMoeda(
                        valorNumerico
                    )} criado com sucesso.`
                );
            }

            setMostrarFormulario(false);

            limparFormulario();

            await carregarKilapes();

        } catch (error) {

            console.error(
                "ERRO AO SALVAR KILAPE:",
                error
            );

            setErro(
                error?.message ||
                "Não foi possível salvar o Kilape."
            );

        } finally {

            setEnviando(false);

        }
    }

    // =================================================
    // ABRIR MODAL DE AÇÃO
    // =================================================

    function abrirModalAcao(tipo, kilape) {

        setErro("");
        setSucesso("");

        setMotivoRecusa("");

        setModalAcao({
            tipo,
            kilape
        });
    }

    // =================================================
    // FECHAR MODAL DE AÇÃO
    // =================================================

    function fecharModalAcao() {

        if (processandoId) {
            return;
        }

        setModalAcao(null);
        setMotivoRecusa("");
    }

    // =================================================
    // ELIMINAR
    // =================================================

    async function eliminarKilape() {

        if (!confirmarEliminacao) {
            return;
        }

        const id =
            confirmarEliminacao.id;

        try {

            setProcessandoId(id);

            setErro("");
            setSucesso("");

            const resposta =
                await API_URLFetch(
                    `${API_URL}/kilapes/${id}`,
                    {
                        method: "DELETE"
                    }
                );

            const dados =
                await lerResposta(
                    resposta
                );

            if (!resposta.ok) {
                throw new Error(
                    obterMensagemErro(
                        dados,
                        resposta.status
                    )
                );
            }

            setConfirmarEliminacao(null);

            setSucesso(
                "Kilape eliminado com sucesso."
            );

            await carregarKilapes();

        } catch (error) {

            console.error(
                "ERRO AO ELIMINAR KILAPE:",
                error
            );

            setErro(
                error?.message ||
                "Não foi possível eliminar o Kilape."
            );

        } finally {

            setProcessandoId(null);

        }
    }

    // =================================================
    // APROVAR
    // =================================================

    async function aprovarKilape(id) {

        try {

            setProcessandoId(id);
            setErro("");
            setSucesso("");

            const resposta =
                await API_URLFetch(
                    `${API_URL}/kilapes/${id}/aprovar`,
                    {
                        method: "PUT"
                    }
                );

            const dados =
                await lerResposta(
                    resposta
                );

            if (!resposta.ok) {
                throw new Error(
                    obterMensagemErro(
                        dados,
                        resposta.status
                    )
                );
            }

            setModalAcao(null);

            setSucesso(
                "Kilape aprovado com sucesso."
            );

            await carregarKilapes();

        } catch (error) {

            console.error(
                "ERRO AO APROVAR KILAPE:",
                error
            );

            setErro(
                error?.message ||
                "Erro ao aprovar Kilape."
            );

        } finally {

            setProcessandoId(null);

        }
    }

    // =================================================
    // RECUSAR
    // =================================================

    async function recusarKilape(id) {

        const motivo =
            motivoRecusa.trim();

        if (!motivo) {

            setErro(
                "Digite o motivo da recusa."
            );

            return;
        }

        try {

            setProcessandoId(id);

            setErro("");
            setSucesso("");

            const resposta =
                await API_URLFetch(
                    `${API_URL}/kilapes/${id}/recusar`,
                    {
                        method: "PUT",

                        body: JSON.stringify({
                            observacao:
                                motivo
                        })
                    }
                );

            const dados =
                await lerResposta(
                    resposta
                );

            if (!resposta.ok) {
                throw new Error(
                    obterMensagemErro(
                        dados,
                        resposta.status
                    )
                );
            }

            setModalAcao(null);
            setMotivoRecusa("");

            setSucesso(
                "Kilape recusado com sucesso."
            );

            await carregarKilapes();

        } catch (error) {

            console.error(
                "ERRO AO RECUSAR KILAPE:",
                error
            );

            setErro(
                error?.message ||
                "Erro ao recusar Kilape."
            );

        } finally {

            setProcessandoId(null);

        }
    }

    // =================================================
    // PAGAR
    // =================================================

    async function pagarKilape(id) {

        try {

            setProcessandoId(id);
            setErro("");
            setSucesso("");

            const resposta =
                await API_URLFetch(
                    `${API_URL}/kilapes/${id}/pagar`,
                    {
                        method: "PUT"
                    }
                );

            const dados =
                await lerResposta(
                    resposta
                );

            if (!resposta.ok) {
                throw new Error(
                    obterMensagemErro(
                        dados,
                        resposta.status
                    )
                );
            }

            setModalAcao(null);

            setSucesso(
                "Pagamento registado com sucesso."
            );

            await carregarKilapes();

        } catch (error) {

            console.error(
                "ERRO AO REGISTRAR PAGAMENTO:",
                error
            );

            setErro(
                error?.message ||
                "Erro ao registrar pagamento."
            );

        } finally {

            setProcessandoId(null);

        }
    }

    // =================================================
    // CONFIRMAR AÇÃO DO MODAL
    // =================================================

    function confirmarAcaoModal() {

        if (!modalAcao?.kilape) {
            return;
        }

        const id =
            modalAcao.kilape.id;

        if (modalAcao.tipo === "aprovar") {
            aprovarKilape(id);
            return;
        }

        if (modalAcao.tipo === "recusar") {
            recusarKilape(id);
            return;
        }

        if (modalAcao.tipo === "pagar") {
            pagarKilape(id);
            return;
        }
    }

    // =================================================
    // ESTATÍSTICAS
    // =================================================

    const totalSolicitado =
        useMemo(() => {

            return kilapes.reduce(
                (total, kilape) =>
                    total +
                    Number(
                        kilape.valor || 0
                    ),
                0
            );

        }, [kilapes]);

    const pendentes =
        useMemo(() => {

            return kilapes.filter(
                (kilape) =>
                    normalizarStatus(
                        kilape.status
                    ) === "pendente"
            ).length;

        }, [kilapes]);

    const aprovados =
        useMemo(() => {

            return kilapes.filter(
                (kilape) =>
                    normalizarStatus(
                        kilape.status
                    ) === "aprovado"
            ).length;

        }, [kilapes]);

    const pagos =
        useMemo(() => {

            return kilapes.filter(
                (kilape) =>
                    normalizarStatus(
                        kilape.status
                    ) === "pago"
            ).length;

        }, [kilapes]);

    // =================================================
    // INFORMAÇÕES DO MODAL
    // =================================================

    const modalTitulo =
        modalAcao?.tipo === "aprovar"
            ? "Aprovar Kilape"
            : modalAcao?.tipo === "recusar"
                ? "Recusar Kilape"
                : modalAcao?.tipo === "pagar"
                    ? "Registrar pagamento"
                    : "";

    const modalDescricao =
        modalAcao?.tipo === "aprovar"
            ? "Tem certeza que deseja aprovar este Kilape?"
            : modalAcao?.tipo === "recusar"
                ? "Informe o motivo pelo qual este Kilape será recusado."
                : modalAcao?.tipo === "pagar"
                    ? "Confirme que o pagamento deste Kilape foi recebido."
                    : "";

    const modalIcone =
        modalAcao?.tipo === "aprovar"
            ? <FaCheckCircle size={24} />
            : modalAcao?.tipo === "recusar"
                ? <FaBan size={24} />
                : <FaCreditCard size={24} />;

    const modalClasseIcone =
        modalAcao?.tipo === "aprovar"
            ? "bg-emerald-100 text-emerald-600"
            : modalAcao?.tipo === "recusar"
                ? "bg-orange-100 text-orange-600"
                : "bg-blue-100 text-blue-600";

    const modalClasseBotao =
        modalAcao?.tipo === "aprovar"
            ? "bg-emerald-600 hover:bg-emerald-700"
            : modalAcao?.tipo === "recusar"
                ? "bg-orange-600 hover:bg-orange-700"
                : "bg-blue-600 hover:bg-blue-700";

    const modalTextoBotao =
        modalAcao?.tipo === "aprovar"
            ? "Sim, aprovar"
            : modalAcao?.tipo === "recusar"
                ? "Sim, recusar"
                : "Confirmar pagamento";

    // =================================================
    // RENDER
    // =================================================

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

            <div className="mx-auto max-w-7xl">

                {/* ================================================= */}
                {/* CABEÇALHO */}
                {/* ================================================= */}

                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div className="flex items-center gap-3">

                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg">
                            <FaMoneyBillWave size={22} />
                        </div>

                        <div>

                            <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">
                                Gestão de Kilapes
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Crie, edite, aprove, pague e elimine Kilapes.
                            </p>

                        </div>

                    </div>

                    <button
                        type="button"
                        onClick={abrirFormulario}
                        className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
                    >
                        <FaPlus />
                        Novo Kilape
                    </button>

                </div>

                {/* ================================================= */}
                {/* ERRO */}
                {/* ================================================= */}

                {erro && (
                    <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">

                        <div className="flex items-start gap-3">

                            <FaExclamationTriangle className="mt-0.5 shrink-0" />

                            <span>{erro}</span>

                        </div>

                        <button
                            type="button"
                            onClick={() => setErro("")}
                            className="text-red-500 hover:text-red-700"
                        >
                            <FaTimes />
                        </button>

                    </div>
                )}

                {/* ================================================= */}
                {/* SUCESSO */}
                {/* ================================================= */}

                {sucesso && (
                    <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">

                        <div className="flex items-start gap-3">

                            <FaCheckCircle />

                            <span>{sucesso}</span>

                        </div>

                        <button
                            type="button"
                            onClick={() => setSucesso("")}
                            className="text-emerald-500 hover:text-emerald-700"
                        >
                            <FaTimes />
                        </button>

                    </div>
                )}

                {/* ================================================= */}
                {/* AVISO */}
                {/* ================================================= */}

                <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">

                    <div className="flex items-start gap-4">

                        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                            <FaInfoCircle />
                        </div>

                        <div>

                            <h2 className="font-bold text-blue-900">
                                Gestão administrativa
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-blue-800">
                                O administrador pode criar,
                                editar, eliminar, aprovar,
                                recusar e registrar o pagamento
                                dos Kilapes.
                            </p>

                        </div>

                    </div>

                </div>

                {/* ================================================= */}
                {/* ESTATÍSTICAS */}
                {/* ================================================= */}

                <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm font-medium text-slate-500">
                                    Total em Kilapes
                                </p>

                                <p className="mt-2 text-2xl font-black text-slate-950">
                                    {formatarMoeda(totalSolicitado)}
                                </p>

                            </div>

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                                <FaMoneyBillWave />
                            </div>

                        </div>

                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm font-medium text-slate-500">
                                    Pendentes
                                </p>

                                <p className="mt-2 text-2xl font-black text-slate-950">
                                    {pendentes}
                                </p>

                            </div>

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                                <FaClock />
                            </div>

                        </div>

                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm font-medium text-slate-500">
                                    Aprovados
                                </p>

                                <p className="mt-2 text-2xl font-black text-slate-950">
                                    {aprovados}
                                </p>

                            </div>

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                                <FaCheckCircle />
                            </div>

                        </div>

                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm font-medium text-slate-500">
                                    Pagos
                                </p>

                                <p className="mt-2 text-2xl font-black text-slate-950">
                                    {pagos}
                                </p>

                            </div>

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                                <FaCreditCard />
                            </div>

                        </div>

                    </div>

                </div>

                {/* ================================================= */}
                {/* FILTROS */}
                {/* ================================================= */}

                <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

                    <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">

                        <div className="relative">

                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                            <input
                                type="text"
                                value={pesquisaKilape}
                                onChange={(event) =>
                                    setPesquisaKilape(
                                        event.target.value
                                    )
                                }
                                placeholder="Pesquisar por cliente, telefone ou ID..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 outline-none focus:border-slate-900 focus:bg-white"
                            />

                        </div>

                        <div className="relative">

                            <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                            <select
                                value={filtroStatus}
                                onChange={(event) =>
                                    setFiltroStatus(
                                        event.target.value
                                    )
                                }
                                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 outline-none focus:border-slate-900"
                            >
                                <option value="todos">
                                    Todos os estados
                                </option>

                                <option value="pendente">
                                    Pendentes
                                </option>

                                <option value="aprovado">
                                    Aprovados
                                </option>

                                <option value="pago">
                                    Pagos
                                </option>

                                <option value="atrasado">
                                    Atrasados
                                </option>

                                <option value="recusado">
                                    Recusados
                                </option>

                            </select>

                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setPesquisaKilape("");
                                setFiltroStatus("todos");
                            }}
                            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                        >
                            Limpar filtros
                        </button>

                    </div>

                </div>

                {/* ================================================= */}
                {/* HISTÓRICO */}
                {/* ================================================= */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="flex items-center justify-between border-b border-slate-100 p-5">

                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                                <FaHistory />
                            </div>

                            <div>

                                <h2 className="font-black text-slate-900">
                                    Kilapes dos clientes
                                </h2>

                                <p className="text-xs text-slate-500">
                                    {kilapesFiltrados.length} resultado(s)
                                </p>

                            </div>

                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                carregarClientes();
                                carregarKilapes();
                            }}
                            disabled={
                                carregando ||
                                carregandoClientes
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                            title="Actualizar"
                        >
                            <FaSyncAlt
                                className={
                                    carregando ||
                                    carregandoClientes
                                        ? "animate-spin"
                                        : ""
                                }
                            />
                        </button>

                    </div>

                    {/* ================================================= */}
                    {/* LOADING */}
                    {/* ================================================= */}

                    {carregando ? (

                        <div className="p-12 text-center">

                            <FaSyncAlt className="mx-auto animate-spin text-2xl text-slate-400" />

                            <p className="mt-4 text-sm text-slate-500">
                                A carregar Kilapes...
                            </p>

                        </div>

                    ) : kilapesFiltrados.length === 0 ? (

                        <div className="p-12 text-center">

                            <FaMoneyBillWave className="mx-auto text-4xl text-slate-300" />

                            <h3 className="mt-4 font-bold text-slate-800">
                                Nenhum Kilape encontrado
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                                Não existem Kilapes para os filtros selecionados.
                            </p>

                            <button
                                type="button"
                                onClick={abrirFormulario}
                                className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
                            >
                                <FaPlus className="mr-2 inline" />
                                Novo Kilape
                            </button>

                        </div>

                    ) : (

                        <div className="divide-y divide-slate-100">

                            {kilapesFiltrados.map(
                                (kilape) => {

                                    const status =
                                        obterStatusInfo(
                                            kilape.status
                                        );

                                    const statusNormalizado =
                                        normalizarStatus(
                                            kilape.status
                                        );

                                    const processando =
                                        processandoId ===
                                        kilape.id;

                                    return (

                                        <div
                                            key={
                                                String(
                                                    kilape.id
                                                )
                                            }
                                            className="p-5 transition hover:bg-slate-50"
                                        >

                                            {/* ================================================= */}
                                            {/* TOPO */}
                                            {/* ================================================= */}

                                            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">

                                                <div className="flex items-start gap-4">

                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-700">
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

                                                        <div className="flex flex-wrap items-center gap-2">

                                                            <p className="font-black text-slate-900">
                                                                {kilape.cliente_nome}
                                                            </p>

                                                            <span
                                                                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${status.classe}`}
                                                            >
                                                                {status.icone}
                                                                {status.texto}
                                                            </span>

                                                        </div>

                                                        <p className="mt-1 text-sm text-slate-500">
                                                            Kilape #{kilape.id}
                                                        </p>

                                                        {kilape.cliente_telefone && (
                                                            <p className="mt-1 text-xs text-slate-400">
                                                                {kilape.cliente_telefone}
                                                            </p>
                                                        )}

                                                        {kilape.cliente_email && (
                                                            <p className="mt-1 text-xs text-slate-400">
                                                                {kilape.cliente_email}
                                                            </p>
                                                        )}

                                                    </div>

                                                </div>

                                                {/* VALOR */}

                                                <div className="xl:text-right">

                                                    <p className="text-xs text-slate-400">
                                                        Valor
                                                    </p>

                                                    <p className="mt-1 text-2xl font-black text-slate-950">
                                                        {formatarMoeda(
                                                            kilape.valor
                                                        )}
                                                    </p>

                                                </div>

                                            </div>

                                            {/* ================================================= */}
                                            {/* INFORMAÇÕES */}
                                            {/* ================================================= */}

                                            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                                                <div className="rounded-xl bg-slate-50 p-3">

                                                    <p className="text-xs text-slate-400">
                                                        Prazo
                                                    </p>

                                                    <p className="mt-1 font-bold text-slate-800">
                                                        {kilape.prazo_dias || PRAZO_DIAS} dias
                                                    </p>

                                                </div>

                                                <div className="rounded-xl bg-slate-50 p-3">

                                                    <p className="text-xs text-slate-400">
                                                        Solicitação
                                                    </p>

                                                    <p className="mt-1 font-bold text-slate-800">
                                                        {formatarData(
                                                            kilape.data_solicitacao
                                                        )}
                                                    </p>

                                                </div>

                                                <div className="rounded-xl bg-slate-50 p-3">

                                                    <p className="text-xs text-slate-400">
                                                        Vencimento
                                                    </p>

                                                    <p className="mt-1 font-bold text-slate-800">
                                                        {formatarData(
                                                            kilape.data_vencimento
                                                        )}
                                                    </p>

                                                </div>

                                                <div className="rounded-xl bg-slate-50 p-3">

                                                    <p className="text-xs text-slate-400">
                                                        ID do cliente
                                                    </p>

                                                    <p className="mt-1 font-bold text-slate-800">
                                                        #{kilape.cliente_id}
                                                    </p>

                                                </div>

                                            </div>

                                            {/* ================================================= */}
                                            {/* OBSERVAÇÃO */}
                                            {/* ================================================= */}

                                            {kilape.observacao && (
                                                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">

                                                    <strong className="text-slate-800">
                                                        Observação:
                                                    </strong>{" "}

                                                    {kilape.observacao}

                                                </div>
                                            )}

                                            {/* ================================================= */}
                                            {/* BOTÕES */}
                                            {/* ================================================= */}

                                            <div className="mt-5 flex flex-wrap gap-2">

                                                {/* EDITAR */}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        abrirEdicao(
                                                            kilape
                                                        )
                                                    }
                                                    disabled={
                                                        processando
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                                                >
                                                    <FaEdit />
                                                    Editar
                                                </button>

                                                {/* ELIMINAR */}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setConfirmarEliminacao(
                                                            kilape
                                                        )
                                                    }
                                                    disabled={
                                                        processando
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                                                >
                                                    <FaTrash />
                                                    Eliminar
                                                </button>

                                                {/* APROVAR */}

                                                {statusNormalizado ===
                                                    "pendente" && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            abrirModalAcao(
                                                                "aprovar",
                                                                kilape
                                                            )
                                                        }
                                                        disabled={
                                                            processando
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                                                    >
                                                        {processando ? (
                                                            <FaSyncAlt className="animate-spin" />
                                                        ) : (
                                                            <FaCheck />
                                                        )}
                                                        Aprovar
                                                    </button>
                                                )}

                                                {/* RECUSAR */}

                                                {statusNormalizado ===
                                                    "pendente" && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            abrirModalAcao(
                                                                "recusar",
                                                                kilape
                                                            )
                                                        }
                                                        disabled={
                                                            processando
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-xs font-bold text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                                                    >
                                                        <FaBan />
                                                        Recusar
                                                    </button>
                                                )}

                                                {/* PAGAR */}

                                                {(
                                                    statusNormalizado ===
                                                        "aprovado" ||
                                                    statusNormalizado ===
                                                        "atrasado"
                                                ) && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            abrirModalAcao(
                                                                "pagar",
                                                                kilape
                                                            )
                                                        }
                                                        disabled={
                                                            processando
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                                                    >
                                                        {processando ? (
                                                            <FaSyncAlt className="animate-spin" />
                                                        ) : (
                                                            <FaCreditCard />
                                                        )}
                                                        Registrar pagamento
                                                    </button>
                                                )}

                                            </div>

                                        </div>

                                    );
                                }
                            )}

                        </div>

                    )}

                </div>

            </div>

            {/* ===================================================== */}
            {/* MODAL CRIAR / EDITAR */}
            {/* ===================================================== */}

            {mostrarFormulario && (

                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            fecharFormulario();
                        }

                    }}
                >

                    <div className="my-8 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">

                        <div className="flex items-center justify-between bg-slate-950 px-5 py-5 text-white">

                            <div className="flex items-center gap-3">

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">

                                    {modoEdicao ? (
                                        <FaEdit />
                                    ) : (
                                        <FaMoneyBillWave />
                                    )}

                                </div>

                                <div>

                                    <h2 className="font-black">

                                        {modoEdicao
                                            ? "Editar Kilape"
                                            : "Novo Kilape"}

                                    </h2>

                                    <p className="text-xs text-slate-400">

                                        {modoEdicao
                                            ? `Editar Kilape #${kilapeEditando?.id}`
                                            : "Atribuir Kilape a um cliente"}

                                    </p>

                                </div>

                            </div>

                            <button
                                type="button"
                                onClick={fecharFormulario}
                                disabled={enviando}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50"
                            >
                                <FaTimes />
                            </button>

                        </div>

                        <form
                            onSubmit={salvarKilape}
                            className="p-5"
                        >

                            {/* CLIENTE */}

                            <div>

                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Cliente
                                </label>

                                <div className="relative">

                                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                                    <input
                                        type="text"
                                        value={pesquisaCliente}
                                        onChange={(event) =>
                                            setPesquisaCliente(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Pesquisar cliente..."
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 outline-none transition focus:border-slate-900 focus:bg-white"
                                    />

                                </div>

                                <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200">

                                    {carregandoClientes ? (

                                        <div className="p-5 text-center text-sm text-slate-500">

                                            <FaSyncAlt className="mx-auto animate-spin" />

                                            <p className="mt-2">
                                                A carregar clientes...
                                            </p>

                                        </div>

                                    ) : clientesFiltrados.length === 0 ? (

                                        <div className="p-5 text-center text-sm text-slate-500">
                                            Nenhum cliente encontrado.
                                        </div>

                                    ) : (

                                        clientesFiltrados.map(
                                            (cliente) => (

                                                <button
                                                    key={
                                                        String(
                                                            cliente.id
                                                        )
                                                    }
                                                    type="button"
                                                    onClick={() => {

                                                        setClienteId(
                                                            String(
                                                                cliente.id
                                                            )
                                                        );

                                                        setErro("");

                                                    }}
                                                    className={`w-full border-b border-slate-100 p-3 text-left transition last:border-b-0 hover:bg-slate-50 ${
                                                        String(
                                                            clienteId
                                                        ) ===
                                                        String(
                                                            cliente.id
                                                        )
                                                            ? "bg-blue-50"
                                                            : ""
                                                    }`}
                                                >

                                                    <div className="flex items-center gap-3">

                                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                                                            <FaUser />
                                                        </div>

                                                        <div className="min-w-0 flex-1">

                                                            <p className="truncate font-bold text-slate-800">
                                                                {cliente.nome}
                                                            </p>

                                                            <p className="truncate text-xs text-slate-500">
                                                                {cliente.telefone ||
                                                                    cliente.email ||
                                                                    "Sem contacto"}
                                                            </p>

                                                        </div>

                                                        {String(
                                                            clienteId
                                                        ) ===
                                                            String(
                                                                cliente.id
                                                            ) && (
                                                            <FaCheckCircle className="text-blue-600" />
                                                        )}

                                                    </div>

                                                </button>

                                            )
                                        )

                                    )}

                                </div>

                            </div>

                            {/* CLIENTE SELECIONADO */}

                            {clienteSelecionado && (

                                <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-4">

                                    <div className="flex items-center gap-3">

                                        <FaUser className="text-blue-600" />

                                        <div>

                                            <p className="text-xs text-blue-600">
                                                Cliente selecionado
                                            </p>

                                            <p className="font-black text-blue-900">
                                                {clienteSelecionado.nome}
                                            </p>

                                        </div>

                                    </div>

                                </div>

                            )}

                            {/* VALOR */}

                            <div className="mt-5">

                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Valor do Kilape
                                </label>

                                <div className="relative">

                                    <FaMoneyBillWave className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={valor}
                                        onChange={handleValorChange}
                                        placeholder="Ex.: 50.000"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 pr-14 text-lg font-bold outline-none transition focus:border-slate-900 focus:bg-white"
                                    />

                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                                        Kz
                                    </span>

                                </div>

                                <p className="mt-2 text-xs text-slate-400">
                                    Valor mínimo: 1.000 Kz
                                </p>

                            </div>

                            {/* OBSERVAÇÃO */}

                            <div className="mt-5">

                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Observação
                                </label>

                                <textarea
                                    value={observacao}
                                    onChange={(event) =>
                                        setObservacao(
                                            event.target.value
                                        )
                                    }
                                    rows={3}
                                    placeholder="Digite uma observação opcional..."
                                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-900 focus:bg-white"
                                />

                            </div>

                            {/* PRAZO */}

                            <div className="mt-5">

                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Prazo de pagamento
                                </label>

                                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">

                                    <div className="flex items-center gap-3">

                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                                            <FaCalendarAlt />
                                        </div>

                                        <div>

                                            <p className="font-black text-slate-900">
                                                3 semanas
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                {PRAZO_DIAS} dias
                                            </p>

                                        </div>

                                    </div>

                                    <FaLock className="text-slate-400" />

                                </div>

                            </div>

                            {/* VENCIMENTO */}

                            {!modoEdicao && (

                                <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">

                                    <div className="flex items-center gap-3">

                                        <FaClock className="text-blue-600" />

                                        <div>

                                            <p className="text-xs font-medium text-blue-600">
                                                Vencimento previsto
                                            </p>

                                            <p className="mt-1 font-black text-blue-900">
                                                {formatarData(
                                                    dataVencimentoPrevista
                                                )}
                                            </p>

                                        </div>

                                    </div>

                                </div>

                            )}

                            {/* AVISO */}

                            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">

                                <strong className="text-slate-700">
                                    Atenção:
                                </strong>{" "}

                                {modoEdicao
                                    ? "As alterações serão aplicadas ao Kilape selecionado."
                                    : "O Kilape será criado para o cliente selecionado com prazo de 21 dias."}

                            </div>

                            {/* BOTÕES */}

                            <div className="mt-6 flex gap-3">

                                <button
                                    type="button"
                                    onClick={fecharFormulario}
                                    disabled={enviando}
                                    className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        enviando ||
                                        !clienteId ||
                                        !valor
                                    }
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >

                                    {enviando ? (

                                        <>
                                            <FaSyncAlt className="animate-spin" />

                                            {modoEdicao
                                                ? "A actualizar..."
                                                : "A criar..."}

                                        </>

                                    ) : (

                                        <>
                                            {modoEdicao ? (
                                                <FaSave />
                                            ) : (
                                                <FaCheckCircle />
                                            )}

                                            {modoEdicao
                                                ? "Guardar alterações"
                                                : "Criar Kilape"}

                                        </>

                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

            {/* ===================================================== */}
            {/* MODAL ELIMINAR */}
            {/* ===================================================== */}

            {confirmarEliminacao && (

                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                >

                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">

                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">

                            <FaTrash size={22} />

                        </div>

                        <h2 className="mt-5 text-xl font-black text-slate-900">
                            Eliminar Kilape?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Tem certeza que deseja eliminar o Kilape{" "}
                            <strong>
                                #{confirmarEliminacao.id}
                            </strong>{" "}
                            de{" "}
                            <strong>
                                {confirmarEliminacao.cliente_nome}
                            </strong>
                            ?
                        </p>

                        <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">

                            <p>
                                Valor:{" "}
                                <strong>
                                    {formatarMoeda(
                                        confirmarEliminacao.valor
                                    )}
                                </strong>
                            </p>

                            <p className="mt-1">
                                Esta operação não poderá ser desfeita.
                            </p>

                        </div>

                        <div className="mt-6 flex gap-3">

                            <button
                                type="button"
                                onClick={() =>
                                    setConfirmarEliminacao(
                                        null
                                    )
                                }
                                disabled={
                                    processandoId ===
                                    confirmarEliminacao.id
                                }
                                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={eliminarKilape}
                                disabled={
                                    processandoId ===
                                    confirmarEliminacao.id
                                }
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                            >

                                {processandoId ===
                                confirmarEliminacao.id ? (
                                    <>
                                        <FaSyncAlt className="animate-spin" />
                                        A eliminar...
                                    </>
                                ) : (
                                    <>
                                        <FaTrash />
                                        Eliminar
                                    </>
                                )}

                            </button>

                        </div>

                    </div>

                </div>

            )}

            {/* ===================================================== */}
            {/* MODAL APROVAR / RECUSAR / PAGAR */}
            {/* ===================================================== */}

            {modalAcao && (

                <div
                    className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            fecharModalAcao();
                        }

                    }}
                >

                    <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

                        {/* CABEÇALHO */}

                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

                            <div className="flex items-center gap-3">

                                <div
                                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${modalClasseIcone}`}
                                >
                                    {modalIcone}
                                </div>

                                <div>

                                    <h2 className="text-lg font-black text-slate-900">
                                        {modalTitulo}
                                    </h2>

                                    <p className="text-xs text-slate-500">
                                        Kilape #{modalAcao.kilape.id}
                                    </p>

                                </div>

                            </div>

                            <button
                                type="button"
                                onClick={fecharModalAcao}
                                disabled={
                                    processandoId ===
                                    modalAcao.kilape.id
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                            >
                                <FaTimes />
                            </button>

                        </div>

                        {/* CONTEÚDO */}

                        <div className="p-6">

                            <p className="text-sm leading-6 text-slate-600">
                                {modalDescricao}
                            </p>

                            {/* DADOS DO KILAPE */}

                            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">

                                <div className="flex items-center gap-3">

                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
                                        <FaUser />
                                    </div>

                                    <div className="min-w-0 flex-1">

                                        <p className="truncate font-black text-slate-900">
                                            {modalAcao.kilape.cliente_nome}
                                        </p>

                                        <p className="text-xs text-slate-500">
                                            Kilape #{modalAcao.kilape.id}
                                        </p>

                                    </div>

                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3">

                                    <div className="rounded-xl bg-white p-3">

                                        <p className="text-xs text-slate-400">
                                            Valor
                                        </p>

                                        <p className="mt-1 font-black text-slate-900">
                                            {formatarMoeda(
                                                modalAcao.kilape.valor
                                            )}
                                        </p>

                                    </div>

                                    <div className="rounded-xl bg-white p-3">

                                        <p className="text-xs text-slate-400">
                                            Estado atual
                                        </p>

                                        <p className="mt-1 font-black text-slate-900">
                                            {
                                                obterStatusInfo(
                                                    modalAcao.kilape.status
                                                ).texto
                                            }
                                        </p>

                                    </div>

                                </div>

                            </div>

                            {/* MOTIVO DA RECUSA */}

                            {modalAcao.tipo === "recusar" && (

                                <div className="mt-5">

                                    <label className="mb-2 block text-sm font-bold text-slate-700">
                                        Motivo da recusa
                                    </label>

                                    <textarea
                                        value={motivoRecusa}
                                        onChange={(event) => {
                                            setMotivoRecusa(
                                                event.target.value
                                            );

                                            if (
                                                erro ===
                                                "Digite o motivo da recusa."
                                            ) {
                                                setErro("");
                                            }
                                        }}
                                        rows={4}
                                        autoFocus
                                        placeholder="Digite o motivo da recusa..."
                                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:bg-white"
                                    />

                                    <p className="mt-2 text-xs text-slate-400">
                                        O motivo será enviado ao servidor e associado ao Kilape.
                                    </p>

                                </div>

                            )}

                            {/* AVISO */}

                            <div
                                className={`mt-5 rounded-xl p-4 text-sm ${
                                    modalAcao.tipo === "recusar"
                                        ? "bg-orange-50 text-orange-700"
                                        : modalAcao.tipo === "pagar"
                                            ? "bg-blue-50 text-blue-700"
                                            : "bg-emerald-50 text-emerald-700"
                                }`}
                            >

                                {modalAcao.tipo === "aprovar" && (
                                    <>
                                        <strong>Atenção:</strong>{" "}
                                        Depois da aprovação, o cliente poderá prosseguir de acordo com as regras do Kilape.
                                    </>
                                )}

                                {modalAcao.tipo === "recusar" && (
                                    <>
                                        <strong>Atenção:</strong>{" "}
                                        A recusa será registada juntamente com o motivo informado.
                                    </>
                                )}

                                {modalAcao.tipo === "pagar" && (
                                    <>
                                        <strong>Atenção:</strong>{" "}
                                        Ao confirmar, o estado do Kilape será alterado para pago.
                                    </>
                                )}

                            </div>

                            {/* BOTÕES */}

                            <div className="mt-6 flex gap-3">

                                <button
                                    type="button"
                                    onClick={fecharModalAcao}
                                    disabled={
                                        processandoId ===
                                        modalAcao.kilape.id
                                    }
                                    className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    onClick={confirmarAcaoModal}
                                    disabled={
                                        processandoId ===
                                        modalAcao.kilape.id ||
                                        (
                                            modalAcao.tipo ===
                                            "recusar" &&
                                            !motivoRecusa.trim()
                                        )
                                    }
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${modalClasseBotao}`}
                                >

                                    {processandoId ===
                                    modalAcao.kilape.id ? (

                                        <>
                                            <FaSyncAlt className="animate-spin" />

                                            A processar...
                                        </>

                                    ) : (

                                        <>
                                            {modalAcao.tipo ===
                                            "aprovar" && (
                                                <FaCheck />
                                            )}

                                            {modalAcao.tipo ===
                                            "recusar" && (
                                                <FaBan />
                                            )}

                                            {modalAcao.tipo ===
                                            "pagar" && (
                                                <FaCreditCard />
                                            )}

                                            {modalTextoBotao}
                                        </>

                                    )}

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}