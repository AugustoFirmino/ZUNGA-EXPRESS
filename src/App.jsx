
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
    FaMoneyBillWave,
    FaCheckCircle,
    FaTags,
    FaClipboardList,
    FaUserCog,
    FaReceipt,
    FaExclamationTriangle,
    FaPhone,
    FaEnvelope,
    FaSave,
    FaCamera,
    FaImage
} from "react-icons/fa";

import {
    useEffect,
    useState
} from "react";

import LogoEmpresa from "./assets/Logo ZungaExpress.png";

import {API_URL} from "../servidor/api";

// =====================================================
// PÁGINAS ADMIN
// =====================================================

import Dashboard from "./paginas/Dashboard";
import Clientes from "./paginas/Clientes";
import Produtos from "./paginas/Produtos";
import Categorias from "./paginas/Categorias";
import Pedidos from "./paginas/Pedidos";
import Gestores from "./paginas/Gestores";
import Vendas from "./paginas/Vendas";
import Kilapes from "./paginas/Kilapes";
import GestaoGestores from "./Gestores/gestores";

// =====================================================
// PÁGINA CLIENTE
// =====================================================

import DashboardClientes from "./clientes/clientes";
import Home from "./home/home";

// =====================================================
// API
// =====================================================



// =====================================================
// TOKEN
// =====================================================

export function obterToken() {
    const chaves = [
        "token",
        "accessToken",
        "jwt",
        "access_token"
    ];

    for (const chave of chaves) {
        const local =
            localStorage.getItem(chave);

        if (
            typeof local === "string" &&
            local.trim()
        ) {
            return local.trim();
        }

        const session =
            sessionStorage.getItem(chave);

        if (
            typeof session === "string" &&
            session.trim()
        ) {
            return session.trim();
        }
    }

    return null;
}

// =====================================================
// USUÁRIO
// =====================================================


