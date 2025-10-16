document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-moto-form');
    const imageInput = document.getElementById('imagens'); // ID atualizado
    const imagePreviewContainer = document.getElementById('image-preview-container'); // Container atualizado

    // Lógica para mostrar a pré-visualização de múltiplas imagens
    imageInput.addEventListener('change', () => {
        imagePreviewContainer.innerHTML = ''; // Limpa as prévias antigas
        const files = imageInput.files;

        if (files.length > 0) {
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.classList.add('image-preview');
                    imagePreviewContainer.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        }
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);

        try {
            const response = await fetch('http://localhost:3000/api/motos', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Erro ao cadastrar moto.');
            
            alert('Moto cadastrada com sucesso!');
            window.location.href = 'dashboard.html';

        } catch (error) {
            console.error('Falha na requisição:', error);
            alert(`Erro: ${error.message}`);
        }
    });
});