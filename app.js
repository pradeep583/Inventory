import http from 'http'
import fs from 'fs'
import path from 'path'

let items = JSON.parse(fs.readFileSync('items.json'));

const PORT = process.env.PORT || 3000;

const logger = (req, res, next) => {
    console.log(`${req.url}, ${req.method}`);
    next();

}

const jsonmiddleware = (res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();

}

const getitem = (res) => {
    res.write(JSON.stringify(items));
    res.end();

}

const getitembyid = (req, res) => {
    const id = req.url.split('/')[3];
    const item = items.find((item) => item.id === parseInt(id));

    if (item) {
        res.write(JSON.stringify(item));
    }

    else {
        res.statusCode = 404;
        res.write(JSON.stringify({ message: 'Page Not Found' }));

    }
    res.end();

}

const notfound = (res) => {
    res.statusCode = 404;
    res.write(JSON.stringify({ message: 'Page Not Found' }));
    res.end();

}


const createitem = (req, res) => {
    let body = '';

    req.on('data', (chunk) => {
        body += chunk.toString();
    })

    req.on('end', () => {
        let newItem = JSON.parse(body);
        items.push(newItem);
        fs.writeFileSync('items.json', JSON.stringify(items, null, 2));
        res.statusCode = 201;
        res.write(JSON.stringify(newItem));
        res.end();

    })
}


const updateitem = (req, res) => {
    const id = req.url.split('/')[3];
    let body = '';

    req.on('data', (chunk) => {
        body += chunk.toString();
    })

    req.on('end', () => {
        const updates = JSON.parse(body);
        let item = items.find(item => item.id === parseInt(id));

        if (item) {
            Object.assign(item, updates);
            fs.writeFileSync('items.json', JSON.stringify(items, null, 2));
            res.statusCode = 200;
            res.write(JSON.stringify(item));
        }
        else {
            res.statusCode = 404;
            res.write(JSON.stringify({ message: "Item not Found" }));
        }

        res.end();
    })
}

const deleteitem = (req, res) => {
    const id = req.url.split('/')[3];
    const index = items.findIndex(item => item.id === parseInt(id));

    if (index !== -1) {
        const deleted = items.splice(index, 1);
        fs.writeFileSync('items.json', JSON.stringify(items, null, 2));
        res.statusCode = 200;
        res.write(JSON.stringify({ message: 'Deleted', item: deleted[0] }));
    } else {
        res.statusCode = 404;
        res.write(JSON.stringify({ message: 'Item Not Found' }));
    }
    res.end();
}


const purchaseitem = (req, res) => {
    const id = req.url.split('/')[3];
    let body = '';

    req.on('data', (chunk) => {
        body += chunk.toString();
    })

    req.on('end', () => {
        const { quantity } = JSON.parse(body);
        const item = items.find((item) => item.id === parseInt(id));

        if (item) {
            if (item.stock >= quantity) {
                item.stock -= quantity
                fs.writeFileSync('items.json', JSON.stringify(items, null, 2));
                res.statusCode = 200;
                res.write(JSON.stringify({ message: `Purchased ${item.name} of ${quantity}`, item }));

            }
            else {
                res.statusCode = 400;
                res.write(JSON.stringify({ message: 'Not Enough Stock Available' }));
            }

        }

        else {
            res.statusCode = 404;
            res.write(JSON.stringify({ message: "Item Not Found" }))
        }

        res.end();
    })
}


const server = http.createServer((req, res) => {
    logger(req, res, () => {
        jsonmiddleware(res, () => {

            if (req.url === '/' && req.method === 'GET'){
                const filepath = path.join(process.cwd(),'index.html');

                fs.readFile(filepath,(err,data) => {
                    if(err){
                        res.statusCode = 500;
                        res.end('Error Loading HTML');
                    }
                    else{
                        res.statusCode = 200;
                        res.setHeader('Content-Type','text/html');
                        res.end(data);
                    }
                })
            }
            else if (req.url === '/inventory/items' && req.method === 'GET') {
                getitem(res);
            }

            else if (req.method === 'GET' && req.url.match(/\/inventory\/items\/([0-9]+)/)) {
                getitembyid(req, res);
            }
            else if (req.method === 'POST' && req.url == '/inventory/items') {
                createitem(req, res);
            }

            else if (req.method === 'PUT' && req.url.match(/\/inventory\/items\/([0-9]+)/)) {
                updateitem(req, res);
            }
            else if (req.method === 'DELETE' && req.url.match(/\/inventory\/items\/([0-9]+)/)) {
                deleteitem(req, res);
            }
            else if (req.method === 'POST' && req.url.match(/\/inventory\/items\/([0-9]+)\/purchase/)) {
                purchaseitem(req, res);
            }

            else {
                notfound(res);
            }


        }
        )
    })

})


server.listen(PORT, () => {
    console.log(`Server is Running on ${PORT}...`);
})
