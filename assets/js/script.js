// Ouve o evento DOMContentLoaded UMA ÚNICA VEZ para todo o script.
document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA 1: MENU LATERAL (HAMBÚRGUER) ---
    const hamburgerIcon = document.getElementById('hamburger-icon');
    const menuContainer = document.getElementById('mobile-menu-container');
    const closeButton = document.getElementById('btn-close-menu');
    const menuOverlay = document.getElementById('mobile-menu-overlay');

    // Garante que o código só rode se os elementos do menu existirem na página
    if (hamburgerIcon && menuContainer && closeButton && menuOverlay) {
        const openMenu = () => {
            menuContainer.classList.add('is-open');
            document.body.style.overflow = 'hidden'; // Impede o scroll da página
        };
        const closeMenu = () => {
            menuContainer.classList.remove('is-open');
            document.body.style.overflow = ''; // Devolve o scroll
        };

        hamburgerIcon.addEventListener('click', openMenu);
        closeButton.addEventListener('click', closeMenu);
        menuOverlay.addEventListener('click', closeMenu); // Fecha o menu ao clicar fora
    }

// Em assets/js/script.js
// SUBSTITUA AS LÓGICAS 2 E 3 POR ISTO:

// --- LÓGICA 2 & 3 COMBINADA: RENDERIZAR MOTOS E FILTROS ---
const bikesGrid = document.querySelector('.bikes-grid');
const isStockPage = document.querySelector('.filters-sidebar');

if (isStockPage && bikesGrid) {
    // --- ESTAMOS NA PÁGINA DE ESTOQUE ---
    
    // Seleciona os elementos do filtro
    const keywordInput = document.getElementById('keyword-search');
    const brandInput = document.getElementById('brand-input');
    const filterButton = document.querySelector('.btn-filter');
    
    // Define a função que aplica os filtros (movemos ela para cá)
    function applyFilters() {
        const keywordValue = keywordInput.value;
        const brandValue = brandInput.value;
        const queryParams = new URLSearchParams();

        if (keywordValue) queryParams.append('keyword', keywordValue);
        if (brandValue) queryParams.append('marca', brandValue);

        // Monta a URL da API com os filtros
        const apiUrlWithFilters = `http://localhost:3000/api/motos?${queryParams.toString()}`;
        
        bikesGrid.innerHTML = '<p>Buscando motos...</p>';
        fetchAndRenderMotos(apiUrlWithFilters, bikesGrid);
    }
    
    // Adiciona o listener ao botão de filtro da sidebar
    filterButton.addEventListener('click', applyFilters);
    
    // Popula o <datalist> de marcas (como já fazia)
    populateBrandFilter();

    // ***AQUI ESTÁ A MÁGICA***
    // 1. Lê os parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search);
    const keywordFromHome = urlParams.get('keyword');
    
    if (keywordFromHome) {
        // 2. Se um 'keyword' veio da URL...
        // Coloca esse termo no campo de busca da sidebar
        keywordInput.value = keywordFromHome;
        // Roda o filtro automaticamente
        applyFilters();
    } else {
        // 3. Se não veio nada da URL, apenas carrega todas as motos
        const defaultApiUrl = 'http://localhost:3000/api/motos';
        fetchAndRenderMotos(defaultApiUrl, bikesGrid);
    }

} else if (bikesGrid) {
    // --- ESTAMOS NA HOMEPAGE ---
    // Se não é a pág de estoque, mas tem um grid, é a home.
    // Carrega apenas os destaques.
    const apiUrl = 'http://localhost:3000/api/motos/destaques';
    fetchAndRenderMotos(apiUrl, bikesGrid);
}
// --- FIM DA LÓGICA 2 & 3 COMBINADA ---

    // --- LÓGICA 4: PÁGINA DE DETALHES DA MOTO ---
    const motoDetailLayout = document.querySelector('.moto-detail-layout');
    if (motoDetailLayout) {
        const urlParams = new URLSearchParams(window.location.search);
        const motoId = urlParams.get('id');
        if (motoId) {
            fetchMotoDetails(motoId);
        } else {
            document.querySelector('main').innerHTML = '<h1>Erro: ID da moto não fornecido.</h1>';
        }
    }
}); // FIM DO DOMContentLoaded


