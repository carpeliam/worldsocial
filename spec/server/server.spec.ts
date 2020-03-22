import SockJS from 'sockjs-client';
import Server from '../../src/server';

describe('Server', () => {
  let server: Server;
  let sendingClient: Client;
  let receivingClient : Client;

  beforeEach(() => {
    server = new Server(8080);
    sendingClient = new Client();
    receivingClient = new Client();
  });

  it('sends any published message to all clients', async () => {
    await sendingClient.connect('http://localhost:8080/sock');
    await receivingClient.connect('http://localhost:8080/sock');

    sendingClient.publish('test');

    await sendingClient.waitForMessage('test');
    await receivingClient.waitForMessage('test');
  });

  afterEach(() => {
    sendingClient.close();
    receivingClient.close();
    server.shutdown();
  })
})

class Client {
  sockClient?: WebSocket;
  messages: string[];
  constructor() {
    this.messages = [];
  }
  connect(address: string) {
    this.sockClient = new SockJS(address);
    this.sockClient.onmessage = (e: MessageEvent) => { this.messages.push(e.data); }
    return new Promise((resolve) => {
      this.sockClient!.onopen = resolve;
    });
  }
  publish(message: string) {
    this.sockClient!.send(message);
  }
  waitForMessage(message: string) {
    return new Promise((resolve) => {
      if (this.messages.includes(message)) {
        resolve();
      } else {
        const sockClientOnMessage = this.sockClient!.onmessage;
        this.sockClient!.onmessage = (e: MessageEvent) => {
          this.messages.push(e.data);
          if (message === e.data) {
            this.sockClient!.onmessage = sockClientOnMessage;
            resolve();
          }
        }
      }
    });
  }
  close() { this.sockClient!.close(); }
}
