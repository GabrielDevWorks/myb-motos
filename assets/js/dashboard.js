document.addEventListener('DOMContentLoaded', () => {
    const listBody = document.getElementById('moto-list-body');

    async function fetchAndRenderMotos() {
        try {
            const response = await fetch('http://localhost:3000/api/motos');
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao buscar motos');
            }

            listBody.innerHTML = '';
            const motos = result.data;

            if (motos.length === 0) {
                listBody.innerHTML = '<div class="list-empty-message">Nenhuma moto cadastrada.</div>';
                return;
            }

            motos.forEach(moto => {
                const precoFormatado = parseFloat(moto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

                const motoCard = `
                    <article class="moto-list-item">
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
                            <button class="btn-action-icon btn-edit" title="Editar">
                                <i class="fa-solid fa-pencil"></i>
                            </button>
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

    fetchAndRenderMotos();
});