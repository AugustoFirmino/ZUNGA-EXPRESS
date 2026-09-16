import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	FaArrowRight,
	FaBoxOpen,
	FaCheckCircle,
	FaChevronRight,
	FaSearch,
	FaShoppingBag,
	FaStar,
	FaTruck,
} from "react-icons/fa";

import LogoEmpresa from "../assets/Logo ZungaExpress.png";
import { API_URL } from "../../servidor/api";

const obterImagemProduto = (produto) => {
	const candidatos = [
		produto?.cloudinary_url,
		produto?.imagem_url,
		produto?.imagem,
		produto?.image,
		produto?.foto,
		produto?.produto_imagem,
		produto?.produto_imagem_url,
	];

	return candidatos.find((valor) => typeof valor === "string" && valor.trim())?.trim() || "";
};

const formatarKwanza = (valor) => {
	const numero = Number(valor || 0);
	return `${new Intl.NumberFormat("pt-AO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number.isFinite(numero) ? numero : 0)} Kz`;
};

const normalizarProdutos = (dados) => {
	const lista = Array.isArray(dados)
		? dados
		: dados?.produtos || dados?.data || dados?.rows || [];

	return Array.isArray(lista) ? lista.map((produto) => ({
		...produto,
		id: produto.id ?? produto.produto_id,
		nome: produto.nome ?? produto.nome_produto ?? "Produto",
		descricao: produto.descricao ?? "",
		preco: produto.preco ?? produto.valor ?? 0,
		estoque: produto.estoque ?? produto.quantidade ?? produto.stock ?? 0,
		categoria: produto.categoria ?? produto.categoria_nome ?? produto.nome_categoria ?? "Destaques",
		imagem: obterImagemProduto(produto),
	})) : [];
};