export function obterUsuario() {
    const fontes = [
        localStorage.getItem("usuario"),
        sessionStorage.getItem("usuario")
    ];

    for (const texto of fontes) {
        if (!texto) continue;

        try {
            const usuario =
                JSON.parse(texto);

            if (
                usuario &&
                typeof usuario === "object" &&
                !Array.isArray(usuario)
            ) {
                return usuario;
            }
        } catch (error) {
            console.error(
                "Erro ao interpretar usuário:",
                error
            );
        }
    }

    return null;
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
// LER RESPOSTA
// =====================================================

export async function lerResposta(resposta) {
    if (!resposta) {
        return {};
    }

    try {
        const texto =
            await resposta.text();

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

    const tokens = [
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

        dados.gestor?.token,
        dados.gestor?.accessToken,
        dados.gestor?.jwt,
        dados.gestor?.access_token,

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
        dados.user?.access_token,

        dados.gestor?.token,
        dados.gestor?.accessToken,
        dados.gestor?.jwt,
        dados.gestor?.access_token
    ];

    for (const token of tokens) {
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

    const possibilidades = [
        dados.usuario,
        dados.gestor,
        dados.cliente,
        dados.admin,
        dados.user,

        dados.data?.usuario,
        dados.data?.gestor,
        dados.data?.cliente,
        dados.data?.admin,
        dados.data?.user
    ];

    for (const usuario of possibilidades) {
        if (
            usuario &&
            typeof usuario === "object" &&
            !Array.isArray(usuario)
        ) {
            return usuario;
        }
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
            Object.keys(usuarioData).length
        ) {
            return usuarioData;
        }
    }

    const usuarioDireto = {
        ...dados
    };

    const camposRemover = [
        "token",
        "accessToken",
        "jwt",
        "access_token",
        "success",
        "sucesso",
        "mensagem",
        "message",
        "erro",
        "error",
        "data",
        "admin",
        "cliente",
        "gestor",
        "usuario",
        "user"
    ];

    camposRemover.forEach((campo) => {
        delete usuarioDireto[campo];
    });

    if (
        Object.keys(usuarioDireto).length
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
    const token =
        extrairToken(dados);

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
// FETCH API
// =====================================================

export async function apiFetch(
    url,
    options = {}
) {
    const token =
        obterToken();

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

// =====================================================
// VERIFICAR SE EXISTE ADMIN
// =====================================================

export async function verificarExistenciaAdmin() {
  
    try {
        const resposta =
            await fetch(
                `${API_URL}/admin/status`,
                {
                    method: "GET",
                    headers: {
                        Accept:
                            "application/json"
                    },
                    cache: "no-store"
                }
            );

        const dados =
            await lerResposta(
                resposta
            );

        if (!resposta.ok) {
            throw new Error(
                dados.mensagem ||
                dados.message ||
                "Não foi possível verificar o administrador."
            );
        }

        /*
         * Aceita:
         *
         * { existe: true }
         *
         * ou
         *
         * { existeAdmin: true }
         *
         * ou
         *
         * { adminExiste: true }
         */

        return Boolean(
            dados.existe ??
            dados.existeAdmin ??
            dados.adminExiste ??
            dados.temAdmin ??
            false
        );
    } catch (error) {
        console.error(
            "Erro ao verificar administrador:",
            error
        );

        throw error;
    }
}

// =====================================================
// CAMPO DE SENHA
// =====================================================

function CampoSenha({
    value,
    setValue,
    mostrar,
    setMostrar,
    placeholder,
    autoComplete = "new-password"
}) {
    return (
        <div className="relative">
            <input
                type={
                    mostrar
                        ? "text"
                        : "password"
                }
                value={value}
                onChange={(e) =>
                    setValue(
                        e.target.value
                    )
                }
                required
                minLength={6}
                autoComplete={autoComplete}
                className="
                    w-full rounded-xl
                    border border-slate-200
                    px-4 py-3 pr-12
                    outline-none
                    focus:border-slate-900
                "
                placeholder={placeholder}
            />

            <button
                type="button"
                onClick={() =>
                    setMostrar(!mostrar)
                }
                className="
                    absolute right-3 top-1/2
                    flex h-9 w-9
                    -translate-y-1/2
                    items-center justify-center
                    text-slate-500
                    hover:bg-slate-100
                    rounded-lg
                "
                aria-label={
                    mostrar
                        ? "Ocultar palavra-passe"
                        : "Mostrar palavra-passe"
                }
            >
                {mostrar ? (
                    <FaEyeSlash />
                ) : (
                    <FaEye />
                )}
            </button>
        </div>
    );
}

// =====================================================
// TELA DE CARREGAMENTO
// =====================================================

function TelaCarregamento() {
    return (
        <div className="
            flex min-h-screen
            items-center justify-center
            bg-slate-50
        ">
            <div className="text-center">
                <div className="
                    mx-auto mb-4
                    h-10 w-10
                    animate-spin
                    rounded-full
                    border-4
                    border-slate-200
                    border-t-slate-950
                " />

                <p className="
                    text-sm
                    font-semibold
                    text-slate-600
                ">
                    A verificar a plataforma...
                </p>
            </div>
        </div>
    );
}


//Configurações

function Configuracoes() {
    const usuarioInicial =
        obterUsuario() || {};

    const [nomeSalao, setNomeSalao] =
        useState(
            localStorage.getItem(
                "nome_salao"
            ) ||
            "ZungaExpress"
        );

    const [telefone, setTelefone] =
        useState(
            usuarioInicial.telefone ||
            localStorage.getItem(
                "telefone_admin"
            ) ||
            ""
        );

    const [emailSalao, setEmailSalao] =
        useState(
            usuarioInicial.email ||
            localStorage.getItem(
                "email_salao"
            ) ||
            ""
        );

    const [senhaAtual, setSenhaAtual] =
        useState("");

    const [novaSenha, setNovaSenha] =
        useState("");

    const [
        confirmarSenha,
        setConfirmarSenha
    ] = useState("");

    const [imagem, setImagem] = useState(null);

    const [previewImagem, setPreviewImagem] = useState("");

    const [
        mostrarSenhaAtual,
        setMostrarSenhaAtual
    ] = useState(false);

    const [
        mostrarNovaSenha,
        setMostrarNovaSenha
    ] = useState(false);

    const [
        mostrarConfirmarSenha,
        setMostrarConfirmarSenha
    ] = useState(false);

    const [mensagem, setMensagem] =
        useState("");

    const [erro, setErro] =
        useState("");

    const [
        carregandoDados,
        setCarregandoDados
    ] = useState(false);

    const [
        carregandoSenha,
        setCarregandoSenha
    ] = useState(false);

    // =================================================
    // CARREGAR ADMIN
    // =================================================

    useEffect(() => {
        let ativo = true;

        const carregarAdmin =
            async () => {
                try {
                    const resposta =
                        await apiFetch(
                            `${API_URL}/admin/me`
                        );

                    const dados =
                        await lerResposta(
                            resposta
                        );

                    if (!resposta.ok) {
                        throw new Error(
                            dados.mensagem ||
                            dados.message ||
                            "Não foi possível carregar os dados do administrador."
                        );
                    }

                    const admin =
                        dados.admin ||
                        dados.usuario ||
                        dados.data ||
                        dados;

                    if (!ativo) {
                        return;
                    }

                    if (
                        admin.nome !==
                        undefined
                    ) {
                        setNomeSalao(
                            admin.nome
                        );
                    }

                    if (
                        admin.telefone !==
                        undefined
                    ) {
                        setTelefone(
                            admin.telefone ||
                            ""
                        );

                        localStorage.setItem(
                            "telefone_admin",
                            admin.telefone ||
                            ""
                        );
                    }

                    if (
                        admin.email !==
                        undefined
                    ) {
                        setEmailSalao(
                            admin.email ||
                            ""
                        );
                    }

                    const usuarioAtual =
                        obterUsuario() || {};

                    const usuarioAtualizado = {
                        ...usuarioAtual,
                        ...admin,
                        tipo: "admin"
                    };

                    localStorage.setItem(
                        "usuario",
                        JSON.stringify(
                            usuarioAtualizado
                        )
                    );

                    sessionStorage.setItem(
                        "usuario",
                        JSON.stringify(
                            usuarioAtualizado
                        )
                    );
                } catch (error) {
                    console.error(
                        "Erro ao carregar admin:",
                        error
                    );
                }
            };

        carregarAdmin();

        return () => {
            ativo = false;
        };
    }, []);

    // =================================================
    // SALVAR CONFIGURAÇÕES
    // =================================================

    const salvarConfiguracoes =
        async (e) => {
            e.preventDefault();

            setMensagem("");
            setErro("");

            const nomeFinal =
                nomeSalao.trim();

            const telefoneFinal =
                telefone.trim();

            const emailFinal =
                emailSalao
                    .trim()
                    .toLowerCase();

            if (
                nomeFinal.length < 2
            ) {
                setErro(
                    "Digite um nome válido para a plataforma."
                );

                return;
            }

            if (
                telefoneFinal &&
                telefoneFinal.length < 6
            ) {
                setErro(
                    "Digite um número de telefone válido."
                );

                return;
            }

            try {
                setCarregandoDados(true);

                const resposta =
                    await apiFetch(
                        `${API}/admin/perfil`,
                        {
                            method: "PUT",
                            body: JSON.stringify({
                                nome: nomeFinal,
                                telefone:
                                    telefoneFinal,
                                email:
                                    emailFinal ||
                                    null
                            })
                        }
                    );

                const dados =
                    await lerResposta(
                        resposta
                    );

                if (!resposta.ok) {
                    throw new Error(
                        dados.mensagem ||
                        dados.message ||
                        "Não foi possível actualizar os dados do administrador."
                    );
                }

                const adminAtualizado =
                    dados.admin ||
                    dados.usuario ||
                    dados.data ||
                    {};

                localStorage.setItem(
                    "nome_salao",
                    nomeFinal
                );

                localStorage.setItem(
                    "telefone_salao",
                    telefoneFinal
                );

                localStorage.setItem(
                    "telefone_admin",
                    telefoneFinal
                );

                localStorage.setItem(
                    "email_salao",
                    emailFinal
                );

                const usuarioAtual =
                    obterUsuario() || {};

                const usuarioNovo = {
                    ...usuarioAtual,
                    ...adminAtualizado,
                    nome:
                        adminAtualizado.nome ||
                        nomeFinal,
                    telefone:
                        adminAtualizado.telefone ??
                        telefoneFinal,
                    email:
                        adminAtualizado.email ??
                        emailFinal,
                    tipo: "admin"
                };

                localStorage.setItem(
                    "usuario",
                    JSON.stringify(
                        usuarioNovo
                    )
                );

                sessionStorage.setItem(
                    "usuario",
                    JSON.stringify(
                        usuarioNovo
                    )
                );

                setNomeSalao(
                    usuarioNovo.nome
                );

                setTelefone(
                    usuarioNovo.telefone ||
                    ""
                );

                setEmailSalao(
                    usuarioNovo.email ||
                    ""
                );

                setMensagem(
                    "Dados do administrador actualizados com sucesso."
                );
            } catch (error) {
                console.error(
                    "Erro ao actualizar dados:",
                    error
                );

                setErro(
                    error.message ||
                    "Erro ao actualizar os dados."
                );
            } finally {
                setCarregandoDados(false);
            }
        };

    // =================================================
    // ALTERAR SENHA
    // =================================================

    const actualizarSenha =
        async (e) => {
            e.preventDefault();

            setMensagem("");
            setErro("");

            if (!senhaAtual) {
                setErro(
                    "Digite a palavra-passe atual."
                );

                return;
            }

            if (
                novaSenha.length < 6
            ) {
                setErro(
                    "A nova palavra-passe deve ter pelo menos 6 caracteres."
                );

                return;
            }

            if (
                novaSenha !==
                confirmarSenha
            ) {
                setErro(
                    "A confirmação da nova palavra-passe não coincide."
                );

                return;
            }

            try {
                setCarregandoSenha(true);

                const resposta =
                    await apiFetch(
                        `${API_URL}/admin/senha`,
                        {
                            method: "PUT",
                            body: JSON.stringify({
                                senhaAtual,
                                novaSenha
                            })
                        }
                    );

                const dados =
                    await lerResposta(
                        resposta
                    );

                if (!resposta.ok) {
                    throw new Error(
                        dados.mensagem ||
                        dados.message ||
                        "Não foi possível alterar a palavra-passe."
                    );
                }

                setSenhaAtual("");
                setNovaSenha("");
                setConfirmarSenha("");

                setMensagem(
                    "Palavra-passe actualizada com sucesso."
                );
            } catch (error) {
                console.error(
                    "Erro ao alterar senha:",
                    error
                );

                setErro(
                    error.message ||
                    "Erro ao actualizar a palavra-passe."
                );
            } finally {
                setCarregandoSenha(false);
            }
        };

    return (
        <div
            className="
                min-h-screen
                bg-white
                p-4
                sm:p-6
                lg:p-8
            "
        >
            <div className="mb-6">
                <h1
                    className="
                        text-2xl
                        font-bold
                        text-slate-900
                    "
                >
                    Configurações
                </h1>

                <p
                    className="
                        mt-1
                        text-sm
                        text-slate-500
                    "
                >
                    Configure os dados da plataforma
                    e da sua conta de administrador.
                </p>
            </div>

            {mensagem && (
                <div
                    className="
                        mb-6
                        rounded-xl
                        border
                        border-emerald-200
                        bg-emerald-50
                        px-4
                        py-3
                        text-sm
                        font-medium
                        text-emerald-700
                    "
                >
                    {mensagem}
                </div>
            )}

            {erro && (
                <div
                    className="
                        mb-6
                        rounded-xl
                        border
                        border-red-200
                        bg-red-50
                        px-4
                        py-3
                        text-sm
                        font-medium
                        text-red-700
                    "
                >
                    {erro}
                </div>
            )}

            <div
                className="
                    grid
                    max-w-5xl
                    gap-6
                    lg:grid-cols-2
                "
            >
                {/* DADOS DA PLATAFORMA */}

                <div
                    className="
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        p-5
                        shadow-sm
                        sm:p-7
                    "
                >
                    <div
                        className="
                            mb-6
                            flex
                            items-center
                            gap-4
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
                                bg-slate-900
                                text-white
                            "
                        >
                            <FaCog />
                        </div>

                        <div>
                            <h2
                                className="
                                    font-bold
                                    text-slate-900
                                "
                            >
                                Dados da plataforma
                            </h2>

                            <p
                                className="
                                    text-sm
                                    text-slate-500
                                "
                            >
                                Actualize os dados do administrador.
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={
                            salvarConfiguracoes
                        }
                        className="space-y-5"
                    >
                        <div>
                            <label
                                className="
                                    mb-2
                                    block
                                    text-sm
                                    font-semibold
                                    text-slate-700
                                "
                            >
                                Nome da plataforma
                            </label>

                            <input
                                type="text"
                                value={nomeSalao}
                                onChange={(e) =>
                                    setNomeSalao(
                                        e.target.value
                                    )
                                }
                                required
                                className="
                                    w-full
                                    rounded-xl
                                    border
                                    border-slate-200
                                    px-4
                                    py-3
                                    outline-none
                                    focus:border-slate-900
                                "
                                placeholder="ZungaExpress"
                            />
                        </div>

                        <div>
                            <label
                                className="
                                    mb-2
                                    flex
                                    items-center
                                    gap-2
                                    text-sm
                                    font-semibold
                                    text-slate-700
                                "
                            >
                                <FaPhone />
                                Telefone do administrador
                            </label>

                            <input
                                type="tel"
                                value={telefone}
                                onChange={(e) =>
                                    setTelefone(
                                        e.target.value
                                    )
                                }
                                autoComplete="tel"
                                className="
                                    w-full
                                    rounded-xl
                                    border
                                    border-slate-200
                                    px-4
                                    py-3
                                    outline-none
                                    focus:border-slate-900
                                "
                                placeholder="923 000 000"
                            />
                        </div>

                        <div>
                            <label
                                className="
                                    mb-2
                                    flex
                                    items-center
                                    gap-2
                                    text-sm
                                    font-semibold
                                    text-slate-700
                                "
                            >
                                <FaEnvelope />
                                Email do administrador
                            </label>

                            <input
                                type="email"
                                value={emailSalao}
                                onChange={(e) =>
                                    setEmailSalao(
                                        e.target.value
                                    )
                                }
                                autoComplete="email"
                                className="
                                    w-full
                                    rounded-xl
                                    border
                                    border-slate-200
                                    px-4
                                    py-3
                                    outline-none
                                    focus:border-slate-900
                                "
                                placeholder="admin@gmail.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={
                                carregandoDados
                            }
                            className="
                                flex
                                w-full
                                items-center
                                justify-center
                                gap-2
                                rounded-xl
                                bg-slate-950
                                px-6
                                py-3
                                font-bold
                                text-white
                                hover:bg-slate-800
                                disabled:cursor-not-allowed
                                disabled:opacity-60
                            "
                        >
                            <FaSave />

                            {carregandoDados
                                ? "A guardar..."
                                : "Guardar configurações"}
                        </button>
                    </form>
                </div>

                {/* SEGURANÇA */}

                <div
                    className="
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        p-5
                        shadow-sm
                        sm:p-7
                    "
                >
                    <div
                        className="
                            mb-6
                            flex
                            items-center
                            gap-4
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
                                bg-slate-900
                                text-white
                            "
                        >
                            <FaLock />
                        </div>

                        <div>
                            <h2
                                className="
                                    font-bold
                                    text-slate-900
                                "
                            >
                                Segurança
                            </h2>

                            <p
                                className="
                                    text-sm
                                    text-slate-500
                                "
                            >
                                Alterar palavra-passe.
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={actualizarSenha}
                        className="space-y-5"
                    >
                        <CampoSenha
                            value={senhaAtual}
                            setValue={setSenhaAtual}
                            mostrar={mostrarSenhaAtual}
                            setMostrar={
                                setMostrarSenhaAtual
                            }
                            placeholder="Palavra-passe atual"
                        />

                        <CampoSenha
                            value={novaSenha}
                            setValue={setNovaSenha}
                            mostrar={mostrarNovaSenha}
                            setMostrar={
                                setMostrarNovaSenha
                            }
                            placeholder="Nova palavra-passe"
                        />

                        <CampoSenha
                            value={confirmarSenha}
                            setValue={
                                setConfirmarSenha
                            }
                            mostrar={
                                mostrarConfirmarSenha
                            }
                            setMostrar={
                                setMostrarConfirmarSenha
                            }
                            placeholder="Confirmar nova palavra-passe"
                        />

                        <button
                            type="submit"
                            disabled={
                                carregandoSenha
                            }
                            className="
                                flex
                                w-full
                                items-center
                                justify-center
                                gap-2
                                rounded-xl
                                bg-slate-950
                                px-6
                                py-3
                                font-bold
                                text-white
                                hover:bg-slate-800
                                disabled:cursor-not-allowed
                                disabled:opacity-60
                            "
                        >
                            <FaLock />

                            {carregandoSenha
                                ? "A actualizar..."
                                : "Actualizar palavra-passe"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}



// =====================================================
// CADASTRAR CLIENTE
// =====================================================

function CadastrarCliente() {
    const navigate =
        useNavigate();

    const [nome, setNome] =
        useState("");

    const [telefone, setTelefone] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [senha, setSenha] =
        useState("");

    const [
        confirmarSenha,
        setConfirmarSenha
    ] = useState("");

    const [mostrarSenha, setMostrarSenha] =
        useState(false);

    const [
        mostrarConfirmar,
        setMostrarConfirmar
    ] = useState(false);

    const [erro, setErro] =
        useState("");

    const [sucesso, setSucesso] =
        useState("");

    const [carregando, setCarregando] =
        useState(false);

    async function cadastrar(e) {
        e.preventDefault();

        if (carregando) {
            return;
        }

        setErro("");
        setSucesso("");

        const nomeFinal =
            nome.trim();

        const telefoneFinal =
            telefone.trim();

        const emailFinal =
            email.trim().toLowerCase();

        if (
            nomeFinal.length < 3
        ) {
            setErro(
                "O nome deve ter pelo menos 3 caracteres."
            );
            return;
        }

        if (
            telefoneFinal.length < 6
        ) {
            setErro(
                "Digite um número de telefone válido."
            );
            return;
        }

        if (
            senha.length < 6
        ) {
            setErro(
                "A palavra-passe deve ter pelo menos 6 caracteres."
            );
            return;
        }

        if (
            senha !==
            confirmarSenha
        ) {
            setErro(
                "As palavras-passe não coincidem."
            );
            return;
        }

        try {
            setCarregando(true);

            const resposta =
                await fetch(
                    `${API}/clientes`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                            Accept:
                                "application/json"
                        },
                        body:
                            JSON.stringify({
                                nome:
                                    nomeFinal,
                                telefone:
                                    telefoneFinal,
                                email:
                                    emailFinal ||
                                    null,
                                senha
                            })
                    }
                );

            const dados =
                await lerResposta(
                    resposta
                );

            if (!resposta.ok) {
                throw new Error(
                    dados.mensagem ||
                    dados.message ||
                    "Não foi possível cadastrar o cliente."
                );
            }

            setNome("");
            setTelefone("");
            setEmail("");
            setSenha("");
            setConfirmarSenha("");

            setSucesso(
                "Conta criada com sucesso! A redirecionar para o login..."
            );

            setTimeout(() => {
                navigate(
                    "/login",
                    {
                        replace: true
                    }
                );
            }, 1500);
        } catch (error) {
            console.error(
                "Erro ao cadastrar cliente:",
                error
            );

            setErro(
                error.message ||
                "Erro ao cadastrar cliente."
            );
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div className="
            flex min-h-screen
            items-center justify-center
            bg-slate-50 p-5
        ">
            <div className="
                w-full max-w-md
                rounded-3xl
                border border-slate-200
                bg-white p-7
                shadow-sm
            ">
                <div className="
                    mb-7 text-center
                ">
                    <div className="
                        mx-auto mb-4
                        flex h-16 w-16
                        items-center justify-center
                    ">
                        <img
                            src={LogoEmpresa}
                            width={50}
                            height={50}
                            alt="ZungaExpress"
                        />
                    </div>

                    <h1 className="
                        text-2xl font-bold
                        text-slate-900
                    ">
                        Criar conta cliente
                    </h1>

                    <p className="
                        mt-1 text-sm
                        text-slate-500
                    ">
                        Crie a sua conta na ZungaExpress
                    </p>
                </div>

                {erro && (
                    <div className="
                        mb-5 rounded-xl
                        border border-red-200
                        bg-red-50
                        px-4 py-3
                        text-sm font-medium
                        text-red-600
                    ">
                        {erro}
                    </div>
                )}

                {sucesso && (
                    <div className="
                        mb-5 rounded-xl
                        border border-emerald-200
                        bg-emerald-50
                        px-4 py-3
                        text-sm font-medium
                        text-emerald-700
                    ">
                        {sucesso}
                    </div>
                )}

                <form
                    onSubmit={cadastrar}
                    className="space-y-5"
                >
                    <input
                        type="text"
                        value={nome}
                        onChange={(e) =>
                            setNome(
                                e.target.value
                            )
                        }
                        required
                        minLength={3}
                        autoComplete="name"
                        className="
                            w-full rounded-xl
                            border border-slate-200
                            px-4 py-3
                            outline-none
                            focus:border-slate-900
                        "
                        placeholder="Nome completo"
                    />

                    <input
                        type="tel"
                        value={telefone}
                        onChange={(e) =>
                            setTelefone(
                                e.target.value
                            )
                        }
                        required
                        autoComplete="tel"
                        className="
                            w-full rounded-xl
                            border border-slate-200
                            px-4 py-3
                            outline-none
                            focus:border-slate-900
                        "
                        placeholder="Telefone"
                    />

                    <input
                        type="email"
                        value={email}
                        onChange={(e) =>
                            setEmail(
                                e.target.value
                            )
                        }
                        autoComplete="email"
                        className="
                            w-full rounded-xl
                            border border-slate-200
                            px-4 py-3
                            outline-none
                            focus:border-slate-900
                        "
                        placeholder="Email"
                    />

                    <CampoSenha
                        value={senha}
                        setValue={setSenha}
                        mostrar={mostrarSenha}
                        setMostrar={
                            setMostrarSenha
                        }
                        placeholder="Palavra-passe"
                    />

                    <CampoSenha
                        value={confirmarSenha}
                        setValue={
                            setConfirmarSenha
                        }
                        mostrar={
                            mostrarConfirmar
                        }
                        setMostrar={
                            setMostrarConfirmar
                        }
                        placeholder="Confirmar palavra-passe"
                    />

                    <button
                        type="submit"
                        disabled={carregando}
                        className="
                            flex w-full
                            items-center justify-center
                            gap-2 rounded-xl
                            bg-slate-950
                            px-4 py-3
                            font-bold text-white
                            hover:bg-slate-800
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                        "
                    >
                        <FaUserPlus />

                        {carregando
                            ? "A cadastrar..."
                            : "Criar conta"}
                    </button>
                </form>

                <button
                    type="button"
                    onClick={() =>
                        navigate("/login")
                    }
                    className="
                        mt-5 w-full
                        text-center text-sm
                        font-semibold
                        text-slate-600
                        hover:text-slate-900
                    "
                >
                    Já tenho uma conta
                </button>
            </div>
        </div>
    );
}

// =====================================================
// CRIAR ADMIN
// =====================================================

function CriarConta() {
    const navigate =
        useNavigate();

    const [nome, setNome] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [senha, setSenha] =
        useState("");

    const [
        confirmarSenha,
        setConfirmarSenha
    ] = useState("");

    const [mostrarSenha, setMostrarSenha] =
        useState(false);

    const [
        mostrarConfirmar,
        setMostrarConfirmar
    ] = useState(false);

    const [erro, setErro] =
        useState("");

    const [sucesso, setSucesso] =
        useState("");

    const [carregando, setCarregando] =
        useState(false);

    async function criarConta(e) {
        e.preventDefault();

        if (carregando) {
            return;
        }

        setErro("");
        setSucesso("");

        const nomeFinal =
            nome.trim();

        const emailFinal =
            email.trim().toLowerCase();

        if (
            nomeFinal.length < 3
        ) {
            setErro(
                "O nome deve ter pelo menos 3 caracteres."
            );
            return;
        }

        if (!emailFinal) {
            setErro(
                "Digite o email do administrador."
            );
            return;
        }

        if (
            senha.length < 6
        ) {
            setErro(
                "A palavra-passe deve ter pelo menos 6 caracteres."
            );
            return;
        }

        if (
            senha !==
            confirmarSenha
        ) {
            setErro(
                "As palavras-passe não coincidem."
            );
            return;
        }

        try {
            setCarregando(true);

            /*
             * VERIFICA NOVAMENTE ANTES DE CRIAR.
             *
             * Isso evita que a página seja aberta
             * manualmente depois que já existe admin.
             */

            const existeAdmin =
                await verificarExistenciaAdmin();

            if (existeAdmin) {
                setErro(
                    "Já existe um administrador. Crie uma conta cliente."
                );

                setTimeout(() => {
                    navigate(
                        "/cadastrar-cliente",
                        {
                            replace: true
                        }
                    );
                }, 1200);

                return;
            }

            const resposta =
                await fetch(
                    `${API}/admin/criar`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                            Accept:
                                "application/json"
                        },
                        body:
                            JSON.stringify({
                                nome:
                                    nomeFinal,
                                email:
                                    emailFinal,
                                senha
                            })
                    }
                );

            const dados =
                await lerResposta(
                    resposta
                );

            if (!resposta.ok) {
                throw new Error(
                    dados.mensagem ||
                    dados.message ||
                    "Não foi possível criar a conta de administrador."
                );
            }

            setNome("");
            setEmail("");
            setSenha("");
            setConfirmarSenha("");

            setSucesso(
                "Administrador criado com sucesso! A redirecionar para o login..."
            );

            setTimeout(() => {
                navigate(
                    "/login",
                    {
                        replace: true
                    }
                );
            }, 1500);
        } catch (error) {
            console.error(
                "Erro ao criar administrador:",
                error
            );

            setErro(
                error.message ||
                "Erro ao criar conta."
            );
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div className="
            flex min-h-screen
            items-center justify-center
            bg-slate-50 p-5
        ">
            <div className="
                w-full max-w-md
                rounded-3xl
                border border-slate-200
                bg-white p-7
                shadow-sm
            ">
                <div className="
                    mb-7 text-center
                ">
                    <div className="
                        mx-auto mb-4
                        flex h-16 w-16
                        items-center justify-center
                    ">
                        <img
                            src={LogoEmpresa}
                            width={50}
                            height={50}
                            alt="ZungaExpress"
                        />
                    </div>

                    <h1 className="
                        text-2xl font-bold
                        text-slate-900
                    ">
                        Criar administrador
                    </h1>

                    <p className="
                        mt-1 text-sm
                        text-slate-500
                    ">
                        Primeira configuração da ZungaExpress
                    </p>
                </div>

                {erro && (
                    <div className="
                        mb-5 rounded-xl
                        border border-red-200
                        bg-red-50
                        px-4 py-3
                        text-sm font-medium
                        text-red-600
                    ">
                        {erro}
                    </div>
                )}

                {sucesso && (
                    <div className="
                        mb-5 rounded-xl
                        border border-emerald-200
                        bg-emerald-50
                        px-4 py-3
                        text-sm font-medium
                        text-emerald-700
                    ">
                        {sucesso}
                    </div>
                )}

                <form
                    onSubmit={criarConta}
                    className="space-y-5"
                >
                    <input
                        type="text"
                        value={nome}
                        onChange={(e) =>
                            setNome(
                                e.target.value
                            )
                        }
                        required
                        minLength={3}
                        autoComplete="name"
                        className="
                            w-full rounded-xl
                            border border-slate-200
                            px-4 py-3
                            outline-none
                            focus:border-slate-900
                        "
                        placeholder="Nome do administrador"
                    />

                    <input
                        type="email"
                        value={email}
                        onChange={(e) =>
                            setEmail(
                                e.target.value
                            )
                        }
                        required
                        autoComplete="email"
                        className="
                            w-full rounded-xl
                            border border-slate-200
                            px-4 py-3
                            outline-none
                            focus:border-slate-900
                        "
                        placeholder="admin@gmail.com"
                    />

                    <CampoSenha
                        value={senha}
                        setValue={setSenha}
                        mostrar={mostrarSenha}
                        setMostrar={
                            setMostrarSenha
                        }
                        placeholder="Palavra-passe"
                    />

                    <CampoSenha
                        value={confirmarSenha}
                        setValue={
                            setConfirmarSenha
                        }
                        mostrar={
                            mostrarConfirmar
                        }
                        setMostrar={
                            setMostrarConfirmar
                        }
                        placeholder="Confirmar palavra-passe"
                    />

                    <button
                        type="submit"
                        disabled={carregando}
                        className="
                            flex w-full
                            items-center justify-center
                            gap-2 rounded-xl
                            bg-slate-950
                            px-4 py-3
                            font-bold text-white
                            hover:bg-slate-800
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                        "
                    >
                        <FaUserPlus />

                        {carregando
                            ? "A criar..."
                            : "Criar administrador"}
                    </button>
                </form>

                <button
                    type="button"
                    onClick={() =>
                        navigate("/login")
                    }
                    className="
                        mt-5 w-full
                        text-sm font-semibold
                        text-slate-600
                        hover:text-slate-900
                    "
                >
                    Voltar para o login
                </button>
            </div>
        </div>
    );
}

// =====================================================
// LOGIN
// =====================================================

function Login() {
    const navigate =
        useNavigate();

    const [email, setEmail] =
        useState("");

    const [senha, setSenha] =
        useState("");

    const [mostrarSenha, setMostrarSenha] =
        useState(false);

    const [erro, setErro] =
        useState("");

    const [carregando, setCarregando] =
        useState(false);

    // =================================================
    // ESTADO DO ADMIN
    // =================================================

    const [
        existeAdmin,
        setExisteAdmin
    ] = useState(null);

    const [
        carregandoAdmin,
        setCarregandoAdmin
    ] = useState(true);

    // =================================================
    // VERIFICAR ADMIN AO ABRIR LOGIN
    // =================================================

    useEffect(() => {
        let ativo = true;

        async function verificar() {
            try {
                setCarregandoAdmin(true);

                const existe =
                    await verificarExistenciaAdmin();

                if (ativo) {
                    setExisteAdmin(
                        existe
                    );
                }
            } catch (error) {
                console.error(
                    "Erro ao verificar admin:",
                    error
                );

                if (ativo) {
                    setErro(
                        "Não foi possível verificar o estado da plataforma."
                    );
                }
            } finally {
                if (ativo) {
                    setCarregandoAdmin(
                        false
                    );
                }
            }
        }

        verificar();

        return () => {
            ativo = false;
        };
    }, []);

    // =================================================
    // VERIFICAR SESSÃO
    // =================================================

    useEffect(() => {
        const token =
            obterToken();

        const usuario =
            obterUsuario();

        if (!token || !usuario) {
            return;
        }

        if (
            usuario.tipo ===
            "admin"
        ) {
            navigate(
                "/",
                {
                    replace: true
                }
            );

            return;
        }

        if (
            usuario.tipo ===
            "cliente"
        ) {
            navigate(
                "/cliente",
                {
                    replace: true
                }
            );

            return;
        }

        if (
            usuario.tipo ===
            "gestor"
        ) {
            navigate(
                "/gestor",
                {
                    replace: true
                }
            );
        }
    }, [navigate]);

    // =================================================
    // ENTRAR
    // =================================================

    async function entrar(e) {
        e.preventDefault();

        if (carregando) {
            return;
        }

        setErro("");
        setCarregando(true);

        const emailLogin =
            email.trim().toLowerCase();

        if (!emailLogin) {
            setErro(
                "Digite o seu email."
            );

            setCarregando(false);
            return;
        }

        if (!senha) {
            setErro(
                "Digite a sua palavra-passe."
            );

            setCarregando(false);
            return;
        }

        const dadosLogin = {
            email: emailLogin,
            senha
        };

        try {
            limparAutenticacao();

            // =================================================
            // LOGIN ADMIN
            // =================================================

            let respostaAdmin = null;
            let dadosAdmin = {};

            try {
                respostaAdmin =
                    await fetch(
                        `${API_URL}/admin/login`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json",
                                Accept:
                                    "application/json"
                            },
                            body:
                                JSON.stringify(
                                    dadosLogin
                                )
                        }
                    );

                dadosAdmin =
                    await lerResposta(
                        respostaAdmin
                    );
            } catch (error) {
                console.error(
                    "Erro login admin:",
                    error
                );
            }

            if (
                respostaAdmin &&
                respostaAdmin.ok
            ) {
                salvarAutenticacao(
                    dadosAdmin,
                    "admin"
                );

                navigate(
                    "/",
                    {
                        replace: true
                    }
                );

                return;
            }

            // =================================================
            // LOGIN GESTOR
            // =================================================

            let respostaGestor = null;
            let dadosGestor = {};

            try {
                respostaGestor =
                    await fetch(
                        `${API_URL}/gestores/login`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json",
                                Accept:
                                    "application/json"
                            },
                            body:
                                JSON.stringify(
                                    dadosLogin
                                )
                        }
                    );

                dadosGestor =
                    await lerResposta(
                        respostaGestor
                    );
            } catch (error) {
                console.error(
                    "Erro login gestor:",
                    error
                );
            }

            if (
                respostaGestor &&
                respostaGestor.ok
            ) {
                salvarAutenticacao(
                    dadosGestor,
                    "gestor"
                );

                navigate(
                    "/gestor",
                    {
                        replace: true
                    }
                );

                return;
            }

            // =================================================
            // LOGIN CLIENTE
            // =================================================

            let respostaCliente = null;
            let dadosCliente = {};

            try {
                respostaCliente =
                    await fetch(
                        `${API_URL}/clientes/login`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json",
                                Accept:
                                    "application/json"
                            },
                            body:
                                JSON.stringify(
                                    dadosLogin
                                )
                        }
                    );

                dadosCliente =
                    await lerResposta(
                        respostaCliente
                    );
            } catch (error) {
                console.error(
                    "Erro login cliente:",
                    error
                );
            }

            if (
                respostaCliente &&
                respostaCliente.ok
            ) {
                salvarAutenticacao(
                    dadosCliente,
                    "cliente"
                );

                navigate(
                    "/cliente",
                    {
                        replace: true
                    }
                );

                return;
            }

            const mensagemAdmin =
                dadosAdmin?.mensagem ||
                dadosAdmin?.message ||
                dadosAdmin?.erro ||
                dadosAdmin?.error ||
                "";

            const mensagemGestor =
                dadosGestor?.mensagem ||
                dadosGestor?.message ||
                dadosGestor?.erro ||
                dadosGestor?.error ||
                "";

            const mensagemCliente =
                dadosCliente?.mensagem ||
                dadosCliente?.message ||
                dadosCliente?.erro ||
                dadosCliente?.error ||
                "";

            throw new Error(
                mensagemCliente ||
                mensagemGestor ||
                mensagemAdmin ||
                "Email ou palavra-passe incorretos."
            );
        } catch (error) {
            console.error(
                "Erro final login:",
                error
            );

            limparAutenticacao();

            setErro(
                error.message ||
                "Erro ao realizar login."
            );
        } finally {
            setCarregando(false);
        }
    }

    // =================================================
    // IR PARA CADASTRO
    // =================================================

    function abrirCadastro() {
        if (existeAdmin === null) {
            return;
        }

        if (existeAdmin) {
            navigate(
                "/cadastrar-cliente"
            );
        } else {
            navigate(
                "/criar-conta"
            );
        }
    }

    // =================================================
    // TEXTO DO BOTÃO
    // =================================================

    function textoCadastro() {
        if (carregandoAdmin) {
            return "A verificar...";
        }

        if (existeAdmin) {
            return "Criar conta cliente";
        }

        return "Criar conta Admin";
    }

    return (
        <div className="
            flex min-h-screen
            items-center justify-center
            bg-slate-50 p-5
        "
        
        >
            <div className="
                w-full max-w-md
            ">
                <div className="
                    mb-6 text-center
                ">
                    <div className="
                        mx-auto flex
                        h-20 w-20
                        items-center justify-center
                        rounded-3xl
                    ">
                        <img
                            src={LogoEmpresa}
                            width={50}
                            height={50}
                            alt="ZungaExpress"
                        />
                    </div>

                    <h1 className="text-sm font-black uppercase tracking-[0.16em]   text-slate-950"
                     
                    >
                        ZungaExpress
                    </h1>

                    <p className="
                        mt-2 text-sm
                        text-slate-500
                    ">
                       A sua compra, no seu ritmo.
                    </p>
                </div>

                <div className="
                    rounded-3xl
                    border border-slate-200
                    bg-white p-7 shadow-sm
                    sm:p-8
                ">
                    {erro && (
                        <div className="
                            mb-5 rounded-xl
                            border border-red-200
                            bg-red-50
                            px-4 py-3
                            text-sm font-medium
                            text-red-600
                        ">
                            {erro}
                        </div>
                    )}

                    <form
                        onSubmit={entrar}
                        className="space-y-5"
                    >
                        {/* EMAIL */}

                        <div>
                            <label className="
                                mb-2 block
                                text-sm font-bold
                                text-slate-700
                            ">
                                Email
                            </label>

                            <div className="relative">
                                <FaUser className="
                                    absolute left-4
                                    top-1/2
                                    -translate-y-1/2
                                    text-slate-400
                                " />

                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(
                                            e.target.value
                                        )
                                    }
                                    required
                                    autoComplete="email"
                                    className="
                                        w-full rounded-xl
                                        border border-slate-200
                                        bg-white
                                        px-4 py-3 pl-11
                                        outline-none
                                        focus:border-slate-900
                                    "
                                    placeholder="seuemail@gmail.com"
                                />
                            </div>
                        </div>

                        {/* SENHA */}

                        <div>
                            <label className="
                                mb-2 block
                                text-sm font-bold
                                text-slate-700
                            ">
                                Palavra-passe
                            </label>

                            <div className="relative">
                                <FaLock className="
                                    absolute left-4
                                    top-1/2
                                    -translate-y-1/2
                                    text-slate-400
                                " />

                                <input
                                    type={
                                        mostrarSenha
                                            ? "text"
                                            : "password"
                                    }
                                    value={senha}
                                    onChange={(e) =>
                                        setSenha(
                                            e.target.value
                                        )
                                    }
                                    required
                                    autoComplete="current-password"
                                    className="
                                        w-full rounded-xl
                                        border border-slate-200
                                        bg-white
                                        px-4 py-3
                                        pl-11 pr-12
                                        outline-none
                                        focus:border-slate-900
                                    "
                                    placeholder="Digite a sua palavra-passe"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setMostrarSenha(
                                            !mostrarSenha
                                        )
                                    }
                                    className="
                                        absolute right-3
                                        top-1/2
                                        flex h-9 w-9
                                        -translate-y-1/2
                                        items-center
                                        justify-center
                                        rounded-lg
                                        text-slate-500
                                        hover:bg-slate-100
                                    "
                                    aria-label={
                                        mostrarSenha
                                            ? "Ocultar palavra-passe"
                                            : "Mostrar palavra-passe"
                                    }
                                >
                                    {mostrarSenha ? (
                                        <FaEyeSlash />
                                    ) : (
                                        <FaEye />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* LOGIN */}

                        <button
                            type="submit"
                            disabled={carregando}
                            className="
                                flex w-full
                                items-center justify-center
                                gap-3 rounded-xl
                                bg-slate-950
                                px-4 py-3.5
                                font-bold text-white
                                hover:bg-slate-800
                                disabled:cursor-not-allowed
                                disabled:opacity-60
                            "
                        >
                            {carregando ? (
                                <span>
                                    A entrar...
                                </span>
                            ) : (
                                <>
                                    <FaShoppingCart />
                                    Entrar na ZungaExpress
                                </>
                            )}
                        </button>
                    </form>

                    {/* =================================================
                        UM ÚNICO BOTÃO DE CADASTRO
                    ================================================= */}

                    <div className="
                        mt-7 border-t
                        border-slate-100
                        pt-6
                    ">
                        <p className="
                            mb-3 text-center
                            text-xs text-slate-500
                        ">
                            Ainda não possui conta?
                        </p>

                        <button
                            type="button"
                            onClick={
                                abrirCadastro
                            }
                            disabled={
                                carregandoAdmin ||
                                existeAdmin === null
                            }
                            className="
                                flex w-full
                                items-center
                                justify-center
                                gap-2 rounded-xl
                                border border-slate-200
                                px-4 py-3
                                text-sm font-bold
                                text-slate-700
                                hover:bg-slate-50
                                disabled:cursor-not-allowed
                                disabled:opacity-60
                            "
                        >
                            <FaUserPlus />

                            {textoCadastro()}
                        </button>

                        {/* INFORMAÇÃO */}

                        {!carregandoAdmin &&
                            existeAdmin === false && (
                                <p className="
                                    mt-3 text-center
                                    text-xs text-slate-400
                                ">
                                    Este é o primeiro acesso.
                                    Será criada a conta de
                                    administrador da plataforma.
                                </p>
                            )}

                        {!carregandoAdmin &&
                            existeAdmin === true && (
                                <p className="
                                    mt-3 text-center
                                    text-xs text-slate-400
                                ">
                                    A conta de administrador
                                    já existe. Novos utilizadores
                                    podem criar contas de cliente.
                                </p>
                            )}
                    </div>

                    <div className="
                        mt-6 flex
                        items-center justify-center
                        gap-2 text-xs
                        text-slate-400
                    ">
                        <FaCheckCircle />
                        Plataforma segura
                    </div>
                </div>

                <p className="
                    mt-5 text-center
                    text-xs text-slate-500
                ">
                    © 2026 ZungaExpress
                </p>
            </div>
        </div>
    );
}

