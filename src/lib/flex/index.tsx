import React from "react"
import { MouseEventHandler, forwardRef, useEffect, useState } from "react"

export interface IFlexProps extends React.HTMLAttributes<HTMLDivElement> {
    id?: string,
    className?: string,
    style?: React.CSSProperties,
    children?: React.ReactNode,
    onClick?: MouseEventHandler<HTMLDivElement>,
    verticalCenter?: boolean,
    horizontalCenter?: boolean,
    direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse',
    spacing?: JSX.Element | string | number,
    spacingStart?: JSX.Element | string | number,
    spacingEnd?: JSX.Element | string | number,
}

const Flex = forwardRef<HTMLDivElement, IFlexProps>((props, ref) => {
    const renderSpacing = (spacing: JSX.Element | string | number | undefined) => {
        if (spacing === undefined) {
            return undefined;
        }
        else if (typeof spacing === 'string' || typeof spacing === 'number') {
            return <span style={{
                width: props.direction === 'row' || props.direction == undefined ? spacing : undefined,
                height: props.direction === 'column' ? spacing : undefined
            }}></span>
        }
        else return React.cloneElement(spacing, {
        })
    }
    const renderChildren = (children: React.ReactNode) => {
        if (props.spacing === undefined && props.spacingStart === undefined && props.spacingEnd === undefined) return children;
        else if (children === undefined) return undefined;
        else if (children instanceof Array) {
            let tempChildren = children as React.ReactNode[];
            return tempChildren.map((child, index) => {
                return <React.Fragment key={index}>
                    {index === 0 ? renderSpacing(props.spacingStart) : undefined}
                    {child}
                    {index < tempChildren.length - 1 ? renderSpacing(props.spacing) : undefined}
                    {index === tempChildren.length - 1 ? renderSpacing(props.spacingEnd) : undefined}
                </React.Fragment>
            })
        }
        else {
            return children;
        }
    }
    const { children, style, ...rest } = props;
    return <div
        {...rest}
        ref={ref}
        style={{
            display: 'flex',
            flexDirection: props.direction ?? 'row',
            alignItems: props.verticalCenter ? 'center' : undefined,
            justifyContent: props.horizontalCenter ? 'center' : undefined,
            ...props.style
        }}
    >
        {renderChildren(props.children)}
    </div>
})

const Vertical = forwardRef<HTMLDivElement, IFlexProps>((props, ref) => {
    return <Flex ref={ref} {...props} direction='column' />
})

const Horizontal = forwardRef<HTMLDivElement, IFlexProps>((props, ref) => {
    return <Flex ref={ref} {...props} direction='row' />
})

export { Flex, Vertical, Horizontal }