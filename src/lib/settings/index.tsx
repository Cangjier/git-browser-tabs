
import { forwardRef, useEffect, useMemo, useRef } from "react";
import { Flex } from "../flex";
import { Button, Divider, Input, Spin, Switch, Table, Tabs } from "antd";
import { useUpdate } from "../home";
import { Service } from "../service";
import { Base64 } from "js-base64";
import TextArea from "antd/es/input/TextArea";
import { ClearOutlined, ClockCircleOutlined } from "@ant-design/icons";

export interface IProxyRecord {
    key: number,
    url: string,
    isEdit?: boolean,
    ping?: string,
    add?: string,
    port?: number,
    remark?: string,
    ps?: string
}

export interface IProxySubscriber {
    key: number,
    url: string,
    isEdit?: boolean,
    tip?: string
}

export interface IFeature {
    key: number,
    value: string,
    isEdit?: boolean
}

const getInfos = (vmessUrl: string) => {
    if (vmessUrl.startsWith("vmess://")) {
        let base64 = vmessUrl.substring(8);
        let vmess = Base64.decode(base64);
        return JSON.parse(vmess);
    }
    else {
        return {};
    }
}

const pick = (args: any[]) => {
    for (let item of args) {
        if (item !== undefined) {
            if (typeof item === 'string' && item.length > 0) {
                return item;
            }
        }
    }
    return "";
}

