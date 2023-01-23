const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

let books = [
  { id: 1, title: 'Book1', author: 'Author1', ISBN: '1111111111111' },
  { id: 2, title: 'Book2', author: 'Author2', ISBN: '2222222222222' },
  { id: 3, title: 'Book3', author: 'Author3', ISBN: '3333333333333' }
];

let reviews = [
  { id: 1, bookId: 1, userId: 1, review: 'Great book', rating: 5 },
  { id: 2, bookId: 1, userId: 2, review: 'Not bad', rating: 3 },
  { id: 3, bookId: 2, userId: 1, review: 'Good read', rating: 4 }
];

let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', password: 'password' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', password: 'password' }
];

app.get('/books', (req, res) => {
  res.json(books);
});

app.get('/books/search', (req, res) => {
  const keyword = req.query.q;
  const foundBooks = books.filter(b => b.title.toLowerCase().includes(keyword.toLowerCase()) || b.author.toLowerCase().includes(keyword.toLowerCase())|| b.ISBN.toLowerCase().includes(keyword.toLowerCase()));
  res.json(foundBooks);
});

app.get('/books/:id', (req, res) => {
  const book = books.find(b => b.id === parseInt(req.params.id));
  if (!book) res.status(404).send('The book with the given ID was not found.');
  res.json(book);
});

app.get('/books/:id/reviews', (req, res) => {
  const bookReviews = reviews.filter(r => r.bookId === parseInt(req.params.id));
  res.json(bookReviews);
});


app.get('/books/search/ISBN/:ISBN', (req, res) => {
    const ISBN = req.params.ISBN;
    const book = books.find(b => b.ISBN === ISBN);
    if (!book) res.status(404).send('The book with the given ISBN was not found.');
    res.json(book);
  });

  app.get('/books/search/author/:author', (req, res) => {
    const author = req.params.author;
    const booksByAuthor = books.filter(b => b.author.toLowerCase() === author.toLowerCase());
    res.json(booksByAuthor);
  });
  
  app.get('/books/search/title/:title', (req, res) => {
    const title = req.params.title;
    const booksByTitle = books.filter(b => b.title.toLowerCase() === title.toLowerCase());
    res.json(booksByTitle);
  });
  
const jwtSecret = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNjc0NDkyMTQ0fQ.xrIo_7hQh7ww6tBRTy-dCdLI5mTlzoRKbyL3CJfNj8E';

app.post('/register', (req, res) => {
  const user = {
    id: users.length + 1,
    name: req.body.name,
    email: req.body.email,
    password: req.body.password
  };
  users.push(user);
  res.json({ message: 'User registered successfully' });
});

app.post('/login', (req, res) => {
 
  const user = users.find({email: req.body.email});
  if (!user) return res.status(401).json({ message: 'Invalid email ' });
 const verif= bcrypt.compare(req.body.password, user.password);
 if (!verif) return res.status(400).json({ message: 'Invalid  password' });
  const token = jwt.sign({ id: user.id }, jwtSecret,{expiresIn: '36000s'});
  res.header('auth-token', token).send(token)
});

app.post('/books/:id/reviews', authenticate, (req, res) => {
  const review = {
    id: reviews.length + 1,
    bookId: parseInt(req.params.id),
    userId: req.user.id,
    review: req.body.review,
    rating: req.body.rating
  };
  reviews.push(review);
  res.json({ message: 'Review added successfully' });
});

app.put('/reviews/:id', authenticate,(req, res) => {
  const review = reviews.find(r => r.id === parseInt(req.params.id));
  if (!review) return res.status(404).json({ message: 'Review not found' });
  if (review.userId !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
  review.review = req.body.review;
  review.rating = req.body.rating;
  res.json({ message: 'Review updated successfully' });
});

app.delete('/reviews/:id', authenticate, (req, res) => {
  const review = reviews.find(r => r.id === parseInt(req.params.id));
  if (!review) return res.status(404).json({ message: 'Review not found' });
  if (review.userId !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
  const index = reviews.indexOf(review);
  reviews.splice(index, 1);
  res.json({ message: 'Review deleted successfully' });
});

app.listen(3000, () => console.log('Server started'));

function authenticate(req, res, next) {
    const token = req.headers['x-access-token'];
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
    jwt.verify(token, jwtSecret, function(err, decoded) {
        if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        req.userId = decoded.id;
        next();
    });
}