// =====================================================
// PROTEÇÃO ADMIN
// =====================================================

function RotaAdminProtegida({
    children
}) {
    const location =
        useLocation();

    const token =
        obterToken();

    const usuario =
        obterUsuario();

    if (!token || !usuario) {
        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: location
                }}
            />
        );
    }

    if (
        usuario.tipo !==
        "admin"
    ) {
        if (
            usuario.tipo ===
            "gestor"
        ) {
            return (
                <Navigate
                    to="/gestor"
                    replace
                />
            );
        }

        return (
            <Navigate
                to="/cliente"
                replace
            />
        );
    }

    return children;
}

// =====================================================
// PROTEÇÃO CLIENTE
// =====================================================

function RotaClienteProtegida({
    children
}) {
    const location =
        useLocation();

    const token =
        obterToken();

    const usuario =
        obterUsuario();

    if (!token || !usuario) {
        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: location
                }}
            />
        );
    }

    if (
        usuario.tipo !==
        "cliente"
    ) {
        if (
            usuario.tipo ===
            "gestor"
        ) {
            return (
                <Navigate
                    to="/gestor"
                    replace
                />
            );
        }

        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    return children;
}

// =====================================================
// PROTEÇÃO GESTOR
// =====================================================

function RotaGestorProtegida({
    children
}) {
    const location =
        useLocation();

    const token =
        obterToken();

    const usuario =
        obterUsuario();

    if (!token || !usuario) {
        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: location
                }}
            />
        );
    }

    if (
        usuario.tipo !==
        "gestor"
    ) {
        if (
            usuario.tipo ===
            "admin"
        ) {
            return (
                <Navigate
                    to="/"
                    replace
                />
            );
        }

        return (
            <Navigate
                to="/cliente"
                replace
            />
        );
    }

    return children;
}