// Em assets/js/script.js, DENTRO do 'DOMContentLoaded'
// Adicione este bloco:
// Em assets/js/script.js
// SUBSTITUA o bloco da LÓGICA 5 por este:

// --- LÓGICA 5: CARROSSEL HERO AVANÇADO (FADE) ---
const heroCarousel = document.getElementById('hero-carousel');
if (heroCarousel) {
    const track = heroCarousel.querySelector('.hero-carousel-track');
    const slides = Array.from(track.children);
    const nextButton = document.getElementById('hero-next');
    const prevButton = document.getElementById('hero-prev');
    const paginationContainer = document.getElementById('hero-pagination');
    let currentIndex = 0;
    let autoPlayInterval;

    // --- FUNÇÕES DO CARROSSEL ---

    // Move para o slide (Lógica de FADE)
    const moveToSlide = (targetIndex) => {
        // Loop
        if (targetIndex < 0) {
            currentIndex = slides.length - 1;
        } else if (targetIndex >= slides.length) {
            currentIndex = 0;
        } else {
            currentIndex = targetIndex;
        }

        // Remove 'is-active' de todos os slides
        slides.forEach(slide => {
            slide.classList.remove('is-active');
        });

        // Adiciona 'is-active' apenas no slide alvo
        slides[currentIndex].classList.add('is-active');
        
        updatePagination();
    };

    // Atualiza bolinhas (igual ao anterior)
    const updatePagination = () => {
        if (!paginationContainer) return;
        const currentDot = paginationContainer.querySelector('.active');
        if (currentDot) currentDot.classList.remove('active');
        const newDot = paginationContainer.children[currentIndex];
        if (newDot) newDot.classList.add('active');
    };
    
    // Cria bolinhas (igual ao anterior)
    const createPagination = () => {
        if (!paginationContainer) return;
        paginationContainer.innerHTML = ''; 
        slides.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.classList.add('pagination-dot');
            if (index === 0) dot.classList.add('active');
            dot.setAttribute('aria-label', `Ir para slide ${index + 1}`);
            dot.addEventListener('click', () => {
                moveToSlide(index);
                resetAutoPlay();
            });
            paginationContainer.appendChild(dot);
        });
    };
    
    // Auto-play (Aumentei o tempo para 7s para dar tempo de ler e ver as animações)
    const startAutoPlay = () => {
        clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(() => {
            moveToSlide(currentIndex + 1);
        }, 7000); 
    };
    const resetAutoPlay = () => {
        startAutoPlay();
    };

    // Função de inicialização
    const initializeCarousel = () => {
        // Não precisamos mais de 'slideWidth'
        createPagination();
        // Ativa o primeiro slide
        if(slides.length > 0) {
             slides[0].classList.add('is-active');
        }
        startAutoPlay();
    };
    
    // --- EVENT LISTENERS ---
    nextButton.addEventListener('click', () => {
        moveToSlide(currentIndex + 1);
        resetAutoPlay();
    });

    prevButton.addEventListener('click', () => {
        moveToSlide(currentIndex - 1);
        resetAutoPlay();
    });
    
    // O 'resize' listener não é mais necessário para este tipo de carrossel
    
    // Inicia tudo
    initializeCarousel();
}
// --- FIM DA LÓGICA 5 ---

// Em assets/js/script.js, DENTRO do 'DOMContentLoaded'

// --- LÓGICA 6: TORNAR O CARD INTEIRO CLICÁVEL ---
// (Re-selecionamos o gridContainer caso ele esteja fora do escopo anterior)
const mainBikesGrid = document.querySelector('.bikes-grid');

