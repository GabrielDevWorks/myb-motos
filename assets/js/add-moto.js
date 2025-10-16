document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-moto-form');
    const imageInput = document.getElementById('imagem');
    const imagePreview = document.getElementById('image-preview');

    // Lógica para mostrar a pré-visualização da imagem
    imageInput.addEventListener('change', () => {
        const file = imageInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block'; // Mostra a pré-visualização
            };
            reader.readAsDataURL(file);
        }
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Usa FormData para enviar texto e arquivo juntos
        const formData = new FormData(form);

        try {
            const response = await fetch('http://localhost:3000/api/motos', {
                method: 'POST',
                body: formData, // Envia o FormData diretamente
                // NÃO defina o 'Content-Type' header, o navegador faz isso por você!
            });

            const result = await response.json();

            if (response.ok) {
                alert('Moto cadastrada com sucesso!');
                window.location.href = 'dashboard.html';
            } else {
                throw new Error(result.message || 'Erro ao cadastrar moto.');
            }

        } catch (error) {
            console.error('Falha na requisição:', error);
            alert(`Erro: ${error.message}`);
        }
    });
});