// =====================================================
// MODAL LOGOUT
// =====================================================

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
                bg-black/60 p-4
                backdrop-blur-sm
            "
            onMouseDown={(e) => {
                if (
                    e.target ===
                    e.currentTarget
                ) {
                    onCancelar();
                }
            }}
        >
            <div
                className="
                    w-full max-w-md
                    rounded-3xl
                    border border-slate-200
                    bg-white p-6
                    shadow-2xl
                "
                onMouseDown={(e) =>
                    e.stopPropagation()
                }
            >
                <div className="
                    flex h-14 w-14
                    items-center justify-center
                    rounded-2xl
                    bg-red-100 text-red-600
                ">
                    <FaExclamationTriangle
                        size={24}
                    />
                </div>

                <h2 className="
                    mt-5 text-xl
                    font-bold text-slate-900
                ">
                    Confirmar saída
                </h2>

                <p className="
                    mt-2 text-sm
                    leading-6 text-slate-500
                ">
                    Tem certeza de que deseja
                    terminar a sessão?
                </p>

                <div className="
                    mt-7 flex flex-col-reverse
                    gap-3 sm:flex-row
                    sm:justify-end
                ">
                    <button
                        type="button"
                        onClick={onCancelar}
                        className="
                            rounded-xl
                            border border-slate-200
                            px-5 py-3
                            text-sm font-bold
                            text-slate-700
                            hover:bg-slate-50
                        "
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        onClick={onConfirmar}
                        className="
                            flex items-center
                            justify-center gap-2
                            rounded-xl
                            bg-red-600
                            px-5 py-3
                            text-sm font-bold
                            text-white
                            hover:bg-red-700
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

