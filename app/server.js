/* ==============================================
   SERVIDOR BACKEND PRINCIPAL - mybMotos (VERSÃO CORRIGIDA)
   ==============================================
*/

// --- 1. Importação dos Módulos ---
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Módulo 'file system' para verificar pastas

// --- 2. Configurações Iniciais ---
const app = express();
const PORT = 3000;

// ***NOVO:*** Carrega as variáveis de ambiente do arquivo .env
// Usamos path.join para garantir que ele encontre o .env na raiz do projeto
require('dotenv').config({ path: path.join(__dirname, '../.env') });


// --- 3. Middlewares ---
app.use(cors()); 
app.use(express.json()); 

// --- CONFIGURAÇÃO DO MULTER CORRIGIDA ---
const uploadDir = path.join(__dirname, '../assets/img/motos');

// ***NOVO:*** Garante que a pasta de upload exista antes de configurar o multer
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // ***CORRIGIDO:*** Usa o caminho absoluto para a pasta de destino
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix);
    }
});
const upload = multer({ storage: storage });

// Middleware para servir arquivos estáticos (Correto)
app.use('/assets', express.static(path.join(__dirname, '../assets')));

let pool; 

// ***CORRIGIDO:*** Lê as configurações do banco de dados do arquivo .env
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'mybmotos_db'
};

// Substitua esta função inteira no seu server.js

async function initializeDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
        await connection.end();
        
        pool = mysql.createPool(dbConfig);
        console.log('Conectado ao banco de dados MySQL.');

        // --- CRIAÇÃO DAS TABELAS (VERSÃO CORRIGIDA SEM ESPAÇOS) ---

        // ***CORREÇÃO:*** Removida toda a indentação interna.
        await pool.query(`CREATE TABLE IF NOT EXISTS usuarios (
id INT AUTO_INCREMENT PRIMARY KEY,
username VARCHAR(255) NOT NULL UNIQUE,
password_hash VARCHAR(255) NOT NULL
);`);

        // ***CORREÇÃO:*** Removida toda a indentação interna.
        await pool.query(`CREATE TABLE IF NOT EXISTS motos (
id INT AUTO_INCREMENT PRIMARY KEY,
marca VARCHAR(255) NOT NULL,
modelo VARCHAR(255) NOT NULL,
ano INT NOT NULL,
km INT NOT NULL,
preco DECIMAL(10, 2) NOT NULL,
imagem_url VARCHAR(255),
descricao TEXT,
destaque BOOLEAN DEFAULT 0
);`);

        // ***CORREÇÃO:*** Removida toda a indentação interna.
        await pool.query(`CREATE TABLE IF NOT EXISTS moto_imagens (
id INT AUTO_INCREMENT PRIMARY KEY,
moto_id INT NOT NULL,
imagem_url VARCHAR(255) NOT NULL,
FOREIGN KEY (moto_id) REFERENCES motos(id) ON DELETE CASCADE
);`);

        // --- POPULA DADOS INICIAIS ---

        const [userRows] = await pool.query("SELECT COUNT(*) as count FROM usuarios");
        if (userRows[0].count === 0) {
            console.log('Nenhum usuário encontrado, criando usuário admin...');
            const adminUser = 'admin';
            const adminPass = 'admin123';
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(adminPass, salt);
            
            await pool.query("INSERT INTO usuarios (username, password_hash) VALUES (?, ?)", [adminUser, passwordHash]);
            console.log('Usuário "admin" com senha "admin123" criado com sucesso.');
        }
        
        const [motoRows] = await pool.query("SELECT COUNT(*) as count FROM motos");
        if (motoRows[0].count === 0) {
            console.log('Tabela de motos vazia, inserindo dados iniciais...');
            const motosIniciais = [
                ['HONDA', 'BIZ 125 KS', 2009, 35600, 7999.99, 'assets/img/motos/biz-125-2009.jpg', 'Manual e chave. Financiamos e pegamos troca. Cartão em até 12x.', 1],
                ['HONDA', 'CG 160 START', 2023, 9481, 16499.99, 'assets/img/motos/cg-160-start-2023.jpg', 'Manual e chave. Financiamos e pegamos troca. Cartão em até 12x.', 1],
                ['HONDA', 'CG 150 FAN ESI', 2010, 59700, 10999.99, 'assets/img/motos/cg-150-fan-2010.jpg', 'Manual e chave. Financiamos e pegamos troca. Cartão em até 12x.', 1]
            ];
            await pool.query("INSERT INTO motos (marca, modelo, ano, km, preco, imagem_url, descricao, destaque) VALUES ?", [motosIniciais]);
            console.log('Dados iniciais de motos inseridos com sucesso.');
        }

        return pool;
    } catch (error) {
        console.error('Erro fatal durante a inicialização do banco de dados:', error);
        process.exit(1);
    }
}

