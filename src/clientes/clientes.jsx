import {
    BrowserRouter,
    Routes,
    Route,
    NavLink,
    Navigate,
    useNavigate,
    useLocation
} from "react-router-dom";

import {
    FaUsers,
    FaBars,
    FaTimes,
    FaTachometerAlt,
    FaCog,
    FaSignOutAlt,
    FaLock,
    FaEye,
    FaEyeSlash,
    FaUserPlus,
    FaUser,
    FaShoppingCart,
    FaShoppingBag,
    FaTruck,
    FaStore,
    FaCheckCircle,
    FaTags,
    FaClipboardList,
    FaUserCog,
    FaReceipt,
    FaExclamationTriangle,
    FaPhone,
    FaEnvelope,
    FaSave
    ,FaSearch
    ,FaPlus
    ,FaMinus
    ,FaTrash
    ,FaArrowRight
    ,FaBoxOpen
    ,FaClock
    ,FaCheck
    ,FaMoneyBillWave
    ,FaCalendarAlt
} from "react-icons/fa";

import {
    useEffect,
    useState
} from "react";

import LogoEmpresa from '../assets/Logo ZungaExpress.png';
import { API_URL } from "../../servidor/api";


export function obterUsuario() {
    try {
        const fontes = [
            localStorage.getItem("usuario"),
            sessionStorage.getItem("usuario")
        ];

        for (const texto of fontes) {
            if (!texto) {
                continue;
            }

            try {
                const usuario = JSON.parse(texto);

                if (
                    usuario &&
                    typeof usuario === "object" &&
                    !Array.isArray(usuario)
                ) {
                    return usuario;
                }
            } catch {
                continue;
            }
        }

        return null;
    } catch (error) {
        console.error(
            "Erro ao obter usuário:",
            error
        );

        return null;
    }
}

// =====================================================
// LIMPAR AUTENTICAÇÃO
// =====================================================

export function limparAutenticacao() {
    const chaves = [
        "token",
        "accessToken",
        "jwt",
        "access_token",
        "usuario"
    ];

    chaves.forEach((chave) => {
        localStorage.removeItem(chave);
        sessionStorage.removeItem(chave);
    });
}

// =====================================================
// LER RESPOSTA DA API
// =====================================================

export async function lerResposta(resposta) {
    if (!resposta) {
        return {};
    }

    try {
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
    } catch (error) {
        console.error(
            "Erro ao ler resposta:",
            error
        );

        return {};
    }
}

// =====================================================
// EXTRAIR TOKEN
// =====================================================

function extrairToken(dados) {
    if (
        !dados ||
        typeof dados !== "object"
    ) {
        return null;
    }

    const possiveisTokens = [
        dados.token,
        dados.accessToken,
        dados.jwt,
        dados.access_token,

        dados.data?.token,
        dados.data?.accessToken,
        dados.data?.jwt,
        dados.data?.access_token,

        dados.usuario?.token,
        dados.usuario?.accessToken,
        dados.usuario?.jwt,
        dados.usuario?.access_token,

        dados.cliente?.token,
        dados.cliente?.accessToken,
        dados.cliente?.jwt,
        dados.cliente?.access_token,

        dados.admin?.token,
        dados.admin?.accessToken,
        dados.admin?.jwt,
        dados.admin?.access_token,

        dados.user?.token,
        dados.user?.accessToken,
        dados.user?.jwt,
        dados.user?.access_token
    ];

    for (const token of possiveisTokens) {
        if (
            typeof token === "string" &&
            token.trim()
        ) {
            return token.trim();
        }
    }

    return null;
}

// =====================================================
// EXTRAIR USUÁRIO
// =====================================================

