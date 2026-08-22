require('dotenv').config();
const express = require('express');
const path = require('path');
const { initDb } = require('./db/pool');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(require('./routes/index'));
app.use(require('./routes/servicio'));
app.use(require('./routes/cotizacion'));
app.use(require('./routes/admin'));

// 404 genérico
app.use((req, res) => {
  res.status(404).render('404', {
    siteName: process.env.SITE_NAME || 'Tu Empresa'
  });
});

const PORT = process.env.PORT || 3000;

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error inicializando la base de datos:', err);
    process.exit(1);
  });

module.exports = app;
