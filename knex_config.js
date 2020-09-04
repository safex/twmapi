module.exports = {
    client: 'postgresql',
    connection: {
        host: '127.0.0.1',
        port: 5432,
        database: 'twmapi_stagenet',
        user: 'postgres',
        password: 'password'
    },
    pool: {
        min: 2,
        max: 10
    },
    migrations: {
        tableName: 'twmapi_migrations'
    }
};