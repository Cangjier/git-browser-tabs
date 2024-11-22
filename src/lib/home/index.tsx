import { Avatar, Button, ConfigProvider, Dropdown, Input, Tabs } from "antd";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { Flex } from "../flex";
import { ArrowLeftOutlined, BorderOutlined, CloseOutlined, ExpandOutlined, HomeOutlined, MinusOutlined, PicLeftOutlined, PicRightOutlined, PlusOutlined, PushpinOutlined, RedoOutlined } from "@ant-design/icons";
import { Service } from "../service";
import { ItemType } from "antd/es/menu/interface";
import { bookmark, renderBookmark } from "../about_blank";
export function useUpdate<T>(defaultValue: T) {
    const [state, setState] = useState(defaultValue);
    const ref = useRef(defaultValue);
    const update = (value: T) => {
        ref.current = value;
        setState(value);
    }
    return [state, update, ref] as const;
}
export const InjectStyle = (value: string) => {
    const id = `rand_${Math.random().toString(36).substr(2, 9)}`
    if (document.getElementById(id) === null) {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.id = id;
        style.innerHTML = value;
        document.getElementsByTagName('head')[0].appendChild(style);
    }
}
InjectStyle(`
    :focus-visible {
    outline: none!important;
}
`);
export interface IWebview {
    key: string,
    title: string,
    url: string
}

// 通过正则表达式获取url的host和port，支持http和https
const getUrlHostRegexp = /^(https?:\/\/)?([^\/:]+)(:\d+)?/;
// 通过正则表达式获取url的port
const getUrlPortRegexp = /:(\d+)/;
const getUrlHost = (url: string) => {
    let result = getUrlHostRegexp.exec(url);
    if (result) {
        return result[2];
    }
    return '';
}
const getUrlPort = (url: string) => {
    let result = getUrlPortRegexp.exec(url);
    if (result) {
        return result[1];
    }
    return '';
}