export default function Home() {
	const navigate = useNavigate();
	const [produtos, setProdutos] = useState([]);
	const [pesquisa, setPesquisa] = useState("");
	const [carregando, setCarregando] = useState(true);

	useEffect(() => {
		let ativo = true;

		const carregarProdutos = async () => {
			try {
				const resposta = await fetch(`${API_URL}/produtos`);
				const dados = await resposta.json().catch(() => ({}));
				if (ativo && resposta.ok) setProdutos(normalizarProdutos(dados));
			} catch (error) {
				console.error("Erro ao carregar produtos da Home:", error);
			} finally {
				if (ativo) setCarregando(false);
			}
		};

		void carregarProdutos();
		return () => {
			ativo = false;
		};
	}, []);

	const produtosDestaque = useMemo(() => {
		const termo = pesquisa.trim().toLowerCase();
		const disponiveis = produtos.filter((produto) => Number(produto.estoque) > 0);
		const base = disponiveis.length ? disponiveis : produtos;

		return base
			.filter((produto) => !termo || `${produto.nome} ${produto.categoria} ${produto.descricao}`.toLowerCase().includes(termo))
			.slice(0, 6);
	}, [produtos, pesquisa]);

	return (
		<div className="min-h-screen bg-[#f5f7f2] text-slate-900">
			<header className="sticky top-0 z-40 border-b border-[#28594c] bg-[#173f35]/95 text-white backdrop-blur">
				<div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
					<button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-3 text-left">
						<img src={LogoEmpresa} alt="ZungaExpress" className="h-11 w-11 rounded-xl bg-white object-cover p-1" />
						<div>
							<p className="text-sm font-black uppercase tracking-[0.16em] text-[#e7b65b]">ZungaExpress</p>
							<p className="text-xs text-emerald-100/70">A sua compra, no seu ritmo</p>
						</div>
					</button>

					<nav className="hidden items-center gap-7 text-sm font-semibold text-emerald-50/80 md:flex">
						<a href="#destaques" className="transition hover:text-white">Destaques</a>
						<a href="#vantagens" className="transition hover:text-white">Porquê comprar</a>
						<button type="button" onClick={() => navigate("/login")} className="rounded-xl border border-white/20 px-4 py-2 text-white transition hover:bg-white/10">Entrar</button>
					</nav>

					<button type="button" onClick={() => navigate("/cadastrar-cliente")} className="hidden items-center gap-2 rounded-xl bg-[#e7b65b] px-4 py-2.5 text-sm font-black text-[#173f35] transition hover:bg-[#f0c66d] sm:flex">
						Criar conta <FaArrowRight />
					</button>
				</div>
			</header>

			<main>
				<section className="relative overflow-hidden bg-[#173f35] text-white">
					<div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
						<div className="relative z-10">
							<p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e7b65b]/40 bg-[#e7b65b]/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#f4cf83]">
								<FaStar /> Compra simples e segura
							</p>
							<h1 className="max-w-3xl text-4xl font-black leading-[1.03] tracking-tight sm:text-6xl">Tudo o que precisa, entregue com confiança.</h1>
							<p className="mt-6 max-w-xl text-base leading-7 text-emerald-50/75 sm:text-lg">Descubra produtos selecionados, faça o seu pedido em poucos passos e acompanhe cada compra no seu espaço ZungaExpress.</p>
							<div className="mt-8 flex flex-col gap-3 sm:flex-row">
								<button type="button" onClick={() => navigate("/cadastrar-cliente")} className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#e7b65b] px-5 py-3.5 text-sm font-black text-[#173f35] transition hover:bg-[#f0c66d]">Começar a comprar <FaArrowRight /></button>
								<a href="#destaques" className="inline-flex items-center justify-center gap-3 rounded-xl border border-white/20 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">Ver produtos <FaChevronRight /></a>
							</div>
							<div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-emerald-50/70">
								<span className="inline-flex items-center gap-2"><FaCheckCircle className="text-[#e7b65b]" /> Pagamento acompanhado</span>
								<span className="inline-flex items-center gap-2"><FaTruck className="text-[#e7b65b]" /> Entrega com cuidado</span>
							</div>
						</div>

						<div className="relative min-h-75 lg:min-h-95">
							<div className="absolute right-0 top-0 h-64 w-64 rounded-full border border-[#e7b65b]/30 sm:h-80 sm:w-80" />
							<div className="absolute bottom-0 left-8 h-48 w-48 rounded-full border border-white/10 sm:h-64 sm:w-64" />
							<div className="absolute inset-8 flex items-center justify-center rounded-4xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-sm sm:inset-12">
								<div className="w-full rounded-3xl bg-[#f5f7f2] p-4 text-slate-900 sm:p-6">
									<div className="flex items-center justify-between border-b border-slate-200 pb-4">
										<div className="flex items-center gap-3"><img src={LogoEmpresa} alt="" className="h-10 w-10 rounded-lg object-cover" /><div><p className="text-xs font-black uppercase tracking-wider text-[#173f35]">ZungaExpress</p><p className="text-[11px] text-slate-500">Pedido em andamento</p></div></div>
										<FaShoppingBag className="text-[#e7b65b]" />
									</div>
									<div className="mt-5 space-y-3">
										<div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm"><div className="h-12 w-12 rounded-lg bg-[#e7b65b]/20" /><div className="flex-1"><div className="h-2.5 w-3/4 rounded-full bg-slate-200" /><div className="mt-2 h-2 w-1/2 rounded-full bg-slate-100" /></div><div className="h-3 w-12 rounded-full bg-[#173f35]/15" /></div>
										<div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm"><div className="h-12 w-12 rounded-lg bg-[#173f35]/10" /><div className="flex-1"><div className="h-2.5 w-2/3 rounded-full bg-slate-200" /><div className="mt-2 h-2 w-1/3 rounded-full bg-slate-100" /></div><div className="h-3 w-12 rounded-full bg-[#173f35]/15" /></div>
									</div>
									<div className="mt-5 flex items-center justify-between rounded-xl bg-[#173f35] px-4 py-3 text-white"><span className="text-xs font-semibold text-emerald-100/70">Total do pedido</span><strong>{formatarKwanza(12500)}</strong></div>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section id="destaques" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 sm:px-8">
					<div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
						<div><p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Escolhas da semana</p><h2 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">Produtos em destaque</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Produtos disponíveis para tornar a sua próxima compra mais prática.</p></div>
						<label className="relative block w-full sm:max-w-xs"><FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={pesquisa} onChange={(evento) => setPesquisa(evento.target.value)} placeholder="Pesquisar produto..." className="w-full rounded-xl border-0 bg-white py-3 pl-11 pr-4 text-sm shadow-sm ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-[#e7b65b]" /></label>
					</div>

					{carregando ? <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">A carregar produtos...</div> : produtosDestaque.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{produtosDestaque.map((produto) => <article key={produto.id} className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl"><div className="relative flex h-52 items-center justify-center overflow-hidden bg-slate-100">{produto.imagem ? <img src={produto.imagem} alt={produto.nome} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" onError={(evento) => { evento.currentTarget.style.display = "none"; }} /> : <FaBoxOpen className="text-5xl text-slate-300" />}<span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-800">{produto.categoria}</span></div><div className="p-5"><h3 className="font-black text-slate-900">{produto.nome}</h3><p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">{produto.descricao || "Uma escolha prática para o seu dia."}</p><div className="mt-5 flex items-center justify-between gap-3"><strong className="text-lg text-[#173f35]">{formatarKwanza(produto.preco)}</strong><span className="text-xs font-semibold text-slate-400">{produto.estoque} em stock</span></div><button type="button" onClick={() => navigate("/cadastrar-cliente")} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#173f35] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#214e42]">Comprar agora <FaArrowRight /></button></div></article>)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Nenhum produto encontrado.</div>}
				</section>

				<section id="vantagens" className="border-y border-slate-200 bg-white">
					<div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 md:grid-cols-3">
						<div className="flex gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#173f35] text-[#e7b65b]"><FaShoppingBag /></div><div><h3 className="font-black text-slate-900">Compra sem complicação</h3><p className="mt-2 text-sm leading-6 text-slate-500">Encontre o que procura e faça o seu pedido de forma rápida.</p></div></div>
						<div className="flex gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#173f35] text-[#e7b65b]"><FaTruck /></div><div><h3 className="font-black text-slate-900">Acompanhamento claro</h3><p className="mt-2 text-sm leading-6 text-slate-500">Consulte o estado dos seus pedidos no seu espaço de cliente.</p></div></div>
						<div className="flex gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#173f35] text-[#e7b65b]"><FaCheckCircle /></div><div><h3 className="font-black text-slate-900">Experiência segura</h3><p className="mt-2 text-sm leading-6 text-slate-500">Uma plataforma feita para comprar com confiança todos os dias.</p></div></div>
					</div>
				</section>
			</main>

			<footer className="border-t border-[#28594c] bg-[#173f35] text-white">
				<div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
					<div><div className="flex items-center gap-3"><img src={LogoEmpresa} alt="ZungaExpress" className="h-12 w-12 rounded-xl bg-white object-cover p-1" /><div><p className="text-sm font-black uppercase tracking-[0.16em] text-[#e7b65b]">ZungaExpress</p><p className="text-xs text-emerald-100/70">Compras simples. Entregas com confiança.</p></div></div><p className="mt-5 max-w-sm text-sm leading-6 text-emerald-50/75">A sua loja digital para encontrar produtos, fazer pedidos e acompanhar cada compra com tranquilidade.</p></div>
					<div><h2 className="text-sm font-black uppercase tracking-[0.16em] text-[#e7b65b]">Aceder rapidamente</h2><div className="mt-4 flex flex-col items-start gap-3 text-sm text-emerald-50/80"><a href="#destaques" className="transition hover:text-white">Comprar produtos</a><button type="button" onClick={() => navigate("/login")} className="transition hover:text-white">Entrar na conta</button><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="transition hover:text-white">Voltar ao início</button></div></div>
					<div><h2 className="text-sm font-black uppercase tracking-[0.16em] text-[#e7b65b]">Atendimento</h2><p className="mt-4 text-sm leading-6 text-emerald-50/80">Estamos aqui para tornar a sua experiência de compra mais simples e segura.</p><div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-emerald-50"><FaCheckCircle className="text-[#e7b65b]" /> Compra segura na ZungaExpress</div></div>
				</div>
				<div className="border-t border-white/10"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-4 text-xs text-emerald-100/60 sm:px-8 md:flex-row md:items-center md:justify-between"><p>© {new Date().getFullYear()} ZungaExpress. Todos os direitos reservados.</p><p>Feito para comprar melhor, todos os dias.</p></div></div>
			</footer>
		</div>
	);
}