export const Settings = forwardRef<{}, {}>((props, ref) => {
    const [proxyRecords, updateProxyRecords, proxyRecordsRef] = useUpdate<IProxyRecord[]>([]);
    const [proxyCurrent, updateProxyCurrent, proxyCurrentRef] = useUpdate<number>(-1);
    const [proxySubscribers, updateProxySubscribers, proxySubscribersRef] = useUpdate<IProxySubscriber[]>([]);
    const [proxyUseSort, updateProxyUseSort, proxyUseSortRef] = useUpdate<boolean>(false);
    const [features, updateFeatures, featuresRef] = useUpdate<IFeature[]>([]);
    const [aesEncryptValue, updateAesEncryptValue, aesEncryptValueRef] = useUpdate<string>('');
    const [loading, updateLoading, loadingRef] = useUpdate<boolean>(false);
    const self = useRef({
        settings: {} as any,
        getProxy() {
            if (self.current.settings.proxy === undefined) {
                self.current.settings.proxy = {};
            }
            return self.current.settings.proxy;
        },
        getProxyUrls(): string[] {
            if (self.current.getProxy().urls === undefined) {
                self.current.getProxy().urls = [];
            }
            return self.current.getProxy().urls;
        },
        getProxyCurrent() {
            if (self.current.getProxy().current === undefined) {
                self.current.getProxy().current = -1;
            }
            return self.current.getProxy().current;
        },
        getProxySubscribers(): string[] {
            if (self.current.getProxy().subscribers === undefined) {
                self.current.getProxy().subscribers = [];
            }
            return self.current.getProxy().subscribers;
        },
        getFeatures(): string[] {
            if (self.current.settings.features === undefined) {
                self.current.settings.features = [];
            }
            return self.current.settings.features;
        },
        getProxyUseSort() {
            if (self.current.getProxy().useSort === undefined) {
                self.current.getProxy().useSort = false;
            }
            return self.current.getProxy().useSort;
        },
        async enable(key: number) {
            let proxy = self.current.getProxy();
            proxy.current = key;
            await self.current.save();
            updateProxyCurrent(key);
        },
        isListPing: false,
        async listPing() {
            if (self.current.isListPing) {
                return;
            }
            self.current.isListPing = true;
            let tasks = [];
            for (let item of proxyRecordsRef.current) {
                let tempItem = item;
                tasks.push((async () => {
                    if (tempItem.add && tempItem.port) {
                        let response = await Service.ping(tempItem.url);
                        if (response.success) {
                            tempItem.ping = response.data;
                        }
                        else {
                            tempItem.ping = "Error";

                        }
                    }
                    else {
                        tempItem.ping = "Error";
                    }
                    updateProxyRecords([...proxyRecordsRef.current]);
                })());
            }
            await Promise.all(tasks);
            self.current.isListPing = false;
        },
        async checkSubscribers() {
            let tasks = [];
            for (let item of proxySubscribersRef.current) {
                let tempItem = item;
                tasks.push((async () => {
                    let response = await Service.httpGet(tempItem.url);
                    tempItem.tip = "Checking";
                    if (response.success) {
                        let data = response.data;
                        if (data) {
                            if (data.includes("Cloudflare")) {
                                tempItem.tip = "Need to bypass Cloudflare";
                            }
                        }
                    }
                    if(tempItem.tip === "Checking") {
                        tempItem.tip = "Normal";
                    }
                    updateProxySubscribers([...proxySubscribersRef.current]);
                })());
            }
            await Promise.all(tasks);
        },
        async refreshProxyUrls() {
            let proxyUrls = self.current.getProxyUrls();
            if (proxyUrls.length === 0) {
                updateProxyRecords([{
                    key: 0,
                    url: '',
                    isEdit: true
                }]);
            }
            else {
                updateProxyRecords(proxyUrls.map((item, index) => {
                    return {
                        ...getInfos(item),
                        key: index,
                        url: item,
                    }
                }));
            }
            updateProxyCurrent(self.current.getProxyCurrent());
            updateProxyUseSort(self.current.getProxyUseSort());
        },
        async refreshProxySubscribers() {
            let proxySubscribers = self.current.getProxySubscribers();
            if (proxySubscribers.length === 0) {
                updateProxySubscribers([{
                    key: 0,
                    url: '',
                    isEdit: true
                }]);
            }
            else {
                updateProxySubscribers(proxySubscribers.map((item, index) => {
                    return {
                        key: index,
                        url: item,
                    }
                }));
            }
        },
        async refreshFeatures() {
            let features = self.current.getFeatures();
            if (features.length === 0) {
                updateFeatures([{
                    key: 0,
                    value: '',
                    isEdit: true
                }]);
            }
            else {
                updateFeatures(features.map((item, index) => {
                    return {
                        key: index,
                        value: item,
                    }
                }));
            }
        },
        async refresh() {
            let msg = await Service.getSettings();
            if (msg.success) {
                self.current.settings = msg.data;
                await self.current.refreshProxyUrls();
                await self.current.refreshProxySubscribers();
                await self.current.refreshFeatures();
            }
        },
        async deleteProxyUrl(key: number) {
            updateLoading(true);
            let urls = self.current.getProxyUrls();
            if (key !== -1) {
                urls.splice(key, 1);
                await self.current.save();
                await self.current.refresh();
            }
            updateLoading(false);
        },
        async addProxyUrl(url: string) {
            updateLoading(true);
            let urls = self.current.getProxyUrls();
            urls.push(url);
            await self.current.save();
            await self.current.refresh();
            updateLoading(false);
        },
        async deleteProxySubscriber(key: number) {
            updateLoading(true);
            let urls = self.current.getProxySubscribers();
            if (key !== -1) {
                urls.splice(key, 1);
                await self.current.save();
                await self.current.refresh();
            }
            updateLoading(false);
        },
        async deleteFeature(key: number) {
            updateLoading(true);
            let features = self.current.getFeatures();
            if (key !== -1) {
                features.splice(key, 1);
                await self.current.save();
                await self.current.refresh();
            }
            updateLoading(false);
        },
        async addProxySubscriber(url: string) {
            updateLoading(true);
            let urls = self.current.getProxySubscribers();
            urls.push(url);
            await self.current.save();
            await self.current.refresh();
            updateLoading(false);
        },
        async addFeature(item: string) {
            updateLoading(true);
            let features = self.current.getFeatures();
            features.push(item);
            await self.current.save();
            await self.current.refresh();
            updateLoading(false);
        },
        async setProxyUseSort(useSort: boolean) {
            updateLoading(true);
            let proxy = self.current.getProxy();
            proxy.useSort = useSort;
            updateProxyUseSort(useSort);
            await self.current.save();
            updateLoading(false);

        },
        async save() {
            await Service.setSettings(self.current.settings);
        },
        async clearProxyUrls() {
            updateLoading(true);
            let proxy = self.current.getProxy();
            proxy.urls = [];
            await self.current.save();
            await self.current.refresh();
            updateLoading(false);
        }
    });

    const render = {
        entry: () => {
            return <Flex direction="row" style={{
                width: '100vw',
                height: '100vh'
            }}>
                <Spin spinning={loading} fullscreen></Spin>
                <Tabs tabPosition='left' items={[
                    {
                        key: 'proxy-urls',
                        label: 'Proxy Urls',
                    },
                    {
                        key: 'proxy-subscribers',
                        label: 'Proxy Subscribers',
                    },
                    {
                        key: 'features',
                        label: 'Features',
                    },
                    {
                        key: 'tools',
                        label: 'Tools',
                    }
                ]} onChange={key => {
                    if (key === 'proxy-urls') {
                        document.getElementById('link-proxy-urls')?.scrollIntoView();
                    }
                    else if (key === 'proxy-subscribers') {
                        document.getElementById('link-proxy-subscribers')?.scrollIntoView();
                    }
                    else if (key === 'features') {
                        document.getElementById('link-features')?.scrollIntoView();
                    }
                    else if (key === 'tools') {
                        document.getElementById('link-tools')?.scrollIntoView();
                    }
                }}></Tabs>
                <Flex style={{ width: 0, flex: 1, overflowY: 'auto' }} direction='column' >
                    {render.proxyUrls()}
                    {render.proxySubscribers()}
                    {render.features()}
                    {render.tools()}
                </Flex>
            </Flex>
        },
        proxyUrls: () => {
            return <Flex id="link-proxy-urls" direction='column'>
                <h3>{"Proxy Urls"}</h3>
                <Flex spacing={8} verticalCenter>
                    <Button onClick={async () => {
                        await self.current.setProxyUseSort(!proxyUseSortRef.current);
                    }} type='text'>{"Automatically identify and select the URL with the lowest latency"}</Button>
                    <Switch checked={proxyUseSort} onChange={async (checked) => {
                        await self.current.setProxyUseSort(checked);
                    }}></Switch>
                </Flex>
                <Flex spacing={8} verticalCenter>
                    <Button type='text'>{"Current Url:"}</Button>
                    <Input readOnly style={{
                        borderRadius: '1em'
                    }} value={
                        (() => {
                            let record = proxyRecords.find(item => item.key === proxyCurrent)
                            if (record) return pick([record.ps, record.remark, `${record.add}:${record.port}`, record.url]);
                            return "";
                        })()
                    }></Input>
                </Flex>
                <Flex>
                    <Button icon={<ClearOutlined />} type="text" onClick={async () => {
                        await self.current.clearProxyUrls();
                    }}>{"Clear"}</Button>
                    <Button icon={<ClockCircleOutlined />} type="text" onClick={async () => {
                        await self.current.listPing();
                    }}>{"Ping"}</Button>
                </Flex>
                <Table dataSource={proxyRecords}
                    scroll={{ x: 'max-content' }}
                    columns={[
                        {
                            key: 'alias',
                            title: 'Alias',
                            render: (record: IProxyRecord) => {
                                if (record.isEdit) {
                                    return "";
                                }
                                else {
                                    return pick([record.remark, record.ps]);
                                }
                            }
                        },
                        {
                            key: 'address',
                            title: 'Address',
                            render: (record: IProxyRecord) => {
                                if (record.isEdit) {
                                    return "";
                                }
                                else {
                                    return record.add;
                                }
                            }
                        },
                        {
                            key: 'ping',
                            title: 'Ping',
                            render: (record: IProxyRecord) => {
                                if (record.isEdit) {
                                    return "";
                                }
                                else {
                                    return record.ping;
                                }
                            }
                        },
                        {
                            key: 'url',
                            title: 'Url',
                            render: (record: IProxyRecord) => {
                                if (record.isEdit) {
                                    return <Input value={record.url} onChange={
                                        (event) => {
                                            record.url = event.target.value;
                                            updateProxyRecords([...proxyRecordsRef.current]);
                                        }
                                    }></Input>
                                }
                                else {
                                    return record.url;
                                }
                            }
                        },
                        {
                            key: 'operation',
                            title: 'Operation',
                            fixed: 'right',
                            width: 160,
                            render: (record: IProxyRecord) => {
                                if (record.isEdit) {
                                    return <Flex spacing={8}>
                                        <Button onClick={async () => {
                                            record.isEdit = false;
                                            updateProxyRecords([...proxyRecordsRef.current]);
                                            await self.current.addProxyUrl(record.url);
                                        }}>Save</Button>
                                        <Button onClick={() => {
                                            // 移除
                                            self.current.deleteProxyUrl(record.key);
                                        }}>Cancel</Button>
                                    </Flex>
                                }
                                else {
                                    return <Flex spacing={8}>
                                        <Button type='text' onClick={
                                            () => {
                                                self.current.enable(record.key);
                                            }
                                        }>{"Enable"}</Button>
                                        <Button type='text' onClick={
                                            () => {
                                                self.current.deleteProxyUrl(record.key);
                                            }
                                        }>{"Remove"}</Button>
                                        <Button type='text' onClick={
                                            () => {
                                                updateProxyRecords([...proxyRecordsRef.current, {
                                                    key: proxyRecordsRef.current.length,
                                                    url: '',
                                                    isEdit: true
                                                }]);
                                            }
                                        }>{"Add"}</Button>
                                    </Flex>
                                }
                            }
                        }
                    ]}></Table>
                <Divider></Divider>
            </Flex>
        },
        proxySubscribers: () => {
            return <Flex id="link-proxy-subscribers" direction='column'>
                <h3>{"Proxy Subscribers"}</h3>
                <Flex direction="row">
                    <Button icon={<ClockCircleOutlined />} type="text" onClick={async () => {
                        await self.current.checkSubscribers();
                    }}>{"Check"}</Button>
                </Flex>
                <Table dataSource={proxySubscribers}
                    scroll={{ x: 'max-content' }}
                    columns={[
                        {
                            key: 'tip',
                            title: 'Tip',
                            render: (record: IProxySubscriber) => {
                                if (record.tip) {
                                    return record.tip;
                                }
                                else {
                                    return "";
                                }
                            }
                        },
                        {
                            key: 'url',
                            title: 'Url',
                            render: (record: IProxySubscriber) => {
                                if (record.isEdit) {
                                    return <Input value={record.url} onChange={
                                        (event) => {
                                            record.url = event.target.value;
                                            updateProxySubscribers([...proxySubscribersRef.current]);
                                        }
                                    }></Input>
                                }
                                else {
                                    return record.url;
                                }
                            }
                        },
                        {
                            key: 'operation',
                            title: 'Operation',
                            fixed: 'right',
                            width: 160,
                            render: (record: IProxySubscriber) => {
                                if (record.isEdit) {
                                    return <Flex spacing={8}>
                                        <Button onClick={async () => {
                                            record.isEdit = false;
                                            updateProxySubscribers([...proxySubscribersRef.current]);
                                            await self.current.addProxySubscriber(record.url);
                                        }}>Save</Button>
                                        <Button onClick={() => {
                                            // 移除
                                            self.current.deleteProxySubscriber(record.key);
                                        }}>Cancel</Button>
                                    </Flex>
                                }
                                else {
                                    return <Flex spacing={8}>
                                        <Button type='text' onClick={
                                            () => {
                                                self.current.deleteProxySubscriber(record.key);
                                            }
                                        }>{"Remove"}</Button>
                                        <Button type='text' onClick={
                                            () => {
                                                updateProxySubscribers([...proxySubscribersRef.current, {
                                                    key: proxySubscribersRef.current.length,
                                                    url: '',
                                                    isEdit: true
                                                }]);
                                            }
                                        }>{"Add"}</Button>
                                    </Flex>
                                }
                            }
                        }
                    ]}></Table>
                <Divider></Divider>
            </Flex>
        },
        features: () => {
            return <Flex id="link-features" direction='column'>
                <h3>{"Features"}</h3>
                <Table dataSource={features}
                    scroll={{ x: 'max-content' }}
                    columns={[
                        {
                            key: 'value',
                            title: 'Value',
                            render: (record: IFeature) => {
                                if (record.isEdit) {
                                    return <Input value={record.value} onChange={
                                        (event) => {
                                            record.value = event.target.value;
                                            updateFeatures([...featuresRef.current]);
                                        }
                                    }></Input>
                                }
                                else {
                                    return record.value;
                                }
                            }
                        },
                        {
                            key: 'operation',
                            title: 'Operation',
                            fixed: 'right',
                            width: 160,
                            render: (record: IFeature) => {
                                if (record.isEdit) {
                                    return <Flex spacing={8}>
                                        <Button onClick={async () => {
                                            record.isEdit = false;
                                            updateFeatures([...featuresRef.current]);
                                            await self.current.addFeature(record.value);
                                        }}>Save</Button>
                                        <Button onClick={() => {
                                            // 移除
                                            self.current.deleteFeature(record.key);
                                        }}>Cancel</Button>
                                    </Flex>
                                }
                                else {
                                    return <Flex spacing={8}>
                                        <Button type='text' onClick={
                                            () => {
                                                self.current.deleteFeature(record.key);
                                            }
                                        }>{"Remove"}</Button>
                                        <Button type='text' onClick={
                                            () => {
                                                updateFeatures([...featuresRef.current, {
                                                    key: featuresRef.current.length,
                                                    value: '',
                                                    isEdit: true
                                                }]);
                                            }
                                        }>{"Add"}</Button>
                                    </Flex>
                                }
                            }
                        }
                    ]}></Table>
                <Divider></Divider>
            </Flex>
        },
        tools: () => {
            return <Flex id="link-tools" direction="column">
                <h3>{"Tools"}</h3>
                <h4>{"AES"}</h4>
                <Flex direction="column" style={{
                    gap: '8px'
                }}>
                    <TextArea style={{
                        borderRadius: '1em'
                    }} rows={4} value={aesEncryptValue} onChange={
                        (event) => {
                            updateAesEncryptValue(event.target.value);
                        }
                    }></TextArea >
                    <Button onClick={async () => {
                        let response = await Service.aesEncrypt(aesEncryptValue);
                        if (response.success) {
                            updateAesEncryptValue(response.data);
                        }
                    }}>{"Encrypt"}</Button>
                    <Divider></Divider>
                </Flex>
                <Divider></Divider>
            </Flex>
        }
    }

    useEffect(() => {
        self.current.refresh();
    }, []);

    return useMemo(render.entry, [
        props,
        proxyRecords,
        proxyCurrent,
        proxySubscribers,
        proxyUseSort,
        features,
        aesEncryptValue,
        loading
    ]);
})