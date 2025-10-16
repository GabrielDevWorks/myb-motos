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

    // --- LÓGICA 2: RENDERIZAR MOTOS (HOME E ESTOQUE) ---
    const bikesGrid = document.querySelector('.bikes-grid');
    const isStockPage = document.querySelector('.filters-sidebar');

    if (bikesGrid) {
        // Decide qual URL da API usar: destaques para a home, todas para o estoque
        const apiUrl = isStockPage 
            ? 'http://localhost:3000/api/motos' 
            : 'http://localhost:3000/api/motos/destaques';
        
        fetchAndRenderMotos(apiUrl, bikesGrid);
    }

    // --- LÓGICA 3: FILTROS DA PÁGINA DE ESTOQUE ---
    if (isStockPage) {
        const keywordInput = document.getElementById('keyword-search');
        const brandInput = document.getElementById('brand-input');
        const filterButton = document.querySelector('.btn-filter');
        
        function applyFilters() {
            const keywordValue = keywordInput.value;
            const brandValue = brandInput.value;
            const queryParams = new URLSearchParams();

            if (keywordValue) queryParams.append('keyword', keywordValue);
            if (brandValue) queryParams.append('marca', brandValue);

            const apiUrlWithFilters = `http://localhost:3000/api/motos?${queryParams.toString()}`;
            
            bikesGrid.innerHTML = '<p>Buscando motos...</p>';
            fetchAndRenderMotos(apiUrlWithFilters, bikesGrid);
        }

        filterButton.addEventListener('click', applyFilters);
        populateBrandFilter();
    }

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
                <div class="bike-card">
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