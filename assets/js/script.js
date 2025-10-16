// Ouve o evento DOMContentLoaded UMA ÚNICA VEZ para todo o script.
document.addEventListener('DOMContentLoaded', () => {
const hamburgerIcon = document.getElementById('hamburger-icon');
const menuContainer = document.getElementById('mobile-menu-container');
const closeButton = document.getElementById('btn-close-menu');
const menuOverlay = document.getElementById('mobile-menu-overlay');

// Garante que o código só rode se os elementos existirem na página
if (hamburgerIcon && menuContainer && closeButton && menuOverlay) {

    // Função para abrir o menu
    const openMenu = () => {
        menuContainer.classList.add('is-open');
        // Opcional: Impede o scroll do site quando o menu está aberto
        document.body.style.overflow = 'hidden'; 
    };

    // Função para fechar o menu
    const closeMenu = () => {
        menuContainer.classList.remove('is-open');
        // Devolve o scroll ao site
        document.body.style.overflow = ''; 
    };

    // Eventos
    hamburgerIcon.addEventListener('click', openMenu);
    closeButton.addEventListener('click', closeMenu);
    menuOverlay.addEventListener('click', closeMenu); // Fecha o menu ao clicar fora
}

    // --- LÓGICA PARA RENDERIZAR MOTOS (HOME E ESTOQUE) ---
    const bikesGrid = document.querySelector('.bikes-grid');
    const isStockPage = document.querySelector('.filters-sidebar'); // Verifica se estamos na pág. de estoque

    if (bikesGrid) {
        // Decide qual URL da API usar: destaques para a home, todas para o estoque
        const apiUrl = isStockPage 
            ? 'http://localhost:3000/api/motos' 
            : 'http://localhost:3000/api/motos/destaques';
        
        fetchAndRenderMotos(apiUrl, bikesGrid);
    }

    // --- LÓGICA DA PÁGINA DE ESTOQUE (FILTROS) ---
    // Este código só roda se encontrar a sidebar de filtros
    if (isStockPage) {
        const keywordInput = document.getElementById('keyword-search');
        const brandInput = document.getElementById('brand-input');
        const filterButton = document.querySelector('.btn-filter');
        
        // Função para popular as SUGESTÕES de marcas no datalist
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

        // Função para executar o filtro ao clicar no botão
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

    // --- LÓGICA PARA A PÁGINA DE DETALHES DA MOTO ---
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
}); // FIM DO DOMContentLoaded principal


/**
 * Função reutilizável para buscar motos de uma URL e renderizar na tela
 * @param {string} url - A URL da API para buscar os dados
 * @param {HTMLElement} gridContainer - O elemento onde os cards serão inseridos
 */
async function fetchAndRenderMotos(url, gridContainer) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.statusText}`);
        }
        
        const result = await response.json();
        const motos = result.data;

        gridContainer.innerHTML = ''; // Limpa o container

        if (motos.length === 0) {
            gridContainer.innerHTML = '<p>Nenhuma moto encontrada no estoque.</p>';
            return;
        }

        motos.forEach(moto => {
            const precoFormatado = parseFloat(moto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const kmFormatado = parseInt(moto.km).toLocaleString('pt-BR');

            const bikeCardHTML = `
                <div class="bike-card">
                    <div class="bike-card-img">
                        <img src="${moto.imagem_url}" alt="${moto.marca} ${moto.modelo}">
                        <button class="bike-favorite-icon" aria-label="Adicionar aos Favoritos">
                            <i class="fa-regular fa-heart"></i>
                        </button>
                    </div>
                    <div class="bike-card-content">
                        <h3>${moto.marca} ${moto.modelo}</h3>
                        <p class="bike-price">${precoFormatado}</p>
                        <div class="bike-card-info">
                            <div class="info-item">
                                <i class="fa-solid fa-calendar-alt"></i>
                                <span>${moto.ano}</span>
                            </div>
                            <div class="info-item">
                                <i class="fa-solid fa-road"></i>
                                <span>${kmFormatado} km</span>
                            </div>
                        </div>
                        <a href="moto-detalhe.html?id=${moto.id}" class="btn-details">Ver Detalhes</a>
                    </div>
                </div>
            `;
            gridContainer.innerHTML += bikeCardHTML;
        });

    } catch (error) {
        console.error('Falha ao buscar motos:', error);
        gridContainer.innerHTML = '<p>Erro ao carregar o estoque. Tente novamente mais tarde.</p>';
    }
}


/**
 * Função para buscar e renderizar os detalhes de uma moto específica
 * @param {string} id - O ID da moto a ser buscada
 */
async function fetchMotoDetails(id) {
    try {
        const response = await fetch(`http://localhost:3000/api/motos/${id}`);
        
        if (!response.ok) {
            if(response.status === 404) {
                 document.querySelector('main').innerHTML = '<h1>Erro 404: Moto não encontrada.</h1>';
            }
            throw new Error(`Erro na API: ${response.statusText}`);
        }

        const result = await response.json();
        const moto = result.data;

        document.title = `${moto.marca} ${moto.modelo} - mybMotos`;
        document.getElementById('moto-main-image').src = moto.imagem_url;
        document.getElementById('moto-main-image').alt = `${moto.marca} ${moto.modelo}`;
        document.getElementById('moto-title').textContent = `${moto.marca} ${moto.modelo}`;
        
        const precoFormatado = parseFloat(moto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('moto-price').textContent = precoFormatado;
        
        document.getElementById('moto-ano').textContent = moto.ano;
        
        const kmFormatado = parseInt(moto.km).toLocaleString('pt-BR');
        document.getElementById('moto-km').textContent = `${kmFormatado} km`;

        document.getElementById('moto-descricao').textContent = moto.descricao;

        const whatsappNumber = "5519981517788";
        const whatsappMessage = `Olá, tenho interesse na moto ${moto.marca} ${moto.modelo} ${moto.ano}, que vi no site!`;
        document.getElementById('whatsapp-button').href = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(whatsappMessage)}`;

    } catch (error) {
        console.error('Falha ao buscar detalhes da moto:', error);
    }
}