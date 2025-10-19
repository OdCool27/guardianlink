require('dotenv').config();
const { Sequelize } = require('sequelize');

console.log('Testing database connection...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

const sequelize = new Sequelize({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: console.log,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

console.log('Connection details:');
console.log('Host:', process.env.DB_HOST);
console.log('Port:', process.env.DB_PORT);
console.log('Database:', process.env.DB_NAME);
console.log('User:', process.env.DB_USER);
console.log('Password:', process.env.DB_PASSWORD ? '***' : 'Not set');

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection successful!');

        // Test a simple query
        const result = await sequelize.query('SELECT version();');
        console.log('✅ Database version:', result[0][0].version);

        await sequelize.close();
        console.log('✅ Connection closed');
    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        if (error.parent) {
            console.error('Parent error:', error.parent.message);
        }
    }
}

testConnection();