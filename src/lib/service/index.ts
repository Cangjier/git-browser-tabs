import axios from "axios";


export class Service {
    static websocket: WebSocket = new WebSocket(`ws://localhost:${window.location.port}/`);
    static onNew: (data: any) => void = () => { };
    static onUpdate: (data: any) => void = () => { };

    static async register() {
        this.websocket.onmessage = (event) => {
            if (typeof event.data === 'string') {
                let data = JSON.parse(event.data);
                if (data.url === '/api/v1/on-new') {
                    this.onNew(data);
                }
                else if (data.url === '/api/v1/on-update') {
                    this.onUpdate(data);
                }
                else {
                    console.log(data);
                }
            }
        }
        this.websocket.onopen = () => {
            this.websocket.send(JSON.stringify({
                url: '/api/v1/register',
                response: '/api/v1/response'
            }));
        }
    }

    static async list() {
        let response = await axios.get('/api/v1/list');
        return response.data;
    }

    static async add(url: string, isSetCurrent: boolean) {
        let response = await axios.post('/api/v1/add', { url, isSetCurrent });
        return response.data;
    }

    static async remove(key: string) {
        let response = await axios.post('/api/v1/remove', { key });
        return response.data;
    }

    static async setCurrent(key: string) {
        let response = await axios.post('/api/v1/set-current', { key });
        return response.data;
    }

    static async getCurrent() {
        let response = await axios.get('/api/v1/get-current');
        return response.data;
    }

    static async close() {
        await axios.get('/api/v1/close');
    }

    static async show() {
        await axios.get('/api/v1/show');
    }

    static async mouseDownDrag() {
        await axios.get('/api/v1/mouse-down-drag');
    }
    static async navigate(keyword: string) {
        await axios.post('/api/v1/navigate', { keyword });
    }
    static async minimize() {
        await axios.get('/api/v1/minimize');
    }
    static async windowLeft() {
        await axios.get('/api/v1/window-left');
    }
    static async windowRight() {
        await axios.get('/api/v1/window-right');
    }

    static async maximize() {
        await axios.get('/api/v1/maximize');
    }

    static async goBack() {
        await axios.get('/api/v1/go-back');
    }

    static async goForward() {
        await axios.get('/api/v1/go-forward');
    }

    static async refresh() {
        await axios.get('/api/v1/refresh');
    }

    static async getSettings() {
        let response = await axios.get('/api/v1/get-settings');
        return response.data;
    }
    static async setSettings(settings: any) {
        await axios.post('/api/v1/set-settings', { settings });
    }
    static async ping(vmessUrl: string) {
        let response = await axios.post('/api/v1/ping', { vmessUrl });
        return response.data;
    }
    static async bookmarks() {
        let response = await axios.get('/api/v1/bookmarks');
        return response.data;
    }
    static async getTopMost() {
        let response = await axios.get('/api/v1/get-topmost');
        return response.data;
    }
    static async setTopMost(value: boolean) {
        await axios.post('/api/v1/set-topmost', { value });
    }
    static async switchTopMost() {
        await axios.get('/api/v1/switch-topmost');
    }
    static async aesEncrypt(data: string) {
        let response = await axios.post('/api/v1/aes-encrypt', { data });
        return response.data;
    }
}