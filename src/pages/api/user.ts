export default function handler(req, res) {
  res.status(200).json({
    name: 'Testing user',
    items: [{
      id: 1,
      item: 'Testing item',
    }, {
      id: 2,
      item: 'Another item',
    }, {
      id: 3,
      item: 'One more data',
    }, {
      id: 4,
      item: 'Some title',
    }]
  });
}
