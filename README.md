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
        "name": "PC gamer",
        "price": 2000.29
    },
    {
        "name": "Monitor",
        "price": 1500.50
    }
]
/////

npm install

docker compose build --no-cache