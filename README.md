az postgres flexible-server db create \
     --resource-group rg-multi-apis-jpsh \
     --server-name pg-multi-apis-demo-jpsh \
     --database-name multiapisdb

/////////////////////////////////////////////////

docker compose up --build

https://http.cat/


////////////////////////////////////////////////////
Prueba de users api

[
    {
        "name": "Sarah Connor",
        "email": "sarah@conner.com"
    },
    {
        "name": "John Doe",
        "email": "john@example.com"
    },
    {
        "name": "Juan Perez",
        "email": "juan@perez.com"
    }
]

////////////////////////////////////////////////////
Prueba de products api
[
    {
        "name": "Laptop Pro 14",
        "price": 1299.99
    },
    {
        "name": "Mouse Inalámbrico",
        "price": 24.50
    }
]