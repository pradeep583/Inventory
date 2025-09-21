import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Ravikumar',
  database: 'inventorydb',
});

export default pool;
