import Server from '.';

const port = parseInt(process.env.PORT || '8080', 10);

const server = new Server(port);
