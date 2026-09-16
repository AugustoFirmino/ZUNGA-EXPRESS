import { useCallback, useEffect, useMemo, useState } from "react";

import {
    FaReceipt,
    FaSearch,
    FaSyncAlt,
    FaFilePdf,
    FaUser,
    FaCalendarAlt,
    FaMoneyBillWave,
    FaCheckCircle,
    FaEye,
    FaTimes,
    FaPhone,
    FaEnvelope,
    FaBoxOpen,
    FaImage,
    FaLock
} from "react-icons/fa";

import jsPDF from "jspdf";

import LogoZunga from '../assets/Logo ZungaExpress.png';
// =====================================================
// CONFIGURAÇÃO
// =====================================================

import { API_URL } from "../../servidor/api";

const SERVER_URL = API_URL.replace(/\/API_URL\/?$/, "");

// =====================================================
// API_URL FETCH
// =====================================================

async function API_URLFetch(url, options = {}) {
    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("adminToken") ||
        localStorage.getItem("clienteToken");

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
        headers
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

    return "";
}

// =====================================================
// NORMALIZAR TEXTO
// =====================================================

function normalizarTexto(valor) {
    return String(valor || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
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

    try {
        const dataObj = new Date(data);

        if (Number.isNaN(dataObj.getTime())) {
            return String(data);
        }

        return dataObj.toLocaleString("pt-AO", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch {
        return String(data);
    }
}

// =====================================================
// CONSTRUIR URL DA IMAGEM
// =====================================================

function construirUrlImagem(valor) {
    if (!valor) {
        return "";
    }

    let url = String(valor).trim();

    if (!url) {
        return "";
    }

    if (
        url.startsWith("data:image/") ||
        url.startsWith("blob:")
    ) {
        return url;
    }

    if (
        url.startsWith("http://") ||
        url.startsWith("https://")
    ) {
        return url;
    }

    if (url.startsWith("//")) {
        return `http:${url}`;
    }

    if (url.startsWith("/")) {
        return `${SERVER_URL}${url}`;
    }

    if (
        url.startsWith("uploads/") ||
        url.startsWith("upload/") ||
        url.startsWith("images/") ||
        url.startsWith("imagens/")
    ) {
        return `${SERVER_URL}/${url}`;
    }

    return `${SERVER_URL}/${url}`;
}

// =====================================================
// OBTER IMAGEM DO PRODUTO
// =====================================================

function obterImagemProduto(item) {
    if (!item || typeof item !== "object") {
        return "";
    }

    const produto =
        item.produto &&
        typeof item.produto === "object"
            ? item.produto
            : {};

    const imagem = primeiroValor(
        item.produto_imagem_url,
        item.produtoImagemUrl,
        item.produto_imagem,
        item.produtoImagem,

        item.imagem_url,
        item.imagemUrl,

        item.cloudinary_url,
        item.cloudinaryUrl,

        item.imagem,
        item.image,
        item.foto,
        item.foto_url,
        item.fotoUrl,

        item.url_imagem,
        item.urlImagem,

        item.url,

        produto.imagem_url,
        produto.imagemUrl,

        produto.cloudinary_url,
        produto.cloudinaryUrl,

        produto.imagem,
        produto.image,

        produto.foto,
        produto.foto_url,
        produto.fotoUrl,

        produto.url_imagem,
        produto.urlImagem,

        produto.url
    );

    return construirUrlImagem(imagem);
}

// =====================================================
// OBTER IMAGEM DO CLIENTE
// =====================================================

function obterImagemCliente(cliente, venda = {}) {
    const clienteObj =
        cliente &&
        typeof cliente === "object"
            ? cliente
            : {};

    const imagem = primeiroValor(
        clienteObj.imagem_url,
        clienteObj.imagemUrl,

        clienteObj.cloudinary_url,
        clienteObj.cloudinaryUrl,

        clienteObj.imagem,
        clienteObj.image,

        clienteObj.foto,
        clienteObj.foto_url,
        clienteObj.fotoUrl,

        clienteObj.avatar,
        clienteObj.avatar_url,
        clienteObj.avatarUrl,

        clienteObj.url_imagem,
        clienteObj.urlImagem,

        clienteObj.url,

        venda.cliente_imagem_url,
        venda.clienteImagemUrl,

        venda.cliente_cloudinary_url,
        venda.clienteCloudinaryUrl,

        venda.cliente_imagem,
        venda.clienteImagem,

        venda.cliente_foto,
        venda.clienteFoto,

        venda.cliente_avatar,
        venda.clienteAvatar
    );

    return construirUrlImagem(imagem);
}

// =====================================================
// STATUS DE PAGAMENTO
// =====================================================

function obterStatusPagamento(venda) {
    return primeiroValor(
        venda?.status_pagamento,
        venda?.statusPagamento,
        venda?.pagamento,
        venda?.metodo_pagamento,
        venda?.metodoPagamento,
        venda?.forma_pagamento,
        venda?.formaPagamento,
        ""
    );
}

// =====================================================
// VERIFICAR SE ESTÁ PAGO
// =====================================================

function pagamentoEstaPago(venda) {
    if (!venda) {
        return false;
    }

    /*
     * Procuramos apenas campos relacionados ao pagamento.
     * NÃO usamos "status" da venda aqui.
     */

    const valoresPagamento = [
        venda.status_pagamento,
        venda.statusPagamento,
        venda.pagamento,
        venda.estado_pagamento,
        venda.estadoPagamento,
        venda.situacao_pagamento,
        venda.situacaoPagamento,
        venda.payment_status,
        venda.paymentStatus
    ];

    for (const valor of valoresPagamento) {
        const status = normalizarTexto(valor);

        if (
            status === "pago" ||
            status === "paga" ||
            status === "paid" ||
            status === "confirmado" ||
            status === "confirmada" ||
            status === "pagamento confirmado" ||
            status === "payment confirmed"
        ) {
            return true;
        }
    }

    return false;
}

// =====================================================
// TEXTO DO PAGAMENTO
// =====================================================

function textoStatusPagamento(venda) {
    if (pagamentoEstaPago(venda)) {
        return "Pago";
    }

    const status = obterStatusPagamento(venda);

    if (!status) {
        return "Não pago";
    }

    return String(status);
}

// =====================================================
// VERIFICAR CONCLUÍDO
// =====================================================

function vendaEstaConcluida(venda) {
    const status = normalizarTexto(
        primeiroValor(
            venda?.status,
            venda?.estado,
            venda?.situacao
        )
    );

    return [
        "concluido",
        "concluida",
        "finalizado",
        "finalizada",
        "completed",
        "complete",
        "entregue",
        "entregue_concluido",
        "concluido_pago"
    ].includes(status);
}

// =====================================================
// STATUS PARA EXIBIÇÃO
// =====================================================

function textoStatusVenda(venda) {
    const status = normalizarTexto(
        venda?.status
    );

    if (
        status === "concluido" ||
        status === "concluida" ||
        status === "finalizado" ||
        status === "finalizada" ||
        status === "completed" ||
        status === "complete"
    ) {
        return "Concluído";
    }

    if (status === "entregue") {
        return "Entregue";
    }

    if (!status) {
        return "Concluído";
    }

    return String(
        primeiroValor(
            venda?.status,
            "Concluído"
        )
    );
}

// =====================================================
// NORMALIZAR ITEM
// =====================================================

function normalizarItem(item, index) {
    if (!item || typeof item !== "object") {
        return {
            id: index + 1,
            produto_id: "",
            nome: `Produto ${index + 1}`,
            quantidade: 1,
            preco: 0,
            subtotal: 0,
            descricao: "",
            imagem: ""
        };
    }

    const produto =
        item.produto &&
        typeof item.produto === "object"
            ? item.produto
            : {};

    const nome = primeiroValor(
        item.nome,
        item.nome_produto,
        item.produto_nome,
        item.produtoNome,

        produto.nome,
        produto.nome_produto,
        produto.nomeProduto,

        `Produto ${index + 1}`
    );

    const quantidadeNumero = Number(
        primeiroValor(
            item.quantidade,
            item.qtd,
            item.quantity,
            1
        )
    );

    const quantidade =
        Number.isFinite(quantidadeNumero) &&
        quantidadeNumero > 0
            ? quantidadeNumero
            : 1;

    const preco =
        Number(
            primeiroValor(
                item.preco,
                item.preco_unitario,
                item.precoUnitario,
                item.valor_unitario,
                item.preco_produto,

                produto.preco,
                produto.preco_venda,
                produto.precoVenda,

                0
            )
        ) || 0;

    const subtotalInformado = primeiroValor(
        item.subtotal,
        item.total_item,
        item.totalItem,
        item.valor_total,
        item.valorTotal
    );

    const subtotal =
        subtotalInformado !== ""
            ? Number(subtotalInformado) || 0
            : quantidade * preco;

    return {
        ...item,

        id: primeiroValor(
            item.id,
            item.item_id,
            index + 1
        ),

        produto_id: primeiroValor(
            item.produto_id,
            item.produtoId,
            produto.id
        ),

        nome,

        quantidade,

        preco,

        subtotal,

        descricao: primeiroValor(
            item.produto_descricao,
            item.produtoDescricao,
            item.descricao,
            produto.descricao,
            produto.descricao_produto
        ),

        imagem: obterImagemProduto(item)
    };
}

// =====================================================
// NORMALIZAR VENDA
// =====================================================

function normalizarVenda(venda) {
    if (!venda || typeof venda !== "object") {
        return {
            id: "",
            cliente_id: "",
            cliente: {
                id: "",
                nome: "Cliente",
                telefone: "",
                email: "",
                valor: "",
                imagem_url: ""
            },
            itens: [],
            total: 0,
            status: "",
            status_pagamento: "",
            pagamento: "",
            data: ""
        };
    }

    let itens = primeiroValor(
        venda.itens,
        venda.items,
        venda.produtos,
        venda.detalhes,
        venda.pedido_itens,
        venda.itens_pedido,
        venda.detalhes_pedido,
        venda.itensPedido,
        venda.detalhesPedido
    );

    if (!Array.isArray(itens)) {
        itens = [];
    }

    const itensNormalizados =
        itens.map(normalizarItem);

    const clienteOriginal =
        venda.cliente &&
        typeof venda.cliente === "object"
            ? venda.cliente
            : {};

    const cliente = {
        ...clienteOriginal,

        id: primeiroValor(
            clienteOriginal.id,
            clienteOriginal.cliente_id,
            venda.cliente_id,
            venda.clienteId
        ),

        nome: primeiroValor(
            clienteOriginal.nome,
            clienteOriginal.nome_completo,
            clienteOriginal.nomeCompleto,
            clienteOriginal.nome_cliente,

            venda.cliente_nome,
            venda.clienteNome,
            venda.nome_cliente,
            venda.nomeCliente,

            "Cliente"
        ),

        telefone: primeiroValor(
            clienteOriginal.telefone,
            clienteOriginal.telefone_cliente,
            clienteOriginal.phone,

            venda.cliente_telefone,
            venda.clienteTelefone,
            venda.telefone_cliente,
            venda.telefoneCliente
        ),

        email: primeiroValor(
            clienteOriginal.email,
            clienteOriginal.email_cliente,

            venda.cliente_email,
            venda.clienteEmail,
            venda.email_cliente,
            venda.emailCliente
        ),

        valor: primeiroValor(
            clienteOriginal.valor,
            venda.cliente_valor
        ),

        imagem_url: obterImagemCliente(
            clienteOriginal,
            venda
        )
    };

    const totalCalculado =
        itensNormalizados.reduce(
            (total, item) =>
                total +
                Number(item.subtotal || 0),
            0
        );

    const total =
        Number(
            primeiroValor(
                venda.total,
                venda.total_venda,
                venda.totalVenda,
                venda.valor_total,
                venda.valor,
                totalCalculado
            )
        ) || 0;

    const status = primeiroValor(
        venda.status,
        venda.estado,
        venda.situacao,
        ""
    );

    const statusPagamento =
        obterStatusPagamento(venda);

    const data = primeiroValor(
        venda.data,
        venda.data_venda,
        venda.dataVenda,
        venda.criado_em,
        venda.created_at,
        venda.createdAt,
        venda.data_pedido,
        venda.dataPedido,
        venda.atualizado_em
    );

    return {
        ...venda,

        id: primeiroValor(
            venda.id,
            venda.venda_id,
            venda.vendaId,
            venda.pedido_id,
            venda.pedidoId
        ),

        cliente_id: primeiroValor(
            venda.cliente_id,
            venda.clienteId,
            cliente.id
        ),

        cliente,

        itens: itensNormalizados,

        quantidade_itens:
            Number(venda.quantidade_itens) ||
            itensNormalizados.reduce(
                (
                    totalQuantidade,
                    item
                ) =>
                    totalQuantidade +
                    Number(
                        item.quantidade || 0
                    ),
                0
            ),

        total,

        status,

        status_pagamento:
            statusPagamento,

        pagamento:
            statusPagamento,

        data
    };
}

// =====================================================
// EXTRAIR VENDAS
// =====================================================

function extrairVendas(dados) {
    if (Array.isArray(dados)) {
        return dados;
    }

    if (!dados || typeof dados !== "object") {
        return [];
    }

    const possibilidades = [
        dados.vendas,
        dados.data,
        dados.resultados,
        dados.results,
        dados.rows,
        dados.pedidos,
        dados.pedidos_concluidos,
        dados.pedidosConcluidos,
        dados.dados
    ];

    for (const lista of possibilidades) {
        if (Array.isArray(lista)) {
            return lista;
        }
    }

    return [];
}

// =====================================================
// IMAGEM CLIENTE
// =====================================================

function ImagemCliente({
    cliente,
    venda,
    tamanho = "h-12 w-12"
}) {
    const [erroImagem, setErroImagem] =
        useState(false);

    const imagem =
        obterImagemCliente(
            cliente,
            venda
        );

    useEffect(() => {
        setErroImagem(false);
    }, [imagem]);

    if (!imagem || erroImagem) {
        return (
            <div
                className={`${tamanho} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-400`}
            >
                <FaUser />
            </div>
        );
    }

    return (
        <div
            className={`${tamanho} shrink-0 overflow-hidden rounded-full border-2 border-white bg-slate-100 shadow-sm`}
        >
            <img
                src={imagem}
                alt={
                    cliente?.nome ||
                    "Cliente"
                }
                className="h-full w-full object-cover"
                onError={() =>
                    setErroImagem(true)
                }
            />
        </div>
    );
}

// =====================================================
// IMAGEM PRODUTO
// =====================================================

function ImagemProduto({
    item,
    tamanho = "h-14 w-14"
}) {
    const [erroImagem, setErroImagem] =
        useState(false);

    const imagem =
        obterImagemProduto(item);

    useEffect(() => {
        setErroImagem(false);
    }, [imagem]);

    if (!imagem || erroImagem) {
        return (
            <div
                className={`${tamanho} flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400`}
            >
                <FaImage />
            </div>
        );
    }

    return (
        <div
            className={`${tamanho} shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100`}
        >
            <img
                src={imagem}
                alt={
                    item?.nome ||
                    "Produto"
                }
                className="h-full w-full object-cover"
                onError={() =>
                    setErroImagem(true)
                }
            />
        </div>
    );
}

// =====================================================
// GERAR PDF
// =====================================================

function gerarPDFVenda(vendaOriginal) {
    const venda =
        normalizarVenda(vendaOriginal);

    // =================================================
    // BLOQUEIO DE SEGURANÇA
    // =================================================

    if (!pagamentoEstaPago(venda)) {
        throw new Error(
            "Não é possível gerar o PDF porque o pedido ainda não está pago."
        );
    }

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    const larguraPagina =
        doc.internal.pageSize.getWidth();

    const alturaPagina =
        doc.internal.pageSize.getHeight();

    const margemtop = 30;
    const margem = 5;
    let y = 18;

    const nomeEmpresa =
        localStorage.getItem("nome_salao") ||
        localStorage.getItem("nome_empresa") ||
        "ZungaExpress";

    const telefoneEmpresa =
        localStorage.getItem("telefone_salao") ||
        localStorage.getItem("telefone_empresa") ||
        "";

    const emailEmpresa =
        localStorage.getItem("email_salao") ||
        localStorage.getItem("email_empresa") ||
        "";

    // =================================================
    // CABEÇALHO
    // =================================================

    doc.setFillColor(15, 23, 42);

    doc.rect(
        0,
        0,
        larguraPagina,
        35,
        "F"
    );

    doc.setTextColor(
        255,
        255,
        255
    );

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.setFontSize(20);
    doc.addImage(LogoZunga,5,6,20,20,30,true,0);
    doc.text(
        String(nomeEmpresa),
        margemtop,
        15
    );

    doc.setFontSize(10);

    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.text(
        "Comprovativo de Venda - PAGAMENTO CONFIRMADO",
        margemtop,
        22
    );

    if (telefoneEmpresa) {
        doc.text(
            `Telefone: ${telefoneEmpresa}`,
            larguraPagina - margem,
            15,
            {
                align: "right"
            }
        );
    }

    if (emailEmpresa) {
        doc.text(
            String(emailEmpresa),
            larguraPagina - margem,
            22,
            {
                align: "right"
            }
        );
    }

    y = 47;

    // =================================================
    // VENDA
    // =================================================

    doc.setTextColor(
        15,
        23,
        42
    );

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.setFontSize(14);

    const numeroVenda =
        venda.id
            ? `#${venda.id}`
            : "Sem número";

    doc.text(
        `Venda ${numeroVenda}`,
        margem,
        y
    );

    y += 8;

    doc.setFontSize(10);

    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.setTextColor(
        71,
        85,
        105
    );

    doc.text(
        `Data: ${formatarData(venda.data)}`,
        margem,
        y
    );

  

    y += 6;

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.setTextColor(
        5,
        150,
        105
    );

    doc.text(
        "Pagamento: PAGO",
        margem,
        y
    );

    // =================================================
    // CLIENTE
    // =================================================

    y += 12;

    doc.setFillColor(
        248,
        250,
        252
    );

    doc.roundedRect(
        margem,
        y,
        larguraPagina - margem * 2,
        30,
        3,
        3,
        "F"
    );

    doc.setTextColor(
        15,
        23,
        42
    );

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.setFontSize(11);

    doc.text(
        "Dados do cliente",
        margem + 5,
        y + 7
    );

    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.setFontSize(10);

    doc.setTextColor(
        51,
        65,
        85
    );

    doc.text(
        `Nome: ${
            venda.cliente.nome ||
            "Cliente"
        }`,
        margem + 5,
        y + 14
    );

    doc.text(
        `Telefone: ${
            venda.cliente.telefone ||
            "-"
        }`,
        margem + 5,
        y + 21
    );

    doc.text(
        `Email: ${
            venda.cliente.email ||
            "-"
        }`,
        margem + 5,
        y + 28
    );

    y += 40;

    // =================================================
    // PRODUTOS
    // =================================================

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.setFontSize(12);

    doc.setTextColor(
        15,
        23,
        42
    );

    doc.text(
        "Produtos",
        margem,
        y
    );

    y += 7;

    const colunaProduto = margem;
    const colunaQuantidade = 112;
    const colunaPreco = 145;
    const colunaSubtotal = 180;

    doc.setFillColor(
        15,
        23,
        42
    );

    doc.rect(
        margem,
        y,
        larguraPagina - margem * 2,
        8,
        "F"
    );

    doc.setTextColor(
        255,
        255,
        255
    );

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.setFontSize(9);

    doc.text(
        "Produto",
        colunaProduto + 2,
        y + 5.5
    );

    doc.text(
        "Qtd.",
        colunaQuantidade,
        y + 5.5
    );

    doc.text(
        "Preço",
        colunaPreco,
        y + 5.5
    );

    doc.text(
        "Subtotal",
        colunaSubtotal,
        y + 5.5
    );

    y += 8;

    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.setFontSize(9);

    if (venda.itens.length === 0) {
        doc.setTextColor(
            100,
            116,
            139
        );

        doc.text(
            "Produtos não foram enviados pela API_URL de listagem.",
            margem + 2,
            y + 7
        );

        y += 14;
    } else {
        venda.itens.forEach(
            (item, index) => {
                if (
                    y >
                    alturaPagina - 50
                ) {
                    doc.addPage();

                    y = 20;

                    doc.setFont(
                        "helvetica",
                        "bold"
                    );

                    doc.setFontSize(12);

                    doc.setTextColor(
                        15,
                        23,
                        42
                    );

                    doc.text(
                        "Produtos - continuação",
                        margem,
                        y
                    );

                    y += 8;
                }

                if (index % 2 === 0) {
                    doc.setFillColor(
                        248,
                        250,
                        252
                    );

                    doc.rect(
                        margem,
                        y,
                        larguraPagina -
                            margem * 2,
                        9,
                        "F"
                    );
                }

                doc.setTextColor(
                    51,
                    65,
                    85
                );

                const nome =
                    String(
                        item.nome ||
                        "Produto"
                    );

                const nomeLimitado =
                    doc.splitTextToSize(
                        nome,
                        90
                    );

                doc.text(
                    nomeLimitado[0],
                    colunaProduto + 2,
                    y + 6
                );

                doc.text(
                    String(
                        item.quantidade
                    ),
                    colunaQuantidade,
                    y + 6
                );

                doc.text(
                    formatarMoeda(
                        item.preco
                    ),
                    colunaPreco,
                    y + 6
                );

                doc.text(
                    formatarMoeda(
                        item.subtotal
                    ),
                    colunaSubtotal,
                    y + 6
                );

                y += 9;
            }
        );
    }

    // =================================================
    // TOTAL
    // =================================================

    y += 8;

    if (
        y >
        alturaPagina - 45
    ) {
        doc.addPage();

        y = 20;
    }

    doc.setDrawColor(
        226,
        232,
        240
    );

    doc.line(
        margem,
        y,
        larguraPagina - margem,
        y
    );

    y += 12;

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.setFontSize(15);

    doc.setTextColor(
        15,
        23,
        42
    );

    doc.text(
        "TOTAL PAGO:",
        larguraPagina - 130,
        y
    );

    doc.text(
        formatarMoeda(
            venda.total
        ),
        larguraPagina - margem,
        y,
        {
            align: "right"
        }
    );

    // =================================================
    // RODAPÉ
    // =================================================

    const rodapeY =
        alturaPagina - 18;

    doc.setDrawColor(
        226,
        232,
        240
    );

    doc.line(
        margem,
        rodapeY - 5,
        larguraPagina - margem,
        rodapeY - 5
    );

    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.setFontSize(8);

    doc.setTextColor(
        100,
        116,
        139
    );

    doc.text(
        `Documento gerado pela ${nomeEmpresa}.`,
        margem,
        rodapeY
    );

    doc.text(
        `Venda ${numeroVenda} - PAGO`,
        larguraPagina - margem,
        rodapeY,
        {
            align: "right"
        }
    );

    const identificador =
        String(
            venda.id || "venda"
        ).replace(
            /[^a-zA-Z0-9_-]/g,
            "_"
        );

    doc.save(
        `venda_${identificador}_PAGO.pdf`
    );
}



// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function Vendas() {
    const [vendas, setVendas] =
        useState([]);

    const [carregando, setCarregando] =
        useState(true);

    const [erro, setErro] =
        useState("");

    const [busca, setBusca] =
        useState("");

    const [
        vendaSelecionada,
        setVendaSelecionada
    ] = useState(null);

    const [gerandoPDF, setGerandoPDF] =
        useState(null);

    // =================================================
    // CARREGAR VENDAS
    // =================================================


   

    const carregarVendas =
        useCallback(async () => {
            try {
                setCarregando(true);
                setErro("");

                const resposta =
                    await API_URLFetch(
                        `${API_URL}/vendas`
                    );

                const dados =
                    await lerResposta(
                        resposta
                    );

                if (!resposta.ok) {
                    throw new Error(
                        dados?.mensagem ||
                        dados?.message ||
                        "Erro ao carregar vendas."
                    );
                }

                const lista =
                    extrairVendas(dados);

                const normalizadas =
                    lista.map(
                        normalizarVenda
                    );

                let concluidas =
                    normalizadas.filter(
                        vendaEstaConcluida
                    );

                /*
                 * Caso a API_URL não esteja enviando
                 * o status da venda, mantém os dados
                 * recebidos para não quebrar a página.
                 *
                 * IMPORTANTE:
                 * Isso NÃO significa que estão pagas.
                 * O PDF continuará bloqueado pelo
                 * pagamentoEstaPago().
                 */

                if (
                    normalizadas.length > 0 &&
                    concluidas.length === 0
                ) {
                    console.warn(
                        "Nenhum status de conclusão reconhecido. Mantendo vendas recebidas."
                    );

                    concluidas =
                        normalizadas;
                }

                setVendas(
                    concluidas
                );
            } catch (error) {
                console.error(
                    "ERRO AO CARREGAR VENDAS:",
                    error
                );

                setVendas([]);

                setErro(
                    error?.message ||
                    "Não foi possível carregar as vendas."
                );
            } finally {
                setCarregando(false);
            }
        }, []);

    // =================================================
    // CARREGAR
    // =================================================

    useEffect(() => {
        carregarVendas();
    }, [carregarVendas]);

    // =================================================
    // PESQUISA
    // =================================================

    const vendasFiltradas =
        useMemo(() => {
            const termo =
                busca
                    .trim()
                    .toLowerCase();

            if (!termo) {
                return vendas;
            }

            return vendas.filter(
                (venda) => {
                    const texto = [
                        venda.id,
                        venda.cliente?.nome,
                        venda.cliente?.telefone,
                        venda.cliente?.email,
                        venda.status,
                        venda.status_pagamento,
                        venda.pagamento,

                        ...(venda.itens || [])
                            .map(
                                (item) =>
                                    item.nome
                            )
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                    return texto.includes(
                        termo
                    );
                }
            );
        }, [
            vendas,
            busca
        ]);


        
    // =================================================
    // GERAR PDF
    // =================================================

    const handlePDF =
        async (venda) => {
            if (!venda) {
                return;
            }

            // =========================================
            // BLOQUEIO PRINCIPAL
            // =========================================

            if (!pagamentoEstaPago(venda)) {
                setErro(
                    `O PDF da venda #${
                        venda.id || ""
                    } não pode ser gerado porque o pedido ainda não está pago.`
                );

                return;
            }

            try {
                setErro("");

                setGerandoPDF(
                    venda.id
                );

                await new Promise(
                    (resolve) =>
                        setTimeout(
                            resolve,
                            100
                        )
                );

                gerarPDFVenda(
                    venda
                );
            } catch (error) {
                console.error(
                    "Erro ao gerar PDF:",
                    error
                );

                setErro(
                    error?.message ||
                    "Não foi possível gerar o PDF."
                );
            } finally {
                setGerandoPDF(null);
            }
        };

    // =================================================
    // TOTAL
    // =================================================

    // =====================================================
// RESUMO DAS VENDAS PAGAS
// =====================================================

const vendasPagas = useMemo(() => {
    return vendas.filter((venda) =>
        pagamentoEstaPago(venda)
    );
}, [vendas]);

const totalVendasConcluidas = useMemo(() => {
    return vendasPagas.length;
}, [vendasPagas]);

const totalVendido = useMemo(() => {
    return vendasPagas.reduce(
        (total, venda) =>
            total + Number(venda.total || 0),
        0
    );
}, [vendasPagas]);
    

    
    
    // =================================================
    // RENDER
    // =================================================

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

            {/* ================================================= */}
            {/* CABEÇALHO */}
            {/* ================================================= */}

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div className="flex items-center gap-3">

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                        <FaReceipt size={20} />
                    </div>

                    <div>
                        <h1 className="text-2xl font-black text-slate-950">
                            Vendas
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Consulte os pedidos concluídos.
                            O PDF só está disponível para pedidos pagos.
                        </p>
                    </div>

                </div>

                <button
                    type="button"
                    onClick={carregarVendas}
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
                        " >
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

            {/* ================================================= */}
            {/* ERRO */}
            {/* ================================================= */}

            {erro && (
                <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">

                    <span>
                        {erro}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setErro("")
                        }
                        className="text-red-500 hover:text-red-700"
                    >
                        <FaTimes />
                    </button>

                </div>
            )}

            {/* ================================================= */}
            {/* RESUMO */}
            {/* ================================================= */}

            <div className="mb-6 grid gap-4 sm:grid-cols-2">

                <div className="rounded-2xl border border-slate-200 bg-white p-5">

                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Vendas concluídas
                            </p>

                            <p className="mt-2 text-2xl font-black text-slate-950">
                                {totalVendasConcluidas}
                            </p>
                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                            <FaCheckCircle />
                        </div>

                    </div>

                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">

                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Valor vendido
                            </p>

                            <p className="mt-2 text-2xl font-black text-slate-950">
                                {formatarMoeda(
                                    totalVendido
                                )}
                            </p>
                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                            <FaMoneyBillWave />
                        </div>

                    </div>

                </div>

            </div>

            {/* ================================================= */}
            {/* PESQUISA */}
            {/* ================================================= */}

            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">

                <div className="relative">

                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                    <input
                        type="search"
                        value={busca}
                        onChange={(e) =>
                            setBusca(
                                e.target.value
                            )
                        }
                        placeholder="Pesquisar por cliente, telefone, produto ou número da venda..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 outline-none transition focus:border-slate-900 focus:bg-white"
                    />

                </div>

            </div>

            {/* ================================================= */}
            {/* LOADING */}
            {/* ================================================= */}

            {carregando ? (

                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">

                    <FaSyncAlt className="mx-auto animate-spin text-2xl text-slate-400" />

                    <p className="mt-4 text-sm text-slate-500">
                        A carregar vendas...
                    </p>

                </div>

            ) : vendasFiltradas.length === 0 ? (

                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">

                    <FaBoxOpen className="mx-auto text-4xl text-slate-300" />

                    <h2 className="mt-4 text-lg font-bold text-slate-800">
                        Nenhuma venda encontrada
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        A API_URL não retornou vendas para apresentar.
                    </p>

                    <button
                        type="button"
                        onClick={carregarVendas}
                        className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
                    >
                        Tentar novamente
                    </button>

                </div>

            ) : (

                <>

                    {/* ================================================= */}
                    {/* DESKTOP */}
                    {/* ================================================= */}

                    <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">

                        <div className="overflow-x-auto">

                            <table className="min-w-full text-left">

                                <thead className="bg-slate-950 text-xs uppercase tracking-wide text-white">

                                    <tr>

                                        <th className="px-5 py-4">
                                            Venda
                                        </th>

                                        <th className="px-5 py-4">
                                            Cliente
                                        </th>

                                        <th className="px-5 py-4">
                                            Data
                                        </th>

                                        <th className="px-5 py-4">
                                            Pagamento
                                        </th>

                                        <th className="px-5 py-4">
                                            Produtos
                                        </th>

                                        <th className="px-5 py-4">
                                            Total
                                        </th>

                                        <th className="px-5 py-4 text-center">
                                            Ações
                                        </th>

                                    </tr>

                                </thead>

                                <tbody className="divide-y divide-slate-100">

                                    {vendasFiltradas.map(
                                        (
                                            venda,
                                            index
                                        ) => {

                                            const estaPago =
                                                pagamentoEstaPago(
                                                    venda
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        String(
                                                            venda.id ||
                                                            `venda-${index}`
                                                        )
                                                    }
                                                    className="hover:bg-slate-50"
                                                >

                                                    {/* VENDA */}

                                                    <td className="px-5 py-5">

                                                        <div className="flex items-center gap-3">

                                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                                                                <FaReceipt />
                                                            </div>

                                                            <div>

                                                                <p className="font-bold text-slate-900">
                                                                    #
                                                                    {
                                                                        venda.id ||
                                                                        "-"
                                                                    }
                                                                </p>


                                                            </div>

                                                        </div>

                                                    </td>

                                                    {/* CLIENTE */}

                                                    <td className="px-5 py-5">

                                                        <div className="flex items-center gap-3">

                                                            <ImagemCliente
                                                                cliente={
                                                                    venda.cliente
                                                                }
                                                                venda={
                                                                    venda
                                                                }
                                                                tamanho="h-11 w-11"
                                                            />

                                                            <div>

                                                                <p className="font-semibold text-slate-800">
                                                                    {
                                                                        venda.cliente?.nome ||
                                                                        "Cliente"
                                                                    }
                                                                </p>

                                                                {venda.cliente?.telefone && (
                                                                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">

                                                                        <FaPhone />

                                                                        {
                                                                            venda.cliente.telefone
                                                                        }

                                                                    </p>
                                                                )}

                                                            </div>

                                                        </div>

                                                    </td>

                                                    {/* DATA */}

                                                    <td className="px-5 py-5 text-sm text-slate-600">

                                                        <div className="flex items-center gap-2">

                                                            <FaCalendarAlt />

                                                            {
                                                                formatarData(
                                                                    venda.data
                                                                )
                                                            }

                                                        </div>

                                                    </td>

                                                    {/* PAGAMENTO */}

                                                    <td className="px-5 py-5">

                                                        {estaPago ? (

                                                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">

                                                                <FaCheckCircle />

                                                                Pago

                                                            </span>

                                                        ) : (

                                                            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">

                                                                <FaLock />

                                                                {
                                                                    textoStatusPagamento(
                                                                        venda
                                                                    )
                                                                }

                                                            </span>

                                                        )}

                                                    </td>

                                                    {/* PRODUTOS */}

                                                    <td className="px-5 py-5">

                                                        <div className="flex items-center">

                                                            {venda.itens
                                                                .slice(
                                                                    0,
                                                                    3
                                                                )
                                                                .map(
                                                                    (
                                                                        item,
                                                                        itemIndex
                                                                    ) => (

                                                                        <div
                                                                            key={
                                                                                item.id ||
                                                                                itemIndex
                                                                            }
                                                                            className={
                                                                                itemIndex ===
                                                                                0
                                                                                    ? ""
                                                                                    : "-ml-2"
                                                                            }
                                                                        >

                                                                            <ImagemProduto
                                                                                item={
                                                                                    item
                                                                                }
                                                                                tamanho="h-9 w-9"
                                                                            />

                                                                        </div>

                                                                    )
                                                                )}

                                                        </div>

                                                        <p className="mt-1 text-xs text-slate-500">

                                                            {
                                                                venda.quantidade_itens
                                                            }{" "}
                                                            item(ns)

                                                        </p>

                                                    </td>

                                                    {/* TOTAL */}

                                                    <td className="px-5 py-5">

                                                        <p className="font-black text-slate-950">

                                                            {
                                                                formatarMoeda(
                                                                    venda.total
                                                                )
                                                            }

                                                        </p>

                                                    </td>

                                                    {/* AÇÕES */}

                                                    <td className="px-5 py-5">

                                                        <div className="flex items-center justify-center gap-2">

                                                            {/* VER */}

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setVendaSelecionada(
                                                                        venda
                                                                    )
                                                                }
                                                                title="Ver venda"
                                                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                                                            >

                                                                <FaEye />

                                                            </button>

                                                            {/* PDF */}

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handlePDF(
                                                                        venda
                                                                    )
                                                                }
                                                                disabled={
                                                                    !estaPago ||
                                                                    gerandoPDF ===
                                                                        venda.id
                                                                }
                                                                title={
                                                                    estaPago
                                                                        ? "Gerar PDF"
                                                                        : "PDF disponível apenas após pagamento"
                                                                }
                                                                className={
                                                                    estaPago
                                                                        ? "flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                                        : "flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-xl bg-slate-100 text-slate-300"
                                                                }
                                                            >

                                                                {gerandoPDF ===
                                                                venda.id ? (
                                                                    <FaSyncAlt className="animate-spin" />
                                                                ) : estaPago ? (
                                                                    <FaFilePdf />
                                                                ) : (
                                                                    <FaLock />
                                                                )}

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

                    </div>

                    {/* ================================================= */}
                    {/* MOBILE */}
                    {/* ================================================= */}

                    <div className="space-y-4 md:hidden">

                        {vendasFiltradas.map(
                            (
                                venda,
                                index
                            ) => {

                                const estaPago =
                                    pagamentoEstaPago(
                                        venda
                                    );

                                return (
                                    <div
                                        key={
                                            String(
                                                venda.id ||
                                                `mobile-${index}`
                                            )
                                        }
                                        className="rounded-2xl border border-slate-200 bg-white p-5"
                                    >

                                        <div className="flex items-start justify-between gap-4">

                                            <div className="flex items-center gap-3">

                                                <ImagemCliente
                                                    cliente={
                                                        venda.cliente
                                                    }
                                                    venda={
                                                        venda
                                                    }
                                                    tamanho="h-12 w-12"
                                                />

                                                <div>

                                                    <p className="font-black text-slate-900">
                                                        Venda #
                                                        {
                                                            venda.id ||
                                                            "-"
                                                        }
                                                    </p>

                                                    <p className="text-xs text-slate-500">
                                                        {
                                                            formatarData(
                                                                venda.data
                                                            )
                                                        }
                                                    </p>

                                                </div>

                                            </div>

                                            {estaPago ? (

                                                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">

                                                    <FaCheckCircle />

                                                    Pago

                                                </span>

                                            ) : (

                                                <span className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">

                                                    <FaLock />

                                                    Não pago

                                                </span>

                                            )}

                                        </div>

                                        <div className="mt-5 space-y-3">

                                            <div className="flex items-center gap-3 text-sm">

                                                <FaUser className="text-slate-400" />

                                                <span className="font-semibold text-slate-700">

                                                    {
                                                        venda.cliente?.nome ||
                                                        "Cliente"
                                                    }

                                                </span>

                                            </div>

                                            {venda.cliente?.telefone && (
                                                <div className="flex items-center gap-3 text-sm text-slate-500">

                                                    <FaPhone />

                                                    {
                                                        venda.cliente.telefone
                                                    }

                                                </div>
                                            )}

                                            <div className="flex items-center gap-3 text-sm text-emerald-600">

                                                <FaCheckCircle />

                                                {
                                                    textoStatusVenda(
                                                        venda
                                                    )
                                                }

                                            </div>

                                        </div>

                                        {/* PRODUTOS */}

                                        {venda.itens.length >
                                            0 && (

                                            <div className="mt-5">

                                                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                                                    Produtos
                                                </p>

                                                <div className="flex gap-2 overflow-x-auto pb-1">

                                                    {venda.itens
                                                        .slice(
                                                            0,
                                                            5
                                                        )
                                                        .map(
                                                            (
                                                                item,
                                                                itemIndex
                                                            ) => (

                                                                <div
                                                                    key={
                                                                        item.id ||
                                                                        itemIndex
                                                                    }
                                                                    className="shrink-0"
                                                                >

                                                                    <ImagemProduto
                                                                        item={
                                                                            item
                                                                        }
                                                                        tamanho="h-14 w-14"
                                                                    />

                                                                </div>

                                                            )
                                                        )}

                                                </div>

                                            </div>

                                        )}

                                        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">

                                            <div>

                                                <p className="text-xs text-slate-400">
                                                    Total
                                                </p>

                                                <p className="text-xl font-black text-slate-950">

                                                    {
                                                        formatarMoeda(
                                                            venda.total
                                                        )
                                                    }

                                                </p>

                                            </div>

                                            <div className="flex gap-2">

                                                {/* VER */}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setVendaSelecionada(
                                                            venda
                                                        )
                                                    }
                                                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700"
                                                    title="Ver venda"
                                                >

                                                    <FaEye />

                                                </button>

                                                {/* PDF */}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handlePDF(
                                                            venda
                                                        )
                                                    }
                                                    disabled={
                                                        !estaPago ||
                                                        gerandoPDF ===
                                                            venda.id
                                                    }
                                                    className={
                                                        estaPago
                                                            ? "flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 disabled:opacity-50"
                                                            : "flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-xl bg-slate-100 text-slate-300"
                                                    }
                                                    title={
                                                        estaPago
                                                            ? "Gerar PDF"
                                                            : "PDF disponível apenas após pagamento"
                                                    }
                                                >

                                                    {gerandoPDF ===
                                                    venda.id ? (
                                                        <FaSyncAlt className="animate-spin" />
                                                    ) : estaPago ? (
                                                        <FaFilePdf />
                                                    ) : (
                                                        <FaLock />
                                                    )}

                                                </button>

                                            </div>

                                        </div>

                                    </div>
                                );
                            }
                        )}

                    </div>

                </>

            )}

            {/* ================================================= */}
            {/* MODAL */}
            {/* ================================================= */}

            {vendaSelecionada && (

                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    onMouseDown={(e) => {
                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            setVendaSelecionada(
                                null
                            );
                        }
                    }}
                >

                    <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">

                        {/* HEADER */}

                        <div className="flex items-center justify-between bg-slate-950 px-5 py-4 text-white">

                            <div className="flex items-center gap-3">

                                <ImagemCliente
                                    cliente={
                                        vendaSelecionada.cliente
                                    }
                                    venda={
                                        vendaSelecionada
                                    }
                                    tamanho="h-12 w-12"
                                />

                                <div>

                                    <h2 className="font-black">
                                        Venda #
                                        {
                                            vendaSelecionada.id ||
                                            "-"
                                        }
                                    </h2>

                                    <p className="mt-1 text-xs text-slate-400">

                                        {
                                            vendaSelecionada.cliente
                                                ?.nome ||
                                            "Cliente"
                                        }

                                        {" • "}

                                        {
                                            formatarData(
                                                vendaSelecionada.data
                                            )
                                        }

                                    </p>

                                </div>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setVendaSelecionada(
                                        null
                                    )
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20"
                            >

                                <FaTimes />

                            </button>

                        </div>

                        {/* CONTEÚDO */}

                        <div className="max-h-[calc(90vh-150px)] overflow-y-auto p-5">

                            {/* STATUS */}

                            <div
                                className={
                                    pagamentoEstaPago(
                                        vendaSelecionada
                                    )
                                        ? "mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700"
                                        : "mb-5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-700"
                                }
                            >

                                {pagamentoEstaPago(
                                    vendaSelecionada
                                ) ? (
                                    <FaCheckCircle />
                                ) : (
                                    <FaLock />
                                )}

                                <div>

                                   

                                    <p className="text-xs">

                                        Pagamento:{" "}

                                        {
                                            textoStatusPagamento(
                                                vendaSelecionada
                                            )
                                        }

                                    </p>

                                </div>

                            </div>

                            {/* CLIENTE */}

                            <div className="rounded-2xl bg-slate-50 p-5">

                                <div className="mb-4 flex items-center gap-4">

                                    <ImagemCliente
                                        cliente={
                                            vendaSelecionada.cliente
                                        }
                                        venda={
                                            vendaSelecionada
                                        }
                                        tamanho="h-20 w-20"
                                    />

                                    <div>

                                        <h3 className="font-bold text-slate-900">
                                            Dados do cliente
                                        </h3>

                                        <p className="mt-1 text-sm text-slate-500">

                                            {
                                                vendaSelecionada
                                                    .cliente
                                                    ?.nome ||
                                                "Cliente"
                                            }

                                        </p>

                                    </div>

                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">

                                    <p className="flex items-center gap-2 text-sm text-slate-600">

                                        <FaPhone className="text-slate-400" />

                                        {
                                            vendaSelecionada
                                                .cliente
                                                ?.telefone ||
                                            "-"
                                        }

                                    </p>

                                    <p className="flex items-center gap-2 text-sm text-slate-600">

                                        <FaEnvelope className="text-slate-400" />

                                        {
                                            vendaSelecionada
                                                .cliente
                                                ?.email ||
                                            "-"
                                        }

                                    </p>

                                </div>

                            </div>

                            {/* PRODUTOS */}

                            <div className="mt-6">

                                <div className="mb-4 flex items-center justify-between">

                                    <h3 className="font-bold text-slate-900">
                                        Produtos do pedido
                                    </h3>

                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">

                                        {
                                            vendaSelecionada.itens
                                                .length
                                        }{" "}
                                        produto(s)

                                    </span>

                                </div>

                                {vendaSelecionada.itens.length ===
                                0 ? (

                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">

                                        <FaBoxOpen className="mx-auto text-3xl text-slate-300" />

                                        <p className="mt-3 text-sm text-slate-500">

                                            Os produtos deste pedido não foram enviados pelo endpoint de listagem.

                                        </p>

                                    </div>

                                ) : (

                                    <div className="space-y-3">

                                        {vendaSelecionada.itens.map(
                                            (
                                                item,
                                                index
                                            ) => (

                                                <div
                                                    key={
                                                        item.id ||
                                                        index
                                                    }
                                                    className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                                                >

                                                    <div className="flex items-center gap-4">

                                                        <ImagemProduto
                                                            item={
                                                                item
                                                            }
                                                            tamanho="h-20 w-20"
                                                        />

                                                        <div className="min-w-0 flex-1">

                                                            <p className="font-bold text-slate-800">

                                                                {
                                                                    item.nome
                                                                }

                                                            </p>

                                                            {item.descricao && (
                                                                <p className="mt-1 line-clamp-2 text-xs text-slate-500">

                                                                    {
                                                                        item.descricao
                                                                    }

                                                                </p>
                                                            )}

                                                            <div className="mt-2 flex flex-wrap gap-2">

                                                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">

                                                                    Qtd:{" "}

                                                                    {
                                                                        item.quantidade
                                                                    }

                                                                </span>

                                                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">

                                                                    {
                                                                        formatarMoeda(
                                                                            item.preco
                                                                        )
                                                                    }{" "}
                                                                    / un.

                                                                </span>

                                                            </div>

                                                        </div>

                                                        <div className="shrink-0 text-right">

                                                            <p className="text-xs text-slate-400">
                                                                Subtotal
                                                            </p>

                                                            <p className="mt-1 font-black text-slate-900">

                                                                {
                                                                    formatarMoeda(
                                                                        item.subtotal
                                                                    )
                                                                }

                                                            </p>

                                                        </div>

                                                    </div>

                                                </div>

                                            )
                                        )}

                                    </div>

                                )}

                            </div>

                            {/* TOTAL */}

                            <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-950 p-5 text-white">

                                <div>

                                    <p className="text-xs text-slate-400">
                                        Total da venda
                                    </p>

                                    <p className="mt-1 text-sm font-semibold">

                                        {
                                            textoStatusPagamento(
                                                vendaSelecionada
                                            )
                                        }

                                    </p>

                                </div>

                                <p className="text-2xl font-black">

                                    {
                                        formatarMoeda(
                                            vendaSelecionada.total
                                        )
                                    }

                                </p>

                            </div>

                        </div>

                        {/* FOOTER */}

                        <div className="flex gap-3 border-t border-slate-100 p-4">

                            <button
                                type="button"
                                onClick={() =>
                                    setVendaSelecionada(
                                        null
                                    )
                                }
                                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                            >
                                Fechar
                            </button>

                            {/* PDF DO MODAL */}

                            <button
                                type="button"
                                onClick={() =>
                                    handlePDF(
                                        vendaSelecionada
                                    )
                                }
                                disabled={
                                    !pagamentoEstaPago(
                                        vendaSelecionada
                                    ) ||
                                    gerandoPDF ===
                                        vendaSelecionada.id
                                }
                                className={
                                    pagamentoEstaPago(
                                        vendaSelecionada
                                    )
                                        ? "flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        : "flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-200 px-4 py-3 text-sm font-bold text-slate-400"
                                }
                            >

                                {gerandoPDF ===
                                vendaSelecionada.id ? (
                                    <>
                                        <FaSyncAlt className="animate-spin" />
                                        A gerar...
                                    </>
                                ) : pagamentoEstaPago(
                                      vendaSelecionada
                                  ) ? (
                                    <>
                                        <FaFilePdf />
                                        Gerar PDF
                                    </>
                                ) : (
                                    <>
                                        <FaLock />
                                        PDF bloqueado
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