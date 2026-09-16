
import React, { useEffect, useState } from "react";

import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaSearch,
    FaTimes,
    FaSave,
    FaTags,
    FaCheckCircle,
    FaExclamationTriangle,
    FaSyncAlt
} from "react-icons/fa";

// =====================================================
// CONFIGURAÇÃO DA API_URL
// =====================================================

import { API_URL } from "../../servidor/api";

// =====================================================
// FETCH DA API_URL
// =====================================================

async function API_URLFetch(url, options = {}) {
    const token = localStorage.getItem("token");

    const headers = {
        ...(options.headers || {})
    };

    if (
        options.body &&
        !(options.body instanceof FormData)
    ) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    let resposta;

    try {
        resposta = await fetch(url, {
            ...options,
            headers
        });
    } catch (error) {
        throw new Error(
            "Não foi possível ligar ao servidor. Verifique se o backend está funcionando na porta 5000."
        );
    }

    if (
        resposta.status === 401 ||
        resposta.status === 403
    ) {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");

        window.location.href = "/login";

        throw new Error(
            "Sessão expirada. Faça login novamente."
        );
    }

    return resposta;
}

// =====================================================
// LER RESPOSTA
// =====================================================

async function lerResposta(resposta) {
    const texto = await resposta.text();

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
// COMPONENTE PRINCIPAL
// =====================================================

export default function Categorias() {

    // =================================================
    // ESTADOS
    // =================================================

    const [categorias, setCategorias] = useState([]);

    const [carregando, setCarregando] =
        useState(true);

    const [salvando, setSalvando] =
        useState(false);

    const [eliminando, setEliminando] =
        useState(null);

    const [modalAberto, setModalAberto] =
        useState(false);

    const [modoEdicao, setModoEdicao] =
        useState(false);

    const [categoriaId, setCategoriaId] =
        useState(null);

    const [nome, setNome] =
        useState("");

    const [descricao, setDescricao] =
        useState("");

    const [pesquisa, setPesquisa] =
        useState("");

    const [mensagem, setMensagem] =
        useState("");

    const [erro, setErro] =
        useState("");

    // =================================================
    // LIMPAR MENSAGENS
    // =================================================

    const limparMensagens = () => {
        setMensagem("");
        setErro("");
    };

    // =================================================
    // LISTAR CATEGORIAS
    // =================================================

    const carregarCategorias = async () => {

        try {

            setCarregando(true);
            limparMensagens();

            const resposta = await API_URLFetch(
                `${API_URL}/categorias`
            );

            const dados =
                await lerResposta(resposta);

            if (!resposta.ok) {
                throw new Error(
                    dados.mensagem ||
                    "Não foi possível carregar as categorias."
                );
            }

            let lista = [];

            if (Array.isArray(dados)) {
                lista = dados;
            } else if (
                Array.isArray(dados.categorias)
            ) {
                lista = dados.categorias;
            } else if (
                Array.isArray(dados.data)
            ) {
                lista = dados.data;
            }

            setCategorias(lista);

        } catch (error) {

            console.error(
                "Erro ao carregar categorias:",
                error
            );

            setErro(
                error.message ||
                "Erro ao carregar categorias."
            );

        } finally {

            setCarregando(false);
        }
    };

    // =================================================
    // CARREGAR AO ABRIR A PÁGINA
    // =================================================

    useEffect(() => {

        carregarCategorias();

    }, []);

    // =================================================
    // ABRIR MODAL PARA NOVA CATEGORIA
    // =================================================

    const abrirNovaCategoria = () => {

        limparMensagens();

        setModoEdicao(false);

        setCategoriaId(null);

        setNome("");

        setDescricao("");

        setModalAberto(true);
    };

    // =================================================
    // ABRIR MODAL PARA EDITAR
    // =================================================

    const abrirEdicao = (categoria) => {

        limparMensagens();

        setModoEdicao(true);

        setCategoriaId(categoria.id);

        setNome(
            categoria.nome || ""
        );

        setDescricao(
            categoria.descricao || ""
        );

        setModalAberto(true);
    };

    // =================================================
    // FECHAR MODAL
    // =================================================

    const fecharModal = () => {

        if (salvando) {
            return;
        }

        setModalAberto(false);

        setModoEdicao(false);

        setCategoriaId(null);

        setNome("");

        setDescricao("");
    };

    // =================================================
    // CADASTRAR / ATUALIZAR
    // =================================================

    const salvarCategoria = async (e) => {

        e.preventDefault();

        limparMensagens();

        const nomeLimpo = nome.trim();

        const descricaoLimpa =
            descricao.trim();

        if (!nomeLimpo) {

            setErro(
                "Digite o nome da categoria."
            );

            return;
        }

        if (nomeLimpo.length < 2) {

            setErro(
                "O nome da categoria deve ter pelo menos 2 caracteres."
            );

            return;
        }

        try {

            setSalvando(true);

            const url = modoEdicao
                ? `${API_URL}/categorias/${categoriaId}`
                : `${API_URL}/categorias`;

            const method = modoEdicao
                ? "PUT"
                : "POST";

            const resposta = await API_URLFetch(
                url,
                {
                    method,
                    body: JSON.stringify({
                        nome: nomeLimpo,
                        descricao:
                            descricaoLimpa
                    })
                }
            );

            const dados =
                await lerResposta(resposta);

            if (!resposta.ok) {

                throw new Error(
                    dados.mensagem ||
                    (
                        modoEdicao
                            ? "Não foi possível atualizar a categoria."
                            : "Não foi possível cadastrar a categoria."
                    )
                );
            }

            setMensagem(
                modoEdicao
                    ? "Categoria atualizada com sucesso."
                    : "Categoria cadastrada com sucesso."
            );

            fecharModal();

            await carregarCategorias();

        } catch (error) {

            console.error(
                "Erro ao salvar categoria:",
                error
            );

            setErro(
                error.message ||
                "Erro ao salvar categoria."
            );

        } finally {

            setSalvando(false);
        }
    };

    // =================================================
    // ELIMINAR CATEGORIA
    // =================================================

    const eliminarCategoria = async (id) => {

        const confirmar =
            window.confirm(
                "Tem certeza que deseja eliminar esta categoria?"
            );

        if (!confirmar) {
            return;
        }

        try {

            setEliminando(id);

            limparMensagens();

            const resposta = await API_URLFetch(
                `${API_URL}/categorias/${id}`,
                {
                    method: "DELETE"
                }
            );

            const dados =
                await lerResposta(resposta);

            if (!resposta.ok) {

                throw new Error(
                    dados.mensagem ||
                    "Não foi possível eliminar a categoria."
                );
            }

            setMensagem(
                "Categoria eliminada com sucesso."
            );

            await carregarCategorias();

        } catch (error) {

            console.error(
                "Erro ao eliminar categoria:",
                error
            );

            setErro(
                error.message ||
                "Erro ao eliminar categoria."
            );

        } finally {

            setEliminando(null);
        }
    };

    // =================================================
    // PESQUISA
    // =================================================

    const categoriasFiltradas =
        categorias.filter((categoria) => {

            const termo =
                pesquisa
                    .trim()
                    .toLowerCase();

            if (!termo) {
                return true;
            }

            return (
                String(
                    categoria.nome || ""
                )
                    .toLowerCase()
                    .includes(termo) ||

                String(
                    categoria.descricao || ""
                )
                    .toLowerCase()
                    .includes(termo)
            );
        });

    // =================================================
    // FORMATAR DATA
    // =================================================

    const formatarData = (data) => {

        if (!data) {
            return "-";
        }

        const dataObj =
            new Date(data);

        if (
            Number.isNaN(
                dataObj.getTime()
            )
        ) {
            return "-";
        }

        return dataObj.toLocaleDateString(
            "pt-AO",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );
    };

    // =================================================
    // RENDER
    // =================================================

    return (

        <div
            className="
                min-h-screen
                bg-slate-50
                p-4
                sm:p-6
                lg:p-8
            "
        >

            {/* =========================================
                CABEÇALHO
            ========================================= */}

            <div
                className="
                    mb-6
                    flex
                    flex-col
                    gap-4
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                "
            >

                <div>

                    <div
                        className="
                            flex
                            items-center
                            gap-3
                        "
                    >

                        <div
                            className="
                                flex
                                h-12
                                w-12
                                items-center
                                justify-center
                                rounded-2xl
                                bg-slate-950
                                text-white
                            "
                        >
                            <FaTags
                                size={20}
                            />
                        </div>

                        <div>

                            <h1
                                className="
                                    text-2xl
                                    font-black
                                    text-slate-950
                                "
                            >
                                Categorias
                            </h1>

                            <p
                                className="
                                    mt-1
                                    text-sm
                                    text-slate-500
                                "
                            >
                                Organize os produtos por categorias.
                            </p>

                        </div>

                    </div>

                </div>

                <div
                    className="
                        flex
                        flex-col
                        gap-2
                        sm:flex-row
                    "
                >

                    <button
                        type="button"
                        onClick={
                            carregarCategorias
                        }
                        disabled={carregando}
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
                        "
                    >

                        <FaSyncAlt />

                        Actualizar

                    </button>

                    <button
                        type="button"
                        onClick={
                            abrirNovaCategoria
                        }
                        className="
                            flex
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            bg-slate-950
                            px-5
                            py-3
                            text-sm
                            font-bold
                            text-white
                            transition
                            hover:bg-slate-800
                        "
                    >

                        <FaPlus />

                        Nova categoria

                    </button>

                </div>

            </div>

            {/* =========================================
                MENSAGEM
            ========================================= */}

            {mensagem && (

                <div
                    className="
                        mb-5
                        flex
                        items-center
                        gap-3
                        rounded-xl
                        border
                        border-emerald-200
                        bg-emerald-50
                        px-4
                        py-3
                        text-sm
                        font-semibold
                        text-emerald-700
                    "
                >

                    <FaCheckCircle />

                    {mensagem}

                </div>

            )}

            {erro && (

                <div
                    className="
                        mb-5
                        flex
                        items-center
                        gap-3
                        rounded-xl
                        border
                        border-red-200
                        bg-red-50
                        px-4
                        py-3
                        text-sm
                        font-semibold
                        text-red-700
                    "
                >

                    <FaExclamationTriangle />

                    <span>
                        {erro}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setErro("")
                        }
                        className="
                            ml-auto
                            text-red-500
                        "
                    >
                        <FaTimes />
                    </button>

                </div>

            )}

            {/* =========================================
                PESQUISA
            ========================================= */}

            <div
                className="
                    mb-6
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-4
                "
            >

                <div
                    className="
                        relative
                        max-w-xl
                    "
                >

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
                        onChange={(e) =>
                            setPesquisa(
                                e.target.value
                            )
                        }
                        className="
                            w-full
                            rounded-xl
                            border
                            border-slate-200
                            bg-slate-50
                            px-4
                            py-3
                            pl-11
                            pr-10
                            text-sm
                            outline-none
                            transition
                            focus:border-slate-900
                            focus:bg-white
                        "
                        placeholder="Pesquisar categoria..."
                    />

                    {pesquisa && (

                        <button
                            type="button"
                            onClick={() =>
                                setPesquisa("")
                            }
                            className="
                                absolute
                                right-3
                                top-1/2
                                -translate-y-1/2
                                text-slate-400
                                hover:text-slate-700
                            "
                        >

                            <FaTimes />

                        </button>

                    )}

                </div>

            </div>

            {/* =========================================
                ESTATÍSTICAS
            ========================================= */}

            <div
                className="
                    mb-6
                    grid
                    gap-4
                    sm:grid-cols-2
                "
            >

                <div
                    className="
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        p-5
                    "
                >

                    <div
                        className="
                            flex
                            items-center
                            justify-between
                        "
                    >

                        <div>

                            <p
                                className="
                                    text-xs
                                    font-bold
                                    uppercase
                                    tracking-wide
                                    text-slate-400
                                "
                            >
                                Total de categorias
                            </p>

                            <p
                                className="
                                    mt-2
                                    text-3xl
                                    font-black
                                    text-slate-950
                                "
                            >
                                {categorias.length}
                            </p>

                        </div>

                        <div
                            className="
                                flex
                                h-12
                                w-12
                                items-center
                                justify-center
                                rounded-xl
                                bg-slate-950
                                text-white
                            "
                        >

                            <FaTags />

                        </div>

                    </div>

                </div>

                <div
                    className="
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        p-5
                    "
                >

                    <div
                        className="
                            flex
                            items-center
                            justify-between
                        "
                    >

                        <div>

                            <p
                                className="
                                    text-xs
                                    font-bold
                                    uppercase
                                    tracking-wide
                                    text-slate-400
                                "
                            >
                                Resultados
                            </p>

                            <p
                                className="
                                    mt-2
                                    text-3xl
                                    font-black
                                    text-slate-950
                                "
                            >
                                {
                                    categoriasFiltradas.length
                                }
                            </p>

                        </div>

                        <div
                            className="
                                flex
                                h-12
                                w-12
                                items-center
                                justify-center
                                rounded-xl
                                bg-slate-100
                                text-slate-900
                            "
                        >

                            <FaSearch />

                        </div>

                    </div>

                </div>

            </div>

            {/* =========================================
                TABELA
            ========================================= */}

            <div
                className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                "
            >

                <div
                    className="
                        overflow-x-auto
                    "
                >

                    <table
                        className="
                            w-full
                            min-w-[700px]
                            border-collapse
                        "
                    >

                         <thead className="bg-slate-950 text-xs uppercase tracking-wide text-white">

                                 

                            <tr
                                className="
                                    border-b
                                    border-slate-200
                                   bg-slate-950
                                "
                            >

                                <th
                                    className="
                                        px-5
                                        py-4
                                        text-left
                                        text-xs
                                        font-black
                                        uppercase
                                        tracking-wide
                                        text-white
                                    "
                                >
                                    ID
                                </th>

                                <th
                                    className="
                                        px-5
                                        py-4
                                        text-left
                                        text-xs
                                        font-black
                                        uppercase
                                        tracking-wide
                                        text-white
                                    "
                                >
                                    Categoria
                                </th>

                                <th
                                    className="
                                        px-5
                                        py-4
                                        text-left
                                        text-xs
                                        font-black
                                        uppercase
                                        tracking-wide
                                        text-white
                                    "
                                >
                                    Descrição
                                </th>

                                <th
                                    className="
                                        px-5
                                        py-4
                                        text-left
                                        text-xs
                                        font-black
                                        uppercase
                                        tracking-wide
                                        text-white
                                    "
                                >
                                    Criado em
                                </th>

                                <th
                                    className="
                                        px-5
                                        py-4
                                        text-right
                                        text-xs
                                        font-black
                                        uppercase
                                        tracking-wide
                                        text-white
                                    "
                                >
                                    Acções
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {carregando ? (

                                <tr>

                                    <td
                                        colSpan="5"
                                        className="
                                            px-5
                                            py-16
                                            text-center
                                        "
                                    >

                                        <div
                                            className="
                                                flex
                                                flex-col
                                                items-center
                                                justify-center
                                                gap-3
                                                text-slate-500
                                            "
                                        >

                                            <FaSyncAlt
                                                className="
                                                    animate-spin
                                                "
                                                size={22}
                                            />

                                            <span
                                                className="
                                                    text-sm
                                                "
                                            >
                                                A carregar categorias...
                                            </span>

                                        </div>

                                    </td>

                                </tr>

                            ) : categoriasFiltradas.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="5"
                                        className="
                                            px-5
                                            py-16
                                            text-center
                                        "
                                    >

                                        <div
                                            className="
                                                flex
                                                flex-col
                                                items-center
                                                justify-center
                                            "
                                        >

                                            <div
                                                className="
                                                    mb-4
                                                    flex
                                                    h-16
                                                    w-16
                                                    items-center
                                                    justify-center
                                                    rounded-2xl
                                                    bg-slate-100
                                                    text-slate-400
                                                "
                                            >

                                                <FaTags
                                                    size={25}
                                                />

                                            </div>

                                            <h3
                                                className="
                                                    font-bold
                                                    text-slate-900
                                                "
                                            >
                                                Nenhuma categoria encontrada
                                            </h3>

                                            <p
                                                className="
                                                    mt-1
                                                    text-sm
                                                    text-slate-500
                                                "
                                            >
                                                {pesquisa
                                                    ? "Tente pesquisar por outro nome."
                                                    : "Comece criando a primeira categoria."
                                                }
                                            </p>

                                        </div>

                                    </td>

                                </tr>

                            ) : (

                                categoriasFiltradas.map(
                                    (categoria) => (

                                        <tr
                                            key={
                                                categoria.id
                                            }
                                            className="
                                                border-b
                                                border-slate-100
                                                last:border-b-0
                                                hover:bg-slate-50
                                            "
                                        >

                                            <td
                                                className="
                                                    px-5
                                                    py-4
                                                    text-sm
                                                    font-bold
                                                    text-slate-500
                                                "
                                            >
                                                #
                                                {
                                                    categoria.id
                                                }
                                            </td>

                                            <td
                                                className="
                                                    px-5
                                                    py-4
                                                "
                                            >

                                                <div
                                                    className="
                                                        flex
                                                        items-center
                                                        gap-3
                                                    "
                                                >

                                                    <div
                                                        className="
                                                            flex
                                                            h-10
                                                            w-10
                                                            shrink-0
                                                            items-center
                                                            justify-center
                                                            rounded-xl
                                                            bg-slate-950
                                                            text-white
                                                        "
                                                    >

                                                        <FaTags />

                                                    </div>

                                                    <div>

                                                        <p
                                                            className="
                                                                font-bold
                                                                text-slate-900
                                                            "
                                                        >
                                                            {
                                                                categoria.nome
                                                            }
                                                        </p>

                                                    </div>

                                                </div>

                                            </td>

                                            <td
                                                className="
                                                    max-w-md
                                                    px-5
                                                    py-4
                                                    text-sm
                                                    text-slate-500
                                                "
                                            >

                                                <span
                                                    className="
                                                        line-clamp-2
                                                    "
                                                >
                                                    {
                                                        categoria.descricao ||
                                                        "Sem descrição"
                                                    }
                                                </span>

                                            </td>

                                            <td
                                                className="
                                                    px-5
                                                    py-4
                                                    text-sm
                                                    text-slate-500
                                                "
                                            >
                                                {
                                                    formatarData(
                                                        categoria.criado_em
                                                    )
                                                }
                                            </td>

                                            <td
                                                className="
                                                    px-5
                                                    py-4
                                                "
                                            >

                                                <div
                                                    className="
                                                        flex
                                                        justify-end
                                                        gap-2
                                                    "
                                                >

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            abrirEdicao(
                                                                categoria
                                                            )
                                                        }
                                                        className="
                                                            flex
                                                            h-10
                                                            w-10
                                                            items-center
                                                            justify-center
                                                            rounded-xl
                                                            border
                                                            border-slate-200
                                                            bg-white
                                                            text-slate-700
                                                            transition
                                                            hover:bg-slate-100
                                                        "
                                                        title="Editar"
                                                    >

                                                        <FaEdit />

                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            eliminarCategoria(
                                                                categoria.id
                                                            )
                                                        }
                                                        disabled={
                                                            eliminando ===
                                                            categoria.id
                                                        }
                                                        className="
                                                            flex
                                                            h-10
                                                            w-10
                                                            items-center
                                                            justify-center
                                                            rounded-xl
                                                            border
                                                            border-red-100
                                                            bg-red-50
                                                            text-red-600
                                                            transition
                                                            hover:bg-red-100
                                                            disabled:opacity-50
                                                        "
                                                        title="Eliminar"
                                                    >

                                                        {eliminando ===
                                                        categoria.id ? (
                                                            <FaSyncAlt
                                                                className="
                                                                    animate-spin
                                                                "
                                                            />
                                                        ) : (
                                                            <FaTrash />
                                                        )}

                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

            {/* =========================================
                MODAL
            ========================================= */}

            {modalAberto && (

                <div
                    className="
                        fixed
                        inset-0
                        z-[100]
                        flex
                        items-center
                        justify-center
                        bg-black/50
                        p-4
                    "
                    onMouseDown={(e) => {

                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            fecharModal();
                        }

                    }}
                >

                    <div
                        className="
                            w-full
                            max-w-lg
                            rounded-3xl
                            bg-white
                            p-6
                            shadow-2xl
                            sm:p-8
                        "
                    >

                        {/* CABEÇALHO MODAL */}

                        <div
                            className="
                                mb-6
                                flex
                                items-center
                                justify-between
                            "
                        >

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-3
                                "
                            >

                                <div
                                    className="
                                        flex
                                        h-12
                                        w-12
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-slate-950
                                        text-white
                                    "
                                >

                                    {modoEdicao
                                        ? <FaEdit />
                                        : <FaPlus />
                                    }

                                </div>

                                <div>

                                    <h2
                                        className="
                                            text-xl
                                            font-black
                                            text-slate-950
                                        "
                                    >

                                        {modoEdicao
                                            ? "Editar categoria"
                                            : "Nova categoria"
                                        }

                                    </h2>

                                    <p
                                        className="
                                            text-sm
                                            text-slate-500
                                        "
                                    >

                                        {modoEdicao
                                            ? "Actualize os dados da categoria."
                                            : "Adicione uma nova categoria para os produtos."
                                        }

                                    </p>

                                </div>

                            </div>

                            <button
                                type="button"
                                onClick={
                                    fecharModal
                                }
                                disabled={salvando}
                                className="
                                    flex
                                    h-10
                                    w-10
                                    items-center
                                    justify-center
                                    rounded-xl
                                    text-slate-400
                                    hover:bg-slate-100
                                    hover:text-slate-700
                                "
                            >

                                <FaTimes />

                            </button>

                        </div>

                        {/* FORMULÁRIO */}

                        <form
                            onSubmit={
                                salvarCategoria
                            }
                            className="
                                space-y-5
                            "
                        >

                            <div>

                                <label
                                    className="
                                        mb-2
                                        block
                                        text-sm
                                        font-bold
                                        text-slate-700
                                    "
                                >
                                    Nome da categoria
                                </label>

                                <input
                                    type="text"
                                    value={nome}
                                    onChange={(e) =>
                                        setNome(
                                            e.target.value
                                        )
                                    }
                                    required
                                    minLength={2}
                                    maxLength={150}
                                    autoFocus
                                    className="
                                        w-full
                                        rounded-xl
                                        border
                                        border-slate-200
                                        bg-white
                                        px-4
                                        py-3
                                        text-sm
                                        outline-none
                                        transition
                                        focus:border-slate-900
                                    "
                                    placeholder="Ex.: Eletrónicos"
                                />

                            </div>

                            <div>

                                <label
                                    className="
                                        mb-2
                                        block
                                        text-sm
                                        font-bold
                                        text-slate-700
                                    "
                                >
                                    Descrição
                                </label>

                                <textarea
                                    value={descricao}
                                    onChange={(e) =>
                                        setDescricao(
                                            e.target.value
                                        )
                                    }
                                    rows={4}
                                    className="
                                        w-full
                                        resize-none
                                        rounded-xl
                                        border
                                        border-slate-200
                                        bg-white
                                        px-4
                                        py-3
                                        text-sm
                                        outline-none
                                        transition
                                        focus:border-slate-900
                                    "
                                    placeholder="Descrição da categoria..."
                                />

                            </div>

                            {/* BOTÕES */}

                            <div
                                className="
                                    flex
                                    flex-col-reverse
                                    gap-3
                                    pt-2
                                    sm:flex-row
                                    sm:justify-end
                                "
                            >

                                <button
                                    type="button"
                                    onClick={
                                        fecharModal
                                    }
                                    disabled={
                                        salvando
                                    }
                                    className="
                                        rounded-xl
                                        border
                                        border-slate-200
                                        px-5
                                        py-3
                                        text-sm
                                        font-bold
                                        text-slate-700
                                        hover:bg-slate-100
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
                                        flex
                                        items-center
                                        justify-center
                                        gap-2
                                        rounded-xl
                                        bg-slate-950
                                        px-5
                                        py-3
                                        text-sm
                                        font-bold
                                        text-white
                                        hover:bg-slate-800
                                        disabled:cursor-not-allowed
                                        disabled:opacity-60
                                    "
                                >

                                    {salvando ? (
                                        <>
                                            <FaSyncAlt
                                                className="
                                                    animate-spin
                                                "
                                            />

                                            A guardar...
                                        </>
                                    ) : (
                                        <>
                                            <FaSave />

                                            {modoEdicao
                                                ? "Actualizar categoria"
                                                : "Guardar categoria"
                                            }
                                        </>
                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}
