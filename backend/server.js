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
let pool; // Definido globalmente para ser acessível por todas as funções

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
        pool = mysql.createPool(dbConfig);
        console.log('Conectado ao banco de dados MySQL.');
        // --- CRIAÇÃO E VERIFICAÇÃO DAS TABELAS ---

    // Cria a tabela de USUARIOS se ela não existir
    await pool.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL
        );
    `);

    // Cria a tabela de MOTOS se ela não existir
    await pool.query(`
        CREATE TABLE IF NOT EXISTS motos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            marca VARCHAR(255) NOT NULL,
            modelo VARCHAR(255) NOT NULL,
            ano INT NOT NULL,
            km INT NOT NULL,
            preco DECIMAL(10, 2) NOT NULL,
            imagem_url VARCHAR(255),
            descricao TEXT,
            destaque BOOLEAN DEFAULT 0
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

// Rota para buscar UMA moto específica pelo seu ID (AGORA COM MÚLTIPLAS IMAGENS)
app.get('/api/motos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Busca os dados principais da moto
        const [motoRows] = await pool.query("SELECT * FROM motos WHERE id = ?", [id]);

        if (motoRows.length === 0) {
            return res.status(404).json({ message: "Moto não encontrada" });
        }

        const moto = motoRows[0];

        // 2. Busca todas as imagens associadas a essa moto
        const [imagensRows] = await pool.query("SELECT id, imagem_url FROM moto_imagens WHERE moto_id = ?", [id]);

        // 3. Adiciona a lista de imagens ao objeto da moto
        moto.imagens = imagensRows;

        res.json({
            message: "success",
            data: moto
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

// Rota para CRIAR uma nova moto (AGORA COM MÚLTIPLAS IMAGENS)
// Usamos upload.array('imagens', 10) para aceitar até 10 arquivos do campo 'imagens'
app.post('/api/motos', upload.array('imagens', 10), async (req, res) => {
    // Usamos uma transação para garantir a consistência dos dados
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Os dados de texto vêm em req.body
        const { marca, modelo, ano, km, preco, descricao, destaque } = req.body;
        // Os arquivos de imagem vêm em req.files (um array)
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ message: "Pelo menos uma imagem é obrigatória." });
        }

        // A primeira imagem será a imagem de capa (thumbnail)
        const imagem_de_capa = files[0].path.replace(/\\/g, "/");

        // 1. Insere os dados principais na tabela 'motos'
        const motoQuery = `
            INSERT INTO motos (marca, modelo, ano, km, preco, imagem_url, descricao, destaque) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const motoParams = [marca, modelo, parseInt(ano), parseInt(km), parseFloat(preco), imagem_de_capa, descricao, parseInt(destaque)];
        
        const [result] = await connection.query(motoQuery, motoParams);
        const novaMotoId = result.insertId;

        // 2. Insere todas as imagens (incluindo a de capa) na tabela 'moto_imagens'
        if (files.length > 0) {
            const imagensQuery = 'INSERT INTO moto_imagens (moto_id, imagem_url) VALUES ?';
            const imagensValues = files.map(file => [novaMotoId, file.path.replace(/\\/g, "/")]);
            
            await connection.query(imagensQuery, [imagensValues]);
        }
        
        // Se tudo deu certo, confirma a transação
        await connection.commit();
        res.status(201).json({ message: "Moto cadastrada com sucesso!" });

    } catch (error) {
        // Se algo deu errado, desfaz a transação
        await connection.rollback();
        console.error('Erro ao cadastrar moto:', error);
        res.status(500).json({ "error": error.message });
    } finally {
        // Libera a conexão com o banco de dados
        connection.release();
    }
});

// Rota para EXCLUIR uma moto pelo seu ID
app.delete('/api/motos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query("DELETE FROM motos WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            // Se nenhuma linha foi afetada, a moto não foi encontrada
            return res.status(404).json({ message: "Moto não encontrada" });
        }

        res.json({ message: "Moto excluída com sucesso!" });

    } catch (error) {
        console.error('Erro ao excluir moto:', error);
        res.status(500).json({ "error": error.message });
    }
});

// Rota para EXCLUIR uma IMAGEM específica pelo seu ID
app.delete('/api/imagens/:id', async (req, res) => {
    try {
        const { id } = req.params; // ID da imagem, vindo da tabela moto_imagens

        // Não podemos deletar a imagem principal (capa) de uma moto por esta rota.
        // A moto precisa ter pelo menos uma imagem.
        // (Uma lógica mais avançada seria necessária para impedir a exclusão da última foto)

        const [result] = await pool.query("DELETE FROM moto_imagens WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Imagem não encontrada" });
        }

        res.json({ message: "Imagem excluída com sucesso!" });

    } catch (error) {
        console.error('Erro ao excluir imagem:', error);
        res.status(500).json({ "error": error.message });
    }
});

// Rota para ATUALIZAR uma moto existente (AGORA COM MÚLTIPLAS IMAGENS)
app.put('/api/motos/:id', upload.array('imagens', 10), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { marca, modelo, ano, km, preco, descricao, destaque } = req.body;
        const files = req.files;

        // Monta a query para atualizar os dados de texto
        const updateMotoQuery = `
            UPDATE motos SET 
            marca = ?, modelo = ?, ano = ?, km = ?, preco = ?, descricao = ?, destaque = ?
            WHERE id = ?
        `;
        const motoParams = [marca, modelo, ano, km, preco, descricao, destaque, id];
        await connection.query(updateMotoQuery, motoParams);

        // Se novas imagens foram enviadas, adiciona-as
        if (files && files.length > 0) {
            // Primeiro, podemos apagar as imagens antigas se quisermos (opcional)
            // await connection.query('DELETE FROM moto_imagens WHERE moto_id = ?', [id]);
            
            // Insere as novas imagens na tabela 'moto_imagens'
            const imagensQuery = 'INSERT INTO moto_imagens (moto_id, imagem_url) VALUES ?';
            const imagensValues = files.map(file => [id, file.path.replace(/\\/g, "/")]);
            
            await connection.query(imagensQuery, [imagensValues]);

            // Se a primeira imagem enviada deve ser a nova capa, atualize-a também
            const novaImagemCapa = files[0].path.replace(/\\/g, "/");
            await connection.query('UPDATE motos SET imagem_url = ? WHERE id = ?', [novaImagemCapa, id]);
        }

        await connection.commit();
        res.json({ message: "Moto atualizada com sucesso!" });

    } catch (error) {
        await connection.rollback();
        console.error('Erro ao atualizar moto:', error);
        res.status(500).json({ "error": error.message });
    } finally {
        connection.release();
    }
});
    // --- 6. Inicialização do Servidor ---
    app.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
}

// --- 7. Execução Principal ---
startServer();