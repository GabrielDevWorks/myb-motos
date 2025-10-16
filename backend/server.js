/* ==============================================
   SERVIDOR BACKEND PRINCIPAL - mybMotos
   ==============================================
*/

// --- 1. Importação dos Módulos ---
const express = require('express');
const mysql = require('mysql2/promise'); // Usamos a versão com Promises, que é mais moderna
const cors = require('cors'); // Importa o pacote CORS para permitir requisições de outros endereços
const bcrypt = require('bcryptjs'); // <-- ADICIONE ESTA LINHA
const multer = require('multer');
const path = require('path');
// --- 2. Configurações Iniciais ---
const app = express();
const PORT = 3000;

// --- 3. Middlewares ---
// Habilita o CORS para todas as rotas. Deve vir antes da definição das rotas.
app.use(cors()); 
app.use(express.json()); 
// --- CONFIGURAÇÃO DO MULTER PARA UPLOAD DE ARQUIVOS ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Define a pasta onde as imagens serão salvas
        cb(null, 'assets/img/motos/');
    },
    filename: function (req, file, cb) {
        // Cria um nome de arquivo único para evitar conflitos (ex: 1678886400000.jpg)
        const uniqueSuffix = Date.now() + path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix);
    }
});
const upload = multer({ storage: storage });

// Middleware para servir arquivos estáticos (MUITO IMPORTANTE!)
// Isso permite que o frontend acesse as imagens na pasta 'assets'
app.use('/assets', express.static(path.join(__dirname, '../assets')));

const dbConfig = {
    host: 'localhost',
    user: 'root',             // <-- Coloque seu usuário do MySQL aqui
    password: '008856ga',              // <-- Coloque sua senha do MySQL aqui
    database: 'mybmotos_db'
};


/**
 * Função principal para inicializar e configurar o banco de dados.
 * Cria o DB e a tabela se não existirem, e popula com dados iniciais.
 */
async function initializeDatabase() {
    try {
        // Conexão inicial para garantir que o banco de dados exista
        const connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
        await connection.end();
        
        // Cria um "pool de conexões" para otimizar as requisições ao banco
        const pool = mysql.createPool(dbConfig);
        console.log('Conectado ao banco de dados MySQL.');

        // Cria a tabela de motos se ela não existir (já com a coluna 'descricao')
        await pool.query(`
            CREATE TABLE IF NOT EXISTS motos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                marca VARCHAR(255) NOT NULL,
                modelo VARCHAR(255) NOT NULL,
                ano INT NOT NULL,
                km INT NOT NULL,
                preco DECIMAL(10, 2) NOT NULL,
                imagem_url VARCHAR(255),
                descricao TEXT
            );
        `);

        // Verifica se a tabela está vazia para inserir os dados iniciais
        const [rows] = await pool.query("SELECT COUNT(*) as count FROM motos");
        if (rows[0].count === 0) {
            console.log('Tabela vazia, inserindo dados iniciais...');
            const motosIniciais = [
                ['HONDA', 'BIZ 125 KS', 2009, 35600, 7999.99, 'assets/img/motos/biz-125-2009.jpg', 'Manual e chave. Financiamos e pegamos troca. Cartão em até 12x.'],
                ['HONDA', 'CG 160 START', 2023, 9481, 16499.99, 'assets/img/motos/cg-160-start-2023.jpg', 'Manual e chave. Financiamos e pegamos troca. Cartão em até 12x.'],
                ['HONDA', 'CG 150 FAN ESI', 2010, 59700, 10999.99, 'assets/img/motos/cg-150-fan-2010.jpg', 'Manual e chave. Financiamos e pegamos troca. Cartão em até 12x.']
            ];
            // Insere os dados de uma vez de forma segura
            await pool.query("INSERT INTO motos (marca, modelo, ano, km, preco, imagem_url, descricao) VALUES ?", [motosIniciais]);
            console.log('Dados iniciais inseridos com sucesso.');
        }

        return pool; // Retorna o pool de conexões pronto para ser usado pela aplicação
    } catch (error) {
        console.error('Erro fatal durante a inicialização do banco de dados:', error);
        process.exit(1); // Encerra a aplicação se não conseguir conectar/configurar o DB
    }
}