async function startServer() {
    const pool = await initializeDatabase(); // Espera o DB estar 100% pronto

    // --- 5. Definição das Rotas da API ---

    // Rota GET /api/motos (Busca com filtros) - (Seu código estava correto)
    app.get('/api/motos', async (req, res) => {
        try {
            const { marca, keyword } = req.query; 
            let query = "SELECT * FROM motos";
            const params = [];
            const conditions = [];

            if (marca) {
                conditions.push("UPPER(marca) = UPPER(?)");
                params.push(marca);
            }
            
            if (keyword) {
                conditions.push("modelo LIKE ?");
                params.push(`%${keyword}%`);
            }

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

    // Rota para buscar destaques (Seu código estava correto)
    app.get('/api/motos/destaques', async (req, res) => {
        try {
            const [rows] = await pool.query("SELECT * FROM motos WHERE destaque = 1 ORDER BY id DESC");
            res.json({
                message: "success",
                data: rows
            });
        } catch (error) {
            console.error('Erro ao buscar motos em destaque:', error);
            res.status(500).json({ "error": error.message });
        }
    });

    // Rota para buscar marcas (Seu código estava correto)
    app.get('/api/marcas', async (req, res) => {
        try {
            const [rows] = await pool.query("SELECT DISTINCT marca FROM motos ORDER BY marca ASC");
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

    // Rota para buscar UMA moto (Seu código estava correto)
    app.get('/api/motos/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const [motoRows] = await pool.query("SELECT * FROM motos WHERE id = ?", [id]);

            if (motoRows.length === 0) {
                return res.status(404).json({ message: "Moto não encontrada" });
            }
            const moto = motoRows[0];

            const [imagensRows] = await pool.query("SELECT id, imagem_url FROM moto_imagens WHERE moto_id = ?", [id]);
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

    // Rota de login (Seu código estava correto)
    app.post('/api/login', async (req, res) => {
        try {
            const { username, password } = req.body;
            const [rows] = await pool.query("SELECT * FROM usuarios WHERE username = ?", [username]);

            if (rows.length === 0) {
                return res.status(401).json({ message: "Credenciais inválidas" });
            }
            const user = rows[0];

            const isPasswordValid = await bcrypt.compare(password, user.password_hash);

            if (!isPasswordValid) {
                return res.status(401).json({ message: "Credenciais inválidas" });
            }
            
            res.json({ message: "Login bem-sucedido" });
        } catch (error) {
            console.error('Erro no login:', error);
            res.status(500).json({ "error": error.message });
        }
    });

    // Rota para CRIAR moto (Seu código estava correto)
    app.post('/api/motos', upload.array('imagens', 10), async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { marca, modelo, ano, km, preco, descricao, destaque } = req.body;
            const files = req.files;

            if (!files || files.length === 0) {
                return res.status(400).json({ message: "Pelo menos uma imagem é obrigatória." });
            }

            // ***CORRIGIDO:*** Salva o path relativo ao /assets
            const imagem_de_capa = path.relative(path.join(__dirname, '../'), files[0].path).replace(/\\/g, "/");

            const motoQuery = `
                INSERT INTO motos (marca, modelo, ano, km, preco, imagem_url, descricao, destaque) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const motoParams = [marca, modelo, parseInt(ano), parseInt(km), parseFloat(preco), imagem_de_capa, descricao, parseInt(destaque) || 0];
            
            const [result] = await connection.query(motoQuery, motoParams);
            const novaMotoId = result.insertId;

            if (files.length > 0) {
                const imagensQuery = 'INSERT INTO moto_imagens (moto_id, imagem_url) VALUES ?';
                // ***CORRIGIDO:*** Salva o path relativo
                const imagensValues = files.map(file => [
                    novaMotoId, 
                    path.relative(path.join(__dirname, '../'), file.path).replace(/\\/g, "/")
                ]);
                
                await connection.query(imagensQuery, [imagensValues]);
            }
            
            await connection.commit();
            res.status(201).json({ message: "Moto cadastrada com sucesso!" });

        } catch (error) {
            await connection.rollback();
            console.error('Erro ao cadastrar moto:', error);
            res.status(500).json({ "error": error.message });
        } finally {
            connection.release();
        }
    });

    // Rota para EXCLUIR uma moto (Seu código estava correto, mas adicionei a deleção em cascata)
    app.delete('/api/motos/:id', async (req, res) => {
        // NOTA: O 'ON DELETE CASCADE' na tabela 'moto_imagens' vai apagar
        // automaticamente todas as imagens associadas quando a moto for deletada.
        try {
            const { id } = req.params;
            // (Aqui também precisaríamos deletar os arquivos de imagem do disco, mas isso é mais complexo)
            const [result] = await pool.query("DELETE FROM motos WHERE id = ?", [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Moto não encontrada" });
            }
            res.json({ message: "Moto excluída com sucesso!" });
        } catch (error) {
            console.error('Erro ao excluir moto:', error);
            res.status(500).json({ "error": error.message });
        }
    });

    // Rota para EXCLUIR uma IMAGEM (Seu código estava correto)
    app.delete('/api/imagens/:id', async (req, res) => {
        try {
            const { id } = req.params;
            // (Aqui também precisaríamos deletar o arquivo de imagem do disco)
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

    // Rota para ATUALIZAR uma moto (Seu código estava correto)
    app.put('/api/motos/:id', upload.array('imagens', 10), async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { id } = req.params;
            const { marca, modelo, ano, km, preco, descricao, destaque } = req.body;
            const files = req.files;

            const updateMotoQuery = `
                UPDATE motos SET 
                marca = ?, modelo = ?, ano = ?, km = ?, preco = ?, descricao = ?, destaque = ?
                WHERE id = ?
            `;
            const motoParams = [marca, modelo, ano, km, preco, descricao, destaque, id];
            await connection.query(updateMotoQuery, motoParams);

            if (files && files.length > 0) {
                const imagensQuery = 'INSERT INTO moto_imagens (moto_id, imagem_url) VALUES ?';
                // ***CORRIGIDO:*** Salva o path relativo
                const imagensValues = files.map(file => [
                    id, 
                    path.relative(path.join(__dirname, '../'), file.path).replace(/\\/g, "/")
                ]);
                await connection.query(imagensQuery, [imagensValues]);

                // ***LÓGICA OPCIONAL:*** Atualiza a capa se novas imagens foram enviadas
                const novaImagemCapa = path.relative(path.join(__dirname, '../'), files[0].path).replace(/\\/g, "/");
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

// --- 6. Inicialização do Servidor (AJUSTADO PARA BRASIL CLOUD) ---
    // Pegamos o Host e a Porta das Variáveis de Ambiente
    const HOST = process.env.HOST || '0.0.0.0';
    const PORT_NUM = process.env.PORT || 3000;

    app.listen(PORT_NUM, HOST, () => {
        console.log(`Servidor rodando em http://${HOST}:${PORT_NUM}`);
        console.log(`Site pronto para receber conexões do proxy do Brasil Cloud.`);
    });
}

// --- 7. Execução Principal ---
startServer();