function extrairUsuario(dados) {
    if (
        !dados ||
        typeof dados !== "object"
    ) {
        return null;
    }

    if (
        dados.usuario &&
        typeof dados.usuario === "object"
    ) {
        return dados.usuario;
    }

    if (
        dados.cliente &&
        typeof dados.cliente === "object"
    ) {
        return dados.cliente;
    }

    if (
        dados.admin &&
        typeof dados.admin === "object"
    ) {
        return dados.admin;
    }

    if (
        dados.user &&
        typeof dados.user === "object"
    ) {
        return dados.user;
    }

    if (
        dados.data?.usuario &&
        typeof dados.data.usuario === "object"
    ) {
        return dados.data.usuario;
    }

    if (
        dados.data?.cliente &&
        typeof dados.data.cliente === "object"
    ) {
        return dados.data.cliente;
    }

    if (
        dados.data?.admin &&
        typeof dados.data.admin === "object"
    ) {
        return dados.data.admin;
    }

    if (
        dados.data?.user &&
        typeof dados.data.user === "object"
    ) {
        return dados.data.user;
    }

    if (
        dados.data &&
        typeof dados.data === "object" &&
        !Array.isArray(dados.data)
    ) {
        const usuarioData = {
            ...dados.data
        };

        delete usuarioData.token;
        delete usuarioData.accessToken;
        delete usuarioData.jwt;
        delete usuarioData.access_token;

        if (
            Object.keys(usuarioData).length > 0
        ) {
            return usuarioData;
        }
    }

    const usuarioDireto = {
        ...dados
    };

    delete usuarioDireto.token;
    delete usuarioDireto.accessToken;
    delete usuarioDireto.jwt;
    delete usuarioDireto.access_token;

    delete usuarioDireto.success;
    delete usuarioDireto.sucesso;
    delete usuarioDireto.mensagem;
    delete usuarioDireto.message;
    delete usuarioDireto.erro;
    delete usuarioDireto.error;

    delete usuarioDireto.data;
    delete usuarioDireto.admin;
    delete usuarioDireto.cliente;
    delete usuarioDireto.usuario;
    delete usuarioDireto.user;

    if (
        Object.keys(usuarioDireto).length > 0
    ) {
        return usuarioDireto;
    }

    return null;
}

// =====================================================
// SALVAR AUTENTICAÇÃO
// =====================================================

function salvarAutenticacao(
    dados,
    tipo
) {
    const token = extrairToken(dados);

    if (!token) {
        throw new Error(
            "O servidor não enviou o token de autenticação."
        );
    }

    const usuarioRecebido =
        extrairUsuario(dados) || {};

    const usuario = {
        ...usuarioRecebido,
        tipo
    };

    limparAutenticacao();

    localStorage.setItem(
        "token",
        token
    );

    localStorage.setItem(
        "accessToken",
        token
    );

    localStorage.setItem(
        "usuario",
        JSON.stringify(usuario)
    );

    sessionStorage.setItem(
        "token",
        token
    );

    sessionStorage.setItem(
        "accessToken",
        token
    );

    sessionStorage.setItem(
        "usuario",
        JSON.stringify(usuario)
    );

    return {
        token,
        usuario
    };
}

// =====================================================
// FETCH PERSONALIZADO DA API
// =====================================================

export async function apiFetch(
    url,
    options = {}
) {
    const token = obterToken();

    const headers = {
        ...(options.headers || {})
    };

    if (
        options.body &&
        !(options.body instanceof FormData)
    ) {
        headers["Content-Type"] =
            headers["Content-Type"] ||
            "application/json";
    }

    headers["Accept"] =
        headers["Accept"] ||
        "application/json";

    if (token) {
        headers["Authorization"] =
            `Bearer ${token}`;
    }

    let resposta;

    try {
        resposta = await fetch(
            url,
            {
                ...options,
                headers
            }
        );
    } catch (error) {
        console.error(
            "Erro de conexão:",
            error
        );

        throw new Error(
            "Não foi possível conectar ao servidor. Verifique se o backend está funcionando na porta 5000."
        );
    }

    if (
        (
            resposta.status === 401 ||
            resposta.status === 403
        ) &&
        token
    ) {
        limparAutenticacao();

        if (
            window.location.pathname !==
            "/login"
        ) {
            window.location.href =
                "/login";
        }

        throw new Error(
            "Sessão expirada. Faça login novamente."
        );
    }

    return resposta;
}

