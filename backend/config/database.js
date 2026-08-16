const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Testa a conexão ao iniciar
pool.getConnection()
  .then(conn => {
    console.log('✅ Conectado ao banco de dados MySQL');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Erro ao conectar ao banco de dados:', err.message);
  });

module.exports = pool;