if (mainBikesGrid) {
    mainBikesGrid.addEventListener('click', (event) => {
        // O que o usuário clicou exatamente?
        const target = event.target; 

        // 1. Encontra o card pai mais próximo do clique
        const card = target.closest('.bike-card');

        // 2. Se não clicou em um card, não faz nada
        if (!card) {
            return;
        }

        // 3. Se o clique foi no botão de favorito OU no botão de detalhes,
        // deixa esses elementos cuidarem da ação (não fazemos nada aqui)
        if (target.closest('.bike-favorite-icon') || target.closest('.btn-details')) {
            return;
        }

        // 4. Se clicou em qualquer outro lugar do card...
        const motoId = card.dataset.motoId;
        if (motoId) {
            // Redireciona para a página de detalhes
            window.location.href = `moto-detalhe.html?id=${motoId}`;
        }
    });
}
// --- FIM DA LÓGICA 6 ---

// Em assets/js/script.js
// SUBSTITUA A LÓGICA 7 POR ESTA VERSÃO:

// --- LÓGICA 7: FAZER A BUSCA DO HERO FUNCIONAR (COM LOADING) ---
const heroSection = document.querySelector('.hero');
if (heroSection) {
    heroSection.addEventListener('click', (event) => {
        
        const searchButton = event.target.closest('.btn-search');
        if (!searchButton) {
            return; 
        }

        event.preventDefault(); 
        
        const searchBox = event.target.closest('.search-box');
        
        // Pega a tela de loading que criamos no HTML
        const loadingOverlay = document.getElementById('loading-overlay');

        if (searchBox && loadingOverlay) {
            const searchInput = searchBox.querySelector('input[type="text"]');
            const keyword = searchInput.value.trim();
            
            // 1. MOSTRA A TELA DE LOADING
            loadingOverlay.classList.add('is-visible');

            // 2. Decide para onde vamos
            const destinationURL = keyword 
                ? `estoque.html?keyword=${encodeURIComponent(keyword)}` 
                : 'estoque.html';

            // 3. ESPERA 500ms ANTES DE IR
            setTimeout(() => {
                window.location.href = destinationURL;
            }, 1000); // Meio segundo de delay
        }
    });
}
// --- FIM DA LÓGICA 7 ---
// --- FIM DA LÓGICA 7 ---

// ==============================================
// --- FUNÇÕES GLOBAIS ---
// ==============================================

/**
 * Popula o datalist de marcas na página de estoque.
 */
