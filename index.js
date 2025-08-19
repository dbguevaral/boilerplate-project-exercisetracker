const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const moment = require('moment');
const users = [];
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.use(bodyParser.urlencoded({ extended: true }));

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

app.post('/api/users', (req, res) => {
  const username = req.body.username;
  const user = {
    username: username,
    _id: users.length + 1,
    log: [],
    count: 0
  }
  res.json({username: user.username, _id: user._id});
  users.push(user);
})

app.post('/api/users/:_id/exercises', (req, res) => {
  const id = req.params._id;
  const user = users.find(user => user._id == id);
  if(!user) return res.send('User not found');
  
  const description = req.body.description;
  if(!description) return res.send('Description is required');
  if(typeof description !== 'string') return res.send('Description must be a string');
  if(description.length > 20) return res.send('Description must be at max 20 characters long')
  
  const duration = req.body.duration;
  if(!duration) return res.send('Duration is required')
  if(isNaN(duration)) return res.send('Duration must be a number')
  if(duration <= 0) return res.send('Duration must be greater than 0')
  
  let date = req.body.date;
  if(!date) date = new Date();
  else if(!moment(date, 'YYYY-MM-DD', true).isValid()) return res.send('Date must be in YYYY-MM-DD format')
  
  const exercise = {
    description: description,
    duration: Number(duration),
    date: moment(date, 'YYYY-MM-DD').format('ddd MMM DD YYYY')
  }
  
  user.log.push(exercise)
  user.count = user.log.length;
  
  res.json(user)
})

app.get('/api/users', (req, res) => {
  res.json(users.map(user => ({username: user.username, _id: user._id})));
})

app.get('/api/users/:_id/logs', (req, res) => {
  const id = req.params._id;
  const user = users.find(user => user._id == id);
  if(!user) return res.send('User not found');
  let log = user.log || [];

  const from = req.query.from;
  const to = req.query.to;
  if(from || to){
    const fromDate = from && moment(from, 'YYYY-MM-DD', true).isValid() ? moment(from, 'YYYY-MM-DD') : null;
    const toDate = to && moment(to, 'YYYY-MM-DD', true).isValid() ? moment(to, 'YYYY-MM-DD') : null;

    if((from && !fromDate) || (to && !toDate)) {
      return res.send('Provided "from" or "to" dates must be in YYYY-MM-DD format')
    }
    log = log.filter( item => {
      const itemDate = moment(item.date, 'ddd MMM DD YYYYY');
      if(fromDate && toDate) return itemDate.isSameOrAfter(fromDate, 'day') && itemDate.isSameOrBefore(toDate, 'day')
      if(fromDate) return itemDate.isSameOrAfter(fromDate, 'day');
      if(toDate) return itemDate.isSameOrBefore(toDate, 'day');
    })
  }

  const limit = req.query.limit;
  if(limit){
    if(!Number.isInteger(Number(limit))) return res.send('Limit must be an integer');
    log = log.slice(0, Number(limit));
  }

  res.json({
    username: user.username,
    count: log.length,
    _id: user._id,
    log
  })
})