// =====================================================
// PÁGINA CLIENTE
// =====================================================

function PaginaCliente() {
    return (
        <DashboardClientes />
    );
}

// =====================================================
// PÁGINA GESTOR
// =====================================================

function PaginaGestor() {
    return (
        <GestaoGestores />
    );
}

// =====================================================
// LAYOUT ADMIN
// =====================================================

function LayoutSistema() {
    const navigate =
        useNavigate();

    const location =
        useLocation();

    const [menuAberto, setMenuAberto] =
        useState(false);

    const [
        modalSaida,
        setModalSaida
    ] = useState(false);

    function fecharMenu() {
        setMenuAberto(false);
    }

    function confirmarLogout() {
        limparAutenticacao();

        setModalSaida(false);
        setMenuAberto(false);

        navigate(
            "/login",
            {
                replace: true
            }
        );
    }

    useEffect(() => {
        setMenuAberto(false);
    }, [location.pathname]);

    function linkClasses({
        isActive
    }) {
        return `
            flex items-center gap-3
            rounded-xl px-4 py-3
            text-sm font-semibold
            transition
            ${
                isActive
                    ? `
                        border border-slate-200
                        bg-white text-slate-900
                    `
                    : `
                        text-slate-300
                        hover:bg-white/5
                        hover:text-white
                    `
            }
        `;
    }

    return (
        <div className="
            min-h-screen bg-white
        ">
            <ModalConfirmarSaida
                aberto={modalSaida}
                onCancelar={() =>
                    setModalSaida(false)
                }
                onConfirmar={
                    confirmarLogout
                }
            />

            {/* MOBILE HEADER */}

            <header className="
                fixed left-0 right-0 top-0
                z-50 flex h-16
                items-center justify-between
                bg-slate-950 px-4
                lg:hidden
            ">
                <div className="
                    flex items-center gap-3
                ">
                    <div className="
                        flex h-10 w-10
                        items-center justify-center
                        rounded-xl bg-white
                    ">
                        <img
                            src={LogoEmpresa}
                            width={50}
                            height={50}
                            alt="ZungaExpress"
                        />
                    </div>

                    <div>
                        <h1 className="
                            text-sm font-bold
                            text-white
                        ">
                            ZungaExpress
                        </h1>

                        <p className="
                            text-[10px]
                            text-slate-400
                        ">
                            Administração
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        setMenuAberto(
                            !menuAberto
                        )
                    }
                    className="
                        flex h-10 w-10
                        items-center justify-center
                        rounded-xl text-white
                        hover:bg-white/10
                    "
                    aria-label="Abrir menu"
                >
                    {menuAberto ? (
                        <FaTimes />
                    ) : (
                        <FaBars />
                    )}
                </button>
            </header>

            {/* SIDEBAR */}

            <aside className={`
                fixed bottom-0 left-0 top-0
                z-40 flex w-72
                flex-col bg-slate-950
                px-5 py-6
                transition-transform duration-200
                lg:translate-x-0
                ${
                    menuAberto
                        ? "translate-x-0"
                        : "-translate-x-full"
                }
            `}>
                <div className="
                    mb-10 flex items-center
                    gap-3 px-2
                ">
                    <div className="
                        flex h-12 w-12
                        items-center justify-center
                        rounded-2xl bg-white
                    ">
                        <img
                            src={LogoEmpresa}
                            width={50}
                            height={50}
                            alt="ZungaExpress"
                        />
                    </div>

                    <div>
                        <h1 className="
                            text-lg font-bold
                            text-white
                        ">
                            ZungaExpress
                        </h1>

                        <p className="
                            text-xs text-slate-400
                        ">
                            Administração
                        </p>
                    </div>
                </div>

                <div className="
                    flex-1 overflow-y-auto
                ">
                    <p className="
                        mb-3 px-3
                        text-[10px] font-bold
                        uppercase
                        tracking-[0.15em]
                        text-slate-500
                    ">
                        Menu principal
                    </p>

                    <nav className="space-y-2">
                        <NavLink
                            to="/"
                            end
                            onClick={fecharMenu}
                            className={linkClasses}
                        >
                            <FaTachometerAlt />
                            Dashboard
                        </NavLink>

                        <NavLink
                            to="/clientes"
                            onClick={fecharMenu}
                            className={linkClasses}
                        >
                            <FaUsers />
                            Clientes
                        </NavLink>

                        <NavLink
                            to="/categorias"
                            onClick={fecharMenu}
                            className={linkClasses}
                        >
                            <FaTags />
                            Categorias
                        </NavLink>

                        <NavLink
                            to="/kilapes"
                            onClick={fecharMenu}
                            className={linkClasses}
                        >
                            <FaMoneyBillWave />
                            Kilapes
                        </NavLink>

                        <NavLink
                            to="/produtos"
                            onClick={fecharMenu}
                            className={linkClasses}
                        >
                            <FaShoppingBag />
                            Produtos
                        </NavLink>

                        <NavLink
                            to="/pedidos"
                            onClick={fecharMenu}
                            className={linkClasses}
                        >
                            <FaClipboardList />
                            Pedidos
                        </NavLink>

                        <NavLink
                            to="/gestores"
                            onClick={fecharMenu}
                            className={linkClasses}
                        >
                            <FaUserCog />
                            Gestores
                        </NavLink>

                        <NavLink
                            to="/vendas"
                            onClick={fecharMenu}
                            className={linkClasses}
                        >
                            <FaReceipt />
                            Vendas
                        </NavLink>

                        <div className="
                            my-5 border-t
                            border-white/10
                        " />

                        <NavLink
                            to="/configuracoes"
                            onClick={fecharMenu}
                            className={linkClasses}
                        >
                            <FaCog />
                            Configurações
                        </NavLink>
                    </nav>
                </div>

                <div className="
                    mt-5 space-y-3
                ">
                    <button
                        type="button"
                        onClick={() =>
                            setModalSaida(true)
                        }
                        className="
                            flex w-full
                            items-center gap-3
                            rounded-xl px-4 py-3
                            text-sm font-semibold
                            text-red-400
                            hover:bg-red-500/10
                        "
                    >
                        <FaSignOutAlt />
                        Sair
                    </button>

                    <div className="
                        rounded-2xl
                        border border-white/10
                        p-4
                    ">
                        <p className="
                            text-xs font-semibold
                            text-white
                        ">
                            ZungaExpress
                        </p>

                        <p className="
                            mt-1 text-[11px]
                            leading-5
                            text-slate-500
                        ">
                            Plataforma de compras
                            e entregas.
                        </p>
                    </div>
                </div>
            </aside>

            {/* OVERLAY */}

            {menuAberto && (
                <div
                    onClick={fecharMenu}
                    className="
                        fixed inset-0 z-30
                        bg-black/40 lg:hidden
                    "
                />
            )}

            {/* CONTEÚDO */}

            <main className="
                min-h-screen
                bg-white
                pt-16
                lg:ml-72
                lg:pt-0
            ">
                <Routes>
                    <Route
                        path="/"
                        element={
                            <Dashboard />
                        }
                    />

                    <Route
                        path="/dashboard"
                        element={
                            <Dashboard />
                        }
                    />

                    <Route
                        path="/clientes"
                        element={
                            <Clientes />
                        }
                    />

                    <Route
                        path="/categorias"
                        element={
                            <Categorias />
                        }
                    />

                    <Route
                        path="/kilapes"
                        element={
                            <Kilapes />
                        }
                    />

                    <Route
                        path="/produtos"
                        element={
                            <Produtos />
                        }
                    />

                    <Route
                        path="/pedidos"
                        element={
                            <Pedidos />
                        }
                    />

                    <Route
                        path="/gestores"
                        element={
                            <Gestores />
                        }
                    />

                    <Route
                        path="/vendas"
                        element={
                            <Vendas />
                        }
                    />

                    {/*
                     * Mantive a rota para Configuracoes
                     * caso o teu componente existente
                     * esteja em arquivo separado.
                     */}

                    <Route
                        path="/configuracoes"
                        element={
                            <div className="p-8">
                                <h1 className="
                                    text-2xl font-bold
                                ">
                                    Configurações
                                </h1>

                                <p className="
                                    mt-2 text-slate-500
                                ">
                                    <Configuracoes /> 
                                </p>
                            </div>
                        }
                    />

                    <Route
                        path="*"
                        element={
                            <Navigate
                                to="/"
                                replace
                            />
                        }
                    />
                </Routes>
            </main>
        </div>
    );
}