export const Home = forwardRef<{}, {}>((props, ref) => {
    const [tabs, updateTabs, tabsRef] = useUpdate<IWebview[]>([]);
    const [currentTab, updateCurrentTab, currentTabRef] = useUpdate<string>("");
    const [currentUrl, updateCurrentUrl, currentUrlRef] = useUpdate<string>('');
    const [isTopMost, updateIsTopMost, isTopMostRef] = useUpdate<boolean>(false);
    const divRef = useRef<HTMLDivElement>(null);
    const self = useRef({
        async add(url: string, isSetCurrent: boolean) {
            let msg = await Service.add(url, isSetCurrent);
            if (msg.success) {
                updateTabs([...tabsRef.current, msg.data]);
                updateCurrentTab(msg.data.current);
                updateCurrentUrl(msg.data.url);
            }
        },
        async setCurrent(key: string) {
            let tab = tabsRef.current.find(item => item.key === key);
            if (tab) {
                let msg = await Service.setCurrent(key);
                if (msg.success) {
                    updateCurrentTab(key);
                    updateCurrentUrl(tab.url);
                }
            }

        },
        async remove(key: string) {
            let index = tabsRef.current.findIndex(item => item.key === key);
            if (index !== -1) {
                let msg = await Service.remove(key);
                if (msg.success) {
                    let tab = tabsRef.current[index];
                    let tempTabs = [...tabsRef.current];
                    tempTabs.splice(index, 1);
                    updateTabs(tempTabs);
                    if (currentTabRef.current === key) {
                        let nextTab = tempTabs[index] ?? tempTabs[index - 1];
                        if (nextTab) {
                            await self.current.setCurrent(nextTab.key);
                        }
                    }
                }

            }
        },
        formatUrl: (url: string) => {
            let port = getUrlPort(url);
            if (`localhost:${port}` === window.location.host) {
                return '';
            }
            return url;
        },
        async switchTopmost() {
            let value = !isTopMostRef.current;
            updateIsTopMost(value);
            await Service.setTopMost(value);
        }
    });
    useEffect(() => {
        Service.onNew = (data) => {
            let tempTabs = [...tabsRef.current];
            let webview = data.webview;
            tempTabs.push(webview);
            updateTabs(tempTabs);
            updateCurrentTab(webview.key);
            updateCurrentUrl(webview.url);
        }
        Service.onUpdate = (data) => {
            let tempTabs = [...tabsRef.current];
            let webview = data.webview;
            let index = tempTabs.findIndex(item => item.key === webview.key);
            if (index !== -1) {
                tempTabs[index] = webview;
                updateTabs(tempTabs);
            }
            if (webview.type == "url" && currentTabRef.current === webview.key) {
                updateCurrentUrl(webview.url);
            }
        }
        let func=async ()=>{
            await Service.register();
            let msg = await Service.list();
            if (msg.success) {
                if(msg.data.length==0){
                    await self.current.add(`${window.location.origin}/about_blank`, true);
                }
                else{
                    updateTabs(msg.data);
                }
            }
            Service.show();
        }
        func();
    }, []);


    useEffect(() => {
        const ref = divRef.current;
        if (ref) {
            // 修改样式
            ref.style.setProperty('-webkit-app-region', 'drag');

            // 添加事件监听
            const handleMouseDown = async (evt: MouseEvent) => {
                await Service.mouseDownDrag();
                evt.preventDefault();
                evt.stopPropagation();
            };

            ref.addEventListener('mousedown', handleMouseDown);

            // 清理函数，移除事件监听器
            return () => {
                ref.removeEventListener('mousedown', handleMouseDown);
            };
        }
    }, []); // 只在挂载时执行
    return <Flex direction='column' style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
    }}>
        <Flex spacingStart={'0.5em'} spacingEnd={'0.5em'} style={{
            backgroundColor: '#eee'
        }} direction='row' verticalCenter>
            <Avatar size={24}></Avatar>
            <Tabs tabBarStyle={{
                margin: 0,
                padding: '0 0.5em'
            }}
                type={'editable-card'}
                size={'small'}
                onChange={key => self.current.setCurrent(key)}
                activeKey={currentTab}
                items={tabs.map(item => {
                    return {
                        key: item.key,
                        // title 最大长度为 10
                        label: (item.url === "about:blank" || item.url == `${window.location.origin}/about_blank` || item.url === "") ? "新建标签页" : item.title.length > 10 ? item.title.substring(0, 10) + '..' : item.title,
                        style: {
                            userSelect: 'none'
                        }
                    }
                })}
                onEdit={async (key, action) => {
                    if (action === 'remove') {
                        await self.current.remove(key as string);
                    }
                    else if (action === 'add') {
                        await self.current.add(`${window.location.origin}/about_blank`, true);
                    }
                }}
            ></Tabs>
            <Flex onDoubleClick={() => {
                Service.maximize();
            }} ref={divRef} style={{
                flex: 1,
                height: '100%',
                userSelect: 'none',
            }} >

            </Flex>
            <Flex direction="row" spacing={12}>
                <Button onClick={() => {
                    Service.windowRight();
                }} type='text' icon={<PicRightOutlined style={{ fontSize: '12px' }} />}></Button>
                <Button style={{
                    backgroundColor: isTopMost ? '#d9d9d9' : undefined,
                }} onClick={() => {
                    self.current.switchTopmost();
                }} type={'text'} icon={<PushpinOutlined style={{
                    fontSize: '12px',
                }} />}></Button>
                <Button onClick={() => {
                    Service.minimize();
                }} type='text' icon={<MinusOutlined style={{ fontSize: '12px' }} />}></Button>
                <Button onClick={() => {
                    Service.maximize();
                }} type='text' icon={<BorderOutlined style={{ fontSize: '12px' }} />}></Button>
                <Button onClick={() => {
                    Service.close();
                }} type='text' icon={<CloseOutlined style={{ fontSize: '12px' }} />}></Button>
            </Flex>
        </Flex>
        <Flex verticalCenter style={{
            padding: '0.25em 0 0 0.5em'
        }}>
            <Flex spacing={12}>
                <Button onClick={() => {
                    Service.goBack();
                }}
                    type='text'
                    icon={<ArrowLeftOutlined style={{ fontSize: '18px' }} />}></Button>
                <Button onClick={Service.refresh}
                    type='text'
                    icon={<RedoOutlined style={{ fontSize: '18px' }} />}></Button>
            </Flex>
            <Input value={self.current.formatUrl(currentUrl)} onChange={e => {
                updateCurrentUrl(e.target.value);
            }} style={{
                margin: '0 0.5em',
                borderRadius: '15px'
            }} onKeyDown={e => {
                if (e.key === 'Enter') {
                    Service.navigate(currentUrl);
                }
            }}></Input>
        </Flex>
    </Flex>
});