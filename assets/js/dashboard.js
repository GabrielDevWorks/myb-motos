document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES DE ELEMENTOS ---
    const listBody = document.getElementById('moto-list-body');
    const editModalOverlay = document.getElementById('edit-modal-overlay');
    const editForm = document.getElementById('edit-moto-form');
    const closeModalBtn = document.getElementById('edit-modal-close-btn');
    const currentImagesContainer = document.getElementById('edit-image-current-container');
    const newImageInput = document.getElementById('edit-imagens');
    const newImagePreviewContainer = document.getElementById('edit-image-preview-container');

    // --- FUNÇÕES ---

    /**
     * Busca todas as motos da API e as renderiza na lista do dashboard.
     */
    async function fetchAndRenderMotos() {
        try {
            const response = await fetch('http://localhost:3000/api/motos');
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Erro ao buscar motos');

            listBody.innerHTML = '';
            const motos = result.data;

            if (motos.length === 0) {
                listBody.innerHTML = '<div class="list-empty-message">Nenhuma moto cadastrada.</div>';
                return;
            }

            motos.forEach(moto => {
                const precoFormatado = parseFloat(moto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                const motoCard = `
                    <article class="moto-list-item" data-id="${moto.id}">
                        <div class="col-info">
                            <img src="/${moto.imagem_url}" alt="${moto.modelo}" class="item-moto-img">
                            <div class="item-moto-details">
                                <span class="item-moto-title">${moto.marca} ${moto.modelo}</span>
                                <span class="item-moto-id">ID: #${moto.id}</span>
                            </div>
                        </div>
                        <div class="col-ano">${moto.ano}</div>
                        <div class="col-preco">${precoFormatado}</div>
                        <div class="col-acoes">
                            <button class="btn-action-text btn-view" title="Ver Detalhes/Editar">Ver Detalhes</button>
                            <button class="btn-action-icon btn-delete" title="Excluir">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </article>
                `;
                listBody.innerHTML += motoCard;
            });
        } catch (error) {
            console.error('Erro ao popular a lista:', error);
            listBody.innerHTML = '<div class="list-empty-message">Erro ao carregar os dados.</div>';
        }
    }

    /**
     * Abre o modal de edição e preenche com os dados da moto.
     */
    async function openEditModal(motoId) {
        try {
            const response = await fetch(`http://localhost:3000/api/motos/${motoId}`);
            if (!response.ok) throw new Error('Falha ao buscar dados da moto.');
            
            const result = await response.json();
            const moto = result.data;

            // Preenche campos de texto
            document.getElementById('edit-moto-id').value = moto.id;
            document.getElementById('edit-marca').value = moto.marca;
            document.getElementById('edit-modelo').value = moto.modelo;
            document.getElementById('edit-ano').value = moto.ano;
            document.getElementById('edit-km').value = moto.km;
            document.getElementById('edit-preco').value = moto.preco;
            document.getElementById('edit-descricao').value = moto.descricao;
            document.getElementById('edit-destaque').value = moto.destaque ? '1' : '0';
            
            // Preenche a galeria de imagens atuais
            currentImagesContainer.innerHTML = '';
            
            const allImages = [
                { id: null, imagem_url: moto.imagem_url, is_capa: true },
                ...(moto.imagens || []).filter(img => img.imagem_url !== moto.imagem_url)
            ];

            allImages.forEach(img => {
                const imgContainer = document.createElement('div');
                imgContainer.classList.add('image-preview-wrapper');

                const imageEl = document.createElement('img');
                imageEl.src = `/${img.imagem_url}`;
                imageEl.classList.add('image-preview');
                imgContainer.appendChild(imageEl);

                if (!img.is_capa) {
                    const deleteBtn = document.createElement('button');
                    deleteBtn.type = 'button';
                    deleteBtn.className = 'btn-delete-image';
                    deleteBtn.innerHTML = '&times;';
                    deleteBtn.title = 'Excluir Imagem';
                    deleteBtn.dataset.imageId = img.id;
                    imgContainer.appendChild(deleteBtn);
                } else {
                    const capaTag = document.createElement('span');
                    capaTag.className = 'capa-tag';
                    capaTag.textContent = 'Capa';
                    imgContainer.appendChild(capaTag);
                }
                currentImagesContainer.appendChild(imgContainer);
            });
            
            // Limpa previews e input de novas imagens
            newImagePreviewContainer.innerHTML = '';
            newImageInput.value = '';

            // Mostra o modal
            editModalOverlay.classList.add('is-visible');
        } catch (error) {
            console.error('Erro ao abrir modal de edição:', error);
            alert(error.message);
        }
    }

    /**
     * Fecha o modal de edição.
     */
    function closeEditModal() {
        editModalOverlay.classList.remove('is-visible');
    }

    // --- EVENT LISTENERS ---

    // Listener para o preview de novas imagens na edição
    newImageInput.addEventListener('change', () => {
        newImagePreviewContainer.innerHTML = '';
        const files = newImageInput.files;
        if (files) {
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.classList.add('image-preview');
                    newImagePreviewContainer.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        }
    });

    // Listener para o clique no botão 'X' de deletar imagem individual
    currentImagesContainer.addEventListener('click', async (event) => {
        if (event.target.classList.contains('btn-delete-image')) {
            const deleteBtn = event.target;
            const imageId = deleteBtn.dataset.imageId;
            
            if (confirm(`Tem certeza que deseja excluir esta imagem?`)) {
                try {
                    const response = await fetch(`http://localhost:3000/api/imagens/${imageId}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error('Falha ao excluir a imagem.');
                    deleteBtn.parentElement.remove();
                    alert('Imagem excluída com sucesso!');
                } catch (error) {
                    console.error('Erro ao deletar imagem:', error);
                    alert(error.message);
                }
            }
        }
    });

    // Listener principal na lista de motos (para Editar/Excluir moto inteira)
    listBody.addEventListener('click', async (event) => {
        const viewButton = event.target.closest('.btn-view');
        const deleteButton = event.target.closest('.btn-delete');
        
        if (viewButton) {
            const motoId = viewButton.closest('.moto-list-item').dataset.id;
            openEditModal(motoId);
        }
        
        if (deleteButton) {
            const motoId = deleteButton.closest('.moto-list-item').dataset.id;
            if (confirm(`Tem certeza que deseja excluir a moto #${motoId}? TODAS as suas imagens serão apagadas.`)) {
                try {
                    const response = await fetch(`http://localhost:3000/api/motos/${motoId}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error('Falha ao excluir a moto.');
                    alert('Moto excluída com sucesso!');
                    fetchAndRenderMotos();
                } catch (error) {
                    console.error('Erro ao deletar moto:', error);
                    alert(error.message);
                }
            }
        }
    });

    // Listener para o formulário de edição ser enviado
    editForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const motoId = document.getElementById('edit-moto-id').value;
        const formData = new FormData(editForm);

        try {
            const response = await fetch(`http://localhost:3000/api/motos/${motoId}`, {
                method: 'PUT',
                body: formData,
            });
            if (!response.ok) throw new Error('Falha ao salvar as alterações.');
            
            closeEditModal();
            fetchAndRenderMotos();
            alert('Moto atualizada com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar alteração:', error);
            alert(error.message);
        }
    });

    // Listeners para fechar o modal
    closeModalBtn.addEventListener('click', closeEditModal);
    editModalOverlay.addEventListener('click', (e) => {
        if (e.target === editModalOverlay) {
            closeEditModal();
        }
    });

    // --- INICIALIZAÇÃO ---
    fetchAndRenderMotos();
});