// =====================================================
// PROTEÇÃO DAS ROTAS DE CADASTRO
// =====================================================

function RotaCriarAdmin() {
    const [
        existeAdmin,
        setExisteAdmin
    ] = useState(null);

    useEffect(() => {
        let ativo = true;

        async function verificar() {
            try {
                const existe =
                    await verificarExistenciaAdmin();

                if (ativo) {
                    setExisteAdmin(
                        existe
                    );
                }
            } catch (error) {
                console.error(
                    "Erro ao verificar admin:",
                    error
                );

                if (ativo) {
                    setExisteAdmin(
                        null
                    );
                }
            }
        }

        verificar();

        return () => {
            ativo = false;
        };
    }, []);

    if (existeAdmin === null) {
        return (
            <TelaCarregamento />
        );
    }

    if (existeAdmin) {
        return (
            <Navigate
                to="/cadastrar-cliente"
                replace
            />
        );
    }

    return (
        <CriarConta />
    );
}

function RotaCriarCliente() {
    const [
        existeAdmin,
        setExisteAdmin
    ] = useState(null);

    useEffect(() => {
        let ativo = true;

        async function verificar() {
            try {
                const existe =
                    await verificarExistenciaAdmin();

                if (ativo) {
                    setExisteAdmin(
                        existe
                    );
                }
            } catch (error) {
                console.error(
                    "Erro ao verificar admin:",
                    error
                );

                if (ativo) {
                    setExisteAdmin(
                        null
                    );
                }
            }
        }

        verificar();

        return () => {
            ativo = false;
        };
    }, []);

    if (existeAdmin === null) {
        return (
            <TelaCarregamento />
        );
    }

    /*
     * Se ainda não existe admin,
     * o primeiro cadastro deve ser admin.
     */

    if (!existeAdmin) {
        return (
            <Navigate
                to="/criar-conta"
                replace
            />
        );
    }

    return (
        <CadastrarCliente />
    );
}

