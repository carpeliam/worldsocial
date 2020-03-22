import http from 'http';
import sockjs from 'sockjs';
import nStatic from 'node-static';

export default class Server {
  http: http.Server;
  sock: sockjs.Server;

  constructor(port: number, devMode = true) {
    this.http = http.createServer((req, res) => {
      if (devMode) {
        const fileServer = new nStatic.Server('./src/client');
        fileServer.serve(req, res);
      }
    });
    this.sock = sockjs.createServer({ prefix: '/sock' });
    const clients: { [id: string]: sockjs.Connection } = {};

    this.sock.on('connection', (conn: sockjs.Connection) => {
      clients[conn.id] = conn;
      conn.on('data', message => {
        for (const id in clients) {
          if (clients.hasOwnProperty(id))
            clients[id].write(message);
        }
      });
    });

    this.sock.installHandlers(this.http);
    this.http.listen(port, () => console.info('server up on port', port)); // tslint:disable-line
  }

  shutdown() {
    this.http.close();
  }
};
