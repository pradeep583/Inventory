
import express from 'express';
import posts from './routes/posts.js'
import path from 'path';


const PORT = process.env.PORT || 3000;
const app = express();


app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html'));
});



app.use('/inventory/items',posts);


app.listen(PORT, (err) => {
    if(err){
        console.error(err);
    } else {
        console.log(`Server is running on port ${PORT}...`);
    }
});