// =====================================================
// APP PRINCIPAL
// =====================================================

export default function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* HOME PÚBLICA */}

                <Route
                    path="/"
                    element={<Home />}
                />

                {/* LOGIN */}

                <Route
                    path="/login"
                    element={
                        <Login />
                    }
                />

                {/* PRIMEIRO ADMIN */}

                <Route
                    path="/criar-conta"
                    element={
                        <RotaCriarAdmin />
                    }
                />

                {/* CLIENTE */}

                <Route
                    path="/cadastrar-cliente"
                    element={
                        <RotaCriarCliente />
                    }
                />

                {/* CLIENTE LOGADO */}

                <Route
                    path="/cliente"
                    element={
                        <RotaClienteProtegida>
                            <PaginaCliente />
                        </RotaClienteProtegida>
                    }
                />

                {/* GESTOR LOGADO */}

                <Route
                    path="/gestor"
                    element={
                        <RotaGestorProtegida>
                            <PaginaGestor />
                        </RotaGestorProtegida>
                    }
                />

                {/* ADMIN LOGADO */}

                <Route
                    path="/*"
                    element={
                        <RotaAdminProtegida>
                            <LayoutSistema />
                        </RotaAdminProtegida>
                    }
                />

            </Routes>
        </BrowserRouter>
    );
}