function ModalConfirmarSaida({
    aberto,
    onCancelar,
    onConfirmar
}) {
    if (!aberto) {
        return null;
    }

    return (
        <div
            className="
                fixed inset-0 z-[9999]
                flex items-center justify-center
                bg-black/60 p-4 backdrop-blur-sm
            "
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    onCancelar();
                }
            }}
        >
            <div
                className="
                    w-full max-w-lg
                    rounded-3xl border
                    border-slate-200 bg-white
                    p-6 shadow-2xl
                "
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div
                    className="
                        flex h-14 w-14 items-center
                        justify-center rounded-2xl
                        bg-red-100 text-red-600
                    "
                >
                    <FaExclamationTriangle size={24} />
                </div>

                <h2
                    className="
                        mt-5 text-xl font-bold
                        text-slate-900
                    "
                >
                    Confirmar saída
                </h2>

                <p
                    className="
                        mt-2 text-sm leading-6
                        text-slate-500
                    "
                >
                    Tem certeza de que deseja terminar a sessão?
                    Será necessário iniciar sessão novamente para
                    acessar o painel.
                </p>

                <div
                    className="
                        mt-7 flex flex-col-reverse
                        gap-3 sm:flex-row sm:justify-end
                    "
                >
                    <button
                        type="button"
                        onClick={onCancelar}
                        className="
                            rounded-xl border
                            border-slate-200 px-5 py-3
                            text-sm font-bold text-slate-700
                            hover:bg-slate-50
                        "
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        onClick={onConfirmar}
                        className="
                            flex items-center justify-center
                            gap-2 rounded-xl bg-red-600
                            px-5 py-3 text-sm font-bold
                            text-white hover:bg-red-700
                        "
                    >
                        <FaSignOutAlt />
                        Sim, sair
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function PaginaCliente() {
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState(obterUsuario());
    const [produtos, setProdutos] = useState([]);
    const [pedidos, setPedidos] = useState([]);
    const [kilapes, setKilapes] = useState([]);
    const [carrinho, setCarrinho] = useState(() => {
        try {
            return JSON.parse(sessionStorage.getItem("carrinho_cliente") || "[]");
        } catch {
            return [];
        }
    });
    const [pesquisa, setPesquisa] = useState("");
    const [categoria, setCategoria] = useState("Todas");
    const [aba, setAba] = useState("comprar");
    const [carregando, setCarregando] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [enviandoKilape, setEnviandoKilape] = useState(false);
    const [valorKilape, setValorKilape] = useState("");
    const [observacaoKilape, setObservacaoKilape] = useState("");
    const [mensagem, setMensagem] = useState(null);
    const [modalSaida, setModalSaida] = useState(false);

    const clienteId = usuario?.id || usuario?.cliente_id;
    const nomeCliente = usuario?.nome || usuario?.nome_completo || "Cliente";
    const formatarKwanza = (valor) => `${new Intl.NumberFormat("pt-AO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(valor) || 0)} Kz`;
    const obterUrlImagemProduto = (item) => {
        const candidatos = [
            item?.cloudinary_url,
            item?.imagem_url,
            item?.imagemUrl,
            item?.imagem,
            item?.image,
            item?.url_imagem,
            item?.urlImagem,
            item?.foto,
            item?.produto?.cloudinary_url,
            item?.produto?.imagem_url,
            item?.produto?.imagem,
        ];

        for (const valor of candidatos) {
            if (typeof valor === "string" && valor.trim()) {
                return valor.trim();
            }
        }

        return "";
    };
    const lerLista = (dados, chave) => Array.isArray(dados) ? dados : (dados[chave] || dados.data || dados.rows || []);

    const carregarDados = async () => {
        setCarregando(true);
        try {
            const [respostaProdutos, respostaPedidos, respostaKilapes] = await Promise.all([
                fetch(`${API_URL}/produtos`),
                clienteId ? fetch(`${API_URL}/pedidos/cliente/${clienteId}`) : Promise.resolve(null),
                clienteId ? fetch(`${API_URL}/kilapes/meus?cliente_id=${clienteId}`) : Promise.resolve(null)
            ]);
            const dadosProdutos = await lerResposta(respostaProdutos);
            if (!respostaProdutos.ok) throw new Error(dadosProdutos.mensagem || "Não foi possível carregar os produtos.");
            setProdutos(lerLista(dadosProdutos, "produtos").map((item) => ({
                ...item,
                id: item.id ?? item.produto_id,
                preco: Number(item.preco ?? item.valor ?? 0),
                estoque: Number(item.estoque ?? item.quantidade ?? item.stock ?? 0),
                categoria: item.categoria ?? item.categoria_nome ?? "Sem categoria",
                imagem: obterUrlImagemProduto(item)
            })));
            if (respostaPedidos) {
                const dadosPedidos = await lerResposta(respostaPedidos);
                if (respostaPedidos.ok) setPedidos(lerLista(dadosPedidos, "pedidos"));
            }
            if (respostaKilapes) {
                const dadosKilapes = await lerResposta(respostaKilapes);
                if (respostaKilapes.ok) setKilapes(lerLista(dadosKilapes, "kilapes"));
            }
        } catch (error) {
            setMensagem({ tipo: "erro", texto: error.message || "Não foi possível carregar a loja." });
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        const atual = obterUsuario();
        setUsuario(atual);
        carregarDados();
    }, []);

    useEffect(() => {
        sessionStorage.setItem("carrinho_cliente", JSON.stringify(carrinho));
    }, [carrinho]);

    const categorias = ["Todas", ...new Set(produtos.map((item) => item.categoria).filter(Boolean))];
    const produtosFiltrados = produtos.filter((produto) => {
        const termo = pesquisa.toLowerCase();
        return (categoria === "Todas" || produto.categoria === categoria) &&
            (!termo || `${produto.nome} ${produto.descricao}`.toLowerCase().includes(termo));
    });
    const totalCarrinho = carrinho.reduce((total, item) => total + item.preco * item.quantidade, 0);
    const quantidadeCarrinho = carrinho.reduce((total, item) => total + item.quantidade, 0);

    const adicionar = (produto) => {
        if (produto.estoque < 1) return;
        setCarrinho((atual) => {
            const existente = atual.find((item) => Number(item.id) === Number(produto.id));
            if (existente) return atual.map((item) => item.id === produto.id ? { ...item, quantidade: Math.min(item.quantidade + 1, produto.estoque) } : item);
            return [...atual, { id: produto.id, nome: produto.nome, preco: produto.preco, imagem: produto.imagem, quantidade: 1, estoque: produto.estoque }];
        });
        setMensagem({ tipo: "sucesso", texto: "Produto adicionado ao carrinho." });
    };

    const alterarQuantidade = (id, incremento) => setCarrinho((atual) => atual.map((item) => item.id === id ? { ...item, quantidade: Math.max(0, Math.min(item.quantidade + incremento, item.estoque)) } : item).filter((item) => item.quantidade > 0));

    const finalizarPedido = async () => {
        if (!clienteId || !carrinho.length) return;
        setEnviando(true);
        try {
            const resposta = await fetch(`${API_URL}/pedidos`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ cliente_id: Number(clienteId), produtos: carrinho.map((item) => ({ produto_id: Number(item.id), quantidade: item.quantidade })) })
            });
            const dados = await lerResposta(resposta);
            if (!resposta.ok) throw new Error(dados.mensagem || dados.message || "Não foi possível enviar o pedido.");
            setCarrinho([]);
            setMensagem({ tipo: "sucesso", texto: "Pedido realizado com sucesso!" });
            setAba("pedidos");
            await carregarDados();
        } catch (error) {
            setMensagem({ tipo: "erro", texto: error.message });
        } finally {
            setEnviando(false);
        }
    };

    const solicitarKilape = async (evento) => {
        evento.preventDefault();

        const valor = Number(String(valorKilape).replace(",", "."));
        if (!clienteId || !Number.isFinite(valor) || valor <= 0) {
            setMensagem({ tipo: "erro", texto: "Informe um valor válido para o Kilape." });
            return;
        }

        setEnviandoKilape(true);
        try {
            const resposta = await fetch(`${API_URL}/kilapes`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({
                    cliente_id: Number(clienteId),
                    valor,
                    observacao: observacaoKilape.trim() || null
                })
            });
            const dados = await lerResposta(resposta);
            if (!resposta.ok) throw new Error(dados.mensagem || dados.message || "Não foi possível solicitar o Kilape.");
            setValorKilape("");
            setObservacaoKilape("");
            setMensagem({ tipo: "sucesso", texto: "Solicitação de Kilape enviada com sucesso." });
            await carregarDados();
        } catch (error) {
            setMensagem({ tipo: "erro", texto: error.message });
        } finally {
            setEnviandoKilape(false);
        }
    };

    const cancelarKilape = async (id) => {
        try {
            const resposta = await fetch(`${API_URL}/kilapes/meus/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ cliente_id: Number(clienteId) })
            });
            const dados = await lerResposta(resposta);
            if (!resposta.ok) throw new Error(dados.mensagem || "Não foi possível cancelar o Kilape.");
            setMensagem({ tipo: "sucesso", texto: "Solicitação cancelada." });
            await carregarDados();
        } catch (error) {
            setMensagem({ tipo: "erro", texto: error.message });
        }
    };

    const confirmarLogout = () => {
        limparAutenticacao();
        setModalSaida(false);
        navigate("/login", { replace: true });
    };

    return (
        <div className="min-h-screen bg-[#f5f7f2] text-slate-900">
            <ModalConfirmarSaida aberto={modalSaida} onCancelar={() => setModalSaida(false)} onConfirmar={confirmarLogout} />
            <header className="sticky top-0 z-30 border-b border-slate-200px-5 py-4 border-[#28594c] bg-[#173f35]">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                    <div className="flex items-center gap-3"><img src={LogoEmpresa} alt="ZungaExpress" className="h-11 w-11 rounded-xl object-cover" /><div><h1 className="text-sm font-black uppercase tracking-[0.16em] text-[#e7b65b]">ZungaExpress</h1><p className="text-xs text-slate-500">A sua compra, no seu ritmo</p></div></div>
                    <div className="flex items-center gap-3"><span className="hidden text-sm text-white sm:block">Olá, <strong>{nomeCliente}</strong></span><button type="button" onClick={() => setModalSaida(true)} className="flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"><FaSignOutAlt /> Sair</button></div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
                {mensagem && <div className={`mb-5 flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold ${mensagem.tipo === "erro" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}><span>{mensagem.tipo === "erro" ? <FaTimes className="mr-2 inline" /> : <FaCheck className="mr-2 inline" />}{mensagem.texto}</span><button type="button" onClick={() => setMensagem(null)} aria-label="Fechar mensagem"><FaTimes /></button></div>}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200"><button type="button" onClick={() => setAba("comprar")} className={`rounded-lg px-4 py-2 text-sm font-bold ${aba === "comprar" ? "bg-[#173f35] text-white" : "text-slate-500"}`}><FaShoppingBag className="mr-2 inline" /> Comprar</button><button type="button" onClick={() => setAba("pedidos")} className={`rounded-lg px-4 py-2 text-sm font-bold ${aba === "pedidos" ? "bg-[#173f35] text-white" : "text-slate-500"}`}><FaClipboardList className="mr-2 inline" /> Meus pedidos</button><button type="button" onClick={() => setAba("kilapes")} className={`rounded-lg px-4 py-2 text-sm font-bold ${aba === "kilapes" ? "bg-[#173f35] text-white" : "text-slate-500"}`}><FaMoneyBillWave className="mr-2 inline" /> Kilapes</button></div>{aba === "comprar" && <button type="button" onClick={() => document.getElementById("carrinho")?.scrollIntoView({ behavior: "smooth" })} className="flex items-center gap-2 rounded-xl bg-[#e7b65b] px-4 py-2.5 text-sm font-black text-[#173f35] hover:bg-[#dca847]"><FaShoppingCart /> Carrinho ({quantidadeCarrinho})</button>}</div>

                {aba === "comprar" ? <div className="grid gap-8 lg:grid-cols-[1fr_360px]"><section><div className="mb-5 flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} placeholder="Procurar produto..." className="w-full rounded-xl border-0 bg-white py-3 pl-11 pr-4 text-sm shadow-sm ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-[#e7b65b]" /></label><select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="rounded-xl border-0 bg-white px-4 py-3 text-sm font-semibold shadow-sm ring-1 ring-slate-200 outline-none">{categorias.map((item) => <option key={item}>{item}</option>)}</select></div>{carregando ? <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">A carregar produtos...</div> : produtosFiltrados.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{produtosFiltrados.map((produto) => <article key={produto.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex h-40 items-center justify-center overflow-hidden bg-slate-100">{produto.imagem ? <img src={produto.imagem} alt={produto.nome} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <FaBoxOpen className="text-4xl text-slate-300" />}</div><div className="p-4"><p className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-700">{produto.categoria}</p><h3 className="font-bold text-slate-900">{produto.nome}</h3><p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">{produto.descricao || "Produto selecionado para si."}</p><div className="mt-4 flex items-center justify-between gap-2"><div><p className="font-black text-[#173f35]">{formatarKwanza(produto.preco)}</p><p className={`text-xs ${produto.estoque ? "text-slate-400" : "text-red-500"}`}>{produto.estoque ? `${produto.estoque} disponíveis` : "Esgotado"}</p></div><button type="button" disabled={!produto.estoque} onClick={() => adicionar(produto)} className="flex items-center gap-2 rounded-lg bg-[#173f35] px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"><FaPlus /> Adicionar</button></div></div></article>)}</div> : <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">Nenhum produto encontrado.</div>}</section>
                    <aside id="carrinho" className="h-fit rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:sticky lg:top-24"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-black">O seu carrinho</h2><FaShoppingCart className="text-[#e7b65b]" /></div>{carrinho.length ? <><div className="space-y-4">{carrinho.map((item) => <div key={item.id} className="flex gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">{item.imagem ? <img src={item.imagem} alt="" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <FaBoxOpen className="text-slate-300" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{item.nome}</p><p className="text-xs text-slate-500">{formatarKwanza(item.preco)}</p><div className="mt-1 flex items-center gap-2"><button type="button" onClick={() => alterarQuantidade(item.id, -1)} className="rounded bg-slate-100 p-1 text-xs"><FaMinus /></button><span className="w-4 text-center text-xs font-bold">{item.quantidade}</span><button type="button" onClick={() => alterarQuantidade(item.id, 1)} className="rounded bg-slate-100 p-1 text-xs"><FaPlus /></button><button type="button" onClick={() => alterarQuantidade(item.id, -item.quantidade)} className="ml-auto text-red-400"><FaTrash /></button></div></div></div>)}</div><div className="my-5 border-t border-slate-100 pt-4"><div className="flex justify-between font-black"><span>Total</span><span className="text-[#173f35]">{formatarKwanza(totalCarrinho)}</span></div></div><button type="button" disabled={enviando} onClick={finalizarPedido} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#173f35] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{enviando ? "A enviar..." : <>Finalizar pedido <FaArrowRight /></>}</button></> : <div className="py-8 text-center"><FaShoppingCart className="mx-auto mb-3 text-3xl text-slate-200" /><p className="text-sm font-semibold text-slate-500">O carrinho está vazio.</p><p className="mt-1 text-xs text-slate-400">Adicione produtos para começar.</p></div>}</aside></div> : aba === "pedidos" ? <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-black">Histórico de pedidos</h2><p className="mt-1 text-sm text-slate-500">Acompanhe cada compra até à entrega.</p></div><button type="button" onClick={carregarDados} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Atualizar pedidos"><FaClock /></button></div>{pedidos.length ? <div className="space-y-3">{pedidos.map((pedido) => <details key={pedido.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white"><summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-bold">Pedido #{pedido.id}</p><p className="mt-1 text-xs text-slate-500">{pedido.criado_em ? new Date(pedido.criado_em).toLocaleDateString("pt-AO") : "Data não disponível"}</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold capitalize text-amber-700">{pedido.status || "pendente"}</span><strong className="text-sm text-[#173f35]">{formatarKwanza(pedido.total)}</strong></div></summary><div className="border-t border-slate-100 bg-slate-50/60 p-4"><div className="space-y-3">{pedido.itens?.length ? pedido.itens.map((item) => { const imagemItem = item.cloudinary_url || item.imagem_url || item.imagem || ""; return <div key={item.id} className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-100"><div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">{imagemItem ? <img src={imagemItem} alt={item.produto_nome || "Produto do pedido"} className="h-full w-full object-cover" /> : <FaBoxOpen className="text-xl text-slate-300" />}</div><div className="min-w-0 flex-1"><p className="font-semibold text-slate-800">{item.produto_nome || "Produto"}</p><p className="mt-1 text-xs text-slate-500">{item.quantidade} unidade(s) x {formatarKwanza(item.preco)}</p></div><strong className="text-sm text-[#173f35]">{formatarKwanza(item.subtotal)}</strong></div>; }) : <span className="text-sm text-slate-500">Itens do pedido indisponíveis.</span>}</div><div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-3 text-xs font-semibold text-slate-500"><span>Pagamento: {pedido.status_pagamento || "Pendente"}</span><span>Total: {formatarKwanza(pedido.total)}</span></div></div></details>)}</div> : <div className="py-12 text-center text-sm text-slate-500"><FaClipboardList className="mx-auto mb-3 text-3xl text-slate-200" />Ainda não fez nenhum pedido.</div>}</section> : null}
                {aba === "kilapes" && <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7"><div className="mb-7 flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Apoio financeiro</p><h2 className="text-2xl font-black text-slate-900">Solicitar Kilape</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Peça um valor, aguarde a aprovação e acompanhe o prazo diretamente na sua área de cliente.</p></div><div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Prazo padrão: 21 dias</div></div><div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]"><form onSubmit={solicitarKilape} className="rounded-2xl bg-[#f5f7f2] p-5"><label className="block text-sm font-bold text-slate-700">Valor pretendido</label><div className="relative mt-2"><FaMoneyBillWave className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700" /><input type="number" min="1" step="0.01" required value={valorKilape} onChange={(evento) => setValorKilape(evento.target.value)} placeholder="Ex.: 50000" className="w-full rounded-xl border-0 bg-white py-3 pl-11 pr-4 text-sm shadow-sm ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-[#e7b65b]" /></div><label className="mt-5 block text-sm font-bold text-slate-700">Observação <span className="font-normal text-slate-400">(opcional)</span></label><textarea value={observacaoKilape} onChange={(evento) => setObservacaoKilape(evento.target.value)} rows="4" placeholder="Explique brevemente a finalidade do Kilape" className="mt-2 w-full resize-none rounded-xl border-0 bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-[#e7b65b]" /><button type="submit" disabled={enviandoKilape} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#173f35] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{enviandoKilape ? "A enviar solicitação..." : <>Enviar solicitação <FaArrowRight /></>}</button></form><div><div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-black">Minhas solicitações</h3><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{kilapes.length} registo(s)</span></div>{kilapes.length ? <div className="space-y-3">{kilapes.map((kilape) => <article key={kilape.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold text-slate-900">Kilape #{kilape.id}</p><p className="mt-1 text-sm font-black text-[#173f35]">{formatarKwanza(kilape.valor)}</p></div><span className={`rounded-full px-3 py-1 text-xs font-black capitalize ${kilape.status === "aprovado" ? "bg-emerald-100 text-emerald-700" : kilape.status === "recusado" || kilape.status === "cancelado" || kilape.status === "atrasado" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{kilape.status || "pendente"}</span></div><div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2"><p><FaCalendarAlt className="mr-2 inline text-emerald-700" />Solicitado: {kilape.data_solicitacao ? new Date(kilape.data_solicitacao).toLocaleString("pt-AO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Não disponível"}</p><p><FaClock className="mr-2 inline text-emerald-700" />Vencimento: {kilape.data_vencimento ? new Date(kilape.data_vencimento).toLocaleDateString("pt-AO") : "Após aprovação"}</p></div>{kilape.observacao && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">{kilape.observacao}</p>}{kilape.status === "pendente" && <button type="button" onClick={() => cancelarKilape(kilape.id)} className="mt-4 text-xs font-bold text-red-600 hover:text-red-800">Cancelar solicitação</button>}</article>)}</div> : <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Ainda não possui solicitações de Kilape.</div>}</div></div></section>}
            </main>

            <footer className="border-t border-[#28594c] bg-[#173f35] text-white">
                <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
                    <div>
                        <div className="flex items-center gap-3">
                            <img
                                src={LogoEmpresa}
                                alt="ZungaExpress"
                                className="h-12 w-12 rounded-xl bg-white object-cover p-1"
                            />
                            <div>
                                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#e7b65b]">
                                    ZungaExpress
                                </p>
                                <p className="text-xs text-emerald-100/70">
                                    Compras simples. Entregas com confiança.
                                </p>
                            </div>
                        </div>
                        <p className="mt-5 max-w-sm text-sm leading-6 text-emerald-50/75">
                            A sua loja digital para encontrar produtos, fazer pedidos e acompanhar cada compra com tranquilidade.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-[#e7b65b]">
                            Aceder rapidamente
                        </h2>
                        <div className="mt-4 flex flex-col items-start gap-3 text-sm text-emerald-50/80">
                            <button
                                type="button"
                                onClick={() => setAba("comprar")}
                                className="transition hover:text-white"
                            >
                                Comprar produtos
                            </button>
                            <button
                                type="button"
                                onClick={() => setAba("pedidos")}
                                className="transition hover:text-white"
                            >
                                Ver meus pedidos
                            </button>
                            <button
                                type="button"
                                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                                className="transition hover:text-white"
                            >
                                Voltar ao início
                            </button>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-[#e7b65b]">
                            Atendimento
                        </h2>
                        <p className="mt-4 text-sm leading-6 text-emerald-50/80">
                            Estamos aqui para tornar a sua experiência de compra mais simples e segura.
                        </p>
                        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-emerald-50">
                            <FaCheckCircle className="text-[#e7b65b]" />
                            Compra segura na ZungaExpress
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/10">
                    <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-4 text-xs text-emerald-100/60 sm:px-8 md:flex-row md:items-center md:justify-between">
                        <p>© {new Date().getFullYear()} ZungaExpress. Todos os direitos reservados.</p>
                        <p>Feito para comprar melhor, todos os dias.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}