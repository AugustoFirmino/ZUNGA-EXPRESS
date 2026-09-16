
import {
    useEffect,
    useState
} from "react";

import {
    FaCalendarAlt,
    FaClock,
    FaUser,
    FaCut,
    FaEdit,
    FaTrash,
    FaCheck,
    FaTimes,
    FaPlus,
    FaSearch,
    FaPhone,
    FaMoneyBillWave
} from "react-icons/fa";

// =====================================================
// APIs
// =====================================================

const API_AGENDAMENTOS =
    "http://localhost:5000/api/agendamentos";

const API_CLIENTES =
    "http://localhost:5000/api/clientes";

const API_SERVICOS =
    "http://localhost:5000/api/servicos";

// =====================================================
// COMPONENTE
// =====================================================

export default function Agendamentos() {

    // =================================================
    // FORMULÁRIO INICIAL
    // =================================================

    const formularioInicial = {
        cliente_id: "",
        servico_id: "",
        data: "",
        hora: "",
        observacao: "",
        status: "agendado"
    };

    // =================================================
    // ESTADOS
    // =================================================

    const [formulario, setFormulario] =
        useState(formularioInicial);

    const [clientes, setClientes] =
        useState([]);

    const [servicos, setServicos] =
        useState([]);

    const [agendamentos, setAgendamentos] =
        useState([]);

    const [editarId, setEditarId] =
        useState(null);

    const [mostrarFormulario, setMostrarFormulario] =
        useState(false);

    const [carregando, setCarregando] =
        useState(true);

    const [salvando, setSalvando] =
        useState(false);

    const [executandoAcao, setExecutandoAcao] =
        useState(false);

    const [pesquisa, setPesquisa] =
        useState("");

    const [filtroEstado, setFiltroEstado] =
        useState("Todos");

    const [mensagem, setMensagem] =
        useState(null);

    const [confirmacao, setConfirmacao] =
        useState(null);

    // =================================================
    // MENSAGEM
    // =================================================

    const mostrarMensagem = (
        tipo,
        texto
    ) => {

        setMensagem({
            tipo,
            texto
        });

        setTimeout(() => {
            setMensagem(null);
        }, 4000);
    };

    // =================================================
    // NORMALIZAR STATUS
    // =================================================

    const normalizarStatus = (status) => {

        const valor =
            String(status || "")
                .trim()
                .toLowerCase();

        if (
            valor === "agendado"
        ) {
            return "Agendado";
        }

        if (
            valor === "concluido" ||
            valor === "concluído"
        ) {
            return "Concluído";
        }

        if (
            valor === "cancelado"
        ) {
            return "Cancelado";
        }

        return "Agendado";
    };

    // =================================================
    // NORMALIZAR DADOS RECEBIDOS
    // =================================================

    const normalizarAgendamento = (item) => {

        return {
            ...item,

            id: item.id,

            cliente_id:
                item.cliente_id ??
                item.clienteId ??
                "",

            servico_id:
                item.servico_id ??
                item.servicoId ??
                "",

            cliente_nome:
                item.cliente_nome ??
                item.clienteNome ??
                item.nome_cliente ??
                "",

            cliente_telefone:
                item.cliente_telefone ??
                item.clienteTelefone ??
                item.telefone_cliente ??
                "",

            servico_nome:
                item.servico_nome ??
                item.servicoNome ??
                item.nome_servico ??
                "",

            preco:
                item.preco ??
                item.servico_preco ??
                item.valor ??
                0,

            data:
                item.data ??
                "",

            hora:
                item.hora ??
                "",

            observacao:
                item.observacao ??
                "",

            status:
                item.status ??
                "agendado"
        };
    };

    // =================================================
    // CARREGAR CLIENTES
    // =================================================

    const carregarClientes = async () => {

        try {

            const resposta =
                await fetch(API_CLIENTES);

            const dados =
                await resposta.json();

            if (!resposta.ok) {

                throw new Error(
                    dados.mensagem ||
                    dados.message ||
                    "Não foi possível carregar os clientes."
                );
            }

            const lista =
                Array.isArray(dados)
                    ? dados
                    : Array.isArray(dados.clientes)
                        ? dados.clientes
                        : [];

            setClientes(lista);

        } catch (erro) {

            console.error(
                "Erro ao carregar clientes:",
                erro
            );

            mostrarMensagem(
                "erro",
                erro.message
            );
        }
    };

    // =================================================
    // CARREGAR SERVIÇOS
    // =================================================

    const carregarServicos = async () => {

        try {

            const resposta =
                await fetch(API_SERVICOS);

            const dados =
                await resposta.json();

            if (!resposta.ok) {

                throw new Error(
                    dados.mensagem ||
                    dados.message ||
                    "Não foi possível carregar os serviços."
                );
            }

            const lista =
                Array.isArray(dados)
                    ? dados
                    : Array.isArray(dados.servicos)
                        ? dados.servicos
                        : [];

            setServicos(lista);

        } catch (erro) {

            console.error(
                "Erro ao carregar serviços:",
                erro
            );

            mostrarMensagem(
                "erro",
                erro.message
            );
        }
    };

    // =================================================
    // CARREGAR AGENDAMENTOS
    // =================================================

    const carregarAgendamentos = async () => {

        try {

            setCarregando(true);

            const resposta =
                await fetch(API_AGENDAMENTOS);

            const dados =
                await resposta.json();

            if (!resposta.ok) {

                throw new Error(
                    dados.mensagem ||
                    dados.message ||
                    "Não foi possível carregar os agendamentos."
                );
            }

            const listaBruta =
                Array.isArray(dados)
                    ? dados
                    : Array.isArray(dados.agendamentos)
                        ? dados.agendamentos
                        : [];

            const lista =
                listaBruta.map(
                    normalizarAgendamento
                );

            setAgendamentos(lista);

        } catch (erro) {

            console.error(
                "Erro ao carregar agendamentos:",
                erro
            );

            setAgendamentos([]);

            mostrarMensagem(
                "erro",
                erro.message
            );

        } finally {

            setCarregando(false);
        }
    };

    // =================================================
    // CARREGAR TUDO
    // =================================================

    useEffect(() => {

        const carregarDados = async () => {

            await Promise.all([
                carregarClientes(),
                carregarServicos(),
                carregarAgendamentos()
            ]);

        };

        carregarDados();

    }, []);

    // =================================================
    // ALTERAR FORMULÁRIO
    // =================================================

    const alterarFormulario = (e) => {

        const {
            name,
            value
        } = e.target;

        setFormulario(
            anterior => ({
                ...anterior,
                [name]: value
            })
        );
    };

    // =================================================
    // NOVO AGENDAMENTO
    // =================================================

    const novoAgendamento = () => {

        setFormulario({
            ...formularioInicial
        });

        setEditarId(null);

        setMostrarFormulario(true);
    };

    // =================================================
    // EDITAR AGENDAMENTO
    // =================================================

    const editarAgendamento = (
        agendamento
    ) => {

        setEditarId(
            agendamento.id
        );

        setFormulario({

            cliente_id:
                String(
                    agendamento.cliente_id || ""
                ),

            servico_id:
                String(
                    agendamento.servico_id || ""
                ),

            data:
                agendamento.data
                    ? String(
                        agendamento.data
                    ).substring(0, 10)
                    : "",

            hora:
                agendamento.hora
                    ? String(
                        agendamento.hora
                    ).substring(0, 5)
                    : "",

            observacao:
                agendamento.observacao || "",

            status:
                String(
                    agendamento.status ||
                    "agendado"
                )
                    .trim()
                    .toLowerCase()
        });

        setMostrarFormulario(true);
    };

    // =================================================
    // FECHAR FORMULÁRIO
    // =================================================

    const fecharFormulario = () => {

        setMostrarFormulario(false);

        setEditarId(null);

        setFormulario({
            ...formularioInicial
        });
    };

    // =================================================
    // SALVAR AGENDAMENTO
    // =================================================

    const salvarAgendamento = async (e) => {

        e.preventDefault();

        if (
            !formulario.cliente_id ||
            !formulario.servico_id ||
            !formulario.data ||
            !formulario.hora
        ) {

            mostrarMensagem(
                "erro",
                "Preencha todos os campos obrigatórios."
            );

            return;
        }

        try {

            setSalvando(true);

            const url =
                editarId
                    ? `${API_AGENDAMENTOS}/${editarId}`
                    : API_AGENDAMENTOS;

            const metodo =
                editarId
                    ? "PUT"
                    : "POST";

            const corpo = {

                cliente_id:
                    Number(
                        formulario.cliente_id
                    ),

                servico_id:
                    Number(
                        formulario.servico_id
                    ),

                data:
                    formulario.data,

                hora:
                    formulario.hora,

                observacao:
                    formulario.observacao.trim(),

                status:
                    formulario.status ||
                    "agendado"
            };

            const resposta =
                await fetch(
                    url,
                    {
                        method: metodo,

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                corpo
                            )
                    }
                );

            const dados =
                await resposta.json();

            if (!resposta.ok) {

                throw new Error(
                    dados.mensagem ||
                    dados.message ||
                    "Não foi possível salvar o agendamento."
                );
            }

            mostrarMensagem(
                "sucesso",
                editarId
                    ? "Agendamento atualizado com sucesso."
                    : "Agendamento criado com sucesso."
            );

            fecharFormulario();

            await carregarAgendamentos();

        } catch (erro) {

            console.error(
                "Erro ao salvar agendamento:",
                erro
            );

            mostrarMensagem(
                "erro",
                erro.message
            );

        } finally {

            setSalvando(false);
        }
    };

    // =================================================
    // CANCELAR
    // =================================================

    const cancelarAgendamento = (
        agendamento
    ) => {

        setConfirmacao({
            tipo: "cancelar",
            agendamento
        });
    };

    // =================================================
    // CONCLUIR
    // =================================================

    const concluirAgendamento = (
        agendamento
    ) => {

        setConfirmacao({
            tipo: "concluir",
            agendamento
        });
    };

    // =================================================
    // ELIMINAR
    // =================================================

    const eliminarAgendamento = (
        agendamento
    ) => {

        setConfirmacao({
            tipo: "eliminar",
            agendamento
        });
    };

    // =================================================
    // EXECUTAR CONFIRMAÇÃO
    // =================================================

    const executarConfirmacao =
        async () => {

            if (
                !confirmacao ||
                executandoAcao
            ) {
                return;
            }

            try {

                setExecutandoAcao(true);

                const agendamento =
                    confirmacao.agendamento;

                // =====================================
                // ELIMINAR
                // =====================================

                if (
                    confirmacao.tipo ===
                    "eliminar"
                ) {

                    const resposta =
                        await fetch(
                            `${API_AGENDAMENTOS}/${agendamento.id}`,
                            {
                                method: "DELETE"
                            }
                        );

                    const dados =
                        await resposta.json();

                    if (!resposta.ok) {

                        throw new Error(
                            dados.mensagem ||
                            dados.message ||
                            "Não foi possível eliminar o agendamento."
                        );
                    }

                    mostrarMensagem(
                        "sucesso",
                        "Agendamento eliminado com sucesso."
                    );

                    setConfirmacao(null);

                    await carregarAgendamentos();

                    return;
                }

                // =====================================
                // NOVO STATUS
                // =====================================

                let novoStatus =
                    "agendado";

                if (
                    confirmacao.tipo ===
                    "concluir"
                ) {

                    novoStatus =
                        "concluido";
                }

                if (
                    confirmacao.tipo ===
                    "cancelar"
                ) {

                    novoStatus =
                        "cancelado";
                }

                // =====================================
                // DATA
                // =====================================

                const data =
                    agendamento.data
                        ? String(
                            agendamento.data
                        ).substring(0, 10)
                        : "";

                // =====================================
                // HORA
                // =====================================

                const hora =
                    agendamento.hora
                        ? String(
                            agendamento.hora
                        ).substring(0, 5)
                        : "";

                // =====================================
                // ATUALIZAR
                // =====================================

                const resposta =
                    await fetch(
                        `${API_AGENDAMENTOS}/${agendamento.id}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    cliente_id:
                                        Number(
                                            agendamento.cliente_id
                                        ),

                                    servico_id:
                                        Number(
                                            agendamento.servico_id
                                        ),

                                    data,

                                    hora,

                                    observacao:
                                        agendamento.observacao ||
                                        "",

                                    status:
                                        novoStatus
                                })
                        }
                    );

                const dados =
                    await resposta.json();

                if (!resposta.ok) {

                    throw new Error(
                        dados.mensagem ||
                        dados.message ||
                        "Não foi possível atualizar o agendamento."
                    );
                }

                const mensagens = {

                    cancelar:
                        "Agendamento cancelado com sucesso.",

                    concluir:
                        "Agendamento concluído com sucesso."
                };

                mostrarMensagem(
                    "sucesso",
                    mensagens[
                        confirmacao.tipo
                    ]
                );

                setConfirmacao(null);

                await carregarAgendamentos();

            } catch (erro) {

                console.error(
                    "Erro na ação do agendamento:",
                    erro
                );

                mostrarMensagem(
                    "erro",
                    erro.message
                );

                setConfirmacao(null);

            } finally {

                setExecutandoAcao(false);
            }
        };

    // =================================================
    // FILTRAR AGENDAMENTOS
    // =================================================

    const agendamentosFiltrados =
        agendamentos.filter(
            (agendamento) => {

                const texto =
                    pesquisa
                        .toLowerCase()
                        .trim();

                const clienteNome =
                    String(
                        agendamento.cliente_nome ||
                        ""
                    ).toLowerCase();

                const servicoNome =
                    String(
                        agendamento.servico_nome ||
                        ""
                    ).toLowerCase();

                const telefone =
                    String(
                        agendamento.cliente_telefone ||
                        ""
                    ).toLowerCase();

                const correspondePesquisa =
                    !texto ||
                    clienteNome.includes(texto) ||
                    servicoNome.includes(texto) ||
                    telefone.includes(texto);

                const estado =
                    normalizarStatus(
                        agendamento.status
                    );

                const correspondeEstado =
                    filtroEstado === "Todos" ||
                    estado === filtroEstado;

                return (
                    correspondePesquisa &&
                    correspondeEstado
                );
            }
        );

    // =================================================
    // ESTATÍSTICAS
    // =================================================

    const total =
        agendamentos.length;

    const pendentes =
        agendamentos.filter(
            (agendamento) =>
                normalizarStatus(
                    agendamento.status
                ) === "Agendado"
        ).length;

    const concluidos =
        agendamentos.filter(
            (agendamento) =>
                normalizarStatus(
                    agendamento.status
                ) === "Concluído"
        ).length;

    const cancelados =
        agendamentos.filter(
            (agendamento) =>
                normalizarStatus(
                    agendamento.status
                ) === "Cancelado"
        ).length;

    // =================================================
    // FORMATAR DATA
    // =================================================

    const formatarData = (data) => {

        if (!data) {
            return "-";
        }

        const partes =
            String(data)
                .substring(0, 10)
                .split("-");

        if (
            partes.length !== 3
        ) {
            return data;
        }

        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    };

    // =================================================
    // FORMATAR HORA
    // =================================================

    const formatarHora = (hora) => {

        if (!hora) {
            return "-";
        }

        return String(hora)
            .substring(0, 5);
    };

    // =================================================
    // FORMATAR PREÇO
    // =================================================

    const formatarPreco = (preco) => {

        return Number(
            preco || 0
        ).toLocaleString(
            "pt-AO"
        );
    };

    // =================================================
    // ESTILO STATUS
    // =================================================

    const estiloEstado = (
        status
    ) => {

        const estado =
            normalizarStatus(
                status
            );

        const estilos = {

            Agendado:
                "bg-amber-50 text-amber-700 border-amber-200",

            "Concluído":
                "bg-emerald-50 text-emerald-700 border-emerald-200",

            Cancelado:
                "bg-red-50 text-red-700 border-red-200"
        };

        return (
            estilos[estado] ||
            "bg-gray-50 text-gray-600 border-gray-200"
        );
    };

    // =================================================
    // RENDER
    // =================================================

    return (

        <div className="
            min-h-screen
            bg-slate-50
            p-4
            md:p-6
            lg:p-8
        ">

            {/* ================================================= */}
            {/* MENSAGEM */}
            {/* ================================================= */}

            {mensagem && (

                <div
                    className={`
                        fixed
                        right-5
                        top-5
                        z-[100]
                        flex
                        items-center
                        gap-3
                        rounded-xl
                        border
                        px-5
                        py-4
                        shadow-xl
                        ${
                            mensagem.tipo ===
                            "sucesso"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-red-200 bg-red-50 text-red-700"
                        }
                    `}
                >

                    {mensagem.tipo ===
                    "sucesso"
                        ? <FaCheck />
                        : <FaTimes />
                    }

                    <span className="font-medium">
                        {mensagem.texto}
                    </span>

                </div>

            )}

            <div className="
                mx-auto
                max-w-7xl
            ">

                {/* ================================================= */}
                {/* HEADER */}
                {/* ================================================= */}

                <div className="
                    mb-8
                    flex
                    flex-col
                    gap-5
                    md:flex-row
                    md:items-center
                    md:justify-between
                ">

                    <div>

                        <div className="
                            mb-2
                            flex
                            items-center
                            gap-3
                        ">

                            <div className="
                                flex
                                h-12
                                w-12
                                items-center
                                justify-center
                                rounded-2xl
                                bg-slate-900
                                text-white
                                shadow-lg
                            ">

                                <FaCalendarAlt
                                    size={21}
                                />

                            </div>

                            <div>

                                <h1 className="
                                    text-2xl
                                    font-bold
                                    tracking-tight
                                    text-slate-900
                                    md:text-3xl
                                ">
                                    Agenda
                                </h1>

                                <p className="
                                    text-sm
                                    text-slate-500
                                ">
                                    Gestão dos agendamentos do salão
                                </p>

                            </div>

                        </div>

                    </div>

                    <button
                        onClick={
                            novoAgendamento
                        }
                        className="
                            inline-flex
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            bg-slate-900
                            px-5
                            py-3
                            text-sm
                            font-semibold
                            text-white
                            shadow-lg
                            shadow-slate-900/10
                            transition
                            hover:bg-slate-800
                            active:scale-[0.98]
                        "
                    >

                        <FaPlus />

                        Novo agendamento

                    </button>

                </div>

                {/* ================================================= */}
                {/* CARDS */}
                {/* ================================================= */}

                <div className="
                    mb-8
                    grid
                    grid-cols-1
                    gap-4
                    sm:grid-cols-2
                    lg:grid-cols-4
                ">

                    {/* TOTAL */}

                    <div className="
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        p-5
                        shadow-sm
                    ">

                        <div className="
                            flex
                            items-start
                            justify-between
                        ">

                            <div>

                                <p className="
                                    text-sm
                                    font-medium
                                    text-slate-500
                                ">
                                    Total
                                </p>

                                <p className="
                                    mt-2
                                    text-3xl
                                    font-bold
                                    text-slate-900
                                ">
                                    {total}
                                </p>

                            </div>

                            <div className="
                                flex
                                h-11
                                w-11
                                items-center
                                justify-center
                                rounded-xl
                                bg-slate-100
                                text-slate-700
                            ">

                                <FaCalendarAlt />

                            </div>

                        </div>

                    </div>

                    {/* AGENDADOS */}

                    <div className="
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        p-5
                        shadow-sm
                    ">

                        <div className="
                            flex
                            items-start
                            justify-between
                        ">

                            <div>

                                <p className="
                                    text-sm
                                    font-medium
                                    text-slate-500
                                ">
                                    Agendados
                                </p>

                                <p className="
                                    mt-2
                                    text-3xl
                                    font-bold
                                    text-amber-600
                                ">
                                    {pendentes}
                                </p>

                            </div>

                            <div className="
                                flex
                                h-11
                                w-11
                                items-center
                                justify-center
                                rounded-xl
                                bg-amber-50
                                text-amber-600
                            ">

                                <FaClock />

                            </div>

                        </div>

                    </div>

                    {/* CONCLUÍDOS */}

                    <div className="
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        p-5
                        shadow-sm
                    ">

                        <div className="
                            flex
                            items-start
                            justify-between
                        ">

                            <div>

                                <p className="
                                    text-sm
                                    font-medium
                                    text-slate-500
                                ">
                                    Concluídos
                                </p>

                                <p className="
                                    mt-2
                                    text-3xl
                                    font-bold
                                    text-emerald-600
                                ">
                                    {concluidos}
                                </p>

                            </div>

                            <div className="
                                flex
                                h-11
                                w-11
                                items-center
                                justify-center
                                rounded-xl
                                bg-emerald-50
                                text-emerald-600
                            ">

                                <FaCheck />

                            </div>

                        </div>

                    </div>

                    {/* CANCELADOS */}

                    <div className="
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        p-5
                        shadow-sm
                    ">

                        <div className="
                            flex
                            items-start
                            justify-between
                        ">

                            <div>

                                <p className="
                                    text-sm
                                    font-medium
                                    text-slate-500
                                ">
                                    Cancelados
                                </p>

                                <p className="
                                    mt-2
                                    text-3xl
                                    font-bold
                                    text-red-600
                                ">
                                    {cancelados}
                                </p>

                            </div>

                            <div className="
                                flex
                                h-11
                                w-11
                                items-center
                                justify-center
                                rounded-xl
                                bg-red-50
                                text-red-600
                            ">

                                <FaTimes />

                            </div>

                        </div>

                    </div>

                </div>

                {/* ================================================= */}
                {/* FILTROS */}
                {/* ================================================= */}

                <div className="
                    mb-5
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-4
                    shadow-sm
                ">

                    <div className="
                        flex
                        flex-col
                        gap-3
                        lg:flex-row
                    ">

                        <div className="
                            relative
                            flex-1
                        ">

                            <FaSearch
                                className="
                                    absolute
                                    left-4
                                    top-1/2
                                    -translate-y-1/2
                                    text-slate-400
                                "
                            />

                            <input
                                type="text"
                                value={pesquisa}
                                onChange={
                                    (e) =>
                                        setPesquisa(
                                            e.target.value
                                        )
                                }
                                placeholder="
                                    Pesquisar cliente,
                                    telefone ou serviço...
                                "
                                className="
                                    w-full
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-slate-50
                                    py-3
                                    pl-11
                                    pr-4
                                    text-sm
                                    outline-none
                                    transition
                                    focus:border-slate-400
                                    focus:bg-white
                                    focus:ring-4
                                    focus:ring-slate-100
                                "
                            />

                        </div>

                        <select
                            value={
                                filtroEstado
                            }
                            onChange={
                                (e) =>
                                    setFiltroEstado(
                                        e.target.value
                                    )
                            }
                            className="
                                rounded-xl
                                border
                                border-slate-200
                                bg-slate-50
                                px-4
                                py-3
                                text-sm
                                font-medium
                                text-slate-700
                                outline-none
                                focus:border-slate-400
                                focus:bg-white
                                focus:ring-4
                                focus:ring-slate-100
                            "
                        >

                            <option value="Todos">
                                Todos os estados
                            </option>

                            <option value="Agendado">
                                Agendados
                            </option>

                            <option value="Concluído">
                                Concluídos
                            </option>

                            <option value="Cancelado">
                                Cancelados
                            </option>

                        </select>

                    </div>

                </div>

                {/* ================================================= */}
                {/* TABELA */}
                {/* ================================================= */}

                <div className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    shadow-sm
                ">

                    <div className="
                        border-b
                        border-slate-100
                        px-5
                        py-4
                    ">

                        <h2 className="
                            font-bold
                            text-slate-900
                        ">
                            Próximos atendimentos
                        </h2>

                        <p className="
                            mt-1
                            text-xs
                            text-slate-500
                        ">
                            {agendamentosFiltrados.length}
                            {" "}
                            registros encontrados
                        </p>

                    </div>

                    {carregando ? (

                        <div className="
                            flex
                            min-h-[300px]
                            items-center
                            justify-center
                        ">

                            <div className="
                                text-center
                            ">

                                <div className="
                                    mx-auto
                                    mb-4
                                    h-10
                                    w-10
                                    animate-spin
                                    rounded-full
                                    border-4
                                    border-slate-200
                                    border-t-slate-800
                                " />

                                <p className="
                                    text-sm
                                    text-slate-500
                                ">
                                    Carregando agenda...
                                </p>

                            </div>

                        </div>

                    ) : agendamentosFiltrados.length === 0 ? (

                        <div className="
                            flex
                            min-h-[320px]
                            flex-col
                            items-center
                            justify-center
                            px-5
                            text-center
                        ">

                            <div className="
                                mb-4
                                flex
                                h-16
                                w-16
                                items-center
                                justify-center
                                rounded-2xl
                                bg-slate-100
                                text-slate-400
                            ">

                                <FaCalendarAlt
                                    size={25}
                                />

                            </div>

                            <h3 className="
                                font-semibold
                                text-slate-800
                            ">
                                Nenhum agendamento encontrado
                            </h3>

                            <p className="
                                mt-1
                                max-w-sm
                                text-sm
                                text-slate-500
                            ">
                                Crie um novo agendamento ou altere os filtros de pesquisa.
                            </p>

                            <button
                                onClick={
                                    novoAgendamento
                                }
                                className="
                                    mt-5
                                    inline-flex
                                    items-center
                                    gap-2
                                    rounded-xl
                                    bg-slate-900
                                    px-4
                                    py-2.5
                                    text-sm
                                    font-semibold
                                    text-white
                                    hover:bg-slate-800
                                "
                            >

                                <FaPlus />

                                Novo agendamento

                            </button>

                        </div>

                    ) : (

                        <div className="
                            overflow-x-auto
                        ">

                            <table className="
                                w-full
                                min-w-[1050px]
                            ">

                                <thead>

                                    <tr className="
                                        border-b
                                        border-slate-100
                                        bg-slate-50/70
                                    ">

                                        <th className="
                                            px-5
                                            py-4
                                            text-left
                                            text-xs
                                            font-semibold
                                            uppercase
                                            tracking-wider
                                            text-slate-500
                                        ">
                                            Cliente
                                        </th>

                                        <th className="
                                            px-5
                                            py-4
                                            text-left
                                            text-xs
                                            font-semibold
                                            uppercase
                                            tracking-wider
                                            text-slate-500
                                        ">
                                            Serviço
                                        </th>

                                        <th className="
                                            px-5
                                            py-4
                                            text-left
                                            text-xs
                                            font-semibold
                                            uppercase
                                            tracking-wider
                                            text-slate-500
                                        ">
                                            Data
                                        </th>

                                        <th className="
                                            px-5
                                            py-4
                                            text-left
                                            text-xs
                                            font-semibold
                                            uppercase
                                            tracking-wider
                                            text-slate-500
                                        ">
                                            Hora
                                        </th>

                                        <th className="
                                            px-5
                                            py-4
                                            text-left
                                            text-xs
                                            font-semibold
                                            uppercase
                                            tracking-wider
                                            text-slate-500
                                        ">
                                            Valor
                                        </th>

                                        <th className="
                                            px-5
                                            py-4
                                            text-left
                                            text-xs
                                            font-semibold
                                            uppercase
                                            tracking-wider
                                            text-slate-500
                                        ">
                                            Estado
                                        </th>

                                        <th className="
                                            px-5
                                            py-4
                                            text-right
                                            text-xs
                                            font-semibold
                                            uppercase
                                            tracking-wider
                                            text-slate-500
                                        ">
                                            Ações
                                        </th>

                                    </tr>

                                </thead>

                                <tbody className="
                                    divide-y
                                    divide-slate-100
                                ">

                                    {agendamentosFiltrados.map(
                                        (agendamento) => {

                                            const estado =
                                                normalizarStatus(
                                                    agendamento.status
                                                );

                                            return (

                                                <tr
                                                    key={
                                                        agendamento.id
                                                    }
                                                    className="
                                                        group
                                                        transition
                                                        hover:bg-slate-50/70
                                                    "
                                                >

                                                    {/* CLIENTE */}

                                                    <td className="
                                                        px-5
                                                        py-4
                                                    ">

                                                        <div className="
                                                            flex
                                                            items-center
                                                            gap-3
                                                        ">

                                                            <div className="
                                                                flex
                                                                h-10
                                                                w-10
                                                                shrink-0
                                                                items-center
                                                                justify-center
                                                                rounded-xl
                                                                bg-slate-100
                                                                text-slate-600
                                                            ">

                                                                <FaUser />

                                                            </div>

                                                            <div>

                                                                <p className="
                                                                    font-semibold
                                                                    text-slate-800
                                                                ">
                                                                    {
                                                                        agendamento.cliente_nome ||
                                                                        "-"
                                                                    }
                                                                </p>

                                                                <p className="
                                                                    mt-0.5
                                                                    flex
                                                                    items-center
                                                                    gap-1
                                                                    text-xs
                                                                    text-slate-500
                                                                ">

                                                                    <FaPhone
                                                                        size={9}
                                                                    />

                                                                    {
                                                                        agendamento.cliente_telefone ||
                                                                        "-"
                                                                    }

                                                                </p>

                                                            </div>

                                                        </div>

                                                    </td>

                                                    {/* SERVIÇO */}

                                                    <td className="
                                                        px-5
                                                        py-4
                                                    ">

                                                        <div className="
                                                            flex
                                                            items-center
                                                            gap-2
                                                        ">

                                                            <div className="
                                                                flex
                                                                h-8
                                                                w-8
                                                                items-center
                                                                justify-center
                                                                rounded-lg
                                                                bg-pink-50
                                                                text-pink-600
                                                            ">

                                                                <FaCut
                                                                    size={13}
                                                                />

                                                            </div>

                                                            <span className="
                                                                text-sm
                                                                font-medium
                                                                text-slate-700
                                                            ">
                                                                {
                                                                    agendamento.servico_nome ||
                                                                    "-"
                                                                }
                                                            </span>

                                                        </div>

                                                    </td>

                                                    {/* DATA */}

                                                    <td className="
                                                        px-5
                                                        py-4
                                                    ">

                                                        <div className="
                                                            flex
                                                            items-center
                                                            gap-2
                                                            text-sm
                                                            text-slate-600
                                                        ">

                                                            <FaCalendarAlt
                                                                className="
                                                                    text-slate-400
                                                                "
                                                            />

                                                            {
                                                                formatarData(
                                                                    agendamento.data
                                                                )
                                                            }

                                                        </div>

                                                    </td>

                                                    {/* HORA */}

                                                    <td className="
                                                        px-5
                                                        py-4
                                                    ">

                                                        <div className="
                                                            flex
                                                            items-center
                                                            gap-2
                                                            text-sm
                                                            font-semibold
                                                            text-slate-700
                                                        ">

                                                            <FaClock
                                                                className="
                                                                    text-slate-400
                                                                "
                                                            />

                                                            {
                                                                formatarHora(
                                                                    agendamento.hora
                                                                )
                                                            }

                                                        </div>

                                                    </td>

                                                    {/* VALOR */}

                                                    <td className="
                                                        px-5
                                                        py-4
                                                    ">

                                                        <div className="
                                                            flex
                                                            items-center
                                                            gap-2
                                                        ">

                                                            <FaMoneyBillWave
                                                                className="
                                                                    text-emerald-500
                                                                "
                                                            />

                                                            <span className="
                                                                text-sm
                                                                font-semibold
                                                                text-slate-700
                                                            ">

                                                                {
                                                                    formatarPreco(
                                                                        agendamento.preco
                                                                    )
                                                                }

                                                                {" "}
                                                                Kz

                                                            </span>

                                                        </div>

                                                    </td>

                                                    {/* ESTADO */}

                                                    <td className="
                                                        px-5
                                                        py-4
                                                    ">

                                                        <span
                                                            className={`
                                                                inline-flex
                                                                rounded-full
                                                                border
                                                                px-3
                                                                py-1.5
                                                                text-xs
                                                                font-semibold
                                                                ${estiloEstado(
                                                                    agendamento.status
                                                                )}
                                                            `}
                                                        >

                                                            {estado}

                                                        </span>

                                                    </td>

                                                    {/* AÇÕES */}

                                                    <td className="
                                                        px-5
                                                        py-4
                                                    ">

                                                        <div className="
                                                            flex
                                                            justify-end
                                                            gap-1
                                                        ">

                                                            {/* EDITAR */}

                                                            <button
                                                                onClick={() =>
                                                                    editarAgendamento(
                                                                        agendamento
                                                                    )
                                                                }
                                                                title="Editar"
                                                                className="
                                                                    flex
                                                                    h-9
                                                                    w-9
                                                                    items-center
                                                                    justify-center
                                                                    rounded-lg
                                                                    text-slate-500
                                                                    transition
                                                                    hover:bg-slate-100
                                                                    hover:text-slate-900
                                                                "
                                                            >

                                                                <FaEdit
                                                                    size={14}
                                                                />

                                                            </button>

                                                            {/* CONCLUIR / CANCELAR */}

                                                            {estado ===
                                                                "Agendado" && (

                                                                <>

                                                                    <button
                                                                        onClick={() =>
                                                                            concluirAgendamento(
                                                                                agendamento
                                                                            )
                                                                        }
                                                                        title="Concluir"
                                                                        className="
                                                                            flex
                                                                            h-9
                                                                            w-9
                                                                            items-center
                                                                            justify-center
                                                                            rounded-lg
                                                                            text-emerald-500
                                                                            transition
                                                                            hover:bg-emerald-50
                                                                        "
                                                                    >

                                                                        <FaCheck
                                                                            size={14}
                                                                        />

                                                                    </button>

                                                                    <button
                                                                        onClick={() =>
                                                                            cancelarAgendamento(
                                                                                agendamento
                                                                            )
                                                                        }
                                                                        title="Cancelar"
                                                                        className="
                                                                            flex
                                                                            h-9
                                                                            w-9
                                                                            items-center
                                                                            justify-center
                                                                            rounded-lg
                                                                            text-amber-500
                                                                            transition
                                                                            hover:bg-amber-50
                                                                        "
                                                                    >

                                                                        <FaTimes
                                                                            size={14}
                                                                        />

                                                                    </button>

                                                                </>

                                                            )}

                                                            {/* ELIMINAR */}

                                                            <button
                                                                onClick={() =>
                                                                    eliminarAgendamento(
                                                                        agendamento
                                                                    )
                                                                }
                                                                title="Eliminar"
                                                                className="
                                                                    flex
                                                                    h-9
                                                                    w-9
                                                                    items-center
                                                                    justify-center
                                                                    rounded-lg
                                                                    text-red-500
                                                                    transition
                                                                    hover:bg-red-50
                                                                "
                                                            >

                                                                <FaTrash
                                                                    size={14}
                                                                />

                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>

                                            );
                                        }
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </div>

            {/* ================================================= */}
            {/* MODAL NOVO / EDITAR */}
            {/* ================================================= */}

            {mostrarFormulario && (

                <div
                    className="
                        fixed
                        inset-0
                        z-50
                        flex
                        items-center
                        justify-center
                        bg-slate-900/50
                        p-4
                        backdrop-blur-sm
                    "
                    onMouseDown={(e) => {

                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            fecharFormulario();
                        }

                    }}
                >

                    <div className="
                        w-full
                        max-w-2xl
                        max-h-[90vh]
                        overflow-y-auto
                        rounded-2xl
                        bg-white
                        shadow-2xl
                    ">

                        {/* HEADER */}

                        <div className="
                            flex
                            items-center
                            justify-between
                            border-b
                            border-slate-100
                            px-6
                            py-5
                        ">

                            <div>

                                <h2 className="
                                    text-lg
                                    font-bold
                                    text-slate-900
                                ">

                                    {editarId
                                        ? "Editar agendamento"
                                        : "Novo agendamento"
                                    }

                                </h2>

                                <p className="
                                    mt-1
                                    text-xs
                                    text-slate-500
                                ">
                                    Preencha os dados do atendimento
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={
                                    fecharFormulario
                                }
                                className="
                                    flex
                                    h-9
                                    w-9
                                    items-center
                                    justify-center
                                    rounded-lg
                                    text-slate-400
                                    hover:bg-slate-100
                                    hover:text-slate-700
                                "
                            >

                                <FaTimes />

                            </button>

                        </div>

                        {/* FORM */}

                        <form
                            onSubmit={
                                salvarAgendamento
                            }
                            className="p-6"
                        >

                            <div className="
                                grid
                                grid-cols-1
                                gap-5
                                md:grid-cols-2
                            ">

                                {/* CLIENTE */}

                                <div>

                                    <label className="
                                        mb-2
                                        block
                                        text-sm
                                        font-semibold
                                        text-slate-700
                                    ">
                                        Cliente
                                    </label>

                                    <div className="
                                        relative
                                    ">

                                        <FaUser
                                            className="
                                                absolute
                                                left-4
                                                top-1/2
                                                -translate-y-1/2
                                                text-slate-400
                                            "
                                        />

                                        <select
                                            name="cliente_id"
                                            value={
                                                formulario.cliente_id
                                            }
                                            onChange={
                                                alterarFormulario
                                            }
                                            required
                                            className="
                                                w-full
                                                appearance-none
                                                rounded-xl
                                                border
                                                border-slate-200
                                                bg-slate-50
                                                px-11
                                                py-3
                                                text-sm
                                                outline-none
                                                transition
                                                focus:border-slate-400
                                                focus:bg-white
                                                focus:ring-4
                                                focus:ring-slate-100
                                            "
                                        >

                                            <option value="">
                                                Selecionar cliente
                                            </option>

                                            {clientes.map(
                                                (
                                                    cliente
                                                ) => (

                                                    <option
                                                        key={
                                                            cliente.id
                                                        }
                                                        value={
                                                            cliente.id
                                                        }
                                                    >

                                                        {
                                                            cliente.nome
                                                        }

                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>

                                </div>

                                {/* SERVIÇO */}

                                <div>

                                    <label className="
                                        mb-2
                                        block
                                        text-sm
                                        font-semibold
                                        text-slate-700
                                    ">
                                        Serviço
                                    </label>

                                    <div className="
                                        relative
                                    ">

                                        <FaCut
                                            className="
                                                absolute
                                                left-4
                                                top-1/2
                                                -translate-y-1/2
                                                text-slate-400
                                            "
                                        />

                                        <select
                                            name="servico_id"
                                            value={
                                                formulario.servico_id
                                            }
                                            onChange={
                                                alterarFormulario
                                            }
                                            required
                                            className="
                                                w-full
                                                appearance-none
                                                rounded-xl
                                                border
                                                border-slate-200
                                                bg-slate-50
                                                px-11
                                                py-3
                                                text-sm
                                                outline-none
                                                transition
                                                focus:border-slate-400
                                                focus:bg-white
                                                focus:ring-4
                                                focus:ring-slate-100
                                            "
                                        >

                                            <option value="">
                                                Selecionar serviço
                                            </option>

                                            {servicos.map(
                                                (
                                                    servico
                                                ) => (

                                                    <option
                                                        key={
                                                            servico.id
                                                        }
                                                        value={
                                                            servico.id
                                                        }
                                                    >

                                                        {
                                                            servico.nome
                                                        }

                                                        {" — "}

                                                        {
                                                            formatarPreco(
                                                                servico.preco
                                                            )
                                                        }

                                                        {" Kz"}

                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>

                                </div>

                                {/* DATA */}

                                <div>

                                    <label className="
                                        mb-2
                                        block
                                        text-sm
                                        font-semibold
                                        text-slate-700
                                    ">
                                        Data
                                    </label>

                                    <div className="
                                        relative
                                    ">

                                        <FaCalendarAlt
                                            className="
                                                absolute
                                                left-4
                                                top-1/2
                                                -translate-y-1/2
                                                text-slate-400
                                            "
                                        />

                                        <input
                                            type="date"
                                            name="data"
                                            value={
                                                formulario.data
                                            }
                                            onChange={
                                                alterarFormulario
                                            }
                                            required
                                            className="
                                                w-full
                                                rounded-xl
                                                border
                                                border-slate-200
                                                bg-slate-50
                                                px-11
                                                py-3
                                                text-sm
                                                outline-none
                                                transition
                                                focus:border-slate-400
                                                focus:bg-white
                                                focus:ring-4
                                                focus:ring-slate-100
                                            "
                                        />

                                    </div>

                                </div>

                                {/* HORA */}

                                <div>

                                    <label className="
                                        mb-2
                                        block
                                        text-sm
                                        font-semibold
                                        text-slate-700
                                    ">
                                        Hora
                                    </label>

                                    <div className="
                                        relative
                                    ">

                                        <FaClock
                                            className="
                                                absolute
                                                left-4
                                                top-1/2
                                                -translate-y-1/2
                                                text-slate-400
                                            "
                                        />

                                        <input
                                            type="time"
                                            name="hora"
                                            value={
                                                formulario.hora
                                            }
                                            onChange={
                                                alterarFormulario
                                            }
                                            required
                                            className="
                                                w-full
                                                rounded-xl
                                                border
                                                border-slate-200
                                                bg-slate-50
                                                px-11
                                                py-3
                                                text-sm
                                                outline-none
                                                transition
                                                focus:border-slate-400
                                                focus:bg-white
                                                focus:ring-4
                                                focus:ring-slate-100
                                            "
                                        />

                                    </div>

                                </div>

                                {/* STATUS */}

                                <div>

                                    <label className="
                                        mb-2
                                        block
                                        text-sm
                                        font-semibold
                                        text-slate-700
                                    ">
                                        Estado
                                    </label>

                                    <select
                                        name="status"
                                        value={
                                            formulario.status
                                        }
                                        onChange={
                                            alterarFormulario
                                        }
                                        className="
                                            w-full
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-slate-50
                                            px-4
                                            py-3
                                            text-sm
                                            outline-none
                                            transition
                                            focus:border-slate-400
                                            focus:bg-white
                                            focus:ring-4
                                            focus:ring-slate-100
                                        "
                                    >

                                        <option value="agendado">
                                            Agendado
                                        </option>

                                        <option value="concluido">
                                            Concluído
                                        </option>

                                        <option value="cancelado">
                                            Cancelado
                                        </option>

                                    </select>

                                </div>

                                {/* OBSERVAÇÃO */}

                                <div className="
                                    md:col-span-2
                                ">

                                    <label className="
                                        mb-2
                                        block
                                        text-sm
                                        font-semibold
                                        text-slate-700
                                    ">
                                        Observação
                                    </label>

                                    <textarea
                                        name="observacao"
                                        value={
                                            formulario.observacao
                                        }
                                        onChange={
                                            alterarFormulario
                                        }
                                        rows={4}
                                        placeholder="
                                            Adicione alguma observação
                                            sobre o atendimento...
                                        "
                                        className="
                                            w-full
                                            resize-none
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-slate-50
                                            px-4
                                            py-3
                                            text-sm
                                            outline-none
                                            transition
                                            placeholder:text-slate-400
                                            focus:border-slate-400
                                            focus:bg-white
                                            focus:ring-4
                                            focus:ring-slate-100
                                        "
                                    />

                                </div>

                            </div>

                            {/* FOOTER */}

                            <div className="
                                mt-6
                                flex
                                flex-col-reverse
                                gap-3
                                border-t
                                border-slate-100
                                pt-5
                                sm:flex-row
                                sm:justify-end
                            ">

                                <button
                                    type="button"
                                    onClick={
                                        fecharFormulario
                                    }
                                    disabled={salvando}
                                    className="
                                        rounded-xl
                                        border
                                        border-slate-200
                                        px-5
                                        py-3
                                        text-sm
                                        font-semibold
                                        text-slate-600
                                        transition
                                        hover:bg-slate-50
                                        disabled:cursor-not-allowed
                                        disabled:opacity-50
                                    "
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        salvando
                                    }
                                    className="
                                        inline-flex
                                        items-center
                                        justify-center
                                        gap-2
                                        rounded-xl
                                        bg-slate-900
                                        px-5
                                        py-3
                                        text-sm
                                        font-semibold
                                        text-white
                                        transition
                                        hover:bg-slate-800
                                        disabled:cursor-not-allowed
                                        disabled:opacity-60
                                    "
                                >

                                    {salvando && (

                                        <span className="
                                            h-4
                                            w-4
                                            animate-spin
                                            rounded-full
                                            border-2
                                            border-white/30
                                            border-t-white
                                        " />

                                    )}

                                    {editarId
                                        ? "Guardar alterações"
                                        : "Criar agendamento"
                                    }

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

            {/* ================================================= */}
            {/* MODAL CONFIRMAÇÃO */}
            {/* ================================================= */}

            {confirmacao && (

                <div
                    className="
                        fixed
                        inset-0
                        z-[60]
                        flex
                        items-center
                        justify-center
                        bg-slate-900/50
                        p-4
                        backdrop-blur-sm
                    "
                    onMouseDown={(e) => {

                        if (
                            e.target ===
                            e.currentTarget &&
                            !executandoAcao
                        ) {
                            setConfirmacao(null);
                        }

                    }}
                >

                    <div className="
                        w-full
                        max-w-md
                        rounded-2xl
                        bg-white
                        p-6
                        shadow-2xl
                    ">

                        <div className="
                            mx-auto
                            mb-5
                            flex
                            h-14
                            w-14
                            items-center
                            justify-center
                            rounded-full
                            bg-slate-100
                            text-slate-600
                        ">

                            {confirmacao.tipo ===
                            "concluir" ? (

                                <FaCheck />

                            ) : confirmacao.tipo ===
                              "cancelar" ? (

                                <FaTimes />

                            ) : (

                                <FaTrash />

                            )}

                        </div>

                        <h3 className="
                            text-center
                            text-lg
                            font-bold
                            text-slate-900
                        ">

                            {confirmacao.tipo ===
                            "concluir"
                                ? "Concluir agendamento?"
                                : confirmacao.tipo ===
                                  "cancelar"
                                    ? "Cancelar agendamento?"
                                    : "Eliminar agendamento?"
                            }

                        </h3>

                        <p className="
                            mt-2
                            text-center
                            text-sm
                            leading-6
                            text-slate-500
                        ">

                            {confirmacao.tipo ===
                            "concluir"
                                ? "O atendimento será marcado como concluído."
                                : confirmacao.tipo ===
                                  "cancelar"
                                    ? "O agendamento será marcado como cancelado."
                                    : "Esta ação não poderá ser desfeita."
                            }

                        </p>

                        <div className="
                            mt-6
                            grid
                            grid-cols-2
                            gap-3
                        ">

                            <button
                                onClick={() =>
                                    setConfirmacao(null)
                                }
                                disabled={
                                    executandoAcao
                                }
                                className="
                                    rounded-xl
                                    border
                                    border-slate-200
                                    px-4
                                    py-3
                                    text-sm
                                    font-semibold
                                    text-slate-600
                                    hover:bg-slate-50
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                "
                            >
                                Voltar
                            </button>

                            <button
                                onClick={
                                    executarConfirmacao
                                }
                                disabled={
                                    executandoAcao
                                }
                                className={`
                                    inline-flex
                                    items-center
                                    justify-center
                                    gap-2
                                    rounded-xl
                                    px-4
                                    py-3
                                    text-sm
                                    font-semibold
                                    text-white
                                    disabled:cursor-not-allowed
                                    disabled:opacity-60
                                    ${
                                        confirmacao.tipo ===
                                        "eliminar"
                                            ? "bg-red-600 hover:bg-red-700"
                                            : confirmacao.tipo ===
                                              "cancelar"
                                                ? "bg-amber-600 hover:bg-amber-700"
                                                : "bg-emerald-600 hover:bg-emerald-700"
                                    }
                                `}
                            >

                                {executandoAcao && (

                                    <span className="
                                        h-4
                                        w-4
                                        animate-spin
                                        rounded-full
                                        border-2
                                        border-white/30
                                        border-t-white
                                    " />

                                )}

                                Confirmar

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