async function startServer() {
    const pool = await initializeDatabase(); // Espera o DB estar 100% pronto

    // --- 5. Definição das Rotas da API ---

app.get('/api/motos', async (req, res) => {
    try {
        const { marca, keyword } = req.query; // Pega 'marca' e 'keyword' da URL

        let query = "SELECT * FROM motos";
        const params = [];
        const conditions = [];

        // Adiciona filtro de MARCA se ele existir
        if (marca) {
            conditions.push("UPPER(marca) = UPPER(?)");
            params.push(marca);
        }
        
        // Adiciona filtro de KEYWORD se ele existir (busca no modelo)
        if (keyword) {
            conditions.push("modelo LIKE ?");
            params.push(`%${keyword}%`); // O '%' é um coringa, busca a palavra em qualquer parte do texto
        }

        // Se houver alguma condição, adiciona o "WHERE" na consulta
        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY id DESC";

        const [rows] = await pool.query(query, params);
        
        res.json({
            message: "success",
            data: rows
        });
    } catch (error) {
        console.error('Erro ao buscar motos:', error);
        res.status(500).json({ "error": error.message });
    }
});
    // Rota para buscar apenas as 3 motos mais recentes para a homepage
    app.get('/api/motos/destaques', async (req, res) => {
        try {
            // O "ORDER BY id DESC LIMIT 3" faz a mágica de pegar as 3 últimas inseridas
            const [rows] = await pool.query("SELECT * FROM motos WHERE destaque = 1");            res.json({
                message: "success",
                data: rows
            });
        } catch (error) {
            console.error('Erro ao buscar motos em destaque:', error);
            res.status(500).json({ "error": error.message });
        }
    });

    // Rota para buscar apenas a lista de MARCAS únicas
    app.get('/api/marcas', async (req, res) => {
        try {
            // O "DISTINCT" garante que cada marca apareça apenas uma vez
            const [rows] = await pool.query("SELECT DISTINCT marca FROM motos ORDER BY marca ASC");
            
            // Extrai apenas os nomes das marcas para uma lista simples
            const marcas = rows.map(row => row.marca);

            res.json({
                message: "success",
                data: marcas
            });
        } catch (error) {
            console.error('Erro ao buscar marcas:', error);
            res.status(500).json({ "error": error.message });
        }
    });

app.get('/api/motos/:id', async (req, res) => {
        try {
            const { id } = req.params; // Pega o ID que vem na URL (ex: /api/motos/1)
            
            // Faz a busca no banco de dados usando o ID de forma segura
            const [rows] = await pool.query("SELECT * FROM motos WHERE id = ?", [id]);
            
            // Se a busca não retornar nenhuma moto, enviamos um erro 404
            if (rows.length === 0) {
                return res.status(404).json({ message: "Moto não encontrada" });
            }
            
            // Se encontrou, retorna os dados da moto (apenas o primeiro resultado)
            res.json({
                message: "success",
                data: rows[0] 
            });
        } catch (error) {
            console.error('Erro ao buscar moto por ID:', error);
            res.status(500).json({ "error": error.message });
        }
    });
// Rota para autenticação de login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Encontra o usuário no banco
        const [rows] = await pool.query("SELECT * FROM usuarios WHERE username = ?", [username]);

        if (rows.length === 0) {
            // Se o usuário não existe, retorna erro
            return res.status(401).json({ message: "Credenciais inválidas" });
        }

        const user = rows[0];

        // 2. Compara a senha enviada com a senha criptografada no banco
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            // Se a senha estiver incorreta, retorna erro
            return res.status(401).json({ message: "Credenciais inválidas" });
        }

        // 3. Se tudo estiver correto, envia sucesso
        // (No futuro, aqui nós geraríamos um "token" de sessão)
        res.json({ message: "Login bem-sucedido" });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ "error": error.message });
    }
});

// Rota para CRIAR uma nova moto (AGORA COM UPLOAD DE IMAGEM)
app.post('/api/motos', upload.single('imagem'), async (req, res) => {
    try {
        // Os dados do formulário de texto vêm em req.body
        const { marca, modelo, ano, km, preco, descricao, destaque } = req.body;

        // A informação do arquivo de imagem vem em req.file
        if (!req.file) {
            return res.status(400).json({ message: "Nenhum arquivo de imagem enviado." });
        }

        // Pega o caminho do arquivo salvo e normaliza para usar barras '/'
        const imagem_url = req.file.path.replace(/\\/g, "/");

        const query = `
            INSERT INTO motos (marca, modelo, ano, km, preco, imagem_url, descricao, destaque) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [marca, modelo, parseInt(ano), parseInt(km), parseFloat(preco), imagem_url, descricao, parseInt(destaque)];

        await pool.query(query, params);

        res.status(201).json({ message: "Moto cadastrada com sucesso!" });

    } catch (error) {
        console.error('Erro ao cadastrar moto:', error);
        res.status(500).json({ "error": error.message });
    }
});
    // --- 6. Inicialização do Servidor ---
    app.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
}

// --- 7. Execução Principal ---
startServer();