import { forwardRef, useEffect, useRef } from "react";
import { Flex } from "../flex";
import { Button, Dropdown, MenuProps } from "antd";
import { FolderOutlined } from "@ant-design/icons";
import { InjectStyle, useUpdate } from "../home";
import { Service } from "../service";


export interface bookmark {
    name: string,
    guid: string,
    source: string,
    type: 'url' | 'folder',
    url?: string,
    children?: bookmark[]
}

export const renderBookmark = (props: {
    bookmark: bookmark,
    onUrlClick: (url: string) => void
}) => {
    if (props.bookmark.type === 'folder') {
        const items: MenuProps['items'] = props.bookmark.children?.map((bookmark, index) => {
            return {
                key: bookmark.guid,
                label: renderBookmark({
                    bookmark: bookmark,
                    onUrlClick: props.onUrlClick
                })
            }
        }) ?? [];
        return <Dropdown menu={{ items }}>
            <Button type='text' key={props.bookmark.guid} icon={<FolderOutlined style={{ fontSize: '20px' }} />}>{props.bookmark.name}</Button>
        </Dropdown>
    }
    else {
        return <Button type='text' key={props.bookmark.guid} onClick={() => {
            if (props.bookmark.url) {
                props.onUrlClick(props.bookmark.url)
            }
        }}>{props.bookmark.name}</Button>
    }
}

export const renderBookmarkbar = (props: {
    bookmarks: bookmark[],
    onUrlClick: (url: string) => void
}) => {
    return <Flex style={{
        gap: '4px',
        overflow: 'hidden',
    }} direction='row'>
        {props.bookmarks.map((bookmark, index) => {
            return renderBookmark({
                bookmark: bookmark,
                onUrlClick: props.onUrlClick
            })
        })}
    </Flex>
}

export const AboutBlabk = forwardRef<{}, {}>((props, ref) => {
    const [bookmarks, updateBookmarks, bookmarksRef] = useUpdate<bookmark[]>([])
    useEffect(() => {
        let func = async () => {
            let msg = await Service.bookmarks();
            if (msg.success) {
                updateBookmarks(msg.data.roots.bookmark_bar.children);
            }
        }
        func();
    }, []);
    return <Flex direction='column' style={{ width: '100vw', height: '100vh' }}>
        {renderBookmarkbar({
            bookmarks: bookmarks,
            onUrlClick: (url) => {
                window.location.href = url;
            }
        })}
    </Flex>
})