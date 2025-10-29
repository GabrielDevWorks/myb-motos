document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Impede o recarregamento da página

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                // Se o login for bem-sucedido
                alert('Login realizado com sucesso!');
                window.location.href = 'dashboard.html'; // Redireciona para o painel
            } else {
                // Se as credenciais estiverem erradas
                alert('Usuário ou senha inválidos.');
            }
        } catch (error) {
            console.error('Erro ao tentar fazer login:', error);
            alert('Ocorreu um erro ao conectar com o servidor.');
        }
    });
});