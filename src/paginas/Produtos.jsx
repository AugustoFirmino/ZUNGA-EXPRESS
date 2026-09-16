import { useEffect, useRef, useState } from "react";

import {
    FaBox,
    FaEdit,
    FaTrash,
    FaPlus,
    FaSearch,
    FaTimes,
    FaCheck,
    FaImage,
    FaMoneyBillWave,
    FaWarehouse,
    FaTag,
    FaCloudUploadAlt,
} from "react-icons/fa";

// =====================================================
// CONFIGURAÇÃO DA API
// =====================================================

import { API_URL } from "../../servidor/api";

const API_PRODUTOS = `${API_URL}/produtos`;
const API_CATEGORIAS = `${API_URL}/categorias`;

// =====================================================
// FORMULÁRIO INICIAL
// =====================================================

const formularioInicial = {
    nome: "",
    descricao: "",
    preco: "",
    quantidade: "",
    categoria_id: "",
    categoria_nome: "",
};

// =====================================================
// COMPONENTE
// =====================================================

export default function Produtos() {
    // =================================================
    // ESTADOS
    // =================================================

    const [formulario, setFormulario] = useState({
        ...formularioInicial,
    });

    const [produtos, setProdutos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [categoriasFiltradas, setCategoriasFiltradas] = useState([]);

    const [mostrarCategorias, setMostrarCategorias] = useState(false);

    const [editarId, setEditarId] = useState(null);

    const [imagem, setImagem] = useState(null);
    const [imagemPreview, setImagemPreview] = useState("");
    const [imagemExistente, setImagemExistente] = useState("");

    const [cloudinaryIdExistente, setCloudinaryIdExistente] =
        useState("");

    const [mostrarFormulario, setMostrarFormulario] =
        useState(false);

    const [carregando, setCarregando] = useState(true);

    const [carregandoCategorias, setCarregandoCategorias] =
        useState(false);

    const [salvando, setSalvando] = useState(false);

    const [executandoAcao, setExecutandoAcao] =
        useState(false);

    const [pesquisa, setPesquisa] = useState("");

    const [filtroCategoria, setFiltroCategoria] =
        useState("Todas");

    const [mensagem, setMensagem] = useState(null);

    const [confirmacao, setConfirmacao] = useState(null);

    const inputImagemRef = useRef(null);
    const inputCategoriaRef = useRef(null);
    const inputNomeRef = useRef(null);

    const timeoutMensagemRef = useRef(null);

    // =================================================
    // LIMPAR TIMEOUT
    // =================================================

    useEffect(() => {
        return () => {
            if (timeoutMensagemRef.current) {
                clearTimeout(timeoutMensagemRef.current);
            }

            if (
                imagemPreview &&
                imagemPreview.startsWith("blob:")
            ) {
                URL.revokeObjectURL(imagemPreview);
            }
        };
    }, [imagemPreview]);

    // =================================================
    // MENSAGEM
    // =================================================

    const mostrarMensagem = (tipo, texto) => {
        if (timeoutMensagemRef.current) {
            clearTimeout(timeoutMensagemRef.current);
        }

        setMensagem({
            tipo,
            texto,
        });

        timeoutMensagemRef.current = setTimeout(() => {
            setMensagem(null);
        }, 4000);
    };

    // =================================================
    // NORMALIZAR CATEGORIA
    // =================================================

    const normalizarCategoria = (item) => {
        return {
            id: item.id,

            nome:
                item.nome ??
                item.nome_categoria ??
                item.categoria_nome ??
                "",

            descricao: item.descricao ?? "",
        };
    };

    // =================================================
    // NORMALIZAR PRODUTO
    // =================================================

    const normalizarProduto = (item) => {
        return {
            ...item,

            id: item.id,

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
                0
            ),

            quantidade: Number(
                item.quantidade ??
                item.estoque ??
                item.stock ??
                0
            ),

            categoria_id:
                item.categoria_id ??
                item.id_categoria ??
                null,

            categoria:
                item.categoria ??
                item.categoria_nome ??
                item.nome_categoria ??
                "",

            cloudinary_id:
                item.cloudinary_id ??
                "",

            cloudinary_url:
                item.cloudinary_url ??
                item.imagem_url ??
                item.imagemUrl ??
                "",

            criado_em:
                item.criado_em ??
                item.created_at ??
                null,

            atualizado_em:
                item.atualizado_em ??
                item.updated_at ??
                null,
        };
    };

    // =================================================
    // CARREGAR CATEGORIAS
    // =================================================

    const carregarCategorias = async () => {
        try {
            setCarregandoCategorias(true);

            const resposta = await fetch(
                API_CATEGORIAS,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            let dados = {};

            try {
                dados = await resposta.json();
            } catch {
                dados = {};
            }

            if (!resposta.ok) {
                throw new Error(
                    dados.mensagem ||
                    dados.message ||
                    dados.erro ||
                    `Erro HTTP ${resposta.status}`
                );
            }

            let listaBruta = [];

            if (Array.isArray(dados)) {
                listaBruta = dados;
            } else if (Array.isArray(dados.categorias)) {
                listaBruta = dados.categorias;
            } else if (Array.isArray(dados.data)) {
                listaBruta = dados.data;
            } else if (Array.isArray(dados.rows)) {
                listaBruta = dados.rows;
            }

            const lista = listaBruta
                .map(normalizarCategoria)
                .filter(
                    (categoria) =>
                        String(categoria.nome).trim() !== ""
                );

            setCategorias(lista);
        } catch (erro) {
            console.error(
                "Erro ao carregar categorias:",
                erro
            );

            setCategorias([]);

            mostrarMensagem(
                "erro",
                erro.message ||
                "Não foi possível carregar as categorias."
            );
        } finally {
            setCarregandoCategorias(false);
        }
    };

    // =================================================
    // CARREGAR PRODUTOS
    // =================================================

    const carregarProdutos = async () => {
        try {
            setCarregando(true);

            const resposta = await fetch(
                API_PRODUTOS,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            let dados = {};

            try {
                dados = await resposta.json();
            } catch {
                dados = {};
            }

            if (!resposta.ok) {
                throw new Error(
                    dados.mensagem ||
                    dados.message ||
                    dados.erro ||
                    `Erro HTTP ${resposta.status}`
                );
            }

            let listaBruta = [];

            if (Array.isArray(dados)) {
                listaBruta = dados;
            } else if (Array.isArray(dados.produtos)) {
                listaBruta = dados.produtos;
            } else if (Array.isArray(dados.data)) {
                listaBruta = dados.data;
            } else if (Array.isArray(dados.rows)) {
                listaBruta = dados.rows;
            }

            setProdutos(
                listaBruta.map(normalizarProduto)
            );
        } catch (erro) {
            console.error(
                "Erro ao carregar produtos:",
                erro
            );

            setProdutos([]);

            mostrarMensagem(
                "erro",
                erro.message ||
                "Não foi possível carregar os produtos."
            );
        } finally {
            setCarregando(false);
        }
    };

    // =================================================
    // CARREGAR AO ABRIR
    // =================================================

    useEffect(() => {
        carregarProdutos();
        carregarCategorias();
    }, []);

    // =================================================
    // ALTERAR FORMULÁRIO
    // =================================================

    const alterarFormulario = (e) => {
        const { name, value } = e.target;

        if (name === "categoria_nome") {
            const termo = value
                .trim()
                .toLowerCase();

            const resultados = termo
                ? categorias
                    .filter((categoria) =>
                        String(categoria.nome)
                            .toLowerCase()
                            .includes(termo)
                    )
                    .slice(0, 8)
                : categorias.slice(0, 8);

            setCategoriasFiltradas(resultados);
            setMostrarCategorias(true);

            setFormulario((anterior) => ({
                ...anterior,
                categoria_nome: value,
                categoria_id: "",
            }));

            return;
        }

        setFormulario((anterior) => ({
            ...anterior,
            [name]: value,
        }));
    };

    // =================================================
    // SELECIONAR CATEGORIA
    // =================================================

    const selecionarCategoria = (categoria) => {
        setFormulario((anterior) => ({
            ...anterior,

            categoria_id: String(categoria.id),

            categoria_nome: categoria.nome,
        }));

        setCategoriasFiltradas([]);

        setMostrarCategorias(false);
    };

    // =================================================
    // ABRIR CATEGORIAS
    // =================================================

    const abrirCategorias = () => {
        if (!categorias.length) {
            return;
        }

        const termo = formulario.categoria_nome
            .trim()
            .toLowerCase();

        const resultados = termo
            ? categorias
                .filter((categoria) =>
                    String(categoria.nome)
                        .toLowerCase()
                        .includes(termo)
                )
                .slice(0, 8)
            : categorias.slice(0, 8);

        setCategoriasFiltradas(resultados);

        setMostrarCategorias(true);
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
                "Selecione um arquivo de imagem válido."
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

        if (
            imagemPreview &&
            imagemPreview.startsWith("blob:")
        ) {
            URL.revokeObjectURL(imagemPreview);
        }

        const url = URL.createObjectURL(arquivo);

        setImagem(arquivo);

        setImagemPreview(url);
    };

    // =================================================
    // LIMPAR IMAGEM
    // =================================================

    const limparImagem = () => {
        if (
            imagemPreview &&
            imagemPreview.startsWith("blob:")
        ) {
            URL.revokeObjectURL(imagemPreview);
        }

        setImagem(null);

        setImagemPreview("");

        if (inputImagemRef.current) {
            inputImagemRef.current.value = "";
        }
    };

    // =================================================
    // RESETAR FORMULÁRIO
    // =================================================

    const resetarFormulario = () => {
        if (
            imagemPreview &&
            imagemPreview.startsWith("blob:")
        ) {
            URL.revokeObjectURL(imagemPreview);
        }

        setFormulario({
            ...formularioInicial,
        });

        setEditarId(null);

        setImagem(null);

        setImagemPreview("");

        setImagemExistente("");

        setCloudinaryIdExistente("");

        setMostrarCategorias(false);

        setCategoriasFiltradas([]);

        if (inputImagemRef.current) {
            inputImagemRef.current.value = "";
        }
    };

    // =================================================
    // NOVO PRODUTO
    // =================================================

    const novoProduto = () => {
        resetarFormulario();

        setCategoriasFiltradas(
            categorias.slice(0, 8)
        );

        setMostrarFormulario(true);

        setTimeout(() => {
            inputNomeRef.current?.focus();
        }, 100);
    };

    // =================================================
    // EDITAR PRODUTO
    // =================================================

    const editarProduto = (produto) => {
        limparImagem();

        setEditarId(produto.id);

        setFormulario({
            nome: produto.nome || "",

            descricao:
                produto.descricao || "",

            preco:
                produto.preco !== null &&
                    produto.preco !== undefined
                    ? String(produto.preco)
                    : "",

            quantidade:
                produto.quantidade !== null &&
                    produto.quantidade !== undefined
                    ? String(produto.quantidade)
                    : "",

            categoria_id:
                produto.categoria_id !== null &&
                    produto.categoria_id !== undefined
                    ? String(produto.categoria_id)
                    : "",

            categoria_nome:
                produto.categoria || "",
        });

        setImagemExistente(
            produto.cloudinary_url ||
            produto.imagem_url ||
            ""
        );

        setCloudinaryIdExistente(
            produto.cloudinary_id || ""
        );

        setMostrarCategorias(false);

        setMostrarFormulario(true);

        setTimeout(() => {
            inputNomeRef.current?.focus();
        }, 100);
    };

    // =================================================
    // FECHAR FORMULÁRIO
    // =================================================

    const fecharFormulario = (forcar = false) => {
        if (salvando && !forcar) {
            return;
        }

        resetarFormulario();

        setMostrarFormulario(false);
    };

    // =================================================
    // SALVAR PRODUTO
    // =================================================

    const salvarProduto = async (e) => {
        e.preventDefault();

        if (salvando) {
            return;
        }

        // =================================================
        // NOME
        // =================================================

        const nomeProduto = String(
            formulario.nome ?? ""
        ).trim();

        if (!nomeProduto) {
            mostrarMensagem(
                "erro",
                "O nome do produto é obrigatório."
            );

            inputNomeRef.current?.focus();

            return;
        }

        // =================================================
        // CATEGORIA
        // =================================================

        const categoriaId = String(
            formulario.categoria_id ?? ""
        ).trim();

        if (!categoriaId) {
            mostrarMensagem(
                "erro",
                "Selecione uma categoria válida."
            );

            inputCategoriaRef.current?.focus();

            return;
        }

        // =================================================
        // PREÇO
        // =================================================

        const precoTexto = String(
            formulario.preco ?? ""
        ).trim();

        // Permite também vírgula decimal
        const precoNormalizado =
            precoTexto.replace(",", ".");

        const preco = Number(
            precoNormalizado
        );

        if (
            !precoTexto ||
            !Number.isFinite(preco) ||
            preco < 0
        ) {
            mostrarMensagem(
                "erro",
                "Informe um preço válido."
            );

            return;
        }

        // =================================================
        // QUANTIDADE
        // =================================================

        const quantidadeTexto = String(
            formulario.quantidade ?? ""
        ).trim();

        const quantidade = Number(
            quantidadeTexto
        );

        if (
            !quantidadeTexto ||
            !Number.isInteger(quantidade) ||
            quantidade < 0
        ) {
            mostrarMensagem(
                "erro",
                "Informe uma quantidade inteira válida."
            );

            return;
        }

        try {
            setSalvando(true);

            const dadosFormulario =
                new FormData();

            // =================================================
            // CAMPOS
            // =================================================

            dadosFormulario.append(
                "nome",
                nomeProduto
            );

            dadosFormulario.append(
                "descricao",
                String(
                    formulario.descricao ?? ""
                ).trim()
            );

            dadosFormulario.append(
                "preco",
                String(preco)
            );

            /*
             * Enviado como "estoque" porque o backend
             * normalmente utiliza req.body.estoque.
             */
            dadosFormulario.append(
                "estoque",
                String(quantidade)
            );

            /*
             * Também enviamos quantidade para facilitar
             * compatibilidade com diferentes controllers.
             */
            dadosFormulario.append(
                "quantidade",
                String(quantidade)
            );

            dadosFormulario.append(
                "categoria_id",
                categoriaId
            );

            // =================================================
            // IMAGEM
            // =================================================

            if (imagem) {
                dadosFormulario.append(
                    "imagem",
                    imagem
                );
            }

            // =================================================
            // URL
            // =================================================

            const url = editarId
                ? `${API_PRODUTOS}/${editarId}`
                : API_PRODUTOS;

            const metodo = editarId
                ? "PUT"
                : "POST";

            console.log(
                "================================"
            );

            console.log(
                "SALVANDO PRODUTO"
            );

            console.log(
                "Método:",
                metodo
            );

            console.log(
                "URL:",
                url
            );

            console.log(
                "================================"
            );

            // =================================================
            // FETCH
            // =================================================

            const resposta = await fetch(
                url,
                {
                    method: metodo,
                    body: dadosFormulario,
                }
            );

            let dados = {};

            const tipoConteudo =
                resposta.headers.get(
                    "content-type"
                ) || "";

            if (
                tipoConteudo.includes(
                    "application/json"
                )
            ) {
                try {
                    dados = await resposta.json();
                } catch {
                    dados = {};
                }
            } else {
                const texto =
                    await resposta.text();

                dados = {
                    mensagem: texto,
                };
            }

            console.log(
                "Resposta do servidor:",
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
                editarId
                    ? "Produto atualizado com sucesso."
                    : "Produto cadastrado com sucesso."
            );

            /*
             * Força o fechamento porque salvando ainda
             * está true neste momento.
             */
            fecharFormulario(true);

            await carregarProdutos();
        } catch (erro) {
            console.error(
                "Erro ao salvar produto:",
                erro
            );

            let mensagemErro =
                erro.message ||
                "Não foi possível salvar o produto.";

            /*
             * Mensagem mais clara para erro de conexão.
             */
            if (
                erro instanceof TypeError &&
                erro.message
                    .toLowerCase()
                    .includes("fetch")
            ) {
                mensagemErro =
                    "Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 5000.";
            }

            mostrarMensagem(
                "erro",
                mensagemErro
            );
        } finally {
            setSalvando(false);
        }
    };

    // =================================================
    // ELIMINAR
    // =================================================

    const eliminarProduto = (produto) => {
        if (!produto?.id) {
            mostrarMensagem(
                "erro",
                "Produto inválido."
            );

            return;
        }

        setConfirmacao({
            produto,
        });
    };

    // =================================================
    // EXECUTAR ELIMINAÇÃO
    // =================================================

    const executarEliminacao = async () => {
        if (
            !confirmacao ||
            executandoAcao
        ) {
            return;
        }

        try {
            setExecutandoAcao(true);

            const produto =
                confirmacao.produto;

            const resposta = await fetch(
                `${API_PRODUTOS}/${produto.id}`,
                {
                    method: "DELETE",

                    headers: {
                        Accept:
                            "application/json",
                    },
                }
            );

            let dados = {};

            const tipoConteudo =
                resposta.headers.get(
                    "content-type"
                ) || "";

            if (
                tipoConteudo.includes(
                    "application/json"
                )
            ) {
                try {
                    dados =
                        await resposta.json();
                } catch {
                    dados = {};
                }
            }

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
                "Produto eliminado com sucesso."
            );

            setConfirmacao(null);

            await carregarProdutos();
        } catch (erro) {
            console.error(
                "Erro ao eliminar produto:",
                erro
            );

            mostrarMensagem(
                "erro",
                erro.message ||
                "Não foi possível eliminar o produto."
            );
        } finally {
            setExecutandoAcao(false);
        }
    };

    // =================================================
    // CATEGORIAS DO FILTRO
    // =================================================

    const categoriasDoFiltro = [
        ...new Set(
            produtos
                .map(
                    (produto) =>
                        produto.categoria
                )
                .filter(Boolean)
        ),
    ].sort((a, b) =>
        String(a).localeCompare(
            String(b)
        )
    );

    // =================================================
    // FILTRAR PRODUTOS
    // =================================================

    const produtosFiltrados =
        produtos.filter((produto) => {
            const texto = pesquisa
                .toLowerCase()
                .trim();

            const nome = String(
                produto.nome || ""
            ).toLowerCase();

            const descricao = String(
                produto.descricao || ""
            ).toLowerCase();

            const categoria = String(
                produto.categoria || ""
            ).toLowerCase();

            const correspondePesquisa =
                !texto ||
                nome.includes(texto) ||
                descricao.includes(texto) ||
                categoria.includes(texto);

            const correspondeCategoria =
                filtroCategoria === "Todas" ||
                produto.categoria ===
                    filtroCategoria;

            return (
                correspondePesquisa &&
                correspondeCategoria
            );
        });

    // =================================================
    // ESTATÍSTICAS
    // =================================================

    const totalProdutos =
        produtos.length;

    const totalStock =
        produtos.reduce(
            (total, produto) =>
                total +
                Number(
                    produto.quantidade || 0
                ),
            0
        );

    const produtosSemStock =
        produtos.filter(
            (produto) =>
                Number(
                    produto.quantidade || 0
                ) <= 0
        ).length;

    const valorStock =
        produtos.reduce(
            (total, produto) =>
                total +
                Number(
                    produto.preco || 0
                ) *
                    Number(
                        produto.quantidade || 0
                    ),
            0
        );

    // =================================================
    // FORMATAR PREÇO
    // =================================================

    const formatarPreco = (preco) => {
        return Number(
            preco || 0
        ).toLocaleString(
            "pt-AO",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        );
    };

    // =================================================
    // ESTILO STOCK
    // =================================================

    const estiloStock = (quantidade) => {
        const valor = Number(
            quantidade || 0
        );

        if (valor <= 0) {
            return "bg-red-50 text-red-700 border-red-200";
        }

        if (valor <= 5) {
            return "bg-amber-50 text-amber-700 border-amber-200";
        }

        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    };

    // =================================================
    // RENDER
    // =================================================

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">

            {/* =================================================
                MENSAGEM
            ================================================= */}

            {mensagem && (
                <div
                    className={`
                        fixed right-5 top-5 z-[100]
                        flex max-w-[90vw] items-center gap-3
                        rounded-xl border px-5 py-4 shadow-xl
                        ${
                            mensagem.tipo === "sucesso"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-red-200 bg-red-50 text-red-700"
                        }
                    `}
                >
                    {mensagem.tipo === "sucesso" ? (
                        <FaCheck />
                    ) : (
                        <FaTimes />
                    )}

                    <span className="text-sm font-medium">
                        {mensagem.texto}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setMensagem(null)
                        }
                        className="ml-2 rounded p-1 hover:bg-black/5"
                    >
                        <FaTimes size={12} />
                    </button>
                </div>
            )}

            <div className="mx-auto max-w-7xl">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                    <div className="flex items-center gap-3">

                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
                            <FaBox size={21} />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                                Produtos
                            </h1>

                            <p className="text-sm text-slate-500">
                                Gestão dos produtos e stock
                            </p>
                        </div>

                    </div>

                    <button
                        type="button"
                        onClick={novoProduto}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
                    >
                        <FaPlus />
                        Novo produto
                    </button>

                </div>

                {/* =================================================
                    CARDS
                ================================================= */}

                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">
                            Produtos
                        </p>

                        <p className="mt-2 text-3xl font-bold text-slate-900">
                            {totalProdutos}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">
                            Total em stock
                        </p>

                        <p className="mt-2 text-3xl font-bold text-blue-600">
                            {totalStock}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">
                            Sem stock
                        </p>

                        <p className="mt-2 text-3xl font-bold text-red-600">
                            {produtosSemStock}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">
                            Valor do stock
                        </p>

                        <p className="mt-2 text-2xl font-bold text-emerald-600">
                            {formatarPreco(
                                valorStock
                            )}{" "}
                            Kz
                        </p>
                    </div>

                </div>

                {/* =================================================
                    FILTROS
                ================================================= */}

                <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

                    <div className="flex flex-col gap-3 lg:flex-row">

                        <div className="relative flex-1">

                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                            <input
                                type="text"
                                value={pesquisa}
                                onChange={(e) =>
                                    setPesquisa(
                                        e.target.value
                                    )
                                }
                                placeholder="Pesquisar produto, descrição ou categoria..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                            />

                        </div>

                        <select
                            value={
                                filtroCategoria
                            }
                            onChange={(e) =>
                                setFiltroCategoria(
                                    e.target.value
                                )
                            }
                            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                        >
                            <option value="Todas">
                                Todas as categorias
                            </option>

                            {categoriasDoFiltro.map(
                                (categoria) => (
                                    <option
                                        key={
                                            categoria
                                        }
                                        value={
                                            categoria
                                        }
                                    >
                                        {categoria}
                                    </option>
                                )
                            )}
                        </select>

                    </div>

                </div>

                {/* =================================================
                    TABELA
                ================================================= */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-100 px-5 py-4">

                        <h2 className="font-bold text-slate-900">
                            Lista de produtos
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            {produtosFiltrados.length}{" "}
                            {produtosFiltrados.length ===
                            1
                                ? "produto"
                                : "produtos"}{" "}
                            encontrados
                        </p>

                    </div>

                    {carregando ? (
                        <div className="flex min-h-[300px] items-center justify-center">
                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
                        </div>
                    ) : produtosFiltrados.length ===
                        0 ? (
                        <div className="flex min-h-[320px] flex-col items-center justify-center px-5 text-center">

                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                <FaBox size={25} />
                            </div>

                            <h3 className="font-semibold text-slate-800">
                                Nenhum produto encontrado
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Tente alterar os filtros ou
                                cadastre um novo produto.
                            </p>

                            <button
                                type="button"
                                onClick={
                                    novoProduto
                                }
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                            >
                                <FaPlus />
                                Novo produto
                            </button>

                        </div>
                    ) : (
                        <div className="overflow-x-auto">

                            <table className="w-full min-w-[1000px]">

                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/70">

                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Produto
                                        </th>

                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Categoria
                                        </th>

                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Preço
                                        </th>

                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Stock
                                        </th>

                                        <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Ações
                                        </th>

                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">

                                    {produtosFiltrados.map(
                                        (produto) => {
                                            const quantidade =
                                                Number(
                                                    produto.quantidade ||
                                                    0
                                                );

                                            const urlImagem =
                                                produto.cloudinary_url ||
                                                produto.imagem_url ||
                                                "";

                                            return (
                                                <tr
                                                    key={
                                                        produto.id
                                                    }
                                                    className="transition hover:bg-slate-50/70"
                                                >

                                                    <td className="px-5 py-4">

                                                        <div className="flex items-center gap-3">

                                                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">

                                                                {urlImagem ? (
                                                                    <img
                                                                        src={
                                                                            urlImagem
                                                                        }
                                                                        alt={
                                                                            produto.nome ||
                                                                            "Produto"
                                                                        }
                                                                        className="h-full w-full object-cover"
                                                                        onError={(
                                                                            e
                                                                        ) => {
                                                                            e.currentTarget.style.display =
                                                                                "none";
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                                                                        <FaImage />
                                                                    </div>
                                                                )}

                                                            </div>

                                                            <div className="max-w-xs">

                                                                <p className="font-semibold text-slate-800">
                                                                    {produto.nome ||
                                                                        "Sem nome"}
                                                                </p>

                                                                <p className="mt-0.5 truncate text-xs text-slate-500">
                                                                    {produto.descricao ||
                                                                        "Sem descrição"}
                                                                </p>

                                                            </div>

                                                        </div>

                                                    </td>

                                                    <td className="px-5 py-4">

                                                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">

                                                            <FaTag size={10} />

                                                            {produto.categoria ||
                                                                "Sem categoria"}

                                                        </span>

                                                    </td>

                                                    <td className="px-5 py-4">

                                                        <div className="flex items-center gap-2">

                                                            <FaMoneyBillWave className="text-emerald-500" />

                                                            <span className="text-sm font-semibold text-slate-700">
                                                                {formatarPreco(
                                                                    produto.preco
                                                                )}{" "}
                                                                Kz
                                                            </span>

                                                        </div>

                                                    </td>

                                                    <td className="px-5 py-4">

                                                        <span
                                                            className={`
                                                                inline-flex rounded-full
                                                                border px-3 py-1.5
                                                                text-xs font-semibold
                                                                ${estiloStock(
                                                                    quantidade
                                                                )}
                                                            `}
                                                        >
                                                            {quantidade}{" "}
                                                            unidade
                                                            {quantidade ===
                                                            1
                                                                ? ""
                                                                : "s"}
                                                        </span>

                                                    </td>

                                                    <td className="px-5 py-4">

                                                        <div className="flex justify-end gap-1">

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    editarProduto(
                                                                        produto
                                                                    )
                                                                }
                                                                title="Editar"
                                                                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                                            >
                                                                <FaEdit size={14} />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    eliminarProduto(
                                                                        produto
                                                                    )
                                                                }
                                                                title="Eliminar"
                                                                className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
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
                MODAL PRODUTO
            ================================================= */}

            {mostrarFormulario && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
                    onMouseDown={(e) => {
                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            fecharFormulario();
                        }
                    }}
                >

                    <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

                        {/* HEADER */}

                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">

                            <div>

                                <h2 className="text-lg font-bold text-slate-900">
                                    {editarId
                                        ? "Editar produto"
                                        : "Novo produto"}
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Preencha os dados do produto
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={
                                    fecharFormulario
                                }
                                disabled={
                                    salvando
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <FaTimes />
                            </button>

                        </div>

                        {/* FORM */}

                        <form
                            onSubmit={
                                salvarProduto
                            }
                            encType="multipart/form-data"
                            className="p-6"
                        >

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                                {/* NOME */}

                                <div className="md:col-span-2">

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Nome do produto

                                        <span className="ml-1 text-red-500">
                                            *
                                        </span>
                                    </label>

                                    <input
                                        ref={
                                            inputNomeRef
                                        }
                                        type="text"
                                        name="nome"
                                        value={
                                            formulario.nome
                                        }
                                        onChange={
                                            alterarFormulario
                                        }
                                        required
                                        maxLength={150}
                                        autoComplete="off"
                                        placeholder="Ex.: Shampoo profissional"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                                    />

                                    <p className="mt-1 text-xs text-slate-400">
                                        Este campo é obrigatório.
                                    </p>

                                </div>

                                {/* CATEGORIA */}

                                <div className="relative">

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">

                                        Categoria

                                        <span className="ml-1 text-red-500">
                                            *
                                        </span>

                                    </label>

                                    <div className="relative">

                                        <FaTag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                                        <input
                                            ref={
                                                inputCategoriaRef
                                            }
                                            type="text"
                                            name="categoria_nome"
                                            value={
                                                formulario.categoria_nome
                                            }
                                            onChange={
                                                alterarFormulario
                                            }
                                            onFocus={
                                                abrirCategorias
                                            }
                                            onBlur={() => {
                                                setTimeout(
                                                    () =>
                                                        setMostrarCategorias(
                                                            false
                                                        ),
                                                    200
                                                );
                                            }}
                                            autoComplete="off"
                                            placeholder={
                                                carregandoCategorias
                                                    ? "Carregando categorias..."
                                                    : "Pesquisar categoria..."
                                            }
                                            disabled={
                                                carregandoCategorias
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm outline-none focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        />

                                    </div>

                                    {mostrarCategorias && (
                                        <div className="absolute left-0 right-0 top-full z-[80] mt-2 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">

                                            {categoriasFiltradas.length >
                                            0 ? (
                                                categoriasFiltradas.map(
                                                    (
                                                        categoria
                                                    ) => (
                                                        <button
                                                            type="button"
                                                            key={
                                                                categoria.id
                                                            }
                                                            onMouseDown={(
                                                                e
                                                            ) => {
                                                                e.preventDefault();

                                                                selecionarCategoria(
                                                                    categoria
                                                                );
                                                            }}
                                                            className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50"
                                                        >

                                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                                                <FaTag size={13} />
                                                            </div>

                                                            <div className="min-w-0 flex-1">

                                                                <p className="truncate text-sm font-semibold text-slate-800">
                                                                    {
                                                                        categoria.nome
                                                                    }
                                                                </p>

                                                                {categoria.descricao && (
                                                                    <p className="mt-0.5 truncate text-xs text-slate-500">
                                                                        {
                                                                            categoria.descricao
                                                                        }
                                                                    </p>
                                                                )}

                                                            </div>

                                                            <span className="text-[10px] font-semibold text-slate-400">
                                                                #
                                                                {
                                                                    categoria.id
                                                                }
                                                            </span>

                                                        </button>
                                                    )
                                                )
                                            ) : (
                                                <div className="px-4 py-5 text-center">

                                                    <FaTag className="mx-auto mb-2 text-slate-300" />

                                                    <p className="text-sm font-medium text-slate-600">
                                                        Nenhuma categoria encontrada
                                                    </p>

                                                </div>
                                            )}

                                        </div>
                                    )}

                                    {formulario.categoria_id && (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600">

                                            <FaCheck />

                                            Categoria selecionada:

                                            <strong>
                                                {
                                                    formulario.categoria_nome
                                                }
                                            </strong>

                                        </div>
                                    )}

                                </div>

                                {/* PREÇO */}

                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">

                                        Preço

                                        <span className="ml-1 text-red-500">
                                            *
                                        </span>

                                    </label>

                                    <div className="relative">

                                        <FaMoneyBillWave className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                                        <input
                                            type="number"
                                            name="preco"
                                            value={
                                                formulario.preco
                                            }
                                            onChange={
                                                alterarFormulario
                                            }
                                            required
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm outline-none focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                                        />

                                    </div>

                                </div>

                                {/* QUANTIDADE */}

                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">

                                        Quantidade em stock

                                        <span className="ml-1 text-red-500">
                                            *
                                        </span>

                                    </label>

                                    <div className="relative">

                                        <FaWarehouse className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                                        <input
                                            type="number"
                                            name="quantidade"
                                            value={
                                                formulario.quantidade
                                            }
                                            onChange={
                                                alterarFormulario
                                            }
                                            required
                                            min="0"
                                            step="1"
                                            placeholder="0"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm outline-none focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                                        />

                                    </div>

                                </div>

                                {/* IMAGEM */}

                                <div className="md:col-span-2">

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">

                                        Imagem do produto

                                        {!editarId && (
                                            <span className="ml-1 text-red-500">
                                                *
                                            </span>
                                        )}

                                    </label>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[180px_1fr]">

                                        <div className="h-44 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">

                                            {imagemPreview ? (
                                                <img
                                                    src={
                                                        imagemPreview
                                                    }
                                                    alt="Preview"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : imagemExistente ? (
                                                <img
                                                    src={
                                                        imagemExistente
                                                    }
                                                    alt="Imagem atual"
                                                    className="h-full w-full object-cover"
                                                    onError={(
                                                        e
                                                    ) => {
                                                        e.currentTarget.style.display =
                                                            "none";
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">

                                                    <FaImage
                                                        size={
                                                            35
                                                        }
                                                    />

                                                    <span className="mt-2 text-xs">
                                                        Sem imagem
                                                    </span>

                                                </div>
                                            )}

                                        </div>

                                        <div className="flex flex-col justify-center">

                                            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5">

                                                <div className="flex flex-col items-center text-center">

                                                    <FaCloudUploadAlt
                                                        size={
                                                            32
                                                        }
                                                        className="text-slate-400"
                                                    />

                                                    <p className="mt-2 text-sm font-semibold text-slate-700">
                                                        Selecionar imagem
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-500">
                                                        PNG, JPG, JPEG
                                                        ou WEBP •
                                                        máximo 5 MB
                                                    </p>

                                                    <div className="mt-4 flex flex-wrap justify-center gap-2">

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                inputImagemRef.current?.click()
                                                            }
                                                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                                                        >
                                                            <FaImage />

                                                            Escolher
                                                            imagem
                                                        </button>

                                                        {imagem && (
                                                            <button
                                                                type="button"
                                                                onClick={
                                                                    limparImagem
                                                                }
                                                                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100"
                                                            >
                                                                <FaTimes />

                                                                Remover
                                                            </button>
                                                        )}

                                                    </div>

                                                    {imagem && (
                                                        <p className="mt-3 max-w-full truncate text-xs text-emerald-600">
                                                            {
                                                                imagem.name
                                                            }
                                                        </p>
                                                    )}

                                                    {editarId &&
                                                        !imagem &&
                                                        cloudinaryIdExistente && (
                                                            <p className="mt-3 text-xs text-slate-500">
                                                                A imagem atual será
                                                                mantida.
                                                            </p>
                                                        )}

                                                </div>

                                            </div>

                                            <input
                                                ref={
                                                    inputImagemRef
                                                }
                                                type="file"
                                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                                onChange={
                                                    selecionarImagem
                                                }
                                                className="hidden"
                                            />

                                        </div>

                                    </div>

                                </div>

                                {/* DESCRIÇÃO */}

                                <div className="md:col-span-2">

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Descrição
                                    </label>

                                    <textarea
                                        name="descricao"
                                        value={
                                            formulario.descricao
                                        }
                                        onChange={
                                            alterarFormulario
                                        }
                                        rows={4}
                                        maxLength={1000}
                                        placeholder="Descreva o produto..."
                                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                                    />

                                    <div className="mt-1 text-right text-xs text-slate-400">
                                        {
                                            formulario
                                                .descricao
                                                .length
                                        }{" "}
                                        / 1000
                                    </div>

                                </div>

                            </div>

                            {/* FOOTER */}

                            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

                                <button
                                    type="button"
                                    onClick={
                                        fecharFormulario
                                    }
                                    disabled={
                                        salvando
                                    }
                                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        salvando ||
                                        carregandoCategorias
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >

                                    {salvando && (
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    )}

                                    {editarId
                                        ? "Guardar alterações"
                                        : "Cadastrar produto"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

            {/* =================================================
                CONFIRMAÇÃO
            ================================================= */}

            {confirmacao && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">

                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

                        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                            <FaTrash />
                        </div>

                        <h3 className="text-center text-lg font-bold text-slate-900">
                            Eliminar produto?
                        </h3>

                        <p className="mt-2 text-center text-sm leading-6 text-slate-500">

                            Tem certeza que deseja eliminar
                            o produto{" "}

                            <strong className="text-slate-700">
                                {
                                    confirmacao
                                        .produto
                                        .nome
                                }
                            </strong>
                            ?

                            <br />

                            Esta ação não poderá ser desfeita.

                        </p>

                        <div className="mt-6 grid grid-cols-2 gap-3">

                            <button
                                type="button"
                                onClick={() =>
                                    setConfirmacao(
                                        null
                                    )
                                }
                                disabled={
                                    executandoAcao
                                }
                                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Voltar
                            </button>

                            <button
                                type="button"
                                onClick={
                                    executarEliminacao
                                }
                                disabled={
                                    executandoAcao
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >

                                {executandoAcao && (
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                )}

                                Eliminar

                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}