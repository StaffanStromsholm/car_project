'use strict';

const express = require('express');
const app = express();
const path = require('path');

const { port, host, storage } = require('./serverConfig.json');

const { createDataStorage } = require(path.join(__dirname, storage.storageFolder, storage.dataLayer));

const dataStorage = createDataStorage();


const homePath = path.join(__dirname, 'home');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'pageviews'));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res)=>{
    res.render(homePath);
})

app.get('/all', (req, res)=> {
    dataStorage.getAll()
    .then(data => res.render('allCars', { result: data }));
})

app.get('/getcar', (req, res)=>{
    dataStorage.getAll()
    .then(result => {
        res.render('getCar', {
            title: 'Get',
            header: 'Which one?',
            action: '/getcar',
            button: 'Search',
            result: result
        });
    })
})

app.post('/getcar', (req, res)=>{
    if(!req.body) res.sendStatus(500);

    const productNumber = req.body.productNumber;
    dataStorage.get(productNumber)
    .then(car => res.render('carPage', {result: car}))
    .catch(error => sendErrorPage(res, error));
;})

app.get('/inputform', (req, res)=>{
    res.render('form', {
        title: 'Add car',
        header: 'Add a new Car',
        action: '/insert',
        button: 'Add',
        result: null,
        productNumber: {value: '', readonly: ''},
        model: {value: '', readonly: ''},
        licencePlate: {value: '', readonly: ''},
        rating: {value: '', disabled: ''},
        year: {value: '', readonly: ''}
    })
})

app.post('/insert', (req, res)=>{
    if(!req.body) res.sendStatus(500);

    dataStorage.insert(req.body)
    .then(status => sendStatusPage(res, status))
    .catch(error => sendErrorPage(res, error));
});

app.get('/updateform', (req, res)=>{
    dataStorage.getAll()
    .then(result => {
        res.render('form', {
            title: 'Update car',
            header: 'Update car info',
            action: '/updatedata',
            button: 'Update',
            result: result,
            productNumber: { value: '', readonly: '' },
            model: { value: '', readonly: 'readonly'},
            licencePlate: { value: '', readonly: 'readonly'},
            rating: {value: '', disabled: 'disabled'},
            year: { value: '', readonly: 'readonly'}
        })
    })
});

app.post('/updatedata', async(req, res)=>{
    if(!req.body) {
        res.sendStatus(500);
    } else {
        try{
            const productNumber = req.body.productNumber;
            const car = await dataStorage.get(productNumber);
            res.render('form', {
                title: 'Update car',
                header: 'Update car info',
                action: '/updatecar',
                button: 'Update',
                result: null,
                productNumber:{value: car.productNumber, readonly: 'readonly'},
                model:{value: car.model, readonly: ''},
                licencePlate:{value: car.licencePlate, readonly: ''},
                rating: {value: car.rating, disabled: ''},                
                year:{value: car.year, readonly: ''}
            })
        }
        catch(error){
            sendErrorPage(res, error);
        }
    }
})

app.post('/updatecar', (req, res)=> {
    if(!req.body) res.sendStatus(500);

    dataStorage.update(req.body)
    .then(status => sendStatusPage(res, status))
    .catch(error => sendErrorPage(res, error));
});

app.get('/removecar', (req, res)=>{
    dataStorage.getAll()
    .then(result => {
        res.render('getCar', {
            title: 'Remove',
            header: 'Remove a car',
            action: '/removecar',
            button: 'Remove',
            result: result
        });
    })
});

app.post('/removecar', (req, res)=>{
    if(!req.body) res.sendStatus(500);
    console.log(req.body.productNumber);
    dataStorage.remove(req.body.productNumber)
    .then(status => sendStatusPage(res, status))
    .catch(error => sendErrorPage(res, error));
});

app.listen(process.env.PORT || port, process.env.HOST || host, ()=>console.log(`Server ${host}:${port} running`))

function sendErrorPage(res, error) {
    res.end();
}

function sendErrorPage(res, error, title = 'Error', header = 'Error') {
    sendStatusPage(res, error, title, header);
}

function sendStatusPage(res, status, title = 'Status', header = 'A-OK!') {
    return res.render('statusPage', { title, header, status })
}