async function populateBrandFilter() {
    try {
        const response = await fetch('http://localhost:3000/api/marcas');
        const result = await response.json();
        const datalist = document.getElementById('brand-list');
        
        if (result.data) {
            result.data.forEach(marca => {
                const option = document.createElement('option');
                option.value = marca;
                datalist.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Falha ao carregar lista de marcas.", error);
    }
}

/**
 * Busca motos de uma URL e renderiza os cards na tela.
 */
async function fetchAndRenderMotos(url, gridContainer) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erro na API: ${response.statusText}`);
        
        const result = await response.json();
        const motos = result.data;
        gridContainer.innerHTML = '';

        if (motos.length === 0) {
            gridContainer.innerHTML = '<p>Nenhuma moto encontrada com esses filtros.</p>';
            return;
        }

        motos.forEach(moto => {
            const precoFormatado = parseFloat(moto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const kmFormatado = parseInt(moto.km).toLocaleString('pt-BR');
            const bikeCardHTML = `
                    <div class="bike-card" data-moto-id="${moto.id}">
                    <div class="bike-card-img">
                        <img src="/${moto.imagem_url}" alt="${moto.marca} ${moto.modelo}">
                        <button class="bike-favorite-icon" aria-label="Adicionar aos Favoritos">
                            <i class="fa-regular fa-heart"></i>
                        </button>
                    </div>
                    <div class="bike-card-content">
                        <h3>${moto.marca} ${moto.modelo}</h3>
                        <p class="bike-price">${precoFormatado}</p>
                        <div class="bike-card-info">
                            <div class="info-item"><i class="fa-solid fa-calendar-alt"></i><span>${moto.ano}</span></div>
                            <div class="info-item"><i class="fa-solid fa-road"></i><span>${kmFormatado} km</span></div>
                        </div>
                        <a href="moto-detalhe.html?id=${moto.id}" class="btn-details">Ver Detalhes</a>
                    </div>
                </div>`;
            gridContainer.innerHTML += bikeCardHTML;
        });
    } catch (error) {
        console.error('Falha ao buscar motos:', error);
        gridContainer.innerHTML = '<p>Erro ao carregar o estoque. Tente novamente mais tarde.</p>';
    }
}

async function fetchMotoDetails(id) {
    try {
        const response = await fetch(`http://localhost:3000/api/motos/${id}`);
        if (!response.ok) {
            if(response.status === 404) { document.querySelector('main').innerHTML = '<h1>Erro 404: Moto não encontrada.</h1>'; }
            throw new Error(`Erro na API: ${response.statusText}`);
        }
        const result = await response.json();
        const moto = result.data;

        // --- Preenche os dados de texto (AGORA COMPLETO) ---
        document.title = `${moto.marca} ${moto.modelo} - mybMotos`;
        document.getElementById('moto-title').textContent = `${moto.marca} ${moto.modelo}`;
        
        // --- LINHAS QUE ESTAVAM FALTANDO ---
        const precoFormatado = parseFloat(moto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('moto-price').textContent = precoFormatado;
        
        document.getElementById('moto-ano').textContent = moto.ano;
        
        const kmFormatado = parseInt(moto.km).toLocaleString('pt-BR');
        document.getElementById('moto-km').textContent = `${kmFormatado} km`;

        document.getElementById('moto-descricao').textContent = moto.descricao;
        // --- FIM DAS LINHAS QUE ESTAVAM FALTANDO ---

        // --- LÓGICA DO CARROSSEL ---
        const galleryMainImage = document.getElementById('gallery-main-image');
        const galleryThumbnails = document.getElementById('gallery-thumbnails');
        const prevBtn = document.getElementById('prev-image-btn');
        const nextBtn = document.getElementById('next-image-btn');
        let currentImageIndex = 0;
        
        const todasImagens = [
            { id: null, imagem_url: moto.imagem_url },
            ...(moto.imagens || [])
        ];
        
        const uniqueImages = Array.from(new Set(todasImagens.map(a => a.imagem_url)))
            .map(url => todasImagens.find(a => a.imagem_url === url));

        function updateGallery() {
            galleryMainImage.src = `/${uniqueImages[currentImageIndex].imagem_url}`;
            galleryThumbnails.innerHTML = '';
            uniqueImages.forEach((img, index) => {
                const thumb = document.createElement('img');
                thumb.src = `/${img.imagem_url}`;
                thumb.classList.add('thumbnail');
                if (index === currentImageIndex) {
                    thumb.classList.add('active');
                }
                thumb.addEventListener('click', () => {
                    currentImageIndex = index;
                    updateGallery();
                });
                galleryThumbnails.appendChild(thumb);
            });
        }

        if (uniqueImages.length > 0) {
            updateGallery();
        } else {
            galleryMainImage.src = "https://placehold.co/800x600/ccc/ffffff?text=Sem+Imagem";
        }
        
        if (uniqueImages.length <= 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'block';
            nextBtn.style.display = 'block';
        }

        prevBtn.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex > 0) ? currentImageIndex - 1 : uniqueImages.length - 1;
            updateGallery();
        });

        nextBtn.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex < uniqueImages.length - 1) ? currentImageIndex + 1 : 0;
            updateGallery();
        });

    } catch (error) {
        console.error('Falha ao buscar detalhes da moto:', error);
        const mainContainer = document.querySelector('main.container');
        if(mainContainer) mainContainer.innerHTML = '<h1>Erro ao carregar os detalhes da moto.</h1>';
    }
}