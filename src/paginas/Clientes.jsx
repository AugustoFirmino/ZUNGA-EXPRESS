
import { useEffect, useRef, useState } from "react";

import {
    FaUsers,
    FaUser,
    FaPhone,
    FaEnvelope,
    FaEdit,
    FaTrash,
    FaPlus,
    FaSearch,
    FaTimes,
    FaCheck,
    FaUserPlus,
    FaMoneyBillWave,
    FaLock,
    FaEye,
    FaEyeSlash,
    FaCamera,
    FaImage
} from "react-icons/fa";

// =====================================================
// API_URL
// =====================================================

//const API_URL = "http://localhost:5000/API_URL/clientes";

import { API_URL } from "../../servidor/api";

// =====================================================
// FORMULÁRIO INICIAL
// =====================================================

const formularioInicial = {
    nome: "",
    telefone: "",
    email: "",
    senha: "",
    valor: ""
};

// =====================================================
// COMPONENTE
// =====================================================

export default function Clientes() {

    // =================================================
    // ESTADOS
    // =================================================

    const [formulario, setFormulario] = useState(formularioInicial);

    const [clientes, setClientes] = useState([]);

    const [carregando, setCarregando] = useState(false);

    const [salvando, setSalvando] = useState(false);

    const [eliminando, setEliminando] = useState(false);

    const [editarId, setEditarId] = useState(null);

    const [pesquisa, setPesquisa] = useState("");

    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    const [mostrarSenha, setMostrarSenha] = useState(false);

    const [mensagem, setMensagem] = useState(null);

    const [confirmacao, setConfirmacao] = useState(null);

    const [erroNome, setErroNome] = useState("");

    // =================================================
    // IMAGEM
    // =================================================

    const [imagem, setImagem] = useState(null);

    const [previewImagem, setPreviewImagem] = useState("");

    const inputImagemRef = useRef(null);

    const previewUrlRef = useRef("");

    // =================================================
    // FORMATAR KWANZA
    // =================================================

    const formatarKwanza = (valor) => {

        if (
            valor === null ||
            valor === undefined ||
            valor === ""
        ) {
            return "0,00 Kz";
        }

        const numero = Number(valor);

        if (!Number.isFinite(numero)) {
            return "0,00 Kz";
        }

        return (
            new Intl.NumberFormat("pt-AO", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(numero) + " Kz"
        );
    };

    // =================================================
    // MENSAGEM
    // =================================================

    const mostrarMensagem = (tipo, texto) => {

        setMensagem({
            tipo,
            texto
        });

        window.setTimeout(() => {
            setMensagem(null);
        }, 4000);
    };

    // =================================================
    // LER RESPOSTA
    // =================================================

    const lerResposta = async (resposta) => {

        const texto = await resposta.text();

        if (!texto) {
            return {};
        }

        try {

            return JSON.parse(texto);

        } catch (erro) {

            console.error(
                "Resposta inválida do servidor:",
                texto
            );

            throw new Error(
                "O servidor retornou uma resposta inválida."
            );
        }
    };

    // =================================================
    // LIMPAR URL DO PREVIEW
    // =================================================

    const limparPreview = () => {

        if (previewUrlRef.current) {

            URL.revokeObjectURL(
                previewUrlRef.current
            );

            previewUrlRef.current = "";
        }
    };

    // =================================================
    // LIMPAR IMAGEM
    // =================================================

    const limparImagem = () => {

        limparPreview();

        setImagem(null);

        setPreviewImagem("");

        if (inputImagemRef.current) {
            inputImagemRef.current.value = "";
        }
    };

    // =================================================
    // SELECIONAR IMAGEM
    // =================================================

    const selecionarImagem = (e) => {

        const arquivo = e.target.files?.[0];

        if (!arquivo) {
            return;
        }

        if (!arquivo.type.startsWith("image/")) {

            mostrarMensagem(
                "erro",
                "Selecione apenas um arquivo de imagem."
            );

            e.target.value = "";

            return;
        }

        const tamanhoMaximo = 5 * 1024 * 1024;

        if (arquivo.size > tamanhoMaximo) {

            mostrarMensagem(
                "erro",
                "A imagem não pode ultrapassar 5 MB."
            );

            e.target.value = "";

            return;
        }

        limparPreview();

        const novaUrl = URL.createObjectURL(arquivo);

        previewUrlRef.current = novaUrl;

        setImagem(arquivo);

        setPreviewImagem(novaUrl);
    };

    // =================================================
    // CARREGAR CLIENTES
    // =================================================

    const carregarClientes = async () => {

        try {

            setCarregando(true);

            const resposta = await fetch(`${API_URL}/clientes`, {
                method: "GET",
                headers: {
                    Accept: "application/json"
                }
            });

            const dados = await lerResposta(resposta);

            if (!resposta.ok) {

                throw new Error(
                    dados.mensagem ||
                    dados.erro ||
                    `Erro HTTP ${resposta.status}`
                );
            }

            if (Array.isArray(dados)) {

                setClientes(dados);

            } else if (Array.isArray(dados.clientes)) {

                setClientes(dados.clientes);

            } else {

                setClientes([]);
            }

        } catch (erro) {

            console.error(
                "Erro ao carregar clientes:",
                erro
            );

            setClientes([]);

            mostrarMensagem(
                "erro",
                erro.message ||
                "Não foi possível carregar os clientes."
            );

        } finally {

            setCarregando(false);
        }
    };

    // =================================================
    // CARREGAR AO ABRIR
    // =================================================

    useEffect(() => {

        carregarClientes();

        return () => {
            limparPreview();
        };

    }, []);

    // =================================================
    // ALTERAR FORMULÁRIO
    // =================================================

    const alterarFormulario = (e) => {

        const {
            name,
            value
        } = e.target;

        setFormulario((anterior) => ({
            ...anterior,
            [name]: value
        }));

        if (name === "nome") {
            setErroNome("");
        }
    };

    // =================================================
    // NOVO CLIENTE
    // =================================================

    const novoCliente = () => {

        limparPreview();

        setFormulario({
            ...formularioInicial
        });

        setEditarId(null);

        setImagem(null);

        setPreviewImagem("");

        setMostrarSenha(false);

        setErroNome("");

        if (inputImagemRef.current) {
            inputImagemRef.current.value = "";
        }

        setMostrarFormulario(true);
    };

    // =================================================
    // EDITAR CLIENTE
    // =================================================

    const editarCliente = (cliente) => {

        limparPreview();

        setEditarId(cliente.id);

        setFormulario({
            nome: cliente.nome || "",

            telefone: cliente.telefone || "",

            email: cliente.email || "",

            senha: "",

            valor:
                cliente.valor !== null &&
                cliente.valor !== undefined
                    ? String(cliente.valor)
                    : ""
        });

        setErroNome("");

        setImagem(null);

        setPreviewImagem(
            cliente.cloudinary_url ||
            cliente.imagem_url ||
            cliente.imagem ||
            ""
        );

        setMostrarSenha(false);

        if (inputImagemRef.current) {
            inputImagemRef.current.value = "";
        }

        setMostrarFormulario(true);
    };

    // =================================================
    // LIMPAR FORMULÁRIO
    // =================================================

    const limparFormulario = () => {

        limparPreview();

        setFormulario({
            ...formularioInicial
        });

        setEditarId(null);

        setImagem(null);

        setPreviewImagem("");

        setMostrarSenha(false);

        setErroNome("");

        if (inputImagemRef.current) {
            inputImagemRef.current.value = "";
        }
    };

    // =================================================
    // FECHAR FORMULÁRIO
    // =================================================

    const fecharFormulario = () => {

        limparFormulario();

        setMostrarFormulario(false);
    };

    // =================================================
    // VALIDAR EMAIL
    // =================================================

    const emailValido = (email) => {

        if (!email) {
            return true;
        }

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // =================================================
    // SALVAR CLIENTE
    // =================================================

    const salvarCliente = async (e) => {

        e.preventDefault();

        // =============================================
        // NOME
        // =============================================

        const nome = String(
            formulario.nome || ""
        ).trim();

        if (!nome) {

            setErroNome(
                "O nome do cliente é obrigatório."
            );

            mostrarMensagem(
                "erro",
                "O nome do cliente é obrigatório."
            );

            return;
        }

        // =============================================
        // TELEFONE
        // =============================================

        const telefone = String(
            formulario.telefone || ""
        ).trim();

        if (!telefone) {

            mostrarMensagem(
                "erro",
                "Digite o telefone."
            );

            return;
        }

        // =============================================
        // EMAIL
        // =============================================

        const email = String(
            formulario.email || ""
        ).trim();

        if (!emailValido(email)) {

            mostrarMensagem(
                "erro",
                "Digite um email válido."
            );

            return;
        }

        // =============================================
        // SENHA NO CADASTRO
        // =============================================

        if (!editarId) {

            const senha = String(
                formulario.senha || ""
            ).trim();

            if (!senha) {

                mostrarMensagem(
                    "erro",
                    "Digite a senha do cliente."
                );

                return;
            }

            if (senha.length < 6) {

                mostrarMensagem(
                    "erro",
                    "A senha deve ter pelo menos 6 caracteres."
                );

                return;
            }
        }

        // =============================================
        // SENHA NA EDIÇÃO
        // =============================================

        if (
            editarId &&
            formulario.senha &&
            formulario.senha.length < 6
        ) {

            mostrarMensagem(
                "erro",
                "A nova senha deve ter pelo menos 6 caracteres."
            );

            return;
        }

        // =============================================
        // VALOR
        // =============================================

        let valor = "";

        if (
            formulario.valor !== null &&
            formulario.valor !== undefined &&
            String(formulario.valor).trim() !== ""
        ) {

            valor = Number(
                String(formulario.valor).replace(",", ".")
            );

            if (
                !Number.isFinite(valor) ||
                valor < 0
            ) {

                mostrarMensagem(
                    "erro",
                    "Digite um valor válido."
                );

                return;
            }
        }

        // =============================================
        // REQUEST
        // =============================================

        try {

            setSalvando(true);

            const url = editarId
                ? `${API_URL}/${editarId}`
                : API_URL;

            const metodo = editarId
                ? "PUT"
                : "POST";

            const dadosEnviar = new FormData();

            // =========================================
            // CAMPOS
            // =========================================

            dadosEnviar.append(
                "nome",
                nome
            );

            dadosEnviar.append(
                "telefone",
                telefone
            );

            dadosEnviar.append(
                "email",
                email
            );

            dadosEnviar.append(
                "valor",
                valor === ""
                    ? ""
                    : String(valor)
            );

            // =========================================
            // SENHA
            // =========================================

            if (!editarId) {

                dadosEnviar.append(
                    "senha",
                    formulario.senha
                );

            } else if (
                formulario.senha &&
                formulario.senha.trim()
            ) {

                dadosEnviar.append(
                    "senha",
                    formulario.senha
                );
            }

            // =========================================
            // IMAGEM
            // =========================================

            if (imagem) {

                dadosEnviar.append(
                    "imagem",
                    imagem
                );
            }

            // =========================================
            // DEBUG
            // =========================================

            console.log(
                "========== CLIENTE =========="
            );

            for (const [chave, valorForm] of dadosEnviar.entries()) {

                if (valorForm instanceof File) {

                    console.log(
                        chave,
                        valorForm.name
                    );

                } else {

                    console.log(
                        chave,
                        valorForm
                    );
                }
            }

            // =========================================
            // FETCH
            // =========================================

            const resposta = await fetch(
                url,
                {
                    method: metodo,

                    headers: {
                        Accept: "application/json"
                    },

                    body: dadosEnviar
                }
            );

            const dados = await lerResposta(
                resposta
            );

            console.log(
                "Resposta:",
                dados
            );

            if (!resposta.ok) {

                throw new Error(
                    dados.mensagem ||
                    dados.erro ||
                    `Erro HTTP ${resposta.status}`
                );
            }

            // =========================================
            // TOKEN
            // =========================================

            if (dados.token) {

                localStorage.setItem(
                    "tokenCliente",
                    dados.token
                );
            }

            // =========================================
            // CLIENTE
            // =========================================

            if (dados.cliente) {

                localStorage.setItem(
                    "cliente",
                    JSON.stringify(
                        dados.cliente
                    )
                );
            }

            // =========================================
            // SUCESSO
            // =========================================

            mostrarMensagem(
                "sucesso",
                editarId
                    ? "Cliente atualizado com sucesso."
                    : "Cliente cadastrado com sucesso."
            );

            fecharFormulario();

            await carregarClientes();

        } catch (erro) {

            console.error(
                "Erro ao salvar cliente:",
                erro
            );

            mostrarMensagem(
                "erro",
                erro.message ||
                "Erro ao salvar cliente."
            );

        } finally {

            setSalvando(false);
        }
    };

    // =================================================
    // ELIMINAR CLIENTE
    // =================================================

    const eliminarCliente = (cliente) => {

        setConfirmacao({
            id: cliente.id,
            nome: cliente.nome
        });
    };

    // =================================================
    // CONFIRMAR ELIMINAÇÃO
    // =================================================

    const confirmarEliminacao = async () => {

        if (!confirmacao) {
            return;
        }

        try {

            setEliminando(true);

            const resposta = await fetch(
                `${API_URL}/${confirmacao.id}`,
                {
                    method: "DELETE",

                    headers: {
                        Accept: "application/json"
                    }
                }
            );

            const dados = await lerResposta(
                resposta
            );

            if (!resposta.ok) {

                throw new Error(
                    dados.mensagem ||
                    dados.erro ||
                    `Erro HTTP ${resposta.status}`
                );
            }

            mostrarMensagem(
                "sucesso",
                "Cliente eliminado com sucesso."
            );

            setConfirmacao(null);

            await carregarClientes();

        } catch (erro) {

            console.error(
                "Erro ao eliminar cliente:",
                erro
            );

            mostrarMensagem(
                "erro",
                erro.message ||
                "Erro ao eliminar cliente."
            );

        } finally {

            setEliminando(false);
        }
    };

    // =================================================
    // CLIENTES FILTRADOS
    // =================================================

    const textoPesquisa = pesquisa
        .toLowerCase()
        .trim();

    const clientesFiltrados = clientes.filter(
        (cliente) => {

            if (!textoPesquisa) {
                return true;
            }

            return (

                String(cliente.nome || "")
                    .toLowerCase()
                    .includes(textoPesquisa)

                ||

                String(cliente.telefone || "")
                    .toLowerCase()
                    .includes(textoPesquisa)

                ||

                String(cliente.email || "")
                    .toLowerCase()
                    .includes(textoPesquisa)

                ||

                String(cliente.valor ?? "")
                    .toLowerCase()
                    .includes(textoPesquisa)
            );
        }
    );

    // =================================================
    // VALOR TOTAL
    // =================================================

    const valorTotal = clientes.reduce(
        (total, cliente) => {

            const valor =
                Number(cliente.valor) || 0;

            return total + valor;

        },
        0
    );

    // =================================================
    // RETORNO
    // =================================================

    return (

        <div className="
            min-h-screen
            bg-slate-50
            p-4
            md:p-6
            lg:p-8
        ">

            {/* =================================================
                MENSAGEM
            ================================================= */}

            {mensagem && (

                <div
                    className={`
                        fixed
                        right-4
                        top-4
                        z-[100]
                        flex
                        max-w-sm
                        items-center
                        gap-3
                        rounded-xl
                        border
                        px-5
                        py-4
                        shadow-xl
                        ${
                            mensagem.tipo === "sucesso"
                                ? `
                                    border-emerald-200
                                    bg-emerald-50
                                    text-emerald-700
                                `
                                : `
                                    border-red-200
                                    bg-red-50
                                    text-red-700
                                `
                        }
                    `}
                >

                    {mensagem.tipo === "sucesso"
                        ? <FaCheck />
                        : <FaTimes />
                    }

                    <span className="
                        text-sm
                        font-medium
                    ">
                        {mensagem.texto}
                    </span>

                </div>
            )}

            <div className="
                mx-auto
                max-w-7xl
            ">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="
                    mb-8
                    flex
                    flex-col
                    gap-5
                    md:flex-row
                    md:items-center
                    md:justify-between
                ">

                    <div className="
                        flex
                        items-center
                        gap-4
                    ">

                        <div className="
                            flex
                            h-14
                            w-14
                            items-center
                            justify-center
                            rounded-2xl
                            bg-slate-900
                            text-white
                            shadow-lg
                        ">
                            <FaUsers size={22} />
                        </div>

                        <div>

                            <h1 className="
                                text-2xl
                                font-bold
                                tracking-tight
                                text-slate-900
                                md:text-3xl
                            ">
                                Clientes
                            </h1>

                            <p className="
                                mt-1
                                text-sm
                                text-slate-500
                            ">
                                Gestão dos clientes do salão
                            </p>

                        </div>

                    </div>

                    <button
                        type="button"
                        onClick={novoCliente}
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
                            transition
                            hover:bg-slate-800
                            active:scale-[0.98]
                        "
                    >
                        <FaPlus />
                        Novo cliente
                    </button>

                </div>

                {/* =================================================
                    ESTATÍSTICAS
                ================================================= */}

                <div className="
                    mb-8
                    grid
                    grid-cols-1
                    gap-4
                    sm:grid-cols-2
                    lg:grid-cols-3
                ">

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
                                    Total de clientes
                                </p>

                                <p className="
                                    mt-2
                                    text-3xl
                                    font-bold
                                    text-slate-900
                                ">
                                    {clientes.length}
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
                                <FaUsers />
                            </div>

                        </div>

                    </div>

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
                                    Resultados
                                </p>

                                <p className="
                                    mt-2
                                    text-3xl
                                    font-bold
                                    text-slate-900
                                ">
                                    {clientesFiltrados.length}
                                </p>

                            </div>

                            <div className="
                                flex
                                h-11
                                w-11
                                items-center
                                justify-center
                                rounded-xl
                                bg-blue-50
                                text-blue-600
                            ">
                                <FaSearch />
                            </div>

                        </div>

                    </div>

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
                                    Valor total
                                </p>

                                <p className="
                                    mt-2
                                    text-2xl
                                    font-bold
                                    text-emerald-600
                                ">
                                    {formatarKwanza(valorTotal)}
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
                                <FaMoneyBillWave />
                            </div>

                        </div>

                    </div>

                </div>

                {/* =================================================
                    PESQUISA
                ================================================= */}

                <div className="
                    mb-5
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-4
                    shadow-sm
                ">

                    <div className="relative">

                        <FaSearch className="
                            absolute
                            left-4
                            top-1/2
                            -translate-y-1/2
                            text-slate-400
                        " />

                        <input
                            type="text"
                            value={pesquisa}
                            onChange={(e) =>
                                setPesquisa(e.target.value)
                            }
                            placeholder="Pesquisar por nome, telefone, email ou valor..."
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

                </div>

                {/* =================================================
                    LISTA
                ================================================= */}

                <div className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    shadow-sm
                ">

                    <div className="
                        flex
                        flex-col
                        gap-2
                        border-b
                        border-slate-100
                        px-5
                        py-4
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                    ">

                        <div>

                            <h2 className="
                                font-bold
                                text-slate-900
                            ">
                                Lista de clientes
                            </h2>

                            <p className="
                                mt-1
                                text-xs
                                text-slate-500
                            ">
                                {clientesFiltrados.length} clientes encontrados
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={carregarClientes}
                            disabled={carregando}
                            className="
                                rounded-lg
                                border
                                border-slate-200
                                px-3
                                py-2
                                text-xs
                                font-semibold
                                text-slate-600
                                transition
                                hover:bg-slate-50
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
                        >
                            {carregando
                                ? "A atualizar..."
                                : "Atualizar lista"
                            }
                        </button>

                    </div>

                    {carregando ? (

                        <div className="
                            flex
                            min-h-[300px]
                            flex-col
                            items-center
                            justify-center
                        ">

                            <div className="
                                mb-4
                                h-10
                                w-10
                                animate-spin
                                rounded-full
                                border-4
                                border-slate-200
                                border-t-slate-900
                            " />

                            <p className="
                                text-sm
                                text-slate-500
                            ">
                                Carregando clientes...
                            </p>

                        </div>

                    ) : clientesFiltrados.length === 0 ? (

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
                                <FaUsers size={25} />
                            </div>

                            <h3 className="
                                font-semibold
                                text-slate-800
                            ">
                                Nenhum cliente encontrado
                            </h3>

                            <p className="
                                mt-1
                                max-w-sm
                                text-sm
                                text-slate-500
                            ">
                                Ainda não existem clientes para apresentar
                                ou a pesquisa não encontrou resultados.
                            </p>

                            <button
                                type="button"
                                onClick={novoCliente}
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
                                Cadastrar cliente
                            </button>

                        </div>

                    ) : (

                        <div className="overflow-x-auto">

                            <table className="
                                w-full
                                min-w-[1100px]
                            ">

                                   <thead className="bg-slate-950 text-xs uppercase tracking-wide text-white">


                                    <tr className="
                                        border-b
                                        border-slate-100
                                      bg-slate-950
                                    ">

                                        <th className="
                                            px-5
                                            py-4
                                            text-left
                                            text-xs
                                            font-semibold
                                            uppercase
                                            tracking-wider
                                            text-white
                                        ">
                                            ID
                                        </th>

                                        <th className="
                                            px-5
                                            py-4
                                            text-left
                                            text-xs
                                            font-semibold
                                            uppercase
                                            tracking-wider
                                            text-white
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
                                            text-white
                                        ">
                                            Telefone
                                        </th>

                                        <th className="
                                            px-5
                                            py-4
                                            text-left
                                            text-xs
                                            font-semibold
                                            uppercase
                                            tracking-wider
                                           text-white
                                        ">
                                            Email
                                        </th>

                                        <th className="
                                            px-5
                                            py-4
                                            text-left
                                            text-xs
                                            font-semibold
                                            uppercase
                                            tracking-wider
                                            text-white
                                        ">
                                            Valor
                                        </th>

                                        <th className="
                                            px-5
                                            py-4
                                            text-right
                                            text-xs
                                            font-semibold
                                            uppercase
                                            tracking-wider
                                            text-white
                                        ">
                                            Ações
                                        </th>

                                    </tr>

                                </thead>

                                <tbody className="
                                    divide-y
                                    divide-slate-100
                                ">

                                    {clientesFiltrados.map(
                                        (cliente) => {

                                            const foto =
                                                cliente.cloudinary_url ||
                                                cliente.imagem_url ||
                                                cliente.imagem ||
                                                "";

                                            return (

                                                <tr
                                                    key={cliente.id}
                                                    className="
                                                        group
                                                        transition
                                                        hover:bg-slate-50/70
                                                    "
                                                >

                                                    <td className="
                                                        px-5
                                                        py-4
                                                    ">
                                                        <span className="
                                                            rounded-lg
                                                            bg-slate-100
                                                            px-2.5
                                                            py-1
                                                            text-xs
                                                            font-bold
                                                            text-slate-600
                                                        ">
                                                            #{cliente.id}
                                                        </span>
                                                    </td>

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
                                                                overflow-hidden
                                                                rounded-xl
                                                                bg-slate-100
                                                                text-slate-600
                                                            ">

                                                                {foto ? (

                                                                    <img
                                                                        src={foto}
                                                                        alt={
                                                                            cliente.nome ||
                                                                            "Cliente"
                                                                        }
                                                                        className="
                                                                            h-full
                                                                            w-full
                                                                            object-cover
                                                                        "
                                                                        onError={(e) => {

                                                                            e.currentTarget.style.display =
                                                                                "none";

                                                                            const fallback =
                                                                                e.currentTarget.parentElement?.querySelector(
                                                                                    ".fallback-avatar"
                                                                                );

                                                                            if (fallback) {
                                                                                fallback.style.display =
                                                                                    "flex";
                                                                            }
                                                                        }}
                                                                    />

                                                                ) : null}

                                                                <div
                                                                    className="
                                                                        fallback-avatar
                                                                        h-full
                                                                        w-full
                                                                        items-center
                                                                        justify-center
                                                                        text-slate-400
                                                                    "
                                                                    style={{
                                                                        display:
                                                                            foto
                                                                                ? "none"
                                                                                : "flex"
                                                                    }}
                                                                >
                                                                    <FaUser />
                                                                </div>

                                                            </div>

                                                            <div>

                                                                <p className="
                                                                    font-semibold
                                                                    text-slate-800
                                                                ">
                                                                    {cliente.nome || "-"}
                                                                </p>

                                                                <p className="
                                                                    mt-0.5
                                                                    text-xs
                                                                    text-slate-400
                                                                ">
                                                                    Cliente
                                                                </p>

                                                            </div>

                                                        </div>

                                                    </td>

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

                                                            <FaPhone className="
                                                                text-slate-400
                                                            " />

                                                            {cliente.telefone || "-"}

                                                        </div>

                                                    </td>

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

                                                            <FaEnvelope className="
                                                                text-slate-400
                                                            " />

                                                            {cliente.email || "-"}

                                                        </div>

                                                    </td>

                                                    <td className="
                                                        px-5
                                                        py-4
                                                    ">

                                                        <div className="
                                                            flex
                                                            items-center
                                                            gap-2
                                                            text-sm
                                                            font-bold
                                                            text-emerald-600
                                                        ">

                                                            <FaMoneyBillWave />

                                                            {formatarKwanza(
                                                                cliente.valor
                                                            )}

                                                        </div>

                                                    </td>

                                                    <td className="
                                                        px-5
                                                        py-4
                                                    ">

                                                        <div className="
                                                            flex
                                                            justify-end
                                                            gap-1
                                                        ">

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    editarCliente(
                                                                        cliente
                                                                    )
                                                                }
                                                                title="Editar cliente"
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
                                                                <FaEdit size={14} />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    eliminarCliente(
                                                                        cliente
                                                                    )
                                                                }
                                                                title="Eliminar cliente"
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
                                                                <FaTrash size={14} />
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

            {/* =================================================
                MODAL CLIENTE
            ================================================= */}

            {mostrarFormulario && (

                <div
                    className="
                        fixed
                        inset-0
                        z-50
                        flex
                        items-center
                        justify-center
                        overflow-y-auto
                        bg-slate-950/50
                        p-4
                        backdrop-blur-sm
                    "
                    onMouseDown={(e) => {

                        if (
                            e.target === e.currentTarget &&
                            !salvando
                        ) {
                            fecharFormulario();
                        }
                    }}
                >

                    <div className="
                        my-8
                        w-full
                        max-w-lg
                        overflow-hidden
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

                            <div className="
                                flex
                                items-center
                                gap-3
                            ">

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
                                    {editarId
                                        ? <FaEdit />
                                        : <FaUserPlus />
                                    }
                                </div>

                                <div>

                                    <h2 className="
                                        font-bold
                                        text-slate-900
                                    ">
                                        {editarId
                                            ? "Editar cliente"
                                            : "Novo cliente"
                                        }
                                    </h2>

                                    <p className="
                                        mt-1
                                        text-xs
                                        text-slate-500
                                    ">
                                        Preencha os dados do cliente
                                    </p>

                                </div>

                            </div>

                            <button
                                type="button"
                                onClick={fecharFormulario}
                                disabled={salvando}
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
                                    disabled:opacity-50
                                "
                            >
                                <FaTimes />
                            </button>

                        </div>

                        {/* FORM */}

                        <form
                            onSubmit={salvarCliente}
                            noValidate
                            className="p-6"
                        >

                            <div className="space-y-5">

                                {/* IMAGEM */}

                                <div>

                                    <label className="
                                        mb-2
                                        block
                                        text-sm
                                        font-semibold
                                        text-slate-700
                                    ">
                                        Foto do cliente

                                        <span className="
                                            ml-1
                                            text-xs
                                            font-normal
                                            text-slate-400
                                        ">
                                            (opcional)
                                        </span>
                                    </label>

                                    <div className="
                                        flex
                                        flex-col
                                        items-center
                                        gap-4
                                        rounded-2xl
                                        border
                                        border-dashed
                                        border-slate-300
                                        bg-slate-50
                                        p-5
                                        sm:flex-row
                                    ">

                                        <div className="
                                            relative
                                            h-28
                                            w-28
                                            shrink-0
                                            overflow-hidden
                                            rounded-2xl
                                            bg-white
                                            shadow-sm
                                            ring-1
                                            ring-slate-200
                                        ">

                                            {previewImagem ? (

                                                <img
                                                    src={previewImagem}
                                                    alt="Preview do cliente"
                                                    className="
                                                        h-full
                                                        w-full
                                                        object-cover
                                                    "
                                                    onError={() => {
                                                        setPreviewImagem("");
                                                    }}
                                                />

                                            ) : (

                                                <div className="
                                                    flex
                                                    h-full
                                                    w-full
                                                    flex-col
                                                    items-center
                                                    justify-center
                                                    text-slate-300
                                                ">

                                                    <FaImage size={28} />

                                                    <span className="
                                                        mt-2
                                                        text-[10px]
                                                        font-medium
                                                    ">
                                                        Sem foto
                                                    </span>

                                                </div>
                                            )}

                                        </div>

                                        <div className="
                                            flex
                                            flex-1
                                            flex-col
                                            gap-2
                                        ">

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    inputImagemRef.current?.click()
                                                }
                                                disabled={salvando}
                                                className="
                                                    inline-flex
                                                    items-center
                                                    justify-center
                                                    gap-2
                                                    rounded-xl
                                                    bg-slate-900
                                                    px-4
                                                    py-3
                                                    text-sm
                                                    font-semibold
                                                    text-white
                                                    transition
                                                    hover:bg-slate-800
                                                    disabled:opacity-50
                                                "
                                            >
                                                <FaCamera />

                                                {imagem
                                                    ? "Trocar imagem"
                                                    : "Selecionar imagem"
                                                }
                                            </button>

                                            {previewImagem && (

                                                <button
                                                    type="button"
                                                    onClick={limparImagem}
                                                    disabled={salvando}
                                                    className="
                                                        inline-flex
                                                        items-center
                                                        justify-center
                                                        gap-2
                                                        rounded-xl
                                                        border
                                                        border-red-200
                                                        px-4
                                                        py-2.5
                                                        text-sm
                                                        font-semibold
                                                        text-red-600
                                                        transition
                                                        hover:bg-red-50
                                                        disabled:opacity-50
                                                    "
                                                >
                                                    <FaTrash />
                                                    Remover imagem
                                                </button>
                                            )}

                                            <p className="
                                                text-center
                                                text-xs
                                                leading-5
                                                text-slate-400
                                                sm:text-left
                                            ">
                                                JPG, JPEG, PNG ou WEBP.
                                                <br />
                                                Tamanho máximo: 5 MB.
                                            </p>

                                            <input
                                                ref={inputImagemRef}
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                                onChange={selecionarImagem}
                                                className="hidden"
                                            />

                                        </div>

                                    </div>

                                    {imagem && (

                                        <p className="
                                            mt-2
                                            truncate
                                            text-xs
                                            text-slate-500
                                        ">
                                            Arquivo selecionado:{" "}
                                            <strong>
                                                {imagem.name}
                                            </strong>
                                        </p>
                                    )}

                                </div>

                                {/* NOME */}

                                <div>

                                    <label
                                        htmlFor="nome"
                                        className="
                                            mb-2
                                            block
                                            text-sm
                                            font-semibold
                                            text-slate-700
                                        "
                                    >
                                        Nome completo

                                        <span className="
                                            ml-1
                                            text-red-500
                                        ">
                                            *
                                        </span>
                                    </label>

                                    <div className="relative">

                                        <FaUser className="
                                            absolute
                                            left-4
                                            top-1/2
                                            -translate-y-1/2
                                            text-slate-400
                                        " />

                                        <input
                                            id="nome"
                                            type="text"
                                            name="nome"
                                            autoComplete="name"
                                            placeholder="Nome completo"
                                            value={formulario.nome}
                                            onChange={alterarFormulario}
                                            required
                                            aria-invalid={!!erroNome}
                                            className={`
                                                w-full
                                                rounded-xl
                                                border
                                                bg-slate-50
                                                px-11
                                                py-3
                                                text-sm
                                                outline-none
                                                transition
                                                focus:bg-white
                                                focus:ring-4
                                                ${
                                                    erroNome
                                                        ? `
                                                            border-red-400
                                                            focus:border-red-400
                                                            focus:ring-red-100
                                                        `
                                                        : `
                                                            border-slate-200
                                                            focus:border-slate-400
                                                            focus:ring-slate-100
                                                        `
                                                }
                                            `}
                                        />

                                    </div>

                                    {erroNome && (

                                        <p className="
                                            mt-1.5
                                            text-xs
                                            font-medium
                                            text-red-600
                                        ">
                                            {erroNome}
                                        </p>
                                    )}

                                </div>

                                {/* TELEFONE */}

                                <div>

                                    <label
                                        htmlFor="telefone"
                                        className="
                                            mb-2
                                            block
                                            text-sm
                                            font-semibold
                                            text-slate-700
                                        "
                                    >
                                        Telefone

                                        <span className="
                                            ml-1
                                            text-red-500
                                        ">
                                            *
                                        </span>
                                    </label>

                                    <div className="relative">

                                        <FaPhone className="
                                            absolute
                                            left-4
                                            top-1/2
                                            -translate-y-1/2
                                            text-slate-400
                                        " />

                                        <input
                                            id="telefone"
                                            type="tel"
                                            name="telefone"
                                            autoComplete="tel"
                                            placeholder="Ex.: 923 000 000"
                                            value={formulario.telefone}
                                            onChange={alterarFormulario}
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

                                {/* EMAIL */}

                                <div>

                                    <label
                                        htmlFor="email"
                                        className="
                                            mb-2
                                            block
                                            text-sm
                                            font-semibold
                                            text-slate-700
                                        "
                                    >
                                        Email

                                        <span className="
                                            ml-1
                                            text-xs
                                            font-normal
                                            text-slate-400
                                        ">
                                            (opcional)
                                        </span>
                                    </label>

                                    <div className="relative">

                                        <FaEnvelope className="
                                            absolute
                                            left-4
                                            top-1/2
                                            -translate-y-1/2
                                            text-slate-400
                                        " />

                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            autoComplete="email"
                                            placeholder="cliente@email.com"
                                            value={formulario.email}
                                            onChange={alterarFormulario}
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

                                {/* SENHA */}

                                <div>

                                    <label
                                        htmlFor="senha"
                                        className="
                                            mb-2
                                            block
                                            text-sm
                                            font-semibold
                                            text-slate-700
                                        "
                                    >
                                        Senha

                                        {editarId ? (

                                            <span className="
                                                ml-1
                                                text-xs
                                                font-normal
                                                text-slate-400
                                            ">
                                                (deixe vazio para manter)
                                            </span>

                                        ) : (

                                            <>
                                                <span className="
                                                    ml-1
                                                    text-red-500
                                                ">
                                                    *
                                                </span>

                                                <span className="
                                                    ml-1
                                                    text-xs
                                                    font-normal
                                                    text-slate-400
                                                ">
                                                    (mínimo 6 caracteres)
                                                </span>
                                            </>
                                        )}

                                    </label>

                                    <div className="relative">

                                        <FaLock className="
                                            absolute
                                            left-4
                                            top-1/2
                                            -translate-y-1/2
                                            text-slate-400
                                        " />

                                        <input
                                            id="senha"
                                            type={
                                                mostrarSenha
                                                    ? "text"
                                                    : "password"
                                            }
                                            name="senha"
                                            autoComplete="new-password"
                                            placeholder={
                                                editarId
                                                    ? "Nova senha"
                                                    : "Mínimo 6 caracteres"
                                            }
                                            value={formulario.senha}
                                            onChange={alterarFormulario}
                                            required={!editarId}
                                            className="
                                                w-full
                                                rounded-xl
                                                border
                                                border-slate-200
                                                bg-slate-50
                                                py-3
                                                pl-11
                                                pr-11
                                                text-sm
                                                outline-none
                                                transition
                                                focus:border-slate-400
                                                focus:bg-white
                                                focus:ring-4
                                                focus:ring-slate-100
                                            "
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setMostrarSenha(
                                                    (anterior) =>
                                                        !anterior
                                                )
                                            }
                                            className="
                                                absolute
                                                right-4
                                                top-1/2
                                                -translate-y-1/2
                                                text-slate-400
                                                hover:text-slate-700
                                            "
                                            aria-label={
                                                mostrarSenha
                                                    ? "Ocultar senha"
                                                    : "Mostrar senha"
                                            }
                                        >
                                            {mostrarSenha
                                                ? <FaEyeSlash />
                                                : <FaEye />
                                            }
                                        </button>

                                    </div>

                                </div>

                                {/* VALOR */}

                                <div>

                                    <label
                                        htmlFor="valor"
                                        className="
                                            mb-2
                                            block
                                            text-sm
                                            font-semibold
                                            text-slate-700
                                        "
                                    >
                                        Valor em Kwanza
                                    </label>

                                    <div className="relative">

                                        <FaMoneyBillWave className="
                                            absolute
                                            left-4
                                            top-1/2
                                            -translate-y-1/2
                                            text-emerald-500
                                        " />

                                        <input
                                            id="valor"
                                            type="number"
                                            name="valor"
                                            min="0"
                                            step="0.01"
                                            placeholder="Ex.: 5000"
                                            value={formulario.valor}
                                            onChange={alterarFormulario}
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
                                                focus:border-emerald-400
                                                focus:bg-white
                                                focus:ring-4
                                                focus:ring-emerald-100
                                            "
                                        />

                                    </div>

                                    <p className="
                                        mt-1.5
                                        text-xs
                                        text-slate-400
                                    ">
                                        Informe o valor em Kwanza.
                                    </p>

                                </div>

                            </div>

                            {/* BOTÕES */}

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
                                    onClick={fecharFormulario}
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
                                        disabled:opacity-50
                                    "
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={salvando}
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
                                        : "Cadastrar cliente"
                                    }

                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

            {/* =================================================
                MODAL ELIMINAÇÃO
            ================================================= */}

            {confirmacao && (

                <div className="
                    fixed
                    inset-0
                    z-[60]
                    flex
                    items-center
                    justify-center
                    bg-slate-950/50
                    p-4
                    backdrop-blur-sm
                ">

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
                            bg-red-50
                            text-red-600
                        ">
                            <FaTrash />
                        </div>

                        <h3 className="
                            text-center
                            text-lg
                            font-bold
                            text-slate-900
                        ">
                            Eliminar cliente?
                        </h3>

                        <p className="
                            mt-2
                            text-center
                            text-sm
                            leading-6
                            text-slate-500
                        ">
                            Tem certeza que deseja eliminar{" "}

                            <strong className="
                                font-semibold
                                text-slate-700
                            ">
                                {confirmacao.nome || "este cliente"}
                            </strong>

                            ? Esta ação não poderá ser desfeita.
                        </p>

                        <div className="
                            mt-6
                            grid
                            grid-cols-2
                            gap-3
                        ">

                            <button
                                type="button"
                                onClick={() =>
                                    setConfirmacao(null)
                                }
                                disabled={eliminando}
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
                                    disabled:opacity-50
                                "
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={confirmarEliminacao}
                                disabled={eliminando}
                                className="
                                    inline-flex
                                    items-center
                                    justify-center
                                    gap-2
                                    rounded-xl
                                    bg-red-600
                                    px-4
                                    py-3
                                    text-sm
                                    font-semibold
                                    text-white
                                    hover:bg-red-700
                                    disabled:cursor-not-allowed
                                    disabled:opacity-60
                                "
                            >

                                {eliminando && (

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

                                {eliminando
                                    ? "A eliminar..."
                                    : "Eliminar"
                                }

                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}
